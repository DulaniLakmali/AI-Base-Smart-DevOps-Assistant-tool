import React, { useState, useEffect, useRef } from "react";
import { api, socket } from "../api/client";
import {
  Activity,
  Flame,
  Zap,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Terminal,
  ExternalLink,
  Layers,
  Search,
  Server,
  Database,
  BarChart3,
  Clock,
  Radio,
  Copy,
  Check,
  Code2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function MetricsChaosView({ telemetry }) {
  const [activeTab, setActiveTab] = useState("telemetry"); // "telemetry" | "promql" | "grafana"
  const [history, setHistory] = useState([]);
  const [chaosLoading, setChaosLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [activeMode, setActiveMode] = useState("CHAOS_SIMULATION");

  // Prometheus State
  const [promStatus, setPromStatus] = useState(null);
  const [promqlQuery, setPromqlQuery] = useState("devops_system_cpu_percent");
  const [promqlResult, setPromqlResult] = useState(null);
  const [promqlLoading, setPromqlLoading] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const resultsRef = useRef(null);

  useEffect(() => {
    fetchHistory();
    fetchPrometheusStatus();

    const handleStream = (sample) => {
      setHistory((prev) => {
        const next = [...prev, sample.telemetry];
        if (next.length > 20) next.shift();
        return next;
      });
      if (sample.evaluation?.recommendation) {
        setRecommendation(sample.evaluation.recommendation);
      } else {
        setRecommendation(null);
      }
    };

    socket.on("telemetry_stream", handleStream);
    return () => socket.off("telemetry_stream", handleStream);
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/metrics/history");
      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPrometheusStatus = async () => {
    try {
      const res = await api.get("/metrics/prometheus/status");
      setPromStatus(res.data);
    } catch (err) {
      console.error("Failed to fetch Prometheus status:", err);
    }
  };

  const handleRunPromQL = async (queryToRun) => {
    const q = (queryToRun !== undefined ? queryToRun : promqlQuery) || "devops_system_cpu_percent";
    setPromqlQuery(q);
    setPromqlLoading(true);
    try {
      const res = await api.post("/metrics/prometheus/query", { query: q });
      setPromqlResult(res.data);
    } catch (err) {
      setPromqlResult({
        status: "error",
        error: err.response?.data?.error || err.message,
        data: { resultType: "vector", result: [] }
      });
    } finally {
      setPromqlLoading(false);
    }
  };

  const handleInjectChaos = async (faultType) => {
    setChaosLoading(true);
    try {
      const res = await api.post("/metrics/chaos", { faultType });
      if (res.data?.evaluation?.recommendation) {
        setRecommendation(res.data.evaluation.recommendation);
      } else {
        setRecommendation(null);
      }
      // Re-evaluate current promql if active
      if (activeTab === "promql") {
        handleRunPromQL();
      }
    } catch (err) {
      alert("Chaos injection error: " + (err.response?.data?.error || err.message));
    } finally {
      setChaosLoading(false);
    }
  };

  const handleToggleMode = async (mode) => {
    setActiveMode(mode);
    try {
      await api.post("/metrics/mode", { mode });
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  // Chart Data Configuration
  const labels = history.map((_, i) => `T-${(history.length - 1 - i) * 3}s`);
  const cpuData = history.map((h) => h.cpu_percent || h.cpu || 40);
  const memData = history.map((h) => h.memory_percent || h.memory || 50);

  const chartData = {
    labels,
    datasets: [
      {
        label: "CPU Utilization (%) [Threshold: 85%]",
        data: cpuData,
        borderColor: "#00f2fe",
        backgroundColor: "rgba(0, 242, 254, 0.1)",
        fill: true,
        tension: 0.3
      },
      {
        label: "Memory Consumption (%) [Threshold: 80%]",
        data: memData,
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        fill: true,
        tension: 0.3
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#94a3b8",
          font: { family: "Inter", size: 12 }
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "#64748b" }
      },
      x: {
        grid: { display: false },
        ticks: { color: "#64748b" }
      }
    }
  };

  const sampleQueries = [
    { label: "CPU Usage %", query: "devops_system_cpu_percent" },
    { label: "Memory Usage %", query: "devops_system_memory_percent" },
    { label: "Active Pods", query: "devops_active_pods_count" },
    { label: "Chaos Faults", query: "devops_chaos_faults_total" },
    { label: "HTTP Requests", query: "devops_http_requests_total" },
    { label: "Scraper Status (up)", query: "up" },
    { label: "Resident Memory (RSS)", query: "process_resident_memory_bytes" },
    { label: "Event Loop Lag", query: "nodejs_eventloop_lag_seconds" }
  ];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "1.25rem",
      height: "calc(100vh - 105px)",
      overflowY: "auto",
      paddingRight: "0.5rem"
    }}>
      {/* Top Header & Sub-Navigation Tabs */}
      <div className="glass-panel" style={{
        padding: "1rem 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Activity size={22} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>
              Enterprise Monitoring & Chaos Engineering Hub
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
              <Radio size={10} className="pulse-icon" /> Prometheus Ready
            </span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem", margin: 0 }}>
            Unified live Prometheus exposition, PromQL query engine, Grafana visualization, and chaos simulation.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          background: "rgba(15, 23, 42, 0.6)",
          padding: "0.25rem",
          borderRadius: "10px",
          border: "1px solid var(--border-subtle)"
        }}>
          <button
            className={`btn ${activeTab === "telemetry" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "0.4rem 0.85rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
            onClick={() => setActiveTab("telemetry")}
          >
            <Activity size={14} /> Telemetry & Chaos
          </button>
          <button
            className={`btn ${activeTab === "promql" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "0.4rem 0.85rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
            onClick={() => {
              setActiveTab("promql");
              if (!promqlResult) handleRunPromQL("devops_system_cpu_percent");
            }}
          >
            <Terminal size={14} /> PromQL Engine
          </button>
          <button
            className={`btn ${activeTab === "grafana" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "0.4rem 0.85rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
            onClick={() => setActiveTab("grafana")}
          >
            <BarChart3 size={14} /> Grafana Dashboard
          </button>
        </div>
      </div>

      {/* ================= TAB 1: TELEMETRY & CHAOS ================= */}
      {activeTab === "telemetry" && (
        <>
          {/* Mode Switcher Bar */}
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Telemetry Mode:</span>
            <div style={{ display: "flex", gap: "0.3rem", background: "rgba(15, 23, 42, 0.6)", padding: "0.2rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
              <button
                className={`btn ${activeMode === "CHAOS_SIMULATION" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "0.3rem 0.7rem", fontSize: "0.72rem" }}
                onClick={() => handleToggleMode("CHAOS_SIMULATION")}
              >
                ⚡ Chaos Simulation
              </button>
              <button
                className={`btn ${activeMode === "LIVE_HARDWARE" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "0.3rem 0.7rem", fontSize: "0.72rem" }}
                onClick={() => handleToggleMode("LIVE_HARDWARE")}
              >
                💻 Live Host Hardware
              </button>
            </div>
          </div>

          {/* Proactive Recommendation Banner (If Chaos Injected) */}
          {recommendation && (
            <div style={{
              background: "linear-gradient(90deg, rgba(245, 158, 11, 0.2) 0%, rgba(239, 68, 68, 0.2) 100%)",
              border: "1px solid rgba(245, 158, 11, 0.5)",
              borderRadius: "var(--radius-md)",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-amber)" }}>
                <AlertTriangle size={20} />
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>
                  Autonomous Scaling Recommendation from MonitoringAgent
                </h3>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-primary)", margin: 0 }}>
                {recommendation.rationale}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                <div className="code-terminal" style={{ padding: "0.5rem 0.75rem", fontSize: "0.8rem", color: "var(--accent-cyan)" }}>
                  $ {recommendation.command}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleInjectChaos("recover")}
                  style={{ fontSize: "0.8rem" }}
                >
                  <Zap size={14} /> Apply Scaling Action & Recover
                </button>
              </div>
            </div>
          )}

          {/* Real-Time Live Graph */}
          <div className="glass-panel" style={{ padding: "1.25rem", minHeight: "320px", display: "flex", flexDirection: "column" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              Resource Saturation Stream vs Target Thresholds
            </h3>
            <div style={{ flex: 1, minHeight: "260px" }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Chaos Injection Buttons Panel */}
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Flame size={18} color="var(--accent-rose)" /> Chaos Fault Injector (Evaluation Scenarios)
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Trigger controlled fault events to evaluate the assistant's MTTR (Mean Time to Recovery) and alert latency. Gauges update directly in Prometheus `/metrics`:
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
              <button
                className="btn btn-secondary"
                onClick={() => handleInjectChaos("cpu_spike")}
                disabled={chaosLoading}
                style={{ borderColor: "rgba(239, 68, 68, 0.4)", color: "var(--accent-rose)" }}
              >
                <Flame size={16} /> Spike CPU to 94% (&gt;85%)
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => handleInjectChaos("memory_leak")}
                disabled={chaosLoading}
                style={{ borderColor: "rgba(245, 158, 11, 0.4)", color: "var(--accent-amber)" }}
              >
                <Activity size={16} /> Spike RAM to 89% (&gt;80%)
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => handleInjectChaos("pod_crash")}
                disabled={chaosLoading}
                style={{ borderColor: "rgba(139, 92, 246, 0.4)", color: "var(--accent-indigo)" }}
              >
                <TrendingUp size={16} /> Crash 2 K8s Pods
              </button>

              <button
                className="btn btn-primary"
                onClick={() => handleInjectChaos("recover")}
                disabled={chaosLoading}
              >
                <RefreshCw size={16} /> Restore Baseline State
              </button>
            </div>
          </div>
        </>
      )}

      {/* ================= TAB 2: PROMETHEUS PROMQL ENGINE ================= */}
      {activeTab === "promql" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* PromQL Interactive Query Console - FIRST FOR IMMEDIATE VISIBILITY */}
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Terminal size={18} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
                  Live PromQL Query Runner
                </h3>
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                Click chips or type custom PromQL expressions
              </span>
            </div>

            {/* Quick Query Chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.85rem" }}>
              {sampleQueries.map((item) => {
                const isSelected = promqlQuery === item.query;
                return (
                  <button
                    key={item.query}
                    onClick={() => handleRunPromQL(item.query)}
                    style={{
                      background: isSelected ? "rgba(0, 242, 254, 0.2)" : "rgba(30, 41, 59, 0.6)",
                      border: `1px solid ${isSelected ? "var(--accent-cyan)" : "var(--border-subtle)"}`,
                      color: isSelected ? "var(--accent-cyan)" : "var(--text-primary)",
                      padding: "0.3rem 0.65rem",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      fontWeight: isSelected ? 600 : 400,
                      transition: "all 0.15s"
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Query Input Bar */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  type="text"
                  value={promqlQuery}
                  onChange={(e) => setPromqlQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRunPromQL();
                  }}
                  placeholder="Enter PromQL query (e.g. devops_system_cpu_percent, up, process_resident_memory_bytes)..."
                  className="input-control"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.85rem",
                    paddingLeft: "2.25rem",
                    paddingTop: "0.6rem",
                    paddingBottom: "0.6rem"
                  }}
                />
                <Search size={15} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
              </div>
              <button
                className="btn btn-primary"
                onClick={() => handleRunPromQL()}
                disabled={promqlLoading}
                style={{ padding: "0.55rem 1.4rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                {promqlLoading ? <RefreshCw size={15} className="spin" /> : <PlayIcon size={15} />}
                <span>{promqlLoading ? "Querying..." : "Run PromQL"}</span>
              </button>
            </div>

            {/* LIVE QUERY RESULTS CARD */}
            <div ref={resultsRef} style={{ marginTop: "1rem" }}>
              {promqlResult ? (
                <div style={{
                  background: "rgba(10, 15, 26, 0.85)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "10px",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem"
                }}>
                  {/* Result Header & Status */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span className="badge badge-success" style={{ fontSize: "0.68rem" }}>
                        <CheckCircle2 size={12} /> 200 OK
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        Source: <strong style={{ color: "var(--accent-cyan)" }}>{promqlResult.source}</strong>
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                        Result: <strong style={{ color: "var(--text-primary)" }}>{promqlResult.data?.resultType || "vector"}</strong> ({promqlResult.data?.result?.length || 0} series)
                      </span>
                      <button
                        onClick={() => setShowRawJson(!showRawJson)}
                        className="btn btn-secondary"
                        style={{ padding: "0.25rem 0.55rem", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: "0.3rem" }}
                      >
                        <Code2 size={12} />
                        {showRawJson ? "Hide JSON" : "View Raw JSON"}
                        {showRawJson ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>
                  </div>

                  {/* Primary Metric Value Callout (Big Stat) */}
                  {promqlResult.data?.result && promqlResult.data.result.length > 0 && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.75rem 1rem",
                      background: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid rgba(0, 242, 254, 0.2)",
                      borderRadius: "8px",
                      flexWrap: "wrap",
                      gap: "0.5rem"
                    }}>
                      <div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          EVALUATED METRIC
                        </div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>
                          {promqlResult.data.result[0]?.metric?.__name__ || promqlResult.query}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          CURRENT VALUE
                        </div>
                        <div style={{
                          fontSize: "1.5rem",
                          fontWeight: 800,
                          color: "var(--accent-emerald)",
                          fontFamily: "var(--font-mono)",
                          textShadow: "0 0 12px rgba(16, 185, 129, 0.3)"
                        }}>
                          {Array.isArray(promqlResult.data.result[0]?.value)
                            ? promqlResult.data.result[0].value[1]
                            : String(promqlResult.data.result[0]?.value || "0")}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Vector Series Table */}
                  {promqlResult.data?.result && promqlResult.data.result.length > 0 ? (
                    <div style={{ overflowX: "auto", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                        <thead>
                          <tr style={{ background: "rgba(30, 41, 59, 0.6)", borderBottom: "1px solid var(--border-subtle)" }}>
                            <th style={{ padding: "0.5rem 0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>Metric & Labels</th>
                            <th style={{ padding: "0.5rem 0.75rem", color: "var(--text-secondary)", fontWeight: 600, width: "140px" }}>Value</th>
                            <th style={{ padding: "0.5rem 0.75rem", color: "var(--text-secondary)", fontWeight: 600, width: "140px" }}>Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {promqlResult.data.result.map((item, idx) => {
                            const val = Array.isArray(item.value) ? item.value[1] : item.value;
                            const timestamp = Array.isArray(item.value)
                              ? new Date(item.value[0] * 1000).toLocaleTimeString()
                              : "Live";
                            const labelsObj = item.metric || {};

                            return (
                              <tr key={idx} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)", background: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.01)" }}>
                                <td style={{ padding: "0.6rem 0.75rem", fontFamily: "var(--font-mono)" }}>
                                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.35rem" }}>
                                    <span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>
                                      {labelsObj.__name__ || "metric"}
                                    </span>
                                    {Object.entries(labelsObj)
                                      .filter(([k]) => k !== "__name__")
                                      .map(([k, v]) => (
                                        <span key={k} style={{
                                          fontSize: "0.7rem",
                                          background: "rgba(30, 41, 59, 0.8)",
                                          border: "1px solid var(--border-subtle)",
                                          color: "#94a3b8",
                                          padding: "0.1rem 0.35rem",
                                          borderRadius: "4px"
                                        }}>
                                          {k}="{v}"
                                        </span>
                                      ))}
                                  </div>
                                </td>
                                <td style={{ padding: "0.6rem 0.75rem", fontFamily: "var(--font-mono)", color: "var(--accent-emerald)", fontWeight: 700, fontSize: "0.95rem" }}>
                                  {val}
                                </td>
                                <td style={{ padding: "0.6rem 0.75rem", color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                                  {timestamp}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: "0.85rem", color: "var(--accent-amber)", fontSize: "0.8rem" }}>
                      ⚠️ No vector series matched the query "{promqlResult.query}".
                    </div>
                  )}

                  {/* Raw JSON Inspector */}
                  {showRawJson && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                        Raw Prometheus JSON Payload:
                      </div>
                      <pre className="code-terminal" style={{ margin: 0, maxHeight: "200px", fontSize: "0.75rem" }}>
                        {JSON.stringify(promqlResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  padding: "1.5rem",
                  textAlign: "center",
                  border: "1px dashed var(--border-subtle)",
                  borderRadius: "8px",
                  color: "var(--text-secondary)",
                  fontSize: "0.82rem"
                }}>
                  Click a metric query above or enter a PromQL expression to execute.
                </div>
              )}
            </div>
          </div>

          {/* Prometheus Exporter Info Card */}
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Server size={17} color="var(--accent-cyan)" /> Prometheus Metrics Exporter Status
                </h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.25rem", margin: 0 }}>
                  Standard OpenMetrics scrape target active on Smart DevOps Assistant core API.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <a
                  href="http://localhost:5000/metrics"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
                >
                  <ExternalLink size={14} /> Open Raw /metrics
                </a>
                <span style={{
                  padding: "0.35rem 0.75rem",
                  borderRadius: "8px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  background: promStatus?.connected ? "rgba(16, 185, 129, 0.2)" : "rgba(59, 130, 246, 0.2)",
                  color: promStatus?.connected ? "var(--accent-emerald)" : "var(--accent-cyan)",
                  border: `1px solid ${promStatus?.connected ? "rgba(16, 185, 129, 0.4)" : "rgba(59, 130, 246, 0.4)"}`
                }}>
                  Mode: {promStatus?.connected ? "Active Prometheus Server (9090)" : "In-Process Registry (Self-Contained)"}
                </span>
              </div>
            </div>

            {/* Metric Metrics Badges */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginTop: "1rem" }}>
              <div style={{ background: "rgba(15, 23, 42, 0.5)", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>EXPOSURE PATH</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-cyan)", fontFamily: "monospace" }}>GET /metrics</div>
              </div>
              <div style={{ background: "rgba(15, 23, 42, 0.5)", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>TOTAL METRICS</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-emerald)" }}>{promStatus?.metricsCount || 33} Registered</div>
              </div>
              <div style={{ background: "rgba(15, 23, 42, 0.5)", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>PROMETHEUS SCRAPER</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: promStatus?.connected ? "var(--accent-emerald)" : "#f59e0b" }}>
                  {promStatus?.connected ? "Connected (Port 9090)" : "Listening for Scrapers"}
                </div>
              </div>
              <div style={{ background: "rgba(15, 23, 42, 0.5)", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>COMPATIBILITY</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-purple)" }}>OpenMetrics 0.0.4</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: GRAFANA DASHBOARDS ================= */}
      {activeTab === "grafana" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Grafana Launch Banner */}
          <div className="glass-panel" style={{
            padding: "1.5rem",
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)",
            border: "1px solid rgba(249, 115, 22, 0.3)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ maxWidth: "600px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <BarChart3 size={24} color="#f97316" />
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>
                    Grafana Enterprise Telemetry Dashboard
                  </h3>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                  Visualize CPU, Memory, Kubernetes pod lifecycle, and Chaos Engineering MTTR in real-time with Grafana’s industry-standard observability platform.
                </p>

                {/* Default Credentials Badge */}
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  background: "rgba(15, 23, 42, 0.8)",
                  padding: "0.4rem 0.8rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "0.75rem",
                  marginTop: "0.75rem"
                }}>
                  <span style={{ color: "var(--text-secondary)" }}>Default Credentials:</span>
                  <span style={{ color: "var(--accent-cyan)", fontFamily: "monospace" }}>User: admin</span>
                  <span style={{ color: "#64748b" }}>|</span>
                  <span style={{ color: "var(--accent-cyan)", fontFamily: "monospace" }}>Password: admin</span>
                </div>
              </div>

              {/* 1-Click Launch Button */}
              <a
                href="http://localhost:3000/d/smart-devops-telemetry/smart-devops-assistant-enterprise-telemetry"
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{
                  padding: "0.75rem 1.5rem",
                  fontSize: "0.9rem",
                  background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  boxShadow: "0 4px 14px rgba(249, 115, 22, 0.4)"
                }}
              >
                <ExternalLink size={16} /> Launch Grafana (Port 3000)
              </a>
            </div>
          </div>

          {/* Docker Compose Quickstart Card */}
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Server size={18} color="var(--accent-cyan)" /> 1-Command Production Monitoring Stack
            </h4>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
              Prometheus (port 9090) and Grafana (port 3000) are fully pre-configured in <code style={{ color: "var(--accent-cyan)" }}>docker-compose.yml</code> with automatic provisioning and dashboards.
            </p>

            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#090d16",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              fontFamily: "monospace",
              fontSize: "0.82rem",
              color: "#38bdf8"
            }}>
              <code>docker compose up -d prometheus grafana</code>
              <button
                onClick={() => copyToClipboard("docker compose up -d prometheus grafana")}
                className="btn btn-secondary"
                style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}
              >
                {copiedCmd ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                {copiedCmd ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Pre-Configured Dashboard Panels Showcase */}
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Layers size={18} color="var(--accent-purple)" /> Auto-Provisioned Grafana Panels
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem" }}>
              {[
                { title: "System CPU Utilization", type: "Gauge (0-100%)", metric: "devops_system_cpu_percent", color: "var(--accent-cyan)" },
                { title: "System Memory Consumption", type: "Gauge (0-100%)", metric: "devops_system_memory_percent", color: "var(--accent-purple)" },
                { title: "Active Healthy Pods", type: "Single Stat", metric: "devops_active_pods_count", color: "var(--accent-emerald)" },
                { title: "Chaos Engineering Faults", type: "Counter Stat", metric: "devops_chaos_faults_total", color: "var(--accent-rose)" },
                { title: "Resource Saturation History", type: "Time Series Graph", metric: "CPU & RAM over time", color: "#f59e0b" },
                { title: "HTTP Traffic & Agent Tasks", type: "Rate Series", metric: "rate(devops_http_requests_total[1m])", color: "var(--accent-indigo)" }
              ].map((panel, idx) => (
                <div key={idx} style={{
                  background: "rgba(15, 23, 42, 0.5)",
                  padding: "0.85rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-subtle)"
                }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{panel.title}</div>
                  <div style={{ fontSize: "0.72rem", color: panel.color, marginTop: "0.2rem", fontWeight: 600 }}>{panel.type}</div>
                  <div style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "var(--text-secondary)", marginTop: "0.3rem" }}>
                    Metric: {panel.metric}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Small Play SVG Icon for PromQL Run Button
function PlayIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
