import React from "react";
import {
  AlertTriangle,
  RefreshCw,
  X,
  ExternalLink
} from "lucide-react";

export default function PipelineRetryModal({
  pipeline,
  isRetrying,
  onRetry,
  onCancel
}) {
  if (!pipeline) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "min(460px, 92vw)",
          padding: "1.5rem",
          border: "1px solid rgba(239, 68, 68, 0.4)",
          borderRadius: "16px",
          boxShadow: "0 25px 70px rgba(0,0,0,0.5)"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "1rem"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem"
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(239,68,68,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <AlertTriangle size={22} color="#ef4444" />
            </div>

            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.05rem"
                }}
              >
                Pipeline Failed
              </h3>

              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)"
                }}
              >
                Human confirmation required
              </span>
            </div>
          </div>

          <button
            onClick={onCancel}
            disabled={isRetrying}
            style={{
              background: "transparent",
              border: 0,
              color: "var(--text-secondary)",
              cursor: "pointer"
            }}
          >
            <X size={19} />
          </button>
        </div>

        <div
          style={{
            marginTop: "1.25rem",
            padding: "1rem",
            borderRadius: "10px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)"
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.88rem",
              lineHeight: 1.6
            }}
          >
            GitHub Actions run{" "}
            <strong>
              #{pipeline.runNumber || pipeline.id}
            </strong>{" "}
            failed.
          </p>

          <p
            style={{
              margin: "0.5rem 0 0",
              fontSize: "0.83rem",
              color: "var(--text-secondary)"
            }}
          >
            Do you want to retry the failed pipeline?
          </p>
        </div>

        {pipeline.htmlUrl && (
          <a
            href={pipeline.htmlUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              marginTop: "0.8rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              color: "var(--accent-cyan)",
              fontSize: "0.75rem",
              textDecoration: "none"
            }}
          >
            View failed run on GitHub
            <ExternalLink size={12} />
          </a>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            marginTop: "1.4rem"
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isRetrying}
          >
            Cancel
          </button>

          <button
            className="btn btn-primary"
            onClick={onRetry}
            disabled={isRetrying}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            <RefreshCw
              size={14}
              className={
                isRetrying ? "spinning" : ""
              }
            />

            {isRetrying
              ? "Retrying..."
              : "Retry Pipeline"}
          </button>
        </div>
      </div>
    </div>
  );
}