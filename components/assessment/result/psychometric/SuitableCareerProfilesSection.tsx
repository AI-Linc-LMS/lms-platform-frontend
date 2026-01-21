"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

interface JobProfile {
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
  description?: string;
  responsibilities?: string[];
  growth_potential?: string;
  salary_range?: string;
}

interface SuitableCareerProfilesSectionProps {
  profiles: JobProfile[];
}

export function SuitableCareerProfilesSection({ profiles }: SuitableCareerProfilesSectionProps) {
  const sortedProfiles = [...profiles].sort((a, b) => b.score - a.score);

  // Calculate statistics
  const avgScore = Math.round(sortedProfiles.reduce((sum, p) => sum + p.score, 0) / sortedProfiles.length);
  const highFitProfiles = sortedProfiles.filter(p => p.score >= 80).length;
  const mediumFitProfiles = sortedProfiles.filter(p => p.score >= 65 && p.score < 80).length;
  const lowFitProfiles = sortedProfiles.filter(p => p.score < 65).length;
  const totalSkills = sortedProfiles.reduce((sum, p) => sum + (p.required_skills?.length || 0), 0);
  const avgSkillsGap = sortedProfiles.reduce((sum, p) => {
    const profileGap = p.required_skills?.reduce((s, skill) => s + skill.gap, 0) || 0;
    const profileSkills = p.required_skills?.length || 1;
    return sum + (profileGap / profileSkills);
  }, 0) / sortedProfiles.length;

  // Chart data
  const scoreDistributionData = sortedProfiles.map((profile, index) => ({
    name: profile.role.length > 12 ? profile.role.substring(0, 12) + "..." : profile.role,
    fullName: profile.role,
    score: profile.score,
    fill: profile.score >= 80 ? "#10b981" : profile.score >= 65 ? "#3b82f6" : "#f59e0b"
  }));

  const fitmentCategoryData = [
    { name: "High Fit (80%+)", value: highFitProfiles, fill: "#10b981" },
    { name: "Medium Fit (65-79%)", value: mediumFitProfiles, fill: "#3b82f6" },
    { name: "Low Fit (<65%)", value: lowFitProfiles, fill: "#f59e0b" }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 65) return "text-blue-600 bg-blue-50 border-blue-200";
    return "text-amber-600 bg-amber-50 border-amber-200";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 65) return "bg-blue-500";
    return "bg-amber-500";
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-3">
          <p className="font-bold text-slate-900 mb-1">{data.fullName}</p>
          <p className="text-lg font-bold" style={{ color: data.fill }}>{data.score}% Match</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 border-2 border-slate-200">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Job Profiles Candidate is Suitable In</h2>
          <p className="text-sm sm:text-base text-slate-600 mt-1">Statistical analysis of job profiles aligned with your personality and skills</p>
        </div>
      </div>

      {/* Statistical Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-3 sm:p-4 border-2 border-indigo-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-semibold text-indigo-700">Total Profiles</span>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-indigo-900">{sortedProfiles.length}</p>
          <p className="text-xs text-indigo-600 mt-1">Job Roles</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-semibold text-green-700">Avg. Match</span>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-green-900">{avgScore}%</p>
          <p className="text-xs text-green-600 mt-1">Fitment Score</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 sm:p-4 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-semibold text-blue-700">High Fit</span>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-blue-900">{highFitProfiles}</p>
          <p className="text-xs text-blue-600 mt-1">80%+ Match</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 sm:p-4 border-2 border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-semibold text-amber-700">Skills Gap</span>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-900">{Math.round(avgSkillsGap)}</p>
          <p className="text-xs text-amber-600 mt-1">Avg. Points</p>
        </div>
      </div>

      {/* Statistical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Score Distribution Chart */}
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Fitment Score Distribution
          </h3>
          <div className="w-full h-[300px] sm:h-[350px]">
            <ResponsiveContainer>
              <BarChart data={scoreDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: "#475569" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  label={{ value: "Match %", angle: -90, position: "insideLeft" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {scoreDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fitment Category Pie Chart */}
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            Fitment Categories
          </h3>
          <div className="w-full h-[300px] sm:h-[350px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={fitmentCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${percent ? (percent * 100).toFixed(0) : 0}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {fitmentCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Job Profiles Grid */}
      <div className="space-y-4 sm:space-y-6">
        {sortedProfiles.map((profile, index) => (
          <div
            key={index}
            className="group bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 sm:p-6 border-2 border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300"
          >
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{profile.role}</h3>
                  <div className={`flex-shrink-0 px-3 py-1 rounded-full text-xs sm:text-sm font-bold text-white ${getScoreBadgeColor(profile.score)}`}>
                    {profile.score}% Match
                  </div>
                </div>
                {profile.description && (
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{profile.description}</p>
                )}
              </div>
            </div>

            {/* Fitment Reasons */}
            {profile.fitment_reasons && profile.fitment_reasons.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h4 className="text-sm sm:text-base font-semibold text-slate-700 mb-2 sm:mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Why This Role Fits You
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {profile.fitment_reasons.map((reason, reasonIndex) => (
                    <div
                      key={reasonIndex}
                      className="flex items-start gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-100"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Responsibilities */}
            {profile.responsibilities && profile.responsibilities.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h4 className="text-sm sm:text-base font-semibold text-slate-700 mb-2 sm:mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Key Responsibilities
                </h4>
                <ul className="space-y-2">
                  {profile.responsibilities.map((responsibility, respIndex) => (
                    <li key={respIndex} className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                      <span className="text-indigo-600 mt-1.5 flex-shrink-0">•</span>
                      <span className="leading-relaxed">{responsibility}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Alignment Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {/* Emotional Alignment */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <h5 className="text-xs sm:text-sm font-semibold text-blue-900">Emotional Fit</h5>
                </div>
                <p className="text-xs sm:text-sm text-blue-700 leading-relaxed">{profile.emotional_alignment}</p>
              </div>

              {/* Social Alignment */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 sm:p-4 border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h5 className="text-xs sm:text-sm font-semibold text-purple-900">Social Fit</h5>
                </div>
                <p className="text-xs sm:text-sm text-purple-700 leading-relaxed">{profile.social_alignment}</p>
              </div>

              {/* Work Environment */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4 border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h5 className="text-xs sm:text-sm font-semibold text-green-900">Work Environment</h5>
                </div>
                <p className="text-xs sm:text-sm text-green-700 leading-relaxed">{profile.work_environment_compatibility}</p>
              </div>
            </div>

            {/* Required Skills */}
            {profile.required_skills && profile.required_skills.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h4 className="text-sm sm:text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Required Skills & Your Current Level
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  {profile.required_skills.map((skill, skillIndex) => (
                    <div key={skillIndex} className="bg-white rounded-lg p-3 sm:p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm sm:text-base font-semibold text-slate-900">{skill.skill}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm text-slate-500">Current: {skill.current_level}/100</span>
                          <span className="text-xs sm:text-sm text-indigo-600 font-semibold">Target: {skill.required_level}/100</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 sm:h-2.5 mb-1">
                        <div
                          className={`h-2 sm:h-2.5 rounded-full transition-all duration-1000 ${
                            skill.gap <= 10 ? "bg-green-500" : skill.gap <= 25 ? "bg-blue-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${Math.min(skill.current_level, 100)}%` }}
                        />
                      </div>
                      {skill.gap > 0 && (
                        <p className="text-xs text-slate-600 mt-1">
                          Gap: <span className="font-semibold">{skill.gap} points</span> to reach required level
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Career Timeline */}
            {profile.timeline && (
              <div className="mb-4 sm:mb-6">
                <h4 className="text-sm sm:text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Career Development Timeline
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-4 border border-blue-200">
                    <h5 className="text-xs sm:text-sm font-bold text-blue-900 mb-2">Short Term (0-1 year)</h5>
                    <p className="text-xs sm:text-sm text-blue-700 leading-relaxed">{profile.timeline.short_term}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 sm:p-4 border border-purple-200">
                    <h5 className="text-xs sm:text-sm font-bold text-purple-900 mb-2">Mid Term (1-3 years)</h5>
                    <p className="text-xs sm:text-sm text-purple-700 leading-relaxed">{profile.timeline.mid_term}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4 border border-green-200">
                    <h5 className="text-xs sm:text-sm font-bold text-green-900 mb-2">Long Term (3+ years)</h5>
                    <p className="text-xs sm:text-sm text-green-700 leading-relaxed">{profile.timeline.long_term}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Growth Potential & Salary (if available) */}
            {(profile.growth_potential || profile.salary_range) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-slate-200">
                {profile.growth_potential && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 sm:p-4 border border-amber-200">
                    <h5 className="text-xs sm:text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Growth Potential
                    </h5>
                    <p className="text-xs sm:text-sm text-amber-700 leading-relaxed">{profile.growth_potential}</p>
                  </div>
                )}
                {profile.salary_range && (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 sm:p-4 border border-emerald-200">
                    <h5 className="text-xs sm:text-sm font-bold text-emerald-900 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Expected Salary Range
                    </h5>
                    <p className="text-xs sm:text-sm text-emerald-700 leading-relaxed font-semibold">{profile.salary_range}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
