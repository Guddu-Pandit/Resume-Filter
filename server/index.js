import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authroutes.js";
import resumeRoutes from "./routes/resumeroutes.js"

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

console.log("Gemini Key Loaded:", process.env.GEMINI_API_KEY ? "YES" : "NO");
if (!process.env.GEMINI_API_KEY) {
  throw new Error("Gemini API key missing");
}
console.log(process.env.GEMINI_API_KEY);


app.use("/api/auth", authRoutes);
app.use("/api/resume", resumeRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
