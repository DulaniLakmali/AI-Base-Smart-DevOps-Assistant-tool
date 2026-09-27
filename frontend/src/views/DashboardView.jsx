import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import {
  Cpu,
  Database,
  HardDrive,
  Boxes,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  GitBranch,
  ShieldCheck,
  Zap
} from "lucide-react";
import { Github } from "../components/GithubIcon";

export default function DashboardView({ telemetry, onNavigate }) {
  const [plans, setPlans] = useState([]);
  const [pipelines, setPipelines] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [plansRes, pipesRes] = await Promise.all([
        api.get("/plans"),
        api.get("/devops/ci/pipelines")
      ]);
      setPlans(plansRes.data || []);
      setPipelines(pipesRes.data || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  };

  const cpuVal = telemetry?.cpu || 48.5;
  const memVal = telemetry?.memory || 62.0;
  const isCpuHigh = cpuVal > 85;
  const isMemHigh = memVal > 80;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "1.25rem",
      height: "calc(100vh - 105px)",
      overflowY: "auto",
      paddingRight: "0.5rem"
    }}>
      {/* Top Banner Alert (Proactive AI Detection) */}
      {(isCpuHigh || isMemHigh) && (
        <div style={{
          background: "linear-gradient(90deg, rgba(239, 68, 68, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%)",
          border: "1px solid rgba(239, 68, 68, 0.4)",
          borderRadius: "var(--radius-md)",
          padding: "0.9rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <AlertTriangle size={22} color="var(--accent-rose)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                {isCpuHigh ? "Proactive Alert: CPU Saturation Detected (>85%)" : "Proactive Alert: High Memory Consumption (>80%)"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                Monitoring Agent recommends scaling replicas to mitigate latency spikes.
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ padding: "0.4rem 0.9rem", fontSize: "0.75rem" }}
            onClick={() => onNavigate("metrics")}
          >
            Inspect in Chaos Lab <ArrowUpRight size={14} />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        {/* CPU Card */}
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>CPU UTILIZATION</span>
            <div style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(0, 242, 254, 0.15)" }}>
              <Cpu size={18} color="var(--accent-cyan)" />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: isCpuHigh ? "var(--accent-rose)" : "var(--text-primary)" }}>
            {cpuVal.toFixed(1)}%
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", fontSize: "0.75rem" }}>
            <span className={`badge ${isCpuHigh ? "badge-danger" : "badge-success"}`}>
              {isCpuHigh ? "Threshold Violated" : "Optimal"}
            </span>
            <span style={{ color: "var(--text-muted)" }}>Target &lt; 85%</span>
          </div>
        </div>

        {/* Memory Card */}
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>MEMORY CONSUMPTION</span>
            <div style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(99, 102, 241, 0.15)" }}>
              <Database size={18} color="var(--accent-indigo)" />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: isMemHigh ? "var(--accent-rose)" : "var(--text-primary)" }}>
            {memVal.toFixed(1)}%
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", fontSize: "0.75rem" }}>
            <span className={`badge ${isMemHigh ? "badge-danger" : "badge-success"}`}>
              {isMemHigh ? "Warning" : "Healthy"}
            </span>
            <span style={{ color: "var(--text-muted)" }}>Target &lt; 80%</span>
          </div>
        </div>

        {/* Disk Card */}
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>NVMe DISK STORAGE</span>
            <div style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(16, 185, 129, 0.15)" }}>
              <HardDrive size={18} color="var(--accent-emerald)" />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>
            {telemetry?.disk ? telemetry.disk.toFixed(1) : "54.2"}%
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", fontSize: "0.75rem" }}>
            <span className="badge badge-success">Sufficient</span>
            <span style={{ color: "var(--text-muted)" }}>500 GB Provisioned</span>
          </div>
        </div>

        {/* Active Pods Card */}
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>K8S ACTIVE REPLICAS</span>
            <div style={{ padding: "0.4rem", borderRadius: "8px", background: "rgba(245, 158, 11, 0.15)" }}>
              <Boxes size={18} color="var(--accent-amber)" />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>
            {telemetry?.activePods || 4} Pods
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", fontSize: "0.75rem" }}>
            <span className="badge badge-info">Production Cluster</span>
          </div>
        </div>
      </div>

      {/* Two-Column Middle Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1rem" }}>
        {/* Recent Autonomous Task Plans */}
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Zap size={18} color="var(--accent-cyan)" /> Recent Autonomous Plans
            </h3>
            <button
              onClick={() => onNavigate("agent")}
              style={{ background: "transparent", border: "none", color: "var(--accent-cyan)", fontSize: "0.75rem", cursor: "pointer" }}
            >
              Open AI Console &rarr;
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {plans.slice(0, 4).map((p) => (
              <div key={p.task_id} style={{
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                padding: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    {p.plan_summary || p.query}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                    Requested by {p.requested_by || "DevOps Engineer"} • Plan #{p.task_id}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className={`badge ${p.risk_level === "HIGH_RISK" ? "badge-danger" : p.risk_level === "MODERATE" ? "badge-warning" : "badge-success"}`}>
                    {p.risk_level}
                  </span>
                  <span className={`badge ${p.status === "success" || p.status === "completed" ? "badge-success" : p.status === "awaiting_approval" ? "badge-danger" : "badge-info"}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tool Integration Status */}
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShieldCheck size={18} color="var(--accent-emerald)" /> Connected DevOps Toolchain
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Boxes size={16} color="var(--accent-blue)" />
                <span style={{ fontSize: "0.85rem" }}>Docker Engine / Daemon</span>
              </div>
              <span className="badge badge-success">Online (v29.7.2)</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Activity size={16} color="var(--accent-indigo)" />
                <span style={{ fontSize: "0.85rem" }}>Kubernetes Cluster (kubectl)</span>
              </div>
              <span className="badge badge-success">Client v1.36.1 Ready</span>
            </div>

            <div
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-subtle)", cursor: "pointer" }}
              onClick={() => onNavigate("github")}
              title="Click to open GitHub Cloud Connector"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Github size={16} color="var(--accent-cyan)" />
                <span style={{ fontSize: "0.85rem" }}>GitHub Cloud API & Actions</span>
              </div>
              <span className="badge badge-info">Connected</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <GitBranch size={16} color="var(--accent-cyan)" />
                <span style={{ fontSize: "0.85rem" }}>GitHub Actions CI Runner</span>
              </div>
              <span className="badge badge-success">Runner Active</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Database size={16} color="var(--accent-amber)" />
                <span style={{ fontSize: "0.85rem" }}>Terraform / AWS Sandbox</span>
              </div>
              <span className="badge badge-success">State Synchronized</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
