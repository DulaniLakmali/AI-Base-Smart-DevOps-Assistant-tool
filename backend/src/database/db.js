import sqlite3 from "sqlite3";
import { config } from "../config/env.js";

sqlite3.verbose();

export const db = new sqlite3.Database(config.DB_PATH, (err) => {
  if (err) {
    console.error("❌ Failed to connect to SQLite database:", err.message);
  } else {
    console.log(" Connected to SQLite database at:", config.DB_PATH);
  }
});

// Helper for promise-based single query
export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Helper for promise-based multi-row query
export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Helper for promise-based execution (INSERT, UPDATE, DELETE)
export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

// Initialize schema
export const initDB = async () => {
  // 1. Users Table (Normalized 3NF)
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT CHECK(role IN ('admin', 'devops_engineer', 'developer', 'viewer')) NOT NULL DEFAULT 'developer',
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Requests Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS requests (
      request_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      query TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending', 'processing', 'awaiting_approval', 'completed', 'failed', 'rejected')) DEFAULT 'pending',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );
  `);

  // 3. Task Plans Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS task_plans (
      task_id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER,
      tasks_json TEXT NOT NULL,
      status TEXT CHECK(status IN ('planned', 'awaiting_approval', 'executing', 'success', 'failed', 'rejected')) DEFAULT 'planned',
      risk_level TEXT CHECK(risk_level IN ('SAFE', 'MODERATE', 'HIGH_RISK')) DEFAULT 'SAFE',
      approval_required INTEGER DEFAULT 0,
      approved_by INTEGER,
      plan_summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES requests(request_id),
      FOREIGN KEY (approved_by) REFERENCES users(user_id)
    );
  `);

  // 4. Execution Logs Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS execution_logs (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      type TEXT CHECK(type IN ('ci_cd', 'docker', 'kubernetes', 'terraform', 'system', 'agent_reasoning')),
      command TEXT,
      content TEXT NOT NULL,
      exit_code INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES task_plans(task_id)
    );
  `);

  // 5. System Metrics Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS system_metrics (
      metric_id INTEGER PRIMARY KEY AUTOINCREMENT,
      cpu_percent REAL NOT NULL,
      memory_percent REAL NOT NULL,
      disk_percent REAL NOT NULL,
      network_in REAL DEFAULT 0,
      network_out REAL DEFAULT 0,
      active_pods INTEGER DEFAULT 3,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. Audit Records Table (Ethical / Security requirement)
  await dbRun(`
    CREATE TABLE IF NOT EXISTS audit_records (
      audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      target TEXT NOT NULL,
      details TEXT,
      risk_level TEXT DEFAULT 'SAFE',
      status TEXT DEFAULT 'SUCCESS',
      ip_address TEXT DEFAULT '127.0.0.1',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );
  `);

  console.log(" SQLite 3NF Database Schema initialized successfully.");
};
