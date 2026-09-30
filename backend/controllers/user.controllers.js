import User from "../models/user.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import geminiResponse from "../gemini.js";
import moment from "moment";

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

    const userName = user.name;
    const assistantName = user.assistantName;

    // Save search/conversation history
    user.history.push(command);
    await user.save();

    const rawResult = await geminiResponse(command, assistantName, userName);

    const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(400).json({ response: "Sorry, I could not understand that." });
    }

    const gemResult = JSON.parse(jsonMatch[0]);
    const { type, userInput, response } = gemResult;

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

      case "general":
      case "google-search":
      case "youtube-search":
      case "youtube-play":
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
    return res.status(500).json({ message: "Ask assistant error" });
  }
};
