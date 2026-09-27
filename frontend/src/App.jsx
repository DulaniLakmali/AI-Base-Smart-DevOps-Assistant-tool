import React, { useState, useEffect, useRef } from "react";
import { api, setApiUser, socket } from "./api/client";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ApprovalModal from "./components/ApprovalModal";

// Views
import AgentChatView from "./views/AgentChatView";
import DashboardView from "./views/DashboardView";
import PipelineVisualizerView from "./views/PipelineVisualizerView";
import LogAnalyzerView from "./views/LogAnalyzerView";
import DevSecOpsView from "./views/DevSecOpsView";
import RAGKnowledgeView from "./views/RAGKnowledgeView";
import InfrastructureView from "./views/InfrastructureView";
import MetricsChaosView from "./views/MetricsChaosView";
import AuditTrailView from "./views/AuditTrailView";
import ResearchReportView from "./views/ResearchReportView";
import WebTerminalView from "./views/WebTerminalView";
import ManifestStudioView from "./views/ManifestStudioView";
import GitHubIntegrationView from "./views/GitHubIntegrationView";

export default function App() {
  const [activeTab, setActiveTab] = useState("agent");
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [telemetry, setTelemetry] = useState({ cpu: 48.5, memory: 62.0, disk: 54.2, activePods: 4 });
  const [isConnected, setIsConnected] = useState(false);

  // System Notifications State
  const [notifications, setNotifications] = useState([
    {
      id: "notif-1",
      title: "Multi-Agent System Online",
      message: "Planner, Executor, SRE, and RAG reasoning cores initialized.",
      type: "info",
      time: "Just now",
      targetTab: "agent",
      unread: true
    },
    {
      id: "notif-2",
      title: "Real GitHub Repository Connected",
      message: "Detected DulaniLakmali/devops-ai-demo with active CI workflow.",
      type: "success",
      time: "Just now",
      targetTab: "github",
      unread: true
    }
  ]);

  const lastCpuAlertRef = useRef(0);

  const addNotification = (notif) => {
    setNotifications((prev) => [
      {
        id: Date.now() + Math.random(),
        time: "Just now",
        unread: true,
        ...notif
      },
      ...prev.slice(0, 19)
    ]);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Human-in-the-Loop Approval Modal State
  const [approvalModalData, setApprovalModalData] = useState(null);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  useEffect(() => {
    fetchInitialUsers();

    // Socket status and telemetry listeners
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("telemetry_stream", (data) => {
      if (data?.telemetry) {
        setTelemetry(data.telemetry);
        if (data.telemetry.cpu > 85 && Date.now() - lastCpuAlertRef.current > 45000) {
          lastCpuAlertRef.current = Date.now();
          addNotification({
            title: "Proactive Saturation Alert",
            message: `Cluster CPU reached ${data.telemetry.cpu.toFixed(1)}% (>85% limit).`,
            type: "warning",
            targetTab: "metrics"
          });
        }
      }
    });

    // Listen for agent requesting approval
    socket.on("agent_approval_required", (data) => {
      setApprovalModalData(data);
      addNotification({
        title: "High-Risk Approval Required",
        message: data.summary || "High-risk plan pending authorization.",
        type: "danger",
        targetTab: "agent"
      });
    });

    // Listen for agent execution completion
    socket.on("agent_execution_complete", (data) => {
      addNotification({
        title: `TaskPlan #${data.taskId} Completed`,
        message: `Execution finished with status: ${data.status.toUpperCase()}.`,
        type: data.status === "success" ? "success" : "danger",
        targetTab: "audit"
      });
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("telemetry_stream");
      socket.off("agent_approval_required");
      socket.off("agent_execution_complete");
    };
  }, []);

  const fetchInitialUsers = async () => {
    try {
      const res = await api.get("/auth/users");
      const userList = res.data || [];
      setUsers(userList);
      // Default to Dulani Maduwanthi (DevOps Engineer)
      const defaultUser = userList.find((u) => u.role === "devops_engineer") || userList[0];
      if (defaultUser) {
        setCurrentUser(defaultUser);
        setApiUser(defaultUser.user_id);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const handleUserChange = (userId) => {
    const selected = users.find((u) => u.user_id === userId);
    if (selected) {
      setCurrentUser(selected);
      setApiUser(selected.user_id);
    }
  };

  const handleApprovePlan = async (taskId) => {
    setIsProcessingApproval(true);
    try {
      await api.post(`/plans/${taskId}/approve`);
      setApprovalModalData(null);
    } catch (err) {
      alert("Approval error: " + (err.response?.data?.error || err.message));
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleRejectPlan = async (taskId, reason) => {
    setIsProcessingApproval(true);
    try {
      await api.post(`/plans/${taskId}/reject`, { reason });
      setApprovalModalData(null);
    } catch (err) {
      alert("Rejection error: " + (err.response?.data?.error || err.message));
    } finally {
      setIsProcessingApproval(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        users={users}
        onUserChange={handleUserChange}
        telemetry={telemetry}
        isConnected={isConnected}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        onClearNotifications={handleClearNotifications}
        onNavigate={(tab) => setActiveTab(tab)}
      />

      {/* Main Body with Sidebar + Active View */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", paddingRight: "1rem" }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main style={{ flex: 1, paddingLeft: "1rem", overflow: "hidden" }}>
          {activeTab === "agent" && (
            <AgentChatView
              onTriggerApproval={(data) => setApprovalModalData(data)}
              currentUser={currentUser}
            />
          )}
          {activeTab === "dashboard" && (
            <DashboardView
              telemetry={telemetry}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}
          {activeTab === "github" && <GitHubIntegrationView />}
          {activeTab === "pipelines" && <PipelineVisualizerView />}
          {activeTab === "logs" && <LogAnalyzerView />}
          {activeTab === "terminal" && <WebTerminalView />}
          {activeTab === "manifests" && <ManifestStudioView />}
          {activeTab === "secops" && <DevSecOpsView />}
          {activeTab === "rag" && <RAGKnowledgeView />}
          {activeTab === "infra" && <InfrastructureView />}
          {activeTab === "metrics" && <MetricsChaosView telemetry={telemetry} />}
          {activeTab === "audit" && <AuditTrailView />}
          {activeTab === "report" && <ResearchReportView />}
        </main>
      </div>

      {/* Human-in-the-loop Approval Modal Gate */}
      <ApprovalModal
        isOpen={Boolean(approvalModalData)}
        planData={approvalModalData}
        onApprove={handleApprovePlan}
        onReject={handleRejectPlan}
        isProcessing={isProcessingApproval}
      />
    </div>
  );
}
