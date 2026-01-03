import Resume from "../models/Resume.js";
import { generateEmbedding } from "../utils/embedding.js";
import { cosineSimilarity } from "../utils/similarity.js";

export const semanticResumeSearch = async (req, res) => {
  try {
    const { question } = req.body;
    const userId = req.user.id;

    const queryEmbedding = await generateEmbedding(question);

    const resumes = await Resume.find({ userId });

    const ranked = resumes
      .map((r) => ({
        fileName: r.fileName,
        score: cosineSimilarity(queryEmbedding, r.embedding),
      }))
      .sort((a, b) => b.score - a.score);

    res.json(ranked);
  } catch (err) {
    console.error("Ask resume error:", err);
    res.status(500).json({ message: "Semantic search failed" });
  }
};
