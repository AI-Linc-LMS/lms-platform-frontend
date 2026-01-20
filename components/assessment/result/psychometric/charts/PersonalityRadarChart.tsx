"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Trait {
  trait_id: string;
  trait_name: string;
  band: string;
  score: number;
}

interface PersonalityRadarChartProps {
  traits: Trait[];
}

export function PersonalityRadarChart({ traits }: PersonalityRadarChartProps) {
  const chartData = traits.map((trait) => ({
    trait: trait.trait_name.length > 15
      ? trait.trait_name.substring(0, 15) + "..."
      : trait.trait_name,
    fullTrait: trait.trait_name,
    score: trait.score,
    band: trait.band,
  }));

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Personality Traits</h2>
          <p className="text-xs text-slate-500">Radar visualization</p>
        </div>
      </div>

      <div className="w-full h-[450px]">
        <ResponsiveContainer>
          <RadarChart data={chartData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="trait"
              tick={{ fontSize: 11, fill: "#6b7280" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
            />
            <Radar
              name="Trait Score"
              dataKey="score"
              stroke="#2563EB"
              fill="#2563EB"
              fillOpacity={0.6}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
