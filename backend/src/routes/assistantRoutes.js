import express from "express";
import { AgentCoordinator } from "../agents/agentCoordinator.js";
import { dbAll, dbGet } from "../database/db.js";
import { checkPermission } from "../middleware/authRbac.js";

export const createAssistantRouter = (io) => {
  const router = express.Router();

  // POST /api/ask - Natural Language Query to Smart Assistant
  router.post("/ask", checkPermission("read"), async (req, res) => {
    try {
      const { question } = req.body;
      if (!question || !question.trim()) {
        return res.status(400).json({ error: "Prompt/question cannot be empty." });
      }

      const result = await AgentCoordinator.handleUserQuery({
        query: question.trim(),
        user: req.currentUser,
        io
      });

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/plans - List recent task plans
  router.get("/plans", checkPermission("read"), async (req, res) => {
    try {
      const plans = await dbAll(
        `SELECT tp.*, r.query, u.name as requested_by, u2.name as approved_by_name
         FROM task_plans tp
         JOIN requests r ON tp.request_id = r.request_id
         LEFT JOIN users u ON r.user_id = u.user_id
         LEFT JOIN users u2 ON tp.approved_by = u2.user_id
         ORDER BY tp.task_id DESC LIMIT 15`
      );
      res.json(plans);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/plans/:id/approve - Human-in-the-loop Approval Gate
  router.post("/plans/:id/approve", checkPermission("approve"), async (req, res) => {
    try {
      const taskId = parseInt(req.params.id, 10);
      const result = await AgentCoordinator.approveTask({
        taskId,
        user: req.currentUser,
        io
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/plans/:id/reject - Human-in-the-loop Rejection
  router.post("/plans/:id/reject", checkPermission("approve"), async (req, res) => {
    try {
      const taskId = parseInt(req.params.id, 10);
      const { reason } = req.body;
      const result = await AgentCoordinator.rejectTask({
        taskId,
        user: req.currentUser,
        reason,
        io
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
