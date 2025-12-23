import React from "react";

interface CourseEnrollmentCTAProps {
  onEnroll: () => void;
  onDecline: () => void;
}

const CourseEnrollmentCTA: React.FC<CourseEnrollmentCTAProps> = ({
  onEnroll,
  onDecline,
}) => {
  return (
    <div className="w-full flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 p-4">
      <button
        onClick={onEnroll}
        className="w-full sm:w-[200px] px-6 py-3 text-lg font-medium text-white bg-[var(--success-500)] hover:bg-[#059669] rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
      >
        Enroll Now
      </button>
      <button
        onClick={onDecline}
        className="w-full sm:w-[200px] px-6 py-3 text-lg font-medium text-[var(--font-primary)] bg-[var(--neutral-100)] rounded-xl hover:bg-[var(--neutral-200)] border border-[var(--neutral-200)] transition-all duration-200 active:scale-[0.98]"
      >
        Not Interested
      </button>
    </div>
  );
};

export default CourseEnrollmentCTA;
