"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ResponseQuality {
  consistency_level: string;
  random_response_risk: string;
  overthinking_indicator: string;
}

interface ResponseQualityBarChartProps {
  quality: ResponseQuality;
}

export function ResponseQualityBarChart({ quality }: ResponseQualityBarChartProps) {
  const getQualityScore = (level: string) => {
    const levelLower = level.toLowerCase();
    if (levelLower === "high" || levelLower === "low") return 85;
    if (levelLower === "moderate") return 60;
    return 40;
  };

  const getQualityColor = (level: string) => {
    const levelLower = level.toLowerCase();
    if (levelLower === "high" || levelLower === "low") return "#16A34A";
    if (levelLower === "moderate") return "#D97706";
    return "#EF4444";
  };

  const chartData = [
    {
      name: "Consistency",
      value: getQualityScore(quality.consistency_level),
      level: quality.consistency_level,
      color: getQualityColor(quality.consistency_level),
    },
    {
      name: "Response Risk",
      value: 100 - getQualityScore(quality.random_response_risk),
      level: quality.random_response_risk,
      color: getQualityColor(quality.random_response_risk),
    },
    {
      name: "Overthinking",
      value: getQualityScore(quality.overthinking_indicator),
      level: quality.overthinking_indicator,
      color: getQualityColor(quality.overthinking_indicator),
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-slate-900">{data.name}</p>
          <p className="text-sm text-slate-600">
            Level: <strong>{data.level}</strong>
          </p>
          <p className="text-sm text-slate-600">
            Score: <strong>{data.value}%</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Response Quality Metrics</h2>
          <p className="text-xs text-slate-500">Visual breakdown</p>
        </div>
      </div>

      <div className="w-full h-[300px]">
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "#6b7280" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              label={{
                value: "Score (%)",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "#6b7280" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
