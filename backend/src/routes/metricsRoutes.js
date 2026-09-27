import express from "express";
import { MetricsService } from "../services/metricsService.js";
import { PrometheusService } from "../services/prometheusService.js";
import { checkPermission } from "../middleware/authRbac.js";

export const createMetricsRouter = (io) => {
  const router = express.Router();

  // GET /api/metrics/current - Real-time telemetry snapshot + anomaly alerts
  router.get("/current", (req, res) => {
    const data = MetricsService.getCurrent();
    res.json(data);
  });

  // GET /api/metrics/history - Historical data for charts
  router.get("/history", async (req, res) => {
    try {
      const history = await MetricsService.getHistory(30);
      res.json(history);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/metrics/mode - Toggle Live OS Hardware vs Chaos Simulation
  router.post("/mode", (req, res) => {
    const { mode } = req.body;
    const result = MetricsService.setMode(mode);
    if (io) io.emit("telemetry_update", result);
    res.json(result);
  });

  // POST /api/metrics/chaos - Chaos Fault Injection (Chapter 6.4)
  router.post("/chaos", checkPermission("scale"), (req, res) => {
    const { faultType } = req.body;
    const result = MetricsService.injectChaos(faultType);

    if (io) {
      io.emit("telemetry_update", result);
      if (result.evaluation.alerts.length > 0) {
        io.emit("telemetry_alert", result.evaluation);
      }
    }

    res.json(result);
  });

  // --- PROMETHEUS TELEMETRY & PROMQL ENDPOINTS ---

  // GET /api/metrics/prometheus/status - Connectivity & configuration details
  router.get("/prometheus/status", async (req, res) => {
    try {
      const status = await PrometheusService.getStatus();
      res.json(status);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/metrics/prometheus/query - Real-time PromQL query execution
  router.post("/prometheus/query", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Missing required query string" });
      }
      const result = await PrometheusService.queryPromQL(query);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/metrics/prometheus/metrics - Prometheus raw text exposition endpoint
  router.get("/prometheus/metrics", async (req, res) => {
    try {
      res.set("Content-Type", PrometheusService.getContentType());
      res.end(await PrometheusService.getMetrics());
    } catch (err) {
      res.status(500).end(err.message);
    }
  });

  return router;
};
