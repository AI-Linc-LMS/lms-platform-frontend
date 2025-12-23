import React from "react";

interface EnrollmentButtonsProps {
  onEnroll: () => void;
  onDecline: () => void;
}

const EnrollmentButtons: React.FC<EnrollmentButtonsProps> = ({
  onEnroll,
  onDecline,
}) => {
  return (
    <div className="flex flex-col sm:flex-row w-full gap-3 sm:gap-4 my-4">
      <button
        onClick={onEnroll}
        className="w-full sm:w-auto px-6 py-3 sm:py-4 text-base sm:text-lg font-medium text-white rounded-xl transition-all duration-200 bg-[var(--success-500)] hover:bg-[#059669] shadow-sm hover:shadow-md active:scale-[0.98]"
      >
        Enroll Now
      </button>
      <button
        onClick={onDecline}
        className="w-full sm:w-auto px-6 py-3 sm:py-4 text-base sm:text-lg font-medium text-[var(--font-primary)] bg-[var(--neutral-100)] rounded-xl hover:bg-[var(--neutral-200)] border border-[var(--neutral-200)] transition-all duration-200 whitespace-nowrap active:scale-[0.98]"
      >
        Not Interested
      </button>
    </div>
  );
};

export default EnrollmentButtons;
