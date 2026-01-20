"use client";

import { useState, useEffect } from "react";
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#16A34A"; // Green - High
    if (score >= 65) return "#2563EB"; // Blue - Good
    if (score >= 50) return "#D97706"; // Amber/Orange - Moderate
    return "#6b7280"; // Gray - Low
  };

  const chartData = traits.map((trait) => ({
    trait: isMobile && trait.trait_name.length > 15
      ? trait.trait_name.substring(0, 15) + "..."
      : !isMobile && trait.trait_name.length > 20
      ? trait.trait_name.substring(0, 20) + "..."
      : trait.trait_name,
    fullTrait: trait.trait_name,
    score: trait.score,
    band: trait.band,
    color: getScoreColor(trait.score),
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
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md flex-shrink-0">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Trait Scores Breakdown</h2>
          <p className="text-xs text-slate-500">Horizontal comparison</p>
        </div>
      </div>

      <div className="w-full h-[300px] sm:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ 
              top: 10, 
              right: isMobile ? 5 : 10, 
              left: isMobile ? 70 : 100, 
              bottom: 20 
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: isMobile ? 10 : 12, fill: "#6b7280" }}
              label={!isMobile ? {
                value: "Score",
                position: "insideBottom",
                offset: -5,
                style: { textAnchor: "middle", fill: "#6b7280", fontSize: "12px" },
              } : undefined}
            />
            <YAxis
              type="category"
              dataKey="trait"
              tick={{ 
                fontSize: isMobile ? 9 : 11, 
                fill: "#6b7280"
              }}
              width={isMobile ? 70 : 90}
              interval={0}
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
