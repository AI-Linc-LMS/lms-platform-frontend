"use client";

import { useState } from "react";

interface TraitInsight {
  trait_id: string;
  trait_name: string;
  description: string;
  your_tendency: string;
  strengths: string[];
  growth_suggestions: string[];
  real_life_example: string;
}

interface TraitInsightsSectionProps {
  insights: TraitInsight[];
}

export function TraitInsightsSection({ insights }: TraitInsightsSectionProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpanded = (traitId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [traitId]: !prev[traitId],
    }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Trait Insights</h2>
          <p className="text-sm text-slate-500 mt-0.5">Deep dive into your personality traits</p>
        </div>
      </div>

      <div className="space-y-4">
        {insights.map((insight) => {
          const isExpanded = expanded[insight.trait_id];

          return (
            <div
              key={insight.trait_id}
              className="border border-slate-200 rounded-xl overflow-hidden transition-all hover:border-indigo-300 hover:shadow-md"
            >
              <button
                onClick={() => toggleExpanded(insight.trait_id)}
                className="w-full px-5 py-4 flex justify-between items-center hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200"
              >
                <h3 className="text-lg font-semibold text-slate-900 text-left">
                  {insight.trait_name}
                </h3>
                <svg
                  className={`w-5 h-5 text-slate-500 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 space-y-4 border-t border-slate-100">
                  <p className="text-slate-600 pt-4">{insight.description}</p>

                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <p className="text-slate-700 italic">"{insight.your_tendency}"</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                        <span>✓</span> Strengths
                      </h4>
                      <ul className="space-y-1.5">
                        {insight.strengths.map((strength, i) => (
                          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                            <span className="text-green-600 mt-1">•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                        <span>→</span> Growth Suggestions
                      </h4>
                      <ul className="space-y-1.5">
                        {insight.growth_suggestions.map((suggestion, i) => (
                          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                            <span className="text-amber-600 mt-1">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Real-life Example
                    </p>
                    <p className="text-sm text-slate-700">{insight.real_life_example}</p>
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
