import React from "react";

interface ContinueLearningButtonProps {
  onClick: () => void;
  fullWidth?: boolean;
  className?: string;
}

export const ContinueLearningButton: React.FC<ContinueLearningButtonProps> = ({
  onClick,
  fullWidth = true,
  className = "",
}) => {
  return (
    <div className={fullWidth ? "w-full" : ""}>
      <button
        onClick={onClick}
        className={`px-5 py-3 border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 text-center bg-[#10b981] text-white hover:bg-[#059669] hover:-translate-y-0.5 ${
          fullWidth ? "w-full" : ""
        } ${className}`}
      >
        Continue Learning
      </button>
    </div>
  );
};
