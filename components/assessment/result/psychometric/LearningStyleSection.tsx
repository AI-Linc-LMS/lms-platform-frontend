"use client";

interface LearningStyleSectionProps {
  learningStyle: {
    primary_style: string;
    attention_pattern: string;
    feedback_preference: string;
    recommended_content_formats: string[];
    visual_percentage: number;
    auditory_percentage: number;
    kinesthetic_percentage: number;
  };
}

export function LearningStyleSection({ learningStyle }: LearningStyleSectionProps) {
  const formatIcons: Record<string, string> = {
    "Video lessons": "🎥",
    "Interactive MCQs": "📝",
    "Hands-on exercises": "🔧",
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-slate-200 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Learning Style</h2>
          <p className="text-sm text-slate-500 mt-0.5">How you learn best</p>
        </div>
      </div>

      <div className="space-y-6 mb-6">
        <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
          <p className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-wide">Primary Style</p>
          <p className="text-2xl font-bold text-slate-900">
            {learningStyle.primary_style}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-200">
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Attention Pattern</p>
            <p className="text-lg font-bold text-slate-900">{learningStyle.attention_pattern}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-200">
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Feedback Preference</p>
            <p className="text-lg font-bold text-slate-900">{learningStyle.feedback_preference}</p>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-200">
        <p className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">Recommended Content Formats</p>
        <div className="flex flex-wrap gap-3">
          {learningStyle.recommended_content_formats.map((format, index) => (
            <button
              key={index}
              className="group px-5 py-3 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 rounded-xl text-sm font-semibold transition-all duration-200 border border-blue-200 hover:border-blue-400 hover:shadow-md flex items-center gap-2"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">{formatIcons[format] || "📚"}</span>
              <span>{format}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
