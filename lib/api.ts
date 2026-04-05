import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
});

API.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/** Session expired or invalid token — avoid redirect on login/signup failures */
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window === "undefined") return Promise.reject(error);
    const status = error.response?.status;
    const url = String(error.config?.url ?? "");
    const isAuthAttempt =
      url.includes("/auth/login") ||
      url.includes("/auth/signup") ||
      url.includes("/auth/register");
    if (status === 401 && !isAuthAttempt) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      const path = window.location.pathname;
      if (!path.startsWith("/login") && !path.startsWith("/signup")) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default API;
