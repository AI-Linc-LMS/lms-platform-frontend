import React, { useRef, useState } from "react";
import ailincimg from "../../../../assets/dashboard_assets/toplogoimg.png";
import popper from "../../../../assets/dashboard_assets/poppers.png";
import roadmap from "../../../../assets/roadmap/roadmap.png";
import { redeemScholarship } from "../../../../services/assesment/assesmentApis";
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
    <div className="mb-30">
      <div className="flex flex-row items-center justify-center relative z-10 mb-10">
        <img src={ailincimg} alt="Ai Linc" className="w-8 h-8 mr-2" />
        <p className="font-bold text-center text-[#264D64] text-2xl">Ai Linc</p>
      </div>
      <div className="relative bg-white rounded-3xl pb-10 px-4 overflow-hidden border-1 border-gray-200 shadow-xl lg:mx-15">
        {/* Top-left poppers */}
        <div className="bg-gradient-to-r from-white via-green-100 to-white pb-10">
          <img
            src={popper}
            alt="Confetti Left"
            className="absolute -top-14 left-35 w-52 h-52 object-contain pointer-events-none select-none transform -rotate-42"
            style={{ zIndex: 1 }}
          />
          {/* Top-right poppers */}
          <img
            src={popper}
            alt="Confetti Right"
            className="absolute -top-10 right-30 w-52 h-52  object-contain pointer-events-none select-none transform rotate-32"
            style={{ zIndex: 1 }}
          />

          <div className="flex flex-col items-center justify-center relative z-10">
            <h1 className="text-6xl font-light text-[#264D64] mb-2 mt-10 font-serif">
              Congratulations
            </h1>
            <p className="text-lg text-black text-center max-w-md mb-6 font-sans">
              Your performance in the assessment has qualified you for an
              exclusive opportunity.
            </p>
            <button
              onClick={handleDownloadCertificate}
              className="flex items-center gap-2 bg-[#14212B] text-white font-semibold px-8 py-3 rounded-lg shadow hover:bg-[#223344] transition-colors duration-200 focus:outline-none"
            >
              {isDownloading ? "Downloading..." : "Download Certificate"}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 ml-1"
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

        <div className="bg-white rounded-2xl shadow-[inset_0_4px_8px_rgba(0,0,0,0.1)] shadow-gray-300 border border-gray-300 ring-1 ring-white/40 py-5 w-full mx-auto">
          {/* Performance Report Section */}
          <PerformanceReport data={perfReportData} />
          {/* New Stats Row */}
          <div className="flex flex-col md:flex-row mt-10 w-full h-[222px] justify-evenly items-center">
            <AccuracyBarChart data={accuracyBarData} />
            <ScoreArc score={score} max={max} />
            <RatingBars data={ratingBarData} />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-300 my-10 mx-7"></div>

          {/* Skills Section */}
          <SkillsSection
            shineSkills={shineSkills}
            attentionSkills={attentionSkills}
          />
          {/* Divider */}
          <div className="border-t border-gray-300 my-10 mx-7"></div>
          {/* Mentor Feedback Section */}
          <MentorFeedbackSection
            didWell={mentorFeedback.didWell}
            couldDoBetter={mentorFeedback.couldDoBetter}
            suggestions={mentorFeedback.suggestions}
          />
          {/* Divider */}
          <div className="border-t border-gray-300 mt-10 mx-7"></div>
          <h2 className="text-2xl font-bold text-[#222] mx-10 my-10">
            Growth Roadmap
          </h2>
          <div className="flex flex-col items-center justify-center mb-10 w-full">
            <img
              src={roadmap}
              alt="Roadmap"
              className="w-[75%] max-w-5xl h-auto"
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
  <div className="w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#f8fcfc] to-white mt-10">
    <h2 className="text-4xl md:text-5xl font-bold text-[#264D64] text-center mb-4 leading-tight">
      Upskilling Roadmap After Your
      <br />
      Assessment Report
    </h2>
    <p className="text-lg text-gray-700 text-center max-w-2xl mx-auto">
      Choose the right program that best fits whether you're looking to master
      tech foundations or accelerate your career into top-tier companies.
    </p>

    <div className="border-t border-gray-300 mt-10 mx-7"></div>
  </div>
);
