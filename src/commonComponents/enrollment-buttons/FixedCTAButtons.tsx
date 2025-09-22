import React from "react";

interface FixedCTAButtonsProps {
  onEnroll: () => void;
  onDecline: () => void;
}

const FixedCTAButtons: React.FC<FixedCTAButtonsProps> = ({
  onEnroll,
  onDecline,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full max-w-md mx-auto p-2">
      <button
        onClick={onEnroll}
        className="w-full sm:w-[200px] py-3 sm:py-4 px-4 text-xl font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg sm:rounded-xl transition-colors duration-200"
      >
        Enroll Now
      </button>
      <button
        onClick={onDecline}
        className="w-full sm:w-[200px] py-3 sm:py-4 px-4 text-xl font-semibold text-[var(--font-primary)] bg-[#F1F1F1] rounded-lg sm:rounded-xl transition-colors duration-200 hover:bg-[#DFDFDF]"
      >
        Not Interested
      </button>
    </div>
  );
};

export default FixedCTAButtons;
