import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("❌ GEMINI_API_KEY missing");
}

// The client gets the API key from the environment variable `GEMINI_API_KEY` (or `GOOGLE_API_KEY`).
// We export 'ai' to be used elsewhere.
export const ai = new GoogleGenAI({});

// We don't export 'embeddingModel' as a model object anymore, 
// because with the new SDK we call ai.models.embedContent({ model: "..." }) directly.
// But to keep compatibility we could export the model name string.
export const EMBEDDING_MODEL_NAME = "text-embedding-004";

