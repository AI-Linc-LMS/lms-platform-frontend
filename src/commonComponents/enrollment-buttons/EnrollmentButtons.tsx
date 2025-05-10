import React from 'react';

interface EnrollmentButtonsProps {
  onEnroll: () => void;
  onDecline: () => void;
}

const EnrollmentButtons: React.FC<EnrollmentButtonsProps> = ({ onEnroll, onDecline }) => {
  return (
    <div className="flex flex-col sm:flex-row w-full gap-3 sm:gap-4 my-4">
      <button
        onClick={onEnroll}
        className="w-full sm:w-auto px-6 py-3 sm:py-4 text-base sm:text-lg font-medium text-white bg-[#1F4F68] rounded-lg hover:bg-[#163a4f] transition-colors duration-200"
      >
        Enroll Now
      </button>
      <button
        onClick={onDecline}
        className="w-full sm:w-auto px-6 py-3 sm:py-4 text-base sm:text-lg font-medium text-[#333333] bg-[#e9e9e9] rounded-lg hover:bg-[#d8d8d8] transition-colors duration-200 whitespace-nowrap"
      >
        Not Interested
      </button>
    </div>
  );
};

export default EnrollmentButtons; 