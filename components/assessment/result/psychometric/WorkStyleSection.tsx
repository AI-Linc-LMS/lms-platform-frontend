"use client";

interface WorkStyleSectionProps {
  preferences: {
    environment: string;
    team_preference: string;
    pressure_handling: string;
    routine_tolerance: string;
  };
}

export function WorkStyleSection({ preferences }: WorkStyleSectionProps) {
  const items = [
    { label: "Environment", value: preferences.environment, icon: "🏢" },
    { label: "Team Preference", value: preferences.team_preference, icon: "👥" },
    { label: "Pressure Handling", value: preferences.pressure_handling, icon: "⚡" },
    { label: "Routine Tolerance", value: preferences.routine_tolerance, icon: "📅" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Work Style Preferences</h2>
          <p className="text-sm text-slate-500 mt-0.5">Your ideal work environment</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="group p-5 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 hover:border-amber-300 hover:bg-gradient-to-br hover:from-amber-50 hover:to-orange-50 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl group-hover:scale-110 transition-transform">{item.icon}</div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">{item.label}</p>
                <p className="text-lg font-bold text-slate-900">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
