import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const config = {
  PORT: process.env.PORT || 5000,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV || "development",
  
  // AI Provider Keys
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  DEFAULT_MODEL: process.env.DEFAULT_MODEL || "llama-3.3-70b-versatile",
  
  // Database Path
  DB_PATH: process.env.DB_PATH || path.resolve(__dirname, "../../devops_assistant.sqlite"),
  
  // GitHub Integration
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",
  GITHUB_DEFAULT_OWNER: process.env.GITHUB_DEFAULT_OWNER || "DulaniLakmali",
  GITHUB_DEFAULT_REPO: process.env.GITHUB_DEFAULT_REPO || "Smart-DevOps-Assistant",
  
  // Thresholds (from Chapter 3 constraints)
  THRESHOLDS: {
    CPU_WARNING: 85,    // CPU > 85%
    MEMORY_WARNING: 80, // Memory > 80%
    DISK_WARNING: 90
  },
  
  // High-Risk Commands requiring Human-In-The-Loop Approval
  HIGH_RISK_KEYWORDS: [
    "delete", "destroy", "stop", "terminate", "reboot", "restart", "prune",
    "drop", "truncate", "kill", "purge", "scale to 0", "production", "prod"
  ]
};
