import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import {
  GitBranch,
  Key,
  ExternalLink,
  Play,
  CheckCircle2,
  Lock,
  Unlock,
  RefreshCw,
  GitCommit,
  Sparkles,
  Loader2
} from "lucide-react";
import { Github } from "../components/GithubIcon";

export default function GitHubIntegrationView() {
  const [patToken, setPatToken] = useState(localStorage.getItem("gh_pat_token") || "");
  const [isTokenSaved, setIsTokenSaved] = useState(Boolean(localStorage.getItem("gh_pat_token")));
  const [reposData, setReposData] = useState({ isLive: false, repos: [] });
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [commits, setCommits] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [targetBranch, setTargetBranch] = useState("main");
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRepos();
  }, []);

  const fetchRepos = async () => {
    setIsLoading(true);
    try {
      const headers = patToken ? { "x-github-token": patToken } : {};
      const res = await api.get("/github/repos", { headers });
      setReposData(res.data);
      if (res.data?.repos?.length > 0 && !selectedRepo) {
        handleSelectRepo(res.data.repos[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRepo = async (repo) => {
    setSelectedRepo(repo);
    setTargetBranch(repo.defaultBranch || "main");
    setDispatchResult(null);

    const headers = patToken ? { "x-github-token": patToken } : {};
    try {
      const [commitsRes, workflowsRes] = await Promise.all([
        api.get(`/github/repos/${repo.owner}/${repo.name}/commits`, { headers }),
        api.get(`/github/repos/${repo.owner}/${repo.name}/workflows`, { headers })
      ]);
      setCommits(commitsRes.data || []);
      setWorkflows(workflowsRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveToken = () => {
    if (patToken.trim()) {
      localStorage.setItem("gh_pat_token", patToken.trim());
      setIsTokenSaved(true);
      fetchRepos();
    } else {
      localStorage.removeItem("gh_pat_token");
      setIsTokenSaved(false);
      fetchRepos();
    }
  };

  const handleClearToken = () => {
    setPatToken("");
    localStorage.removeItem("gh_pat_token");
    setIsTokenSaved(false);
    fetchRepos();
  };

  const handleDispatch = async (workflowId) => {
    if (!selectedRepo) return;
    setIsDispatching(true);
    setDispatchResult(null);

    const headers = patToken ? { "x-github-token": patToken } : {};
    try {
      const res = await api.post(
        `/github/repos/${selectedRepo.owner}/${selectedRepo.name}/dispatch`,
        { workflowId, ref: targetBranch },
        { headers }
      );
      setDispatchResult(res.data);
    } catch (err) {
      setDispatchResult({
        success: false,
        message: err.response?.data?.error || err.message
      });
    } finally {
      setIsDispatching(false);
    }
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
      {/* Header & Token Configuration Banner */}
      <div className="glass-panel" style={{
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Github size={22} color="var(--accent-cyan)" /> Live GitHub API & Actions Connector
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              Connect directly to real GitHub repositories to inspect commits, view branches, and trigger GitHub Actions workflows (Chapter 4.2.3 & 5.1.4).
            </p>
          </div>
          <span className={`badge ${reposData.isLive ? "badge-success" : "badge-warning"}`}>
            {reposData.isLive ? "LIVE GITHUB API ACTIVE" : "SANDBOX / DEMO REPOSITORIES"}
          </span>
        </div>

        {/* Token Input Bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          background: "rgba(15, 23, 42, 0.6)",
          padding: "0.75rem 1rem",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)"
        }}>
          <Key size={18} color="var(--accent-indigo)" />
          <div style={{ flex: 1 }}>
            <input
              type="password"
              className="input-control"
              placeholder="Enter GitHub Personal Access Token (PAT) (Optional: ghp_... / github_pat_...)"
              value={patToken}
              onChange={(e) => setPatToken(e.target.value)}
              style={{ border: "none", background: "transparent", fontSize: "0.85rem" }}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSaveToken}
            style={{ padding: "0.4rem 0.9rem", fontSize: "0.75rem" }}
          >
            {isTokenSaved ? "Update PAT" : "Connect PAT"}
          </button>
          {isTokenSaved && (
            <button
              className="btn btn-secondary"
              onClick={handleClearToken}
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }}
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Column Repository & Actions Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "1rem", flex: 1 }}>
        {/* Left: Repositories List */}
        <div className="glass-panel" style={{
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          maxHeight: "580px",
          overflowY: "auto"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <GitBranch size={16} color="var(--accent-cyan)" /> Connected Repositories ({reposData.repos.length})
            </h3>
            <button
              className="btn btn-secondary"
              onClick={fetchRepos}
              disabled={isLoading}
              style={{ padding: "0.3rem 0.6rem" }}
            >
              <RefreshCw size={12} className={isLoading ? "spinning" : ""} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {reposData.repos.map((r) => {
              const isSelected = selectedRepo?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => handleSelectRepo(r)}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: isSelected ? "1px solid var(--accent-cyan)" : "1px solid var(--border-subtle)",
                    background: isSelected ? "rgba(0, 242, 254, 0.1)" : "rgba(15, 23, 42, 0.6)",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      {r.name}
                    </span>
                    <span className="badge badge-info" style={{ fontSize: "0.6rem" }}>
                      {r.language}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>
                    {r.description}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.4rem", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    <span>⭐ {r.stars}</span>
                    <span>🌿 {r.defaultBranch}</span>
                    {r.isPrivate ? <span>🔒 Private</span> : <span>🌐 Public</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Actions Runner & Commit Timeline */}
        <div className="glass-panel" style={{
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          maxHeight: "580px",
          overflowY: "auto"
        }}>
          {selectedRepo ? (
            <>
              {/* Selected Repo Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.75rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                    {selectedRepo.fullName}
                  </h3>
                  <a
                    href={selectedRepo.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--accent-cyan)", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.2rem", marginTop: "0.2rem", textDecoration: "none" }}
                  >
                    View on GitHub <ExternalLink size={12} />
                  </a>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Branch:</span>
                  <input
                    type="text"
                    className="input-control"
                    value={targetBranch}
                    onChange={(e) => setTargetBranch(e.target.value)}
                    style={{ width: "100px", padding: "0.3rem 0.5rem", fontSize: "0.75rem" }}
                  />
                </div>
              </div>

              {/* Workflows Runner */}
              <div>
                <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "0.6rem" }}>
                  GitHub Actions Workflows:
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {workflows.map((w) => (
                    <div key={w.id} style={{
                      background: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      padding: "0.75rem 1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                          {w.name}
                        </div>
                        <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                          {w.path}
                        </div>
                      </div>

                      <button
                        className="btn btn-primary"
                        onClick={() => handleDispatch(w.id)}
                        disabled={isDispatching}
                        style={{ padding: "0.35rem 0.8rem", fontSize: "0.75rem" }}
                      >
                        {isDispatching ? <Loader2 size={12} className="spinning" /> : <Play size={12} />} Trigger Dispatch
                      </button>
                    </div>
                  ))}
                </div>

                {dispatchResult && (
                  <div style={{
                    marginTop: "0.75rem",
                    padding: "0.75rem",
                    borderRadius: "var(--radius-sm)",
                    background: dispatchResult.success ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    border: `1px solid ${dispatchResult.success ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                    fontSize: "0.8rem",
                    color: dispatchResult.success ? "var(--accent-emerald)" : "var(--accent-rose)"
                  }}>
                    {dispatchResult.message}
                  </div>
                )}
              </div>

              {/* Commit Timeline */}
              <div>
                <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "0.6rem" }}>
                  Recent Commits Timeline:
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {commits.map((c, i) => (
                    <div key={i} style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      padding: "0.5rem 0.75rem",
                      background: "#05080f",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-subtle)",
                      fontSize: "0.8rem"
                    }}>
                      <span className="badge badge-info" style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
                        {c.sha}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>{c.message}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                          by {c.author} • {new Date(c.date).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>
              Select a repository on the left to inspect workflows and commits.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
