interface InterviewTypeSelectorProps {
  onSelect: (type: "fresh" | "history") => void;
  onViewScheduled: () => void;
}

const InterviewTypeSelector = ({ onSelect, onViewScheduled }: InterviewTypeSelectorProps) => {
  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
        Choose Interview Type
      </h2>
      <p className="text-center text-gray-600 mb-12">
        Start fresh or continue your progress
      </p>

      {/* Scheduled Interviews Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={onViewScheduled}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105"
        >
          View Scheduled Interviews
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Fresh Interview Card */}
        <button
          onClick={() => onSelect("fresh")}
          className="group relative bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 hover:border-green-400 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
        >
          <div className="absolute top-4 right-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform">
              ✨
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Fresh Interview
            </h3>
            <p className="text-gray-600 mb-6">
              Start a brand new mock interview session with random questions
            </p>

            <div className="space-y-3 text-left">
              <div className="flex items-center text-sm text-gray-700">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                New question set
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Choose topic & difficulty
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                AI-powered feedback
              </div>
            </div>
          </div>

          <div className="mt-8 bg-green-500 text-white py-3 rounded-xl font-semibold group-hover:bg-green-600 transition-colors">
            Start Fresh
          </div>
        </button>

        {/* View History Card */}
        <button
          onClick={() => onSelect("history")}
          className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
        >
          <div className="absolute top-4 right-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform">
              📚
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Previous Interviews
            </h3>
            <p className="text-gray-600 mb-6">
              Review or continue your past interview sessions
            </p>

            <div className="space-y-3 text-left">
              <div className="flex items-center text-sm text-gray-700">
                <svg
                  className="w-5 h-5 text-blue-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                View past sessions
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <svg
                  className="w-5 h-5 text-blue-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Track your progress
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <svg
                  className="w-5 h-5 text-blue-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Review feedback
              </div>
            </div>
          </div>

          <div className="mt-8 bg-blue-500 text-white py-3 rounded-xl font-semibold group-hover:bg-blue-600 transition-colors">
            View History
          </div>
        </button>
      </div>
    </div>
  );
};

export default InterviewTypeSelector;
