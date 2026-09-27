import axios from "axios";
import { io } from "socket.io-client";

export const API_BASE = "http://localhost:5000/api";
export const SOCKET_URL = "http://localhost:5000";

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json"
  }
});

// Attach active user ID to outgoing requests for RBAC
export const setApiUser = (userId) => {
  api.defaults.headers.common["x-user-id"] = userId;
};

// Initialize Socket.io connection
export const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});
