import React from 'react';

interface CourseEnrollmentCTAProps {
  onEnroll: () => void;
  onDecline: () => void;
}

const CourseEnrollmentCTA: React.FC<CourseEnrollmentCTAProps> = ({ 
  onEnroll, 
  onDecline 
}) => {
  return (
    <div className="w-full flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 p-4">
      <button
        onClick={onEnroll}
        className="w-full sm:w-[200px] px-6 py-3 text-lg font-medium text-white bg-[#1F4F68] rounded-xl hover:bg-[#163a4f] transition-colors duration-200"
      >
        Enroll Now
      </button>
      <button
        onClick={onDecline}
        className="w-full sm:w-[200px] px-6 py-3 text-lg font-medium text-[#333333] bg-[#e9e9e9] rounded-xl hover:bg-[#d8d8d8] transition-colors duration-200"
      >
        Not Interested
      </button>
    </div>
  );
};

export default CourseEnrollmentCTA; 