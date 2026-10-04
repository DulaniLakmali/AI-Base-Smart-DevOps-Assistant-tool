import axios from "axios";
import { config } from "../config/env.js";

export class LLMProvider {
  /**
   * Main LLM completion method.
   */
  static async complete({
    systemPrompt,
    userPrompt,
    jsonMode = false
  }) {
    // ============================================================
    // 1. GROQ
    // ============================================================
    if (config.GROQ_API_KEY) {
      try {
        const startedAt = performance.now();

        const res = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: config.DEFAULT_MODEL,
            messages: [
              {
                role: "system",
                content: systemPrompt
              },
              {
                role: "user",
                content: userPrompt
              }
            ],

            response_format: jsonMode
              ? { type: "json_object" }
              : undefined,

            temperature: 0.2
          },
          {
            headers: {
              Authorization: `Bearer ${config.GROQ_API_KEY}`,
              "Content-Type": "application/json"
            },

            timeout: 10000
          }
        );

        const latencyMs = Number(
          (performance.now() - startedAt).toFixed(2)
        );

        const model =
          res.data?.model ||
          config.DEFAULT_MODEL ||
          "unknown";

        const content =
          res.data?.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error(
            "Groq returned an empty or invalid completion."
          );
        }

        console.log(
          `🤖 Groq response received | Model: ${model} | ${latencyMs} ms`
        );

        return {
          content,
          provider: `Groq (${model})`,
          model,
          latencyMs
        };
      } catch (err) {
        console.error("❌ Groq API error:", {
          status: err.response?.status,
          message: err.message,
          data: err.response?.data
        });

        console.warn(
          "⚠️ Groq API unavailable. Trying next available provider..."
        );
      }
    }

    // ============================================================
    // 2. OPENAI
    // ============================================================
    if (config.OPENAI_API_KEY) {
      try {
        const startedAt = performance.now();

        const openAIModel = "gpt-4o-mini";

        const res = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: openAIModel,

            messages: [
              {
                role: "system",
                content: systemPrompt
              },
              {
                role: "user",
                content: userPrompt
              }
            ],

            response_format: jsonMode
              ? { type: "json_object" }
              : undefined,

            temperature: 0.2
          },
          {
            headers: {
              Authorization: `Bearer ${config.OPENAI_API_KEY}`,
              "Content-Type": "application/json"
            },

            timeout: 10000
          }
        );

        const latencyMs = Number(
          (performance.now() - startedAt).toFixed(2)
        );

        const model =
          res.data?.model ||
          openAIModel;

        const content =
          res.data?.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error(
            "OpenAI returned an empty or invalid completion."
          );
        }

        console.log(
          `🤖 OpenAI response received | Model: ${model} | ${latencyMs} ms`
        );

        return {
          content,
          provider: `OpenAI (${model})`,
          model,
          latencyMs
        };
      } catch (err) {
        console.error("❌ OpenAI API error:", {
          status: err.response?.status,
          message: err.message,
          data: err.response?.data
        });

        console.warn(
          "⚠️ OpenAI API unavailable. Switching to Offline Agentic Core..."
        );
      }
    }

    // ============================================================
    // 3. OFFLINE DEVOPS REASONING ENGINE
    // ============================================================
    const startedAt = performance.now();

    const content = this.offlineReasoning(
      userPrompt,
      jsonMode
    );

    const latencyMs = Number(
      (performance.now() - startedAt).toFixed(2)
    );

    console.warn(
      `🧠 Using Offline Agentic Core | ${latencyMs} ms`
    );

    return {
      content,
      provider:
        "Offline Agentic Core (Research Sandbox)",
      model: "offline-devops-rule-engine",
      latencyMs
    };
  }

  static extractUserObjective(userPrompt) {
    const text = String(userPrompt || "").trim();

    if (!text) {
      return "";
    }

    const objectiveMatch = text.match(
      /DevOps Objective:\s*"([^"]+)"/i
    );

    if (objectiveMatch?.[1]) {
      return objectiveMatch[1].trim();
    }

    return text;
  }

  /**
   * Offline DevOps Knowledge & Reasoning Engine.
   *
   * Used only when remote LLM providers are unavailable.
   */
  static offlineReasoning(userPrompt, jsonMode) {
    const objective =
      this.extractUserObjective(userPrompt);

    const p = objective.toLowerCase();

    // ============================================================
    // INTENT DETECTION
    // ============================================================

    const isPlanningRequest =
      /\bplan\b/i.test(objective) ||
      /\bdeploy\b/i.test(objective) ||
      /\bdeployment\b/i.test(objective) ||
      /\bscale\b/i.test(objective) ||
      /\brollback\b/i.test(objective) ||
      /\bci\b/i.test(objective) ||
      /\bpipeline\b/i.test(objective) ||
      /\bdocker\b/i.test(objective) ||
      /\bk8s\b/i.test(objective) ||
      /\bkubernetes\b/i.test(objective) ||
      /\bterraform\b/i.test(objective) ||
      /\bgithub\b/i.test(objective) ||
      /\bworkflow\b/i.test(objective) ||
      /\bdispatch\b/i.test(objective);

    // ============================================================
    // PLAN GENERATION
    // ============================================================

    if (isPlanningRequest) {
      let riskLevel = "SAFE";
      let approvalRequired = false;
      let tasks = [];
      let summary = "";

      // ----------------------------------------------------------
      // Risk classification
      // ----------------------------------------------------------

      const isProduction =
        /\bprod\b/i.test(objective) ||
        /\bproduction\b/i.test(objective);

      const containsHighRiskOperation =
        /\b(delete|destroy|stop|terminate|drop|truncate|kill|purge)\b/i.test(
          objective
        );

      const scaleToZero =
        /\bscale\s+(?:\S+\s+)*to\s+0\b/i.test(
          objective
        ) ||
        /--replicas[=\s]+0\b/i.test(objective);

      if (
        containsHighRiskOperation ||
        scaleToZero ||
        isProduction
      ) {
        riskLevel = "HIGH_RISK";
        approvalRequired = true;
      } else if (
        /\bscale\b/i.test(objective) ||
        /\bdeploy\b/i.test(objective) ||
        /\bdeployment\b/i.test(objective) ||
        /\brollback\b/i.test(objective)
      ) {
        riskLevel = "MODERATE";

        // Production actions always require approval.
        approvalRequired = isProduction;
      }

      // ==========================================================
      // FRONTEND → KUBERNETES DEPLOYMENT
      // ==========================================================

      if (
        p.includes("frontend to kubernetes") ||
        (
          p.includes("deploy") &&
          p.includes("frontend")
        )
      ) {
        summary =
          "Deploy frontend microservice container to Kubernetes cluster with 3 replicas and NodePort service.";

        tasks = [
          {
            step: 1,
            action: "DOCKER_BUILD",
            command:
              "docker build -t frontend:v2.1 ./frontend",
            description:
              "Build production Vite React Docker image"
          },
          {
            step: 2,
            action: "K8S_VALIDATE",
            command:
              "kubectl apply -f k8s/frontend-deployment.yaml --dry-run=client",
            description:
              "Validate Kubernetes manifest schema"
          },
          {
            step: 3,
            action: "K8S_APPLY",
            command:
              "kubectl apply -f k8s/frontend-deployment.yaml",
            description:
              "Deploy deployment and service to Kubernetes namespace"
          },
          {
            step: 4,
            action: "ROLLOUT_STATUS",
            command:
              "kubectl rollout status deployment/frontend-app",
            description:
              "Verify rolling update completion"
          }
        ];
      }

      // ==========================================================
      // GITHUB ACTIONS / CI PIPELINE
      // ==========================================================

      else if (
        p.includes("run ci") ||
        p.includes("trigger pipeline") ||
        p.includes("ci pipeline") ||
        p.includes("github") ||
        p.includes("dispatch") ||
        p.includes("workflow")
      ) {
        const workflow =
          config.GITHUB_WORKFLOW_ID ||
          "ci.yml";

        const branch =
          config.GITHUB_DEFAULT_BRANCH ||
          "main";

        summary =
          "Dispatch GitHub Actions Continuous Integration pipeline and monitor the workflow execution.";

        tasks = [
          {
            step: 1,
            action: "GITHUB_VERIFY_REPO",
            command:
              "git remote -v && git branch --show-current",
            description:
              "Verify connected repository and target branch"
          },
          {
            step: 2,
            action: "GITHUB_ACTIONS_DISPATCH",
            command:
              `gh workflow run ${workflow} --ref ${branch}`,
            description:
              `Dispatch GitHub Actions workflow ${workflow} on branch ${branch}`
          },
          {
            step: 3,
            action: "POLL_RUN_STATUS",
            command:
              `gh run list --workflow=${workflow} --limit 1`,
            description:
              "Monitor latest workflow execution status"
          }
        ];
      }

      // ==========================================================
      // KUBERNETES SCALING
      // ==========================================================

      else if (p.includes("scale")) {
        const targetReplicas =
          (
            p.match(
              /\b(?:to|replicas?)\s*[=:]?\s*(\d+)\b/
            ) || []
          )[1] || "4";

        summary =
          `Scale payment-service deployment to ${targetReplicas} replicas to handle traffic demand.`;

        tasks = [
          {
            step: 1,
            action: "K8S_CHECK_METRICS",
            command:
              "kubectl top pods -l app=payment-service",
            description:
              "Inspect current CPU and memory consumption"
          },
          {
            step: 2,
            action: "K8S_SCALE",
            command:
              `kubectl scale deployment payment-service --replicas=${targetReplicas}`,
            description:
              `Update replica count to ${targetReplicas}`
          },
          {
            step: 3,
            action: "K8S_VERIFY_HEALTH",
            command:
              "kubectl get pods -l app=payment-service",
            description:
              "Verify pod readiness after scaling"
          }
        ];
      }

      // ==========================================================
      // ROLLBACK
      // ==========================================================

      else if (p.includes("rollback")) {
        summary =
          "Execute rollback for the failed deployment to the previous stable revision.";

        riskLevel = isProduction
          ? "HIGH_RISK"
          : "MODERATE";

        approvalRequired = isProduction;

        tasks = [
          {
            step: 1,
            action: "K8S_HISTORY",
            command:
              "kubectl rollout history deployment/backend-api",
            description:
              "Retrieve deployment revision history"
          },
          {
            step: 2,
            action: "K8S_UNDO",
            command:
              "kubectl rollout undo deployment/backend-api",
            description:
              "Roll back to the previous deployment revision"
          },
          {
            step: 3,
            action: "HEALTH_CHECK",
            command:
              "curl -f http://localhost:5000/api/health",
            description:
              "Verify API health after rollback"
          }
        ];
      }

      // ==========================================================
      // GENERIC DEVOPS PLAN
      // ==========================================================

      else {
        summary =
          `DevOps Automation Workflow for: "${objective.slice(
            0,
            80
          )}${objective.length > 80 ? "..." : ""}"`;

        tasks = [
          {
            step: 1,
            action: "ENV_INSPECT",
            command:
              "docker ps --format 'table {{.Names}}\\t{{.Status}}'",
            description:
              "Inspect active runtime environment"
          },
          {
            step: 2,
            action: "CONFIG_INSPECT",
            command:
              "cat infra/config.yaml",
            description:
              "Inspect target declarative configuration"
          },
          {
            step: 3,
            action: "SAFE_APPLY",
            command:
              "echo 'Validated DevOps workflow ready for execution'",
            description:
              "Prepare validated workflow for execution"
          }
        ];
      }

      // ==========================================================
      // RETURN STRUCTURED PLAN
      // ==========================================================

      if (jsonMode) {
        return JSON.stringify({
          summary,
          riskLevel,
          approvalRequired,
          tasks,

          recommendedAction:
            approvalRequired
              ? "Review and approve the requested action before execution"
              : riskLevel === "MODERATE"
                ? "Review the generated execution plan before applying infrastructure changes"
                : "Proceed with validated automated execution"
        });
      }

      return summary;
    }

    // ============================================================
    // DEFAULT CONVERSATIONAL RESPONSE
    // ============================================================

    if (jsonMode) {
      return JSON.stringify({
        summary:
          "Analyzed request. No infrastructure-changing operation was detected.",
        riskLevel: "SAFE",
        approvalRequired: false,

        tasks: [
          {
            step: 1,
            action: "INFO",
            command: "echo Ready",
            description:
              "DevOps Assistant is ready"
          }
        ],

        recommendedAction:
          "No infrastructure-changing action required"
      });
    }

    return (
      `I am your Agentic Smart DevOps Assistant. ` +
      `I analyzed your request: "${objective}". ` +
      `I can help plan CI/CD deployments, analyze stack traces, ` +
      `provision Docker and Kubernetes workloads, manage infrastructure, ` +
      `and support Human-In-The-Loop safety gates.`
    );
  }
}