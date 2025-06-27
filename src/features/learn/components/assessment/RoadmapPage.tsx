import React, { useRef, useState } from "react";
import ailincimg from "../../../../assets/dashboard_assets/toplogoimg.png";
import popper from "../../../../assets/dashboard_assets/poppers.png";
import roadmap from "../../../../assets/roadmap/roadmap.png";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import CertificateTemplates from "../../../../components/certificate/CertificateTemplates";
import ProgramCard from "./roadmap/ProgramCard";
import MentorFeedbackSection from "./roadmap/MentorFeedback";
import PerformanceReport from "./roadmap/PerformanceReport";
import { useSelector } from "react-redux";

// Import types
import {
  CertificateTemplatesRef,
  UserState,
  ScholarshipRedemptionData,
} from "./types/assessmentTypes";

// Import utilities
import {
  transformToPerformanceReportData,
  transformToAccuracyBarData,
  transformToRatingBarData,
  transformToSkillsData,
  getMentorFeedback,
  getScoreArcData,
} from "./utils/assessmentUtils";

// Import chart components
import {
  AccuracyBarChart,
  RatingBars,
  ScoreArc,
  SkillsSection,
} from "./components/ChartComponents";

// Import fallback data
import { certificateFallbackData } from "./data/assessmentData";
import { redeemScholarship } from "../../../../services/assesment/assesmentApis";

const RoadmapPage = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  console.log("assessmentId", assessmentId);
  const clientId = parseInt(import.meta.env.VITE_CLIENT_ID) || 1;
  const [isDownloading, setIsDownloading] = useState(false);

  const certificateRef = useRef<CertificateTemplatesRef>(null);

  const { data: redeemData } = useQuery({
    queryKey: ["assessment-results", clientId, assessmentId],
    queryFn: () =>
      assessmentId
        ? redeemScholarship(clientId, "ai-linc-scholarship-test-2")
        : Promise.reject(new Error("No assessment ID")),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
    enabled: !!clientId && !!assessmentId,
  });

  const handleDownloadCertificate = async () => {
    setIsDownloading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (certificateRef.current) {
        console.log("Certificate ref found, downloading...");
        await certificateRef.current.downloadPDF();
      } else {
        console.error("Certificate ref not found after waiting");
      }
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Get user data and stats
  const user = useSelector((state: { user: UserState }) => state.user);
  const stats = redeemData?.stats;

  // Certificate data for the assessment
  const certificateData = {
    ...certificateFallbackData,
    studentName: user?.full_name || certificateFallbackData.studentName,
    studentEmail: user?.email || certificateFallbackData.studentEmail,
    score: stats?.accuracy_percent || certificateFallbackData.score,
  };

  console.log("redeemData", redeemData);

  // Transform data using utilities
  const perfReportData = transformToPerformanceReportData(stats);
  const accuracyBarData = transformToAccuracyBarData(stats);
  const ratingBarData = transformToRatingBarData(stats);
  const { shineSkills, attentionSkills } = transformToSkillsData(stats);
  const mentorFeedback = getMentorFeedback(stats);
  const { score, max } = getScoreArcData(stats);

  return (
    <div className="mb-8 sm:mb-12 lg:mb-30">
      {/* Header */}
      <div className="flex flex-row items-center justify-center relative z-10 mb-6 sm:mb-8 lg:mb-10">
        <img
          src={ailincimg}
          alt="Ai Linc"
          className="w-6 h-6 sm:w-8 sm:h-8 mr-2"
        />
        <p className="font-bold text-center text-[#264D64] text-lg sm:text-xl lg:text-2xl">
          Ai Linc
        </p>
      </div>

      {/* Main Container */}
      <div className="relative bg-white rounded-2xl sm:rounded-3xl pb-6 sm:pb-8 lg:pb-10 px-3 sm:px-4 overflow-hidden border border-gray-200 shadow-xl lg:mx-15">
        {/* Top Section with Poppers */}
        <div className="bg-gradient-to-r from-white via-green-100 to-white pb-6 sm:pb-8 lg:pb-10">
          {/* Poppers - Hidden on mobile, visible on larger screens */}
          <img
            src={popper}
            alt="Confetti Left"
            className="hidden lg:block absolute -top-14 left-35 w-52 h-52 object-contain pointer-events-none select-none transform -rotate-42"
            style={{ zIndex: 1 }}
          />
          <img
            src={popper}
            alt="Confetti Right"
            className="hidden lg:block absolute -top-10 right-30 w-52 h-52 object-contain pointer-events-none select-none transform rotate-32"
            style={{ zIndex: 1 }}
          />

          {/* Mobile Poppers - Smaller and positioned differently */}
          <img
            src={popper}
            alt="Confetti Left Mobile"
            className="lg:hidden absolute -top-8 left-4 w-24 h-24 sm:w-32 sm:h-32 object-contain pointer-events-none select-none transform -rotate-42 opacity-60"
            style={{ zIndex: 1 }}
          />
          <img
            src={popper}
            alt="Confetti Right Mobile"
            className="lg:hidden absolute -top-6 right-4 w-24 h-24 sm:w-32 sm:h-32 object-contain pointer-events-none select-none transform rotate-32 opacity-60"
            style={{ zIndex: 1 }}
          />

          {/* Content */}
          <div className="flex flex-col items-center justify-center relative z-10 px-2 sm:px-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-[#264D64] mb-2 mt-6 sm:mt-8 lg:mt-10 font-serif text-center">
              Congratulations
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-black text-center max-w-md mb-4 sm:mb-6 font-sans px-2">
              Your performance in the assessment has qualified you for an
              exclusive opportunity.
            </p>
            <button
              onClick={handleDownloadCertificate}
              className="flex items-center gap-2 bg-[#14212B] text-white font-semibold px-6 sm:px-8 py-2 sm:py-3 rounded-lg shadow hover:bg-[#223344] transition-colors duration-200 focus:outline-none text-sm sm:text-base"
            >
              {isDownloading ? "Downloading..." : "Download Certificate"}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 sm:w-5 sm:h-5 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-[inset_0_4px_8px_rgba(0,0,0,0.1)] shadow-gray-300 border border-gray-300 ring-1 ring-white/40 py-4 sm:py-5 w-full mx-auto">
          {/* Performance Report Section */}
          <PerformanceReport data={perfReportData} />

          <div className="flex flex-col lg:flex-row mt-6 sm:mt-8 lg:mt-10 w-full min-h-[200px] sm:min-h-[222px] justify-evenly items-center gap-4 sm:gap-6 lg:gap-0">
            <AccuracyBarChart data={accuracyBarData} />
            <ScoreArc score={score} max={max} />
            <RatingBars data={ratingBarData} />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-300 my-6 sm:my-8 lg:my-10 mx-4 sm:mx-6 lg:mx-7"></div>

          {/* Skills Section */}
          <SkillsSection
            shineSkills={shineSkills}
            attentionSkills={attentionSkills}
          />

          {/* Divider */}
          <div className="border-t border-gray-300 my-6 sm:my-8 lg:my-10 mx-4 sm:mx-6 lg:mx-7"></div>

          {/* Mentor Feedback Section */}
          <MentorFeedbackSection
            didWell={mentorFeedback.didWell}
            couldDoBetter={mentorFeedback.couldDoBetter}
            suggestions={mentorFeedback.suggestions}
          />

          {/* Divider */}
          <div className="border-t border-gray-300 mt-6 sm:mt-8 lg:mt-10 mx-4 sm:mx-6 lg:mx-7"></div>

          {/* Growth Roadmap */}
          <h2 className="text-xl sm:text-2xl font-bold text-[#222] mx-4 sm:mx-6 lg:mx-10 my-6 sm:my-8 lg:my-10">
            Growth Roadmap
          </h2>
          <div className="flex flex-col items-center justify-center mb-6 sm:mb-8 lg:mb-10 w-full px-2 sm:px-4">
            <img
              src={roadmap}
              alt="Roadmap"
              className="w-full sm:w-[90%] lg:w-[75%] max-w-5xl h-auto"
            />
          </div>
        </div>

        {/* Upskilling Roadmap Section */}
        <UpskillingRoadmapSection />

        {/* Nanodegree Program Card */}
        <ProgramCard
          redeemData={redeemData as ScholarshipRedemptionData}
          clientId={clientId}
          assessmentId={assessmentId ?? "ai-linc-scholarship-test-2"}
        />
      </div>

      {/* Hidden Certificate Component */}
      <div className="hidden">
        <CertificateTemplates
          ref={certificateRef}
          certificate={certificateData}
        />
      </div>
    </div>
  );
};

export default RoadmapPage;

// --- UpskillingRoadmapSection ---
const UpskillingRoadmapSection: React.FC = () => (
  <div className="w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#f8fcfc] to-white mt-6 sm:mt-8 lg:mt-10 px-4 sm:px-6 lg:px-0">
    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#264D64] text-center mb-3 sm:mb-4 leading-tight px-2">
      Upskilling Roadmap After Your
      <br className="hidden sm:block" />
      Assessment Report
    </h2>
    <p className="text-sm sm:text-base lg:text-lg text-gray-700 text-center max-w-2xl mx-auto px-4 sm:px-6">
      Choose the right program that best fits whether you're looking to master
      tech foundations or accelerate your career into top-tier companies.
    </p>

    <div className="border-t border-gray-300 mt-6 sm:mt-8 lg:mt-10 mx-4 sm:mx-6 lg:mx-7 w-full"></div>
  </div>
);
