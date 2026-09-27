import React, { useState, useEffect, useRef } from "react";
import { api, socket } from "../api/client";
import {
  Send,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Terminal,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from "lucide-react";

export default function AgentChatView({ onTriggerApproval, currentUser }) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      type: "assistant",
      text: "Hello! I am your Agentic Smart DevOps Assistant. How can I help you manage your infrastructure, pipelines, or diagnose system logs today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentThoughts, setCurrentThoughts] = useState([]);
  const [activeExecution, setActiveExecution] = useState(null);
  const chatEndRef = useRef(null);

  // Suggested Prompts (Covering thesis research scenarios)
  const SUGGESTED_PROMPTS = [
    { label: "Deploy Frontend to Kubernetes", query: "Deploy the frontend to Kubernetes" },
    { label: "Run CI Pipeline", query: "Run CI pipeline" },
    { label: "Scale payment-service to 4", query: "Scale payment-service to 4 replicas" },
    { label: "Rollback Failed API Deploy", query: "Execute rollback on backend-api" },
    { label: "High-Risk: Delete Prod DB", query: "Delete production database cluster and terminate pods" }
  ];

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentThoughts, activeExecution]);

  // WebSocket listeners for thought streaming and execution steps
  useEffect(() => {
    const handleThought = (data) => {
      setCurrentThoughts((prev) => [...prev, data]);
    };

    const handleStepRunning = (stepData) => {
      setActiveExecution((prev) => ({
        ...prev,
        currentStep: stepData.step,
        action: stepData.action,
        command: stepData.command
      }));
    };

    const handleStepComplete = (stepResult) => {
      setActiveExecution((prev) => {
        const updatedSteps = prev?.steps ? [...prev.steps] : [];
        updatedSteps.push(stepResult);
        return { ...prev, steps: updatedSteps };
      });
    };

    const handleExecutionComplete = (final) => {
      setActiveExecution(null);
      setIsLoading(false);
    };

    socket.on("agent_thought", handleThought);
    socket.on("agent_step_running", handleStepRunning);
    socket.on("agent_step_complete", handleStepComplete);
    socket.on("agent_execution_complete", handleExecutionComplete);

    return () => {
      socket.off("agent_thought", handleThought);
      socket.off("agent_step_running", handleStepRunning);
      socket.off("agent_step_complete", handleStepComplete);
      socket.off("agent_execution_complete", handleExecutionComplete);
    };
  }, []);

  const handleSend = async (customQuery = null) => {
    const promptToSend = customQuery || query;
    if (!promptToSend.trim() || isLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      type: "user",
      text: promptToSend,
      userName: currentUser?.name || "DevOps Engineer",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setIsLoading(true);
    setCurrentThoughts([]);
    setActiveExecution(null);

    try {
      const res = await api.post("/ask", { question: promptToSend });
      const data = res.data;

      if (data.status === "AWAITING_APPROVAL") {
        // Trigger Human-in-the-Loop Modal
        onTriggerApproval({
          taskId: data.taskId,
          requestId: data.requestId,
          riskLevel: data.riskLevel,
          plan: data.plan
        });

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: "assistant",
            text: `⚠️ **Approval Required**: The proposed workflow contains high-risk actions classified as \`${data.riskLevel}\`. A human authorization prompt has been opened.`,
            plan: data.plan,
            isApprovalRequired: true,
            provider: data.provider,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
        setIsLoading(false);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: "assistant",
            text: data.plan?.summary || "Execution completed.",
            plan: data.plan,
            execution: data.execution,
            provider: data.provider,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
        setIsLoading(false);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          isError: true,
          text: `Error: ${err.response?.data?.error || err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "calc(100vh - 105px)",
      gap: "0.75rem"
    }}>
      {/* Messages Scroll Area */}
      <div className="glass-panel" style={{
        flex: 1,
        padding: "1.25rem",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem"
      }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: m.type === "user" ? "flex-end" : "flex-start"
            }}
          >
            {/* Header info */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.25rem",
              fontSize: "0.75rem",
              color: "var(--text-secondary)"
            }}>
              <span style={{ fontWeight: 600, color: m.type === "user" ? "var(--accent-blue)" : "var(--accent-cyan)" }}>
                {m.type === "user" ? m.userName : "Smart DevOps Assistant"}
              </span>
              <span>•</span>
              <span>{m.timestamp}</span>
              {m.provider && (
                <span className="badge badge-info" style={{ fontSize: "0.6rem" }}>
                  {m.provider}
                </span>
              )}
            </div>

            {/* Message Bubble */}
            <div style={{
              maxWidth: "85%",
              background: m.type === "user" ? "rgba(59, 130, 246, 0.18)" : "rgba(15, 23, 42, 0.85)",
              border: m.type === "user" ? "1px solid rgba(59, 130, 246, 0.35)" : "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "0.9rem 1.2rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
            }}>
              <p style={{ fontSize: "0.92rem", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                {m.text}
              </p>

              {/* Task Plan Details Card */}
              {m.plan && m.plan.tasks && (
                <div style={{
                  marginTop: "0.75rem",
                  background: "rgba(5, 8, 15, 0.7)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.75rem",
                  border: "1px solid var(--border-subtle)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                      Autonomous Plan ({m.plan.tasks.length} steps)
                    </span>
                    <span className={`badge ${m.plan.riskLevel === "HIGH_RISK" ? "badge-danger" : m.plan.riskLevel === "MODERATE" ? "badge-warning" : "badge-success"}`}>
                      {m.plan.riskLevel}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {m.plan.tasks.map((t, idx) => (
                      <div key={idx} style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.6rem",
                        fontSize: "0.82rem",
                        fontFamily: "var(--font-mono)",
                        color: "#cbd5e1"
                      }}>
                        <span style={{ color: "var(--accent-cyan)" }}>[Step {t.step}]</span>
                        <div>
                          <div>{t.description}</div>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>$ {t.command}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Execution Results */}
              {m.execution && m.execution.results && (
                <div style={{ marginTop: "0.75rem" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    color: "var(--accent-emerald)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    marginBottom: "0.3rem"
                  }}>
                    <CheckCircle2 size={16} /> All steps executed successfully
                  </div>
                  <div className="code-terminal" style={{ maxHeight: "150px", overflowY: "auto" }}>
                    {m.execution.results.map((r, ri) => (
                      <div key={ri} style={{ marginBottom: "0.4rem" }}>
                        <span style={{ color: "var(--accent-cyan)" }}>&gt; {r.command}</span>
                        <pre style={{ color: "#94a3b8", whiteSpace: "pre-wrap" }}>{r.log}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Real-time Agent Reasoning Stream */}
        {isLoading && (
          <div style={{
            background: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(0, 242, 254, 0.3)",
            borderRadius: "var(--radius-md)",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="pulsing-dot" style={{ background: "var(--accent-cyan)" }} />
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-cyan)" }}>
                Agentic Reasoning Stream
              </span>
            </div>
            {currentThoughts.map((t, idx) => (
              <div key={idx} style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                paddingLeft: "1.2rem",
                borderLeft: "2px solid var(--border-subtle)"
              }}>
                <span style={{ color: "var(--accent-indigo)", fontWeight: 600 }}>{t.step}: </span>
                {t.message}
              </div>
            ))}
            {activeExecution && (
              <div style={{
                marginTop: "0.5rem",
                padding: "0.5rem 0.8rem",
                background: "#05080f",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.8rem",
                fontFamily: "var(--font-mono)",
                color: "var(--accent-cyan)"
              }}>
                Executing Step {activeExecution.currentStep}: {activeExecution.command}
              </div>
            )}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Prompts Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.2rem" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          Suggested:
        </span>
        {SUGGESTED_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p.query)}
            disabled={isLoading}
            style={{
              padding: "0.3rem 0.75rem",
              background: "rgba(30, 41, 59, 0.6)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "20px",
              color: p.label.includes("High-Risk") ? "var(--accent-rose)" : "var(--text-secondary)",
              fontSize: "0.75rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent-cyan)"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-subtle)"}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Query Input Box */}
      <div className="glass-panel" style={{
        padding: "0.6rem 0.8rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem"
      }}>
        <input
          type="text"
          className="input-control"
          placeholder="Ask DevOps Assistant (e.g. 'Deploy frontend to k8s', 'Analyze pod logs', 'Scale worker pods to 5')..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isLoading}
          style={{ border: "none", background: "transparent" }}
        />
        <button
          className="btn btn-primary"
          onClick={() => handleSend()}
          disabled={isLoading || !query.trim()}
          style={{ padding: "0.6rem 1.2rem" }}
        >
          <Send size={16} />
          <span>Execute</span>
        </button>
      </div>
    </div>
  );
}
