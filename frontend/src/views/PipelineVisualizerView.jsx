import React, { useState, useEffect } from "react";
import { api, socket } from "../api/client";
import {
  GitBranch,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Loader2,
  ShieldCheck,
  PackageCheck,
  ExternalLink,
  RefreshCw,
  GitCommit,
  Radio,
  Copy,
  Check,
  Layers,
  Sparkles,
  Server
} from "lucide-react";
import { Github } from "../components/GithubIcon";

export default function PipelineVisualizerView() {
  const [pipelineMode, setPipelineMode] = useState("real"); // "real" | "simulated"
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [jobsData, setJobsData] = useState(null);
  const [terminalLogs, setTerminalLogs] = useState("");
  const [logsLoading, setLogsLoading] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [targetBranch, setTargetBranch] = useState("main");
  const [copiedLogs, setCopiedLogs] = useState(false);

  const defaultOwner = "DulaniLakmali";
  const defaultRepo = "Smart-DevOps-Assistant";

  useEffect(() => {
    fetchPipelines(pipelineMode);

    const handlePipelineUpdate = (updatedPipeline) => {
      setPipelines((prev) => {
        const index = prev.findIndex((p) => p.id === updatedPipeline.id);
        if (index >= 0) {
          const newPipelines = [...prev];
          newPipelines[index] = updatedPipeline;
          return newPipelines;
        }
        return [updatedPipeline, ...prev];
      });

      setSelectedPipeline((prev) => (prev?.id === updatedPipeline.id ? updatedPipeline : prev));
    };

    socket.on("ci_pipeline_update", handlePipelineUpdate);
    return () => socket.off("ci_pipeline_update", handlePipelineUpdate);
  }, [pipelineMode]);

  useEffect(() => {
    if (selectedPipeline) {
      fetchRunJobs(selectedPipeline);
    }
  }, [selectedPipeline?.id]);

  const fetchPipelines = async (mode = pipelineMode) => {
    try {
      const res = await api.get(`/devops/ci/pipelines?mode=${mode}&owner=${defaultOwner}&repo=${defaultRepo}`);
      const list = res.data?.pipelines || [];
      setPipelines(list);
      if (list.length > 0) {
        setSelectedPipeline(list[0]);
      } else {
        setSelectedPipeline(null);
        setJobsData(null);
        setTerminalLogs("");
      }
    } catch (err) {
      console.error("Failed to fetch pipelines:", err);
    }
  };

  const fetchRunJobs = async (pipeline) => {
    if (!pipeline) return;
    try {
      const res = await api.get(`/devops/ci/runs/${pipeline.id}/jobs?owner=${defaultOwner}&repo=${defaultRepo}`);
      setJobsData(res.data);

      const firstJob = res.data?.jobs?.[0];
      if (firstJob) {
        fetchJobLogs(firstJob.id);
      }
    } catch (err) {
      console.error("Failed to fetch run jobs:", err);
    }
  };

  const fetchJobLogs = async (jobId) => {
    setLogsLoading(true);
    try {
      const res = await api.get(`/devops/ci/jobs/${jobId}/logs?owner=${defaultOwner}&repo=${defaultRepo}`);
      setTerminalLogs(res.data || "No output logs available.");
    } catch (err) {
      setTerminalLogs("Logs unavailable or pending execution.");
    } finally {
      setLogsLoading(false);
    }
  };

  const handleTrigger = async () => {
    setIsTriggering(true);
    try {
      const res = await api.post("/devops/ci/trigger", {
        pipelineName: "Smart DevOps Assistant CI/CD Pipeline",
        mode: pipelineMode,
        owner: defaultOwner,
        repo: defaultRepo,
        ref: targetBranch,
        workflowId: "ci.yml"
      });

      // Brief wait for GitHub Actions to register the run
      setTimeout(() => {
        fetchPipelines(pipelineMode);
      }, 1500);

      setSelectedPipeline(res.data);
    } catch (err) {
      alert("Error triggering pipeline: " + (err.response?.data?.error || err.message));
    } finally {
      setIsTriggering(false);
    }
  };

  const copyLogsToClipboard = () => {
    navigator.clipboard.writeText(terminalLogs);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      height: "calc(100vh - 105px)",
      overflow: "hidden"
    }}>
      {/* Top Banner: Mode & Repository Header */}
      <div className="glass-panel" style={{
        padding: "0.85rem 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.75rem",
        flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)",
            padding: "0.5rem",
            borderRadius: "10px",
            border: "1px solid rgba(0, 242, 254, 0.3)"
          }}>
            <GitBranch size={20} color="var(--accent-cyan)" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
                Autonomous CI/CD & GitHub Actions Engine
              </h2>
              <span style={{
                fontSize: "0.65rem",
                background: pipelineMode === "real" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                color: pipelineMode === "real" ? "var(--accent-emerald)" : "var(--accent-amber)",
                border: `1px solid ${pipelineMode === "real" ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
                padding: "0.15rem 0.5rem",
                borderRadius: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.25rem"
              }}>
                <Radio size={10} className="pulse-icon" />
                {pipelineMode === "real" ? "Real GitHub Actions Connected" : "Simulated Local Runner"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                Connected Repository:
              </span>
              <a
                href={`https://github.com/${defaultOwner}/${defaultRepo}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: "0.75rem",
                  color: "var(--accent-cyan)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  textDecoration: "none",
                  fontWeight: 600
                }}
              >
                <Github size={12} /> {defaultOwner}/{defaultRepo} <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>

        {/* Mode Toggle Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{
            display: "flex",
            gap: "0.3rem",
            background: "rgba(15, 23, 42, 0.6)",
            padding: "0.25rem",
            borderRadius: "8px",
            border: "1px solid var(--border-subtle)"
          }}>
            <button
              className={`btn ${pipelineMode === "real" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
              onClick={() => {
                setPipelineMode("real");
                fetchPipelines("real");
              }}
            >
              🚀 Real GitHub Actions
            </button>
            <button
              className={`btn ${pipelineMode === "simulated" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
              onClick={() => {
                setPipelineMode("simulated");
                fetchPipelines("simulated");
              }}
            >
              ⚡ Simulation Sandbox
            </button>
          </div>

          <button
            onClick={() => fetchPipelines(pipelineMode)}
            className="btn btn-secondary"
            title="Refresh Runs"
            style={{ padding: "0.4rem 0.6rem" }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Main Content: Left Run List + Right Details / Stages / Terminal */}
      <div style={{ display: "flex", gap: "1rem", flex: 1, minHeight: 0 }}>
        {/* Left List of Pipeline Runs */}
        <div className="glass-panel" style={{
          width: "340px",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          overflowY: "auto",
          flexShrink: 0
        }}>
          {/* Dispatch Action Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, margin: 0, textTransform: "uppercase", color: "var(--text-secondary)" }}>
              {pipelineMode === "real" ? "GitHub Workflow Runs" : "Local Pipeline Runs"}
            </h3>
            <span style={{ fontSize: "0.72rem", color: "var(--accent-cyan)", fontWeight: 600 }}>
              {pipelines.length} Active
            </span>
          </div>

          {/* Trigger Pipeline Action Card */}
          <div style={{
            background: "rgba(15, 23, 42, 0.7)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "8px",
            padding: "0.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Branch:</span>
              <input
                type="text"
                value={targetBranch}
                onChange={(e) => setTargetBranch(e.target.value)}
                style={{
                  width: "120px",
                  padding: "0.2rem 0.5rem",
                  fontSize: "0.75rem",
                  background: "rgba(10, 15, 26, 0.8)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "4px",
                  color: "var(--accent-cyan)",
                  fontFamily: "monospace"
                }}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleTrigger}
              disabled={isTriggering}
              style={{ width: "100%", padding: "0.45rem", fontSize: "0.78rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
            >
              {isTriggering ? <Loader2 size={14} className="spinning" /> : <Play size={14} />}
              <span>{isTriggering ? "Dispatching Build..." : (pipelineMode === "real" ? "Dispatch Real GitHub Build" : "Run Simulated Pipeline")}</span>
            </button>
          </div>

          {/* Pipelines List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {pipelines.map((p) => {
              const isSelected = selectedPipeline?.id === p.id;
              const isSuccess = p.status === "success" || p.rawConclusion === "success";
              const isRunning = p.status === "running" || p.rawStatus === "in_progress" || p.rawStatus === "queued";
              const isFailed = p.status === "failed" || p.rawConclusion === "failure";

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPipeline(p)}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: isSelected ? "1px solid var(--accent-cyan)" : "1px solid var(--border-subtle)",
                    background: isSelected ? "rgba(0, 242, 254, 0.08)" : "rgba(15, 23, 42, 0.6)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.3rem"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>
                      {p.name}
                    </span>
                    <span className={`badge ${isSuccess ? "badge-success" : isRunning ? "badge-info" : "badge-danger"}`} style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem" }}>
                      {isSuccess ? "Success" : isRunning ? "Running" : "Failed"}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.75rem", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.commitMsg}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--accent-cyan)", fontFamily: "monospace" }}>
                      <GitBranch size={11} /> {p.branch} • #{p.runNumber || p.id.slice(-4)}
                    </span>
                    <span>
                      {p.commit ? `SHA: ${p.commit.slice(0, 7)}` : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Stage Pipeline Visualizer & Logs */}
        <div className="glass-panel" style={{
          flex: 1,
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          overflowY: "auto"
        }}>
          {selectedPipeline ? (
            <>
              {/* Header info */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.85rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>
                      {selectedPipeline.name}
                    </h2>
                    {selectedPipeline.htmlUrl && (
                      <a
                        href={selectedPipeline.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                      >
                        View on GitHub <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.25rem", margin: 0 }}>
                    Triggered at {new Date(selectedPipeline.triggeredAt).toLocaleString()} • Branch: <strong style={{ color: "var(--accent-cyan)" }}>{selectedPipeline.branch}</strong> • Commit: <code style={{ color: "var(--accent-purple)" }}>{selectedPipeline.commit}</code>
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className={`badge ${selectedPipeline.status === "success" || selectedPipeline.rawConclusion === "success" ? "badge-success" : selectedPipeline.status === "running" ? "badge-info" : "badge-danger"}`} style={{ fontSize: "0.8rem", padding: "0.3rem 0.8rem" }}>
                    {selectedPipeline.rawConclusion ? selectedPipeline.rawConclusion.toUpperCase() : selectedPipeline.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Real / Simulated Stages Visualizer */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                  <h4 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", margin: 0 }}>
                    Pipeline Execution Stages
                  </h4>
                  {jobsData?.jobs?.[0]?.steps && (
                    <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                      {jobsData.jobs[0].steps.length} Steps Verified on GitHub Actions Runner
                    </span>
                  )}
                </div>

                {/* Grid of Steps */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "0.6rem"
                }}>
                  {(jobsData?.jobs?.[0]?.steps || selectedPipeline.stages || []).map((step, i) => {
                    const isSuccess = step.conclusion === "success" || step.status === "success" || step.status === "completed";
                    const isRunning = step.status === "in_progress" || step.status === "running";
                    const isFailed = step.conclusion === "failure" || step.status === "failed";
                    const isSkipped = step.conclusion === "skipped" || step.status === "skipped";

                    return (
                      <div
                        key={i}
                        style={{
                          background: isRunning
                            ? "rgba(0, 242, 254, 0.12)"
                            : isSuccess
                            ? "rgba(16, 185, 129, 0.1)"
                            : isFailed
                            ? "rgba(239, 68, 68, 0.1)"
                            : "rgba(15, 23, 42, 0.6)",
                          border: `1px solid ${
                            isRunning
                              ? "var(--accent-cyan)"
                              : isSuccess
                              ? "rgba(16, 185, 129, 0.35)"
                              : isFailed
                              ? "rgba(239, 68, 68, 0.35)"
                              : "var(--border-subtle)"
                          }`,
                          borderRadius: "var(--radius-md)",
                          padding: "0.75rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700 }}>
                            STEP {step.number || i + 1}
                          </span>
                          {isRunning && <span className="pulsing-dot" style={{ background: "var(--accent-cyan)" }} />}
                          {isSuccess && <CheckCircle2 size={15} color="var(--accent-emerald)" />}
                          {isFailed && <XCircle size={15} color="var(--accent-rose)" />}
                          {isSkipped && <Clock size={15} color="var(--text-muted)" />}
                        </div>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {step.name}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: isSuccess ? "var(--accent-emerald)" : isRunning ? "var(--accent-cyan)" : "var(--text-secondary)" }}>
                          {isSuccess ? "Passed" : isRunning ? "In Progress" : isSkipped ? "Skipped" : "Queued"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stage Logs Terminal */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "280px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Terminal size={16} color="var(--accent-cyan)" />
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                      {pipelineMode === "real" ? "Live GitHub Runner Terminal Logs" : "Simulated Stage Outputs"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                      onClick={() => {
                        const firstJob = jobsData?.jobs?.[0];
                        if (firstJob) fetchJobLogs(firstJob.id);
                      }}
                      className="btn btn-secondary"
                      style={{ padding: "0.25rem 0.6rem", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: "0.3rem" }}
                    >
                      <RefreshCw size={12} className={logsLoading ? "spin" : ""} /> Refresh Logs
                    </button>
                    <button
                      onClick={copyLogsToClipboard}
                      className="btn btn-secondary"
                      style={{ padding: "0.25rem 0.6rem", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: "0.3rem" }}
                    >
                      {copiedLogs ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                      {copiedLogs ? "Copied" : "Copy Logs"}
                    </button>
                  </div>
                </div>

                <div
                  className="code-terminal"
                  style={{
                    flex: 1,
                    minHeight: "220px",
                    maxHeight: "360px",
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                    lineHeight: "1.45",
                    background: "#05080f",
                    border: "1px solid var(--border-subtle)"
                  }}
                >
                  {logsLoading ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-cyan)" }}>
                      <Loader2 size={16} className="spinning" /> Streaming runner logs from GitHub...
                    </div>
                  ) : terminalLogs ? (
                    terminalLogs
                  ) : (
                    <div style={{ color: "var(--text-muted)" }}>
                      No terminal logs available. Select a completed or active run to view execution stream.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>
              Select a pipeline from the list to inspect execution stages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
