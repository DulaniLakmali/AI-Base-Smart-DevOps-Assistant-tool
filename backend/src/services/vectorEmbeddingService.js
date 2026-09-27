import axios from "axios";
import { config } from "../config/env.js";

/**
 * Enterprise Vector Embedding Service (Chapter 5.1.3 & 5.3)
 * Generates normalized 384-dimensional dense semantic vectors.
 * Features an in-process semantic concept encoder with optional cloud API fallback.
 */

export const VECTOR_DIMENSION = 384;

// Key semantic conceptual clusters across cloud & DevOps domains
const DEVOPS_CONCEPT_ANCHORS = [
  // 0-31: Memory, OOM, cgroups, resource saturation, heap, garbage collection
  ["memory", "oom", "oomkilled", "exit 137", "ram", "sigkill", "cgroup", "heap", "leak", "exhaustion", "allocation", "limit", "swap", "rss", "vsz", "buffer"],
  // 32-63: CPU, throttling, cores, spikes, thread starvation, utilization, load average
  ["cpu", "throttle", "throttling", "spike", "cores", "utilization", "saturation", "multithread", "loop", "load", "capacity", "usage", "quota", "period"],
  // 64-95: Autoscaling, HPA, VPA, replicas, scale out, scale in, thrashing, stabilization
  ["autoscale", "autoscaling", "hpa", "vpa", "scale", "replicas", "minreplicas", "maxreplicas", "stabilization", "thrashing", "horizontal", "vertical"],
  // 96-127: CrashLoopBackOff, pod termination, liveness probe, readiness, exit code, restart
  ["crashloop", "crashloopbackoff", "liveness", "readiness", "probe", "restart", "failure", "backoff", "terminated", "exit code", "unhealthy", "panic"],
  // 128-159: Ingress, networking, reverse proxy, 502, 504, timeout, dns, service, gateway
  ["ingress", "network", "proxy", "502", "504", "gateway", "timeout", "dns", "endpoint", "port", "service", "traffic", "loadbalancer", "route", "ssl"],
  // 160-191: Docker, containers, images, multi-stage, rootless, caching, buildkit, layers
  ["docker", "container", "dockerfile", "image", "multistage", "rootless", "cache", "buildkit", "layer", "alpine", "distroless", "entrypoint", "uid"],
  // 192-223: ImagePullBackOff, registry, credentials, token, authentication, unauthorized
  ["imagepullbackoff", "errimagepull", "registry", "pull", "secret", "auth", "unauthorized", "dockerconfigjson", "credentials", "tag", "repository"],
  // 224-255: Terraform, IaC, infrastructure, state, locking, drift, s3, dynamodb, modules
  ["terraform", "iac", "infrastructure", "state", "lock", "locking", "drift", "s3", "dynamodb", "vpc", "subnet", "provision", "hcl", "plan", "apply"],
  // 256-287: CI/CD, GitHub Actions, workflows, pipeline, runners, jobs, dispatch, test
  ["cicd", "pipeline", "github", "actions", "workflow", "runner", "dispatch", "build", "stage", "job", "checkout", "lint", "test", "deploy", "release"],
  // 288-319: Security, DevSecOps, zero-trust, rbac, sast, vulnerability, trivy, least privilege
  ["security", "devsecops", "zerotrust", "rbac", "sast", "vulnerability", "trivy", "cve", "policy", "leastprivilege", "audit", "compliance", "token"],
  // 320-351: Observability, Prometheus, Grafana, PromQL, metrics, golden signals, alerting
  ["prometheus", "grafana", "promql", "metrics", "telemetry", "alert", "alerting", "goldensignals", "latency", "traffic", "errors", "scrape", "exporter"],
  // 352-383: SRE, MTTR, MTTD, incidents, postmortem, remediation, self-healing, reliability
  ["sre", "mttr", "mttd", "incident", "runbook", "remediation", "selfhealing", "recovery", "resilience", "availability", "sla", "slo", "sli", "healing"]
];

/**
 * Deterministic Murmur-like string hashing for word tokenization
 */
function hashString(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export class VectorEmbeddingService {
  /**
   * Generates a normalized 384-dimensional dense semantic embedding vector
   */
  static async generateEmbedding(text) {
    // 1. Check if OpenAI API key is present for optional external embedding
    if (config.OPENAI_API_KEY && config.OPENAI_API_KEY.startsWith("sk-")) {
      try {
        const response = await axios.post(
          "https://api.openai.com/v1/embeddings",
          {
            input: text.slice(0, 8000),
            model: "text-embedding-3-small",
            dimensions: VECTOR_DIMENSION
          },
          {
            headers: {
              Authorization: `Bearer ${config.OPENAI_API_KEY}`,
              "Content-Type": "application/json"
            },
            timeout: 5000
          }
        );

        if (response.data?.data?.[0]?.embedding) {
          return this.normalizeVector(response.data.data[0].embedding);
        }
      } catch (err) {
        console.warn("OpenAI embedding API failed, falling back to local dense vector engine:", err.message);
      }
    }

    // 2. High-Fidelity Local Dense Semantic Vector Engine (FAISS Compatible)
    return this.generateLocalDenseEmbedding(text);
  }

  /**
   * Local Dense Semantic Vector Generator
   * Projects text into 384-dimensional continuous semantic space.
   */
  static generateLocalDenseEmbedding(text) {
    const cleanText = (text || "").toLowerCase();
    const tokens = cleanText.split(/[\s,.;:!?_/\-()[\]{}"]+/).filter((t) => t.length > 1);

    const vector = new Float32Array(VECTOR_DIMENSION);

    // Phase 1: Conceptual Cluster Projection
    DEVOPS_CONCEPT_ANCHORS.forEach((cluster, clusterIdx) => {
      const startDim = clusterIdx * 32;
      let clusterWeight = 0;

      for (const token of tokens) {
        for (const concept of cluster) {
          if (token === concept) {
            clusterWeight += 2.5;
          } else if (token.includes(concept) || concept.includes(token)) {
            clusterWeight += 1.2;
          }
        }
      }

      if (clusterWeight > 0) {
        for (let offset = 0; offset < 32; offset++) {
          const dim = startDim + offset;
          const phase = (offset / 32) * Math.PI * 2;
          vector[dim] += clusterWeight * Math.cos(phase);
        }
      }
    });

    // Phase 2: Token N-gram Subword Semantic Dispersion
    tokens.forEach((token, idx) => {
      const tokenPositionWeight = 1.0 + 1.0 / (idx + 1); // Earlier terms carry slightly higher prompt weight
      const h1 = hashString(token, 42);
      const h2 = hashString(token, 137);

      const targetDim1 = Math.abs(h1) % VECTOR_DIMENSION;
      const targetDim2 = Math.abs(h2) % VECTOR_DIMENSION;
      const targetDim3 = (targetDim1 + targetDim2) % VECTOR_DIMENSION;

      vector[targetDim1] += 0.85 * tokenPositionWeight;
      vector[targetDim2] += 0.65 * tokenPositionWeight;
      vector[targetDim3] += 0.45 * tokenPositionWeight;
    });

    // Phase 3: L2 Normalization (ensures ||v|| = 1.0 so dot product === cosine similarity)
    return this.normalizeVector(Array.from(vector));
  }

  /**
   * L2 Vector Normalization
   */
  static normalizeVector(vector) {
    let norm = 0;
    for (let i = 0; i < vector.length; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);

    if (norm === 0) return vector;

    const normalized = new Array(vector.length);
    for (let i = 0; i < vector.length; i++) {
      normalized[i] = parseFloat((vector[i] / norm).toFixed(6));
    }
    return normalized;
  }

  /**
   * Computes exact Cosine Similarity between two normalized vectors:
   * sim(A, B) = A • B / (||A|| * ||B||)
   */
  static computeCosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
    }

    // Since vectors are L2-normalized, dotProduct is the cosine similarity
    return Math.max(0, Math.min(1.0, dotProduct));
  }
}
