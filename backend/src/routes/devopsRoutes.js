import express from "express";
import { DockerService } from "../services/dockerService.js";
import { K8sService } from "../services/k8sService.js";
import { CIService } from "../services/ciService.js";
import { CloudService } from "../services/cloudService.js";
import { checkPermission } from "../middleware/authRbac.js";

export const createDevOpsRouter = (io) => {
  const router = express.Router();

  // --- DOCKER ---
  router.get("/containers", checkPermission("read"), async (req, res) => {
    try {
      const containers = await DockerService.getContainers();
      res.json(containers);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/containers/:id/restart", checkPermission("execute_safe"), async (req, res) => {
    try {
      const result = await DockerService.restartContainer(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- KUBERNETES ---
  router.get("/k8s/pods", checkPermission("read"), async (req, res) => {
    try {
      const pods = await K8sService.getPods();
      res.json(pods);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/k8s/deployments", checkPermission("read"), async (req, res) => {
    try {
      const deps = await K8sService.getDeployments();
      res.json(deps);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/k8s/scale", checkPermission("scale"), async (req, res) => {
    try {
      const { name, replicas } = req.body;
      const result = await K8sService.scaleDeployment(name, replicas);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/k8s/pods/:name/restart", checkPermission("execute_safe"), async (req, res) => {
    try {
      const result = await K8sService.restartPod(req.params.name);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- CI/CD PIPELINES ---
  router.get("/ci/pipelines", checkPermission("read"), async (req, res) => {
    try {
      const { mode, owner, repo } = req.query;
      const reqToken = req.headers["x-github-token"] || null;
      const result = await CIService.getPipelines(mode, reqToken, owner, repo);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/ci/trigger", checkPermission("trigger_ci"), async (req, res) => {
    try {
      const { pipelineName, mode, owner, repo, ref, workflowId } = req.body;
      const reqToken = req.headers["x-github-token"] || null;
      const newPipeline = await CIService.triggerPipeline(pipelineName, io, reqToken, {
        mode,
        owner,
        repo,
        ref,
        workflowId
      });
      res.json(newPipeline);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/ci/runs/:runId/jobs", checkPermission("read"), async (req, res) => {
    try {
      const { owner, repo } = req.query;
      const reqToken = req.headers["x-github-token"] || null;
      const jobs = await CIService.getRunJobs(req.params.runId, reqToken, owner, repo);
      res.json(jobs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/ci/jobs/:jobId/logs", checkPermission("read"), async (req, res) => {
    try {
      const { owner, repo } = req.query;
      const reqToken = req.headers["x-github-token"] || null;
      const logs = await CIService.getJobLogs(req.params.jobId, reqToken, owner, repo);
      res.type("text/plain").send(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- INFRASTRUCTURE (TERRAFORM) ---
  router.get("/infra/resources", checkPermission("read"), (req, res) => {
    res.json(CloudService.getResources());
  });

  router.post("/infra/generate-hcl", checkPermission("read"), (req, res) => {
    const { resourceType, params } = req.body;
    const hcl = CloudService.generateTerraform(resourceType, params);
    res.json({ hcl });
  });

  router.post("/infra/provision", checkPermission("execute_high_risk"), async (req, res) => {
    try {
      const { name, type } = req.body;
      const result = await CloudService.applyTerraform(name, type);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
