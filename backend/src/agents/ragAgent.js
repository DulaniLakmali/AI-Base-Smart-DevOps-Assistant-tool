import { VectorIndexService } from "../services/vectorIndexService.js";

/**
 * Enterprise Vector RAG Agent (Chapter 5.1.3 & 5.3)
 * Indexes production-grade Kubernetes, Docker, Terraform, CI/CD, and SRE runbooks
 * into a FAISS-style Cosine Similarity dense vector embedding space.
 */

export const DEVOPS_KNOWLEDGE_BASE = [
  {
    id: "k8s-hpa",
    title: "Kubernetes Horizontal Pod Autoscaling (HPA)",
    category: "Kubernetes",
    tags: ["k8s", "autoscaling", "hpa", "scaling", "cpu", "memory", "saturation"],
    summary: "Automatically scales the number of Pods in a deployment based on observed CPU and memory utilization thresholds.",
    docUrl: "https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/",
    content: `HorizontalPodAutoscaler automatically scales the number of Pods in a deployment, replication controller, or replica set based on observed CPU utilization or custom metrics.
Best Practices:
- Always set resource requests and limits on your container specifications so metrics-server can compute percentage utilization.
- Typical target average CPU utilization is 70-80% to absorb transient traffic spikes before scaling kicks in.
- Configure scaleDown stabilizationWindowSeconds (default 300s) to avoid thrashing (rapid flapping of pod counts).`,
    snippet: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 75`
  },
  {
    id: "k8s-oomkilled",
    title: "Kubernetes Exit Code 137 (OOMKilled) Troubleshooting Runbook",
    category: "Incident Response",
    tags: ["k8s", "oomkilled", "exit 137", "memory", "crash", "sre", "cgroup", "ram"],
    summary: "Troubleshooting and resolution guide for pods terminated by Linux kernel cgroup OOM-killer due to memory limit exhaustion.",
    docUrl: "https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/",
    content: `When a container process exceeds its assigned memory limit, the Linux kernel cgroup OOM-killer sends SIGKILL (signal 9), causing exit code 137 (128 + 9).
Resolution Steps:
1. Identify offending container: kubectl describe pod <pod_name> | grep -A 3 -B 3 OOMKilled
2. Check recent usage: kubectl top pod <pod_name> --containers
3. Increase memory limits in pod deployment or tune JVM / Node.js garbage collection heap parameters (--max-old-space-size).
4. Implement proper graceful degradation and stream large files instead of loading into RAM.`,
    snippet: `resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"   # Increase limit to prevent cgroup SIGKILL
    cpu: "500m"`
  },
  {
    id: "k8s-crashloopbackoff",
    title: "Kubernetes CrashLoopBackOff & Liveness Probe Diagnostics",
    category: "Incident Response",
    tags: ["k8s", "crashloop", "liveness", "probe", "restart", "diagnostics", "backoff"],
    summary: "Diagnose and resolve recurring container crashes and misconfigured health probes in Kubernetes pods.",
    docUrl: "https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/",
    content: `CrashLoopBackOff indicates that a pod started, failed, was restarted by the kubelet, and failed repeatedly in an exponential backoff loop.
Common Causes:
- Application panic or unhandled exception during initialization.
- Missing required environment variables or secrets.
- Overly aggressive liveness probe failureThreshold or too-short initialDelaySeconds killing slow-starting apps.
Remediation:
1. Run kubectl logs <pod-name> --previous to examine panic logs prior to container exit.
2. Add startupProbe with initialDelaySeconds: 15 to give runtime sufficient time to warm up caches before liveness checks begin.`,
    snippet: `startupProbe:
  httpGet:
    path: /api/health
    port: 5000
  failureThreshold: 30
  periodSeconds: 10
livenessProbe:
  httpGet:
    path: /api/health
    port: 5000
  initialDelaySeconds: 10
  periodSeconds: 15`
  },
  {
    id: "k8s-ingress-502",
    title: "Kubernetes Ingress 502/504 Bad Gateway Resolution",
    category: "Networking",
    tags: ["ingress", "network", "502", "504", "gateway", "timeout", "service", "dns"],
    summary: "Diagnose and mitigate 502 Bad Gateway and 504 Gateway Timeout errors across NGINX Ingress and Service endpoints.",
    docUrl: "https://kubernetes.io/docs/concepts/services-networking/ingress/",
    content: `HTTP 502 Bad Gateway indicates the ingress controller received an invalid response or connection reset from the upstream backend pod.
Troubleshooting Checklist:
- Verify service endpoints: kubectl get endpoints <service-name>. If endpoints list is empty, pod selector labels mismatch the deployment.
- Check keepalive timeouts: Ensure backend container keepAliveTimeout exceeds the ingress proxy-connect-timeout (typically 65s).
- Verify container targetPort matches the port your backend application listens on.`,
    snippet: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "15"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "600"
spec:
  rules:
  - host: devops.internal
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 5000`
  },
  {
    id: "k8s-imagepullbackoff",
    title: "Kubernetes ImagePullBackOff & Registry Authentication Secrets",
    category: "Kubernetes",
    tags: ["k8s", "imagepullbackoff", "registry", "docker", "auth", "secret", "credentials"],
    summary: "Resolving image pull failures and configuring imagePullSecrets for authenticated container registries.",
    docUrl: "https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/",
    content: `ImagePullBackOff occurs when the kubelet cannot pull a container image due to invalid image tags, network connectivity issues, or missing registry credentials.
Resolution:
1. Create a Kubernetes docker-registry secret:
   kubectl create secret docker-registry regcred --docker-server=<registry> --docker-username=<user> --docker-password=<token>
2. Add imagePullSecrets to the deployment specification.`,
    snippet: `spec:
  imagePullSecrets:
  - name: regcred
  containers:
  - name: backend-api
    image: ghcr.io/dulanilakmali/smart-devops-backend:latest
    imagePullPolicy: IfNotPresent`
  },
  {
    id: "k8s-networkpolicy",
    title: "Kubernetes NetworkPolicies & Zero-Trust Pod Isolation",
    category: "Security",
    tags: ["k8s", "networkpolicy", "security", "zerotrust", "firewall", "isolation"],
    summary: "Enforce micro-segmentation and least-privilege traffic flow between Kubernetes pods using declarative NetworkPolicies.",
    docUrl: "https://kubernetes.io/docs/concepts/services-networking/network-policies/",
    content: `By default, all pods in a Kubernetes cluster can communicate with all other pods. Implementing a default-deny ingress policy enforces Zero-Trust network architecture.
Best Practices:
- Apply default-deny-all ingress NetworkPolicy on production namespaces.
- Explicitly whitelist ingress traffic only from frontend ingress controllers or authorized microservices.`,
    snippet: `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
spec:
  podSelector: {}
  policyTypes:
  - Ingress`
  },
  {
    id: "docker-multistage",
    title: "Production Multi-Stage Dockerfile Best Practices",
    category: "Docker",
    tags: ["docker", "dockerfile", "security", "optimization", "multistage", "caching", "build"],
    summary: "Constructing lean, secure, and reproducible production container images using multi-stage builds and layer caching.",
    docUrl: "https://docs.docker.com/build/building/multi-stage/",
    content: `Multi-stage builds separate the build environment (compilers, build tools, devDependencies) from the final minimal runtime image.
Security Rules:
1. Never run containers as root (UID 0); define a dedicated non-root user.
2. Use minimal base images like alpine or distroless to reduce the attack surface.
3. Cache dependency layers by copying package.json before source files.`,
    snippet: `# Stage 1: Build Environment
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --frozen-lockfile
COPY . .
RUN npm run build

# Stage 2: Hardened Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev && chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3000
CMD ["node", "dist/index.js"]`
  },
  {
    id: "docker-rootless",
    title: "Rootless Containers & Principle of Least Privilege",
    category: "Security",
    tags: ["docker", "security", "rootless", "leastprivilege", "nonroot", "cgroups"],
    summary: "Eliminating container breakout risks by executing container daemons and runtimes as unprivileged user IDs.",
    docUrl: "https://docs.docker.com/engine/security/rootless/",
    content: `Executing containers as root (UID 0) exposes the host Linux kernel to container breakout vulnerabilities (CVE-2024-21626, runc leaks).
Implementation:
- In Dockerfile, execute USER 10001:10001.
- In Kubernetes securityContext, enforce runAsNonRoot: true and drop all Linux capabilities except NET_BIND_SERVICE.`,
    snippet: `securityContext:
  runAsNonRoot: true
  runAsUser: 10001
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop:
    - ALL`
  },
  {
    id: "docker-layer-cache",
    title: "Docker Layer Caching & BuildKit Speedups",
    category: "Docker",
    tags: ["docker", "buildkit", "cache", "performance", "ci", "speed"],
    summary: "Maximizing CI/CD pipeline build speeds through BuildKit cache mounts and deterministic layer ordering.",
    docUrl: "https://docs.docker.com/build/cache/",
    content: `Every instruction in a Dockerfile creates an immutable layer. Structuring instructions from least-frequently changing to most-frequently changing avoids cache invalidation.
Tactics:
- Enable BuildKit: DOCKER_BUILDKIT=1 docker build .
- Use --mount=type=cache,target=/root/.npm to preserve npm caches across CI runs without bloating the image.`,
    snippet: `# syntax=docker/dockerfile:1
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm install
COPY . .
RUN npm run build`
  },
  {
    id: "terraform-aws-vpc",
    title: "Terraform AWS Resilient Infrastructure Module",
    category: "Terraform",
    tags: ["terraform", "iac", "aws", "vpc", "security", "cloud", "architecture"],
    summary: "Declarative Terraform configuration for highly available multi-AZ cloud deployments with private database subnets.",
    docUrl: "https://registry.terraform.io/providers/hashicorp/aws/latest/docs",
    content: `Infrastructure as Code (IaC) ensures immutable, repeatable cloud environments.
Key Architectural Standards:
- Split resources across at least 2 Availability Zones (AZs) for high availability.
- Keep application databases in private subnets with NAT gateways, not exposed to the public internet.
- Enable Terraform remote state storage in encrypted AWS S3 buckets with DynamoDB state locking.`,
    snippet: `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Environment = "Production"
      ManagedBy   = "Terraform-Agent"
    }
  }
}`
  },
  {
    id: "terraform-state-locking",
    title: "Terraform Remote State Locking & S3 Encryption",
    category: "Terraform",
    tags: ["terraform", "state", "locking", "s3", "dynamodb", "security", "iac"],
    summary: "Preventing concurrent pipeline race conditions and securing sensitive state files using S3 server-side encryption.",
    docUrl: "https://developer.hashicorp.com/terraform/language/settings/backends/s3",
    content: `Concurrent terraform apply executions can corrupt state files. Configuring an S3 backend with DynamoDB locking ensures mutual exclusion.
Security Checklist:
- Enable S3 server-side encryption (AES256 or AWS KMS).
- Block public access on state buckets.
- Enforce TLS in bucket policies (aws:SecureTransport: true).`,
    snippet: `terraform {
  backend "s3" {
    bucket         = "devops-assistant-tf-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-locks"
    encrypt        = true
  }
}`
  },
  {
    id: "terraform-drift-sync",
    title: "Terraform Infrastructure Drift Detection & Auto-Sync",
    category: "Terraform",
    tags: ["terraform", "drift", "iac", "sync", "reconciliation", "audit"],
    summary: "Detect and remediate out-of-band cloud modifications using automated drift detection and scheduled reconciliations.",
    docUrl: "https://developer.hashicorp.com/terraform/tutorials/state/resource-drift",
    content: `Drift occurs when resources are modified directly via cloud consoles rather than through Terraform manifests.
Remediation:
- Execute terraform plan -detailed-exitcode in scheduled CI cron jobs. Exit code 2 indicates drift.
- Use terraform refresh or terraform apply to reconcile real cloud state with declarative manifests.`,
    snippet: `# Shell command to detect drift in CI
terraform plan -detailed-exitcode -out=tfplan
if [ $? -eq 2 ]; then
  echo "⚠️ Infrastructure drift detected! Triggering alert."
fi`
  },
  {
    id: "ci-github-actions",
    title: "GitHub Actions Zero-Trust CI/CD Pipeline Standards",
    category: "CI/CD",
    tags: ["github", "ci", "actions", "pipeline", "security", "deploy", "zerotrust"],
    summary: "Hardening GitHub Actions workflows with OpenID Connect (OIDC), secrets management, and automated security gates.",
    docUrl: "https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions",
    content: `CI/CD security requires preventing unauthorized deployment modifications and token leaks.
Guidelines:
- Never log raw secrets; use GitHub Actions Secret masks.
- Pin third-party GitHub Actions to full commit SHAs, not mutable tags.
- Run static security scanning (SAST) and dependency vulnerability audits before container build steps.`,
    snippet: `name: Production CI/CD
on:
  push:
    branches: [ main ]
permissions:
  contents: read
  packages: write
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm audit --audit-level=high
      - run: npm test`
  },
  {
    id: "sec-container-sast",
    title: "Automated Container Vulnerability SAST Scanning (Trivy)",
    category: "Security",
    tags: ["security", "trivy", "sast", "vulnerability", "cve", "docker", "scanner"],
    summary: "Shifting security left by integrating static container vulnerability scanning and CVE severity gates in CI/CD.",
    docUrl: "https://aquasecurity.github.io/trivy/",
    content: `Vulnerability scanners detect known CVEs in container base images and application dependencies before deployment.
Gate Policy:
- Fail the CI pipeline if CRITICAL or HIGH vulnerabilities are detected with available patches.
- Scan container images: trivy image --severity HIGH,CRITICAL --exit-code 1 <image-name>.`,
    snippet: `- name: Run Trivy Vulnerability Scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'smart-devops-backend:latest'
    format: 'table'
    exit-code: '1'
    ignore-unfixed: true
    vuln-type: 'os,library'
    severity: 'CRITICAL,HIGH'`
  },
  {
    id: "ci-gitops-argocd",
    title: "GitOps Continuous Delivery with ArgoCD & Flux",
    category: "CI/CD",
    tags: ["gitops", "argocd", "flux", "kubernetes", "cd", "continuous-delivery"],
    summary: "Implementing declarative GitOps continuous delivery where Git serves as the single source of truth for cluster state.",
    docUrl: "https://argo-cd.readthedocs.io/en/stable/",
    content: `GitOps automates deployment by continuously reconciling live cluster state against declarative manifests in Git repositories.
Advantages:
- Eliminate direct developer kubectl access to production clusters.
- Automatic rollbacks on commit revert with full audit traceability.`,
    snippet: `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: smart-devops-assistant
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/DulaniLakmali/Smart-DevOps-Assistant.git
    targetRevision: HEAD
    path: k8s
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true`
  },
  {
    id: "prom-alert-thresholds",
    title: "Prometheus Alerting Thresholds & MTTD Optimization",
    category: "Observability",
    tags: ["prometheus", "alert", "alerting", "promql", "mttd", "monitoring", "threshold"],
    summary: "Designing high-signal, low-noise alerting rules using PromQL rate expressions and multi-window burn rates.",
    docUrl: "https://prometheus.io/docs/alerting/latest/alerting_rules/",
    content: `Poor alerting thresholds cause alert fatigue. Alerts should measure symptoms that directly impact user experience rather than transient micro-spikes.
Rules:
- Measure rate over moving time windows (e.g. rate(http_requests_total[5m]) > threshold for 3m).
- CPU saturation alerts should require sustained utilization >85% for at least 5 minutes before triggering paging notifications.`,
    snippet: `groups:
- name: resource_alerts
  rules:
  - alert: HighCpuUsage
    expr: devops_system_cpu_percent > 85
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High CPU utilization detected on {{ $labels.instance }}"
      description: "CPU has exceeded 85% for more than 5 minutes."`
  },
  {
    id: "sre-golden-signals",
    title: "SRE Four Golden Signals Observability Architecture",
    category: "Observability",
    tags: ["sre", "goldensignals", "latency", "traffic", "errors", "saturation", "metrics"],
    summary: "The Google SRE Four Golden Signals framework for monitoring distributed cloud-native microservices.",
    docUrl: "https://sre.google/sre-book/monitoring-distributed-systems/",
    content: `The Four Golden Signals are the essential telemetry metrics for understanding system health:
1. Latency: The time it takes to service a request (differentiating successful requests from errors).
2. Traffic: A measure of demand on the system (e.g., HTTP requests/sec).
3. Errors: The rate of requests that fail (explicit 5xx errors or implicit timeouts).
4. Saturation: A measure of resource capacity utilization (CPU, RAM RSS, file descriptors).`,
    snippet: `# Prometheus queries for Golden Signals:
# 1. Latency (95th percentile):
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
# 2. Traffic (req/s):
sum(rate(devops_http_requests_total[1m]))
# 3. Error Rate (%):
sum(rate(devops_http_requests_total{status=~"5.."}[1m])) / sum(rate(devops_http_requests_total[1m])) * 100
# 4. Saturation (%):
devops_system_memory_percent`
  }
];

export class RAGAgent {
  static isInitialized = false;
  static initPromise = null;

  /**
   * Initializes the vector index with the complete enterprise knowledge base
   */
  static async init() {
    if (this.isInitialized) return;
    if (!this.initPromise) {
      this.initPromise = VectorIndexService.initializeIndex(DEVOPS_KNOWLEDGE_BASE).then(() => {
        this.isInitialized = true;
      });
    }
    return this.initPromise;
  }

  /**
   * Vector-powered semantic search with hybrid and legacy keyword fallback
   */
  static async searchKnowledge(query, options = {}) {
    await this.init();
    return await VectorIndexService.search(query, options);
  }

  /**
   * Compare Vector RAG vs Legacy Keyword RAG side-by-side
   */
  static async compareSearch(query, limit = 4) {
    await this.init();
    return await VectorIndexService.compareSearch(query, limit);
  }

  /**
   * Retrieve all indexed documents
   */
  static getAllDocs() {
    return DEVOPS_KNOWLEDGE_BASE;
  }

  /**
   * Get vector index engine statistics
   */
  static getIndexStatus() {
    const status = VectorIndexService.getStatus();
    return {
      initialized: this.isInitialized,
      ...status,
      dimension: status.vectorDimension || 384,
      totalDocs: DEVOPS_KNOWLEDGE_BASE.length
    };
  }
}

// Auto-initialize on module load
RAGAgent.init().catch(console.error);
