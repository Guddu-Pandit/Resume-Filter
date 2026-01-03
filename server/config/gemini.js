import { GoogleGenerativeAI } from "@google/generative-ai";

if (process.env.GEMINI_API_KEY) {
  throw new Error("❌ GEMINI_API_KEY missing");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ EMBEDDING MODEL (STABLE)
export const embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});
