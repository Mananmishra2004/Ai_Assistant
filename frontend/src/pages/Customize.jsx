import React, { useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BsArrowLeft } from "react-icons/bs";
import { FaImage } from "react-icons/fa";
import Card from "../components/Card";
import { UserDataContext } from "../context/UserContext";

import image1 from "../assets/image1.png";
import image2 from "../assets/image2.jpg";
import authBg from "../assets/authBg.png";
import image4 from "../assets/image4.png";
import image5 from "../assets/image5.png";
import image6 from "../assets/image6.jpeg";
import image7 from "../assets/image7.jpeg";

const Customize = () => {
  const navigate = useNavigate();
  const inputImageRef = useRef(null);

  const {
    frontendImage,
    setFrontendImage,
    setBackendImage,
    selectedImage,
    setSelectedImage,
  } = useContext(UserDataContext);

  const cards = [image1, image2, authBg, image4, image5, image6, image7];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackendImage(file);
      setFrontendImage(URL.createObjectURL(file));
      setSelectedImage("input");
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-t from-black to-blue-950 flex flex-col justify-center items-center py-10 relative">
      <BsArrowLeft
        onClick={() => navigate("/")}
        className="absolute top-[30px] left-[30px] text-white w-[25px] h-[25px] cursor-pointer"
      />

      <h1 className="text-white text-[30px] text-center font-semibold mb-10">
        Select Your <span className="text-blue-400">Assistant Image</span>
      </h1>

      <div className="w-[90%] max-w-[900px] flex justify-center items-center flex-wrap gap-4">
        {cards.map((img, index) => (
          <Card key={index} image={img} />
        ))}

        {/* Custom Image Upload Card */}
        <div
          onClick={() => inputImageRef.current.click()}
          className={`w-[70px] h-[140px] lg:w-[150px] lg:h-[250px] bg-blue-950/40 rounded-2xl flex justify-center items-center cursor-pointer border-2 border-white/30 hover:border-4 hover:border-white transition-all overflow-hidden ${
            selectedImage === "input"
              ? "border-4 border-white shadow-2xl shadow-blue-950"
              : ""
          }`}
        >
          <input
            type="file"
            accept="image/*"
            ref={inputImageRef}
            onChange={handleImageChange}
            hidden
          />
          {frontendImage ? (
            <img src={frontendImage} alt="uploaded" className="w-full h-full object-cover" />
          ) : (
            <FaImage className="text-white w-[25px] h-[25px]" />
          )}
        </div>
      </div>

      {selectedImage && (
        <button
          onClick={() => navigate("/customize2")}
          className="min-w-[150px] h-[60px] bg-white rounded-full text-black font-semibold text-[19px] mt-8 cursor-pointer"
        >
          Next
        </button>
      )}
    </div>
  );
};

export default Customize;
