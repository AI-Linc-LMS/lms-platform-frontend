import React from "react";
import { useNavigate } from "react-router-dom";

const BackToPreviousPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center mb-6">
      <button
        onClick={() => {
          const pathSegments = window.location.pathname.split("/");
          const courseId = pathSegments[3]; // Extract courseId from /learn/course/:courseId/:submoduleId
          navigate(`/courses/${courseId}`);
        }}
        className="h-[38px] w-[38px] bg-[var(--secondary-500)] rounded-full text-[var(--primary-500)] flex items-center justify-center mr-4 cursor-pointer"
      >
        <svg
          width="22"
          height="18"
          viewBox="0 0 22 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21 9H1M1 9L8.5 1.5M1 9L8.5 16.5"
            stroke="#EFF9FC"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <span className="font-normal text-[22px] text-[var(--secondary-500)]">
        Back to Home
      </span>
    </div>
  );
};

export default BackToPreviousPage;
