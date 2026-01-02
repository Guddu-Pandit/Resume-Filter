import axios from "axios";

/* =======================
   AUTH API
======================= */
const API = axios.create({
  baseURL: "http://localhost:5000/api/auth",
});

// ✅ Attach token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const signup = (data) => API.post("/signup", data);
export const login = (data) => API.post("/login", data);
export const getDashboard = () => API.get("/dashboard");

/* =======================
   RESUME API
======================= */
const RESUME_API = axios.create({
  baseURL: "http://localhost:5000/api/resume",
});

// ✅ SAME interceptor for resume upload
RESUME_API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// ✅ DO NOT manually set multipart headers
export const uploadResume = (formData) =>
  RESUME_API.post("/upload-resume", formData);
