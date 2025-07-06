import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getAllAssessments,
  AssessmentListItem,
} from "../../../services/assesment/assesmentApis";
import {
  FiClock,
  FiCheckCircle,
  FiPlayCircle,
  FiAward,
  FiUsers,
  FiTrendingUp,
  FiArrowLeft,
} from "react-icons/fi";
import { addReferralCodeToUrl, getReferralCode } from "../../../utils/referralUtils";

const AssessmentsList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = import.meta.env.VITE_CLIENT_ID;

  // Get referral code to preserve it during navigation
  const referralCode = getReferralCode(searchParams);

  const {
    data: assessments,
    isLoading,
    error,
  } = useQuery<AssessmentListItem[]>({
    queryKey: ["assessments-list", clientId],
    queryFn: () => getAllAssessments(clientId),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const handleStartAssessment = (assessmentSlug: string) => {
    const baseUrl = `/assessment/${assessmentSlug}`;
    const urlWithReferral = addReferralCodeToUrl(baseUrl, referralCode);
    navigate(urlWithReferral);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EFF9FC] to-[#E0F4F8] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#80C9E0] border-t-[#255C79] mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-[#255C79] animate-pulse mx-auto"></div>
          </div>
          <p className="mt-4 text-[#255C79] font-medium">
            Loading assessments...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EFF9FC] to-[#E0F4F8] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md mx-auto border border-red-100">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg
                className="w-10 h-10 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                ></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {error.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-[#255C79] to-[#2C5F7F] text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EFF9FC] to-[#E0F4F8]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#255C79]/5 to-[#2C5F7F]/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          {/* Back Button */}
          <button
            onClick={() => navigate("/courses")}
            className="inline-flex items-center gap-2 mb-8 px-4 py-2 text-[#255C79] hover:text-[#2C5F7F] transition-colors group"
          >
            <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Courses</span>
          </button>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-[#80C9E0]/30 mb-6">
              <FiAward className="w-4 h-4 text-[#255C79]" />
              <span className="text-sm font-medium text-[#255C79]">
                Skill Assessment Center
              </span>
            </div>

            <h1 className="text-5xl font-bold bg-gradient-to-r from-[#255C79] to-[#2C5F7F] bg-clip-text text-transparent mb-6">
              Test Your Expertise
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover your strengths and areas for improvement with our
              comprehensive assessments designed to help you grow and succeed.
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FiUsers className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-800 mb-1">10,000+</h3>
                <p className="text-sm text-gray-600">Assessments Taken</p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FiTrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-800 mb-1">95%</h3>
                <p className="text-sm text-gray-600">Success Rate</p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FiAward className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-800 mb-1">500+</h3>
                <p className="text-sm text-gray-600">Certificates Issued</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assessments Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {assessments && assessments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {assessments.map((assessment, index) => (
              <div
                key={assessment.id}
                className="group relative bg-white rounded-3xl shadow-lg border border-gray-100 p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: "fadeInUp 0.6s ease-out forwards",
                }}
              >
                {/* Gradient Overlay */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#255C79] to-[#2C5F7F]"></div>

                {/* Status Badge - Repositioned to avoid overlap */}
                <div className="flex justify-end mb-4">
                  <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                      assessment.is_active
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        assessment.is_active ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    {assessment.is_active ? "Active" : "Inactive"}
                  </div>
                </div>

                {/* Assessment Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-[#255C79] transition-colors">
                    {assessment.title}
                  </h3>
                  {assessment.description && (
                    <p className="text-gray-600 leading-relaxed line-clamp-3">
                      {assessment.description}
                    </p>
                  )}
                </div>

                {/* Assessment Details */}
                <div className="space-y-4 mb-8 flex-1 min-h-[170px]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <FiClock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-semibold text-gray-800">
                        {assessment.duration_minutes} minutes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                      <FiCheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-semibold text-green-600">Available</p>
                    </div>
                  </div>
                </div>

                {/* Action Button at the bottom */}
                <div className="mt-auto">
                  <button
                    onClick={() => handleStartAssessment(assessment.slug)}
                    disabled={!assessment.is_active}
                    className={`w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 text-lg ${
                      assessment.is_active
                        ? "bg-gradient-to-r from-[#255C79] to-[#2C5F7F] text-white hover:shadow-xl hover:shadow-[#255C79]/25 transform hover:scale-105"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <FiPlayCircle className="h-5 w-5" />
                    {assessment.is_active
                      ? "Start Assessment"
                      : "Currently Unavailable"}
                  </button>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-[#255C79]/5 to-[#2C5F7F]/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-32 h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <svg
                  className="w-16 h-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  ></path>
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-4">
                No Assessments Available
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                We're working on bringing you amazing assessments. Check back
                soon for new opportunities to test your skills!
              </p>
              <button
                onClick={() => navigate("/courses")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#255C79] to-[#2C5F7F] text-white rounded-2xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Explore Courses Instead
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Add custom CSS for animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AssessmentsList;
