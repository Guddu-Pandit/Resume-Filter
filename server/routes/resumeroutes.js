import express from "express";
import mongoose from "mongoose";
import mammoth from "mammoth";
import Resume from "../models/Resume.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfModule = require("pdf-parse");
const pdfParse = typeof pdfModule === "function" ? pdfModule : pdfModule.default;
import { generateEmbedding } from "../utils/embedding.js";
import { cosineSimilarity } from "../utils/cosineSimilarity.js";
import { genAI } from "../config/gemini.js";

// Initialize Gemini model (lazily or using shared client)
// Switching to gemini-2.0-flash-exp as gemini-2.0-flash hit a 0 quota limit
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

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
      const embedding = await generateEmbedding(text);

      await Resume.create({
        userId: new mongoose.Types.ObjectId(req.user.id),
        fileName: file.originalname,
        text,
        embedding,
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
   DELETE RESUME (NEW)
========================= */
router.delete('/resumes/:resumeId', protect, async (req, res) => {
  try {
    const { resumeId } = req.params;

    // Verify resume belongs to user and delete
    const deletedResume = await Resume.findOneAndDelete({
      _id: resumeId,
      userId: req.user.id
    });

    if (!deletedResume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found or you don\'t have permission to delete it'
      });
    }

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting resume'
    });
  }
});


/* =========================
   GET RESUME CONTENT (NEW)
========================= */
router.get('/resumes/:resumeId/content', protect, async (req, res) => {
  try {
    const { resumeId } = req.params;

    const resume = await Resume.findOne({
      _id: resumeId,
      userId: req.user.id
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    res.json({
      success: true,
      text: resume.text
    });
  } catch (error) {
    console.error('Get resume content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


/* =========================
   ASK ABOUT RESUMES (RAG + GEMINI)
========================= */
router.post("/ask", protect, async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: "Question is required" });
    }

    // 1. Fetch user's resumes with embeddings
    const resumes = await Resume.find({ userId: req.user.id });

    if (resumes.length === 0) {
      return res.status(400).json({ message: "No resumes uploaded." });
    }

    // 2. Generate embedding for the question
    const questionEmbedding = await generateEmbedding(question);

    // 3. Calculate similarity scores
    const scoredResumes = resumes.map((resume) => {
      // If resume has no embedding (old upload), skip or treat as 0
      if (!resume.embedding || resume.embedding.length === 0) {
        return { ...resume.toObject(), score: 0 };
      }
      return {
        ...resume.toObject(),
        score: cosineSimilarity(questionEmbedding, resume.embedding),
      };
    });

    // 4. Sort by score (descending) and take top 3
    scoredResumes.sort((a, b) => b.score - a.score);
    const topResumes = scoredResumes.slice(0, 3);

    // 5. Construct Prompt for Gemini
    const context = topResumes
      .map(
        (r, i) =>
          `Resume ${i + 1} (${r.fileName}):\n${r.text.slice(0, 3000)}...` // Truncate to avoid huge prompts
      )
      .join("\n\n");

    const prompt = `
      You are an AI assistant analyzing resumes.
      User Question: "${question}"

      Here are the most relevant resumes found:
      ${context}

      Based ONLY on the provided resumes, answer the user's question.
      If the answer is not in the resumes, say "I cannot find that information in the provided resumes."
      Cite the filename when mentioning specific details.
    `;

    // 6. Generate Answer
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

    res.json({ answer });
  } catch (err) {
    console.error("Ask resume error:", err);
    res.status(500).json({ message: "Failed to process your request" });
  }
});

/* =========================
   LEGACY: KEYWORD-BASED SEARCH (COMMENTED OUT)
========================= */
// router.post("/ask-legacy", protect, async (req, res) => { ... (old logic logic here) ... });
// Original code kept below for reference but inactive within this route file structure if needed to revert.
/*
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

    // Common words to ignore when extracting skills
    const stopWords = [
      "the", "and", "or", "a", "an", "is", "are", "was", "were", "has", "have", "had",
      "do", "does", "did", "will", "would", "could", "should", "may", "might", "must",
      "be", "been", "being", "am", "it", "its", "this", "that", "these", "those",
      "who", "what", "which", "where", "when", "why", "how", "all", "each", "every",
      "both", "few", "more", "most", "other", "some", "such", "no", "not", "only",
      "same", "so", "than", "too", "very", "just", "but", "if", "then", "else",
      "with", "from", "for", "of", "to", "in", "on", "at", "by", "about", "into",
      "through", "during", "before", "after", "above", "below", "between", "under",
      "again", "further", "once", "here", "there", "any", "can", "show", "me",
      "resumes", "resume", "skills", "skill", "find", "search", "get", "list", "give"
    ];

    // Extract skill keywords from question
    const skillKeywords = question
      .toLowerCase()
      .replace(/[^a-z0-9\s+#.-]/g, " ") // Keep alphanumeric, +, #, ., - for skills like C++, C#, .NET
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.includes(word));

    if (skillKeywords.length === 0) {
      return res.json({
        answer: "Please specify skills to search for. Example: 'React', 'Python', 'frontend developer'"
      });
    }

    // Search each resume for matching skills
    const matches = [];

    for (const resume of resumes) {
      const resumeText = resume.text.toLowerCase();
      const foundSkills = [];

      for (const skill of skillKeywords) {
        // Check if skill exists in resume text (word boundary match for accuracy)
        const regex = new RegExp(\`\\b\${skill.replace(/[.*+?^${}()|[]\\]/g, '\\$&')}\\b\`, 'i');
        if (regex.test(resumeText)) {
          foundSkills.push(skill);
        }
      }

      if (foundSkills.length > 0) {
        matches.push({
          fileName: resume.fileName,
          matchedSkills: [...new Set(foundSkills)] // Remove duplicates
        });
      }
    }

    // Format response
    if (matches.length === 0) {
      return res.json({
        answer: \`No resumes found matching: \${skillKeywords.join(", ")}\`
      });
    }

    const resultLines = matches.map((match, index) =>
      \`${index + 1}. 📄 **\${match.fileName}**\n   Skills found: \${match.matchedSkills.join(", ")}\`
    );

    const answer = \`Found \${matches.length} resume(s) matching your search:\n\n\${resultLines.join("\n\n")}\`;

    res.json({ answer });
  } catch (err) {
    console.error("Ask resume error:", err);
    res.status(500).json({ message: "Failed to search resumes. Please try again." });
  }
});
*/

export default router;