import { config } from "../config/env.js";

/**
 * Monitoring Agent (Chapter 3.4.2 & 4.2.2)
 * Responsibilities:
 * - Analyzes system resource metrics (CPU, RAM, Disk)
 * - Identifies threshold violations (CPU >85%, Memory >80%)
 * - Issues proactive auto-remediation suggestions (e.g., horizontal scaling)
 */
export class MonitoringAgent {
  static evaluateMetrics({ cpuPercent, memoryPercent, diskPercent, activePods = 3 }) {
    const alerts = [];
    let recommendation = null;
    let autoScaleNeeded = false;

    // CPU Check (> 85%)
    if (cpuPercent >= config.THRESHOLDS.CPU_WARNING) {
      alerts.push({
        type: "CPU_SPIKE",
        severity: cpuPercent >= 92 ? "CRITICAL" : "WARNING",
        message: `High CPU saturation detected: ${cpuPercent.toFixed(1)}% (Threshold: ${config.THRESHOLDS.CPU_WARNING}%)`
      });
      autoScaleNeeded = true;
    }

    // Memory Check (> 80%)
    if (memoryPercent >= config.THRESHOLDS.MEMORY_WARNING) {
      alerts.push({
        type: "MEMORY_SATURATION",
        severity: memoryPercent >= 90 ? "CRITICAL" : "WARNING",
        message: `Memory consumption critical: ${memoryPercent.toFixed(1)}% (Threshold: ${config.THRESHOLDS.MEMORY_WARNING}%)`
      });
      autoScaleNeeded = true;
    }

    // Disk Check (> 90%)
    if (diskPercent >= config.THRESHOLDS.DISK_WARNING) {
      alerts.push({
        type: "DISK_SPACE_LOW",
        severity: "WARNING",
        message: `Disk storage warning: ${diskPercent.toFixed(1)}% capacity used`
      });
    }

    // Generate Proactive AI Auto-Scaling Recommendation
    if (autoScaleNeeded) {
      const suggestedReplicas = Math.min(activePods + 2, 8);
      recommendation = {
        action: "HORIZONTAL_AUTOSCALE",
        currentReplicas: activePods,
        targetReplicas: suggestedReplicas,
        rationale: `System resource saturation (CPU: ${cpuPercent.toFixed(1)}%, RAM: ${memoryPercent.toFixed(1)}%) risks request throttling or OOM crash.`,
        command: `kubectl scale deployment web-service --replicas=${suggestedReplicas}`,
        estimatedMTTRBenefit: "Prevents service degradation and maintains <200ms API latency."
      };
    }

    return {
      status: alerts.length > 0 ? (alerts.some(a => a.severity === "CRITICAL") ? "CRITICAL" : "DEGRADED") : "HEALTHY",
      cpuPercent,
      memoryPercent,
      diskPercent,
      activePods,
      alerts,
      recommendation,
      timestamp: new Date().toISOString()
    };
  }
}
