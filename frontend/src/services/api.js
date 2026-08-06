import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

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

export const getVapidPublicKey = async () => {
  const response = await API.get("/notifications/vapid-public-key");
  return response.data.publicKey;
};

export default API;