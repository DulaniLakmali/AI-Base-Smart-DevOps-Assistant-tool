import express from "express";
import { RAGAgent } from "../agents/ragAgent.js";
import { checkPermission } from "../middleware/authRbac.js";

export const createRAGRouter = () => {
  const router = express.Router();

  // GET /api/rag/status - Vector RAG Index health & dimensional stats
  router.get("/status", checkPermission("read"), (req, res) => {
    try {
      res.json(RAGAgent.getIndexStatus());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/rag/docs - Get all indexed DevOps specifications
  router.get("/docs", checkPermission("read"), (req, res) => {
    res.json(RAGAgent.getAllDocs());
  });

  // POST /api/rag/query - Vector semantic search over documentation
  router.post("/query", checkPermission("read"), async (req, res) => {
    try {
      const { query, mode = "vector", limit = 4 } = req.body;
      if (!query) return res.status(400).json({ error: "Query is required" });

      const searchResult = await RAGAgent.searchKnowledge(query, { mode, limit: parseInt(limit, 10) || 4 });
      res.json(searchResult);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/rag/compare - Side-by-side Vector vs Keyword comparison
  router.post("/compare", checkPermission("read"), async (req, res) => {
    try {
      const { query, limit = 4 } = req.body;
      if (!query) return res.status(400).json({ error: "Query is required" });

      const comparison = await RAGAgent.compareSearch(query, parseInt(limit, 10) || 4);
      res.json(comparison);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
