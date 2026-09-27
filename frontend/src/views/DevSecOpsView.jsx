import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileCode,
  CheckCircle2,
  Sparkles,
  Loader2,
  Lock,
  Zap
} from "lucide-react";

export default function DevSecOpsView() {
  const [samples, setSamples] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [configContent, setConfigContent] = useState("");
  const [configType, setConfigType] = useState("dockerfile");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    fetchSamples();
  }, []);

  const fetchSamples = async () => {
    try {
      const res = await api.get("/security/samples");
      setSamples(res.data || []);
      if (res.data?.length > 0) {
        setSelectedSampleId(res.data[0].id);
        setConfigContent(res.data[0].content);
        setConfigType(res.data[0].type);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectSample = (id) => {
    setSelectedSampleId(id);
    const s = samples.find((x) => x.id === id);
    if (s) {
      setConfigContent(s.content);
      setConfigType(s.type);
      setScanResult(null);
    }
  };

  const handleScan = async () => {
    if (!configContent.trim() || isScanning) return;
    setIsScanning(true);
    setScanResult(null);
    try {
      const res = await api.post("/security/scan", {
        content: configContent,
        type: configType
      });
      setScanResult(res.data);
    } catch (err) {
      alert("Scan error: " + (err.response?.data?.error || err.message));
    } finally {
      setIsScanning(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade === "A") return "var(--accent-emerald)";
    if (grade === "B") return "var(--accent-cyan)";
    if (grade === "C") return "var(--accent-amber)";
    return "var(--accent-rose)";
  };

  return (
    <div style={{
      display: "flex",
      gap: "1rem",
      height: "calc(100vh - 105px)",
      overflow: "hidden"
    }}>
      {/* Left Config Input */}
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
            <ShieldCheck size={20} color="var(--accent-emerald)" /> DevSecOps Compliance & Vulnerability Scanner
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
            Automated Static Analysis Security Testing (SAST) for Dockerfiles and Kubernetes manifests (Chapter 7.6).
          </p>
        </div>

        {/* Sample Selection */}
        <div>
          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
            Load Audit Test Scenario:
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.4rem" }}>
            {samples.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectSample(s.id)}
                style={{
                  padding: "0.5rem 0.8rem",
                  borderRadius: "var(--radius-sm)",
                  border: selectedSampleId === s.id ? "1px solid var(--accent-cyan)" : "1px solid var(--border-subtle)",
                  background: selectedSampleId === s.id ? "rgba(0, 242, 254, 0.12)" : "rgba(15, 23, 42, 0.6)",
                  color: selectedSampleId === s.id ? "var(--accent-cyan)" : "var(--text-primary)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Code Editor Area */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
              Target {configType.toUpperCase()} Configuration:
            </span>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button
                className={`btn ${configType === "dockerfile" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "0.2rem 0.6rem", fontSize: "0.7rem" }}
                onClick={() => setConfigType("dockerfile")}
              >
                Dockerfile
              </button>
              <button
                className={`btn ${configType === "kubernetes" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "0.2rem 0.6rem", fontSize: "0.7rem" }}
                onClick={() => setConfigType("kubernetes")}
              >
                Kubernetes YAML
              </button>
            </div>
          </div>

          <textarea
            className="code-terminal"
            value={configContent}
            onChange={(e) => setConfigContent(e.target.value)}
            style={{ flex: 1, minHeight: "200px", resize: "none", outline: "none" }}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleScan}
          disabled={isScanning || !configContent.trim()}
          style={{ width: "100%", padding: "0.8rem" }}
        >
          {isScanning ? (
            <>
              <Loader2 size={18} className="spinning" /> Scanning for Vulnerabilities...
            </>
          ) : (
            <>
              <ShieldAlert size={18} /> Execute DevSecOps Security Audit
            </>
          )}
        </button>
      </div>

      {/* Right Scan Report */}
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
            <Lock size={18} color="var(--accent-indigo)" /> Security Audit Report & Findings
          </h3>
          {scanResult && (
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Scanned: {new Date(scanResult.scannedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        {scanResult ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Score & Grade Banner */}
            <div style={{
              background: "rgba(15, 23, 42, 0.8)",
              border: `1px solid ${getGradeColor(scanResult.grade)}`,
              borderRadius: "var(--radius-md)",
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                  Security Posture Score
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: getGradeColor(scanResult.grade), marginTop: "0.2rem" }}>
                  {scanResult.score} / 100
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                  Compliance Grade
                </div>
                <div style={{ fontSize: "2.2rem", fontWeight: 900, color: getGradeColor(scanResult.grade) }}>
                  GRADE {scanResult.grade}
                </div>
              </div>
            </div>

            {/* Findings List */}
            <div>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                Identified Security Misconfigurations ({scanResult.findingsCount}):
              </h4>

              {scanResult.findings.length === 0 ? (
                <div style={{
                  padding: "1rem",
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "var(--accent-emerald)"
                }}>
                  <CheckCircle2 size={18} /> Configuration adheres to CIS Benchmarks! Zero critical issues found.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {scanResult.findings.map((f, i) => (
                    <div key={i} style={{
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      padding: "0.9rem"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{f.rule}</span>
                        <span className={`badge ${f.severity === "CRITICAL" ? "badge-danger" : f.severity === "HIGH" ? "badge-warning" : "badge-info"}`}>
                          {f.severity}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                        {f.description}
                      </p>
                      <div style={{
                        background: "#05080f",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.75rem",
                        fontFamily: "var(--font-mono)",
                        color: "var(--accent-cyan)",
                        border: "1px solid var(--border-subtle)"
                      }}>
                        Fix: {f.remediation}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>
            <ShieldAlert size={40} color="var(--border-subtle)" style={{ marginBottom: "1rem" }} />
            <p style={{ fontSize: "0.9rem" }}>Select a Dockerfile or Kubernetes YAML on the left to start scanning.</p>
            <p style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>Audits compliance against CIS container security standards.</p>
          </div>
        )}
      </div>
    </div>
  );
}
