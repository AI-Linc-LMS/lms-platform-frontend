import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Job } from '../types/jobs.types';

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

  const handleTakeAssessment = () => {
    // Navigate to the assessment page with job context
    navigate(`/assessment/ai-linc-scholarship-test-2`, { 
      state: { 
        job,
        fromJobApplication: true 
      } 
    });
  };

  if (!isOpen) return null;

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
            Take the Eligibility Assessment
          </h2>
          
          <div className="text-[#6C757D] space-y-3 mb-6">
            <p>
              To apply for the <span className="font-semibold text-[#255C79]">{job.title}</span> position, 
              you need to complete our eligibility assessment.
            </p>
            <p>
              This assessment will help us understand your skills and match you 
              with the right opportunities.
            </p>
          </div>

          <div className="bg-[#F8F9FA] rounded-lg p-4 mb-6 border border-[#DEE2E6]">
            <div className="flex items-center gap-3 mb-2">
              {/* <img 
                src={job.companyLogo} 
                alt={job.company} 
                className="w-10 h-10 rounded-lg"
              /> */}
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

          <div className="space-y-3 text-sm text-[#6C757D] mb-6">
            <div className="flex items-center gap-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-[#255C79]" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span>30-minute online assessment</span>
            </div>
            <div className="flex items-center gap-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-[#255C79]" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span>Evaluate your skills for the role</span>
            </div>
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
            className="flex-1 px-4 py-3 bg-[#255C79] text-white rounded-lg hover:bg-[#1E4A63] transition-colors"
          >
            Take Assessment
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentInvitationModal; 