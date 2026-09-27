import { PlannerAgent } from "./plannerAgent.js";
import { ExecutorAgent } from "./executorAgent.js";
import { LogAnalyzerAgent } from "./logAnalyzerAgent.js";
import { MonitoringAgent } from "./monitoringAgent.js";
import { dbGet, dbRun } from "../database/db.js";
import { recordAudit } from "../middleware/auditLogger.js";

/**
 * Agent Coordinator (Chapter 4.2.2 & Chapter 5.1.3)
 * Orchestrates multi-agent collaboration:
 * Planner -> Safety Guard -> (HITL Approval Gate) -> Executor -> Critic/Analyzer
 */
export class AgentCoordinator {
  static async handleUserQuery({ query, user, io = null }) {
    if (io) {
      io.emit("agent_thought", {
        step: "UNDERSTANDING_INTENT",
        message: `Analyzing user objective: "${query}"...`,
        timestamp: new Date().toISOString()
      });
    }

    // 1. Planner Agent creates DAG and evaluates Risk Level
    const { requestId, taskId, plan, provider, latencyMs } = await PlannerAgent.createPlan(query, user);

    if (io) {
      io.emit("agent_thought", {
        step: "PLAN_FORMULATED",
        message: `Task decomposed into ${plan.tasks.length} steps. Assessed Risk Level: ${plan.riskLevel}.`,
        plan,
        provider,
        latencyMs,
        timestamp: new Date().toISOString()
      });
    }

    // 2. Human-In-The-Loop Approval Check
    if (plan.approvalRequired) {
      if (io) {
        io.emit("agent_approval_required", {
          requestId,
          taskId,
          plan,
          message: `Operation classified as ${plan.riskLevel}. Human-in-the-loop authorization required.`
        });
      }

      return {
        status: "AWAITING_APPROVAL",
        requestId,
        taskId,
        riskLevel: plan.riskLevel,
        approvalRequired: true,
        plan,
        message: "Human authorization required before execution.",
        provider
      };
    }

    // 3. If SAFE or pre-approved, automatically execute
    if (io) {
      io.emit("agent_thought", {
        step: "DISPATCHING_EXECUTOR",
        message: "Plan is verified SAFE. Dispatching Executor Agent to execute tool actions...",
        timestamp: new Date().toISOString()
      });
    }

    const execResult = await ExecutorAgent.executePlan(taskId, user, io);

    return {
      status: "COMPLETED",
      requestId,
      taskId,
      riskLevel: plan.riskLevel,
      approvalRequired: false,
      plan,
      execution: execResult,
      provider
    };
  }

  static async approveTask({ taskId, user, io = null }) {
    const plan = await dbGet("SELECT * FROM task_plans WHERE task_id = ?", [taskId]);
    if (!plan) throw new Error("Task plan not found");

    // Update approval status
    await dbRun(
      "UPDATE task_plans SET status = 'approved', approved_by = ? WHERE task_id = ?",
      [user.user_id, taskId]
    );

    await recordAudit({
      userId: user.user_id,
      action: "PLAN_APPROVED",
      target: `TaskPlan #${taskId}`,
      details: `User ${user.name} (${user.role}) approved execution of Task #${taskId}`,
      riskLevel: plan.risk_level,
      status: "APPROVED"
    });

    if (io) {
      io.emit("agent_plan_approved", { taskId, approvedBy: user.name });
    }

    // Trigger Execution
    const execResult = await ExecutorAgent.executePlan(taskId, user, io);

    return {
      taskId,
      status: "COMPLETED",
      execution: execResult
    };
  }

  static async rejectTask({ taskId, user, reason = "Rejected by user", io = null }) {
    await dbRun(
      "UPDATE task_plans SET status = 'rejected', approved_by = ? WHERE task_id = ?",
      [user.user_id, taskId]
    );

    await recordAudit({
      userId: user.user_id,
      action: "PLAN_REJECTED",
      target: `TaskPlan #${taskId}`,
      details: `User ${user.name} rejected Task #${taskId}. Reason: ${reason}`,
      riskLevel: "HIGH_RISK",
      status: "REJECTED"
    });

    if (io) {
      io.emit("agent_plan_rejected", { taskId, rejectedBy: user.name, reason });
    }

    return { taskId, status: "REJECTED", reason };
  }
}
