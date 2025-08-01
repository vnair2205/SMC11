// server/utils/apiKeyManager.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

const geminiApiKeys = process.env.GEMINI_API_KEYS
    ? process.env.GEMINI_API_KEYS.split(',').filter(key => key.trim() !== '')
    : [];

const youtubeApiKeys = process.env.YOUTUBE_API_KEYS
    ? process.env.YOUTUBE_API_KEYS.split(',').filter(key => key.trim() !== '')
    : [];

// NEW: Pexels API Keys
const pexelsApiKeys = process.env.PEXELS_API_KEYS
    ? process.env.PEXELS_API_KEYS.split(',').filter(key => key.trim() !== '')
    : [];

// --- DEBUG LOG ---
console.log(`[DEBUG] Loaded ${youtubeApiKeys.length} YouTube API Keys.`);
console.log(`[DEBUG] Loaded ${pexelsApiKeys.length} Pexels API Keys.`); // NEW DEBUG
// --- END DEBUG ---

if (geminiApiKeys.length === 0) {
    console.error("FATAL ERROR: No Gemini API keys found in .env file.");
    process.exit(1);
}
if (youtubeApiKeys.length === 0) {
    console.error("FATAL ERROR: No YouTube API keys found in .env file.");
    process.exit(1);
}
// NEW: Check for Pexels API keys
if (pexelsApiKeys.length === 0) {
    console.warn("WARNING: No Pexels API keys found in .env file. Thumbnail generation may be limited.");
    // Do not exit, but warn, as Pexels is for a new feature.
}

let youtubeCurrentIndex = 0;
let pexelsCurrentIndex = 0; // NEW: Index for Pexels keys

function getNextYoutubeKey() {
    const key = youtubeApiKeys[youtubeCurrentIndex];
    youtubeCurrentIndex = (youtubeCurrentIndex + 1) % youtubeApiKeys.length;
    return key;
}

// NEW: Function to get next Pexels API key
function getNextPexelsKey() {
    const key = pexelsApiKeys[pexelsCurrentIndex];
    pexelsCurrentIndex = (pexelsCurrentIndex + 1) % pexelsApiKeys.length;
    return key;
}


const generateWithFallback = async (prompt) => {
    for (const key of geminiApiKeys) {
        try {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            console.warn(`Gemini key ending in ...${key.slice(-4)} failed. Error: ${error.message}. Trying next key...`);
        }
    }
    throw new Error("All available Gemini API keys failed.");
};

module.exports = {
    getNextYoutubeKey,
    getNextPexelsKey, // NEW: Export the Pexels key function
    generateWithFallback
};