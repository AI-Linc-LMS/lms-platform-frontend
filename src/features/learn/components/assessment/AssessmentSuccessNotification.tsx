import React, { useEffect, useState } from 'react';

interface AssessmentSuccessNotificationProps {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  onClose: () => void;
}

const AssessmentSuccessNotification: React.FC<AssessmentSuccessNotificationProps> = ({
  score,
  correctAnswers,
  totalQuestions,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setIsVisible(true);
    
    // Auto close after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 min-w-[280px] max-w-sm">
        <div className="flex items-start gap-3">
          {/* Green checkmark icon */}
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold text-gray-900">Assessment Completed</h4>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <p className="text-sm text-gray-600 leading-relaxed">
              You scored <span className="font-medium text-gray-900">{correctAnswers}</span> out of <span className="font-medium text-gray-900">{totalQuestions}</span> questions correctly
            </p>
            
            <div className="mt-2">
              <span className="text-2xl font-bold text-red-500">{score}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentSuccessNotification; 