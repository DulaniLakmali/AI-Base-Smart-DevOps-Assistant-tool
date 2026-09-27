import express from "express";
import { exec } from "child_process";
import { promisify } from "util";
import { checkPermission } from "../middleware/authRbac.js";
import { redactSecrets } from "../middleware/secretRedactor.js";
import { recordAudit } from "../middleware/auditLogger.js";

const execAsync = promisify(exec);

// Allowed safe base commands
const ALLOWED_COMMANDS = [
  "docker",
  "kubectl",
  "git",
  "node",
  "npm",
  "curl",
  "echo",
  "hostname",
  "uptime"
];

export const createTerminalRouter = () => {
  const router = express.Router();

  // POST /api/terminal/exec - Execute safe DevOps CLI command
  router.post("/exec", checkPermission("execute_safe"), async (req, res) => {
    const { command } = req.body;
    if (!command || !command.trim()) {
      return res.status(400).json({ error: "Command cannot be empty" });
    }

    const trimmed = command.trim();
    const baseCmd = trimmed.split(" ")[0].toLowerCase();

    if (!ALLOWED_COMMANDS.includes(baseCmd)) {
      return res.status(403).json({
        error: `Command '${baseCmd}' is restricted for security. Allowed tools: ${ALLOWED_COMMANDS.join(", ")}`
      });
    }

    try {
      const { stdout, stderr } = await execAsync(trimmed, { timeout: 8000 });
      const output = stdout || stderr || "Command completed with no output.";
      const sanitized = redactSecrets(output);

      await recordAudit({
        userId: req.currentUser?.user_id || 2,
        action: "TERMINAL_EXEC",
        target: `CLI [${trimmed.slice(0, 40)}]`,
        details: sanitized.slice(0, 200),
        riskLevel: "SAFE"
      });

      res.json({
        command: trimmed,
        output: sanitized,
        exitCode: 0
      });
    } catch (err) {
      const sanitizedErr = redactSecrets(err.stdout || err.stderr || err.message);
      res.json({
        command: trimmed,
        output: sanitizedErr,
        exitCode: err.code || 1
      });
    }
  });

  return router;
};
