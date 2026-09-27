import express from "express";
import { ManifestService } from "../services/manifestService.js";
import { checkPermission } from "../middleware/authRbac.js";

export const createManifestRouter = () => {
  const router = express.Router();

  // POST /api/manifests/generate - Generate Dockerfile, K8s Deployment, Service, CI
  router.post("/generate", checkPermission("read"), (req, res) => {
    const { stackName, port, appName } = req.body;
    const bundle = ManifestService.generateStack({ stackName, port, appName });
    res.json(bundle);
  });

  return router;
};
