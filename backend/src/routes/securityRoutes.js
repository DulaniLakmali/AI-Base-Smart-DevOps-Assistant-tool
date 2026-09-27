import express from "express";
import { SecurityService } from "../services/securityService.js";
import { checkPermission } from "../middleware/authRbac.js";
import { recordAudit } from "../middleware/auditLogger.js";

const SAMPLE_CONFIGS = [
  {
    id: "sample-vulnerable-docker",
    name: "Vulnerable Node.js Dockerfile (Root, :latest, Plaintext Secret)",
    type: "dockerfile",
    content: `FROM node:latest
WORKDIR /app
COPY . .
RUN npm install
ENV DB_PASSWORD=SuperSecretPass123!
EXPOSE 22
EXPOSE 3000
CMD ["npm", "start"]`
  },
  {
    id: "sample-hardened-docker",
    name: "Hardened Production Multi-Stage Dockerfile (Grade A)",
    type: "dockerfile",
    content: `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev && chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3000
CMD ["node", "dist/index.js"]`
  },
  {
    id: "sample-vulnerable-k8s",
    name: "Insecure Kubernetes Pod Manifest (Privileged, No Limits)",
    type: "kubernetes",
    content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-processor
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: payment-api
        image: payment-api:latest
        securityContext:
          privileged: true`
  }
];

export const createSecurityRouter = () => {
  const router = express.Router();

  // GET /api/security/samples - Preloaded audit scenarios
  router.get("/samples", checkPermission("read"), (req, res) => {
    res.json(SAMPLE_CONFIGS);
  });

  // POST /api/security/scan - Run SAST security scan
  router.post("/scan", checkPermission("read"), async (req, res) => {
    const { content, type } = req.body;
    if (!content) return res.status(400).json({ error: "Configuration content is required." });

    const audit = SecurityService.scanConfiguration({ content, type });

    await recordAudit({
      userId: req.currentUser?.user_id || 2,
      action: "DEVSECOPS_SCAN",
      target: `${type.toUpperCase()} Config Audit`,
      details: `Scanned ${type}. Score: ${audit.score}/100 (Grade: ${audit.grade}). Found ${audit.findingsCount} issues.`,
      riskLevel: audit.grade === "F" ? "HIGH_RISK" : "SAFE"
    });

    res.json(audit);
  });

  return router;
};
