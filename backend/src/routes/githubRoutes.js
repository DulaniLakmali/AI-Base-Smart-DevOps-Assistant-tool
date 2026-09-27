import express from "express";
import { GitHubService } from "../services/githubService.js";
import { checkPermission } from "../middleware/authRbac.js";
import { recordAudit } from "../middleware/auditLogger.js";

export const createGitHubRouter = () => {
  const router = express.Router();

  // POST /api/github/token - Configure token
  router.post("/token", checkPermission("write"), (req, res) => {
    const { token } = req.body;
    GitHubService.setToken(token);
    res.json({ success: true, message: token ? "GitHub token configured." : "Token cleared." });
  });

  // GET /api/github/repos - List repositories
  router.get("/repos", checkPermission("read"), async (req, res) => {
    try {
      const tokenHeader = req.headers["x-github-token"];
      const data = await GitHubService.getRepositories(tokenHeader);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/github/repos/:owner/:repo/commits - Fetch commits
  router.get("/repos/:owner/:repo/commits", checkPermission("read"), async (req, res) => {
    try {
      const { owner, repo } = req.params;
      const tokenHeader = req.headers["x-github-token"];
      const commits = await GitHubService.getCommits(owner, repo, tokenHeader);
      res.json(commits);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/github/repos/:owner/:repo/workflows - Fetch workflows
  router.get("/repos/:owner/:repo/workflows", checkPermission("read"), async (req, res) => {
    try {
      const { owner, repo } = req.params;
      const tokenHeader = req.headers["x-github-token"];
      const workflows = await GitHubService.getWorkflows(owner, repo, tokenHeader);
      res.json(workflows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/github/repos/:owner/:repo/dispatch - Trigger workflow dispatch
  router.post("/repos/:owner/:repo/dispatch", checkPermission("trigger_ci"), async (req, res) => {
    try {
      const { owner, repo } = req.params;
      const { workflowId, ref } = req.body;
      const tokenHeader = req.headers["x-github-token"];
      const result = await GitHubService.triggerWorkflowDispatch(owner, repo, workflowId, ref, tokenHeader);

      await recordAudit({
        userId: req.currentUser?.user_id || 2,
        action: "GITHUB_ACTIONS_DISPATCH",
        target: `${owner}/${repo} [Workflow #${workflowId}]`,
        details: result.message,
        riskLevel: "MODERATE"
      });

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/github/repos/:owner/:repo/runs - Fetch workflow runs
  router.get("/repos/:owner/:repo/runs", checkPermission("read"), async (req, res) => {
    try {
      const { owner, repo } = req.params;
      const tokenHeader = req.headers["x-github-token"];
      const runs = await GitHubService.getWorkflowRuns(owner, repo, tokenHeader);
      res.json(runs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/github/repos/:owner/:repo/runs/:runId/jobs - Fetch jobs for a run
  router.get("/repos/:owner/:repo/runs/:runId/jobs", checkPermission("read"), async (req, res) => {
    try {
      const { owner, repo, runId } = req.params;
      const tokenHeader = req.headers["x-github-token"];
      const jobs = await GitHubService.getRunJobs(owner, repo, runId, tokenHeader);
      res.json(jobs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/github/repos/:owner/:repo/jobs/:jobId/logs - Fetch raw runner logs
  router.get("/repos/:owner/:repo/jobs/:jobId/logs", checkPermission("read"), async (req, res) => {
    try {
      const { owner, repo, jobId } = req.params;
      const tokenHeader = req.headers["x-github-token"];
      const logs = await GitHubService.getJobLogs(owner, repo, jobId, tokenHeader);
      res.type("text/plain").send(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
