import React from 'react';
import { useNavigate } from 'react-router-dom';

const AssessmentBanner: React.FC = () => {
  const navigate = useNavigate();

  const handleTakeAssessment = () => {
    navigate('/assessment');
  };

  return (
    <div className="bg-gradient-to-r from-[#B8E6F0] to-[#E0F4F8] rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-center justify-between relative z-10">
        <div className="flex-1 mb-6 md:mb-0 md:pr-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#255C79] mb-3">
            Get a Scholarship of Up-to 70%
          </h2>
          <p className="text-[#255C79] text-base md:text-lg font-medium">
            Take a short assessment and check eligibility
          </p>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={handleTakeAssessment}
            className="bg-[#255C79] text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-[#1a4a5f] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Take an Assessment
          </button>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16"></div>
      <div className="absolute top-1/2 right-1/4 w-6 h-6 bg-white/20 rounded-full"></div>
      <div className="absolute bottom-1/4 left-1/3 w-4 h-4 bg-white/20 rounded-full"></div>
    </div>
  );
};

export default AssessmentBanner; 