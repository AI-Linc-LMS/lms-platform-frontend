"use client";

interface Trait {
  trait_id: string;
  trait_name: string;
  band: string;
  score?: number;
}

interface PersonalitySnapshotSectionProps {
  traits: Trait[];
}

export function PersonalitySnapshotSection({ traits }: PersonalitySnapshotSectionProps) {
  const getBandColor = (band: string) => {
    const bandLower = band.toLowerCase();
    if (bandLower === "high" || bandLower === "analytical") {
      return "bg-green-100 text-green-700";
    }
    if (bandLower === "balanced") {
      return "bg-blue-100 text-blue-700";
    }
    if (bandLower === "moderate") {
      return "bg-amber-100 text-amber-700";
    }
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Personality Snapshot</h2>
          <p className="text-sm text-slate-500 mt-0.5">Your personality profile at a glance</p>
        </div>
      </div>

      <div className="space-y-3">
        {traits.map((trait, index) => (
          <div
            key={trait.trait_id}
            className="group flex justify-between items-center p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 hover:shadow-md"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="text-slate-700 font-semibold text-base">{trait.trait_name}</span>
            </div>
            <div className="flex items-center gap-3">
              {trait.score !== undefined && (
                <div className="text-sm font-bold text-slate-400">
                  {trait.score}/100
                </div>
              )}
              <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${getBandColor(trait.band)}`}>
                {trait.band}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
