import { useQuery, useMutation } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getTranslatedAssessmentTitle,
  getTranslatedAssessmentDescription,
} from "../../../utils/assessmentTranslations";
import {
  getInstructions,
  startAssessment,
  AssessmentDetails,
} from "../../../services/assesment/assesmentApis";
import { getReferralCode } from "../../../utils/referralUtils";

const InstructionPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { assessmentId, ref } = useParams<{
    assessmentId: string;
    ref?: string;
  }>();
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const [searchParams] = useSearchParams();

  // Get referral code from URL path parameter first, then from search params as fallback
  const referralCode = ref || getReferralCode(searchParams);

  // Use assessment ID from URL params or redirect to assessments list
  const currentAssessmentId = assessmentId;

  // If no assessment ID is provided, redirect to assessments list
  useEffect(() => {
    if (!currentAssessmentId) {
      navigate("/assessments");
      return;
    }
  }, [currentAssessmentId, navigate]);

  const {
    data: assessmentData,
    isLoading,
    error,
  } = useQuery<AssessmentDetails>({
    queryKey: ["assessment-instructions", currentAssessmentId],
    queryFn: () =>
      currentAssessmentId
        ? getInstructions(clientId, currentAssessmentId)
        : Promise.reject(new Error("No assessment ID")),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    enabled: !!currentAssessmentId,
  });

  const startAssessmentMutation = useMutation({
    mutationFn: () =>
      startAssessment(
        clientId,
        currentAssessmentId!,
        undefined,
        referralCode || undefined
      ),
    onSuccess: () => {
      navigate("/assessment/quiz", {
        state: { assessmentId: currentAssessmentId },
      });
    },
    onError: () => {
      alert("Failed to start assessment. Please try again.");
    },
  });

  // Early return if no assessment ID - component will redirect
  if (!currentAssessmentId) {
    return (
      <div className="min-h-screen bg-[var(--neutral-50)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-500)]"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--neutral-50)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-500)]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--neutral-50)] flex items-center justify-center">
        <div className="bg-white rounded-3xl p-6 shadow-sm max-w-md mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--neutral-500)] mb-2">
              Error Loading Assessment
            </h2>
            <p className="text-[var(--neutral-300)] mb-4">{error.message}</p>
            <button
              onClick={() => navigate("/assessments")}
              className="bg-[var(--primary-500)] text-[var(--font-light)] px-6 py-2 rounded-xl font-medium hover:bg-[#1a4a5f] transition-colors"
            >
              View All Assessments
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleStartAssessment = () => {
    if (currentAssessmentId) {
      startAssessmentMutation.mutate();
    }
  };

  const handleResumeAssessment = () => {
    navigate("/assessment/quiz", {
      state: { assessmentId: currentAssessmentId },
    });
  };

  return (
    <div className="min-h-screen bg-[var(--neutral-50)] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl w-full border border-gray-200 shadow-lg p-6 lg:p-8">
          <div className="flex flex-col justify-center">
            <div className="mb-6">
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--primary-500)] mb-4">
                {assessmentData?.title
                  ? getTranslatedAssessmentTitle(assessmentData.title, t)
                  : t("assessments.kakatiyaAssessment.title")}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {assessmentData?.instructions || assessmentData?.description
                  ? getTranslatedAssessmentDescription(
                      assessmentData?.title ||
                        "Kakatiya University Entrance Assessment",
                      assessmentData?.instructions ||
                        assessmentData?.description ||
                        "",
                      t
                    )
                  : t("assessments.kakatiyaAssessment.description")}
              </p>
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span className="font-medium">
                    {t("assessments.kakatiyaAssessment.details.totalQuestions")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">
                    {t("assessments.kakatiyaAssessment.details.duration")}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">
                      {t("assessments.kakatiyaAssessment.details.topics")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      t(
                        "assessments.kakatiyaAssessment.details.topicsList.aiFundamentals"
                      ),
                      t(
                        "assessments.kakatiyaAssessment.details.topicsList.javascript"
                      ),
                      t(
                        "assessments.kakatiyaAssessment.details.topicsList.react"
                      ),
                      t(
                        "assessments.kakatiyaAssessment.details.topicsList.nodejs"
                      ),
                      t(
                        "assessments.kakatiyaAssessment.details.topicsList.htmlCss"
                      ),
                      t(
                        "assessments.kakatiyaAssessment.details.topicsList.cloudDatabase"
                      ),
                      t(
                        "assessments.kakatiyaAssessment.details.topicsList.logicAptitude"
                      ),
                    ].map((topic) => (
                      <span
                        key={topic}
                        className="px-3 py-1 bg-[var(--primary-50)] text-gray-700 rounded-full text-sm border border-[var(--primary-200)]"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <div className="flex flex-col lg:flex-row gap-3">
                  {assessmentData?.status === "submitted" ? (
                    <button
                      onClick={handleResumeAssessment}
                      className="w-full py-3 px-6 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                    >
                      {t("assessments.kakatiyaAssessment.buttons.viewResults")}
                    </button>
                  ) : assessmentData?.status === "in_progress" ? (
                    <button
                      onClick={handleResumeAssessment}
                      className="w-full py-3 px-6 bg-[var(--primary-500)] text-white rounded-xl font-medium hover:bg-[#1a4a5f] transition-colors"
                    >
                      {t("assessments.kakatiyaAssessment.buttons.resumeTest")}
                    </button>
                  ) : (
                    <button
                      onClick={handleStartAssessment}
                      disabled={startAssessmentMutation.isPending}
                      className="w-full py-3 px-6 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {startAssessmentMutation.isPending
                        ? "Starting..."
                        : t(
                            "assessments.kakatiyaAssessment.buttons.startAssessment"
                          )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionPage;
