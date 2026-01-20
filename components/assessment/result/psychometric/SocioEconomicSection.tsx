"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

interface SocioEconomicData {
  family_background_influence: {
    educational_support: string;
    resource_access: string;
    influence_level: number;
  };
  environmental_constraints: {
    access_to_resources: string;
    support_systems: string;
    opportunity_exposure: string;
  };
  contextual_factors: {
    resource_availability: number;
    support_network_strength: number;
    opportunity_access: number;
  };
}

interface SocioEconomicSectionProps {
  data: SocioEconomicData;
}

export function SocioEconomicSection({ data }: SocioEconomicSectionProps) {
  const contextualData = [
    {
      factor: "Resource\nAvailability",
      score: data.contextual_factors.resource_availability,
      benchmark: 70,
      fill: "#3b82f6"
    },
    {
      factor: "Support\nNetwork",
      score: data.contextual_factors.support_network_strength,
      benchmark: 70,
      fill: "#10b981"
    },
    {
      factor: "Opportunity\nAccess",
      score: data.contextual_factors.opportunity_access,
      benchmark: 70,
      fill: "#f59e0b"
    },
  ];

  const getBandLabel = (score: number) => {
    if (score >= 80) return "High";
    if (score >= 60) return "Moderate-High";
    if (score >= 40) return "Moderate";
    if (score >= 20) return "Moderate-Low";
    return "Low";
  };

  const getBandColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-700 border-green-300";
    if (score >= 60) return "bg-blue-100 text-blue-700 border-blue-300";
    if (score >= 40) return "bg-amber-100 text-amber-700 border-amber-300";
    if (score >= 20) return "bg-orange-100 text-orange-700 border-orange-300";
    return "bg-red-100 text-red-700 border-red-300";
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border-2 border-slate-200">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Socio-Economic & Environmental Factors</h2>
          <p className="text-base text-slate-600 mt-1">Contextual understanding of your environment and opportunities</p>
        </div>
      </div>

      {/* Policy-Grade Note */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-5 border-2 border-teal-200 mb-8">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-1">Policy Context</p>
            <p className="text-sm text-slate-700 leading-relaxed">
              This section provides comparative analysis using standardized bands. All assessments are contextual and non-judgmental, designed to support educational and workforce alignment initiatives.
            </p>
          </div>
        </div>
      </div>

      {/* Contextual Factors Chart */}
      <div className="mb-8 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Contextual Factors Analysis</h3>
        <div className="w-full h-[350px] mb-6">
          <ResponsiveContainer>
            <BarChart data={contextualData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="factor"
                tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: "#64748b" }}
                label={{ value: "Score (0-100)", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-3">
                        <p className="font-bold text-slate-900 mb-1">{data.factor.replace('\n', ' ')}</p>
                        <p className="text-sm text-slate-600">Your Score: <span className="font-bold">{data.score}/100</span></p>
                        <p className="text-xs text-slate-500">Benchmark: {data.benchmark}/100</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="score" name="Your Score" radius={[8, 8, 0, 0]}>
                {contextualData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
              <Bar dataKey="benchmark" name="Average Benchmark" fill="#94a3b8" radius={[8, 8, 0, 0]} opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Factor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {contextualData.map((item, index) => (
          <div key={index} className="bg-white rounded-xl p-5 border-2 border-slate-200 hover:shadow-lg transition-all">
            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3 whitespace-pre-line text-center">
              {item.factor}
            </p>
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-4xl font-bold" style={{ color: item.fill }}>
                {item.score}
              </span>
              <span className="text-sm text-slate-500">/100</span>
            </div>
            <div className="text-center">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getBandColor(item.score)}`}>
                {getBandLabel(item.score)} Band
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Environmental Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <h4 className="text-lg font-bold text-slate-900 mb-4">Family Background Influence</h4>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Educational Support</p>
              <p className="text-sm text-slate-700">{data.family_background_influence.educational_support}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Resource Access</p>
              <p className="text-sm text-slate-700">{data.family_background_influence.resource_access}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Influence Level</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-blue-200 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full bg-blue-600 transition-all duration-1000"
                    style={{ width: `${data.family_background_influence.influence_level}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-900">{data.family_background_influence.influence_level}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
          <h4 className="text-lg font-bold text-slate-900 mb-4">Environmental Constraints</h4>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Access to Resources</p>
              <p className="text-sm text-slate-700">{data.environmental_constraints.access_to_resources}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Support Systems</p>
              <p className="text-sm text-slate-700">{data.environmental_constraints.support_systems}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Opportunity Exposure</p>
              <p className="text-sm text-slate-700">{data.environmental_constraints.opportunity_exposure}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
