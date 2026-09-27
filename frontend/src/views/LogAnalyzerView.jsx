import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import {
  FileCode2,
  Sparkles,
  AlertOctagon,
  Check,
  Copy,
  Terminal,
  ShieldCheck,
  Zap,
  Loader2,
  CheckCircle2
} from "lucide-react";

export default function LogAnalyzerView() {
  const [samples, setSamples] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [logText, setLogText] = useState("");
  const [logType, setLogType] = useState("api_log");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isRemediating, setIsRemediating] = useState(false);
  const [remediationResult, setRemediationResult] = useState(null);

  useEffect(() => {
    fetchSamples();
  }, []);

  const fetchSamples = async () => {
    try {
      const res = await api.get("/logs/samples");
      setSamples(res.data || []);
      if (res.data?.length > 0) {
        setSelectedSampleId(res.data[0].id);
        setLogText(res.data[0].content);
        setLogType(res.data[0].type);
      }
    } catch (err) {
      console.error("Failed to fetch log samples:", err);
    }
  };

  const handleSelectSample = (id) => {
    setSelectedSampleId(id);
    const s = samples.find((x) => x.id === id);
    if (s) {
      setLogText(s.content);
      setLogType(s.type);
      setDiagnosis(null);
      setRemediationResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!logText.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setDiagnosis(null);
    setRemediationResult(null);

    try {
      const res = await api.post("/logs/analyze", {
        logContent: logText,
        logType
      });
      setDiagnosis(res.data);
    } catch (err) {
      alert("Error analyzing log: " + (err.response?.data?.error || err.message));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExecuteRemediation = async () => {
    if (!diagnosis?.analysis?.remediationCommand || isRemediating) return;
    setIsRemediating(true);
    setRemediationResult(null);

    try {
      const currentSample = samples.find((x) => x.id === selectedSampleId);
      const res = await api.post("/logs/remediate", {
        incidentTitle: currentSample?.title || diagnosis.analysis.category,
        remediationCommand: diagnosis.analysis.remediationCommand,
        category: diagnosis.analysis.category
      });
      setRemediationResult(res.data);
    } catch (err) {
      alert("Remediation execution error: " + (err.response?.data?.error || err.message));
    } finally {
      setIsRemediating(false);
    }
  };

  const copyCommand = (cmd) => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      display: "flex",
      gap: "1rem",
      height: "calc(100vh - 105px)",
      overflow: "hidden"
    }}>
      {/* Left Input & Incident Chooser */}
      <div className="glass-panel" style={{
        flex: 1,
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        overflowY: "auto"
      }}>
        <div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FileCode2 size={20} color="var(--accent-cyan)" /> SRE Log Diagnostics Studio
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
            Autonomous Root Cause Analysis (RCA) and remediation generation for API, DB, and Kubernetes pod crashes.
          </p>
        </div>

        {/* Sample Scenario Picker */}
        <div>
          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
            Load Incident Scenario from Thesis Data:
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem", marginTop: "0.4rem" }}>
            {samples.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectSample(s.id)}
                style={{
                  padding: "0.6rem 0.8rem",
                  borderRadius: "var(--radius-sm)",
                  border: selectedSampleId === s.id ? "1px solid var(--accent-cyan)" : "1px solid var(--border-subtle)",
                  background: selectedSampleId === s.id ? "rgba(0, 242, 254, 0.12)" : "rgba(15, 23, 42, 0.6)",
                  color: selectedSampleId === s.id ? "var(--accent-cyan)" : "var(--text-primary)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease"
                }}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Raw Log Input Terminal */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
              Raw Stack Trace / Container Logs:
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--accent-indigo)" }}>
              {logText.length} characters (Secrets auto-redacted)
            </span>
          </div>
          <textarea
            className="code-terminal"
            value={logText}
            onChange={(e) => setLogText(e.target.value)}
            placeholder="Paste your raw application or container crash log here..."
            style={{
              flex: 1,
              minHeight: "180px",
              resize: "none",
              outline: "none",
              border: "1px solid var(--border-subtle)"
            }}
          />
        </div>

        {/* Action Button */}
        <button
          className="btn btn-primary"
          onClick={handleAnalyze}
          disabled={isAnalyzing || !logText.trim()}
          style={{ width: "100%", padding: "0.8rem" }}
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={18} className="spinning" /> Analyzing Stack Trace with Agent...
            </>
          ) : (
            <>
              <Sparkles size={18} /> Execute AI Root Cause Analysis (RCA)
            </>
          )}
        </button>
      </div>

      {/* Right AI Diagnosis Results */}
      <div className="glass-panel" style={{
        flex: 1,
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        overflowY: "auto"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.75rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Zap size={18} color="var(--accent-amber)" /> AI Diagnostics & Remediation
          </h3>
          {diagnosis && (
            <span className="badge badge-info" style={{ fontSize: "0.7rem" }}>
              {diagnosis.provider} ({diagnosis.latencyMs}ms)
            </span>
          )}
        </div>

        {diagnosis ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Category and Severity Pill */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span className={`badge ${diagnosis.analysis.severity === "CRITICAL" ? "badge-danger" : diagnosis.analysis.severity === "HIGH" ? "badge-warning" : "badge-info"}`} style={{ fontSize: "0.8rem", padding: "0.3rem 0.75rem" }}>
                SEVERITY: {diagnosis.analysis.severity}
              </span>
              <span className="badge badge-purple" style={{ fontSize: "0.8rem", padding: "0.3rem 0.75rem" }}>
                TYPE: {diagnosis.analysis.category}
              </span>
            </div>

            {/* Root Cause Card */}
            <div style={{
              background: "rgba(15, 23, 42, 0.7)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "1rem"
            }}>
              <h4 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-cyan)", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                Root Cause Analysis (RCA):
              </h4>
              <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.5 }}>
                {diagnosis.analysis.rootCause}
              </p>
            </div>

            {/* Immediate Fix */}
            <div style={{
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              borderRadius: "var(--radius-md)",
              padding: "1rem"
            }}>
              <h4 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-emerald)", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                Immediate Remediation Action:
              </h4>
              <p style={{ fontSize: "0.88rem", color: "var(--text-primary)", lineHeight: 1.5 }}>
                {diagnosis.analysis.immediateFix}
              </p>
            </div>

            {/* Prevention Strategy */}
            <div style={{
              background: "rgba(99, 102, 241, 0.08)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              borderRadius: "var(--radius-md)",
              padding: "1rem"
            }}>
              <h4 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-indigo)", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                Architectural Prevention:
              </h4>
              <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {diagnosis.analysis.prevention}
              </p>
            </div>

            {/* Command / Patch to execute */}
            {diagnosis.analysis.remediationCommand && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                    Automated Remediation Command:
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                      onClick={() => copyCommand(diagnosis.analysis.remediationCommand)}
                      className="btn btn-secondary"
                      style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
                    </button>
                    <button
                      onClick={handleExecuteRemediation}
                      disabled={isRemediating}
                      className="btn btn-primary"
                      style={{
                        padding: "0.35rem 0.85rem",
                        fontSize: "0.75rem",
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        border: "none",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem"
                      }}
                    >
                      {isRemediating ? <Loader2 size={13} className="spinning" /> : <Zap size={13} />}
                      {isRemediating ? "Remediating..." : "Execute Self-Healing"}
                    </button>
                  </div>
                </div>
                <div className="code-terminal" style={{ padding: "0.8rem", color: "var(--accent-cyan)" }}>
                  $ {diagnosis.analysis.remediationCommand}
                </div>

                {/* Autonomous Remediation Result Feedback Card */}
                {remediationResult && (
                  <div style={{
                    marginTop: "0.75rem",
                    padding: "1rem",
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <CheckCircle2 size={18} color="var(--accent-emerald)" />
                        <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--accent-emerald)" }}>
                          AUTONOMOUS SELF-HEALING COMPLETE
                        </span>
                      </div>
                      <span className="badge badge-success">
                        Plan #{remediationResult.taskId} • {remediationResult.status}
                      </span>
                    </div>

                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
                      {remediationResult.message} Dispatched by ExecutorAgent and registered in the Audit Ledger.
                    </p>

                    <div className="code-terminal" style={{ fontSize: "0.75rem", padding: "0.6rem", background: "#05080f", whiteSpace: "pre-wrap", color: "var(--accent-emerald)" }}>
                      {remediationResult.log}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>
            <FileCode2 size={40} color="var(--border-subtle)" style={{ marginBottom: "1rem" }} />
            <p style={{ fontSize: "0.9rem" }}>Select a pre-loaded incident scenario or paste an error log on the left.</p>
            <p style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>Click "Execute AI Root Cause Analysis" to diagnose.</p>
          </div>
        )}
      </div>
    </div>
  );
}
