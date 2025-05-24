import React from 'react';

interface PopupEnrollmentProps {
  onEnroll: () => void;
  onDecline: () => void;
}

const PopupEnrollment: React.FC<PopupEnrollmentProps> = ({ onEnroll, onDecline }) => {
  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onEnroll}
          className="w-full sm:w-auto px-8 py-3 text-lg font-medium text-white bg-[#1F4F68] rounded-lg hover:bg-[#163a4f] transition-colors duration-200"
        >
          Enroll Now
        </button>
        <button
          onClick={onDecline}
          className="w-full sm:w-auto px-8 py-3 text-lg font-medium text-[#333333] bg-[#F1F1F1] rounded-lg hover:bg-[#E5E5E5] transition-colors duration-200"
        >
          Not Interested
        </button>
      </div>
    </div>
  );
};

export default PopupEnrollment; 