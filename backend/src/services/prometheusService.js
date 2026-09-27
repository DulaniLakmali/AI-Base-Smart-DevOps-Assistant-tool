import client from "prom-client";
import axios from "axios";

/**
 * Enterprise Prometheus Telemetry Service
 * Exposes /metrics endpoint compatible with Prometheus Scrapers and Grafana.
 * Features an internal PromQL evaluator with external Prometheus fallback.
 */

// 1. Initialize Prometheus Registry
const register = new client.Registry();
register.setDefaultLabels({
  app: "smart-devops-assistant",
  env: process.env.NODE_ENV || "production"
});

// 2. Collect Standard Node.js & Host Metrics
client.collectDefaultMetrics({
  register,
  timeout: 5000
});

// 3. Define Custom DevOps & Cloud Metrics
export const systemCpuGauge = new client.Gauge({
  name: "devops_system_cpu_percent",
  help: "Current system CPU utilization percentage (0-100%)",
  registers: [register]
});

export const systemMemoryGauge = new client.Gauge({
  name: "devops_system_memory_percent",
  help: "Current system Memory utilization percentage (0-100%)",
  registers: [register]
});

export const activePodsGauge = new client.Gauge({
  name: "devops_active_pods_count",
  help: "Number of active healthy Kubernetes pods",
  registers: [register]
});

export const httpRequestsCounter = new client.Counter({
  name: "devops_http_requests_total",
  help: "Total HTTP requests served by Smart DevOps Assistant API",
  labelNames: ["method", "route", "status"],
  registers: [register]
});

export const agentTasksCounter = new client.Counter({
  name: "devops_agent_tasks_total",
  help: "Total tasks executed across AI DevOps multi-agent teams",
  labelNames: ["agent", "status"],
  registers: [register]
});

export const chaosFaultsCounter = new client.Counter({
  name: "devops_chaos_faults_total",
  help: "Total Chaos Engineering faults injected",
  labelNames: ["fault_type"],
  registers: [register]
});

export class PrometheusService {
  static getRegister() {
    return register;
  }

  static getContentType() {
    return register.contentType;
  }

  /**
   * Returns formatted Prometheus exposition text for /metrics
   */
  static async getMetrics() {
    return await register.metrics();
  }

  /**
   * Synchronize active hardware/chaos metrics with Prometheus gauges
   */
  static updateTelemetryMetrics({ cpu, memory, activePods }) {
    if (typeof cpu === "number") systemCpuGauge.set(cpu);
    if (typeof memory === "number") systemMemoryGauge.set(memory);
    if (typeof activePods === "number") activePodsGauge.set(activePods);
  }

  static recordHttpRequest(method, route, statusCode) {
    httpRequestsCounter.inc({
      method: method || "GET",
      route: route || "unknown",
      status: String(statusCode || 200)
    });
  }

  static recordAgentTask(agent, status = "success") {
    agentTasksCounter.inc({ agent: agent || "CoordinatorAgent", status });
  }

  static recordChaosFault(faultType) {
    chaosFaultsCounter.inc({ fault_type: faultType || "general" });
  }

  /**
   * Check if external Prometheus server is available
   */
  static async getStatus() {
    const prometheusUrl = process.env.PROMETHEUS_URL || "http://localhost:9090";
    let isConnected = false;
    let version = "embedded";

    try {
      const res = await axios.get(`${prometheusUrl}/api/v1/status/buildinfo`, { timeout: 1500 });
      if (res.data && res.data.status === "success") {
        isConnected = true;
        version = res.data.data?.version || "external";
      }
    } catch (err) {
      isConnected = false;
    }

    const metricsList = await register.getMetricsAsJSON();

    return {
      connected: isConnected,
      mode: isConnected ? "EXTERNAL_PROMETHEUS" : "EMBEDDED_EXPORTER",
      prometheusUrl,
      exporterPath: "/metrics",
      version,
      metricsCount: metricsList.length,
      availableCustomMetrics: [
        "devops_system_cpu_percent",
        "devops_system_memory_percent",
        "devops_active_pods_count",
        "devops_http_requests_total",
        "devops_agent_tasks_total",
        "devops_chaos_faults_total",
        "process_cpu_user_seconds_total",
        "process_resident_memory_bytes",
        "nodejs_heap_size_used_bytes",
        "nodejs_eventloop_lag_seconds"
      ]
    };
  }

  /**
   * Execute PromQL query against Prometheus or fallback to internal registry
   */
  static async queryPromQL(queryStr) {
    const trimmed = (queryStr || "").trim();
    if (!trimmed) {
      throw new Error("Query string cannot be empty");
    }

    const prometheusUrl = process.env.PROMETHEUS_URL || "http://localhost:9090";

    // 1. Attempt Live Prometheus API Query
    try {
      const response = await axios.get(`${prometheusUrl}/api/v1/query`, {
        params: { query: trimmed },
        timeout: 1500
      });

      if (response.data && response.data.status === "success") {
        return {
          status: "success",
          source: "PROMETHEUS_SERVER",
          query: trimmed,
          serverUrl: prometheusUrl,
          data: response.data.data
        };
      }
    } catch (err) {
      // Fallback to internal registry evaluation
    }

    // 2. Embedded Fallback Registry Evaluation
    const nowTimestamp = Math.floor(Date.now() / 1000);
    const metricsJson = await register.getMetricsAsJSON();

    // Check for exact metric name match
    const foundMetric = metricsJson.find(m => m.name === trimmed);

    let resultVector = [];

    if (foundMetric) {
      if (foundMetric.values && foundMetric.values.length > 0) {
        resultVector = foundMetric.values.map(val => ({
          metric: {
            __name__: foundMetric.name,
            app: "smart-devops-assistant",
            ...val.labels
          },
          value: [nowTimestamp, String(val.value)]
        }));
      } else {
        resultVector = [{
          metric: { __name__: foundMetric.name, app: "smart-devops-assistant" },
          value: [nowTimestamp, "0"]
        }];
      }
    } else if (trimmed === "up") {
      resultVector = [{
        metric: { __name__: "up", job: "smart-devops-assistant", instance: "localhost:5000" },
        value: [nowTimestamp, "1"]
      }];
    } else {
      // Pattern match or substring search among metrics
      const matchedMetrics = metricsJson.filter(m => m.name.includes(trimmed));
      if (matchedMetrics.length > 0) {
        matchedMetrics.forEach(m => {
          (m.values || []).forEach(v => {
            resultVector.push({
              metric: { __name__: m.name, ...v.labels },
              value: [nowTimestamp, String(v.value)]
            });
          });
        });
      } else {
        // Return 0 or empty vector with graceful message
        resultVector = [];
      }
    }

    return {
      status: "success",
      source: "INTERNAL_REGISTRY_FALLBACK",
      query: trimmed,
      message: "Evaluated from in-process Prometheus Registry (Prometheus server offline or running in standalone mode)",
      data: {
        resultType: "vector",
        result: resultVector
      }
    };
  }
}
