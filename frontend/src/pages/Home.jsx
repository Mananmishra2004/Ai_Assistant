import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CgMenuRight } from "react-icons/cg";
import { IoClose } from "react-icons/io5";

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

  const isSpeakingRef = useRef(false);
  const recognitionRef = useRef(null);
  const isRecognizingRef = useRef(false);

  const synth = window.speechSynthesis;

  // Speak response back in Hindi/English
  const speak = (text) => {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";

    const voices = synth.getVoices();
    const hindiVoice = voices.find((v) => v.lang.includes("hi"));
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }

    isSpeakingRef.current = true;
    utterance.onend = () => {
      isSpeakingRef.current = false;
      setAiText("");
      setTimeout(() => {
        startRecognition();
      }, 800);
    };

    synth.speak(utterance);
  };

  // Execute browser commands
  const handleCommand = (data) => {
    const { type, userInput, response } = data;
    speak(response);

    const query = encodeURIComponent(userInput || "");
    if (type === "google-search") {
      window.open(`https://www.google.com/search?q=${query}`, "_blank");
    } else if (type === "youtube-search") {
      window.open(`https://www.youtube.com/results?search_query=${query}`, "_blank");
    } else if (type === "youtube-play") {
      window.open(`https://www.youtube.com/results?search_query=${query}`, "_blank");
    } else if (type === "open-calculator") {
      window.open("https://www.google.com/search?q=calculator", "_blank");
    } else if (type === "open-instagram") {
      window.open("https://www.instagram.com", "_blank");
    } else if (type === "open-facebook") {
      window.open("https://www.facebook.com", "_blank");
    } else if (type === "weather-show") {
      window.open(`https://www.google.com/search?q=weather`, "_blank");
    }
  };

  const startRecognition = () => {
    if (!isSpeakingRef.current && !isRecognizingRef.current) {
      try {
        recognitionRef.current?.start();
        setListening(true);
      } catch (err) {
        console.log("Recognition start error:", err);
      }
    }
  };

  // Continuous Speech Recognition Hook
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    let isMounted = true;

    recognition.onstart = () => {
      isRecognizingRef.current = true;
      setListening(true);
    };

    recognition.onend = () => {
      isRecognizingRef.current = false;
      setListening(false);
      if (isMounted && !isSpeakingRef.current) {
        setTimeout(() => {
          if (isMounted) startRecognition();
        }, 800);
      }
    };

    recognition.onerror = () => {
      isRecognizingRef.current = false;
      setListening(false);
      if (isMounted && !isSpeakingRef.current) {
        setTimeout(() => {
          if (isMounted) startRecognition();
        }, 1000);
      }
    };

    recognition.onresult = async (e) => {
      const results = e.results;
      const last = results[results.length - 1][0].transcript.trim();
      const lower = last.toLowerCase();

      const assistantName = userData?.assistantName?.toLowerCase() || "";

      if (assistantName && lower.includes(assistantName)) {
        recognition.stop();
        isRecognizingRef.current = false;
        setListening(false);
        setUserText(last);

        const data = await getGeminiResponse(last);
        setUserText("");
        if (data) {
          setAiText(data.response);
          handleCommand(data);
        }
      }
    };

    // Initial greeting
    if (userData?.name) {
      speak(`Hello ${userData.name}, what can I help you with?`);
    } else {
      startRecognition();
    }

    return () => {
      isMounted = false;
      recognition.stop();
      isRecognizingRef.current = false;
    };
  }, [userData]);

  const handleLogout = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
      setUserData(null);
      navigate("/signin");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-t from-black to-blue-950 flex flex-col justify-center items-center gap-4 relative overflow-hidden px-4">
      {/* Top right actions for Desktop */}
      <button
        onClick={handleLogout}
        className="hidden lg:block absolute top-5 right-5 bg-white text-black font-semibold px-5 py-2.5 rounded-full cursor-pointer"
      >
        Log Out
      </button>
      <button
        onClick={() => navigate("/customize")}
        className="hidden lg:block absolute top-20 right-5 bg-white text-black font-semibold px-5 py-2.5 rounded-full cursor-pointer"
      >
        Customize Your Assistant
      </button>

      {/* Mobile Hamburger Icon */}
      <CgMenuRight
        onClick={() => setHam(true)}
        className="lg:hidden absolute top-5 right-5 text-white w-7 h-7 cursor-pointer"
      />

      {/* Slide-out Mobile Menu with Conversation History */}
      <div
        className={`fixed top-0 right-0 w-full h-full bg-black/60 backdrop-blur-lg flex flex-col p-6 z-50 transition-transform duration-300 ${
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

        <div className="w-full h-[2px] bg-gray-500 mb-4" />
        <h2 className="text-white font-semibold text-[20px] mb-4">History</h2>
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px]">
          {userData?.history?.map((item, idx) => (
            <span key={idx} className="text-gray-300 text-[16px] truncate">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Main Avatar & Visualizer */}
      <div className="w-[200px] h-[300px] rounded-3xl overflow-hidden shadow-2xl">
        <img
          src={userData?.assistantImage}
          alt="assistant"
          className="w-full h-full object-cover"
        />
      </div>

      <h1 className="text-white text-[20px] font-semibold">
        I'm {userData?.assistantName}
      </h1>

      <img
        src={aiText ? aiGif : userGif}
        alt="visualizer"
        className="w-[180px] object-contain"
      />

      <h2 className="text-white text-[18px] font-semibold text-center max-w-[600px] min-h-[30px]">
        {userText || aiText || (listening ? "Listening..." : "")}
      </h2>
    </div>
  );
};

export default Home;
