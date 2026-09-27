import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import {
  Boxes,
  RotateCw,
  Power,
  Server,
  Cloud,
  FileCode,
  CheckCircle2,
  Play,
  Plus,
  Minus
} from "lucide-react";

export default function InfrastructureView() {
  const [activeSubTab, setActiveSubTab] = useState("k8s");
  const [containers, setContainers] = useState([]);
  const [pods, setPods] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [cloudResources, setCloudResources] = useState([]);
  const [tfType, setTfType] = useState("aws_instance");
  const [generatedHcl, setGeneratedHcl] = useState("");
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionMessage, setProvisionMessage] = useState("");

  useEffect(() => {
    fetchInfraData();
  }, []);

  const fetchInfraData = async () => {
    try {
      const [cntRes, podsRes, depsRes, cloudRes] = await Promise.all([
        api.get("/devops/containers"),
        api.get("/devops/k8s/pods"),
        api.get("/devops/k8s/deployments"),
        api.get("/devops/infra/resources")
      ]);
      setContainers(cntRes.data || []);
      setPods(podsRes.data || []);
      setDeployments(depsRes.data || []);
      setCloudResources(cloudRes.data || []);

      // Generate default Terraform preview
      const hclRes = await api.post("/devops/infra/generate-hcl", { resourceType: "aws_instance" });
      setGeneratedHcl(hclRes.data?.hcl || "");
    } catch (err) {
      console.error("Failed to fetch infra data:", err);
    }
  };

  const handleScaleK8s = async (depName, newReplicas) => {
    if (newReplicas < 1) return;
    try {
      await api.post("/devops/k8s/scale", { name: depName, replicas: newReplicas });
      fetchInfraData();
    } catch (err) {
      alert("Scaling error: " + (err.response?.data?.error || err.message));
    }
  };

  const handleRestartPod = async (podName) => {
    try {
      await api.post(`/devops/k8s/pods/${podName}/restart`);
      fetchInfraData();
    } catch (err) {
      alert("Restart error: " + (err.response?.data?.error || err.message));
    }
  };

  const handleRestartContainer = async (containerId) => {
    try {
      await api.post(`/devops/containers/${containerId}/restart`);
      fetchInfraData();
    } catch (err) {
      alert("Restart container error: " + (err.response?.data?.error || err.message));
    }
  };

  const handleGenerateTf = async (type) => {
    setTfType(type);
    try {
      const res = await api.post("/devops/infra/generate-hcl", { resourceType: type });
      setGeneratedHcl(res.data?.hcl || "");
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyTf = async () => {
    setIsProvisioning(true);
    setProvisionMessage("");
    try {
      const res = await api.post("/devops/infra/provision", {
        name: `worker-node-${Math.floor(Math.random() * 900 + 100)}`,
        type: tfType
      });
      setProvisionMessage(res.data?.terraformOutput || "Provisioned successfully!");
      fetchInfraData();
    } catch (err) {
      alert("Terraform error: " + (err.response?.data?.error || err.message));
    } finally {
      setIsProvisioning(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      height: "calc(100vh - 105px)",
      overflowY: "auto",
      paddingRight: "0.5rem"
    }}>
      {/* Subtab Navigation Header */}
      <div className="glass-panel" style={{
        padding: "0.75rem 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Boxes size={20} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Infrastructure & Workload Hub</h2>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className={`btn ${activeSubTab === "k8s" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "0.4rem 0.9rem", fontSize: "0.8rem" }}
            onClick={() => setActiveSubTab("k8s")}
          >
            Kubernetes Workloads ({pods.length})
          </button>
          <button
            className={`btn ${activeSubTab === "docker" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "0.4rem 0.9rem", fontSize: "0.8rem" }}
            onClick={() => setActiveSubTab("docker")}
          >
            Docker Containers ({containers.length})
          </button>
          <button
            className={`btn ${activeSubTab === "terraform" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "0.4rem 0.9rem", fontSize: "0.8rem" }}
            onClick={() => setActiveSubTab("terraform")}
          >
            Terraform IaC Studio
          </button>
        </div>
      </div>

      {/* --- KUBERNETES VIEW --- */}
      {activeSubTab === "k8s" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Deployments Section with Scale Controls */}
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--accent-cyan)" }}>
              Active Kubernetes Deployments
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              {deployments.map((dep) => (
                <div key={dep.name} style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "1rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{dep.name}</span>
                    <span className="badge badge-info">{dep.namespace}</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                    Image: <span style={{ color: "var(--text-primary)" }}>{dep.image}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      Replicas: <span style={{ color: "var(--accent-cyan)" }}>{dep.replicas}</span>
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem" }}
                        onClick={() => handleScaleK8s(dep.name, dep.replicas - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem" }}
                        onClick={() => handleScaleK8s(dep.name, dep.replicas + 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pods Table */}
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem" }}>
              Kubernetes Pod State Registry
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--text-secondary)" }}>
                  <th style={{ padding: "0.6rem" }}>Pod Name</th>
                  <th style={{ padding: "0.6rem" }}>Status</th>
                  <th style={{ padding: "0.6rem" }}>Restarts</th>
                  <th style={{ padding: "0.6rem" }}>CPU</th>
                  <th style={{ padding: "0.6rem" }}>Memory</th>
                  <th style={{ padding: "0.6rem" }}>Node</th>
                  <th style={{ padding: "0.6rem", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pods.map((pod) => (
                  <tr key={pod.name} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                    <td style={{ padding: "0.6rem", fontFamily: "var(--font-mono)" }}>{pod.name}</td>
                    <td style={{ padding: "0.6rem" }}>
                      <span className={`badge ${pod.status === "Running" ? "badge-success" : "badge-danger"}`}>
                        {pod.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.6rem" }}>{pod.restarts}</td>
                    <td style={{ padding: "0.6rem" }}>{pod.cpu}</td>
                    <td style={{ padding: "0.6rem" }}>{pod.memory}</td>
                    <td style={{ padding: "0.6rem", color: "var(--text-muted)" }}>{pod.node}</td>
                    <td style={{ padding: "0.6rem", textAlign: "right" }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                        onClick={() => handleRestartPod(pod.name)}
                      >
                        <RotateCw size={12} /> Restart
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- DOCKER CONTAINERS VIEW --- */}
      {activeSubTab === "docker" && (
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            Docker Engine Containers
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--text-secondary)" }}>
                <th style={{ padding: "0.6rem" }}>Container Name</th>
                <th style={{ padding: "0.6rem" }}>Image</th>
                <th style={{ padding: "0.6rem" }}>Status</th>
                <th style={{ padding: "0.6rem" }}>Ports</th>
                <th style={{ padding: "0.6rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {containers.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                  <td style={{ padding: "0.6rem", fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: "0.6rem", fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}>{c.image}</td>
                  <td style={{ padding: "0.6rem" }}>
                    <span className="badge badge-success">{c.status}</span>
                  </td>
                  <td style={{ padding: "0.6rem", color: "var(--text-secondary)" }}>{c.ports}</td>
                  <td style={{ padding: "0.6rem", textAlign: "right" }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                      onClick={() => handleRestartContainer(c.id)}
                    >
                      <RotateCw size={12} /> Restart
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- TERRAFORM STUDIO VIEW --- */}
      {activeSubTab === "terraform" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1rem" }}>
          {/* Left: Code Generator */}
          <div className="glass-panel" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                Declarative Terraform HCL Generator
              </h3>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  className={`btn ${tfType === "aws_instance" ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem" }}
                  onClick={() => handleGenerateTf("aws_instance")}
                >
                  EC2 Instance
                </button>
                <button
                  className={`btn ${tfType === "aws_s3_bucket" ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem" }}
                  onClick={() => handleGenerateTf("aws_s3_bucket")}
                >
                  S3 Bucket
                </button>
              </div>
            </div>

            <textarea
              className="code-terminal"
              value={generatedHcl}
              onChange={(e) => setGeneratedHcl(e.target.value)}
              style={{ minHeight: "260px", resize: "none", outline: "none" }}
            />

            <button
              className="btn btn-primary"
              onClick={handleApplyTf}
              disabled={isProvisioning}
              style={{ alignSelf: "flex-end" }}
            >
              <Play size={14} /> {isProvisioning ? "Provisioning..." : "Simulate Terraform Apply"}
            </button>

            {provisionMessage && (
              <div className="code-terminal" style={{ color: "var(--accent-emerald)" }}>
                {provisionMessage}
              </div>
            )}
          </div>

          {/* Right: Provisioned Cloud Resources */}
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem" }}>
              Provisioned Cloud Resources (AWS Simulation)
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {cloudResources.map((r) => (
                <div key={r.id} style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.75rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{r.name}</span>
                    <span className="badge badge-success">{r.status}</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                    Type: <span style={{ color: "var(--accent-cyan)" }}>{r.type}</span> • Size: {r.size}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                    Region: {r.region} • Cost: {r.cost}
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
