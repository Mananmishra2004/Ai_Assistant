import User from "../models/user.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import geminiResponse from "../gemini.js";
import moment from "moment";
import ytSearch from "yt-search";

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Get current user error" });
  }
};

export const updateAssistant = async (req, res) => {
  try {
    const { assistantName, imageUrl } = req.body;
    let assistantImage = "";

    if (req.file) {
      assistantImage = await uploadOnCloudinary(req.file.path);
    } else {
      assistantImage = imageUrl;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { assistantName, assistantImage },
      { new: true }
    ).select("-password");

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Update assistant error" });
  }
};

export const askToAssistant = async (req, res) => {
  try {
    const { command } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userName = user.name;
    const assistantName = user.assistantName;

    // Save search/conversation history
    user.history.push(command);
    await user.save();

    const rawResult = await geminiResponse(command, assistantName, userName);

    if (!rawResult) {
      return res.status(500).json({ response: "I could not process that request right now." });
    }

    const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(400).json({ response: "Sorry, I could not understand that." });
    }

    const gemResult = JSON.parse(jsonMatch[0]);
    let { type, userInput, response } = gemResult;

    // Fallback: If command has "play" or "song" or "video", force type to "youtube-play"
    const lowerCommand = command.toLowerCase();
    if (
      lowerCommand.includes("play") ||
      lowerCommand.includes("chalao") ||
      lowerCommand.includes("bajao") ||
      lowerCommand.includes("sunao")
    ) {
      type = "youtube-play";
    }

    switch (type) {
      case "get-date":
        return res.status(200).json({
          type,
          userInput,
          response: `Current date is ${moment().format("MMMM Do YYYY")}`,
        });

      case "get-time":
        return res.status(200).json({
          type,
          userInput,
          response: `Current time is ${moment().format("hh:mm A")}`,
        });

      case "get-day":
        return res.status(200).json({
          type,
          userInput,
          response: `Today is ${moment().format("dddd")}`,
        });

      case "get-month":
        return res.status(200).json({
          type,
          userInput,
          response: `Current month is ${moment().format("MMMM")}`,
        });

      // Handle BOTH youtube-play and youtube-search
      case "youtube-play": {
        // Clean out filler words from search query
        let cleanQuery = (userInput || command)
          .replace(new RegExp(assistantName, "gi"), "")
          .replace(/play/gi, "")
          .replace(/chalao|bajao|sunao/gi, "")
          .replace(/on youtube|in youtube|youtube par|youtube pe/gi, "")
          .replace(/song|video/gi, "")
          .trim();

        if (!cleanQuery) cleanQuery = userInput || "trending music";

        let videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQuery)}`;
        
        try {
          console.log(`[yt-search] Searching for: "${cleanQuery}"`);
          const searchResults = await ytSearch(cleanQuery);
          const topVideo = searchResults?.videos?.[0];
          
          if (topVideo?.videoId) {
            videoUrl = `https://www.youtube.com/watch?v=${topVideo.videoId}&autoplay=1`;
            console.log(`[yt-search] Found direct video: ${videoUrl}`);
          } else {
            console.warn("[yt-search] No video ID found, falling back to search query.");
          }
        } catch (ytError) {
          console.error("YouTube search error:", ytError);
        }

        return res.status(200).json({
          type: "youtube-play",
          userInput: cleanQuery,
          videoUrl,
          response: response || `Playing ${cleanQuery} on YouTube`,
        });
      }

      case "general":
      case "open-youtube":
      case "youtube-search":
      case "open-google":
      case "google-search":
      case "open-calculator":
      case "open-instagram":
      case "open-facebook":
      case "weather-show":
        return res.status(200).json({ type, userInput, response });

      default:
        return res.status(200).json({
          type: "general",
          userInput,
          response: response || "I did not understand that command.",
        });
    }
  } catch (error) {
    console.error("askToAssistant error:", error);
    return res.status(500).json({ message: "Ask assistant error" });
  }
};