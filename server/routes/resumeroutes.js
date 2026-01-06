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
import { ai } from "../config/gemini.js";

// Initialize Gemini model (lazily or using shared client)
// Switching to gemini-2.0-flash-exp as gemini-2.0-flash hit a 0 quota limit
// In new SDK, we just define the model name string here for usage later.
const GENERATION_MODEL = "gemini-2.5-flash";

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
      // Embedding generation removed as we are using keyword search now
      // const embedding = await generateEmbedding(text);

      await Resume.create({
        userId: new mongoose.Types.ObjectId(req.user.id),
        fileName: file.originalname,
        text,
        // embedding, // removed
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
   ASK ABOUT RESUMES (REGEX KEYWORD + GEMINI)
========================= */
router.post("/ask", protect, async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: "Question is required" });
    }

    // 1. Fetch user's resumes
    const resumes = await Resume.find({ userId: req.user.id });

    if (resumes.length === 0) {
      return res.status(400).json({ message: "No resumes uploaded." });
    }

    // 2. Extract Keywords (Simple logic)
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
      "resumes", "resume", "skills", "skill", "find", "search", "get", "list", "give",
      "tell", "me", "about"
    ];

    const keywords = question
      .toLowerCase()
      .replace(/[^a-z0-9\s+#.-]/g, " ")
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.includes(word));

    // 3. Score Resumes by Regex Keyword Matches
    let topResumes = [];
    let matchesDetail = [];

    // Helper to escape regex special characters
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (keywords.length > 0) {
      const scoredResumes = resumes.map(resume => {
        const text = (resume.text || "").toLowerCase();
        let score = 0;
        let matchedSkills = [];

        keywords.forEach(kw => {
          // Use Regex with word boundaries for accurate matching
          const regex = new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i');
          if (regex.test(text)) {
            score++;
            matchedSkills.push(kw);
          }
        });
        return {
          ...resume.toObject(),
          score,
          matchedSkills: [...new Set(matchedSkills)] // Remove duplicates
        };
      });

      // Filter matches
      const matches = scoredResumes.filter(r => r.score > 0);

      // Sort descending
      matches.sort((a, b) => b.score - a.score);

      // [NEW] Best Match Filter: Only keep resumes with the matching score
      let bestMatches = matches;
      if (matches.length > 0) {
        const maxScore = matches[0].score;
        bestMatches = matches.filter(r => r.score === maxScore);
      }

      // Limit context to top 3 of the best matches
      topResumes = bestMatches.slice(0, 3);

      // Prepare detailed matches for frontend (Show ALL best matches, don't slice)
      matchesDetail = bestMatches.map(m => ({
        _id: m._id,
        fileName: m.fileName,
        score: m.score,
        matchedSkills: m.matchedSkills
      }));

    } else {
      // No specific keywords? Just take the latest 3
      topResumes = resumes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
    }

    if (topResumes.length === 0 && keywords.length > 0) {
      return res.json({
        answer: `I looked for resumes containing keywords like "${keywords.join(", ")}" but couldn't find any matches.`,
        matches: []
      });
    }

    // 4. Construct Prompt
    const context = topResumes
      .map(
        (r, i) =>
          `Resume ${i + 1} (${r.fileName}):\n${(r.text || "").slice(0, 3000)}...`
      )
      .join("\n\n");

    const prompt = `
      You are an AI assistant analyzing resumes.
      User Question: "${question}"

      Here are the most relevant resumes found (based on keyword match):
      ${context}

      Based ONLY on the provided resumes, answer the user's question.
      If the answer is not in the resumes, say "I cannot find that information in the provided resumes."
      Cite the filename when mentioning specific details.
    `;

    // 5. Generate Answer with Gemini
    const result = await ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: prompt
    });

    // Check if result.response exists or if result itself is the response
    // Per new SDK docs:
    // const response = await ai.models.generateContent(...);
    // console.log(response.text);
    // So result IS the response object directly usually, or contains .text() if helper is used?
    // User snippet: console.log(response.text);
    // So:
    const answer = result.text;

    res.json({
      answer,
      matches: matchesDetail
    });

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

/* =========================
   ANALYZE SINGLE RESUME
========================= */
router.post("/analyze-single", protect, async (req, res) => {
  try {
    const { resumeText } = req.body;

    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({ message: "Resume text is required" });
    }

    const prompt = `
You are an expert resume reviewer and career coach. Analyze the following resume and provide a comprehensive assessment.

Resume:
${resumeText}

Provide your analysis in the following JSON format ONLY (no markdown, no code blocks, just pure JSON):
{
  "score": <number between 0-100>,
  "summary": "<2-3 sentence overall summary>",
  "strengths": [
    "<strength 1>",
    "<strength 2>",
    "<strength 3>"
  ],
  "improvements": [
    "<improvement suggestion 1>",
    "<improvement suggestion 2>",
    "<improvement suggestion 3>"
  ],
  "missing": [
    "<missing section or element 1>",
    "<missing section or element 2>"
  ]
}

Focus on:
- Contact information completeness
- Work experience clarity and impact
- Skills section presence and relevance
- Education details
- Formatting and readability
- Quantifiable achievements
- Keywords for ATS systems
`;

    const result = await ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: prompt
    });

    const responseText = result.text;

    // Try to parse JSON from the response
    let analysis;
    try {
      // Remove any markdown code blocks if present
      let cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      // Return a fallback response if JSON parsing fails
      analysis = {
        score: 50,
        summary: responseText.slice(0, 200),
        strengths: ["Resume submitted for analysis"],
        improvements: ["Could not parse detailed feedback - please try again"],
        missing: []
      };
    }

    res.json({ analysis });

  } catch (err) {
    console.error("Analyze resume error:", err);
    res.status(500).json({ message: "Failed to analyze resume" });
  }
});

export default router;