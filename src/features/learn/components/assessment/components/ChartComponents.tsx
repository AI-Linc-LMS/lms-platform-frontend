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
export function RatingBars({ data }: { data: RatingData[] }) {
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
export const ScoreArc: React.FC<ScoreArcProps> = ({ score, max }) => {
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
export const SkillsSection: React.FC<{
  shineSkills: string[];
  attentionSkills: string[];
}> = ({ shineSkills, attentionSkills }) => (
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
