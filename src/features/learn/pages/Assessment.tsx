import React from "react";
import { useNavigate } from "react-router-dom";

const Assessment: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <button
              onClick={() => navigate("/")}
              className="flex items-center text-[#255C79] hover:text-[#1a4a5f] mb-2 sm:mb-0"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                ></path>
              </svg>
              Back to Home
            </button>
            <div className="text-left sm:text-center w-full sm:w-auto">
              <h1 className="text-base sm:text-lg font-semibold text-gray-800">
                Assessment Center
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Take assessments to earn scholarships and track your progress.
              </p>
            </div>
            <div className="w-full sm:w-auto"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-[#255C79] to-[#1a4a5f] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              AI-Linc Scholarship Assessment
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Test your knowledge and skills to earn scholarships for our
              premium courses. This assessment will evaluate your understanding
              of key concepts and determine your eligibility for scholarship
              benefits.
            </p>
          </div>

          {/* Assessment Details */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-[#255C79] mb-2">30</div>
              <div className="text-sm text-gray-600">Minutes Duration</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-[#255C79] mb-2">10</div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-[#255C79] mb-2">70%</div>
              <div className="text-sm text-gray-600">Max Scholarship</div>
            </div>
          </div>

          {/* Scholarship Tiers */}
          <div className="bg-gradient-to-r from-[#B8E6F0] to-[#E0F4F8] rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-[#255C79] mb-4 text-center">
              Scholarship Tiers
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#255C79]">80%+</div>
                <div className="text-sm text-[#255C79]">70% Scholarship</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#255C79]">60%+</div>
                <div className="text-sm text-[#255C79]">50% Scholarship</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#255C79]">40%+</div>
                <div className="text-sm text-[#255C79]">30% Scholarship</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#255C79]">&lt;40%</div>
                <div className="text-sm text-[#255C79]">No Scholarship</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/instruction-page")}
              className="bg-[#255C79] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#1a4a5f] transition-colors duration-200 flex items-center justify-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                ></path>
              </svg>
              Start Assessment
            </button>
            <button
              onClick={() => navigate("/courses")}
              className="border border-[#255C79] text-[#255C79] px-8 py-3 rounded-lg font-semibold hover:bg-[#255C79] hover:text-white transition-colors duration-200"
            >
              Browse Courses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assessment;
