"use client";

interface CareerOrientationSectionProps {
  career: {
    aligned_role_clusters: string[];
    workplace_fit_note: string;
  };
}

export function CareerOrientationSection({ career }: CareerOrientationSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Career Orientation</h2>
          <p className="text-sm text-slate-500 mt-0.5">Roles that align with your personality</p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">Aligned Role Clusters</p>
        <div className="flex flex-wrap gap-3">
          {career.aligned_role_clusters.map((role, index) => (
            <span
              key={index}
              className="group px-5 py-2.5 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 rounded-xl text-sm font-semibold border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all duration-200 hover:scale-105"
            >
              {role}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-5 border-t border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-slate-700 font-medium leading-relaxed italic">"{career.workplace_fit_note}"</p>
        </div>
      </div>
    </div>
  );
}
