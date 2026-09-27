import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { config } from "./config/env.js";
import { seedDatabase } from "./database/seed.js";
import { MetricsService } from "./services/metricsService.js";
import { PrometheusService } from "./services/prometheusService.js";

// Routes
import { createAssistantRouter } from "./routes/assistantRoutes.js";
import { createDevOpsRouter } from "./routes/devopsRoutes.js";
import { createLogRouter } from "./routes/logRoutes.js";
import { createMetricsRouter } from "./routes/metricsRoutes.js";
import { createAuditRouter } from "./routes/auditRoutes.js";
import { createAuthRouter } from "./routes/authRoutes.js";
import { createRAGRouter } from "./routes/ragRoutes.js";
import { createSecurityRouter } from "./routes/securityRoutes.js";
import { createReportRouter } from "./routes/reportRoutes.js";
import { createManifestRouter } from "./routes/manifestRoutes.js";
import { createTerminalRouter } from "./routes/terminalRoutes.js";
import { createGitHubRouter } from "./routes/githubRoutes.js";

const app = express();
const server = http.createServer(app);

// Setup Socket.io for real-time thought-streaming and telemetry
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Track HTTP requests with Prometheus Counter
app.use((req, res, next) => {
  res.on("finish", () => {
    if (req.path !== "/metrics" && !req.path.startsWith("/socket.io")) {
      PrometheusService.recordHttpRequest(req.method, req.route ? req.route.path : req.path, res.statusCode);
    }
  });
  next();
});

// Standard Prometheus /metrics Scrape Target
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", PrometheusService.getContentType());
    res.end(await PrometheusService.getMetrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "HEALTHY",
    service: "Smart DevOps Assistant Core API",
    version: "1.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Register API Routes
app.use("/api", createAssistantRouter(io));
app.use("/api/devops", createDevOpsRouter(io));
app.use("/api/logs", createLogRouter());
app.use("/api/metrics", createMetricsRouter(io));
app.use("/api/audit", createAuditRouter());
app.use("/api/auth", createAuthRouter());
app.use("/api/rag", createRAGRouter());
app.use("/api/security", createSecurityRouter());
app.use("/api/report", createReportRouter());
app.use("/api/manifests", createManifestRouter());
app.use("/api/terminal", createTerminalRouter());
app.use("/api/github", createGitHubRouter());

// Socket.io Connection Handler
io.on("connection", (socket) => {
  console.log(`🔌 Client connected to DevOps Event Stream [ID: ${socket.id}]`);

  // Send immediate initial state
  socket.emit("telemetry_update", MetricsService.getCurrent());

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected [ID: ${socket.id}]`);
  });
});

// Periodic Telemetry Broadcast (Every 3 seconds)
setInterval(async () => {
  try {
    const data = await MetricsService.recordSample();
    io.emit("telemetry_stream", data);
  } catch (err) {
    // Ignore transient DB write errors during shutdown
  }
}, 3000);

// Initialize DB and Start Server
const startServer = async () => {
  try {
    await seedDatabase();
    server.listen(config.PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Smart DevOps Assistant API running on port ${config.PORT}`);
      console.log(`📡 WebSocket server initialized and streaming events`);
      console.log(`⚡ API Health: http://localhost:${config.PORT}/api/health`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
