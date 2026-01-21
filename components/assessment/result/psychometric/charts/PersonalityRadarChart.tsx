"use client";

import { useState, useEffect } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface Trait {
  trait_id: string;
  trait_name: string;
  band: string;
  score: number;
}

interface TraitInsight {
  trait_id: string;
  trait_name: string;
  description: string;
  your_tendency: string;
  strengths: string[];
  growth_suggestions: string[];
  real_life_example: string;
}

interface PersonalityRadarChartProps {
  traits: Trait[];
  traitInsights?: TraitInsight[];
}

// Custom Tooltip Component - Simplified to show only score
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-3 z-50">
        <p className="font-bold text-slate-900 mb-1 text-sm">{data.fullTrait}</p>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-600">{data.score}</span>
          <span className="text-sm text-slate-500 font-semibold">/ 100</span>
        </div>
      </div>
    );
  }
  return null;
};

export function PersonalityRadarChart({ traits, traitInsights = [] }: PersonalityRadarChartProps) {
  const [hoveredTrait, setHoveredTrait] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const chartData = traits.map((trait) => {
    const insight = traitInsights.find((ti) => ti.trait_id === trait.trait_id);
    return {
      trait: trait.trait_name, // Show full name, no truncation
      fullTrait: trait.trait_name,
      score: trait.score,
      band: trait.band,
      trait_id: trait.trait_id,
      insight: insight,
    };
  });

  const getBandColor = (band: string) => {
    const bandLower = band.toLowerCase();
    if (bandLower === "high" || bandLower === "analytical") {
      return "#10b981";
    }
    if (bandLower === "balanced") {
      return "#3b82f6";
    }
    return "#f59e0b";
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Personality Traits</h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-500 mt-0.5 sm:mt-1 font-medium hidden sm:block">Comprehensive radar visualization of your personality profile</p>
        </div>
      </div>

      {/* Detailed Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-blue-100">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-0.5 sm:mb-1">Total Traits</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-900">{traits.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-green-100">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-0.5 sm:mb-1">Avg Score</p>
          <p className="text-xl sm:text-2xl font-bold text-green-900">
            {Math.round(traits.reduce((sum, t) => sum + t.score, 0) / traits.length)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-purple-100">
          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-0.5 sm:mb-1">Highest</p>
          <p className="text-xl sm:text-2xl font-bold text-purple-900">
            {Math.max(...traits.map(t => t.score))}
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-amber-100">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-0.5 sm:mb-1">Lowest</p>
          <p className="text-xl sm:text-2xl font-bold text-amber-900">
            {Math.min(...traits.map(t => t.score))}
          </p>
        </div>
      </div>

      <div className="w-full h-[300px] sm:h-[400px] md:h-[450px] mb-3 sm:mb-4">
        <ResponsiveContainer>
          <RadarChart data={chartData}>
            <PolarGrid stroke="#e5e7eb" strokeWidth={1.5} />
            <PolarAngleAxis
              dataKey="trait"
              tick={{ 
                fontSize: isMobile ? 9 : 11, 
                fill: "#475569",
                fontWeight: 600,
                fontFamily: "system-ui, -apple-system, sans-serif"
              }}
              tickFormatter={(value) => {
                // More aggressive truncation on mobile
                if (isMobile && value.length > 10) {
                  return value.substring(0, 10) + "...";
                }
                // Split long names into multiple lines if needed
                if (value.length > 12) {
                  const words = value.split(' ');
                  if (words.length > 1) {
                    const mid = Math.ceil(words.length / 2);
                    return words.slice(0, mid).join(' ') + '\n' + words.slice(mid).join(' ');
                  }
                }
                return value;
              }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
            />
            <Radar
              name="Trait Score"
              dataKey="score"
              stroke="#2563EB"
              strokeWidth={2.5}
              fill="#2563EB"
              fillOpacity={0.6}
              dot={{ fill: "#2563EB", r: 4 }}
              activeDot={{ r: 6, fill: "#1d4ed8" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ 
                fontSize: "14px",
                fontWeight: 600,
                fontFamily: "system-ui, -apple-system, sans-serif"
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Trait Legend with Enhanced Styling */}
      <div className="border-t border-slate-200 pt-4">
        <p className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Trait Breakdown</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 break-inside-avoid">
          {traits.map((trait) => {
            const insight = traitInsights.find((ti) => ti.trait_id === trait.trait_id);
            const isHovered = hoveredTrait === trait.trait_id;
            return (
              <div
                key={trait.trait_id}
                className={`group relative p-3 rounded-lg border transition-all duration-200 cursor-pointer break-inside-avoid ${
                  isHovered
                    ? "border-blue-400 bg-blue-50 shadow-md"
                    : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50"
                }`}
                onMouseEnter={() => setHoveredTrait(trait.trait_id)}
                onMouseLeave={() => setHoveredTrait(null)}
              >
                <div className="flex items-center justify-between mb-1 min-w-0 gap-2">
                  <span className="text-sm font-bold text-slate-900 break-words min-w-0 flex-1">{trait.trait_name}</span>
                  <span className="text-base font-bold text-blue-600 flex-shrink-0 whitespace-nowrap">{trait.score}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="h-2 flex-1 rounded-full min-w-0"
                    style={{
                      backgroundColor: `${getBandColor(trait.band)}40`,
                    }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${trait.score}%`,
                        backgroundColor: getBandColor(trait.band),
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
                    style={{
                      backgroundColor: `${getBandColor(trait.band)}20`,
                      color: getBandColor(trait.band),
                    }}
                  >
                    {trait.band}
                  </span>
                </div>
                {isHovered && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-50">
                    <p className="text-sm font-bold text-blue-600">{trait.score}/100</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
