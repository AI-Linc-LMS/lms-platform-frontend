import React from "react";
import { useNavigate } from "react-router-dom";

const BackToHomeButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center mb-6">
      <button
        onClick={() => navigate("/")}
        className="h-[38px] w-[38px] bg-[#12293A] rounded-full text-[#255C79] flex items-center justify-center mr-2 cursor-pointer"
      >
        <svg width="16" height="16" viewBox="0 0 22 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 9H1M1 9L8.5 1.5M1 9L8.5 16.5" stroke="#EFF9FC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <span className="font-normal text-[20px] font-sans text-[#12293A]">Back to Home</span>
    </div>
  );
};

export default BackToHomeButton; 