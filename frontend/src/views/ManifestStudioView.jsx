import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import {
  FileCode2,
  Boxes,
  Download,
  Copy,
  Check,
  Sparkles,
  Server,
  Layers
} from "lucide-react";

export default function ManifestStudioView() {
  const [stackName, setStackName] = useState("nodejs");
  const [appName, setAppName] = useState("payment-service");
  const [port, setPort] = useState(3000);
  const [bundle, setBundle] = useState(null);
  const [activeArtifact, setActiveArtifact] = useState("dockerfile");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    handleGenerate();
  }, []);

  const handleGenerate = async () => {
    try {
      const res = await api.post("/manifests/generate", {
        stackName,
        appName,
        port: parseInt(port, 10) || 3000
      });
      setBundle(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getActiveContent = () => {
    if (!bundle) return "";
    if (activeArtifact === "dockerfile") return bundle.dockerfile;
    if (activeArtifact === "k8sDeployment") return bundle.k8sDeployment;
    if (activeArtifact === "k8sService") return bundle.k8sService;
    if (activeArtifact === "ciWorkflow") return bundle.ciWorkflow;
    return "";
  };

  const getFileName = () => {
    if (activeArtifact === "dockerfile") return "Dockerfile";
    if (activeArtifact === "k8sDeployment") return "deployment.yaml";
    if (activeArtifact === "k8sService") return "service.yaml";
    if (activeArtifact === "ciWorkflow") return "ci-cd.yaml";
    return "artifact.txt";
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([getActiveContent()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = getFileName();
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "1.25rem",
      height: "calc(100vh - 105px)",
      overflowY: "auto",
      paddingRight: "0.5rem"
    }}>
      {/* Configuration Header */}
      <div className="glass-panel" style={{
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Layers size={22} color="var(--accent-cyan)" /> DevOps Manifest & Container Generator Studio
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              Autonomous synthesis of production multi-stage Dockerfiles, Kubernetes manifests, and CI/CD workflows (Chapter 3.4.3).
            </p>
          </div>
          <span className="badge badge-info">IAC SYNTHESIZER</span>
        </div>

        {/* Input Parameters Form */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
              Application Stack:
            </label>
            <select
              className="input-control"
              value={stackName}
              onChange={(e) => setStackName(e.target.value)}
              style={{ marginTop: "0.4rem" }}
            >
              <option value="nodejs" style={{ background: "#0f172a" }}>Node.js Express API</option>
              <option value="react" style={{ background: "#0f172a" }}>React SPA (Vite + Nginx)</option>
              <option value="python" style={{ background: "#0f172a" }}>Python FastAPI</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
              Service Name:
            </label>
            <input
              type="text"
              className="input-control"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="e.g. payment-service"
              style={{ marginTop: "0.4rem" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
              Port:
            </label>
            <input
              type="number"
              className="input-control"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="3000"
              style={{ marginTop: "0.4rem" }}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            style={{ height: "42px" }}
          >
            <Sparkles size={16} /> Synthesize Manifests
          </button>
        </div>
      </div>

      {/* Artifact Viewer Panel */}
      <div className="glass-panel" style={{
        flex: 1,
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem"
      }}>
        {/* Artifact Subtabs */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.75rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className={`btn ${activeArtifact === "dockerfile" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.35rem 0.8rem", fontSize: "0.75rem" }}
              onClick={() => setActiveArtifact("dockerfile")}
            >
              Dockerfile (Multi-Stage)
            </button>
            <button
              className={`btn ${activeArtifact === "k8sDeployment" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.35rem 0.8rem", fontSize: "0.75rem" }}
              onClick={() => setActiveArtifact("k8sDeployment")}
            >
              Kubernetes Deployment YAML
            </button>
            <button
              className={`btn ${activeArtifact === "k8sService" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.35rem 0.8rem", fontSize: "0.75rem" }}
              onClick={() => setActiveArtifact("k8sService")}
            >
              Kubernetes Service YAML
            </button>
            <button
              className={`btn ${activeArtifact === "ciWorkflow" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.35rem 0.8rem", fontSize: "0.75rem" }}
              onClick={() => setActiveArtifact("ciWorkflow")}
            >
              GitHub Actions CI/CD
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="btn btn-secondary"
              onClick={handleCopy}
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
            >
              {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleDownload}
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
            >
              <Download size={14} /> Download ({getFileName()})
            </button>
          </div>
        </div>

        {/* Code Display Terminal */}
        <pre className="code-terminal" style={{ flex: 1, minHeight: "350px", fontSize: "0.85rem", overflowY: "auto" }}>
          {getActiveContent()}
        </pre>
      </div>
    </div>
  );
}
