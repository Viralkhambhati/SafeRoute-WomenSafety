import axios from "axios";

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocal =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname === "::1";

    if (isLocal) {
      return "http://localhost:5000/api";
    }
  }

  if (typeof window !== "undefined") {
    console.error(
      "[SafeRoute] VITE_API_BASE_URL is not set. " +
      "Set it in your deployment platform (e.g., Vercel) to your backend URL (e.g., https://saferoute-backend.onrender.com/api). " +
      "Falling back to relative /api, which will likely fail if frontend and backend are on different domains."
    );
  }

  return "/api";
};

const API_BASE_URL = getApiBaseUrl();

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use((config) => {

  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;

});

export { API_BASE_URL };

export const getVapidPublicKey = async () => {
  const response = await API.get("/notifications/vapid-public-key");
  return response.data.publicKey;
};

export default API;