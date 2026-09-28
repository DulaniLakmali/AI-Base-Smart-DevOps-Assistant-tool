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

  ExternalLink,

  RefreshCw,

  Radio,

  Copy,

  Check

} from "lucide-react";

import { Github } from "../components/GithubIcon";


export default function PipelineVisualizerView() {

  const [pipelines, setPipelines] = useState([]);

  const [selectedPipeline, setSelectedPipeline] = useState(null);

  const [jobsData, setJobsData] = useState(null);

  const [terminalLogs, setTerminalLogs] = useState("");

  const [logsLoading, setLogsLoading] = useState(false);

  const [isTriggering, setIsTriggering] = useState(false);

  const [targetBranch, setTargetBranch] = useState("master");

  const [copiedLogs, setCopiedLogs] = useState(false);

  const [isAutoPolling, setIsAutoPolling] = useState(true);


  const [activeOwner, setActiveOwner] = useState("DulaniLakmali");

  const [activeRepo, setActiveRepo] = useState("AI-Base-Smart-DevOps-Assistant-tool");


  useEffect(() => {

    const loadConfig = async () => {

      try {

        const res = await api.get("/github/config");

        if (res.data?.owner) setActiveOwner(res.data.owner);

        if (res.data?.repo) setActiveRepo(res.data.repo);

        if (res.data?.branch) setTargetBranch(res.data.branch);

        fetchPipelines(
          res.data?.owner || activeOwner,
          res.data?.repo || activeRepo
        );

      } catch (err) {

        console.warn("Could not load github config, using defaults:", err);

        fetchPipelines(activeOwner, activeRepo);

      }

    };

    loadConfig();


    const handlePipelineUpdate = (updatedPipeline) => {

      setPipelines((prev) => {

        const index = prev.findIndex(

          (p) =>

            p.id === updatedPipeline.id ||

            (updatedPipeline.previousId && p.id === updatedPipeline.previousId) ||

            (p.realRunId && p.realRunId === updatedPipeline.realRunId)

        );

        if (index >= 0) {

          const newPipelines = [...prev];

          newPipelines[index] = { ...newPipelines[index], ...updatedPipeline };

          return newPipelines;

        }

        return [
          updatedPipeline,
          ...prev.filter((p) => String(p.id) !== String(updatedPipeline.id))
        ];

      });


      setSelectedPipeline((prev) => {

        if (!prev) return updatedPipeline;

        const isMatch =

          prev.id === updatedPipeline.id ||

          (updatedPipeline.previousId && prev.id === updatedPipeline.previousId) ||

          (prev.realRunId && prev.realRunId === updatedPipeline.realRunId);


        if (isMatch) {

          return { ...prev, ...updatedPipeline, id: updatedPipeline.id };

        }

        return prev;

      });

    };


    socket.on("ci_pipeline_update", handlePipelineUpdate);

    return () => socket.off("ci_pipeline_update", handlePipelineUpdate);

  }, []);


  // Automatic Polling Loop for Real GitHub Actions cloud execution

  useEffect(() => {

    if (!isAutoPolling) return;


    const isRunning = (p) =>

      p && (
        p.status === "running" ||
        p.rawStatus === "in_progress" ||
        p.rawStatus === "queued"
      );


    const hasActiveRun = pipelines.some(isRunning) || isRunning(selectedPipeline) || isTriggering;

    const pollIntervalTime = hasActiveRun ? 3500 : 8000;


    const interval = setInterval(() => {

      fetchPipelines(activeOwner, activeRepo, true);

      if (selectedPipeline && isRunning(selectedPipeline)) {

        fetchRunJobs(selectedPipeline);

      }

    }, pollIntervalTime);


    return () => clearInterval(interval);

  }, [isAutoPolling, pipelines, selectedPipeline, isTriggering, activeOwner, activeRepo]);


  // Keep jobs and step logs updated when selectedPipeline changes or its execution status updates

  useEffect(() => {

    if (selectedPipeline) {

      fetchRunJobs(selectedPipeline);

    }

  }, [selectedPipeline?.id, selectedPipeline?.status, selectedPipeline?.rawStatus]);


  const fetchPipelines = async (
    owner = activeOwner,
    repo = activeRepo,
    silent = false
  ) => {
    try {
      const res = await api.get(
        `/devops/ci/pipelines?owner=${owner}&repo=${repo}`
      );

      const list = res.data?.pipelines || [];
      setPipelines(list);

      if (list.length > 0) {
        setSelectedPipeline((prev) => {
          if (!prev) return list[0];

          const matched = list.find(
            (pipeline) =>
              String(pipeline.id) === String(prev.id) ||
              (
                pipeline.realRunId &&
                prev.realRunId &&
                String(pipeline.realRunId) === String(prev.realRunId)
              )
          );

          return matched ? { ...prev, ...matched } : list[0];
        });
      } else if (!silent) {
        setSelectedPipeline(null);
        setJobsData(null);
        setTerminalLogs("");
      }
    } catch (err) {
      console.error(
        "Failed to fetch real GitHub Actions pipelines:",
        err
      );
    }
  };


  const fetchRunJobs = async (pipeline) => {

    if (!pipeline) return;

    try {

      const res = await api.get(`/devops/ci/runs/${pipeline.id}/jobs?owner=${activeOwner}&repo=${activeRepo}`);

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

      const res = await api.get(`/devops/ci/jobs/${jobId}/logs?owner=${activeOwner}&repo=${activeRepo}`);

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
      const res = await api.post(
        "/devops/ci/trigger",
        {
          pipelineName: "Smart DevOps Assistant CI/CD Pipeline",
          owner: activeOwner,
          repo: activeRepo,
          ref: targetBranch
        }
      );

      setSelectedPipeline(res.data);

      setPipelines((prev) => [
        res.data,
        ...prev.filter(
          (pipeline) =>
            String(pipeline.id) !== String(res.data.id)
        )
      ]);

      // Fast polls so the dashboard quickly picks up the GitHub runner state.
      setTimeout(
        () => fetchPipelines(activeOwner, activeRepo, true),
        1500
      );

      setTimeout(
        () => fetchPipelines(activeOwner, activeRepo, true),
        4000
      );

      setTimeout(
        () => fetchPipelines(activeOwner, activeRepo, true),
        8000
      );
    } catch (err) {
      alert(
        "Error triggering pipeline: " +
        (err.response?.data?.error || err.message)
      );
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

      {/* Top Banner: Repository & Real GitHub Actions Status */}

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

                background: "rgba(16, 185, 129, 0.15)",

                color: "var(--accent-emerald)",

                border: "1px solid rgba(16, 185, 129, 0.3)",

                padding: "0.15rem 0.5rem",

                borderRadius: "12px",

                fontWeight: 600,

                display: "flex",

                alignItems: "center",

                gap: "0.25rem"

              }}>

                <Radio size={10} className="pulse-icon" />

                Real GitHub Actions Connected

              </span>

              <span

                onClick={() => setIsAutoPolling((p) => !p)}

                title="Click to toggle automatic GitHub run poller"

                style={{

                  fontSize: "0.65rem",

                  background: isAutoPolling ? "rgba(0, 242, 254, 0.12)" : "rgba(100, 116, 139, 0.2)",

                  color: isAutoPolling ? "var(--accent-cyan)" : "var(--text-muted)",

                  border: `1px solid ${isAutoPolling ? "rgba(0, 242, 254, 0.3)" : "var(--border-subtle)"}`,

                  padding: "0.15rem 0.5rem",

                  borderRadius: "12px",

                  fontWeight: 600,

                  display: "flex",

                  alignItems: "center",

                  gap: "0.3rem",

                  cursor: "pointer"

                }}

              >

                <span className={isAutoPolling ? "pulse-icon" : ""} style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: isAutoPolling ? "var(--accent-cyan)" : "var(--text-muted)" }} />

                {isAutoPolling ? "Live Poller (3.5s)" : "Poller Paused"}

              </span>

            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>

              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>

                Connected Repository:

              </span>

              <a

                href={`https://github.com/${activeOwner}/${activeRepo}`}

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

                <Github size={12} /> {activeOwner}/{activeRepo} <ExternalLink size={11} />

              </a>

            </div>

          </div>

        </div>


        {/* Real GitHub Actions Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              fontSize: "0.72rem",
              color: "var(--accent-emerald)",
              fontWeight: 600
            }}
          >
            ● Real GitHub Actions
          </span>

          <button
            onClick={() => fetchPipelines(activeOwner, activeRepo)}
            className="btn btn-secondary"
            title="Refresh GitHub Actions Runs"
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

              GitHub Workflow Runs

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

              <span>{isTriggering ? "Dispatching Build..." : "Dispatch Real GitHub Build"}</span>

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


              {/* Real GitHub Actions Stages Visualizer */}

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

                          border: `1px solid ${isRunning

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

                      Live GitHub Runner Terminal Logs

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
