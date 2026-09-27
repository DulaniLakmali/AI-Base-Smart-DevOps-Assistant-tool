import express from "express";
import { dbAll } from "../database/db.js";
import { checkPermission } from "../middleware/authRbac.js";

export const createAuditRouter = () => {
  const router = express.Router();

  // GET /api/audit - Fetch recent audit log records
  router.get("/", checkPermission("read"), async (req, res) => {
    try {
      const records = await dbAll(
        `SELECT a.*, u.name as user_name, u.role as user_role
         FROM audit_records a
         LEFT JOIN users u ON a.user_id = u.user_id
         ORDER BY a.audit_id DESC LIMIT 50`
      );
      res.json(records);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
