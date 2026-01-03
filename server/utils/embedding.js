import genAI from "../config/gemini.js";

export const generateEmbedding = async (text) => {
  if (!genAI) {
    throw new Error("Gemini not initialized");
  }

  const model = genAI.getGenerativeModel({
    model: "embedding-001",
  });

  const result = await model.embedContent(text.slice(0, 8000));
  return result.embedding.values;
};
