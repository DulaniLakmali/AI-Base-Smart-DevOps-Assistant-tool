import React, { useState, useRef, useEffect } from "react";
import { api } from "../api/client";
import { Terminal, Send, Trash2, Play, Sparkles, AlertCircle } from "lucide-react";

export default function WebTerminalView() {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState([
    {
      command: "uptime && node -v",
      output: "System operational. Node.js v22.22.3 (DevOps Shell Active).",
      exitCode: 0,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [cmdHistoryList, setCmdHistoryList] = useState(["docker ps", "kubectl get pods"]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalBottomRef = useRef(null);

  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isExecuting]);

  const handleExec = async (cmdToRun) => {
    const targetCmd = (cmdToRun || command).trim();
    if (!targetCmd || isExecuting) return;

    setIsExecuting(true);
    setCommand("");
    setCmdHistoryList((prev) => [targetCmd, ...prev.filter((c) => c !== targetCmd)]);
    setHistoryIndex(-1);

    try {
      const res = await api.post("/terminal/exec", { command: targetCmd });
      setHistory((prev) => [
        ...prev,
        {
          command: targetCmd,
          output: res.data?.output || "No output returned.",
          exitCode: res.data?.exitCode ?? 0,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } catch (err) {
      setHistory((prev) => [
        ...prev,
        {
          command: targetCmd,
          output: err.response?.data?.error || err.message,
          exitCode: 1,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleExec();
    } else if (e.key === "ArrowUp") {
      if (cmdHistoryList.length > 0 && historyIndex < cmdHistoryList.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setCommand(cmdHistoryList[nextIdx]);
      }
    } else if (e.key === "ArrowDown") {
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setCommand(cmdHistoryList[nextIdx]);
      } else {
        setHistoryIndex(-1);
        setCommand("");
      }
    }
  };

  const QUICK_COMMANDS = [
    "docker ps",
    "kubectl get pods",
    "git status",
    "curl -I http://localhost:5000/api/health",
    "npm test"
  ];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      height: "calc(100vh - 105px)",
      overflow: "hidden"
    }}>
      {/* Header */}
      <div className="glass-panel" style={{
        padding: "1rem 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Terminal size={20} color="var(--accent-cyan)" /> DevOps Interactive Web Shell
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
            Execute authenticated commands on live Docker, Kubernetes, Git, and Node runtimes with RBAC verification.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => setHistory([])}
          style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }}
        >
          <Trash2 size={14} /> Clear Terminal
        </button>
      </div>

      {/* Quick Commands Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflowX: "auto" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          Quick Commands:
        </span>
        {QUICK_COMMANDS.map((qc, i) => (
          <button
            key={i}
            onClick={() => handleExec(qc)}
            disabled={isExecuting}
            style={{
              padding: "0.25rem 0.65rem",
              borderRadius: "15px",
              border: "1px solid var(--border-subtle)",
              background: "rgba(30, 41, 59, 0.6)",
              color: "var(--accent-cyan)",
              fontSize: "0.75rem",
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            $ {qc}
          </button>
        ))}
      </div>

      {/* Terminal Display */}
      <div className="code-terminal" style={{
        flex: 1,
        background: "#03060d",
        border: "1px solid rgba(0, 242, 254, 0.2)",
        borderRadius: "var(--radius-md)",
        padding: "1rem",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "0.8rem"
      }}>
        <div style={{ color: "#64748b", fontSize: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.4rem" }}>
          Horizon Smart DevOps Shell • Type any allowed command ('docker', 'kubectl', 'git', 'node', 'curl', 'npm')
        </div>

        {history.map((h, idx) => (
          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-emerald)" }}>
              <span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>devops@horizon-cluster:~$</span>
              <span style={{ color: "#f8fafc", fontWeight: 600 }}>{h.command}</span>
              <span style={{ marginLeft: "auto", color: "#64748b", fontSize: "0.7rem" }}>{h.timestamp}</span>
            </div>
            <pre style={{
              color: h.exitCode === 0 ? "#cbd5e1" : "var(--accent-rose)",
              paddingLeft: "1rem",
              whiteSpace: "pre-wrap",
              fontSize: "0.82rem",
              lineHeight: 1.4
            }}>
              {h.output}
            </pre>
          </div>
        ))}

        {isExecuting && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-cyan)" }}>
            <span className="pulsing-dot" style={{ background: "var(--accent-cyan)" }} />
            <span>Executing command...</span>
          </div>
        )}

        <div ref={terminalBottomRef} />
      </div>

      {/* Terminal Input Box */}
      <div className="glass-panel" style={{
        padding: "0.6rem 0.8rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem"
      }}>
        <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-cyan)", fontWeight: 700, fontSize: "0.85rem" }}>
          $
        </span>
        <input
          type="text"
          className="input-control"
          placeholder="Type DevOps command (e.g. 'docker ps', 'kubectl get pods', 'git status')..."
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isExecuting}
          style={{ border: "none", background: "transparent", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
        />
        <button
          className="btn btn-primary"
          onClick={() => handleExec()}
          disabled={isExecuting || !command.trim()}
          style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}
        >
          <Play size={14} /> Run
        </button>
      </div>
    </div>
  );
}
