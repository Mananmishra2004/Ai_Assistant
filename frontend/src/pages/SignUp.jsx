import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { IoEye, IoEyeOff } from "react-icons/io5";
import authBg from "../assets/authBg.png";
import { UserDataContext } from "../context/UserContext";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { serverUrl, setUserData } = useContext(UserDataContext);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signup`,
        { name, email, password },
        { withCredentials: true }
      );
      setUserData(result.data);
      setLoading(false);
      navigate("/customize");
    } catch (err) {
      setLoading(false);
      setError(err?.response?.data?.message || "Sign up failed");
    }
  };

  return (
    <div
      className="w-full h-screen bg-cover flex justify-center items-center"
      style={{ backgroundImage: `url(${authBg})` }}
    >
      <form
        onSubmit={handleSignUp}
        className="w-[90%] max-w-[500px] h-[600px] bg-black/50 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center gap-5 px-5 rounded-2xl"
      >
        <h1 className="text-white text-[30px] font-semibold mb-6">
          Register to <span className="text-blue-400">Virtual Assistant</span>
        </h1>

        <input
          type="text"
          placeholder="Enter Your Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-[60px] outline-none border-2 border-white bg-transparent text-white px-5 py-2.5 rounded-full text-[18px] placeholder-gray-300"
        />

        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-[60px] outline-none border-2 border-white bg-transparent text-white px-5 py-2.5 rounded-full text-[18px] placeholder-gray-300"
        />

        <div className="w-full h-[60px] border-2 border-white bg-transparent rounded-full relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-full outline-none bg-transparent text-white px-5 rounded-full text-[18px] placeholder-gray-300"
          />
          {showPassword ? (
            <IoEyeOff
              onClick={() => setShowPassword(false)}
              className="absolute top-[18px] right-5 text-white w-[25px] h-[25px] cursor-pointer"
            />
          ) : (
            <IoEye
              onClick={() => setShowPassword(true)}
              className="absolute top-[18px] right-5 text-white w-[25px] h-[25px] cursor-pointer"
            />
          )}
        </div>

        {error.length > 0 && <p className="text-red-500 text-[17px]">*{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="min-w-[150px] h-[60px] bg-white rounded-full text-black font-semibold text-[19px] mt-6 cursor-pointer"
        >
          {loading ? "Loading..." : "Sign Up"}
        </button>

        <p
          onClick={() => navigate("/signin")}
          className="text-white text-[18px] cursor-pointer"
        >
          Already have an account? <span className="text-blue-400">Sign In</span>
        </p>
      </form>
    </div>
  );
};

export default SignUp;
