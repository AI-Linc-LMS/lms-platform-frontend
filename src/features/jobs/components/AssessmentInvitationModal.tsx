import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Job } from '../types/jobs.types';
import { getAssessmentStatus } from '../../../services/assesment/assesmentApis'; // Adjust import path as needed

interface AssessmentInvitationModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
}

const AssessmentInvitationModal: React.FC<AssessmentInvitationModalProps> = ({ 
  job, 
  isOpen, 
  onClose 
}) => {
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const assessmentId = "ai-linc-scholarship-test-2"; // Hardcoded for now, can be dynamic later

  // Fetch assessment status
  const { 
    data: assessmentData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ["assessment-status", assessmentId],
    queryFn: () => getAssessmentStatus(clientId, assessmentId),
    enabled: isOpen, // Only fetch when modal is open
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
  });

  const handleTakeAssessment = () => {
    if (assessmentData?.status === "submitted") {
      // Navigate to results page
      navigate(`/roadmap/${assessmentId}`, { 
        state: { 
          job,
          fromJobApplication: true 
        } 
      });
    } else if (assessmentData?.status === "in_progress") {
      // Resume the assessment
      navigate(`/assessment/quiz`, { 
        state: { 
          assessmentId,
          job,
          fromJobApplication: true 
        } 
      });
    } else {
      // Start a new assessment
      navigate(`/assessment/ai-linc-scholarship-test-2`, { 
        state: { 
          job,
          fromJobApplication: true 
        } 
      });
    }
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#255C79]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error Loading Assessment</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#255C79] text-white rounded-lg hover:bg-[#1E4A63] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Content */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-[#E8F4F8] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-[#255C79]" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-[#343A40] mb-4">
            {assessmentData?.status === "submitted" 
              ? "Assessment Results Ready" 
              : assessmentData?.status === "in_progress"
              ? "Resume Your Assessment"
              : "Take the Eligibility Assessment"}
          </h2>
          
          <div className="text-[#6C757D] space-y-3 mb-6">
            {assessmentData?.status === "submitted" ? (
              <p>
                Your results for the <span className="font-semibold text-[#255C79]">{job.title}</span> position assessment are ready. 
                Click below to view your performance and next steps.
              </p>
            ) : assessmentData?.status === "in_progress" ? (
              <p>
                You have an ongoing assessment for the <span className="font-semibold text-[#255C79]">{job.title}</span> position. 
                Resume your assessment to complete it.
              </p>
            ) : (
              <p>
                To apply for the <span className="font-semibold text-[#255C79]">{job.title}</span> position, 
                you need to complete our eligibility assessment.
              </p>
            )}
            <div className="bg-gradient-to-r from-[#E8F4F8] to-[#F0F8FF] rounded-lg p-4 border-l-4 border-[#255C79]">
              <p className="text-[#255C79] font-medium">
                 Our hiring team will get in touch with you after reviewing your assessment results 
                to discuss the next steps in your application process.
              </p>
            </div>
          </div>

          <div className="bg-[#F8F9FA] rounded-lg p-4 mb-6 border border-[#DEE2E6]">
            <div className="flex items-center gap-3 mb-2">
              <div>
                <h3 className="font-semibold text-[#343A40]">{job.title}</h3>
                <p className="text-sm text-[#6C757D]">{job.company} • {job.location}</p>
              </div>
            </div>
            {job.salary && (
              <p className="text-sm text-green-600 font-medium">
                ₹{job.salary.min.toLocaleString()} - ₹{job.salary.max.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-[#6C757D] text-[#6C757D] rounded-lg hover:bg-[#6C757D] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleTakeAssessment}
            className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
              assessmentData?.status === "submitted"
                ? "bg-green-600 text-white hover:bg-green-700"
                : assessmentData?.status === "in_progress"
                ? "bg-yellow-600 text-white hover:bg-yellow-700"
                : "bg-[#255C79] text-white hover:bg-[#1E4A63]"
            }`}
          >
            {assessmentData?.status === "submitted"
              ? "View Results"
              : assessmentData?.status === "in_progress"
              ? "Resume Assessment"
              : "Take Assessment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentInvitationModal;