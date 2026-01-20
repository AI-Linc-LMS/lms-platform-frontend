"use client";

import { useState, useEffect } from "react";
import { PersonalityRadarChart } from "./charts/PersonalityRadarChart";

interface Trait {
  trait_id: string;
  trait_name: string;
  band: string;
  score: number;
}

interface IdentityOverviewData {
  personality_archetype: {
    archetype_name: string;
    archetype_description: string;
    confidence_score: number;
    emotional_stability: number;
    adaptability_score: number;
  };
  personality_snapshot: Trait[];
  one_line_insight: string;
}

interface IdentityOverviewSectionProps {
  data: IdentityOverviewData;
  traitInsights?: any[];
}

export function IdentityOverviewSection({ data, traitInsights = [] }: IdentityOverviewSectionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const { personality_archetype, personality_snapshot, one_line_insight } = data;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 65) return "text-blue-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100 border-green-300";
    if (score >= 65) return "bg-blue-100 border-blue-300";
    if (score >= 50) return "bg-amber-100 border-amber-300";
    return "bg-red-100 border-red-300";
  };

  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl shadow-2xl overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-48 -mt-48 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-2xl -ml-36 -mb-36"></div>
      <div className="absolute inset-0 bg-[url('/images/psychometric-test.png')] bg-cover bg-center opacity-10"></div>

      <div className="relative z-10 p-4 sm:p-6 md:p-8 lg:p-12 text-white">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6 border border-white/30">
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline">Personal Intelligence Report</span>
          <span className="sm:hidden">Report</span>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
          {/* Left: Archetype & Insight */}
          <div className={`space-y-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Personality Archetype */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-bold">Your Personality Archetype</h2>
                  <p className="text-xs sm:text-sm text-blue-200">Core identity pattern</p>
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                {personality_archetype.archetype_name}
              </h3>
              <p className="text-blue-100 leading-relaxed text-sm sm:text-base">
                {personality_archetype.archetype_description}
              </p>
            </div>

            {/* One-Line Insight */}
            <div className="bg-gradient-to-r from-blue-600/30 to-indigo-600/30 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
              <div className="flex items-start gap-2 sm:gap-3">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 mt-0.5 sm:mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-blue-200 uppercase tracking-wide mb-1 sm:mb-2">Key Insight</p>
                  <p className="text-base sm:text-lg font-medium text-white leading-relaxed italic">
                    "{one_line_insight}"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Core Scores */}
          <div className={`space-y-3 sm:space-y-4 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Confidence Score */}
            <div className={`bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 ${getScoreBgColor(personality_archetype.confidence_score)}`}>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs sm:text-sm font-semibold text-blue-200 uppercase tracking-wide mb-0.5 sm:mb-1">Confidence</p>
                  <p className="text-xs text-blue-300 hidden sm:block">Self-assurance & decisiveness</p>
                </div>
                <div className={`text-3xl sm:text-4xl font-bold flex-shrink-0 ${getScoreColor(personality_archetype.confidence_score)}`}>
                  {personality_archetype.confidence_score}
                </div>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-1000"
                  style={{
                    width: `${personality_archetype.confidence_score}%`,
                    backgroundColor: personality_archetype.confidence_score >= 80 ? '#10b981' : personality_archetype.confidence_score >= 65 ? '#3b82f6' : '#f59e0b'
                  }}
                />
              </div>
            </div>

            {/* Emotional Stability */}
            <div className={`bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 ${getScoreBgColor(personality_archetype.emotional_stability)}`}>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs sm:text-sm font-semibold text-blue-200 uppercase tracking-wide mb-0.5 sm:mb-1">Emotional Stability</p>
                  <p className="text-xs text-blue-300 hidden sm:block">Resilience & composure</p>
                </div>
                <div className={`text-3xl sm:text-4xl font-bold flex-shrink-0 ${getScoreColor(personality_archetype.emotional_stability)}`}>
                  {personality_archetype.emotional_stability}
                </div>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-1000 delay-100"
                  style={{
                    width: `${personality_archetype.emotional_stability}%`,
                    backgroundColor: personality_archetype.emotional_stability >= 80 ? '#10b981' : personality_archetype.emotional_stability >= 65 ? '#3b82f6' : '#f59e0b'
                  }}
                />
              </div>
            </div>

            {/* Adaptability */}
            <div className={`bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 ${getScoreBgColor(personality_archetype.adaptability_score)}`}>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs sm:text-sm font-semibold text-blue-200 uppercase tracking-wide mb-0.5 sm:mb-1">Adaptability</p>
                  <p className="text-xs text-blue-300 hidden sm:block">Flexibility & change readiness</p>
                </div>
                <div className={`text-3xl sm:text-4xl font-bold flex-shrink-0 ${getScoreColor(personality_archetype.adaptability_score)}`}>
                  {personality_archetype.adaptability_score}
                </div>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-1000 delay-200"
                  style={{
                    width: `${personality_archetype.adaptability_score}%`,
                    backgroundColor: personality_archetype.adaptability_score >= 80 ? '#10b981' : personality_archetype.adaptability_score >= 65 ? '#3b82f6' : '#f59e0b'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Personality Radar Chart */}
        <div className={`mt-4 sm:mt-6 md:mt-8 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-white/20">
            <PersonalityRadarChart 
              traits={personality_snapshot} 
              traitInsights={traitInsights}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
