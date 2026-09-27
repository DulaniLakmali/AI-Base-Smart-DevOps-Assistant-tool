import { dbGet } from "../database/db.js";

/**
 * Role-Based Access Control (RBAC) Matrix
 * Required by Proposal Ethics & Chapter 3.6
 *
 * Roles:
 * - admin: All capabilities (Read, Write, Execute, Approve, Delete, User Management)
 * - devops_engineer: Read, Write, Execute Safe/High-Risk, Approve, Scale, Rollback
 * - developer: Read, Trigger CI/CD, Execute Safe actions, Analyze logs
 * - viewer: Read-only access to dashboards, logs, and metrics
 */

export const ROLE_PERMISSIONS = {
  admin: ["read", "write", "trigger_ci", "execute_safe", "execute_high_risk", "approve", "delete", "manage_users"],
  devops_engineer: ["read", "write", "trigger_ci", "execute_safe", "execute_high_risk", "approve", "scale", "rollback"],
  developer: ["read", "trigger_ci", "execute_safe", "analyze_logs"],
  viewer: ["read"]
};

export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.headers["x-user-id"] || 2; // Default to Dulani (DevOps Engineer)
      const user = await dbGet("SELECT * FROM users WHERE user_id = ?", [userId]);

      if (!user) {
        return res.status(401).json({ error: "Unauthorized: User not found" });
      }

      req.currentUser = user;

      const userPermissions = ROLE_PERMISSIONS[user.role] || [];
      if (!userPermissions.includes(requiredPermission)) {
        return res.status(403).json({
          error: `Forbidden: Role '${user.role}' lacks '${requiredPermission}' permission.`,
          requiredPermission,
          userRole: user.role
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({ error: "RBAC check error: " + err.message });
    }
  };
};
