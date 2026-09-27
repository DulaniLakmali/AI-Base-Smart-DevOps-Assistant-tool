import React from "react";
import {
  Bot,
  LayoutDashboard,
  GitBranch,
  FileCode2,
  Boxes,
  Activity,
  ShieldAlert,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Terminal,
  Layers
} from "lucide-react";
import { Github } from "./GithubIcon";

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: "agent", label: "AI Agent Console", icon: Bot, badge: "CORE" },
    { id: "dashboard", label: "DevOps Overview", icon: LayoutDashboard },
    { id: "github", label: "GitHub Cloud Connector", icon: Github, badge: "GIT" },
    { id: "pipelines", label: "CI/CD Pipelines", icon: GitBranch },
    { id: "logs", label: "Log RCA Studio", icon: FileCode2, badge: "AI" },
    { id: "terminal", label: "Interactive Web Shell", icon: Terminal, badge: "CLI" },
    { id: "manifests", label: "Manifest & Container Studio", icon: Layers, badge: "GEN" },
    { id: "secops", label: "DevSecOps Scanner", icon: ShieldCheck, badge: "SEC" },
    { id: "rag", label: "RAG Knowledge Base", icon: BookOpen, badge: "RAG" },
    { id: "infra", label: "Infrastructure Hub", icon: Boxes },
    { id: "metrics", label: "Metrics & Chaos Lab", icon: Activity },
    { id: "audit", label: "Audit Ledger", icon: ShieldAlert },
    { id: "report", label: "Thesis Report & MTTR", icon: GraduationCap, badge: "DATA" }
  ];

  return (
    <aside className="glass-panel" style={{
      width: "260px",
      margin: "0 0 0.75rem 1rem",
      padding: "1rem 0.75rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.25rem",
      height: "calc(100vh - 105px)",
      flexShrink: 0
    }}>
      <div style={{ padding: "0.25rem 0.75rem 0.5rem", borderBottom: "1px solid var(--border-subtle)" }}>
        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.08em" }}>
          DEVOPS PLATFORM
        </span>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "0.2rem", marginTop: "0.4rem", overflowY: "auto" }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.6rem 0.75rem",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: isActive ? "linear-gradient(90deg, rgba(0, 242, 254, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)" : "transparent",
                color: isActive ? "var(--accent-cyan)" : "var(--text-secondary)",
                fontWeight: isActive ? 600 : 500,
                fontSize: "0.8rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
                textAlign: "left",
                borderLeft: isActive ? "3px solid var(--accent-cyan)" : "3px solid transparent"
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <Icon size={16} color={isActive ? "var(--accent-cyan)" : "currentColor"} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`badge ${
                  item.badge === "CORE" ? "badge-info" :
                  item.badge === "GIT" ? "badge-purple" :
                  item.badge === "SEC" ? "badge-success" :
                  item.badge === "CLI" ? "badge-info" :
                  item.badge === "GEN" ? "badge-purple" :
                  item.badge === "RAG" ? "badge-purple" :
                  item.badge === "DATA" ? "badge-warning" : "badge-info"
                }`} style={{ fontSize: "0.55rem", padding: "0.1rem 0.35rem" }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Assistant Status Footer */}
      <div style={{
        marginTop: "auto",
        padding: "0.75rem",
        background: "rgba(15, 23, 42, 0.5)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-subtle)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
          <span className="pulsing-dot" style={{ background: "var(--accent-emerald)" }} />
          <span style={{ fontSize: "0.72rem", fontWeight: 600 }}>Multi-Agent System</span>
        </div>
        <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>
          Planner • SRE • Shell • DevSecOps • RAG
        </p>
      </div>
    </aside>
  );
}
