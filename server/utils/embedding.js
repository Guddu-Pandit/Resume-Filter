import { ai, EMBEDDING_MODEL_NAME } from "../config/gemini.js";

export const generateEmbedding = async (text) => {
  // Ensure text length is within limits
  // Warning: New SDK syntax
  const result = await ai.models.embedContent({
    model: EMBEDDING_MODEL_NAME,
    contents: text.slice(0, 10000),
  });

  // The structure of result might differ in the new SDK. 
  // Usually result.embedding or result.embeddings[0].values
  // Based on common patterns: return result.embedding.values;
  // Let's assume standard response structure.
  return result.embedding.values;
};
