import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const geminiResponse = async (command, assistantName, userName) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing from backend/.env");
    return null;
  }

  // Active models available under your key
  const modelsToTry = [
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.8-flash"
  ];

  const prompt = `You are a virtual assistant named ${assistantName} created by ${userName}.
You are not Google. You will now behave like a voice-enabled assistant.

Your task is to understand the user's natural language input and respond with a JSON-like object with the following fields:
- type: determine the intent:
  * "general": ANY question, factual query, explanation, or conversational interaction (e.g. "what is javascript", "who created you", "tell me a joke", "how does a car engine work"). You MUST answer the question directly with a conversational spoken answer in the response field.
  * "open-youtube": user explicitly asks to open YouTube without specific search queries (e.g. "open youtube", "launch youtube").
  * "youtube-search": user explicitly asks to search or play a song, video, or channel on YouTube (e.g. "search Aaj Ki Raat on youtube", "play songs on youtube").
  * "open-google": user explicitly asks to open Google (e.g. "open google").
  * "google-search": ONLY when the user explicitly requests an internet web search (e.g. "search on google ...", "google ...").
  * "get-time": user asks for the current time.
  * "get-date": user asks for today's date.
  * "get-day": user asks for current day of the week.
  * "get-month": user asks for current month.
  * "open-calculator": user asks to open the calculator.
  * "open-instagram": user asks to open Instagram.
  * "open-facebook": user asks to open Facebook.
  * "weather-show": user asks about the weather.
- userInput: the core query or search term extracted from the user's input (clean off assistant name "${assistantName}", trigger words like "search on youtube", etc.).
- response: a clear, concise, conversational spoken reply suitable for voice synthesis.

Respond ONLY with a valid raw JSON object. Do not wrap in markdown code blocks or backticks.
Now user input: ${command}`;

  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini] Calling ${model} (attempt ${attempt})...`);
        const response = await axios.post(
          url,
          {
            contents: [{ parts: [{ text: prompt }] }],
          },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 30000,
          }
        );

        const textOutput =
          response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textOutput) {
          console.log(`[Gemini] Success from ${model}`);
          return textOutput;
        }
      } catch (error) {
        const status = error.response?.status;
        const msg = error.response?.data?.error?.message || error.message;

        if (status === 503) {
          console.warn(
            `[Gemini] ${model} busy (503). Retrying in ${attempt * 1.5}s...`
          );
          await sleep(attempt * 1500);
          continue;
        }

        console.warn(`[Gemini] Error on ${model}: ${msg}`);
        break; // Advance to the next candidate model
      }
    }
  }

  console.error("[Gemini] All fallback models failed.");
  return null;
};

export default geminiResponse;