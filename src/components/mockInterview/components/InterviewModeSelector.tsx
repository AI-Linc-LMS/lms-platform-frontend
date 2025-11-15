import BackButton from "./BackButton";

interface InterviewModeSelectorProps {
  onSelectMode: (mode: "quick" | "scheduled") => void;
  onBack: () => void;
}

const InterviewModeSelector = ({
  onSelectMode,
  onBack,
}: InterviewModeSelectorProps) => {
  return (
    <div className="py-6">
      <div className="mb-6">
        <BackButton onClick={onBack} label="Back" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Choose Interview Mode
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Start */}
        <button
          onClick={() => onSelectMode("quick")}
          className="group relative bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-2 border-green-300 hover:border-green-400 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:scale-105 text-left"
        >
          <div className="flex items-start space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Quick Start
              </h3>
              <p className="text-sm text-green-700 font-semibold">
                Start Immediately
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-gray-700">
                Select topic and difficulty
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-gray-700">
                Questions generated instantly
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-gray-700">
                Begin interview right away
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-gray-700">Perfect for practice</p>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold">
              Go Quick →
            </div>
          </div>
        </button>

        {/* Scheduled Interview */}
        <button
          onClick={() => onSelectMode("scheduled")}
          className="group relative bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-2 border-indigo-300 hover:border-indigo-400 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:scale-105 text-left"
        >
          <div className="flex items-start space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Schedule Interview
              </h3>
              <p className="text-sm text-indigo-700 font-semibold">
                Plan Ahead
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-gray-700">
                Full topic and subtopic details
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-gray-700">
                Questions from AI system
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-gray-700">
                Set specific date and time
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-gray-700">
                Professional assessment
              </p>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold">
              Schedule →
            </div>
          </div>
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-3 flex items-center text-lg">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Which should you choose?
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-green-700 mb-2">
              Choose Quick Start if:
            </p>
            <ul className="space-y-1 text-gray-700">
              <li>• You want to practice right now</li>
              <li>• You need a fast interview session</li>
              <li>• You're doing multiple practice runs</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-indigo-700 mb-2">
              Choose Schedule if:
            </p>
            <ul className="space-y-1 text-gray-700">
              <li>• You want specific AI-generated questions</li>
              <li>• You need detailed topic/subtopic setup</li>
              <li>• You prefer to prepare in advance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewModeSelector;

