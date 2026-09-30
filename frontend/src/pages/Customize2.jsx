import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BsArrowLeft } from "react-icons/bs";
import { UserDataContext } from "../context/UserContext";

const Customize2 = () => {
  const navigate = useNavigate();
  const {
    serverUrl,
    userData,
    setUserData,
    backendImage,
    selectedImage,
  } = useContext(UserDataContext);

  const [assistantName, setAssistantName] = useState(
    userData?.assistantName || ""
  );
  const [loading, setLoading] = useState(false);

  const handleUpdateAssistant = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("assistantName", assistantName);

      if (backendImage) {
        formData.append("assistantImage", backendImage);
      } else {
        formData.append("imageUrl", selectedImage);
      }

      const result = await axios.post(
        `${serverUrl}/api/user/update`,
        formData,
        { withCredentials: true }
      );

      setUserData(result.data);
      setLoading(false);
      navigate("/");
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-t from-black to-blue-950 flex flex-col justify-center items-center relative px-5">
      <BsArrowLeft
        onClick={() => navigate("/customize")}
        className="absolute top-[30px] left-[30px] text-white w-[25px] h-[25px] cursor-pointer"
      />

      <h1 className="text-white text-[30px] text-center font-semibold mb-10">
        Enter Your <span className="text-blue-400">Assistant Name</span>
      </h1>

      <input
        type="text"
        placeholder="Enter Name (e.g. Siphra / Jarvis)"
        value={assistantName}
        onChange={(e) => setAssistantName(e.target.value)}
        className="w-full max-w-[600px] h-[60px] outline-none border-2 border-white bg-transparent text-white px-5 rounded-full text-[18px] placeholder-gray-300"
      />

      {assistantName.trim().length > 0 && (
        <button
          onClick={handleUpdateAssistant}
          disabled={loading}
          className="min-w-[300px] h-[60px] bg-white rounded-full text-black font-semibold text-[19px] mt-8 cursor-pointer"
        >
          {loading ? "Loading..." : "Finally Create Your Assistant"}
        </button>
      )}
    </div>
  );
};

export default Customize2;
