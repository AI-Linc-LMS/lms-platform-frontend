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
        className={`px-5 py-3 border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 text-center bg-[var(--course-cta)] text-[var(--font-light)] hover:bg-[#059669] hover:-translate-y-0.5 ${
          fullWidth ? "w-full" : ""
        } ${className}`}
      >
        Continue Learning
      </button>
    </div>
  );
};
