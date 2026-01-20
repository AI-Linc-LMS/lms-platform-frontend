"use client";

import { useState } from "react";
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip, Cell, Legend } from "recharts";

interface CareerPath {
  role: string;
  score: number;
  fitment_reasons: string[];
  required_skills: Array<{
    skill: string;
    current_level: number;
    required_level: number;
    gap: number;
  }>;
  emotional_alignment: string;
  social_alignment: string;
  work_environment_compatibility: string;
  timeline: {
    short_term: string;
    mid_term: string;
    long_term: string;
  };
}

interface EnhancedCareerFitmentData {
  career_paths: CareerPath[];
  workplace_fit_note: string;
}

interface EnhancedCareerFitmentSectionProps {
  data: EnhancedCareerFitmentData;
}

export function EnhancedCareerFitmentSection({ data }: EnhancedCareerFitmentSectionProps) {
  const [selectedCareer, setSelectedCareer] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"fitment" | "skills" | "timeline">("fitment");

  const sortedCareers = [...data.career_paths].sort((a, b) => b.score - a.score);

  const chartData = sortedCareers.map((career, index) => ({
    name: career.role.length > 15 ? career.role.substring(0, 15) + "..." : career.role,
    value: career.score,
    fullRole: career.role,
    fill: career.score >= 80 ? "#10b981" : career.score >= 65 ? "#3b82f6" : "#f59e0b",
  }));

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981";
    if (score >= 65) return "#3b82f6";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-3">
          <p className="font-bold text-slate-900 mb-1">{data.fullRole}</p>
          <p className="text-lg font-bold" style={{ color: data.fill }}>{data.value}/100</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 rounded-3xl shadow-xl p-6 sm:p-8 border-2 border-emerald-100/50">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 flex items-center justify-center shadow-xl">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Career Fitment Intelligence System</h2>
          <p className="text-base text-slate-600 mt-1">Comprehensive career alignment analysis with skill gaps and roadmap</p>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 mb-8 border-b border-slate-200">
        <button
          onClick={() => setViewMode("fitment")}
          className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
            viewMode === "fitment"
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Fitment Matrix
        </button>
        <button
          onClick={() => setViewMode("skills")}
          className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
            viewMode === "skills"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Skill Gaps
        </button>
        <button
          onClick={() => setViewMode("timeline")}
          className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
            viewMode === "timeline"
              ? "border-purple-500 text-purple-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Career Roadmap
        </button>
      </div>

      {/* Fitment Matrix View */}
      {viewMode === "fitment" && (
        <div className="space-y-6">
          {/* Radial Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-slate-200/50">
            <div className="w-full h-[500px]">
              <ResponsiveContainer>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="20%"
                  outerRadius="80%"
                  data={chartData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar dataKey="value" cornerRadius={8} fill="#3b82f6">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </RadialBar>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value, entry: any) => (
                      <span style={{ color: entry.payload.fill, fontWeight: 600 }}>
                        {entry.payload.fullRole}: {entry.payload.value}/100
                      </span>
                    )}
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Career Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedCareers.map((career, index) => {
              const isSelected = selectedCareer === index;
              const color = getScoreColor(career.score);
              return (
                <div
                  key={index}
                  className={`bg-white rounded-2xl p-6 border-2 transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? "border-emerald-400 shadow-2xl scale-105"
                      : "border-slate-200 hover:border-emerald-300 hover:shadow-lg"
                  }`}
                  onClick={() => setSelectedCareer(isSelected ? null : index)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                        style={{ backgroundColor: color }}
                      >
                        #{index + 1}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{career.role}</h3>
                        <p className="text-sm text-slate-500">Fitment Score</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-4xl font-bold" style={{ color }}>
                        {career.score}
                      </span>
                      <span className="text-sm text-slate-500">/100</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">Why This Career Fits:</p>
                        <ul className="space-y-1">
                          {career.fitment_reasons.map((reason, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-emerald-600 mt-1">✓</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <p className="text-xs font-semibold text-blue-600 mb-1">Emotional Alignment</p>
                          <p className="text-sm text-slate-700">{career.emotional_alignment}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                          <p className="text-xs font-semibold text-purple-600 mb-1">Social Alignment</p>
                          <p className="text-sm text-slate-700">{career.social_alignment}</p>
                        </div>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                        <p className="text-xs font-semibold text-amber-600 mb-1">Work Environment</p>
                        <p className="text-sm text-slate-700">{career.work_environment_compatibility}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Skill Gaps View */}
      {viewMode === "skills" && (
        <div className="space-y-6">
          {sortedCareers.map((career, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 border-2 border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">{career.role}</h3>
                <span className="text-3xl font-bold" style={{ color: getScoreColor(career.score) }}>
                  {career.score}/100
                </span>
              </div>
              <div className="space-y-4">
                {career.required_skills.map((skill, skillIndex) => (
                  <div key={skillIndex} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">{skill.skill}</h4>
                      <span className={`text-sm font-bold px-2 py-1 rounded ${
                        skill.gap <= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        Gap: {skill.gap > 0 ? `+${skill.gap}` : skill.gap}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Current Level</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-blue-500 transition-all duration-1000"
                              style={{ width: `${skill.current_level}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-slate-900">{skill.current_level}/100</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Required Level</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-green-500 transition-all duration-1000"
                              style={{ width: `${skill.required_level}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-slate-900">{skill.required_level}/100</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline Roadmap View */}
      {viewMode === "timeline" && (
        <div className="space-y-6">
          {sortedCareers.map((career, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 border-2 border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">{career.role}</h3>
                <span className="text-3xl font-bold" style={{ color: getScoreColor(career.score) }}>
                  {career.score}/100
                </span>
              </div>
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500"></div>
                
                <div className="space-y-6 relative">
                  {/* Short Term */}
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-lg z-10">
                      <span className="text-xs">0-6M</span>
                    </div>
                    <div className="flex-1 bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Short-Term (0-6 months)</p>
                      <p className="text-base text-slate-700">{career.timeline.short_term}</p>
                    </div>
                  </div>

                  {/* Mid Term */}
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold shadow-lg z-10">
                      <span className="text-xs">6-18M</span>
                    </div>
                    <div className="flex-1 bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-2">Mid-Term (6-18 months)</p>
                      <p className="text-base text-slate-700">{career.timeline.mid_term}</p>
                    </div>
                  </div>

                  {/* Long Term */}
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white font-bold shadow-lg z-10">
                      <span className="text-xs">18M+</span>
                    </div>
                    <div className="flex-1 bg-green-50 rounded-xl p-4 border border-green-200">
                      <p className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-2">Long-Term (18+ months)</p>
                      <p className="text-base text-slate-700">{career.timeline.long_term}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Workplace Fit Note */}
      <div className="mt-8 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl p-6 border-2 border-emerald-200/50">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-700 uppercase tracking-wide mb-2">Workplace Fit Insight</p>
            <p className="text-base text-slate-700 font-medium leading-relaxed italic">"{data.workplace_fit_note}"</p>
          </div>
        </div>
      </div>
    </div>
  );
}
