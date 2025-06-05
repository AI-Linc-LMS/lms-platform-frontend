import React from 'react';
import { useNavigate } from 'react-router-dom';

const AccessDenied: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FA]">
      <div className="text-center max-w-md mb-8">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-bold text-[#1A5A7A] mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. This area is restricted to administrators and instructors only.
        </p>
        <button
          onClick={handleGoHome}
          className="px-6 py-3 bg-[#255C79] rounded-xl text-white hover:bg-[#1E4A63] transition-all duration-300 shadow-lg hover:shadow-[#1A5A7A]/30 flex items-center justify-center hover:scale-95 font-medium mx-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default AccessDenied; 