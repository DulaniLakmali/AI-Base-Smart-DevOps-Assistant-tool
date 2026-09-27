import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import { ShieldAlert, Search, RefreshCw, Lock } from "lucide-react";

export default function AuditTrailView() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAudit();
  }, []);

  const fetchAudit = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/audit");
      setRecords(res.data || []);
    } catch (err) {
      console.error("Failed to fetch audit records:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.action?.toLowerCase().includes(q) ||
      r.target?.toLowerCase().includes(q) ||
      r.user_name?.toLowerCase().includes(q) ||
      r.details?.toLowerCase().includes(q)
    );
  });

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
            <ShieldAlert size={20} color="var(--accent-indigo)" /> Compliance & Security Audit Ledger
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
            Immutable, write-once audit trail with automatic secret redaction for ethical traceability (Proposal Section 9).
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              className="input-control"
              placeholder="Search audit records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "2rem", width: "220px", fontSize: "0.8rem" }}
            />
          </div>
          <button
            className="btn btn-secondary"
            onClick={fetchAudit}
            disabled={isLoading}
            style={{ padding: "0.5rem 0.8rem" }}
          >
            <RefreshCw size={14} className={isLoading ? "spinning" : ""} />
          </button>
        </div>
      </div>

      {/* Audit Table */}
      <div className="glass-panel" style={{
        flex: 1,
        padding: "1rem",
        overflowY: "auto"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--text-secondary)" }}>
              <th style={{ padding: "0.6rem" }}>Timestamp</th>
              <th style={{ padding: "0.6rem" }}>Actor</th>
              <th style={{ padding: "0.6rem" }}>Action</th>
              <th style={{ padding: "0.6rem" }}>Target</th>
              <th style={{ padding: "0.6rem" }}>Audit Details & Redacted Payload</th>
              <th style={{ padding: "0.6rem" }}>Risk Level</th>
              <th style={{ padding: "0.6rem" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((rec) => (
              <tr key={rec.audit_id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                <td style={{ padding: "0.6rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                  {new Date(rec.timestamp).toLocaleString()}
                </td>
                <td style={{ padding: "0.6rem", fontWeight: 600 }}>
                  <div>{rec.user_name || "System"}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{rec.user_role}</div>
                </td>
                <td style={{ padding: "0.6rem" }}>
                  <span className="badge badge-info" style={{ fontSize: "0.65rem" }}>
                    {rec.action}
                  </span>
                </td>
                <td style={{ padding: "0.6rem", fontWeight: 500, color: "var(--accent-cyan)" }}>
                  {rec.target}
                </td>
                <td style={{ padding: "0.6rem", color: "var(--text-secondary)", maxWidth: "340px", wordBreak: "break-word" }}>
                  {rec.details}
                </td>
                <td style={{ padding: "0.6rem" }}>
                  <span className={`badge ${rec.risk_level === "HIGH_RISK" ? "badge-danger" : rec.risk_level === "MODERATE" ? "badge-warning" : "badge-success"}`} style={{ fontSize: "0.65rem" }}>
                    {rec.risk_level}
                  </span>
                </td>
                <td style={{ padding: "0.6rem" }}>
                  <span className={`badge ${rec.status === "SUCCESS" || rec.status === "APPROVED" ? "badge-success" : rec.status === "REJECTED" ? "badge-danger" : "badge-info"}`} style={{ fontSize: "0.65rem" }}>
                    {rec.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
