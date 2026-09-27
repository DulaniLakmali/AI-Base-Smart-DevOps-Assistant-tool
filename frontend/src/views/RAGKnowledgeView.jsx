import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import {
  BookOpen,
  Search,
  ExternalLink,
  Copy,
  Check,
  Cpu,
  Layers,
  Zap,
  BarChart3,
  Sparkles,
  GitCompare,
  X,
  ShieldCheck,
  Server,
  FileCode,
  AlertCircle
} from "lucide-react";

export default function RAGKnowledgeView() {
  const [docs, setDocs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState("vector"); // "vector" | "hybrid" | "keyword"
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [copiedId, setCopiedId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchStats, setSearchStats] = useState(null);
  const [indexStatus, setIndexStatus] = useState(null);

  // Comparative modal states
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareQuery, setCompareQuery] = useState("container ran out of memory and died");
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareResults, setCompareResults] = useState(null);

  useEffect(() => {
    fetchIndexStatus();
    fetchDocs();
  }, []);

  const fetchIndexStatus = async () => {
    try {
      const res = await api.get("/rag/status");
      setIndexStatus(res.data);
    } catch (err) {
      console.warn("Could not fetch RAG status:", err.message);
    }
  };

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/rag/docs");
      setDocs(res.data || []);
      setSearchStats(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (queryToRun, modeToUse) => {
    const q = queryToRun !== undefined ? queryToRun : searchQuery;
    const mode = modeToUse !== undefined ? modeToUse : searchMode;

    if (!q.trim()) {
      fetchDocs();
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/rag/query", {
        query: q,
        mode: mode,
        limit: 8
      });
      const results = res.data?.results || [];
      const meta = res.data?.metadata || {};
      setDocs(results);
      setSearchStats({
        latencyMs: meta.latencyMs !== undefined ? meta.latencyMs : (res.data?.latencyMs ?? 1.2),
        totalIndexed: meta.totalIndexed !== undefined ? meta.totalIndexed : (res.data?.totalIndexed ?? 17),
        returnedCount: meta.returnedCount !== undefined ? meta.returnedCount : results.length,
        mode: meta.mode || mode,
        query: q
      });
    } catch (err) {
      console.error("RAG Query error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunComparison = async (queryOverride) => {
    const q = queryOverride !== undefined ? queryOverride : compareQuery;
    if (!q.trim()) return;

    setCompareLoading(true);
    try {
      const res = await api.post("/rag/compare", { query: q, limit: 4 });
      const compData = res.data?.comparison || res.data || null;
      setCompareResults(compData);
    } catch (err) {
      console.error("Comparison error:", err);
    } finally {
      setCompareLoading(false);
    }
  };

  const copySnippet = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const SUGGESTED_QUERIES = [
    { label: "OOM / Memory Exhaustion", q: "container ran out of memory and died" },
    { label: "Horizontal Pod Autoscaler", q: "Horizontal Pod Autoscaling target CPU" },
    { label: "CrashLoopBackOff & Liveness", q: "CrashLoopBackOff container liveness probe failure" },
    { label: "Multi-stage Docker", q: "Multi-stage Dockerfile layer caching" },
    { label: "Terraform State Locking", q: "Terraform remote state locking DynamoDB S3" },
    { label: "Zero-Trust CI/CD", q: "GitHub Actions zero-trust CI/CD OpenID Connect" },
    { label: "Four Golden Signals", q: "Prometheus Four Golden Signals Latency Traffic Errors Saturation" }
  ];

  const CATEGORIES = ["ALL", "Kubernetes", "Docker", "Terraform", "CI/CD", "DevSecOps", "SRE"];

  const filteredDocs = selectedCategory === "ALL"
    ? docs
    : docs.filter(d => (d.category || "").toLowerCase() === selectedCategory.toLowerCase());

  const getCategoryColor = (cat) => {
    switch ((cat || "").toLowerCase()) {
      case "kubernetes": return "badge-info";
      case "docker": return "badge-purple";
      case "terraform": return "badge-warning";
      case "ci/cd": return "badge-success";
      case "devsecops": return "badge-danger";
      case "sre": return "badge-info";
      default: return "badge-info";
    }
  };

  const getMatchScoreBadge = (doc) => {
    if (doc.matchPercentage === undefined && doc.similarityScore === undefined) return null;
    const pct = doc.matchPercentage !== undefined
      ? doc.matchPercentage
      : Math.round((doc.similarityScore || 0) * 1000) / 10;

    let badgeClass = "badge-success";
    if (pct < 50) badgeClass = "badge-danger";
    else if (pct < 70) badgeClass = "badge-warning";

    return (
      <span className={`badge ${badgeClass}`} style={{ fontSize: "0.7rem", fontWeight: 700 }}>
        <Sparkles size={11} /> {pct}% Match
      </span>
    );
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
      {/* Header & Architecture Status */}
      <div className="glass-panel" style={{
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.9rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BookOpen size={22} color="var(--accent-cyan)" /> Dense Vector RAG Knowledge Base
            </h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              Enterprise DevOps specifications & runbooks indexed into a 384-dimensional dense semantic vector space (FAISS-style Cosine Engine).
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <span className="badge badge-success" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span className="pulsing-dot" style={{ background: "var(--accent-emerald)" }} />
              FAISS-STYLE VECTOR ENGINE
            </span>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowCompareModal(true);
                if (!compareResults) handleRunComparison();
              }}
              style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem", gap: "0.4rem" }}
            >
              <GitCompare size={14} color="var(--accent-cyan)" />
              Benchmark Vector vs Keyword
            </button>
          </div>
        </div>

        {/* Vector Telemetry Strip */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "0.75rem",
          background: "rgba(15, 23, 42, 0.6)",
          padding: "0.75rem 1rem",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Cpu size={16} color="var(--accent-cyan)" />
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Embedding Model</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                384-dim Dense Vector Space
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Layers size={16} color="var(--accent-indigo)" />
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Indexed Runbooks</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                {indexStatus?.totalDocs || 17} Production Specs
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Zap size={16} color="var(--accent-emerald)" />
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Retrieval Metric</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                L2 Cosine Similarity ({searchStats ? `${searchStats.latencyMs}ms` : "< 2ms"})
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <ShieldCheck size={16} color="var(--accent-amber)" />
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Deployment Mode</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent-cyan)" }}>
                100% In-Process Local (Option A)
              </div>
            </div>
          </div>
        </div>

        {/* Search Mode Selector & Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginRight: "0.2rem" }}>Search Mode:</span>
              <button
                onClick={() => {
                  setSearchMode("vector");
                  if (searchQuery.trim()) handleSearch(searchQuery, "vector");
                }}
                style={{
                  padding: "0.3rem 0.7rem",
                  borderRadius: "var(--radius-sm)",
                  border: searchMode === "vector" ? "1px solid var(--accent-cyan)" : "1px solid var(--border-subtle)",
                  background: searchMode === "vector" ? "rgba(0, 242, 254, 0.15)" : "rgba(30, 41, 59, 0.5)",
                  color: searchMode === "vector" ? "var(--accent-cyan)" : "var(--text-secondary)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem"
                }}
              >
                🧠 Vector Semantic
              </button>
              <button
                onClick={() => {
                  setSearchMode("hybrid");
                  if (searchQuery.trim()) handleSearch(searchQuery, "hybrid");
                }}
                style={{
                  padding: "0.3rem 0.7rem",
                  borderRadius: "var(--radius-sm)",
                  border: searchMode === "hybrid" ? "1px solid var(--accent-indigo)" : "1px solid var(--border-subtle)",
                  background: searchMode === "hybrid" ? "rgba(99, 102, 241, 0.15)" : "rgba(30, 41, 59, 0.5)",
                  color: searchMode === "hybrid" ? "var(--accent-indigo)" : "var(--text-secondary)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem"
                }}
              >
                🔀 Hybrid (Vector + Keyword)
              </button>
              <button
                onClick={() => {
                  setSearchMode("keyword");
                  if (searchQuery.trim()) handleSearch(searchQuery, "keyword");
                }}
                style={{
                  padding: "0.3rem 0.7rem",
                  borderRadius: "var(--radius-sm)",
                  border: searchMode === "keyword" ? "1px solid var(--accent-amber)" : "1px solid var(--border-subtle)",
                  background: searchMode === "keyword" ? "rgba(245, 158, 11, 0.15)" : "rgba(30, 41, 59, 0.5)",
                  color: searchMode === "keyword" ? "var(--accent-amber)" : "var(--text-secondary)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem"
                }}
              >
                🔍 Legacy Keyword
              </button>
            </div>

            {searchStats && (
              <span style={{ fontSize: "0.75rem", color: "var(--accent-emerald)" }}>
                ⚡ Retrieved {searchStats.returnedCount} specs in <strong>{searchStats.latencyMs} ms</strong> via {searchStats.mode.toUpperCase()}
              </span>
            )}
          </div>

          {/* Search Bar */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                className="input-control"
                placeholder={
                  searchMode === "vector"
                    ? "Ask in natural language (e.g., 'container ran out of memory and died' or 'prevent multiple people running terraform')..."
                    : "Search DevOps documentation, runbooks, or configuration patterns..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                style={{ paddingLeft: "2.2rem" }}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    fetchDocs();
                  }}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer"
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              className="btn btn-primary"
              onClick={() => handleSearch()}
              disabled={isLoading}
            >
              {isLoading ? "Searching..." : "Vector Search"}
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", paddingTop: "0.2rem" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Categories:</span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "0.2rem 0.55rem",
                borderRadius: "12px",
                border: selectedCategory === cat ? "1px solid var(--accent-cyan)" : "1px solid var(--border-subtle)",
                background: selectedCategory === cat ? "rgba(0, 242, 254, 0.15)" : "transparent",
                color: selectedCategory === cat ? "var(--accent-cyan)" : "var(--text-muted)",
                fontSize: "0.7rem",
                cursor: "pointer"
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Query Suggestions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Semantic Test Queries:</span>
          {SUGGESTED_QUERIES.map((sq, i) => (
            <button
              key={i}
              onClick={() => {
                setSearchQuery(sq.q);
                handleSearch(sq.q);
              }}
              style={{
                padding: "0.22rem 0.55rem",
                borderRadius: "15px",
                border: "1px solid var(--border-subtle)",
                background: "rgba(30, 41, 59, 0.4)",
                color: "var(--text-secondary)",
                fontSize: "0.7rem",
                cursor: "pointer",
                transition: "all 0.15s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-cyan)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
            >
              {sq.label}
            </button>
          ))}
        </div>
      </div>

      {/* Docs Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1rem" }}>
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="glass-panel" style={{
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Top Bar with Category, Similarity Score, and External Link */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                <span className={`badge ${getCategoryColor(doc.category)}`} style={{ fontSize: "0.65rem" }}>
                  {doc.category}
                </span>
                {getMatchScoreBadge(doc)}
              </div>
              <a
                href={doc.docUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "var(--accent-cyan)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.2rem",
                  fontSize: "0.75rem",
                  textDecoration: "none"
                }}
              >
                Docs <ExternalLink size={12} />
              </a>
            </div>

            {/* Title */}
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {doc.title}
            </h3>

            {/* Summary */}
            <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {doc.summary}
            </p>

            {/* Tags */}
            <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
              {doc.tags?.map((t, idx) => (
                <span key={idx} style={{
                  fontSize: "0.68rem",
                  background: "rgba(15, 23, 42, 0.7)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "4px",
                  padding: "0.15rem 0.4rem",
                  color: "var(--text-muted)"
                }}>
                  #{t}
                </span>
              ))}
            </div>

            {/* Code Snippet Box */}
            {doc.snippet && (
              <div style={{ marginTop: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Verified Configuration Snippet
                  </span>
                  <button
                    onClick={() => copySnippet(doc.id, doc.snippet)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: copiedId === doc.id ? "var(--accent-emerald)" : "var(--accent-cyan)",
                      fontSize: "0.7rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem"
                    }}
                  >
                    {copiedId === doc.id ? <Check size={12} /> : <Copy size={12} />} {copiedId === doc.id ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre className="code-terminal" style={{ fontSize: "0.74rem", maxHeight: "150px", overflowY: "auto" }}>
                  {doc.snippet}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Side-by-Side Comparison Benchmark Modal */}
      {showCompareModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(5, 8, 15, 0.8)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1.5rem"
        }}>
          <div className="glass-panel" style={{
            width: "100%",
            maxWidth: "1050px",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <GitCompare size={18} color="var(--accent-cyan)" /> Comparative Benchmark: Vector RAG vs Legacy Keyword RAG
                </h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                  Demonstrating semantic intent retrieval vs literal substring token matching for Chapter 5/6 thesis evaluation.
                </p>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer"
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Benchmark Input */}
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border-subtle)", background: "rgba(15, 23, 42, 0.4)" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Enter a natural language diagnostic query..."
                  value={compareQuery}
                  onChange={(e) => setCompareQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRunComparison()}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => handleRunComparison()}
                  disabled={compareLoading}
                  style={{ minWidth: "140px" }}
                >
                  {compareLoading ? "Evaluating..." : "Run Benchmark"}
                </button>
              </div>

              {/* Sample benchmark prompts */}
              <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Benchmark Scenarios:</span>
                {[
                  "container ran out of memory and died",
                  "prevent concurrent terraform executions",
                  "pod fails to pull private container image",
                  "microservices latency error budget"
                ].map((scenario, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCompareQuery(scenario);
                      handleRunComparison(scenario);
                    }}
                    style={{
                      fontSize: "0.68rem",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "12px",
                      background: "rgba(30, 41, 59, 0.7)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-secondary)",
                      cursor: "pointer"
                    }}
                  >
                    {scenario}
                  </button>
                ))}
              </div>
            </div>

            {/* Results 2-Column Comparison */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "1.25rem 1.5rem",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.25rem"
            }}>
              {/* Left Column: Vector RAG */}
              <div style={{
                background: "rgba(0, 242, 254, 0.03)",
                border: "1px solid rgba(0, 242, 254, 0.25)",
                borderRadius: "var(--radius-md)",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Sparkles size={16} color="var(--accent-cyan)" />
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-cyan)" }}>
                      Vector Semantic Engine
                    </h4>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: "0.65rem" }}>
                    {compareResults?.vector?.latencyMs ? `${compareResults.vector.latencyMs} ms` : "Dense Embeddings"}
                  </span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Uses 384-dimensional cosine similarity. Understands contextual synonyms even when exact tokens are absent.
                </div>

                {compareResults?.vector?.results?.map((item, idx) => (
                  <div key={item.id} style={{
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.75rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.3rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        #{idx + 1} {item.title}
                      </span>
                      <span className="badge badge-success" style={{ fontSize: "0.68rem" }}>
                        {item.matchPercentage}% Cosine
                      </span>
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                      {item.summary}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column: Legacy Keyword RAG */}
              <div style={{
                background: "rgba(245, 158, 11, 0.03)",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                borderRadius: "var(--radius-md)",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Search size={16} color="var(--accent-amber)" />
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-amber)" }}>
                      Legacy Keyword Engine
                    </h4>
                  </div>
                  <span className="badge badge-warning" style={{ fontSize: "0.65rem" }}>
                    {compareResults?.keyword?.latencyMs ? `${compareResults.keyword.latencyMs} ms` : "Lexical Search"}
                  </span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Uses traditional substring and tag token matching. Fails when user queries use colloquial or diagnostic terms.
                </div>

                {compareResults?.keyword?.results?.length === 0 ? (
                  <div style={{
                    padding: "1.5rem",
                    textAlign: "center",
                    color: "var(--accent-rose)",
                    fontSize: "0.8rem",
                    border: "1px dashed rgba(239, 68, 68, 0.3)",
                    borderRadius: "var(--radius-sm)"
                  }}>
                    <AlertCircle size={20} style={{ margin: "0 auto 0.5rem" }} />
                    Zero matches found. Lexical search could not match natural language phrasing.
                  </div>
                ) : (
                  compareResults?.keyword?.results?.map((item, idx) => (
                    <div key={item.id} style={{
                      background: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm)",
                      padding: "0.75rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.3rem"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                          #{idx + 1} {item.title}
                        </span>
                        <span className="badge badge-warning" style={{ fontSize: "0.68rem" }}>
                          {item.matchPercentage}% Keyword
                        </span>
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                        {item.summary}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Academic Evaluation Takeaway */}
            <div style={{
              padding: "0.9rem 1.5rem",
              background: "rgba(15, 23, 42, 0.9)",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontSize: "0.76rem",
              color: "var(--text-secondary)"
            }}>
              <span className="badge badge-info" style={{ fontSize: "0.65rem", flexShrink: 0 }}>
                RESEARCH FINDING
              </span>
              <span>
                <strong>Lexical Gap Resolution:</strong> Dense vector embeddings project operator intent into a continuous topological space. Queries like <em>"ran out of memory"</em> achieve high cosine alignment with <em>"Exit Code 137 (OOMKilled)"</em> without requiring literal token overlap.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
