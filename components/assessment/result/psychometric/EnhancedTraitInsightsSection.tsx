"use client";

import { useState } from "react";

interface EnhancedTraitInsight {
  trait_id: string;
  trait_name: string;
  description: string;
  your_tendency: string;
  strength_level: number;
  behavioral_manifestation: string;
  real_world_implications: {
    study: string;
    job: string;
    teamwork: string;
  };
  potential_downside: string;
  strengths: string[];
  growth_suggestions: string[];
  real_life_example: string;
}

interface EnhancedTraitInsightsSectionProps {
  insights: EnhancedTraitInsight[];
}

export function EnhancedTraitInsightsSection({ insights }: EnhancedTraitInsightsSectionProps) {
  // Initialize all insights as expanded by default
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    insights.forEach((insight) => {
      initial[insight.trait_id] = true;
    });
    return initial;
  });
  const [selectedTrait, setSelectedTrait] = useState<string | null>(null);

  const toggleExpanded = (traitId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [traitId]: !prev[traitId],
    }));
    setSelectedTrait(selectedTrait === traitId ? null : traitId);
  };

  const getStrengthColor = (level: number) => {
    if (level >= 80) return "text-green-600 bg-green-100 border-green-300";
    if (level >= 65) return "text-blue-600 bg-blue-100 border-blue-300";
    if (level >= 50) return "text-amber-600 bg-amber-100 border-amber-300";
    return "text-red-600 bg-red-100 border-red-300";
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 border-2 border-slate-200">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">Personality Trait Deep Dive</h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-0.5 sm:mt-1 hidden sm:block">Multi-dimensional insights into your personality traits</p>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        {insights.map((insight) => {
          const isExpanded = expanded[insight.trait_id];
          const isSelected = selectedTrait === insight.trait_id;

          return (
            <div
              key={insight.trait_id}
              className={`border-2 rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300 ${
                isSelected
                  ? "border-indigo-400 shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50"
                  : "border-slate-200 hover:border-indigo-300 hover:shadow-lg bg-white"
              }`}
            >
              <button
                onClick={() => toggleExpanded(insight.trait_id)}
                className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 flex justify-between items-center transition-all duration-200"
              >
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 text-left min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-md flex-shrink-0">
                    {insight.trait_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-0.5 sm:mb-1 truncate">{insight.trait_name}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">{insight.description}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <div className={`px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-full border-2 ${getStrengthColor(insight.strength_level)}`}>
                      <span className="text-xs sm:text-sm font-bold">{insight.strength_level}/100</span>
                    </div>
                  </div>
                </div>
                <svg
                  className={`w-6 h-6 text-slate-500 transition-transform ml-4 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-6 pb-6 space-y-6 border-t border-slate-200 bg-white">
                  {/* Your Tendency */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 mt-4">
                    <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Your Tendency</p>
                    <p className="text-base text-slate-700 italic leading-relaxed">"{insight.your_tendency}"</p>
                  </div>

                  {/* Behavioral Manifestation */}
                  <div>
                    <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">Behavioral Manifestation</p>
                    <p className="text-base text-slate-600 leading-relaxed">{insight.behavioral_manifestation}</p>
                  </div>

                  {/* Real-World Implications */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">In Study</p>
                      <p className="text-sm text-slate-700">{insight.real_world_implications.study}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">In Job</p>
                      <p className="text-sm text-slate-700">{insight.real_world_implications.job}</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">In Teamwork</p>
                      <p className="text-sm text-slate-700">{insight.real_world_implications.teamwork}</p>
                    </div>
                  </div>

                  {/* Strengths & Growth Grid */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Strengths
                      </h4>
                      <ul className="space-y-2">
                        {insight.strengths.map((strength, i) => (
                          <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                            <span className="text-green-600 mt-1">•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                      <h4 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Growth Suggestions
                      </h4>
                      <ul className="space-y-2">
                        {insight.growth_suggestions.map((suggestion, i) => (
                          <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                            <span className="text-amber-600 mt-1">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Potential Downside */}
                  <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                    <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Potential Downside (If Unmanaged)
                    </h4>
                    <p className="text-sm text-slate-700">{insight.potential_downside}</p>
                  </div>

                  {/* Real-Life Example */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Real-life Example</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{insight.real_life_example}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
