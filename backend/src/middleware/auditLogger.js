import { dbRun } from "../database/db.js";
import { redactSecrets } from "./secretRedactor.js";

/**
 * Immutable Audit Logger
 * Logs system actions, user decisions, and approvals for compliance and traceability
 * (Required by Chapter 2.8, Chapter 3.6, Chapter 4.4)
 */
export const recordAudit = async ({
  userId = 1,
  action,
  target,
  details = "",
  riskLevel = "SAFE",
  status = "SUCCESS",
  ipAddress = "127.0.0.1"
}) => {
  try {
    const sanitizedDetails = redactSecrets(details);
    const result = await dbRun(
      `INSERT INTO audit_records (user_id, action, target, details, risk_level, status, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, action, target, sanitizedDetails, riskLevel, status, ipAddress]
    );
    return result;
  } catch (err) {
    console.error("❌ Failed to write audit record:", err.message);
  }
};
