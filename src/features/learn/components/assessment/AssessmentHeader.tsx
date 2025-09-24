import React from "react";
import { useNavigate } from "react-router-dom";

interface AssessmentHeaderProps {
  timeRemaining: number;
  assessmentId?: string;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
};

const AssessmentHeader: React.FC<AssessmentHeaderProps> = ({
  timeRemaining,
  assessmentId = "ai-linc-scholarship-test",
}) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    // Navigate to the specific assessment instruction page or fallback to the default
    if (assessmentId === "ai-linc-scholarship-test") {
      navigate("/ai-linc-scholarship-test");
    } else {
      navigate(`/assessment/${assessmentId}`);
    }
  };

  return (
    <div className="bg-white rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <button
          onClick={handleBackClick}
          className="flex items-center text-[var(--primary-500)] hover:text-[#1a4a5f] mb-2 sm:mb-0"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            ></path>
          </svg>
          Back
        </button>
        <div className="text-left sm:text-center w-full sm:w-auto">
          <h1 className="text-base sm:text-lg font-semibold text-gray-800">
            Assessment
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Solve real world questions and gain insight knowledge.
          </p>
        </div>
        <div className="text-left sm:text-right w-full sm:w-auto">
          <div className="text-xs sm:text-sm text-gray-500">Time Remaining</div>
          <div className="text-base sm:text-lg font-semibold text-[var(--primary-500)]">
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentHeader;
