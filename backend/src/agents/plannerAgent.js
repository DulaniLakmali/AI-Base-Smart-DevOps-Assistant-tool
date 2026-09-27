import { LLMProvider } from "./llmProvider.js";
import { config } from "../config/env.js";
import { dbRun, dbGet } from "../database/db.js";
import { recordAudit } from "../middleware/auditLogger.js";

/**
 * Planner Agent (Chapter 4.2.2 & 4.2.3)
 * Responsibilities:
 * - Parses user intent from natural language
 * - Decomposes task into structured execution DAG
 * - Evaluates operation risk level (SAFE vs HIGH_RISK)
 * - Flags Human-in-the-Loop approval requirements
 */
export class PlannerAgent {
  static async createPlan(userQuery, user) {
    const systemPrompt = `You are a Principal DevOps Architect and Agentic Planner.
Given a user query, decompose the DevOps objective into a structured execution plan.
Evaluate the risk level:
- HIGH_RISK: Any action that deletes resources, terminates pods, stops databases, modifies production clusters, or scales to 0.
- MODERATE: Scaling resources, rollback, applying configuration changes.
- SAFE: Status checks, log analysis, linting, building local containers, test runs.

Return strictly valid JSON with this schema:
{
  "summary": "Brief summary of the plan",
  "riskLevel": "SAFE" | "MODERATE" | "HIGH_RISK",
  "approvalRequired": boolean,
  "tasks": [
    {
      "step": number,
      "action": string,
      "command": string,
      "description": string
    }
  ],
  "recommendedAction": string
}`;

    // 1. LLM Reasoning
    const { content, provider, latencyMs } = await LLMProvider.complete({
      systemPrompt,
      userPrompt: `Plan DevOps execution for: "${userQuery}"`,
      jsonMode: true
    });

    let planData;
    try {
      planData = JSON.parse(content);
    } catch {
      planData = {
        summary: `DevOps Execution Plan for: ${userQuery}`,
        riskLevel: "SAFE",
        approvalRequired: false,
        tasks: [
          { step: 1, action: "EXECUTE_COMMAND", command: "echo Running DevOps Task", description: "Standard DevOps Automation" }
        ],
        recommendedAction: "Execute plan"
      };
    }

    // Safety rule override: Check for high-risk keywords
    const lowerQuery = userQuery.toLowerCase();
    const isHighRiskKeyword = config.HIGH_RISK_KEYWORDS.some(kw => lowerQuery.includes(kw));
    if (isHighRiskKeyword) {
      planData.riskLevel = "HIGH_RISK";
      planData.approvalRequired = true;
    }

    // 2. Persist in Database (Requests table + TaskPlans table)
    const reqResult = await dbRun(
      `INSERT INTO requests (user_id, query, status) VALUES (?, ?, ?)`,
      [user.user_id, userQuery, planData.approvalRequired ? "awaiting_approval" : "processing"]
    );
    const requestId = reqResult.lastID;

    const planResult = await dbRun(
      `INSERT INTO task_plans (request_id, tasks_json, status, risk_level, approval_required, plan_summary)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        requestId,
        JSON.stringify(planData.tasks),
        planData.approvalRequired ? "awaiting_approval" : "planned",
        planData.riskLevel,
        planData.approvalRequired ? 1 : 0,
        planData.summary
      ]
    );
    const taskId = planResult.lastID;

    // 3. Audit trail
    await recordAudit({
      userId: user.user_id,
      action: "PLAN_CREATED",
      target: `TaskPlan #${taskId}`,
      details: `Planned ${planData.tasks.length} steps. Risk: ${planData.riskLevel}. Approval: ${planData.approvalRequired}`,
      riskLevel: planData.riskLevel
    });

    return {
      requestId,
      taskId,
      plan: planData,
      provider,
      latencyMs
    };
  }
}
