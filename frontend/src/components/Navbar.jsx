import React, { useState, useRef, useEffect } from "react";
import {
  Cpu,
  Server,
  ShieldCheck,
  Wifi,
  UserCheck,
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Info
} from "lucide-react";

export default function Navbar({
  currentUser,
  users,
  onUserChange,
  telemetry,
  isConnected,
  notifications = [],
  onMarkAllRead,
  onClearNotifications,
  onNavigate
}) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifDropdownRef = useRef(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="glass-panel" style={{
      margin: "0.75rem 1rem",
      padding: "0.75rem 1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: "var(--radius-md)",
      zIndex: 50,
      position: "relative"
    }}>
      {/* Brand & System Identifier */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{
          background: "linear-gradient(135deg, #00f2fe 0%, #3b82f6 100%)",
          padding: "0.5rem",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 15px rgba(0, 242, 254, 0.4)"
        }}>
          <Server size={22} color="#030712" />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h1 style={{ fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
              Smart DevOps Assistant
            </h1>
            <span className="badge badge-info" style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem" }}>
              AGENTIC AI v1.0
            </span>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            Horizon Campus • Final Year Research (IT41028)
          </p>
        </div>
      </div>

      {/* Center Telemetry Snapshot */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "rgba(15, 23, 42, 0.6)",
          padding: "0.35rem 0.8rem",
          borderRadius: "20px",
          border: "1px solid var(--border-subtle)",
          fontSize: "0.8rem"
        }}>
          <Cpu size={14} color="var(--accent-cyan)" />
          <span style={{ color: "var(--text-secondary)" }}>CPU:</span>
          <span style={{
            fontWeight: 600,
            color: (telemetry?.cpu || 0) > 85 ? "var(--accent-rose)" : "var(--accent-cyan)"
          }}>
            {telemetry?.cpu ? telemetry.cpu.toFixed(1) : "--"}%
          </span>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "rgba(15, 23, 42, 0.6)",
          padding: "0.35rem 0.8rem",
          borderRadius: "20px",
          border: "1px solid var(--border-subtle)",
          fontSize: "0.8rem"
        }}>
          <span style={{ color: "var(--text-secondary)" }}>RAM:</span>
          <span style={{
            fontWeight: 600,
            color: (telemetry?.memory || 0) > 80 ? "var(--accent-rose)" : "var(--accent-emerald)"
          }}>
            {telemetry?.memory ? telemetry.memory.toFixed(1) : "--"}%
          </span>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.75rem",
          color: isConnected ? "var(--accent-emerald)" : "var(--accent-rose)"
        }}>
          <span className="pulsing-dot" style={{
            background: isConnected ? "var(--accent-emerald)" : "var(--accent-rose)"
          }} />
          <span>{isConnected ? "Live Sync" : "Disconnected"}</span>
        </div>
      </div>

      {/* Right Controls: Notification Bell + Active RBAC Role */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
        {/* Notification Bell Center */}
        <div style={{ position: "relative" }} ref={notifDropdownRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            style={{
              position: "relative",
              background: isNotifOpen ? "rgba(0, 242, 254, 0.15)" : "rgba(30, 41, 59, 0.5)",
              border: isNotifOpen ? "1px solid var(--accent-cyan)" : "1px solid var(--border-subtle)",
              padding: "0.45rem",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              color: isNotifOpen ? "var(--accent-cyan)" : "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease"
            }}
            title="System Notification Center"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                background: "var(--accent-rose)",
                color: "#fff",
                fontSize: "0.62rem",
                fontWeight: 700,
                borderRadius: "10px",
                padding: "0.1rem 0.35rem",
                minWidth: "16px",
                height: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 10px rgba(239, 68, 68, 0.7)"
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Popover Dropdown */}
          {isNotifOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                right: 0,
                width: "370px",
                background: "rgba(11, 17, 33, 0.96)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(0, 242, 254, 0.25)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "0 20px 45px rgba(0, 0, 0, 0.7), 0 0 25px rgba(0, 242, 254, 0.12)",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                zIndex: 100
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.6rem" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Bell size={15} color="var(--accent-cyan)" /> Notification Center
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                    Real-time SRE & Multi-Agent Event Stream
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.4rem" }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllRead}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--accent-cyan)",
                        fontSize: "0.7rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.2rem"
                      }}
                      title="Mark all as read"
                    >
                      <CheckCheck size={13} /> Mark read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={onClearNotifications}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-muted)",
                        fontSize: "0.7rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.2rem"
                      }}
                      title="Clear all notifications"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Notifications List */}
              <div style={{
                maxHeight: "330px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem"
              }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    No recent notifications. System running optimally.
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isDanger = n.type === "danger";
                    const isWarning = n.type === "warning";
                    const isSuccess = n.type === "success";

                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (n.targetTab && onNavigate) {
                            onNavigate(n.targetTab);
                            setIsNotifOpen(false);
                          }
                        }}
                        style={{
                          padding: "0.65rem 0.75rem",
                          borderRadius: "var(--radius-md)",
                          background: n.unread
                            ? isDanger ? "rgba(239, 68, 68, 0.12)" : isWarning ? "rgba(245, 158, 11, 0.12)" : isSuccess ? "rgba(16, 185, 129, 0.12)" : "rgba(0, 242, 254, 0.08)"
                            : "rgba(15, 23, 42, 0.5)",
                          border: `1px solid ${
                            n.unread
                              ? isDanger ? "rgba(239, 68, 68, 0.3)" : isWarning ? "rgba(245, 158, 11, 0.3)" : isSuccess ? "rgba(16, 185, 129, 0.3)" : "rgba(0, 242, 254, 0.2)"
                              : "var(--border-subtle)"
                          }`,
                          display: "flex",
                          gap: "0.6rem",
                          alignItems: "flex-start",
                          cursor: n.targetTab ? "pointer" : "default",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <div style={{ marginTop: "0.15rem", flexShrink: 0 }}>
                          {isDanger ? (
                            <ShieldAlert size={16} color="var(--accent-rose)" />
                          ) : isWarning ? (
                            <AlertTriangle size={16} color="var(--accent-amber)" />
                          ) : isSuccess ? (
                            <CheckCircle2 size={16} color="var(--accent-emerald)" />
                          ) : (
                            <Info size={16} color="var(--accent-cyan)" />
                          )}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>
                              {n.title}
                            </span>
                            <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                              {n.time || "Just now"}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.15rem", lineHeight: 1.35 }}>
                            {n.message}
                          </div>
                          {n.targetTab && (
                            <div style={{ fontSize: "0.65rem", color: "var(--accent-cyan)", marginTop: "0.3rem", fontWeight: 600 }}>
                              Click to inspect &rarr;
                            </div>
                          )}
                        </div>

                        {n.unread && (
                          <span style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: isDanger ? "var(--accent-rose)" : "var(--accent-cyan)",
                            marginTop: "0.35rem",
                            flexShrink: 0
                          }} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div style={{
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: "0.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.68rem",
                color: "var(--text-muted)"
              }}>
                <span>Status: Socket.io Telemetry Active</span>
                <span style={{ color: "var(--accent-emerald)" }}>● 100% Operational</span>
              </div>
            </div>
          )}
        </div>

        {/* RBAC Role Selector */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          background: "rgba(30, 41, 59, 0.5)",
          padding: "0.3rem 0.8rem",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)"
        }}>
          <ShieldCheck size={16} color="var(--accent-indigo)" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>
              Active RBAC Role
            </span>
            <select
              value={currentUser?.user_id || 2}
              onChange={(e) => onUserChange(parseInt(e.target.value, 10))}
              style={{
                background: "transparent",
                color: "var(--text-primary)",
                border: "none",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                outline: "none"
              }}
            >
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id} style={{ background: "#0f172a", color: "#f8fafc" }}>
                  {u.name} ({u.role.replace("_", " ")})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
