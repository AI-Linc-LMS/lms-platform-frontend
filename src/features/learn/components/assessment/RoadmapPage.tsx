import React, { JSX, useRef, useState } from "react";
import ailincimg from "../../../../assets/dashboard_assets/toplogoimg.png";
import popper from "../../../../assets/dashboard_assets/poppers.png";
import roadmap from "../../../../assets/roadmap/roadmap.png";
import cube from "../../../../assets/roadmap/rectangle.png";
import triangle from "../../../../assets/roadmap/triangle.png";
import { redeemScholarship } from "../../../../services/assesment/assesmentApis";
import { useQuery } from "@tanstack/react-query";
import {
  useNanodegreePayment,
  useFlagshipPayment,
} from "../../../../hooks/useRazorpayPayment";
import { useSelector } from "react-redux";
import { PaymentResult } from "../../../../services/payment/razorpayService";
import { useParams } from "react-router-dom";
import CertificateTemplates from "../../../../components/certificate/CertificateTemplates";

export interface CertificateTemplatesRef {
  downloadPDF: () => Promise<void>;
  isDownloading: boolean;
}

type Metric = {
  label: string;
  value: number;
  unit: string;
  color: string;
  icon: JSX.Element;
};

type PerformanceReportProps = {
  data: Metric[];
};

const PerformanceReport = ({ data }: PerformanceReportProps) => {
  return (
    <div>
      <div className="flex flex-col items-center mb-4">
        <span className="text-black text-lg font-semibold mb-1">
          ✨ AI Generated ✨
        </span>
        <h2 className="text-3xl md:text-4xl font-semibold text-[#264D64] text-center mb-8">
          AILINC Student Performance Report
        </h2>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0">
        {data.map((metric: Metric, idx: number) => {
          const isPlacementReadiness = metric.label === "Placement Readiness";
          return (
            <div
              key={metric.label}
              className={`flex flex-col items-center flex-1 min-w-[200px] ${
                idx === 1 ? "border-l border-gray-200 border-r px-4" : ""
              } ${idx === 2 || idx === 3 ? "border-r px-4" : ""} ${
                idx === 4 ? "px-4" : ""
              }`}
            >
              <span className="text-gray-500 text-md mb-2">{metric.label}</span>
              <div className="flex flex-row items-center justify-center gap-4 mb-1 w-full">
                <div
                  className="relative flex items-center justify-center"
                  style={{ minHeight: "70px", minWidth: "70px" }}
                >
                  <svg width="70" height="70" viewBox="0 0 70 70">
                    <circle
                      cx="35"
                      cy="35"
                      r="26"
                      stroke="#e5e7eb"
                      strokeWidth="14"
                      fill="none"
                    />
                    {/* Placement Readiness: fill according to value/5 */}
                    {isPlacementReadiness && metric.value > 0 && (
                      <circle
                        cx="35"
                        cy="35"
                        r="26"
                        stroke={metric.color}
                        strokeWidth="14"
                        fill="none"
                        strokeDasharray={2 * Math.PI * 26}
                        strokeDashoffset={
                          2 * Math.PI * 26 * (1 - metric.value / 5)
                        }
                        strokeLinecap="round"
                      />
                    )}
                    {/* Only show progress for percent metrics if value > 0 */}
                    {!isPlacementReadiness &&
                      typeof metric.value === "number" &&
                      metric.unit === "%" &&
                      metric.value > 0 && (
                        <circle
                          cx="35"
                          cy="35"
                          r="26"
                          stroke={metric.color}
                          strokeWidth="14"
                          fill="none"
                          strokeDasharray={2 * Math.PI * 26}
                          strokeDashoffset={
                            2 * Math.PI * 26 * (1 - metric.value / 100)
                          }
                          strokeLinecap="round"
                        />
                      )}
                    {/* For other metrics, show full color ring only if value > 0 */}
                    {!isPlacementReadiness &&
                      !(
                        typeof metric.value === "number" && metric.unit === "%"
                      ) &&
                      metric.value > 0 && (
                        <circle
                          cx="35"
                          cy="35"
                          r="26"
                          stroke={metric.color}
                          strokeWidth="14"
                          fill="none"
                          strokeDasharray={2 * Math.PI * 26}
                          strokeDashoffset={0}
                          strokeLinecap="round"
                        />
                      )}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {metric.icon}
                  </div>
                </div>
                <span className="text-3xl font-bold text-[#14212B] flex items-end">
                  {metric.value}
                  {metric.unit && (
                    <span className="text-lg font-semibold ml-1">
                      {metric.unit}
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- AccuracyBarChart ---
interface AccuracyData {
  label: string;
  value: number;
}
function AccuracyBarChart({ data }: { data: AccuracyData[] }) {
  const yTicks = [100, 75, 50, 25, 0];
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex-1 min-w-[260px] max-w-[350px] min-h-[240px] flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl font-bold text-gray-800">Accuracy</span>
      </div>
      <div className="flex-1 flex flex-row items-end w-full overflow-x-auto">
        {/* Y-axis */}
        <div className="flex flex-col justify-between h-full mr-2 py-2">
          {yTicks.map((tick) => (
            <span key={tick} className="text-xs text-gray-400 h-full">
              {tick}%
            </span>
          ))}
        </div>
        {/* Bars */}
        <div className="flex-1 flex flex-col justify-end">
          <div className="flex items-end gap-4 min-w-0 overflow-x-auto">
            {data.map((d) => (
              <div
                key={d.label}
                className="flex flex-col items-center flex-1 min-w-[40px]"
              >
                <div
                  className={`w-10 bg-gradient-to-t from-purple-400 to-purple-600 rounded-t-lg`}
                  style={{ height: d.value > 10 ? `${d.value}%` : "10px" }}
                ></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-700 font-medium min-w-0 overflow-x-auto">
            {data.map((d) => (
              <span key={d.label} className="w-12 text-center truncate">
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- RatingBars ---
interface RatingData {
  label: string;
  value: number;
  color: string;
}
function RatingBars({ data }: { data: RatingData[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex-1 min-w-[260px] max-w-[350px] min-h-[240px] flex flex-col overflow-x-auto">
      <span className="text-xl font-bold text-gray-800 mb-2">Rating</span>
      <div className="flex flex-col gap-4 mt-2 min-w-0">
        {data.slice(0, 5).map((d) => (
          <div key={d.label} className="flex items-center gap-2 min-w-0">
            <span className="w-28 text-sm text-gray-700 truncate">
              {d.label}
            </span>
            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden min-w-[40px]">
              <div
                className="h-full rounded-full"
                style={{ width: `${d.value}%`, background: d.color }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- ScoreArc ---
interface ScoreArcProps {
  score: number;
  max: number;
}
const ScoreArc: React.FC<ScoreArcProps> = ({ score, max }) => {
  // Arc settings
  const radius = 70;
  const stroke = 14;
  const center = 90;
  const arcLength = Math.PI; // 180deg
  const percent = Math.max(0, Math.min(1, score / max));
  const arcAngle = arcLength * percent;
  const startAngle = Math.PI;
  const endAngle = startAngle + arcAngle;
  // Helper to describe arc
  function describeArc(
    cx: number,
    cy: number,
    r: number,
    start: number,
    end: number
  ) {
    const startPt = {
      x: cx + r * Math.cos(start),
      y: cy + r * Math.sin(start),
    };
    const endPt = {
      x: cx + r * Math.cos(end),
      y: cy + r * Math.sin(end),
    };
    const largeArcFlag = end - start <= Math.PI ? 0 : 1;
    return [
      "M",
      startPt.x,
      startPt.y,
      "A",
      r,
      r,
      0,
      largeArcFlag,
      1,
      endPt.x,
      endPt.y,
    ].join(" ");
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex-1 min-w-[260px] max-w-[350px] min-h-[240px] flex flex-col items-center justify-center relative">
      <span className="text-lg font-bold text-black mb-2 w-full text-left">
        Score
      </span>
      <svg width={180} height={120} viewBox={`0 0 180 120`}>
        {/* Background arc */}
        <path
          d={describeArc(center, center, radius, Math.PI, 2 * Math.PI)}
          stroke="#e5e7eb"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
        />
        {/* Foreground arc */}
        <path
          d={describeArc(center, center, radius, Math.PI, endAngle)}
          stroke="url(#scoreGradient)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#a5b4fc" />
          </linearGradient>
        </defs>
        {/* Dotted inner arc */}
        <path
          d={describeArc(center, center, radius - 18, Math.PI, 2 * Math.PI)}
          stroke="#d1d5db"
          strokeWidth={2}
          fill="none"
          strokeDasharray="2 6"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center mx-auto">
        <span className="text-4xl font-extrabold text-black">{score}</span>
        <span className="text-md text-gray-500 font-semibold">of {max}</span>
      </div>
    </div>
  );
};

// --- SkillsSection ---
interface SkillsSectionProps {
  shineSkills: string[];
  attentionSkills: string[];
}
const SkillsSection: React.FC<SkillsSectionProps> = ({
  shineSkills,
  attentionSkills,
}) => (
  <div className="flex flex-col md:flex-row justify-between gap-8 mt-10 w-full px-10">
    {/* Skills you Shine in */}
    <div className="flex-1">
      <h3 className="text-lg font-semibold text-[#222] mb-3 flex items-center gap-2">
        <span role="img" aria-label="shine">
          ✨
        </span>{" "}
        Skills you Shine in
      </h3>
      <div className="flex flex-wrap gap-2">
        {shineSkills.map((skill) => (
          <span
            key={skill}
            className="px-4 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
    {/* Skills you Need Attention */}
    <div className="flex-1">
      <h3 className="text-lg font-semibold text-[#222] mb-3 flex items-center gap-2">
        <span role="img" aria-label="attention">
          👀
        </span>{" "}
        Skills you Need Attention
      </h3>
      <div className="flex flex-wrap gap-2">
        {attentionSkills.map((skill) => (
          <span
            key={skill}
            className="px-4 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium border border-yellow-200"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  </div>
);

// Dummy data for now
// const shineSkills = [...];
// const attentionSkills = [...];

// --- MentorFeedbackSection ---
interface MentorFeedbackSectionProps {
  didWell: string;
  couldDoBetter: string;
  suggestions: string[];
}
const MentorFeedbackSection: React.FC<MentorFeedbackSectionProps> = ({
  didWell,
  couldDoBetter,
  suggestions,
}) => (
  <div className="w-full mt-10 px-10">
    <h2 className="text-2xl font-bold text-[#222] mb-6">Mentor Feedback</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* What You Did Well */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span role="img" aria-label="well">
            ✨
          </span>
          <span className="font-semibold text-[#2563eb]">
            What You Did Well:
          </span>
        </div>
        <p className="text-gray-700 text-base mt-1">{didWell}</p>
      </div>
      {/* What you could have done better */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span role="img" aria-label="better">
            😊
          </span>
          <span className="font-semibold text-[#eab308]">
            What you could have done better
          </span>
        </div>
        <p className="text-gray-700 text-base mt-1">{couldDoBetter}</p>
      </div>
      {/* Suggestions for you */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-[#222]">Suggestions for you</span>
        </div>
        <ul className="list-disc pl-5 text-gray-700 text-base mt-1 space-y-2">
          {suggestions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

// Dummy data for mentor feedback (fallback)
const mentorFeedback = {
  didWell:
    "Your understanding of modern AI tools and ability to build no-code solutions stood out. You've shown strong logical clarity in problem-solving.",
  couldDoBetter:
    "Some answers lacked deeper reasoning—especially around coding implementation and architecture. Consider reviewing system design patterns.",
  suggestions: [
    'Take our micro-module on "Advanced React for Developers."',
    "Revisit MongoDB schema design via our video series.",
    "Try building a freelance portfolio page using our Glide + Zapier tutorial.",
  ],
};

interface UserState {
  email: string | null;
  full_name: string | null;
  isAuthenticated: boolean;
}

// PaymentCardSection component for pricing cards
const PaymentCardSection: React.FC<{
  redeemData: ScholarshipRedemptionData;
  clientId: number;
  assessmentId: string;
}> = ({ redeemData, clientId, assessmentId }) => {
  // Get assessment price in rupees (convert from string)
  const user = useSelector((state: { user: UserState }) => state.user);

  const { initiateNanodegreePayment } = useNanodegreePayment({
    onSuccess: (result: PaymentResult) => {
      console.log("Nanodegree payment successful:", result);
    },
  });

  const { initiateFlagshipPayment } = useFlagshipPayment({
    onSuccess: (result: PaymentResult) => {
      console.log("Flagship payment successful:", result);
    },
  });

  const handleNanodegreePayment = () => {
    initiateNanodegreePayment(clientId, 499, "nanodegree", {
      prefill: {
        name: user.full_name || "User",
        email: user.email || "",
      },
      metadata: {
        assessmentId: assessmentId,
        type_id: "nanodegree",
        payment_type: "PREBOOKING",
      },
    });
    console.log("Nanodegree payment");
  };

  const handleFlagshipPayment = () => {
    initiateFlagshipPayment(clientId, 999, "flagship", {
      prefill: {
        name: user.full_name || "User",
        email: user.email || "",
      },
      metadata: {
        assessmentId: assessmentId,
        type_id: "flagship",
        payment_type: "PREBOOKING",
      },
    });
    console.log("Flagship payment");
  };
  return (
    <div className="w-full flex flex-col items-center mt-16">
      <span className="text-sm text-[#0ea5e9] font-semibold tracking-wide mb-2">
        PRICING
      </span>
      <h2 className="text-3xl md:text-4xl font-bold text-[#14212B] text-center mb-2">
        Choose Your Path.
        <br className="hidden md:block" />
        Reserve Your Seat Today.
      </h2>
      <div className="flex flex-col md:flex-row gap-8 mt-8 w-full max-w-4xl mx-auto">
        {/* Nanodegree Card */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow p-8 flex flex-col relative">
          <span className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 text-center items-center justify-center rounded-xl">
            <h3 className="text-2xl font-bold">50</h3>
            <h3 className="text-xs">seats only</h3>
          </span>
          <h3 className="text-xl font-bold text-[#2563eb] mb-1">
            Nanodegree Program
          </h3>
          <span className="text-xs text-gray-500 mb-2">
            Career-Ready Training at Best Price
          </span>
          <div className="text-3xl md:text-4xl font-bold text-[#14212B] mb-1">
            ₹{4999}
          </div>
          <span className="text-gray-700 text-sm mb-4 text-center">
            Complete Career-Ready Training at an Unbeatable Price
          </span>
          <div className="w-full border-t border-gray-200 my-4"></div>
          <span className="text-xs font-bold text-gray-500 mb-2 tracking-wide">
            WHAT YOU GET
          </span>
          <ul className="text-sm text-gray-700 mb-6 space-y-2 w-full">
            <li className="flex items-center gap-2">
              <span className="text-[#2563eb]">★</span>100+ hours of expert
              video content
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2563eb]">★</span>AI-graded assignments &
              quizzes
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2563eb]">★</span>21-day No-Code AI Product
              Builder
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2563eb]">★</span>90-Day Mentored Work
              Experience
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2563eb]">★</span>Weekly performance
              tracking
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2563eb]">★</span>Lifetime job portal
              access
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2563eb]">★</span>Certificate + career
              readiness report
            </li>
          </ul>
          <button
            onClick={handleNanodegreePayment}
            className="w-full bg-[#14212B] text-white font-semibold py-3 rounded-lg shadow hover:bg-[#223344] transition-colors duration-200 mb-2"
          >
            Book Your Seat for ₹499
          </button>
          <span className="text-xs text-gray-400">
            Fully refundable within 7 days
          </span>
        </div>
        {/* Flagship Card */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow p-8 flex flex-col relative">
          <span className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 text-center items-center justify-center rounded-xl">
            <h3 className="text-2xl font-bold">30</h3>
            <h3 className="text-xs">seats only</h3>
          </span>
          <span className="absolute top-4 left-4 bg-yellow-200 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">
            ⚡ Eligible for Scholarship ⚡
          </span>
          <h3 className="text-xl font-bold text-[#2563eb] mb-1 mt-4">
            Flagship Career Launchpad
          </h3>
          <span className="text-xs text-gray-500 mb-2">
            Mentorship · Referrals · Job-Ready
          </span>
          <div className="text-lg text-[#0ea5e9] font-bold mb-1">
            Claim your <span className="text-2xl">90%</span> scholarship.
          </div>
          <div className="flex items-end gap-2 mb-1">
            <span className="text-3xl md:text-4xl font-bold text-[#14212B]">
              {redeemData?.payable_amount ?? 10000}
            </span>
            <span className="text-base text-gray-400 line-through">
              {redeemData?.total_amount ?? 120000}
            </span>
          </div>
          <span className="text-xs text-gray-500 mb-1">
            This price is only valid for next 7 days!{" "}
            <a href="#" className="underline text-[#0ea5e9]">
              View Cost Breakup →
            </a>
          </span>
          <div className="w-full border-t border-gray-200 my-4"></div>
          <span className="text-xs font-bold text-gray-500 mb-2 tracking-wide">
            WHAT YOU GET
          </span>
          <ul className="text-sm text-gray-700 mb-6 space-y-2 w-full">
            <li className="flex items-center gap-2">
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                Everything in Nanodegree
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2563eb]">★</span>Live sessions with MANG
              experts
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2563eb]">★</span>Direct referral to hiring
              partners
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2563eb]">★</span>90-Day guided work with
              MANG mentor
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2563eb]">★</span>AI-powered resume &
              branding help
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2563eb]">★</span>Portfolio building & mock
              interviews
            </li>
          </ul>
          <button
            onClick={handleFlagshipPayment}
            className="w-full bg-[#14212B] text-white font-semibold py-3 rounded-lg shadow hover:bg-[#223344] transition-colors duration-200 mb-2"
          >
            Book Your Seat for ₹999
          </button>
          <span className="text-xs text-gray-400">
            Fully refundable within 7 days
          </span>
        </div>
      </div>
    </div>
  );
};

// ProgramCard
const ProgramCard: React.FC<{
  redeemData: ScholarshipRedemptionData;
  clientId: number;
  assessmentId: string;
}> = ({ redeemData, clientId, assessmentId }) => (
  <div className="w-full flex flex-col gap-8 my-10">
    {/* Nanodegree Card */}
    <div className="flex flex-col md:flex-row items-center bg-gradient-to-br from-[#f8fcfc] to-[#eafff6] rounded-3xl px-8 shadow-sm border border-gray-200">
      <div className="flex-1 min-w-[300px]">
        <div className="">
          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold mb-2">
            Your Learning Hub
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-[#264D64] mb-4">
          AI Linc Nanodegree Program
        </h2>
        <ul className="space-y-2 mb-6">
          <li className="flex items-center gap-2 text-gray-800 text-base">
            <span role="img" aria-label="video">
              🎥
            </span>{" "}
            Video Lectures on AI, MERN & More
          </li>
          <li className="flex items-center gap-2 text-gray-800 text-base">
            <span role="img" aria-label="quiz">
              ❓
            </span>{" "}
            Auto-evaluated Quizzes & Coding Tests
          </li>
          <li className="flex items-center gap-2 text-gray-800 text-base">
            <span role="img" aria-label="articles">
              📄
            </span>{" "}
            Curated Articles & Case Studies
          </li>
          <li className="flex items-center gap-2 text-gray-800 text-base">
            <span role="img" aria-label="progress">
              📈
            </span>{" "}
            Track Your Progress in Real-Time
          </li>
          <li className="flex items-center gap-2 text-gray-800 text-base">
            <span role="img" aria-label="career">
              💼
            </span>{" "}
            Career Support + Weekly Live Mentorship
          </li>
        </ul>
        <div className="flex flex-col md:flex-row gap-4 mt-4 text-sm">
          <button className="bg-[#255C79] text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 shadow hover:bg-[#1a4a5f] transition-colors">
            🚀 21-Day No-Code AI Sprint
          </button>
          <button className="bg-[#0e7490] text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 shadow hover:bg-[#155e75] transition-colors">
            🟢 90-Day Work Experience
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center mt-8 md:mt-0">
        <div className="relative left-20 top-4">
          <img
            src={cube}
            alt="Cube"
            className="w-104 h-104 object-contain rounded-2xl"
          />
        </div>
      </div>
    </div>
    {/* Career Launchpad Card */}
    <div className="flex flex-col md:flex-row items-center bg-gradient-to-br from-[#fffbe6] to-[#fffde6] rounded-3xl px-8 shadow-sm border border-gray-200">
      <div className="flex-1 min-w-[300px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-semibold">
            Mentorship · Referrals · Career-Ready
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-[#264D64] mb-4">
          AI Linc Flagship Career Launchpad
        </h2>
        <div className="mb-2">
          <span className="inline-block px-3 py-1 bg-green-600 text-white rounded-full text-xs font-semibold mb-2">
            Everything in Nanodegree
          </span>
        </div>
        <ul className="space-y-2 mb-6 mt-2">
          <li className="flex items-center gap-2 text-gray-800 text-base">
            <span role="img" aria-label="referrals">
              🌐
            </span>{" "}
            Get Referrals to Top Companies (Google, Amazon, etc.)
          </li>
          <li className="flex items-center gap-2 text-gray-800 text-base">
            <span role="img" aria-label="resume">
              🧑‍💼
            </span>{" "}
            AI + Mentor-Led Resume Reviews
          </li>
          <li className="flex items-center gap-2 text-gray-800 text-base">
            <span role="img" aria-label="portfolio">
              💼
            </span>{" "}
            Build a Winning Tech Portfolio
          </li>
          <li className="flex items-center gap-2 text-gray-800 text-base">
            <span role="img" aria-label="interviews">
              📝
            </span>{" "}
            Behavioral & Technical Mock Interviews
          </li>
        </ul>
        <div className="flex flex-col md:flex-row gap-4 mt-4 text-sm">
          <button className="bg-yellow-700 text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 shadow hover:bg-yellow-600 transition-colors">
            🧑‍💻 21-Day Guided No-Code Build
          </button>
          <button className="bg-yellow-700 text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 shadow hover:bg-yellow-800 transition-colors">
            ✅ 90-Day MAANG PM Work Experience
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center mt-8 md:mt-0">
        <div className="relative left-10 top-5">
          <img
            src={triangle}
            alt="Yellow Shape"
            className="w-94 h-94 object-contain"
          />
        </div>
      </div>
    </div>
    {/* Comparison Table */}
    <h3 className="text-2xl font-bold text-center text-[#14212B] mt-16">
      Let's Compare both the Program
    </h3>
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 overflow-x-auto mt-4">
      <table className="w-full text-left text-sm border-collap">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-6 py-1 font-semibold text-gray-700 border-b border-r border-gray-200">
              Features
            </th>
            <th className="px-6 py-1 font-semibold text-gray-700 border-b border-r border-gray-200">
              AI Linc Nanodegree Program
            </th>
            <th className="px-6 py-1 font-semibold text-gray-700 border-b border-gray-200">
              AI Linc Flagship Career Launchpad
            </th>
          </tr>
        </thead>
        <tbody className="text-gray-80">
          <tr className="border-b border-gray-200">
            <td className="px-6 py-1 border-r border-gray-200">
              All Platform Content (videos, quizzes, etc.)
            </td>
            <td className="px-6 py-1 border-r border-gray-200">
              <GreenTick />
            </td>
            <td className="px-6 py-1 border-gray-200">
              <GreenTick />
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-6 py-1 border-r border-gray-200">
              Auto-evaluated Assignments & Reports
            </td>
            <td className="px-6 py-1 border-r border-gray-200">
              <GreenTick />
            </td>
            <td className="px-6 py-1 border-gray-200">
              <GreenTick />
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-6 py-1 border-r border-gray-200">
              21-Day No-Code Build
            </td>
            <td className="px-6 py-1 border-r border-gray-200">
              <GreenTick />
            </td>
            <td className="px-6 py-1 border-gray-200">
              <GreenTick />
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-6 py-1 border-r border-gray-200">
              90-Day Guided Work Experience
            </td>
            <td className="px-6 py-1 items-center gap-1 border-gray-200">
              <GreenTick />
              <span className="font-semibold text-xs ml-1 border-gray-200">
                (Led by tech pro)
              </span>
            </td>
            <td className="px-6 py-1 border-l gap-1 border-gray-200">
              <GreenTick />
              <span className="font-semibold text-xs ml-1 border-gray-200">
                (Led by MAANG PM)
              </span>
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-6 py-1 border-r border-gray-200">
              Weekly Mentor Session
            </td>
            <td className="px-6 py-1 border-r gap-1 border-gray-200">
              <GreenTick />
              <span className="font-semibold text-xs ml-1 ">(1 per week)</span>
            </td>
            <td className="px-6 py-1 flex items-center gap-1 border-gray-200">
              <GreenTick />
              <span className="font-semibold text-xs ml-1">
                (Multiple per week with Experts)
              </span>
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-6 py-1 border-r border-gray-200">
              Lifetime Platform Access
            </td>
            <td className="px-6 py-1 border-r border-gray-200">
              <GreenTick />
            </td>
            <td className="px-6 py-1 border-gray-200">
              <GreenTick />
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-6 py-1 border-r border-gray-200">
              AI Job Portal Access
            </td>
            <td className="px-6 py-1 border-r border-gray-200">
              <GreenTick />
            </td>
            <td className="px-6 py-1 border-gray-200">
              <GreenTick />
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-6 py-1 border-r border-gray-200">
              AI Resume Review
            </td>
            <td className="px-6 py-1 border-r border-gray-200">
              <GreenTick />
            </td>
            <td className="px-6 py-1 border-gray-200">
              <GreenTick />
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-6 py-1 border-r border-gray-200">
              Portfolio Support
            </td>
            <td className="px-6 py-1 border-r border-gray-200">
              <GreenTick />
            </td>
            <td className="px-6 py-1 border-gray-200">
              <GreenTick />
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-6 py-1 border-r border-gray-200">
              Direct Hiring Partner Referrals
            </td>
            <td className="px-6 py-1 border-r border-gray-200">
              <GreenTick />
            </td>
            <td className="px-6 py-1 border-gray-200">
              <GreenTick />
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-6 py-1 border-r border-gray-200">
              Live Sessions by MAANG Professionals
            </td>
            <td className="px-6 py-1 border-r border-gray-200">
              <GreenTick />
            </td>
            <td className="px-6 py-1 border-gray-200">
              <GreenTick />
            </td>
          </tr>
          <tr>
            <td className="px-6 py-1 border-r border-gray-200">
              Mock Interview Prep
            </td>
            <td className="px-6 py-1 border-r border-gray-200">
              <GreenTick />
            </td>
            <td className="px-6 py-1 border-gray-200">
              <GreenTick />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    {/* How to Choose Section */}
    <div className="w-full flex flex-col md:flex-row mt-10 mb-2 px-45 gap-6">
      <div className="md:items-start">
        <h4 className="text-lg font-bold text-[#14212B] mb-2">
          How to Choose?
        </h4>
      </div>
      <div className="flex-1 bg-green-50 rounded-2xl p-6 flex flex-col items-center md:items-start border border-green-100">
        <span className="text-xl font-bold text-green-700 mb-1">
          Go for Nanodegree
        </span>
        <span className="text-gray-700">
          If you want structured learning + real experience at your own pace.
        </span>
      </div>
      <div className="flex-1 bg-yellow-50 rounded-2xl p-6 flex flex-col items-center md:items-start border border-yellow-100">
        <span className="text-xl font-bold text-yellow-700 mb-1">
          Go for Flagship
        </span>
        <span className="text-gray-700">
          If you're ready to be placed, mentored by top tech leaders, and Need
          personal branding
        </span>
      </div>
    </div>
    <PaymentCardSection
      redeemData={redeemData as ScholarshipRedemptionData}
      clientId={clientId}
      assessmentId={assessmentId}
    />
  </div>
);

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

// GreenTick SVG component
const GreenTick: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
    className="inline-block align-middle"
  >
    <circle cx="10" cy="10" r="10" fill="#22c55e" />
    <path
      d="M6 10.5l3 3 5-5"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Types for backend mapping
export interface TopicStats {
  total: number;
  correct: number;
  incorrect: number;
  accuracy_percent: number;
  rating_out_of_5: number;
}

export interface SkillStat {
  skill: string;
  accuracy_percent: number;
  rating_out_of_5: number;
  total: number;
  correct: number;
  incorrect: number;
}

export interface AssessmentStats {
  total_questions: number;
  attempted_questions: number;
  correct_answers: number;
  score: number;
  incorrect_answers: number;
  accuracy_percent: number;
  placement_readiness: number;
  maximum_marks: number;
  topic_wise_stats: Record<string, TopicStats>;
  top_skills: SkillStat[];
  low_skills: SkillStat[];
  percentile: number;
  offered_scholarship_percentage: number;
  time_taken_minutes: number;
  total_time_minutes: number;
  percentage_time_taken: number;
}

export interface ScholarshipRedemptionData {
  message: string;
  percentage_scholarship: number;
  score: number;
  maximum_marks: number;
  payable_amount: number;
  total_amount: number;
  txn_status?: string;
  stats?: AssessmentStats;
}

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

  // Certificate data for the assessment
  const user = useSelector((state: { user: UserState }) => state.user);
  const stats = redeemData?.stats;

  const certificateData = {
    id: "1",
    name: "AI Linc Scholarship Assessment",
    type: "assessment" as const,
    issuedDate: "2025-06-28", // Set to 28th
    studentName: user?.full_name || "User",
    studentEmail: user?.email || "user@example.com",
    score: stats?.accuracy_percent || 0,
    sessionNumber: 1,
  };

  console.log("redeemData", redeemData);
  // Map backend data to UI props
  const perfReportData = stats
    ? [
        {
          label: "Overall Accuracy",
          value: stats.accuracy_percent ?? 0,
          unit: "%",
          color: "#22c55e",
          icon: (
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l2 2" />
            </svg>
          ),
        },
        {
          label: "Test Duration",
          value: stats.time_taken_minutes ?? 0,
          unit: "mins",
          color: "#facc15",
          icon: (
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="#facc15"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l2 2" />
            </svg>
          ),
        },
        {
          label: "Placement Readiness",
          value: stats.placement_readiness ?? 0,
          unit: "",
          color: "#facc15",
          icon: (
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="#facc15"
              strokeWidth="2"
            >
              <polygon points="12,2 15,10 24,10 17,15 19,24 12,19 5,24 7,15 0,10 9,10" />
            </svg>
          ),
        },
        {
          label: "Performance Percentile",
          value: stats.percentile ?? 0,
          unit: "%",
          color: "#0ea5e9",
          icon: (
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="2"
            >
              <circle cx="12" cy="8" r="4" />
              <rect x="8" y="12" width="8" height="8" rx="2" />
            </svg>
          ),
        },
        {
          label: "Scholarship Eligibility",
          value: stats.offered_scholarship_percentage ?? 0,
          unit: "%",
          color: "#22c55e",
          icon: (
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l2 2" />
            </svg>
          ),
        },
      ]
    : [
        // ... fallback dummy data ...
      ];

  // AccuracyBarChart
  const accuracyBarData = stats?.topic_wise_stats
    ? Object.entries(stats.topic_wise_stats as Record<string, TopicStats>).map(
        ([label, val]) => ({
          label,
          value: val.accuracy_percent ?? 0,
        })
      )
    : [
        // ... fallback dummy data ...
      ];

  // RatingBars
  const ratingBarData = stats?.topic_wise_stats
    ? Object.entries(stats.topic_wise_stats as Record<string, TopicStats>).map(
        ([label, val]) => ({
          label,
          value: (val.rating_out_of_5 ?? 0) * 20, // convert to percent for bar
          color: "#facc15",
        })
      )
    : [
        // ... fallback dummy data ...
      ];

  // SkillsSection
  const shineSkillsArr =
    stats?.top_skills?.map((s: SkillStat) => s.skill) ??
    [
      // ... fallback dummy data ...
    ];
  const attentionSkillsArr =
    stats?.low_skills?.map((s: SkillStat) => s.skill) ??
    [
      // ... fallback dummy data ...
    ];

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
            <ScoreArc
              score={stats?.score ?? 0}
              max={stats?.maximum_marks ?? 50}
            />
            <RatingBars data={ratingBarData} />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-300 my-10 mx-7"></div>

          {/* Skills Section */}
          <SkillsSection
            shineSkills={shineSkillsArr}
            attentionSkills={attentionSkillsArr}
          />
          {/* Divider */}
          <div className="border-t border-gray-300 my-10 mx-7"></div>
          {/* Mentor Feedback Section (keep dummy for now) */}
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
