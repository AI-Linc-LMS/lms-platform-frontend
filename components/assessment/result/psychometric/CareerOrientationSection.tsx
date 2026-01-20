"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip, Cell } from "recharts";

interface CareerOrientationSectionProps {
  career: {
    aligned_role_clusters: Array<{
      role: string;
      score: number;
    }> | string[];
    workplace_fit_note: string;
  };
}

export function CareerOrientationSection({ career }: CareerOrientationSectionProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981"; // Green
    if (score >= 65) return "#3b82f6"; // Blue
    if (score >= 50) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  };

  // Handle both old format (string[]) and new format (Array<{role: string, score: number}>)
  const rolesWithScores = career.aligned_role_clusters.map((item, index) => {
    if (typeof item === 'string') {
      // Old format - assign a default score based on position
      return { role: item, score: 75 - (index * 5) };
    }
    return item;
  });

  // Sort roles by score (highest first)
  const sortedRoles = [...rolesWithScores].sort((a, b) => b.score - a.score);

  const chartData = sortedRoles.map((item, index) => ({
    name: item.role,
    value: item.score,
    fullRole: item.role,
    fill: getScoreColor(item.score),
  }));

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
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg flex-shrink-0">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Career Orientation</h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-500 mt-0.5 sm:mt-1 font-medium">Roles that align with your personality profile</p>
        </div>
      </div>

      {/* Chart Section - Radial Bar Chart */}
      <div className="mb-4 sm:mb-6">
        <div className="w-full h-[350px] sm:h-[450px] md:h-[500px] lg:h-[550px]">
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
              <RadialBar
                dataKey="value"
                cornerRadius={8}
                fill="#3b82f6"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </RadialBar>
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Role Cards with Scores */}
      <div className="mb-4 sm:mb-6">
        <p className="text-xs sm:text-sm font-bold text-slate-900 mb-3 sm:mb-4 uppercase tracking-wide">Detailed Role Suitability</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {sortedRoles.map((item, index) => {
            const color = getScoreColor(item.score);
            return (
              <div
                key={index}
                className="group relative p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-200 hover:shadow-lg"
                style={{
                  borderColor: `${color}40`,
                  backgroundColor: `${color}05`,
                }}
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 pr-2 min-w-0 flex-1">{item.role}</h3>
                  <div className="flex-shrink-0">
                    <span
                      className="text-xl sm:text-2xl font-bold"
                      style={{ color }}
                    >
                      {item.score}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-500 font-semibold">/100</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${item.score}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: `${color}20`,
                      color,
                    }}
                  >
                    {item.score >= 80
                      ? "Excellent Fit"
                      : item.score >= 65
                      ? "Good Fit"
                      : item.score >= 50
                      ? "Moderate Fit"
                      : "Low Fit"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Workplace Fit Note */}
      <div className="pt-4 sm:pt-5 border-t border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-emerald-100">
        <div className="flex items-start gap-2 sm:gap-3">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-slate-700 font-medium leading-relaxed italic text-sm sm:text-base">"{career.workplace_fit_note}"</p>
        </div>
      </div>
    </div>
  );
}
