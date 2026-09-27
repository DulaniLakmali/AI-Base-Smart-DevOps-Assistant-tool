import express from "express";
import { dbAll, dbGet } from "../database/db.js";

export const createAuthRouter = () => {
  const router = express.Router();

  // GET /api/auth/users - List available team members
  router.get("/users", async (req, res) => {
    try {
      const users = await dbAll("SELECT user_id, name, email, role, avatar FROM users");
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/auth/user/:id - Get specific user profile
  router.get("/user/:id", async (req, res) => {
    try {
      const user = await dbGet("SELECT user_id, name, email, role, avatar FROM users WHERE user_id = ?", [req.params.id]);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
