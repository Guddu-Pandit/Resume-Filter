import { embeddingModel } from "../config/gemini.js";

export const generateEmbedding = async (text) => {
  if (!embeddingModel) {
    throw new Error("Gemini embedding model not initialized");
  }

  // Ensure text length is within limits (GenAI has a limit, typically 10k tokens, slicing chars is a rough safety net)
  const result = await embeddingModel.embedContent(text.slice(0, 10000));
  return result.embedding.values;
};
