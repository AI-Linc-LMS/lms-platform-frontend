"use client";

import { useState } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Cell } from "recharts";

interface EmotionalIntelligenceData {
  emotional_regulation: {
    score: number;
    level: string;
    description: string;
  };
  stress_handling: {
    score: number;
    level: string;
    description: string;
  };
  empathy: {
    score: number;
    level: string;
    description: string;
  };
  decision_under_pressure: {
    score: number;
    level: string;
    description: string;
  };
  social_intelligence: {
    collaboration_style: string;
    leadership_tendency: string;
    communication_preference: string;
    conflict_response: string;
  };
}

interface EmotionalIntelligenceSectionProps {
  data: EmotionalIntelligenceData;
}

export function EmotionalIntelligenceSection({ data }: EmotionalIntelligenceSectionProps) {
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);

  const emotionalData = [
    { dimension: "Emotional Regulation", score: data.emotional_regulation.score },
    { dimension: "Stress Handling", score: data.stress_handling.score },
    { dimension: "Empathy", score: data.empathy.score },
    { dimension: "Decision Under Pressure", score: data.decision_under_pressure.score },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981";
    if (score >= 65) return "#3b82f6";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const getLevelColor = (level: string) => {
    const levelLower = level.toLowerCase();
    if (levelLower.includes("high") || levelLower.includes("excellent")) return "text-green-700 bg-green-100";
    if (levelLower.includes("moderate") || levelLower.includes("balanced")) return "text-blue-700 bg-blue-100";
    return "text-amber-700 bg-amber-100";
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 border-2 border-slate-200">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg flex-shrink-0">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">Emotional, Social & Behavioral Intelligence</h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-0.5 sm:mt-1 hidden sm:block">Understanding your emotional and social capabilities</p>
        </div>
      </div>

      {/* Emotional Intelligence Radar */}
      <div className="mb-4 sm:mb-6 md:mb-8 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 border border-pink-100">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 sm:mb-6">Emotional Intelligence Dimensions</h3>
        <div className="w-full h-[400px]">
          <ResponsiveContainer>
            <RadarChart data={emotionalData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fontSize: 12, fill: "#475569", fontWeight: 600 }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} />
              <Radar
                name="EI Score"
                dataKey="score"
                stroke="#ec4899"
                fill="#ec4899"
                fillOpacity={0.6}
                strokeWidth={2}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-3">
                        <p className="font-bold text-slate-900 mb-1">{data.dimension}</p>
                        <p className="text-lg font-bold text-pink-600">{data.score}/100</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Emotional Dimensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div
          className={`p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
            selectedDimension === "regulation" ? "border-pink-400 bg-pink-50 shadow-lg" : "border-slate-200 bg-white hover:border-pink-300"
          }`}
          onClick={() => setSelectedDimension(selectedDimension === "regulation" ? null : "regulation")}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-bold text-slate-900">Emotional Regulation</h4>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getLevelColor(data.emotional_regulation.level)}`}>
              {data.emotional_regulation.level}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold" style={{ color: getScoreColor(data.emotional_regulation.score) }}>
              {data.emotional_regulation.score}
            </span>
            <span className="text-sm text-slate-500">/100</span>
          </div>
          <p className="text-sm text-slate-600">{data.emotional_regulation.description}</p>
        </div>

        <div
          className={`p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
            selectedDimension === "stress" ? "border-pink-400 bg-pink-50 shadow-lg" : "border-slate-200 bg-white hover:border-pink-300"
          }`}
          onClick={() => setSelectedDimension(selectedDimension === "stress" ? null : "stress")}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-bold text-slate-900">Stress Handling</h4>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getLevelColor(data.stress_handling.level)}`}>
              {data.stress_handling.level}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold" style={{ color: getScoreColor(data.stress_handling.score) }}>
              {data.stress_handling.score}
            </span>
            <span className="text-sm text-slate-500">/100</span>
          </div>
          <p className="text-sm text-slate-600">{data.stress_handling.description}</p>
        </div>

        <div
          className={`p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
            selectedDimension === "empathy" ? "border-pink-400 bg-pink-50 shadow-lg" : "border-slate-200 bg-white hover:border-pink-300"
          }`}
          onClick={() => setSelectedDimension(selectedDimension === "empathy" ? null : "empathy")}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-bold text-slate-900">Empathy</h4>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getLevelColor(data.empathy.level)}`}>
              {data.empathy.level}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold" style={{ color: getScoreColor(data.empathy.score) }}>
              {data.empathy.score}
            </span>
            <span className="text-sm text-slate-500">/100</span>
          </div>
          <p className="text-sm text-slate-600">{data.empathy.description}</p>
        </div>

        <div
          className={`p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
            selectedDimension === "pressure" ? "border-pink-400 bg-pink-50 shadow-lg" : "border-slate-200 bg-white hover:border-pink-300"
          }`}
          onClick={() => setSelectedDimension(selectedDimension === "pressure" ? null : "pressure")}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-bold text-slate-900">Decision Under Pressure</h4>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getLevelColor(data.decision_under_pressure.level)}`}>
              {data.decision_under_pressure.level}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold" style={{ color: getScoreColor(data.decision_under_pressure.score) }}>
              {data.decision_under_pressure.score}
            </span>
            <span className="text-sm text-slate-500">/100</span>
          </div>
          <p className="text-sm text-slate-600">{data.decision_under_pressure.description}</p>
        </div>
      </div>

      {/* Social Intelligence */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Social Intelligence Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 border border-blue-200">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Collaboration Style</p>
            <p className="text-lg font-bold text-slate-900">{data.social_intelligence.collaboration_style}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-blue-200">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Leadership Tendency</p>
            <p className="text-lg font-bold text-slate-900">{data.social_intelligence.leadership_tendency}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-blue-200">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Communication Preference</p>
            <p className="text-lg font-bold text-slate-900">{data.social_intelligence.communication_preference}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-blue-200">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Conflict Response</p>
            <p className="text-lg font-bold text-slate-900">{data.social_intelligence.conflict_response}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
