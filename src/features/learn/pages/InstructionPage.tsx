import { useQuery } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getTranslatedAssessmentTitle, getTranslatedAssessmentDescription } from "../../../utils/assessmentTranslations";
import {
  getInstructions,
  AssessmentDetails,
} from "../../../services/assesment/assesmentApis";

import InstructionVector from "../../../../public/updated_illustrations.png";
import linkdln from "../../../../public/linkdln.png";
import certificate from "../../../../public/preview-certificate.png";
import score from "../../../../public/score-card.png";
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
    refetchOnWindowFocus: false, // Disabled to reduce unnecessary refetches
    refetchOnMount: false, // Only refetch if data is stale
    refetchOnReconnect: true, // Refetch on network reconnect
    staleTime: 1000 * 60 * 5, // 5 minutes - assessment instructions don't change frequently
    gcTime: 1000 * 60 * 10, // 10 minutes - keep in cache
    enabled: !!currentAssessmentId, // Only run query if we have an assessment ID
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
    // Navigate to phone verification and pass referral code through state
    navigate("/assessment/phone-verification", {
      state: {
        assessmentId: currentAssessmentId,
        referralCode: referralCode || null,
      },
    });
  };

  const handleResumeAssessment = () => {
    navigate("/assessment/quiz", {
      state: { assessmentId: currentAssessmentId },
    });
  };

  return (
    <div className="">
      <div className="">
        {/* Hero Section */}
        <div className="bg-white rounded-3xl w-full border border-gray-200 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-4 ">
            {/* Left - Image Section */}
            <div className=" ">
              <img
                src={InstructionVector}
                alt="Instruction Vector"
                className="w-full  object-contain"
              />
            </div>

            {/* Right - Info Section */}
            <div className=" flex flex-col justify-center ">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#2C5F7F] ">
                  {assessmentData?.title 
                    ? getTranslatedAssessmentTitle(assessmentData.title, t)
                    : t("assessments.kakatiyaAssessment.title")}
                </h2>
                <p className="text-gray-700  leading-relaxed">
                  {assessmentData?.instructions || assessmentData?.description
                    ? getTranslatedAssessmentDescription(
                        assessmentData?.title || "Kakatiya University Entrance Assessment",
                        assessmentData?.instructions || assessmentData?.description || "",
                        t
                      )
                    : t("assessments.kakatiyaAssessment.description")}
                </p>
              </div>

              <div className=" rounded-2xl  flex-1 flex flex-col justify-between">
                <div className="">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">📊</span>
                      <span className="font-medium">
                        {t("assessments.kakatiyaAssessment.details.totalQuestions")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">⏱️</span>
                      <span className="font-medium">
                        {t("assessments.kakatiyaAssessment.details.duration")}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      <span className="font-medium">{t("assessments.kakatiyaAssessment.details.topics")}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        t("assessments.kakatiyaAssessment.details.topicsList.aiFundamentals"),
                        t("assessments.kakatiyaAssessment.details.topicsList.javascript"),
                        t("assessments.kakatiyaAssessment.details.topicsList.react"),
                        t("assessments.kakatiyaAssessment.details.topicsList.nodejs"),
                        t("assessments.kakatiyaAssessment.details.topicsList.htmlCss"),
                        t("assessments.kakatiyaAssessment.details.topicsList.cloudDatabase"),
                        t("assessments.kakatiyaAssessment.details.topicsList.logicAptitude"),
                      ].map((topic) => (
                        <span
                          key={topic}
                          className="px-3 py-1 bg-[#EFF9FC] text-gray-700 rounded-full text-sm border border-[var(--primary-200)]"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <div className="flex flex-col lg:flex-row gap-3">
                    <button
                      onClick={() => {
                        const section = document.getElementById(
                          "whats-with-this-test"
                        );
                        if (section) {
                          section.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                            inline: "nearest",
                          });
                        }
                      }}
                      className="w-full py-3 px-6 border-2 border-[#2C5F7F] text-[#2C5F7F] rounded-xl font-medium hover:bg-[#2C5F7F] hover:text-[var(--font-light)] transition-all duration-700 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {t("assessments.kakatiyaAssessment.buttons.whyTakeTest")}
                    </button>

                    {assessmentData?.status === "submitted" ? (
                      <button
                        onClick={handleResumeAssessment}
                        className="w-full py-3 px-6 bg-green-600 text-[var(--font-light)] rounded-xl font-medium hover:bg-green-700 transition-colors"
                      >
                        {t("assessments.kakatiyaAssessment.buttons.viewResults")}
                      </button>
                    ) : assessmentData?.status === "in_progress" ? (
                      <button
                        onClick={handleResumeAssessment}
                        className="w-full py-3 px-6 bg-[#2C5F7F] text-[var(--font-light)] rounded-xl font-medium hover:bg-[#1a4a5f] transition-colors"
                      >
                        {t("assessments.kakatiyaAssessment.buttons.resumeTest")}
                      </button>
                    ) : (
                      <button
                        onClick={handleStartAssessment}
                        className="w-full py-3 px-6 bg-green-600 text-[var(--font-light)] rounded-xl font-medium hover:bg-green-700 transition-colors"
                      >
                        {t("assessments.kakatiyaAssessment.buttons.startAssessment")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Unlock These Perks Section */}
        <div className="my-16">
          <h2 className="text-3xl font-normal text-center text-[#2C5F7F] mb-12">
            {t("assessments.kakatiyaAssessment.sections.unlockPerks")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Certificate Card */}

            <div className="">
              <img src={linkdln} alt="LinkedIn" className="  object-contain" />
            </div>

            {/* </div> */}

            {/* LinkedIn Card */}
            <div className="">
              <img
                src={certificate}
                alt="LinkedIn"
                className="  object-contain"
              />
            </div>

            {/* Score Card */}
            <div className="">
              <img src={score} alt="LinkedIn" className="  object-contain" />
            </div>
          </div>
        </div>

        {/* What's With This Test Section */}
        <div id="whats-with-this-test" className="mb-16">
          <h2 className="text-3xl font-normal text-center text-[#2C5F7F] mb-12">
            {t("assessments.kakatiyaAssessment.sections.whatsWithTest")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Why this matters */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#DADADA]">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🔍</span>
                <h3 className="text-xl font-bold text-[#2C5F7F]">
                  {t("assessments.kakatiyaAssessment.sections.whyMatters")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {t("assessments.kakatiyaAssessment.sections.whyMattersText")}
              </p>
            </div>

            {/* What if you don't score high */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#DADADA]">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">❌</span>
                <h3 className="text-xl font-bold text-[#2C5F7F]">
                  {t("assessments.kakatiyaAssessment.sections.whatIfLowScore")}
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>{t("assessments.kakatiyaAssessment.sections.whatIfLowScoreText")}</strong>
              </p>
              <p className="text-gray-700 leading-relaxed">
                {t("assessments.kakatiyaAssessment.sections.personalizedPath")}
              </p>
            </div>

            {/* Your performance can unlock */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#DADADA]">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🚀</span>
                <h3 className="text-xl font-bold text-[#2C5F7F]">
                  {t("assessments.kakatiyaAssessment.sections.performanceUnlocks")}
                </h3>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-[#4A90A4] font-bold">🏢</span>
                  <span>{t("assessments.kakatiyaAssessment.sections.directAccess")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#4A90A4] font-bold">💡</span>
                  <span>
                    {t("assessments.kakatiyaAssessment.sections.personalizedFeedback")}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#4A90A4] font-bold">🎯</span>
                  <span>
                    {t("assessments.kakatiyaAssessment.sections.careerLaunchingProgram")}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Final Section - Test Details and Pricing */}
        <div className="bg-gray-50 rounded-3xl p-4 my-8 border border-gray-200 shadow-lg ">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            <div>
              <h2 className="text-3xl font-bold text-[#2C5F7F] mb-4">
                {t("assessments.kakatiyaAssessment.sections.postBootcampTitle")}
                <br />
                {t("assessments.kakatiyaAssessment.sections.pathForwardStarts")}
              </h2>
              {/* <p className="text-gray-600 max-w-md">
                Take this test to showcase your learning and get personalized career guidance.
              </p> */}
            </div>

            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="flex items-baseline gap-2"></div>
              </div>

              {assessmentData?.status === "submitted" ? (
                <button
                  onClick={handleResumeAssessment}
                  className="px-8 py-4 bg-green-600 text-[var(--font-light)] rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors"
                >
                  {t("assessments.kakatiyaAssessment.buttons.viewResults")}
                </button>
              ) : assessmentData?.status === "in_progress" ? (
                <button
                  onClick={handleResumeAssessment}
                  className="px-8 py-4 bg-[#2C5F7F] text-[var(--font-light)] rounded-xl font-semibold text-lg hover:bg-[#1a4a5f] transition-colors"
                >
                  {t("assessments.kakatiyaAssessment.buttons.resumeTest")}
                </button>
              ) : (
                <button
                  onClick={handleStartAssessment}
                  className="px-8 py-4 bg-green-600 text-[var(--font-light)] rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors"
                >
                  {t("assessments.kakatiyaAssessment.buttons.startAssessment")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionPage;
