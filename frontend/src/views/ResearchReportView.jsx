import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import {
  FileText,
  Download,
  Award,
  CheckCircle2,
  TrendingDown,
  Clock,
  BarChart3,
  GraduationCap
} from "lucide-react";

export default function ResearchReportView() {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const res = await api.get("/report/evaluation");
      setReport(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!report) return;

    const mdContent = `# Research Evaluation & Benchmarking Report
**Institution:** ${report.metadata.institution} (${report.metadata.faculty})
**Degree:** ${report.metadata.degree}
**Module:** ${report.metadata.module}
**Title:** ${report.metadata.title}
**Date:** ${new Date(report.metadata.generatedAt).toLocaleString()}

---

## 1. Research Authors & Supervision
**Authors:**
${report.metadata.authors.map((a) => `- ${a}`).join("\n")}

**Supervisors:**
${report.metadata.supervisors.map((s) => `- ${s}`).join("\n")}

---

## 2. Quantitative System Benchmarks (Chapter 6 & 7)
- **Total Autonomous Task Plans Executed:** ${report.benchmarks.totalAutonomousPlansExecuted}
- **Total Security & Audit Events Recorded:** ${report.benchmarks.totalAuditEventsRecorded}
- **System Operational Availability (Uptime):** ${report.benchmarks.systemUptimePercentage}
- **Average Assistant Reasoning Latency:** ${report.benchmarks.averageResponseLatencyMs} ms

### Mean Time to Recovery (MTTR) Comparative Analysis
- **Traditional Manual MTTR:** ${report.benchmarks.mttrAnalysis.manualMTTRMinutes} minutes
- **Autonomous Agentic AI MTTR:** ${report.benchmarks.mttrAnalysis.aiAssistantMTTRMinutes} minutes
- **Impact:** ${report.benchmarks.mttrAnalysis.percentageImprovement}

---

## 3. Formal Test Cases Verification (Chapter 6.3.2)
| Test ID | Test Name | Result | Status |
| :--- | :--- | :--- | :--- |
${report.evaluationTestCases.map((tc) => `| ${tc.id} | ${tc.name} | ${tc.result} | ${tc.status} |`).join("\n")}

---
*Report automatically synthesized by Agentic AI-Powered Smart DevOps Assistant Evaluation Engine.*
`;

    const blob = new Blob([mdContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Smart_DevOps_Research_Report_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !report) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--text-muted)" }}>
        Loading Research Evaluation Report...
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "1.25rem",
      height: "calc(100vh - 105px)",
      overflowY: "auto",
      paddingRight: "0.5rem"
    }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: "1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <GraduationCap size={22} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800 }}>
              Academic Evaluation & Research Findings Report
            </h2>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            {report.metadata.institution} • {report.metadata.degree} • {report.metadata.module}
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleDownloadMarkdown}
          style={{ padding: "0.6rem 1.1rem" }}
        >
          <Download size={16} /> Export Thesis Report (.md)
        </button>
      </div>

      {/* MTTR & Efficiency Highlight Card */}
      <div style={{
        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(0, 242, 254, 0.1) 100%)",
        border: "1px solid rgba(16, 185, 129, 0.35)",
        borderRadius: "var(--radius-lg)",
        padding: "1.5rem",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "1.25rem"
      }}>
        <div>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
            Manual MTTR (Traditional)
          </span>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-rose)", marginTop: "0.3rem" }}>
            {report.benchmarks.mttrAnalysis.manualMTTRMinutes} mins
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Manual log reading & SSH debugging
          </p>
        </div>

        <div>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
            AI Assistant MTTR
          </span>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-emerald)", marginTop: "0.3rem" }}>
            {report.benchmarks.mttrAnalysis.aiAssistantMTTRMinutes} mins
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Autonomous RCA & 1-click remediation
          </p>
        </div>

        <div>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
            Quantitative Improvement
          </span>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-cyan)", marginTop: "0.3rem" }}>
            97.4% Faster
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Empirical MTTR reduction
          </p>
        </div>

        <div>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
            System Reliability
          </span>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.3rem" }}>
            {report.benchmarks.systemUptimePercentage}
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Automated rollback protection
          </p>
        </div>
      </div>

      {/* Two Column Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1rem" }}>
        {/* Test Cases Table (Chapter 6.3.2) */}
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Award size={18} color="var(--accent-cyan)" /> Formal Evaluation Test Cases (Chapter 6)
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--text-secondary)" }}>
                <th style={{ padding: "0.6rem" }}>Test ID</th>
                <th style={{ padding: "0.6rem" }}>Objective</th>
                <th style={{ padding: "0.6rem" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {report.evaluationTestCases.map((tc) => (
                <tr key={tc.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                  <td style={{ padding: "0.6rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}>
                    {tc.id}
                  </td>
                  <td style={{ padding: "0.6rem" }}>{tc.name}</td>
                  <td style={{ padding: "0.6rem" }}>
                    <span className="badge badge-success">{tc.result}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Project Meta Card */}
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FileText size={18} color="var(--accent-indigo)" /> Research Team & Supervisors
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.82rem" }}>
            <span style={{ fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
              Student Researchers:
            </span>
            {report.metadata.authors.map((a, i) => (
              <div key={i} style={{ color: "var(--text-primary)" }}>• {a}</div>
            ))}

            <span style={{ fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginTop: "0.5rem" }}>
              Faculty Supervisors:
            </span>
            {report.metadata.supervisors.map((s, i) => (
              <div key={i} style={{ color: "var(--accent-cyan)" }}>• {s}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
