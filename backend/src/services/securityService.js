/**
 * DevSecOps Security & Compliance Scanner (Chapter 7.6)
 * Static Analysis Security Testing (SAST) for Dockerfiles, Kubernetes manifests, and IaC templates.
 */

export class SecurityService {
  static scanConfiguration({ content, type = "dockerfile" }) {
    const findings = [];
    let deduction = 0;

    const lower = content.toLowerCase();

    if (type === "dockerfile") {
      // 1. Root User Check
      if (!lower.includes("user ") || lower.includes("user root") || lower.includes("user 0")) {
        findings.push({
          id: "SEC-DKR-001",
          severity: "CRITICAL",
          rule: "Container Runs as Root User",
          description: "No dedicated non-root user defined. Processes run as root (UID 0) inside container.",
          remediation: "Add 'RUN adduser -S appuser && USER appuser' to drop root privileges."
        });
        deduction += 30;
      }

      // 2. Unpinned Base Image (:latest)
      if (lower.includes(":latest") || !lower.includes(":")) {
        findings.push({
          id: "SEC-DKR-002",
          severity: "HIGH",
          rule: "Unpinned or ':latest' Base Image",
          description: "Using ':latest' creates non-reproducible builds and risks pulling unexpected breaking changes.",
          remediation: "Pin base image to explicit version or SHA (e.g., 'node:20.11-alpine')."
        });
        deduction += 20;
      }

      // 3. Sensitive Credentials in Build Instructions
      if (lower.match(/(password|secret|api_key|token)\s*=/)) {
        findings.push({
          id: "SEC-DKR-003",
          severity: "CRITICAL",
          rule: "Hardcoded Credential or Token in Dockerfile",
          description: "Found plain-text secret pattern in environment or argument instruction.",
          remediation: "Use BuildKit secrets mount: '--mount=type=secret,id=mysecret'."
        });
        deduction += 35;
      }

      // 4. Exposed SSH Port 22
      if (lower.includes("expose 22")) {
        findings.push({
          id: "SEC-DKR-004",
          severity: "HIGH",
          rule: "Insecure SSH Port Exposed",
          description: "Containers should not run SSH servers. Use container orchestration tools for management.",
          remediation: "Remove 'EXPOSE 22' and SSH daemon installations from container."
        });
        deduction += 15;
      }

      // 5. Missing .dockerignore or node_modules copy
      if (lower.includes("copy . .") && !lower.includes("package*.json")) {
        findings.push({
          id: "SEC-DKR-005",
          severity: "MEDIUM",
          rule: "Unoptimized Cache Layering",
          description: "Copying all files at once prevents Docker build caching for dependency layers.",
          remediation: "Copy package*.json first, run npm install, then copy source code."
        });
        deduction += 10;
      }
    } else if (type === "kubernetes") {
      // 1. Privileged Container Check
      if (lower.includes("privileged: true")) {
        findings.push({
          id: "SEC-K8S-001",
          severity: "CRITICAL",
          rule: "Privileged Container Execution",
          description: "Container has host root capabilities and can bypass kernel namespace isolation.",
          remediation: "Set 'securityContext.privileged: false' and drop all unnecessary Linux capabilities."
        });
        deduction += 40;
      }

      // 2. Missing Resource Limits (DoS Risk)
      if (!lower.includes("limits:") || !lower.includes("memory:")) {
        findings.push({
          id: "SEC-K8S-002",
          severity: "HIGH",
          rule: "Missing Memory & CPU Resource Limits",
          description: "Without resource limits, a compromised pod can starve all other pods on the worker node.",
          remediation: "Define 'resources.limits.memory' and 'resources.limits.cpu' in container spec."
        });
        deduction += 25;
      }

      // 3. Root Filesystem is Writable
      if (!lower.includes("readonlyrootfilesystem: true")) {
        findings.push({
          id: "SEC-K8S-003",
          severity: "MEDIUM",
          rule: "Writable Container Root Filesystem",
          description: "An attacker could write malware or backdoors directly to container root filesystem.",
          remediation: "Set 'securityContext.readOnlyRootFilesystem: true' and use emptyDir volumes for temp files."
        });
        deduction += 15;
      }
    }

    // Compute Score (0-100) and Letter Grade
    const score = Math.max(10, 100 - deduction);
    let grade = "A";
    if (score < 60) grade = "F";
    else if (score < 70) grade = "D";
    else if (score < 80) grade = "C";
    else if (score < 90) grade = "B";

    return {
      type,
      score,
      grade,
      findingsCount: findings.length,
      findings,
      scannedAt: new Date().toISOString()
    };
  }
}
