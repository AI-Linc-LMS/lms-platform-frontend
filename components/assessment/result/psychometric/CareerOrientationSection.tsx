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

      {/* Job Profiles Section */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
          <h3 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 uppercase tracking-wider px-2 sm:px-3 text-center">Job Profiles That Align With Your Personality</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
          {sortedRoles.map((item, index) => {
            const color = getScoreColor(item.score);
            const getGradient = (score: number) => {
              if (score >= 80) return "from-green-500 via-emerald-500 to-teal-500";
              if (score >= 65) return "from-blue-500 via-indigo-500 to-purple-500";
              if (score >= 50) return "from-amber-500 via-orange-500 to-yellow-500";
              return "from-red-500 via-rose-500 to-pink-500";
            };
            const getBgGradient = (score: number) => {
              if (score >= 80) return "from-green-50 via-emerald-50 to-teal-50";
              if (score >= 65) return "from-blue-50 via-indigo-50 to-purple-50";
              if (score >= 50) return "from-amber-50 via-orange-50 to-yellow-50";
              return "from-red-50 via-rose-50 to-pink-50";
            };
            const getIcon = (score: number) => {
              if (score >= 80) return (
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              );
              if (score >= 65) return (
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              );
              return (
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              );
            };
            return (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br border-2 transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02] hover:shadow-xl sm:hover:shadow-2xl active:scale-[0.99]"
                style={{
                  borderColor: color,
                  background: `linear-gradient(135deg, ${color}08 0%, ${color}03 50%, ${color}08 100%)`,
                }}
              >
                {/* Animated Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${getBgGradient(item.score)} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                
                {/* Decorative Corner Element - Hidden on mobile, visible on larger screens */}
                <div className={`hidden sm:block absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br ${getGradient(item.score)} opacity-10 rounded-bl-full transform rotate-45 translate-x-6 sm:translate-x-8 -translate-y-6 sm:-translate-y-8 group-hover:opacity-20 transition-opacity duration-300`}></div>
                
                <div className="relative p-3 sm:p-4 md:p-5">
                  {/* Header with Icon and Score */}
                  <div className="mb-3 sm:mb-4">
                    <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div 
                        className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br ${getGradient(item.score)} shadow-lg flex-shrink-0`}
                        style={{ color: 'white' }}
                      >
                        {getIcon(item.score)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 group-hover:text-slate-800 transition-colors break-words leading-snug sm:leading-tight">
                          {item.role}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-baseline gap-1">
                        <span
                          className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-br bg-clip-text text-transparent"
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                          }}
                        >
                          {item.score}
                        </span>
                        <span className="text-xs sm:text-sm md:text-base text-slate-500 font-semibold">/100</span>
                      </div>
                      <span
                        className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 sm:py-1 rounded-full"
                        style={{
                          backgroundColor: `${color}15`,
                          color: color,
                          border: `1px solid ${color}40`,
                        }}
                      >
                        {item.score >= 80
                          ? "Excellent"
                          : item.score >= 65
                          ? "Great"
                          : item.score >= 50
                          ? "Good"
                          : "Fair"}
                      </span>
                    </div>
                  </div>

                  {/* Enhanced Progress Bar */}
                  <div className="mb-3 sm:mb-4">
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wide">Match Score</span>
                      <span className="text-[10px] sm:text-xs font-bold" style={{ color }}>{item.score}%</span>
                    </div>
                    <div className="relative w-full h-2.5 sm:h-3 md:h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out group-hover:shadow-lg"
                        style={{
                          width: `${item.score}%`,
                          background: `linear-gradient(90deg, ${color} 0%, ${color}dd 50%, ${color} 100%)`,
                          boxShadow: `0 0 15px ${color}40`,
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                      </div>
                      {/* Progress indicator dots - Hidden on mobile */}
                      <div className="hidden sm:flex absolute inset-0 items-center">
                        {[0, 25, 50, 75, 100].map((mark) => (
                          <div
                            key={mark}
                            className="flex-1 h-full border-r border-slate-300/50 last:border-r-0"
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Fit Badge with Animation */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div 
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-700">
                        {item.score >= 80
                          ? "Excellent Fit"
                          : item.score >= 65
                          ? "Great Fit"
                          : item.score >= 50
                          ? "Good Fit"
                          : "Fair Fit"}
                      </span>
                    </div>
                    <svg 
                      className="w-4 h-4 sm:w-5 sm:h-5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1 hidden sm:block"
                      style={{ color }}
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Hover Effect Border - Reduced on mobile */}
                <div 
                  className="absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    boxShadow: `0 0 0 1px ${color}40, 0 0 20px ${color}20`,
                  }}
                ></div>
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
