# Agentic AI-Powered Smart DevOps Assistant
### Enterprise Autonomous Software Delivery, SRE Diagnostics & DevSecOps Platform

**Horizon Campus — Faculty of Information Technology**  
**Degree:** BSc (Hons.) in Information Technology  
**Module:** IT41028 – Final Year Project  
**Authors:** B.L.A.I. Maduwanthi, T.V.M. Weerasooriya, I.A. Dayananda, V.A.D.L. Karunarathna  
**Supervisors:** Isuru Samarappulige, Anuradha Ishani Yapa  

---

## 1. System Architecture Diagram

```
                                  +---------------------------------------+
                                  |     React 18 + Vite Web Dashboard     |
                                  |   (13 Specialized Operations Views)   |
                                  +-------------------+-------------------+
                                                      |
                                          REST API & WebSockets
                                                      |
                                  +-------------------v-------------------+
                                  |     Node.js / Express API Server      |
                                  | (RBAC, Secret Redactor, Audit Logger) |
                                  +-------------------+-------------------+
                                                      |
                   +----------------------------------+----------------------------------+
                   |                                                                     |
+------------------v------------------+                              +-------------------v-------------------+
|      Multi-Agent AI Engine          |                              |    DevOps Runtime & Sandbox Layer     |
| - PlannerAgent: Intent & Risk DAG   |                              | - Real GitHub REST API & Actions      |
| - ExecutorAgent: Multi-step runner  |                              | - Docker Engine Connector (Live/Mock) |
| - LogAnalyzerAgent: SRE RCA Studio  |                              | - Kubernetes kubectl (Deploy/Scale)   |
| - MonitoringAgent: Saturation Alert |                              | - GitHub Actions CI Runner (Pipelines)|
| - Vector RAG: 384-dim Cosine Engine |                              | - Terraform IaC & AWS Simulator       |
| - ManifestService: YAML Synthesizer |                              | - DevSecOps SAST Vulnerability Scanner|
| - LLM: Groq / OpenAI / Local Core   |                              | - Prometheus Exporter & PromQL Engine |
+------------------+------------------+                              +---------------------------------------+
                   |
+------------------v------------------+
|    3NF SQLite Relational Database   |
| - users (RBAC 4 roles)              |
| - requests                          |
| - task_plans (Risk: SAFE/HIGH_RISK) |
| - execution_logs                    |
| - system_metrics (CPU/RAM/Disk)     |
| - audit_records (Immutable trail)   |
+-------------------------------------+
```

---

## 2. The 13 Operations Modules

1. **AI Agent Console**: Natural language prompt input, streaming agent thought-process, DAG execution plans, and suggested prompt shortcuts.
2. **DevOps Overview**: High-level cluster KPIs (CPU, Memory, Disk, Active Pods), connected toolchain status, and recent autonomous task plans.
3. **GitHub Cloud Connector**: Real GitHub REST API connector with PAT token auth, real/sandbox repository browsing, commit timeline, and GitHub Actions workflow dispatch triggers.
4. **CI/CD Pipelines**: 8-stage Real GitHub Actions cloud workflow runner and local sandbox runner with live runner console log streaming.
5. **Log RCA Studio**: Pre-loaded thesis incidents (HTTP 500, DB Constraint Error, Kubernetes Pod CrashLoopBackOff, CI Rollup Failure) with AI Root Cause Analysis and 1-click remediation.
6. **Interactive Web Shell**: Live authenticated CLI shell running `docker`, `kubectl`, `git`, `node`, `curl` with RBAC guard.
7. **Manifest & Container Studio**: Autonomous synthesis of multi-stage Dockerfiles, K8s deployments, services, and CI workflows with 1-click download.
8. **DevSecOps Scanner**: Automated Static Analysis Security Testing (SAST) for Dockerfiles and Kubernetes YAML against CIS benchmarks, providing Security Scores (0-100) and letter grades.
9. **Dense Vector RAG Knowledge Base**: 384-dimensional dense vector space with FAISS-style Cosine Similarity indexing 17 enterprise Kubernetes, Docker, Terraform, CI/CD, and SRE runbooks with triple-mode retrieval (Vector Semantic, Hybrid, Keyword) and a side-by-side comparative benchmark modal.
10. **Infrastructure Hub**: Kubernetes deployment replica scaling steppers, pod crash recovery, Docker containers, and Terraform HCL generator.
11. **Metrics & Chaos Lab**: Real-time Chart.js telemetry, live Prometheus PromQL query runner, Prometheus text exposition `/metrics`, and Grafana dashboard provisioning.
12. **Audit Ledger**: Immutable compliance log with automatic masking of secrets, API keys, and passwords (`[REDACTED]`).
13. **Thesis Report & MTTR**: Quantitative evaluation dashboard comparing Manual vs. AI MTTR (97.4% reduction) with a 1-click **Export Thesis Report (.md)** button.

---

## 3. Quick Setup & Run (Examiner / New Laptop)

The entire platform is designed for **100% portability** with zero mandatory external database installations (no MongoDB required) and zero required paid API subscriptions.

### Option 1: 1-Click Automated Startup (Windows)
Double-click:
👉 **`start-dev.bat`**

*This script automatically checks for missing dependencies, initializes `.env`, installs packages, and launches both the backend and frontend servers in separate windows.*

---

### Option 2: Manual Terminal Startup

#### 1. Clone Repository:
```bash
git clone https://github.com/DulaniLakmali/Smart-DevOps-Assistant.git
cd Smart-DevOps-Assistant
```

#### 2. Install All Dependencies:
```bash
npm run install:all
```
*(or manually run `npm install` inside both `backend/` and `frontend/` directories)*

#### 3. Setup Environment Variables:
Copy the example environment file:
```bash
# Windows Command Prompt / PowerShell:
copy backend\.env.example backend\.env

# Linux / macOS:
cp backend/.env.example backend/.env
```
*(Optionally add your `GITHUB_TOKEN` to enable real GitHub Actions dispatching and runner log streaming).*

#### 4. Launch Servers:
```bash
# In terminal 1 (Backend API):
npm run backend

# In terminal 2 (Frontend Client):
npm run frontend
```

- **Dashboard:** [http://localhost:5173](http://localhost:5173)
- **API Health:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Prometheus Telemetry:** [http://localhost:5000/metrics](http://localhost:5000/metrics)

---

### Option 3: Production Containerized Deployment (Docker Compose)
```bash
docker compose up --build
```
Runs both the backend API and Nginx-powered frontend in production containers.

---

## 4. Run Automated Evaluation Test Suite (TC001 to TC009)

The project includes an end-to-end automated test runner validating all core Chapter 6 thesis contributions:

```bash
npm test
```

### Verified Test Cases (100% Pass Rate):
- **[TC001] User Query Processing & Intent DAG:** Generates multi-step DAG plans with safety risk classification.
- **[TC002] CI/CD Pipeline Trigger:** Initializes 6-stage continuous integration workflow.
- **[TC003] SRE Log Analyzer:** Diagnoses Kubernetes CrashLoopBackOff & Exit Code 137 (OOMKilled) with autonomous remediation command.
- **[TC004] SQLite 3NF Database Persistence:** Verifies relational task plans and execution state retrieval.
- **[TC005] High-Risk Safety Gating:** Human-in-the-loop approval interception for destructive actions (`DROP TABLE`, `delete cluster`).
- **[TC006] Real GitHub API Connector:** Authenticates, browses repositories, workflows, and dispatches live GitHub Actions jobs.
- **[TC007] Autonomous SRE Auto-Remediation Dispatch:** Executes remediation commands via CLI runner with stdout validation.
- **[TC008] Prometheus Metrics Exporter & PromQL Engine:** Verifies `/metrics` exposition and real-time PromQL expression evaluation.
- **[TC009] Dense Vector RAG Knowledge Engine:** Validates 384-dimensional vector space, cosine similarity ranking, natural language semantic retrieval, and comparative benchmark against legacy keyword search.
