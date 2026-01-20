"use client";

interface GrowthRoadmapSectionProps {
  roadmap: Array<{
    area: string;
    suggested_action: string;
  }>;
}

export function GrowthRoadmapSection({ roadmap }: GrowthRoadmapSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Growth Roadmap</h2>
          <p className="text-sm text-slate-500 mt-0.5">Actionable steps for development</p>
        </div>
      </div>

      <div className="space-y-4">
        {roadmap.map((item, index) => (
          <div
            key={index}
            className="group flex gap-4 p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-gradient-to-br hover:from-violet-50 hover:to-purple-50 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-lg">{index + 1}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 mb-2 text-lg">{item.area}</h3>
              <p className="text-slate-600 text-sm flex items-start gap-2 leading-relaxed">
                <span className="text-violet-600 mt-1 font-bold">→</span>
                <span>{item.suggested_action}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
