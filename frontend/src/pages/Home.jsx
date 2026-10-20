import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CgMenuRight } from "react-icons/cg";
import { IoClose } from "react-icons/io5";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";

import { UserDataContext } from "../context/UserContext";
import userGif from "../assets/user.gif";
import aiGif from "../assets/ai.gif";

const Home = () => {
  const navigate = useNavigate();
  const { serverUrl, userData, setUserData, getGeminiResponse } =
    useContext(UserDataContext);

  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const [ham, setHam] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [manualInput, setManualInput] = useState("");

  const isSpeakingRef = useRef(false);
  const recognitionRef = useRef(null);
  const isRecognizingRef = useRef(false);
  const isMountedRef = useRef(true);
  const userDisabledMicRef = useRef(false);

  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

  // Safe wrapper to start speech recognition
  const startRecognition = () => {
    if (userDisabledMicRef.current) return;

    if (
      !isSpeakingRef.current &&
      !isRecognizingRef.current &&
      recognitionRef.current &&
      isMountedRef.current
    ) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        if (err.name !== "InvalidStateError") {
          console.error("Recognition start error:", err);
        }
      }
    }
  };

  // Safely stop speech recognition
  const stopRecognition = () => {
    if (recognitionRef.current && isRecognizingRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Recognition stop error:", err);
      }
    }
    isRecognizingRef.current = false;
    setListening(false);
  };

  // Toggle button handler
  const handleToggleListening = () => {
    if (listening) {
      userDisabledMicRef.current = true;
      stopRecognition();
    } else {
      userDisabledMicRef.current = false;
      if (synth) synth.cancel();
      startRecognition();
    }
  };

  // Convert text to speech using browser SpeechSynthesis
  const speak = (text) => {
    if (!synth) return;

    synth.cancel();
    stopRecognition();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";

    const voices = synth.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang === "hi-IN" ||
        v.lang.includes("hi") ||
        v.lang === "en-IN" ||
        v.lang.includes("en-US")
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    isSpeakingRef.current = true;

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setAiText("");
      setTimeout(() => {
        if (isMountedRef.current && !userDisabledMicRef.current) {
          startRecognition();
        }
      }, 800);
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis notice:", e.error);
      isSpeakingRef.current = false;
      setAiText("");
      setTimeout(() => {
        if (isMountedRef.current && !userDisabledMicRef.current) {
          startRecognition();
        }
      }, 800);
    };

    synth.speak(utterance);
  };

  // Handle parsed commands returned from Gemini & backend
  const handleCommand = (data) => {
    if (!data) return;
    const { type, userInput, response, videoUrl } = data;

    if (response) {
      speak(response);
    }

    const query = encodeURIComponent(userInput || "");
    const cleanInput = (userInput || "").trim().toLowerCase();

    switch (type) {
      case "open-youtube":
        window.open("https://www.youtube.com", "_blank");
        break;

      case "youtube-play":
        if (videoUrl) {
          window.open(videoUrl, "_blank");
        } else if (!cleanInput || cleanInput === "youtube" || cleanInput === "open youtube") {
          window.open("https://www.youtube.com", "_blank");
        } else {
          window.open(
            `https://www.youtube.com/results?search_query=${query}`,
            "_blank"
          );
        }
        break;

      case "youtube-search":
        if (!cleanInput || cleanInput === "youtube" || cleanInput === "open youtube") {
          window.open("https://www.youtube.com", "_blank");
        } else {
          window.open(
            `https://www.youtube.com/results?search_query=${query}`,
            "_blank"
          );
        }
        break;

      case "open-google":
        window.open("https://www.google.com", "_blank");
        break;

      case "google-search":
        if (!cleanInput || cleanInput === "google" || cleanInput === "open google") {
          window.open("https://www.google.com", "_blank");
        } else {
          window.open(`https://www.google.com/search?q=${query}`, "_blank");
        }
        break;

      case "open-calculator":
        window.open("https://www.google.com/search?q=calculator", "_blank");
        break;

      case "open-instagram":
        window.open("https://www.instagram.com", "_blank");
        break;

      case "open-facebook":
        window.open("https://www.facebook.com", "_blank");
        break;

      case "weather-show":
        window.open("https://www.google.com/search?q=weather", "_blank");
        break;

      case "general":
      default:
        if (videoUrl) {
          window.open(videoUrl, "_blank");
        } else if (cleanInput.startsWith("play ") && cleanInput.includes("youtube")) {
          const song = encodeURIComponent(cleanInput.replace("play", "").replace("on youtube", "").trim());
          window.open(`https://www.youtube.com/results?search_query=${song}`, "_blank");
        } else if (cleanInput.includes("youtube")) {
          window.open("https://www.youtube.com", "_blank");
        } else if (cleanInput.includes("google")) {
          window.open("https://www.google.com", "_blank");
        }
        break;
    }
  };

  // Handle manual command submission from the input field
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    const command = manualInput.trim();
    setManualInput("");
    setUserText(command);
    stopRecognition();

    const data = await getGeminiResponse(command);
    setUserText("");

    if (data) {
      setAiText(data.response);
      handleCommand(data);
    } else if (!userDisabledMicRef.current) {
      startRecognition();
    }
  };

  // Initialize Speech Recognition
  useEffect(() => {
    isMountedRef.current = true;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error(
        "Speech recognition is not supported in this browser. Please use Google Chrome."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      isRecognizingRef.current = true;
      setListening(true);
    };

    recognition.onend = () => {
      isRecognizingRef.current = false;
      setListening(false);

      if (isMountedRef.current && !isSpeakingRef.current && !userDisabledMicRef.current) {
        setTimeout(() => {
          if (isMountedRef.current && !isSpeakingRef.current && !userDisabledMicRef.current) {
            startRecognition();
          }
        }, 800);
      }
    };

    recognition.onerror = (event) => {
      isRecognizingRef.current = false;
      setListening(false);

      if (event.error === "network") {
        console.warn(
          "Speech recognition network error: Google speech service unreachable. Check firewall/VPN/DNS."
        );
        return;
      }
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        console.warn("Microphone access denied or blocked by browser.");
        return;
      }

      if (isMountedRef.current && !isSpeakingRef.current && !userDisabledMicRef.current) {
        setTimeout(() => {
          if (isMountedRef.current && !userDisabledMicRef.current) {
            startRecognition();
          }
        }, 1000);
      }
    };

    recognition.onresult = async (e) => {
      const results = e.results;
      const last = results[results.length - 1][0].transcript.trim();
      const lowerTranscript = last.toLowerCase();

      const assistantName = userData?.assistantName?.toLowerCase() || "";

      if (assistantName && lowerTranscript.includes(assistantName)) {
        stopRecognition();
        setUserText(last);

        const data = await getGeminiResponse(last);
        setUserText("");

        if (data) {
          setAiText(data.response);
          handleCommand(data);
        } else if (!userDisabledMicRef.current) {
          startRecognition();
        }
      }
    };

    const handleFirstInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        if (userData?.name) {
          speak(`Hello ${userData.name}, what can I help you with?`);
        } else if (!userDisabledMicRef.current) {
          startRecognition();
        }
      }
    };

    window.addEventListener("click", handleFirstInteraction, { once: true });
    startRecognition();

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("click", handleFirstInteraction);
      if (synth) synth.cancel();
      stopRecognition();
    };
  }, [userData]);

  const handleLogout = async () => {
    try {
      if (synth) synth.cancel();
      stopRecognition();
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
      setUserData(null);
      navigate("/signin");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-t from-black to-blue-950 flex flex-col justify-center items-center gap-4 relative overflow-hidden px-4">
      {/* Desktop action buttons */}
      <button
        onClick={handleLogout}
        className="hidden lg:block absolute top-5 right-5 bg-white text-black font-semibold px-5 py-2.5 rounded-full cursor-pointer hover:bg-gray-200 transition-colors z-20"
      >
        Log Out
      </button>

      <button
        onClick={() => navigate("/customize")}
        className="hidden lg:block absolute top-20 right-5 bg-white text-black font-semibold px-5 py-2.5 rounded-full cursor-pointer hover:bg-gray-200 transition-colors z-20"
      >
        Customize Your Assistant
      </button>

      {/* Mobile Hamburger menu toggle */}
      <CgMenuRight
        onClick={() => setHam(true)}
        className="lg:hidden absolute top-5 right-5 text-white w-7 h-7 cursor-pointer z-20"
      />

      {/* Slide-out Mobile Sidebar with conversation history */}
      <div
        className={`fixed top-0 right-0 w-full h-full bg-black/70 backdrop-blur-lg flex flex-col p-6 z-50 transition-transform duration-300 ${
          ham ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <IoClose
          onClick={() => setHam(false)}
          className="text-white w-8 h-8 self-end cursor-pointer mb-6"
        />

        <button
          onClick={handleLogout}
          className="w-full bg-white text-black font-semibold py-3 rounded-full mb-4 cursor-pointer"
        >
          Log Out
        </button>

        <button
          onClick={() => {
            setHam(false);
            navigate("/customize");
          }}
          className="w-full bg-white text-black font-semibold py-3 rounded-full mb-6 cursor-pointer"
        >
          Customize Your Assistant
        </button>

        <div className="w-full h-[2px] bg-gray-600 mb-4" />

        <h2 className="text-white font-semibold text-[20px] mb-4">History</h2>
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px]">
          {userData?.history && userData.history.length > 0 ? (
            userData.history.map((item, idx) => (
              <span key={idx} className="text-gray-300 text-[16px] truncate">
                {item}
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-[14px]">No history yet</span>
          )}
        </div>
      </div>

      {/* Virtual Assistant Avatar */}
      <div className="w-[180px] h-[260px] sm:w-[200px] sm:h-[300px] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
        <img
          src={userData?.assistantImage}
          alt={userData?.assistantName || "Assistant"}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Assistant Identity Heading */}
      <h1 className="text-white text-[20px] font-semibold">
        I'm {userData?.assistantName || "Assistant"}
      </h1>

      {/* Dynamic Animated Status Visualizer */}
      <img
        src={aiText ? aiGif : userGif}
        alt="voice visualizer"
        className="w-[160px] sm:w-[180px] object-contain"
      />

      {/* Live Transcript / Status Label */}
      <h2 className="text-white text-[16px] sm:text-[18px] font-semibold text-center max-w-[600px] min-h-[28px] px-2">
        {userText || aiText || (listening ? "Listening..." : "Microphone paused")}
      </h2>

      {/* Push-to-Talk / Listening Toggle Button */}
      <button
        onClick={handleToggleListening}
        className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full font-semibold text-[15px] cursor-pointer transition-all shadow-lg z-20 ${
          listening
            ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {listening ? (
          <>
            <FaMicrophone className="text-lg" /> Stop Listening
          </>
        ) : (
          <>
            <FaMicrophoneSlash className="text-lg" /> Start Listening
          </>
        )}
      </button>

      {/* Manual Input Fallback Bar */}
      <form onSubmit={handleManualSubmit} className="flex items-center gap-2 z-20 mt-1">
        <input
          type="text"
          placeholder={`Type a command (e.g. play Aaj Ki Raat on youtube)...`}
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          className="w-[260px] sm:w-[360px] h-[45px] px-5 rounded-full bg-white/10 border border-white/30 text-white placeholder-gray-400 outline-none focus:border-blue-400 transition-all text-[15px]"
        />
        <button
          type="submit"
          className="h-[45px] px-6 rounded-full bg-white text-black font-semibold text-[14px] hover:bg-gray-200 cursor-pointer transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Home;