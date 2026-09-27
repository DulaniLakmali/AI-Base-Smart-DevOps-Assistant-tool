import os from "os";
import { dbRun, dbAll } from "../database/db.js";
import { MonitoringAgent } from "../agents/monitoringAgent.js";
import { PrometheusService } from "./prometheusService.js";

/**
 * System Telemetry & Chaos Injection Service (Chapter 3.4.2 & Chapter 6.4)
 * Supports both Live Host OS Hardware Sampling and Controlled Chaos Injection.
 */

let telemetryMode = "CHAOS_SIMULATION"; // "LIVE_HARDWARE" | "CHAOS_SIMULATION"

let simulatedTelemetry = {
  cpu: 48.5,
  memory: 62.0,
  disk: 54.2,
  networkIn: 4.8,
  networkOut: 3.2,
  activePods: 4
};

function getHostRealHardware() {
  const cpus = os.cpus();
  // Average CPU times calculation
  let totalIdle = 0;
  let totalTick = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  }
  const idlePercent = totalIdle / totalTick;
  const cpuPercent = parseFloat(((1 - idlePercent) * 100).toFixed(1));

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memoryPercent = parseFloat((((totalMem - freeMem) / totalMem) * 100).toFixed(1));

  return {
    cpu: Math.min(100, Math.max(5, cpuPercent)),
    memory: Math.min(100, Math.max(10, memoryPercent)),
    disk: 52.4,
    networkIn: 6.2,
    networkOut: 4.1,
    activePods: 4,
    platform: os.platform(),
    hostname: os.hostname(),
    cores: cpus.length,
    uptimeHours: (os.uptime() / 3600).toFixed(1)
  };
}

export class MetricsService {
  static getMode() {
    return telemetryMode;
  }

  static setMode(mode) {
    if (mode === "LIVE_HARDWARE" || mode === "CHAOS_SIMULATION") {
      telemetryMode = mode;
    }
    return this.getCurrent();
  }

  static getCurrent() {
    let activeTelemetry;

    if (telemetryMode === "LIVE_HARDWARE") {
      activeTelemetry = getHostRealHardware();
    } else {
      // Natural micro-fluctuations in simulation mode
      if (simulatedTelemetry.cpu < 80) {
        simulatedTelemetry.cpu = Math.max(30, Math.min(75, simulatedTelemetry.cpu + (Math.random() * 4 - 2)));
      }
      if (simulatedTelemetry.memory < 80) {
        simulatedTelemetry.memory = Math.max(45, Math.min(78, simulatedTelemetry.memory + (Math.random() * 2 - 1)));
      }
      activeTelemetry = { ...simulatedTelemetry };
    }

    // Synchronize to Prometheus Registry
    PrometheusService.updateTelemetryMetrics({
      cpu: activeTelemetry.cpu,
      memory: activeTelemetry.memory,
      activePods: activeTelemetry.activePods
    });

    const evaluation = MonitoringAgent.evaluateMetrics({
      cpuPercent: activeTelemetry.cpu,
      memoryPercent: activeTelemetry.memory,
      diskPercent: activeTelemetry.disk,
      activePods: activeTelemetry.activePods
    });

    return {
      mode: telemetryMode,
      telemetry: activeTelemetry,
      evaluation
    };
  }

  static async getHistory(limit = 20) {
    const rows = await dbAll(
      "SELECT * FROM system_metrics ORDER BY timestamp DESC LIMIT ?",
      [limit]
    );
    return rows.reverse();
  }

  static async recordSample() {
    const data = this.getCurrent();
    await dbRun(
      `INSERT INTO system_metrics (cpu_percent, memory_percent, disk_percent, network_in, network_out, active_pods)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.telemetry.cpu,
        data.telemetry.memory,
        data.telemetry.disk,
        data.telemetry.networkIn,
        data.telemetry.networkOut,
        data.telemetry.activePods
      ]
    );
    return data;
  }

  /**
   * Chaos Fault Injector
   */
  static injectChaos(faultType) {
    telemetryMode = "CHAOS_SIMULATION";

    if (faultType === "cpu_spike") {
      simulatedTelemetry.cpu = 94.2; // Trigger CPU >85% warning
    } else if (faultType === "memory_leak") {
      simulatedTelemetry.memory = 88.6; // Trigger Memory >80% warning
    } else if (faultType === "pod_crash") {
      simulatedTelemetry.activePods = Math.max(1, simulatedTelemetry.activePods - 2);
    } else if (faultType === "recover") {
      simulatedTelemetry.cpu = 45.0;
      simulatedTelemetry.memory = 60.0;
      simulatedTelemetry.activePods = 4;
    }

    if (faultType !== "recover") {
      PrometheusService.recordChaosFault(faultType);
    }

    return this.getCurrent();
  }
}
