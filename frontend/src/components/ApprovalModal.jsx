import React, { useState } from "react";
import { AlertTriangle, ShieldAlert, CheckCircle, XCircle } from "lucide-react";

export default function ApprovalModal({
  isOpen,
  planData,
  onApprove,
  onReject,
  isProcessing
}) {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  if (!isOpen || !planData) return null;

  const tasks = planData.plan?.tasks || [];

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999,
      padding: "1rem"
    }}>
      <div className="glass-panel" style={{
        maxWidth: "600px",
        width: "100%",
        border: "1px solid rgba(239, 68, 68, 0.4)",
        boxShadow: "0 0 30px rgba(239, 68, 68, 0.2)",
        padding: "1.75rem",
        borderRadius: "var(--radius-xl)"
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
          <div style={{
            background: "rgba(239, 68, 68, 0.15)",
            padding: "0.75rem",
            borderRadius: "12px",
            border: "1px solid rgba(239, 68, 68, 0.3)"
          }}>
            <ShieldAlert size={28} color="var(--accent-rose)" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                Human-in-the-Loop Authorization Required
              </h2>
            </div>
            <span className="badge badge-danger" style={{ marginTop: "0.3rem" }}>
              {planData.riskLevel || "HIGH_RISK"} OPERATION
            </span>
          </div>
        </div>

        {/* Warning Rationale */}
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.5 }}>
          The Planner Agent has flagged this operation as high impact. In accordance with operational safety protocols (Chapter 3.6), human approval is required before execution.
        </p>

        {/* Plan Summary */}
        <div style={{
          background: "rgba(15, 23, 42, 0.8)",
          border: "1px solid var(--border-subtle)",
          padding: "1rem",
          borderRadius: "var(--radius-md)",
          marginBottom: "1rem"
        }}>
          <h4 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-cyan)", marginBottom: "0.4rem" }}>
            Proposed Action:
          </h4>
          <p style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>
            {planData.plan?.summary || "Execute high-impact infrastructure workflow."}
          </p>
        </div>

        {/* Task Steps */}
        <div style={{ marginBottom: "1.25rem", maxHeight: "180px", overflowY: "auto" }}>
          <h4 style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Planned Commands ({tasks.length} steps):
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {tasks.map((t, i) => (
              <div key={i} style={{
                background: "#05080f",
                padding: "0.5rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)",
                fontSize: "0.8rem",
                fontFamily: "var(--font-mono)",
                color: "#e2e8f0"
              }}>
                <span style={{ color: "var(--accent-cyan)", marginRight: "0.5rem" }}>${t.step}.</span>
                {t.command}
              </div>
            ))}
          </div>
        </div>

        {/* Reject Reason Input (Conditional) */}
        {showRejectInput && (
          <div style={{ marginBottom: "1rem" }}>
            <input
              type="text"
              className="input-control"
              placeholder="Provide reason for rejection (for audit log)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.75rem" }}>
          {!showRejectInput ? (
            <button
              className="btn btn-secondary"
              onClick={() => setShowRejectInput(true)}
              disabled={isProcessing}
            >
              <XCircle size={16} /> Reject
            </button>
          ) : (
            <button
              className="btn btn-secondary"
              onClick={() => onReject(planData.taskId, rejectReason)}
              disabled={isProcessing}
            >
              Confirm Rejection
            </button>
          )}

          <button
            className="btn btn-danger"
            onClick={() => onApprove(planData.taskId)}
            disabled={isProcessing}
          >
            <CheckCircle size={16} />
            {isProcessing ? "Executing..." : "Authorize & Execute"}
          </button>
        </div>
      </div>
    </div>
  );
}
