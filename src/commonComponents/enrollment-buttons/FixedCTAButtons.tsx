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
        className="w-full sm:w-[200px] py-3 sm:py-4 px-4 text-xl font-semibold text-white bg-[var(--success-500)] hover:bg-[#059669] rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
      >
        Enroll Now
      </button>
      <button
        onClick={onDecline}
        className="w-full sm:w-[200px] py-3 sm:py-4 px-4 text-xl font-semibold text-[var(--font-primary)] bg-[var(--neutral-100)] rounded-xl transition-all duration-200 hover:bg-[var(--neutral-200)] border border-[var(--neutral-200)] active:scale-[0.98]"
      >
        Not Interested
      </button>
    </div>
  );
};

export default FixedCTAButtons;
