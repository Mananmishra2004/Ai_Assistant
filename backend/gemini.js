import axios from "axios";

const geminiResponse = async (command, assistantName, userName) => {
  try {
    const prompt = `You are a virtual assistant named ${assistantName} created by ${userName}.
You are not Google. You will now behave like a voice-enabled assistant.
Your task is to understand the user's natural language input and respond with a JSON-like object with the following fields:
- type: determine the intent ("general", "google-search", "youtube-search", "youtube-play", "get-time", "get-date", "get-day", "get-month", "open-calculator", "open-instagram", "open-facebook", "weather-show").
- userInput: original sentence spoken by user (remove assistant name "${assistantName}" if present).
- response: a short, voice-friendly response.

Respond ONLY with valid raw JSON object. Do not wrap in markdown or backticks.
Now user input: ${command}`;

    const response = await axios.post(process.env.GEMINI_URL, {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    });

    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.log("Gemini API error:", error);
    return null;
  }
};

export default geminiResponse;
