import axios from "axios";
import { io } from "socket.io-client";

const isDev = import.meta.env.DEV;

export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (isDev ? "http://localhost:5000/api" : "/api");

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (isDev ? "http://localhost:5000" : window.location.origin);

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
