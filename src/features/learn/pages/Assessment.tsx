import React from 'react';
import { useNavigate } from 'react-router-dom';

const Assessment: React.FC = () => {
  const navigate = useNavigate();

  const handleStartAssessment = () => {
    navigate('/assessment/quiz');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Assessment Icon */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto bg-[#B8E6F0] rounded-full flex items-center justify-center">
            <svg 
              width="64" 
              height="64" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="text-[#255C79]"
            >
              <path 
                d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Title and Description */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          Take a pre-assessment that can help us to understand
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
          where you stand today and create a plan for you
        </h2>

        {/* Start Assessment Button */}
        <button
          onClick={handleStartAssessment}
          className="bg-[#255C79] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#1a4a5f] transition-colors duration-200 shadow-lg"
        >
          Start Assessment
        </button>

        {/* Additional Info */}
        <div className="mt-12 text-gray-600">
          <p className="text-sm">
            This assessment will take approximately 5-10 minutes to complete
          </p>
        </div>
      </div>
    </div>
  );
};

export default Assessment; 