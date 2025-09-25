import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAssessmentStatus } from "../../../../services/assesment/assesmentApis";
import { useQuery } from "@tanstack/react-query";
import {
  addReferralCodeToUrl,
  getReferralCode,
} from "../../../../utils/referralUtils";

interface AssessmentBannerProps {
  assessmentId?: string;
  title?: string;
  description?: string;
}

const AssessmentBanner: React.FC<AssessmentBannerProps> = ({
  assessmentId = "ai-linc-scholarship-test-2",
  title = "Take the Free Placement Assessment",
  description = "Get added to the placement pool or get a scholarship to become eligible",
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = import.meta.env.VITE_CLIENT_ID;

  // Get referral code to preserve it during navigation
  const referralCode = getReferralCode(searchParams);

  const { data, isLoading, error } = useQuery({
    queryKey: ["assessment-banner", assessmentId],
    queryFn: () => getAssessmentStatus(clientId, assessmentId),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Data is always considered stale, so it will refetch
    gcTime: 0, // Don't cache the data
  });

  const handleTakeAssessment = async () => {
    try {
      const response = await fetch(
        `https://be-app.ailinc.com/assessment/api/client/${clientId}/assessment-details/${assessmentId}/`
      );
      const result = await response.json();

      if (result.status === "submitted") {
        const baseUrl = "/assessment/quiz";
        const urlWithReferral = addReferralCodeToUrl(baseUrl, referralCode);
        navigate(urlWithReferral, { state: { assessmentId } });
      } else {
        // Navigate to the specific assessment instruction page
        let baseUrl: string;
        if (assessmentId === "ai-linc-scholarship-test") {
          baseUrl = "/ai-linc-scholarship-test";
        } else {
          baseUrl = `/assessment/${assessmentId}`;
        }
        const urlWithReferral = addReferralCodeToUrl(baseUrl, referralCode);
        navigate(urlWithReferral);
      }
    } catch (error) {
      console.error("Error fetching assessment status:", error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="bg-gradient-to-r from-[#B8E6F0] to-[#E0F4F8] rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-center justify-between relative z-10">
        <div className="flex-1 mb-6 md:mb-0 md:pr-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--primary-500)] mb-3">
            {title}
          </h2>
          <p className="text-[var(--primary-500)] text-base md:text-lg font-medium">
            {description}
          </p>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={handleTakeAssessment}
            className={`${
              data?.status === "submitted"
                ? "bg-green-600"
                : data?.status === "in_progress"
                ? "bg-yellow-600"
                : "bg-[var(--primary-500)]"
            } text-[var(--font-light)] px-8 py-4 rounded-xl text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105`}
          >
            {data?.status === "submitted"
              ? "View Results"
              : data?.status === "in_progress"
              ? "Continue Assessment"
              : "Take an Assessment"}
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
