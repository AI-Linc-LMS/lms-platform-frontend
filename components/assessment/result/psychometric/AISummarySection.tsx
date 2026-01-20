"use client";

interface AISummarySectionProps {
  summary: {
    summary_text: string;
    generated_by: string;
    editable: boolean;
  };
}

export function AISummarySection({ summary }: AISummarySectionProps) {
  return (
    <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-2xl -ml-36 -mb-36"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-lg">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI-Generated Summary</h2>
            <p className="text-sm text-blue-100 mt-0.5">Powered by advanced AI analysis</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <p className="text-lg leading-relaxed text-white/95 font-medium">{summary.summary_text}</p>
        </div>
      </div>
    </div>
  );
}
