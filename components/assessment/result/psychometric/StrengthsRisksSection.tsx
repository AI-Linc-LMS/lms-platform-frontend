"use client";

import { useState } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

interface StrengthsRisksData {
  core_strengths: Array<{
    strength: string;
    impact_score: number;
    description: string;
  }>;
  hidden_strengths: Array<{
    strength: string;
    potential_score: number;
    description: string;
  }>;
  risk_zones: Array<{
    risk: string;
    severity_score: number;
    description: string;
    mitigation: string;
  }>;
  development_priorities: Array<{
    area: string;
    current_score: number;
    target_score: number;
    priority: "high" | "medium" | "low";
    description: string;
  }>;
}

interface StrengthsRisksSectionProps {
  data: StrengthsRisksData;
}

export function StrengthsRisksSection({ data }: StrengthsRisksSectionProps) {
  const [selectedView, setSelectedView] = useState<"strengths" | "risks" | "development">("strengths");

  // Prepare data for growth trajectory chart
  const growthData = data.development_priorities.map((item) => ({
    area: item.area.length > 12 ? item.area.substring(0, 12) + "..." : item.area,
    current: item.current_score,
    target: item.target_score,
    gap: item.target_score - item.current_score,
  }));

  const getPriorityColor = (priority: string) => {
    if (priority === "high") return "#ef4444";
    if (priority === "medium") return "#f59e0b";
    return "#3b82f6";
  };

  const getSeverityColor = (score: number) => {
    if (score >= 70) return "#ef4444";
    if (score >= 50) return "#f59e0b";
    return "#3b82f6";
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border-2 border-slate-200">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Strengths, Risks & Development Areas</h2>
          <p className="text-base text-slate-600 mt-1">Balanced self-view for growth and awareness</p>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-8 border-b border-slate-200">
        <button
          onClick={() => setSelectedView("strengths")}
          className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
            selectedView === "strengths"
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Strengths
        </button>
        <button
          onClick={() => setSelectedView("risks")}
          className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
            selectedView === "risks"
              ? "border-red-500 text-red-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Risk Zones
        </button>
        <button
          onClick={() => setSelectedView("development")}
          className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
            selectedView === "development"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Development
        </button>
      </div>

      {/* Strengths View */}
      {selectedView === "strengths" && (
        <div className="space-y-6">
          {/* Core Strengths */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Core Strengths</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.core_strengths.map((item, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-bold text-slate-900">{item.strength}</h4>
                    <span className="text-2xl font-bold text-green-600">{item.impact_score}</span>
                  </div>
                  <p className="text-sm text-slate-600">{item.description}</p>
                  <div className="mt-3 w-full bg-green-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-green-600 transition-all duration-1000"
                      style={{ width: `${item.impact_score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hidden Strengths */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Hidden Strengths (Potential)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.hidden_strengths.map((item, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-bold text-slate-900">{item.strength}</h4>
                    <span className="text-2xl font-bold text-blue-600">{item.potential_score}</span>
                  </div>
                  <p className="text-sm text-slate-600">{item.description}</p>
                  <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-600 transition-all duration-1000"
                      style={{ width: `${item.potential_score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Risks View */}
      {selectedView === "risks" && (
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-4">Risk Zones & Mitigation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.risk_zones.map((item, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-5 border-2 border-red-200 hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-bold text-slate-900">{item.risk}</h4>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: getSeverityColor(item.severity_score) }}
                  >
                    {item.severity_score}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-3">{item.description}</p>
                <div className="bg-white rounded-lg p-3 border border-red-200">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Mitigation Strategy</p>
                  <p className="text-sm text-slate-700">{item.mitigation}</p>
                </div>
                <div className="mt-3 w-full bg-red-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-1000"
                    style={{
                      width: `${item.severity_score}%`,
                      backgroundColor: getSeverityColor(item.severity_score),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Development View */}
      {selectedView === "development" && (
        <div className="space-y-6">
          {/* Growth Trajectory Chart */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Development Trajectory</h3>
            <div className="w-full h-[400px]">
              <ResponsiveContainer>
                <ComposedChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="area"
                    tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    label={{ value: "Score", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-3">
                            <p className="font-bold text-slate-900 mb-2">{data.area}</p>
                            <p className="text-sm text-slate-600">Current: <span className="font-bold">{data.current}/100</span></p>
                            <p className="text-sm text-slate-600">Target: <span className="font-bold">{data.target}/100</span></p>
                            <p className="text-sm text-blue-600">Gap: <span className="font-bold">{data.gap} points</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="current" name="Current Score" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" name="Target Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Development Priorities */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Development Priorities</h3>
            <div className="space-y-4">
              {data.development_priorities.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-5 border-2 border-slate-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-bold text-slate-900">{item.area}</h4>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: getPriorityColor(item.priority) }}
                      >
                        {item.priority.toUpperCase()} PRIORITY
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{item.description}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Current</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-600">{item.current_score}</span>
                        <span className="text-sm text-slate-500">/100</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Target</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-blue-600">{item.target_score}</span>
                        <span className="text-sm text-slate-500">/100</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-1000"
                      style={{ width: `${(item.current_score / item.target_score) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
