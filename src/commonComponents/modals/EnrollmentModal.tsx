import React from 'react';
import CourseEnrollmentCTA from '../enrollment-buttons/CourseEnrollmentCTA';

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  courseDescription: string;
  onEnroll: () => void;
  onDecline: () => void;
}

const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
  isOpen,
  onClose,
  courseTitle,
  courseDescription,
  onEnroll,
  onDecline,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        {/* Modal content */}
        <div className="px-6 pt-8 pb-4">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-4">{courseTitle}</h2>
          <p className="text-gray-700 mb-6 text-center">{courseDescription}</p>
        </div>

        {/* Action buttons */}
        <CourseEnrollmentCTA onEnroll={onEnroll} onDecline={onDecline} />
      </div>
    </div>
  );
};

export default EnrollmentModal; 