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
// gemini-2.5-flash-lite is a lite version of gemini-2.5-flash and gemini-2.5-flash-exp
// In new SDK, we just define the model name string here for usage later.
const GENERATION_MODEL = "gemini-2.5-flash-lite";

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

// Helper to clean extracted text
const cleanText = (text) => {
  if (!text) return "";
  let cleaned = text
    .replace(/\r/g, "")
    .replace(/^[ \t]+/gm, "")
    .replace(/\n\s*\n\s*\n+/g, "\n\n");

  // Ensure double newline before lines that look like section titles (e.g. "Skills:", "Work Experience:")
  // This helps separate sections even if the PDF text was cramped.
  cleaned = cleaned.replace(/\n([A-Z][^:\n]{2,50}:)/g, "\n\n$1");

  return cleaned.trim();
};

// yaha se add kiya hai
/* =========================
   RESUME INTENT DETECTION (NEW)
========================= */
function isResumeQuestion(question) {
  if (!question) return false;

  const resumeKeywords = [
    "resume",
    "resumes",
    "cv",
    "candidate",
    "profile",
    "experience",
    "years",
    "skills",
    "skill",
    "developer",
    "engineer",
    "frontend",
    "backend",
    "fullstack",
    "react",
    "node",
    "java",
    "python",
    "project",
    "projects",
    "work",
    "company",
    "companies"
  ];

  const q = question.toLowerCase();
  return resumeKeywords.some(k => q.includes(k));
}
//yaha tak

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
        text = cleanText(data.text || "");
      } else {
        const result = await mammoth.extractRawText({
          buffer: file.buffer,
        });
        text = cleanText(result.value || "");
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
        text = cleanText(data.text || "");
      } else if (
        file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.originalname.endsWith(".docx")
      ) {
        const result = await mammoth.extractRawText({
          buffer: file.buffer,
        });
        text = cleanText(result.value || "");
      } else if (file.mimetype === "text/plain" || file.originalname.endsWith(".txt")) {
        text = cleanText(file.buffer.toString("utf-8"));
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
// router.post("/ask", protect, async (req, res) => {
//   try {
//     const { question, resumeId, history } = req.body;

//     if (!question || !question.trim()) {
//       return res.status(400).json({ message: "Question is required" });
//     }

//     const toolCalls = [];

//     // 1. Fetch user's resumes (or specific one)
//     const query = { userId: req.user.id };
//     if (resumeId) {
//       if (mongoose.Types.ObjectId.isValid(resumeId)) {
//         query._id = resumeId;
//       }
//     }
//     const resumes = await Resume.find(query);

//     if (resumes.length === 0) {
//       return res.status(400).json({ message: "No resumes uploaded." });
//     }

//     // 2. Generate Embedding for Question
//     const questionEmbedding = await generateEmbedding(question);
//     toolCalls.push({
//       tool: "generateEmbedding",
//       input: question.slice(0, 50) + (question.length > 50 ? "..." : ""),
//       status: questionEmbedding ? "success" : "failed",
//       details: "Generated 768-dimension vector for query"
//     });

//     let topResumes = [];
//     let matchesDetail = [];

//     if (questionEmbedding) {
//       // 3. Query Pinecone
//       try {
//         const queryFilter = { userId: { $eq: req.user.id } };
//         // If searching a specific resume, restrict Pinecone query too
//         if (resumeId) {
//           queryFilter._id = { $eq: resumeId };
//         }

//         const queryResponse = await pineconeIndex.query({
//           vector: questionEmbedding,
//           topK: 5,
//           filter: queryFilter,
//           includeMetadata: true,
//         });

//         toolCalls.push({
//           tool: "queryPinecone",
//           filters: queryFilter,
//           matchCount: queryResponse.matches?.length || 0,
//           status: "success"
//         });

//         if (queryResponse.matches && queryResponse.matches.length > 0) {
//           const matchIds = queryResponse.matches.map(m => new mongoose.Types.ObjectId(m.id));

//           // Fetch full resume documents from MongoDB to get full text
//           const matchedResumes = await Resume.find({
//             _id: { $in: matchIds }
//           });

//           // Order by similarity score from Pinecone
//           topResumes = queryResponse.matches.map(match => {
//             const resumeDoc = matchedResumes.find(r => r._id.toString() === match.id);
//             if (resumeDoc) {
//               return {
//                 ...resumeDoc.toObject(),
//                 score: match.score
//               };
//             }
//             return null;
//           }).filter(r => r !== null);

//           // --- REFINEMENT LOGIC ---
//           // 1. Filter by threshold (e.g. 45% similarity)
//           const MIN_SCORE = 0.45;
//           topResumes = topResumes.filter(r => r.score >= MIN_SCORE);

//           // 2. Dominance check: If top match is >80% and 2nd is <50%, or if gap is >25%, show only top
//           if (topResumes.length > 1) {
//             const topScore = topResumes[0].score;
//             const secondScore = topResumes[1].score;
//             if ((topScore > 0.70 && secondScore < 0.45) || (topScore - secondScore > 0.25)) {
//               topResumes = [topResumes[0]];
//             }
//           }

//           matchesDetail = topResumes.map(m => ({
//             _id: m._id,
//             fileName: m.fileName,
//             score: (m.score * 100).toFixed(2) + "%"
//           }));

//           // 3. Procedural Suppression: Don't show resume buttons if asking about process/tools
//           const proceduralKeywords = ["how did you find", "tool call", "process", "where did you get", "how you find"];
//           if (proceduralKeywords.some(k => question.toLowerCase().includes(k))) {
//             matchesDetail = [];
//           }
//           // ------------------------
//         }
//       } catch (pcError) {
//         console.error("Pinecone query error:", pcError);
//         toolCalls.push({ tool: "queryPinecone", status: "error", error: pcError.message });
//       }
//     }

//     if (topResumes.length === 0) {
//       return res.json({
//         answer: I couldn't find any resumes matching your question.,
//         matches: [],
//         toolCalls
//       });
//     }

//     // 4. Construct Prompt
//     const contextText = topResumes
//       .map(
//         (r, i) =>
//           Resume ${i + 1} (${r.fileName}):\n${(r.text || "").slice(0, 3000)}...
//       )
//       .join("\n\n");

//     const systemInstruction = `
//       You are a precise AI assistant specialized in analyzing and extracting information from resumes. Your responses must be factual, professional, and based EXCLUSIVELY on the provided resume content.

//       User Question: "${question}"

//       Relevant Resumes Provided:
//       ${contextText}

//       - CRITICAL: When referencing information from a resume, YOU MUST mention the resume's filename in parentheses, e.g., "(Guddu_Kumar_Pandit.pdf)". If you don't cite the filename, the UI will not show the document.
//       - If multiple resumes contain relevant information, cite EACH one that contributed to your answer.
//       - For questions about your process, tool calling, or how results were retrieved, respond: "I used the *generateEmbedding* and *queryPinecone* tools to perform a semantic search across the resume database and retrieve the most relevant matches."
//       - Do NOT mention any other tools or internal processes.
//       - Use clear Markdown formatting: *Bold* for emphasis, bullet points for lists, and Citations in (parentheses).
//       - Keep responses concise and directly relevant to the question.
//       `;

//     // 5. Generate Answer with Gemini using History Context
//     const chatContents = history || [];

//     chatContents.push({
//       role: "user",
//       parts: [{ text: systemInstruction }]
//     });

//     const result = await ai.models.generateContent({
//       model: GENERATION_MODEL,
//       contents: chatContents
//     });

//     const answer = result.text;

//     // --- CITE-CHECK FILTERING (ROBUST) ---
//     // Only show resume buttons for files the AI actually mentioned.
//     let filteredMatches = matchesDetail;
//     if (matchesDetail.length > 0 && answer) {
//       filteredMatches = matchesDetail.filter(m => {
//         const fullMatch = answer.toLowerCase().includes(m.fileName.toLowerCase());
//         const baseName = m.fileName.split('.').slice(0, -1).join('.');
//         const nameMatch = baseName && answer.toLowerCase().includes(baseName.toLowerCase());
//         return fullMatch || nameMatch;
//       });
//     }
//     // -------------------------------------

//     res.json({
//       answer,
//       matches: filteredMatches,
//       systemPrompt: systemInstruction,
//       toolCalls
//     });

//   } catch (err) {
//     console.error("Ask resume error:", err);
//     res.status(500).json({ message: "Failed to process your request" });
//   }
// });



/* =========================
   ASK ABOUT RESUMES (REGEX KEYWORD + GEMINI)
========================= */
router.post("/ask", protect, async (req, res) => {
  try {
    const { question, resumeId, history } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: "Question is required" });
    }

    const toolCalls = [];

    /* =========================
       INTENT DETECTION (NEW)
    ========================= */
    const resumeIntent = isResumeQuestion(question);

    /* =========================
       NON-RESUME QUESTIONS (NEW PATH)
       → NO EMBEDDING
       → NO PINECONE
    ========================= */
    if (!resumeIntent) {
      const result = await ai.models.generateContent({
        model: GENERATION_MODEL,
        contents: [
          {
            role: "user",
            parts: [{ text: question }]
          }
        ]
      });

      return res.json({
        answer: result.text,
        matches: [],
        toolCalls
      });
    }

    // =========================
    // BELOW THIS POINT → RESUME QUESTIONS ONLY
    // =========================

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
    toolCalls.push({
      tool: "generateEmbedding",
      input: question.slice(0, 50) + (question.length > 50 ? "..." : ""),
      status: questionEmbedding ? "success" : "failed",
      details: "Generated 768-dimension vector for query"
    });

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

        toolCalls.push({
          tool: "queryPinecone",
          filters: queryFilter,
          matchCount: queryResponse.matches?.length || 0,
          status: "success"
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

          // --- REFINEMENT LOGIC ---
          // 1. Filter by threshold (e.g. 45% similarity)
          const MIN_SCORE = 0.45;
          topResumes = topResumes.filter(r => r.score >= MIN_SCORE);

          // 2. Dominance check: If top match is >80% and 2nd is <50%, or if gap is >25%, show only top
          if (topResumes.length > 1) {
            const topScore = topResumes[0].score;
            const secondScore = topResumes[1].score;
            if ((topScore > 0.70 && secondScore < 0.45) || (topScore - secondScore > 0.25)) {
              topResumes = [topResumes[0]];
            }
          }

          matchesDetail = topResumes.map(m => ({
            _id: m._id,
            fileName: m.fileName,
            score: (m.score * 100).toFixed(2) + "%"
          }));

          // 3. Procedural Suppression: Don't show resume buttons if asking about process/tools
          const proceduralKeywords = ["how did you find", "tool call", "process", "where did you get", "how you find"];
          if (proceduralKeywords.some(k => question.toLowerCase().includes(k))) {
            matchesDetail = [];
          }
          // ------------------------
        }
      } catch (pcError) {
        console.error("Pinecone query error:", pcError);
        toolCalls.push({ tool: "queryPinecone", status: "error", error: pcError.message });
      }
    }

    if (topResumes.length === 0) {
      return res.json({
        answer: `I couldn't find any resumes matching your question.`,
        matches: [],
        toolCalls
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
      You are a precise AI assistant specialized in analyzing and extracting information from resumes. Your responses must be factual, professional, and based EXCLUSIVELY on the provided resume content.

      User Question: "${question}"

      Relevant Resumes Provided:
      ${contextText}

      - CRITICAL: When referencing information from a resume, YOU MUST mention the resume's filename in parentheses.
      - If multiple resumes contain relevant information, cite EACH one.
      - For questions about your process, tool calling, or how results were retrieved, respond: "I used the **generateEmbedding** and **queryPinecone** tools to perform a semantic search across the resume database and retrieve the most relevant matches."
      - Do NOT mention any other tools or internal processes.
      - Use clear Markdown formatting.
      - Keep responses concise and directly relevant.
      `;

    // 5. Generate Answer with Gemini using History Context
    const chatContents = history || [];

    chatContents.push({
      role: "user",
      parts: [{ text: systemInstruction }]
    });

    const result = await ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: chatContents
    });

    const answer = result.text;

    // --- CITE-CHECK FILTERING (ROBUST) ---
    let filteredMatches = matchesDetail;
    if (matchesDetail.length > 0 && answer) {
      filteredMatches = matchesDetail.filter(m => {
        const fullMatch = answer.toLowerCase().includes(m.fileName.toLowerCase());
        const baseName = m.fileName.split('.').slice(0, -1).join('.');
        const nameMatch = baseName && answer.toLowerCase().includes(baseName.toLowerCase());
        return fullMatch || nameMatch;
      });
    }
    // -------------------------------------

    res.json({
      answer,
      matches: filteredMatches,
      systemPrompt: systemInstruction,
      toolCalls
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
You are an expert resume reviewer and senior career coach with deep knowledge of modern hiring practices, Applicant Tracking Systems (ATS), and industry standards across tech, finance, marketing, and other professional fields.

Your task is to carefully analyze the provided resume and deliver a structured, objective, and actionable assessment.

Resume Content:
${resumeText}

Respond EXCLUSIVELY in valid JSON format. Do not include any markdown, explanations, code blocks, or additional text outside the JSON object.

The JSON must have the following structure and fields:

{
  "score": <integer from 0 to 100 representing overall resume effectiveness>,
  "summary": "<A concise 2-3 sentence overview of the resume's strengths, weaknesses, and overall impression>",
  "strengths": [
    "<Clear, specific strength 1>",
    "<Clear, specific strength 2>",
    "<Clear, specific strength 3>",
    "<Additional strengths as needed>"
  ],
  "improvements": [
    "<Specific, actionable improvement suggestion 1>",
    "<Specific, actionable improvement suggestion 2>",
    "<Specific, actionable improvement suggestion 3>",
    "<Additional suggestions as needed>"
  ],
  "missing": [
    "<Important element or section that is entirely absent 1>",
    "<Important element or section that is entirely absent 2>",
    "<Additional missing items as needed (use empty array if nothing critical is missing)>"
  ],
  "ats_friendly": <true if the resume is highly ATS-compatible, false if it has clear ATS risks (e.g., tables, columns, images, non-standard fonts)>,
  "red_flags": [
    "<Any major concerns such as employment gaps, frequent job changes, typos, or inconsistent formatting>",
    "<Additional red flags or empty array if none>"
  ]
}

Evaluation Criteria (apply these rigorously):
- Completeness and accuracy of contact information (name, phone, email, LinkedIn, location)
- Professional summary or objective (if present and effective)
- Work experience: clarity, relevance, use of strong action verbs, quantifiable achievements (numbers, metrics, impact)
- Skills section: presence, relevance to target roles, inclusion of both technical and soft skills
- Education: degrees, institutions, graduation years, relevant coursework or honors
- Additional sections: certifications, projects, publications, volunteer work (as appropriate)
- Formatting: readability, consistency, length (ideally 1-2 pages), use of bullet points, white space
- ATS compatibility: plain text-friendly, standard section headings, no tables/graphics/columns, keyword optimization for target roles
- Grammar, spelling, punctuation, and overall professionalism

Prioritize quantifiable achievements and impact-oriented language. Be candid but constructive in feedback.

Ensure the JSON is valid and can be parsed directly.
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