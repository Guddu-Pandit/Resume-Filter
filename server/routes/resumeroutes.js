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
import { ai, EMBEDDING_MODEL_NAME } from "../config/gemini.js";
import { pineconeIndex } from "../config/pinecone.js";

// Initialize Gemini model (lazily or using shared client)
// Switching to gemini-2.0-flash-exp as gemini-2.0-flash hit a 0 quota limit
// In new SDK, we just define the model name string here for usage later.
const GENERATION_MODEL = "gemini-2.5-flash";

async function generateEmbedding(text) {
  try {
    const result = await ai.models.embedContent({
      model: EMBEDDING_MODEL_NAME,
      contents: [{ parts: [{ text: text.slice(0, 8000) }] }] // Gemini embedding limit is around 10k tokens/chars usually
    });
    return result.embeddings[0].values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
}

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

      const newResume = await Resume.create({
        userId: new mongoose.Types.ObjectId(req.user.id),
        fileName: file.originalname,
        text,
        embedding,
      });

      // Upsert to Pinecone if embedding exists
      if (embedding) {
        try {
          await pineconeIndex.upsert([{
            id: newResume._id.toString(),
            values: embedding,
            metadata: {
              userId: req.user.id,
              fileName: file.originalname,
              text: text.slice(0, 1000) // Store a snippet for context, or omit if you prefer fetching from DB
            }
          }]);
        } catch (pcError) {
          console.error("Pinecone upsert error:", pcError);
          // Don't fail the whole upload if Pinecone fails, but maybe report it
        }
      }

      res.status(200).json({
        message: "Resume uploaded successfully",
        resumeId: newResume._id
      });
    } catch (err) {
      console.error("Resume upload error:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

/* =========================
   EXTRACT TEXT FROM FILE (No save)
========================= */
router.post(
  "/extract-text",
  protect,
  upload.single("resume"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const file = req.file;
      let text = "";

      if (file.mimetype === "application/pdf") {
        const data = await pdfParse(file.buffer);
        text = data.text || "";
      } else if (
        file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.originalname.endsWith(".docx")
      ) {
        const result = await mammoth.extractRawText({
          buffer: file.buffer,
        });
        text = result.value || "";
      } else if (file.mimetype === "text/plain" || file.originalname.endsWith(".txt")) {
        text = file.buffer.toString("utf-8");
      } else {
        return res.status(400).json({ message: "Unsupported file type" });
      }

      res.json({ text });
    } catch (err) {
      console.error("Extract text error:", err);
      res.status(500).json({ message: "Failed to extract text" });
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

    // Delete from Pinecone
    try {
      await pineconeIndex.deleteOne(resumeId);
    } catch (pcError) {
      console.error("Pinecone delete error:", pcError);
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
    const { question, resumeId, history } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: "Question is required" });
    }

    // 1. Fetch user's resumes (or specific one)
    const query = { userId: req.user.id };
    if (resumeId) {
      if (mongoose.Types.ObjectId.isValid(resumeId)) {
        query._id = resumeId;
      }
    }
    const resumes = await Resume.find(query);

    if (resumes.length === 0) {
      return res.status(400).json({ message: "No resumes uploaded." });
    }

    // 2. Generate Embedding for Question
    const questionEmbedding = await generateEmbedding(question);

    let topResumes = [];
    let matchesDetail = [];

    if (questionEmbedding) {
      // 3. Query Pinecone
      try {
        const queryFilter = { userId: { $eq: req.user.id } };
        // If searching a specific resume, restrict Pinecone query too
        if (resumeId) {
          queryFilter._id = { $eq: resumeId };
        }

        const queryResponse = await pineconeIndex.query({
          vector: questionEmbedding,
          topK: 5,
          filter: queryFilter,
          includeMetadata: true,
        });

        if (queryResponse.matches && queryResponse.matches.length > 0) {
          const matchIds = queryResponse.matches.map(m => new mongoose.Types.ObjectId(m.id));

          // Fetch full resume documents from MongoDB to get full text
          const matchedResumes = await Resume.find({
            _id: { $in: matchIds }
          });

          // Order by similarity score from Pinecone
          topResumes = queryResponse.matches.map(match => {
            const resumeDoc = matchedResumes.find(r => r._id.toString() === match.id);
            if (resumeDoc) {
              return {
                ...resumeDoc.toObject(),
                score: match.score
              };
            }
            return null;
          }).filter(r => r !== null);

          matchesDetail = topResumes.map(m => ({
            _id: m._id,
            fileName: m.fileName,
            score: (m.score * 100).toFixed(2) + "%"
          }));
        }
      } catch (pcError) {
        console.error("Pinecone query error:", pcError);
      }
    }

    if (topResumes.length === 0) {
      return res.json({
        answer: `I couldn't find any resumes matching your question.`,
        matches: []
      });
    }

    // 4. Construct Prompt
    const contextText = topResumes
      .map(
        (r, i) =>
          `Resume ${i + 1} (${r.fileName}):\n${(r.text || "").slice(0, 3000)}...`
      )
      .join("\n\n");

    const systemInstruction = `
      You are an AI assistant analyzing resumes.
      User Question: "${question}"

      Here are the most relevant resumes found:
      ${contextText}

      Based ONLY on the provided resumes, answer the user's question.
      If the answer is not in the resumes, say "I cannot find that information in the provided resumes."
      Cite the filename when mentioning specific details.
      Use Markdown formatting for your responses.
    `;

    // 5. Generate Answer with Gemini using History Context
    // Format history if it exists
    const chatContents = history || [];

    // Add the current prompt as the last user message
    chatContents.push({
      role: "user",
      parts: [{ text: systemInstruction }]
    });

    const result = await ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: chatContents
    });

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