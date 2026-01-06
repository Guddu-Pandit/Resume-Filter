import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.PINECONE_API_KEY) {
    console.error("❌ PINECONE_API_KEY missing in .env");
}

if (!process.env.PINECONE_INDEX) {
    console.warn("⚠️ PINECONE_INDEX missing in .env, falling back to 'resume-filter'");
}

const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || '',
});

export const pineconeIndex = pc.index(process.env.PINECONE_INDEX || 'resume-filter');
