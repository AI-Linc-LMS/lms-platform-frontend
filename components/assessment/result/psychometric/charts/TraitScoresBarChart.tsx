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

interface Trait {
  trait_id: string;
  trait_name: string;
  band: string;
  score: number;
}

interface TraitScoresBarChartProps {
  traits: Trait[];
}

export function TraitScoresBarChart({ traits }: TraitScoresBarChartProps) {
  const getBandColor = (band: string) => {
    const bandLower = band.toLowerCase();
    if (bandLower === "high" || bandLower === "analytical") return "#16A34A";
    if (bandLower === "balanced") return "#2563EB";
    if (bandLower === "moderate") return "#D97706";
    return "#6b7280";
  };

  const chartData = traits.map((trait) => ({
    trait: trait.trait_name.length > 20
      ? trait.trait_name.substring(0, 20) + "..."
      : trait.trait_name,
    fullTrait: trait.trait_name,
    score: trait.score,
    band: trait.band,
    color: getBandColor(trait.band),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-slate-900">{data.fullTrait}</p>
          <p className="text-sm text-slate-600">
            Band: <strong>{data.band}</strong>
          </p>
          <p className="text-sm text-slate-600">
            Score: <strong>{data.score}/100</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Trait Scores Breakdown</h2>
          <p className="text-xs text-slate-500">Horizontal comparison</p>
        </div>
      </div>

      <div className="w-full h-[400px]">
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              label={{
                value: "Score",
                position: "insideBottom",
                offset: -5,
                style: { textAnchor: "middle", fill: "#6b7280" },
              }}
            />
            <YAxis
              type="category"
              dataKey="trait"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="score" radius={[0, 8, 8, 0]}>
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
