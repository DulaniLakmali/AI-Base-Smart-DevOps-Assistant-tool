import { dbRun, dbGet, initDB } from "./db.js";

export const seedDatabase = async () => {
  await initDB();

  // Check if users already exist
  const existingUser = await dbGet("SELECT COUNT(*) as count FROM users");
  if (existingUser && existingUser.count > 0) {
    console.log("ℹ️ Database already seeded. Skipping initial seed.");
    return;
  }

  console.log("🌱 Seeding database with initial users, roles, and sample data...");

  // 1. Seed Users
  await dbRun(`
    INSERT INTO users (name, email, role, avatar) VALUES
    ('Isuru Samarappulige', 'isuru.admin@horizoncampus.edu.lk', 'admin', 'https://api.dicebear.com/7.x/bottts/svg?seed=admin'),
    ('Dulani Maduwanthi', 'dulani.devops@horizoncampus.edu.lk', 'devops_engineer', 'https://api.dicebear.com/7.x/bottts/svg?seed=dulani'),
    ('Weerasooriya T.V.M.', 'weerasooriya.dev@horizoncampus.edu.lk', 'developer', 'https://api.dicebear.com/7.x/bottts/svg?seed=weera'),
    ('Dayananda I.A.', 'dayananda.view@horizoncampus.edu.lk', 'viewer', 'https://api.dicebear.com/7.x/bottts/svg?seed=dayananda')
  `);

  // 2. Seed Baseline System Metrics
  const now = Date.now();
  for (let i = 10; i >= 0; i--) {
    const time = new Date(now - i * 30000).toISOString();
    const cpu = 42 + Math.floor(Math.random() * 20);
    const mem = 55 + Math.floor(Math.random() * 15);
    const disk = 48 + Math.floor(Math.random() * 5);
    await dbRun(
      `INSERT INTO system_metrics (cpu_percent, memory_percent, disk_percent, network_in, network_out, active_pods, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cpu, mem, disk, (Math.random() * 12).toFixed(2), (Math.random() * 8).toFixed(2), 4, time]
    );
  }

  // 3. Seed Initial Audit Record
  await dbRun(`
    INSERT INTO audit_records (user_id, action, target, details, risk_level, status)
    VALUES (1, 'SYSTEM_INIT', 'SQLite Database', 'Initialized system schema and role-based policies', 'SAFE', 'SUCCESS')
  `);

  console.log("✅ Database successfully seeded with 4 users and baseline telemetry.");
};

// If run directly: node src/database/seed.js
if (process.argv[1]?.endsWith("seed.js")) {
  seedDatabase().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
