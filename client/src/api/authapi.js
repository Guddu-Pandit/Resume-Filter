import axios from "axios";

/* =======================
   AUTH / GENERAL API
======================= */
const API = axios.create({
  baseURL: "http://localhost:5000/api/auth",
});

// Attach token automatically
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
export const askResume = (data) => API.post("/ask", data);

/* =======================
   RESUME API (SEPARATE)
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
// ❌ DO NOT set headers here




// app.get("/api/auth/dashboard", (req, res) => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader) {
//     return res.json({
//       message: "Welcome Guest — please login for full access",
//       isGuest: true,
//     });
//   }

//   // If token exists, validate it
//   try {
//     const token = authHeader.split(" ")[1];
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     return res.json({
//       message: `Welcome back, ${decoded.name}`,
//       isGuest: false,
//     });
//   } catch {
//     return res.status(401).json({ message: "Invalid token" });
//   }
// });
