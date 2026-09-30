import React, { useContext } from "react";
import { UserDataContext } from "../context/UserContext";

const Card = ({ image }) => {
  const { selectedImage, setSelectedImage, setBackendImage, setFrontendImage } =
    useContext(UserDataContext);

  const isSelected = selectedImage === image;

  return (
    <div
      onClick={() => {
        setSelectedImage(image);
        setBackendImage(null);
        setFrontendImage(null);
      }}
      className={`w-[70px] h-[140px] lg:w-[150px] lg:h-[250px] bg-blue-950/40 rounded-2xl overflow-hidden cursor-pointer border-2 border-white/30 hover:border-4 hover:border-white transition-all ${
        isSelected ? "border-4 border-white shadow-2xl shadow-blue-950" : ""
      }`}
    >
      <img src={image} alt="assistant" className="w-full h-full object-cover" />
    </div>
  );
};

export default Card;
