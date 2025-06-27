import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getAllAssessments, AssessmentListItem } from "../../../services/assesment/assesmentApis";
import { FiClock, FiDollarSign, FiCheckCircle, FiPlayCircle } from "react-icons/fi";

const AssessmentsList: React.FC = () => {
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_CLIENT_ID;

  const { data: assessments, isLoading, error } = useQuery<AssessmentListItem[]>({
    queryKey: ["assessments-list", clientId],
    queryFn: () => getAllAssessments(clientId),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const handleStartAssessment = (assessmentSlug: string) => {
    navigate(`/assessment/${assessmentSlug}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#255C79]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="bg-white rounded-3xl p-6 shadow-sm max-w-md mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#343A40] mb-2">Error Loading Assessments</h2>
            <p className="text-[#6C757D] mb-4">{error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#255C79] text-white px-6 py-2 rounded-xl font-medium hover:bg-[#1a4a5f] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#2C5F7F] mb-4">
            Available Assessments
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose from our range of assessments to test your skills and knowledge. 
            Each assessment is designed to evaluate different aspects of your expertise.
          </p>
        </div>

        {/* Assessments Grid */}
        {assessments && assessments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {assessments.map((assessment) => (
              <div
                key={assessment.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300"
              >
                {/* Assessment Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-[#2C5F7F] mb-2">
                    {assessment.title}
                  </h3>
                  {assessment.description && (
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {assessment.description}
                    </p>
                  )}
                </div>

                {/* Assessment Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-gray-700">
                    <FiClock className="h-4 w-4 text-[#2C5F7F]" />
                    <span className="text-sm">
                      Duration: {assessment.duration_minutes} minutes
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-700">
                    {assessment.is_paid ? (
                      <>
                        <FiDollarSign className="h-4 w-4 text-[#2C5F7F]" />
                        <span className="text-sm">
                          Price: ₹{parseFloat(assessment.price).toFixed(0)}
                        </span>
                      </>
                    ) : (
                      <>
                        <FiCheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">
                          Free Assessment
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${assessment.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-xs font-medium ${assessment.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {assessment.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Price Badge */}
                {assessment.is_paid && (
                  <div className="mb-4">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#EFF9FC] text-[#2C5F7F] border border-[#80C9E0]">
                      ₹{parseFloat(assessment.price).toFixed(0)}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleStartAssessment(assessment.slug)}
                  disabled={!assessment.is_active}
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                    assessment.is_active
                      ? assessment.is_paid
                        ? 'bg-[#2C5F7F] text-white hover:bg-[#1a4a5f]'
                        : 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <FiPlayCircle className="h-4 w-4" />
                  {assessment.is_active
                    ? assessment.is_paid
                      ? 'Start Paid Assessment'
                      : 'Start Free Assessment'
                    : 'Currently Unavailable'
                  }
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Assessments Available
            </h3>
            <p className="text-gray-600">
              There are currently no assessments available. Please check back later.
            </p>
          </div>
        )}

        {/* Back to Courses Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate("/courses")}
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#2C5F7F] text-[#2C5F7F] rounded-xl font-medium hover:bg-[#2C5F7F] hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to Courses
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentsList; 