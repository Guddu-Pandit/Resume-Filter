import dotenv from "dotenv";

dotenv.config();

async function listModels() {
    console.log("Checking API Key via ListModels endpoint...");

    if (!process.env.GEMINI_API_KEY) {
        console.error("❌ No GEMINI_API_KEY found in environment variables.");
        process.exit(1);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error(`\n❌ API Error: ${response.status} ${response.statusText}`);
            console.error("Details:", JSON.stringify(data, null, 2));
            return;
        }

        console.log("\n✅ SUCCESS: API Key is valid!");
        console.log("Available Models:");
        if (data.models) {
            data.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log("No models returned (this is unexpected but key is valid).");
        }

    } catch (error) {
        console.error("\n❌ ERROR: Failed to fetch models.");
        console.error(error.message);
    }
}

listModels();
