import express from "express";
import mongoose from "mongoose";
import mammoth from "mammoth";
import Resume from "../models/Resume.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import { createRequire } from "module";
import { GoogleGenerativeAI } from "@google/generative-ai"; // ✅ New import

const require = createRequire(import.meta.url);
const pdfModule = require("pdf-parse");
const pdfParse = typeof pdfModule === "function" ? pdfModule : pdfModule.default;

const router = express.Router();

/* =========================
   UPLOAD RESUME
========================= */
router.post(
  "/upload-resume",
  protect,
  upload.single("resume"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const file = req.file;
      let text = "";

      if (file.mimetype === "application/pdf") {
        const data = await pdfParse(file.buffer);
        text = data.text || "";
      } else {
        const result = await mammoth.extractRawText({
          buffer: file.buffer,
        });
        text = result.value || "";
      }

      // 🔥 allow multiple resumes per user
      await Resume.create({
        userId: new mongoose.Types.ObjectId(req.user.id),
        fileName: file.originalname,
        text,
      });

      res.status(200).json({ message: "Resume uploaded successfully" });
    } catch (err) {
      console.error("Resume upload error:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

/* =========================
   GET USER RESUMES
========================= */
router.get("/my-resumes", protect, async (req, res) => {
  try {
    const resumes = await Resume.find(
      { userId: req.user.id },
      { fileName: 1, createdAt: 1 }
    ).sort({ createdAt: -1 });

    res.json({
      count: resumes.length,
      resumes,
    });
  } catch (err) {
    console.error("Fetch resume error:", err);
    res.status(500).json({ message: "Failed to fetch resumes" });
  }
});

/* =========================
   ASK ABOUT RESUMES (NEW)
========================= */
router.post("/ask", protect, async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: "Question is required" });
    }

    // Fetch user's resumes
    const resumes = await Resume.find(
      { userId: req.user.id },
      { fileName: 1, text: 1 }
    ).sort({ createdAt: -1 });

    if (resumes.length === 0) {
      return res.status(400).json({ message: "No resumes uploaded. Please upload at least one resume." });
    }

    // Concatenate resume texts (limit to avoid token overflow; GenAI handles ~1M tokens, but keep concise)
    let resumeTexts = resumes.map((r, index) => `Resume ${index + 1}: "${r.fileName}"\nContent: ${r.text.substring(0, 2000)}...`).join("\n\n---\n\n");

    // Initialize Google GenAI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Fast and cost-effective for this use case

    // Prompt engineering: Instruct to search for skills/resumes matching the question
    const prompt = `
      You are a resume analyst. Analyze the following user-uploaded resumes and answer the question: "${question}"

      Resumes:
      ${resumeTexts}

      Instructions:
      - Search for relevant skills/experiences in the resumes (e.g., if question mentions "frontend developer", look for HTML, CSS, JavaScript, React, Vue, etc.).
      - List ONLY the matching resume filenames (e.g., "Resume 1: my-resume-2023.pdf").
      - For each, briefly explain why it matches (1-2 sentences).
      - If no matches, say "No resumes match this query."
      - Format response as a numbered list for clarity.
      - Keep response concise (under 300 words).

      Response:
    `;

    const result = await model.generateContent(prompt);
    const generatedText = await result.response.text();

    res.json({ answer: generatedText });
  } catch (err) {
    console.error("Ask resume error:", err);
    res.status(500).json({ message: "Failed to analyze resumes. Please try again." });
  }
});

export default router;