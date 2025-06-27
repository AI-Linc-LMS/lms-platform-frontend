import React from "react";
import {
  AccuracyData,
  RatingData,
  ScoreArcProps,
} from "../types/assessmentTypes";

// --- AccuracyBarChart ---
export function AccuracyBarChart({ data }: { data: AccuracyData[] }) {
  const yTicks = [100, 75, 50, 25, 0];
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-4 flex-1 min-w-[240px] sm:min-w-[260px] max-w-[350px] min-h-[200px] sm:min-h-[240px] flex flex-col w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg sm:text-xl font-bold text-gray-800">
          Accuracy
        </span>
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
          <div className="flex items-end gap-2 sm:gap-4 min-w-0 overflow-x-auto">
            {data.map((d) => (
              <div
                key={d.label}
                className="flex flex-col items-center flex-1 min-w-[30px] sm:min-w-[40px]"
              >
                <div
                  className={`w-6 sm:w-10 bg-gradient-to-t from-purple-400 to-purple-600 rounded-t-lg`}
                  style={{ height: d.value > 10 ? `${d.value}%` : "10px" }}
                ></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-700 font-medium min-w-0 overflow-x-auto">
            {data.map((d) => (
              <span
                key={d.label}
                className="w-8 sm:w-12 text-center truncate text-xs"
              >
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
export function RatingBars({ data }: { data: RatingData[] }) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-4 flex-1 min-w-[240px] sm:min-w-[260px] max-w-[350px] min-h-[200px] sm:min-h-[240px] flex flex-col overflow-x-auto w-full">
      <span className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
        Rating
      </span>
      <div className="flex flex-col gap-3 sm:gap-4 mt-2 min-w-0">
        {data.slice(0, 5).map((d) => (
          <div key={d.label} className="flex items-center gap-2 min-w-0">
            <span className="w-20 sm:w-28 text-xs sm:text-sm text-gray-700 truncate">
              {d.label}
            </span>
            <div className="flex-1 h-2 sm:h-3 bg-gray-200 rounded-full overflow-hidden min-w-[30px] sm:min-w-[40px]">
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
export const ScoreArc: React.FC<ScoreArcProps> = ({ score, max }) => {
  // Arc settings - responsive sizing
  const radius = 60; // Smaller for mobile
  const stroke = 12; // Smaller stroke for mobile
  const center = 80; // Adjusted center
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
      y: cy + r * Math.cos(end),
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
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-4 flex-1 min-w-[240px] sm:min-w-[260px] max-w-[350px] min-h-[200px] sm:min-h-[240px] flex flex-col items-center justify-center relative w-full">
      <span className="text-base sm:text-lg font-bold text-black mb-2 w-full text-left">
        Score
      </span>
      <svg
        width={160}
        height={100}
        viewBox={`0 0 160 100`}
        className="sm:w-[180px] sm:h-[120px]"
      >
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
          d={describeArc(center, center, radius - 15, Math.PI, 2 * Math.PI)}
          stroke="#d1d5db"
          strokeWidth={2}
          fill="none"
          strokeDasharray="2 6"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center mx-auto">
        <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-black">
          {score}
        </span>
        <span className="text-sm sm:text-md text-gray-500 font-semibold">
          of {max}
        </span>
      </div>
    </div>
  );
};

// --- SkillsSection ---
export const SkillsSection: React.FC<{
  shineSkills: string[];
  attentionSkills: string[];
}> = ({ shineSkills, attentionSkills }) => (
  <div className="flex flex-col lg:flex-row justify-between gap-6 sm:gap-8 mt-6 sm:mt-8 lg:mt-10 w-full px-4 sm:px-6 lg:px-10">
    {/* Skills you Shine in */}
    <div className="flex-1">
      <h3 className="text-base sm:text-lg font-semibold text-[#222] mb-3 flex items-center gap-2">
        <span role="img" aria-label="shine">
          ✨
        </span>{" "}
        Skills you Shine in
      </h3>
      <div className="flex flex-wrap gap-2">
        {shineSkills.map((skill) => (
          <span
            key={skill}
            className="px-3 sm:px-4 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium border border-green-200"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
    {/* Skills you Need Attention */}
    <div className="flex-1">
      <h3 className="text-base sm:text-lg font-semibold text-[#222] mb-3 flex items-center gap-2">
        <span role="img" aria-label="attention">
          👀
        </span>{" "}
        Skills you Need Attention
      </h3>
      <div className="flex flex-wrap gap-2">
        {attentionSkills.map((skill) => (
          <span
            key={skill}
            className="px-3 sm:px-4 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs sm:text-sm font-medium border border-yellow-200"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  </div>
);
