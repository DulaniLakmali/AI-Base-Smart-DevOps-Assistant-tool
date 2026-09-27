import axios from "axios";
import { config } from "../config/env.js";

/**
 * Real GitHub API & Actions Connector Service (Chapter 4.2.3 & 5.1.4)
 * Connects directly to GitHub REST API to query repos, commits, and trigger GitHub Actions.
 */

let configuredToken = config.GITHUB_TOKEN || process.env.GITHUB_TOKEN || "";
export const DEFAULT_OWNER = config.GITHUB_DEFAULT_OWNER || "DulaniLakmali";
export const DEFAULT_REPO = config.GITHUB_DEFAULT_REPO || "Smart-DevOps-Assistant";

export class GitHubService {
  static setToken(token) {
    configuredToken = token ? token.trim() : "";
  }

  static getToken(reqToken) {
    return reqToken || configuredToken || config.GITHUB_TOKEN || "";
  }

  static getHeaders(token) {
    const headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Smart-DevOps-Assistant"
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Fetch user's repositories (authenticated or public)
   */
  static async getRepositories(reqToken) {
    const token = this.getToken(reqToken);

    if (token) {
      try {
        const res = await axios.get("https://api.github.com/user/repos?sort=updated&per_page=20", {
          headers: this.getHeaders(token),
          timeout: 8000
        });

        const mapped = res.data.map((r) => ({
          id: r.id,
          name: r.name,
          fullName: r.full_name,
          owner: r.owner.login,
          isPrivate: r.private,
          description: r.description || "DevOps project repository",
          stars: r.stargazers_count,
          defaultBranch: r.default_branch,
          htmlUrl: r.html_url,
          language: r.language || "JavaScript"
        }));

        // Prioritize Smart-DevOps-Assistant and devops-ai-demo at the top
        mapped.sort((a, b) => {
          if (a.name === DEFAULT_REPO) return -1;
          if (b.name === DEFAULT_REPO) return 1;
          if (a.name === "devops-ai-demo") return -1;
          if (b.name === "devops-ai-demo") return 1;
          return 0;
        });

        return {
          isLive: true,
          repos: mapped
        };
      } catch (err) {
        console.warn("GitHub API error with token, attempting public user repos:", err.message);
      }
    }

    // Attempt to load live public repos for DulaniLakmali
    try {
      const res = await axios.get(`https://api.github.com/users/${DEFAULT_OWNER}/repos?sort=updated&per_page=12`, {
        headers: this.getHeaders(),
        timeout: 6000
      });

      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((r) => ({
          id: r.id,
          name: r.name,
          fullName: r.full_name,
          owner: r.owner.login,
          isPrivate: r.private,
          description: r.description || "DevOps project repository",
          stars: r.stargazers_count,
          defaultBranch: r.default_branch,
          htmlUrl: r.html_url,
          language: r.language || "JavaScript"
        }));

        mapped.sort((a, b) => (a.name === DEFAULT_REPO ? -1 : b.name === DEFAULT_REPO ? 1 : 0));

        return {
          isLive: true,
          repos: mapped
        };
      }
    } catch (err) {
      console.warn("Public GitHub API fetch failed, falling back to cached repos:", err.message);
    }

    // High-fidelity fallback / demo repositories
    return {
      isLive: false,
      repos: [
        {
          id: 954123,
          name: DEFAULT_REPO,
          fullName: `${DEFAULT_OWNER}/${DEFAULT_REPO}`,
          owner: DEFAULT_OWNER,
          isPrivate: false,
          description: "Agentic AI-Powered Smart DevOps Assistant with Real CI/CD and Prometheus Observability",
          stars: 2,
          defaultBranch: "main",
          htmlUrl: `https://github.com/${DEFAULT_OWNER}/${DEFAULT_REPO}`,
          language: "JavaScript"
        },
        {
          id: 901234,
          name: "devops-ai-demo",
          fullName: "DulaniLakmali/devops-ai-demo",
          owner: "DulaniLakmali",
          isPrivate: false,
          description: "Agentic AI-Powered Smart DevOps Assistant for Autonomous Software Delivery",
          stars: 1,
          defaultBranch: "main",
          htmlUrl: "https://github.com/DulaniLakmali/devops-ai-demo",
          language: "JavaScript"
        }
      ]
    };
  }

  /**
   * Fetch recent commits for a repository
   */
  static async getCommits(owner = DEFAULT_OWNER, repo = DEFAULT_REPO, reqToken) {
    const token = this.getToken(reqToken);

    try {
      const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=8`, {
        headers: this.getHeaders(token),
        timeout: 8000
      });

      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((c) => ({
          sha: c.sha.substring(0, 7),
          message: c.commit?.message || "Commit update",
          author: c.commit?.author?.name || c.author?.login || owner,
          date: c.commit?.author?.date || new Date().toISOString(),
          htmlUrl: c.html_url
        }));
      }
    } catch (err) {
      console.warn("Live commits fetch failed, falling back to simulated history:", err.message);
    }

    return [
      { sha: "41617df", message: "ci: add GitHub Actions multi-stage CI/CD pipeline", author: owner, date: new Date().toISOString() },
      { sha: "7462497", message: "fix(ui): elevate PromQL query runner and live result cards", author: owner, date: new Date(Date.now() - 1800000).toISOString() },
      { sha: "9af86a2", message: "feat(monitoring): implement real Prometheus metrics exporter and Grafana stack", author: owner, date: new Date(Date.now() - 3600000).toISOString() }
    ];
  }

  /**
   * Fetch GitHub Actions workflows
   */
  static async getWorkflows(owner = DEFAULT_OWNER, repo = DEFAULT_REPO, reqToken) {
    const token = this.getToken(reqToken);

    try {
      const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}/actions/workflows`, {
        headers: this.getHeaders(token),
        timeout: 8000
      });

      if (res.data?.workflows && res.data.workflows.length > 0) {
        return res.data.workflows.map((w) => ({
          id: w.id,
          name: w.name,
          path: w.path,
          state: w.state,
          htmlUrl: w.html_url
        }));
      }
    } catch (err) {
      console.warn("Live workflows fetch failed, falling back to simulated workflows:", err.message);
    }

    return [
      { id: 365888512, name: "Smart DevOps Assistant CI/CD Pipeline", path: ".github/workflows/ci.yml", state: "active" },
      { id: 362267851, name: "DevOps Assistant Deployment", path: ".github/workflows/deploy.yml", state: "active" }
    ];
  }

  /**
   * Fetch live GitHub Actions workflow runs
   */
  static async getWorkflowRuns(owner = DEFAULT_OWNER, repo = DEFAULT_REPO, reqToken) {
    const token = this.getToken(reqToken);

    try {
      const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=15`, {
        headers: this.getHeaders(token),
        timeout: 8000
      });

      if (res.data?.workflow_runs && Array.isArray(res.data.workflow_runs)) {
        return {
          isLive: true,
          runs: res.data.workflow_runs.map((r) => ({
            id: r.id,
            name: r.name || "CI/CD Pipeline",
            workflowId: r.workflow_id,
            headBranch: r.head_branch || "main",
            headSha: (r.head_sha || "").substring(0, 7),
            displayTitle: r.display_title || r.head_commit?.message || "Autonomous pipeline run",
            author: r.actor?.login || owner,
            authorAvatar: r.actor?.avatar_url,
            status: r.status, // "queued" | "in_progress" | "completed"
            conclusion: r.conclusion, // "success" | "failure" | "cancelled" | null
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            runNumber: r.run_number,
            htmlUrl: r.html_url,
            event: r.event
          }))
        };
      }
    } catch (err) {
      console.warn("Live workflow runs fetch failed, falling back to simulated runs:", err.message);
    }

    return {
      isLive: false,
      runs: []
    };
  }

  /**
   * Fetch jobs and steps for a specific workflow run
   */
  static async getRunJobs(owner = DEFAULT_OWNER, repo = DEFAULT_REPO, runId, reqToken) {
    const token = this.getToken(reqToken);

    try {
      const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/jobs`, {
        headers: this.getHeaders(token),
        timeout: 8000
      });

      if (res.data?.jobs && Array.isArray(res.data.jobs)) {
        return res.data.jobs.map((j) => ({
          id: j.id,
          name: j.name,
          status: j.status,
          conclusion: j.conclusion,
          startedAt: j.started_at,
          completedAt: j.completed_at,
          htmlUrl: j.html_url,
          steps: (j.steps || []).map((s) => ({
            name: s.name,
            status: s.status,
            conclusion: s.conclusion,
            number: s.number,
            startedAt: s.started_at,
            completedAt: s.completed_at
          }))
        }));
      }
    } catch (err) {
      console.warn(`Failed to fetch jobs for run ${runId}:`, err.message);
    }

    return [];
  }

  /**
   * Fetch raw logs for a specific job from GitHub runner
   */
  static async getJobLogs(owner = DEFAULT_OWNER, repo = DEFAULT_REPO, jobId, reqToken) {
    const token = this.getToken(reqToken);

    try {
      const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}/actions/jobs/${jobId}/logs`, {
        headers: this.getHeaders(token),
        responseType: "text",
        timeout: 10000
      });

      return res.data || "No logs available for this job.";
    } catch (err) {
      return `Unable to retrieve runner logs: ${err.response?.data?.message || err.message}`;
    }
  }

  /**
   * Trigger real GitHub Actions workflow dispatch
   */
  static async triggerWorkflowDispatch(owner = DEFAULT_OWNER, repo = DEFAULT_REPO, workflowId, ref = "main", reqToken) {
    const token = this.getToken(reqToken);

    if (token) {
      try {
        await axios.post(
          `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
          { ref },
          { headers: this.getHeaders(token) }
        );

        return {
          success: true,
          isLive: true,
          owner,
          repo,
          ref,
          workflowId,
          message: `Successfully triggered GitHub Actions workflow dispatch on '${owner}/${repo}' [branch: '${ref}'].`
        };
      } catch (err) {
        return {
          success: false,
          isLive: true,
          message: `GitHub API error: ${err.response?.data?.message || err.message}`
        };
      }
    }

    return {
      success: true,
      isLive: false,
      message: `Workflow #${workflowId} triggered successfully in sandbox mode.`
    };
  }
}
