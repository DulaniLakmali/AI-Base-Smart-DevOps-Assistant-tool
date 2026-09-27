import express from "express";
import { LogAnalyzerAgent } from "../agents/logAnalyzerAgent.js";
import { ExecutorAgent } from "../agents/executorAgent.js";
import { dbRun } from "../database/db.js";
import { checkPermission } from "../middleware/authRbac.js";
import { recordAudit } from "../middleware/auditLogger.js";

const SAMPLE_LOGS = [
  {
    id: "sample-api-500",
    title: "HTTP 500 Internal Server Error (API Log)",
    type: "api_log",
    source: "Express API /api/fetch-data",
    content: `2026-09-19T18:42:10.124Z [ERROR] GET /api/fetch-data 500 - 14ms
TypeError: Cannot read properties of undefined (reading 'auth_token')
    at verifySession (/app/src/middleware/auth.js:24:32)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/app/node_modules/express/lib/router/route.js:144:13)
    at Route.dispatch (/app/node_modules/express/lib/router/route.js:114:3)
    at /app/node_modules/express/lib/router/index.js:284:15`
  },
  {
    id: "sample-db-constraint",
    title: "Database Constraint Violation (DB Log)",
    type: "db_log",
    source: "PostgreSQL 16 Engine",
    content: `2026-09-19 18:40:02.812 UTC [41829] ERROR: insert or update on table "order_items" violates foreign key constraint "fk_order_items_product"
2026-09-19 18:40:02.812 UTC [41829] DETAIL: Key (product_id)=(prod_998124) is not present in table "products".
2026-09-19 18:40:02.812 UTC [41829] STATEMENT: INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ('ord_771', 'prod_998124', 2, 49.99);`
  },
  {
    id: "sample-k8s-crash",
    title: "Kubernetes Pod CrashLoopBackOff",
    type: "pod_log",
    source: "k8s-pod: auth-service-7f1c9d-8x9y",
    content: `2026-09-19T18:45:00.000Z Starting authentication service container...
2026-09-19T18:45:01.210Z [FATAL] Environment variable 'JWT_SIGNING_SECRET' is empty or undefined.
2026-09-19T18:45:01.215Z System.ApplicationException: Critical startup parameter missing. Process exiting with code 1.
State: Waiting: CrashLoopBackOff (Back-off 5m0s restarting failed container)`
  },
  {
    id: "sample-ci-fail",
    title: "CI/CD Deployment Build Failure (Deploy Log)",
    type: "deploy_log",
    source: "GitHub Actions Runner #14",
    content: `Step 4/6 : RUN npm run build
> microservice-client@2.0.0 build
> vite build
vite v5.4.2 building for production...
transforming...
✓ 482 modules transformed.
x Build failed with errors.
error during build:
RollupError: Could not resolve "../components/UserProfileCard" from "src/pages/Dashboard.tsx"
    at error (file:///runner/work/node_modules/rollup/dist/es/rollup.js:1858:30)
Error: Process completed with exit code 1.`
  }
];

export const createLogRouter = () => {
  const router = express.Router();

  // GET /api/logs/samples - Get pre-configured incident samples
  router.get("/samples", (req, res) => {
    res.json(SAMPLE_LOGS);
  });

  // POST /api/logs/analyze - Run AI Root Cause Analysis on provided log
  router.post("/analyze", checkPermission("read"), async (req, res) => {
    try {
      const { logContent, logType, context } = req.body;
      if (!logContent) {
        return res.status(400).json({ error: "Log content cannot be empty." });
      }

      const result = await LogAnalyzerAgent.analyzeLog({
        logContent,
        logType,
        context
      });

      await recordAudit({
        userId: req.currentUser?.user_id || 1,
        action: "LOG_ANALYZED",
        target: `Log RCA (${result.analysis.category})`,
        details: `Diagnosis: ${result.analysis.rootCause?.slice(0, 100)}...`,
        riskLevel: "SAFE"
      });

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/logs/remediate - Autonomous SRE self-healing execution
  router.post("/remediate", checkPermission("write"), async (req, res) => {
    try {
      const { incidentTitle, remediationCommand, category } = req.body;
      if (!remediationCommand) {
        return res.status(400).json({ error: "Remediation command cannot be empty." });
      }

      const userId = req.currentUser?.user_id || 2;

      // 1. Create tracking request and task plan in 3NF SQLite
      const reqRes = await dbRun(
        `INSERT INTO requests (user_id, query, status) VALUES (?, ?, 'completed')`,
        [userId, `Autonomous SRE Remediation: ${incidentTitle || category || remediationCommand}`]
      );
      const planRes = await dbRun(
        `INSERT INTO task_plans (request_id, tasks_json, status, risk_level, approval_required, plan_summary)
         VALUES (?, ?, 'success', 'SAFE', 0, ?)`,
        [
          reqRes.lastID,
          JSON.stringify([{ step: 1, action: "AUTO_REMEDIATION", command: remediationCommand, description: `Auto-fix for ${incidentTitle || category}` }]),
          `Autonomous self-healing remediation: ${incidentTitle || category}`
        ]
      );
      const taskId = planRes.lastID;

      // 2. Dispatch command through ExecutorAgent
      const execResult = await ExecutorAgent.dispatchCommand({
        command: remediationCommand,
        action: "AUTO_REMEDIATION"
      });

      // 3. Persist to execution_logs
      const cmdLower = remediationCommand.toLowerCase();
      const logType = cmdLower.includes("kubectl") ? "kubernetes" : cmdLower.includes("docker") ? "docker" : "system";
      await dbRun(
        `INSERT INTO execution_logs (task_id, type, command, content, exit_code)
         VALUES (?, ?, ?, ?, ?)`,
        [taskId, logType, remediationCommand, execResult.log, execResult.exitCode]
      );

      // 4. Log in Audit Ledger
      await recordAudit({
        userId,
        action: "SRE_AUTO_REMEDIATION",
        target: incidentTitle || category || remediationCommand,
        details: `Autonomous fix executed: [${remediationCommand}]. Status: RESOLVED.`,
        riskLevel: "SAFE",
        status: "SUCCESS"
      });

      res.json({
        success: true,
        status: "RESOLVED",
        taskId,
        command: remediationCommand,
        log: execResult.log,
        exitCode: execResult.exitCode,
        resolvedAt: new Date().toISOString(),
        message: `Incident successfully self-healed and marked as RESOLVED.`
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
