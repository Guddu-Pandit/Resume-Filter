import axios from "axios";

/* =======================
   AUTH API
======================= */
const API = axios.create({
  baseURL: "http://localhost:5000/api/auth",
});

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

RESUME_API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const uploadResume = (formData) =>
  RESUME_API.post("/upload-resume", formData);

export const getMyResumes = () =>
  RESUME_API.get("/my-resumes");

// ✅ NEW: Ask about resumes
export const askResume = (data) =>
  RESUME_API.post("/ask", data);