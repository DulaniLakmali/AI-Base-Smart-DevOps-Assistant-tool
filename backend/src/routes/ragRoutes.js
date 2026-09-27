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

  // POST /api/rag/documents - Ingest and embed new runbook into Persistent Vector Database
  router.post("/documents", checkPermission("write"), async (req, res) => {
    try {
      const { title, category, summary, content, tags, snippet, docUrl } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required to index document" });
      }

      const indexed = await RAGAgent.addDoc({
        title,
        category: category || "DevOps Runbook",
        summary: summary || title,
        content,
        tags: Array.isArray(tags) ? tags : (tags ? tags.split(",").map((t) => t.trim()) : []),
        snippet: snippet || "",
        docUrl: docUrl || ""
      });

      res.status(201).json({
        message: "Document successfully embedded and persisted to Vector Database",
        document: indexed
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/rag/documents/:id - Remove document from Vector Database and embeddings
  router.delete("/documents/:id", checkPermission("write"), async (req, res) => {
    try {
      const { id } = req.params;
      const result = await RAGAgent.deleteDoc(id);
      res.json({
        message: `Document ${id} successfully deleted from Vector Database`,
        ...result
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
