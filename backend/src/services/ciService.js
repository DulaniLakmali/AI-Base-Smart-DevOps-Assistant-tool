import {
  GitHubService,
  DEFAULT_OWNER,
  DEFAULT_REPO,
  DEFAULT_BRANCH,
  DEFAULT_WORKFLOW_ID
} from "./githubService.js";

const POLL_INTERVAL_MS = 3500;
const MAX_POLLS = 120;

// Tracks only real GitHub Actions runs while the backend is running.
// GitHub remains the authoritative source of pipeline history.
const trackedPipelines = new Map();

const mapRunStatus = (run) => {
  if (run.status !== "completed") {
    return "running";
  }

  return run.conclusion === "success" ? "success" : "failed";
};

const mapStepStatus = (step) => {
  if (step.status === "in_progress") {
    return "running";
  }

  if (step.status === "completed") {
    if (step.conclusion === "success") {
      return "success";
    }

    if (step.conclusion === "skipped") {
      return "skipped";
    }

    return "failed";
  }

  return "pending";
};

const calculateDuration = (startedAt, completedAt, status) => {
  if (startedAt && completedAt) {
    const seconds = Math.max(
      1,
      Math.round(
        (new Date(completedAt).getTime() -
          new Date(startedAt).getTime()) /
        1000
      )
    );

    return `${seconds}s`;
  }

  if (status === "running") {
    return "running...";
  }

  return "-";
};

const mapRunToPipeline = (
  run,
  owner,
  repo,
  existingPipeline = null
) => {
  return {
    id: String(run.id),
    realRunId: run.id,

    name:
      run.name ||
      existingPipeline?.name ||
      "Smart DevOps Assistant CI/CD Pipeline",

    branch:
      run.headBranch ||
      existingPipeline?.branch ||
      DEFAULT_BRANCH,

    commit:
      run.headSha ||
      existingPipeline?.commit ||
      "Pending",

    commitMsg:
      run.displayTitle ||
      existingPipeline?.commitMsg ||
      "GitHub Actions workflow run",

    status: mapRunStatus(run),

    rawStatus: run.status,
    rawConclusion: run.conclusion,

    author: run.author,
    authorAvatar: run.authorAvatar,

    duration:
      run.status === "completed"
        ? "Completed"
        : "Running...",

    triggeredAt:
      run.createdAt ||
      existingPipeline?.triggeredAt ||
      new Date().toISOString(),

    htmlUrl:
      run.htmlUrl ||
      existingPipeline?.htmlUrl ||
      null,

    runNumber: run.runNumber,

    source: "GITHUB_ACTIONS",

    owner,
    repo,

    stages: existingPipeline?.stages || []
  };
};

export class CIService {
  /**
   * Fetch only real GitHub Actions pipeline runs.
   */
  static async getPipelines(
    mode = "real",
    reqToken = null,
    owner = DEFAULT_OWNER,
    repo = DEFAULT_REPO
  ) {
    if (mode !== "real") {
      throw new Error(
        "Simulation mode is disabled. Only real GitHub Actions pipelines are supported."
      );
    }

    const runsData = await GitHubService.getWorkflowRuns(
      owner,
      repo,
      reqToken
    );

    const livePipelines = runsData.runs.map((run) => {
      const existing = trackedPipelines.get(String(run.id));

      const pipeline = mapRunToPipeline(
        run,
        owner,
        repo,
        existing
      );

      trackedPipelines.set(String(run.id), pipeline);

      return pipeline;
    });

    // A newly dispatched real run may take a moment to appear
    // in GitHub's run listing. Keep it visible meanwhile.
    const liveIds = new Set(
      livePipelines.map((pipeline) => pipeline.id)
    );

    const recentlyDispatched = Array.from(
      trackedPipelines.values()
    ).filter(
      (pipeline) =>
        pipeline.source === "GITHUB_ACTIONS" &&
        !liveIds.has(pipeline.id) &&
        pipeline.status === "running"
    );

    return {
      isLive: true,
      mode: "real",
      owner,
      repo,
      pipelines: [
        ...recentlyDispatched,
        ...livePipelines
      ]
    };
  }

  /**
   * Fetch real GitHub Actions jobs and steps.
   */
  static async getRunJobs(
    runId,
    reqToken = null,
    owner = DEFAULT_OWNER,
    repo = DEFAULT_REPO
  ) {
    if (!runId) {
      throw new Error("Workflow run ID is required.");
    }

    const jobs = await GitHubService.getRunJobs(
      owner,
      repo,
      runId,
      reqToken
    );

    return {
      isLive: true,
      runId: String(runId),
      owner,
      repo,
      jobs
    };
  }

  /**
   * Fetch real runner logs.
   */
  static async getJobLogs(
    jobId,
    reqToken = null,
    owner = DEFAULT_OWNER,
    repo = DEFAULT_REPO
  ) {
    if (!jobId) {
      throw new Error("GitHub Actions job ID is required.");
    }

    return GitHubService.getJobLogs(
      owner,
      repo,
      jobId,
      reqToken
    );
  }

  /**
   * Trigger a REAL GitHub Actions workflow.
   */
  static async triggerPipeline(
    pipelineName = "Smart DevOps Assistant CI/CD Pipeline",
    io = null,
    reqToken = null,
    options = {}
  ) {
    if (options.mode && options.mode !== "real") {
      throw new Error(
        "Simulation mode is disabled. Only real GitHub Actions execution is supported."
      );
    }

    const owner =
      options.owner || DEFAULT_OWNER;

    const repo =
      options.repo || DEFAULT_REPO;

    const ref =
      options.ref || DEFAULT_BRANCH;

    const workflowId =
      options.workflowId || DEFAULT_WORKFLOW_ID;

    const token =
      GitHubService.getToken(reqToken);

    if (!token) {
      throw new Error(
        "GitHub token is not configured. Add GITHUB_TOKEN to backend/.env."
      );
    }

    console.log(
      `🚀 [Real CI] Dispatching '${workflowId}' on ${owner}/${repo} [${ref}]`
    );

    const dispatchResult =
      await GitHubService.triggerWorkflowDispatch(
        owner,
        repo,
        workflowId,
        ref,
        token
      );

    if (!dispatchResult.runId) {
      throw new Error(
        "GitHub accepted the workflow dispatch but did not return a workflow run ID."
      );
    }

    const runId = String(dispatchResult.runId);

    const livePipeline = {
      id: runId,
      realRunId: dispatchResult.runId,

      name:
        pipelineName ||
        "Smart DevOps Assistant CI/CD Pipeline",

      branch: ref,

      commit: "Pending",

      commitMsg:
        `Real GitHub Actions workflow dispatched to ${owner}/${repo}`,

      status: "running",

      rawStatus: "queued",
      rawConclusion: null,

      duration:
        "Queued on GitHub Actions...",

      source: "GITHUB_ACTIONS",

      owner,
      repo,
      workflowId,

      triggeredAt:
        new Date().toISOString(),

      htmlUrl:
        dispatchResult.htmlUrl || null,

      stages: []
    };

    trackedPipelines.set(
      runId,
      livePipeline
    );

    if (io) {
      io.emit(
        "ci_pipeline_update",
        livePipeline
      );
    }

    this.startGitHubRunPoller(
      livePipeline,
      owner,
      repo,
      token,
      io
    );

    return livePipeline;
  }

  /**
   * Poll the exact GitHub workflow run ID returned by dispatch.
   */
  static startGitHubRunPoller(
    livePipeline,
    owner,
    repo,
    token,
    io
  ) {
    let pollCount = 0;

    console.log(
      `🔄 [CI Poller] Monitoring GitHub run ID ${livePipeline.realRunId}`
    );

    const pollInterval = setInterval(
      async () => {
        pollCount += 1;

        if (pollCount > MAX_POLLS) {
          clearInterval(pollInterval);

          console.warn(
            `[CI Poller] Timed out monitoring GitHub run ${livePipeline.realRunId}`
          );

          return;
        }

        try {
          /*
           * Retrieve workflow runs and select the EXACT
           * run ID returned by GitHub dispatch.
           */
          const runsData =
            await GitHubService.getWorkflowRuns(
              owner,
              repo,
              token
            );

          const run =
            runsData.runs.find(
              (item) =>
                String(item.id) ===
                String(livePipeline.realRunId)
            );

          if (run) {
            livePipeline.name =
              run.name || livePipeline.name;

            livePipeline.branch =
              run.headBranch || livePipeline.branch;

            livePipeline.commit =
              run.headSha || livePipeline.commit;

            livePipeline.commitMsg =
              run.displayTitle ||
              livePipeline.commitMsg;

            livePipeline.rawStatus =
              run.status;

            livePipeline.rawConclusion =
              run.conclusion;

            livePipeline.runNumber =
              run.runNumber;

            livePipeline.htmlUrl =
              run.htmlUrl ||
              livePipeline.htmlUrl;

            livePipeline.status =
              mapRunStatus(run);

            livePipeline.duration =
              run.status === "completed"
                ? "Completed"
                : "Running in GitHub Actions...";
          }

          /*
           * Fetch actual jobs and actual GitHub steps.
           */
          const jobs =
            await GitHubService.getRunJobs(
              owner,
              repo,
              livePipeline.realRunId,
              token
            );

          if (jobs.length > 0) {
            const stages = [];

            for (const job of jobs) {
              const steps =
                (job.steps || []).filter(
                  (step) =>
                    !step.name.startsWith("Post ") &&
                    step.name !== "Set up job" &&
                    step.name !== "Complete job"
                );

              for (const step of steps) {
                const status =
                  mapStepStatus(step);

                stages.push({
                  name:
                    jobs.length > 1
                      ? `${job.name} / ${step.name}`
                      : step.name,

                  status,

                  duration:
                    calculateDuration(
                      step.startedAt,
                      step.completedAt,
                      status
                    ),

                  logs:
                    `Real GitHub Actions step: ${step.name}`
                });
              }
            }

            livePipeline.stages =
              stages;
          }

          trackedPipelines.set(
            String(livePipeline.realRunId),
            livePipeline
          );

          if (io) {
            io.emit(
              "ci_pipeline_update",
              {
                ...livePipeline
              }
            );
          }

          /*
           * GitHub workflow completed.
           */
          if (
            run &&
            run.status === "completed"
          ) {
            clearInterval(pollInterval);

            /*
             * Fetch real logs from all jobs.
             */
            if (jobs.length > 0) {
              const logSections = [];

              for (const job of jobs) {
                try {
                  const logs =
                    await GitHubService.getJobLogs(
                      owner,
                      repo,
                      job.id,
                      token
                    );

                  logSections.push(
                    `===== ${job.name} =====\n${logs}`
                  );
                } catch (err) {
                  logSections.push(
                    `===== ${job.name} =====\nUnable to retrieve logs: ${err.message}`
                  );
                }
              }

              const combinedLogs =
                logSections.join(
                  "\n\n"
                );

              livePipeline.terminalLogs =
                combinedLogs;

              if (io) {
                io.emit(
                  "ci_pipeline_logs",
                  {
                    runId:
                      livePipeline.id,

                    jobId:
                      jobs[0]?.id || null,

                    logs:
                      combinedLogs
                  }
                );
              }
            }

            if (io) {
              io.emit(
                "ci_pipeline_update",
                {
                  ...livePipeline
                }
              );

              io.emit(
                "ci_pipeline_completed",
                {
                  id:
                    livePipeline.id,

                  runNumber:
                    livePipeline.runNumber,

                  status:
                    livePipeline.status,

                  conclusion:
                    livePipeline.rawConclusion,

                  htmlUrl:
                    livePipeline.htmlUrl
                }
              );
            }

            console.log(
              `✅ [CI Poller] GitHub run #${livePipeline.runNumber ||
              livePipeline.id
              } completed with: ${livePipeline.rawConclusion
              }`
            );
          }
        } catch (err) {
          console.warn(
            `[CI Poller] Poll ${pollCount} failed:`,
            err.message
          );
        }
      },
      POLL_INTERVAL_MS
    );
  }
}