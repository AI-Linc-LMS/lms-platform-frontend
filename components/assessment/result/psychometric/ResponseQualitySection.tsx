"use client";

interface ResponseQualitySectionProps {
  quality: {
    consistency_level: string;
    random_response_risk: string;
    overthinking_indicator: string;
    confidence_note: string;
  };
}

export function ResponseQualitySection({ quality }: ResponseQualitySectionProps) {
  const getQualityIcon = (level: string) => {
    const levelLower = level.toLowerCase();
    if (levelLower === "high" || levelLower === "low") {
      return "✓";
    }
    return "ℹ";
  };

  const getQualityColor = (level: string) => {
    const levelLower = level.toLowerCase();
    if (levelLower === "high" || levelLower === "low") {
      return "text-green-600";
    }
    return "text-amber-600";
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Response Quality</h2>
          <p className="text-sm text-slate-500 mt-0.5">Assessment reliability indicators</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-green-300 hover:bg-green-50/50 transition-all duration-200">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-2xl font-bold ${getQualityColor(quality.consistency_level)}`}>
              {getQualityIcon(quality.consistency_level)}
            </span>
            <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Consistency</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{quality.consistency_level}</p>
        </div>
        
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-green-300 hover:bg-green-50/50 transition-all duration-200">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-2xl font-bold ${getQualityColor(quality.random_response_risk)}`}>
              {getQualityIcon(quality.random_response_risk)}
            </span>
            <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Response Risk</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{quality.random_response_risk}</p>
        </div>
        
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all duration-200">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-2xl font-bold ${getQualityColor(quality.overthinking_indicator)}`}>
              {getQualityIcon(quality.overthinking_indicator)}
            </span>
            <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Overthinking</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{quality.overthinking_indicator}</p>
        </div>
      </div>

      <div className="pt-5 border-t border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-slate-700 font-medium leading-relaxed">"{quality.confidence_note}"</p>
        </div>
      </div>
    </div>
  );
}
