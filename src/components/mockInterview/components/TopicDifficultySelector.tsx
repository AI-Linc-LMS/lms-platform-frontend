import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";

interface TopicDifficultySelectorProps {
  interviewType: "fresh" | "history" | null;
  onStart: (topic: string, difficulty: string) => void;
  onBack: () => void;
}

// SVG Icon Components
const AIIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    />
  </svg>
);

const BookIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);

const TargetIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
    <circle cx="12" cy="12" r="3" strokeWidth={2} />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    />
  </svg>
);

const loadingSteps = [
  {
    icon: AIIcon,
    title: "Generating AI Agent",
    description: "Creating your personalized interview assistant...",
  },
  {
    icon: BookIcon,
    title: "Selecting Questions",
    description: "Curating questions based on your topic and difficulty...",
  },
  {
    icon: TargetIcon,
    title: "Preparing Interview",
    description: "Setting up the interview environment...",
  },
  {
    icon: SparklesIcon,
    title: "Finalizing Setup",
    description: "Almost ready to start your interview...",
  },
];

const TopicDifficultySelector = ({
  onStart,
  onBack,
}: TopicDifficultySelectorProps) => {
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const topics = [
    { value: "javascript", label: "JavaScript" },
    { value: "react", label: "React" },
    { value: "typescript", label: "TypeScript" },
    { value: "nodejs", label: "Node.js" },
    { value: "python", label: "Python" },
    { value: "system-design", label: "System Design" },
    { value: "dsa", label: "Data Structures & Algorithms" },
    { value: "algorithms", label: "Algorithms" },
  ];

  const difficulties = [
    { value: "Easy", label: "Easy" },
    { value: "Medium", label: "Medium" },
    { value: "Hard", label: "Hard" },
  ];

  useEffect(() => {
    if (isLoading) {
      setCurrentStep(0);
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < loadingSteps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 2000); // Change step every 2 seconds

      return () => clearInterval(interval);
    } else {
      setCurrentStep(0);
    }
  }, [isLoading]);

  const handleStart = async () => {
    if (selectedTopic && selectedDifficulty && !isLoading) {
      try {
        setIsLoading(true);
        setError(null);
        setCurrentStep(0);
        await onStart(selectedTopic, selectedDifficulty);
      } catch (err) {
        setIsLoading(false);
        setCurrentStep(0);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to start interview. Please try again."
        );
      }
    }
  };

  const handleGoBack = () => {
    navigate("/mock-interview");
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-3">
          Setup Your Mock Interview
        </h2>
        <p className="text-gray-600">
          Select the topic and difficulty level to begin your practice session
        </p>
      </div>

      {/* Selection Form */}
      <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
        {/* Topic Selection */}
        <div>
          <label
            htmlFor="topic"
            className="block text-sm font-semibold text-gray-700 mb-3"
          >
            Select Interview Topic
          </label>
          <select
            id="topic"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white text-gray-800"
          >
            <option value="">Choose the area you want to practice</option>
            {topics.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {topic.label}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Selection */}
        <div>
          <label
            htmlFor="difficulty"
            className="block text-sm font-semibold text-gray-700 mb-3"
          >
            Choose Difficulty Level
          </label>
          <select
            id="difficulty"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white text-gray-800"
          >
            <option value="">Select based on your skill level</option>
            {difficulties.map((difficulty) => (
              <option key={difficulty.value} value={difficulty.value}>
                {difficulty.label}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Summary */}
        {selectedTopic && selectedDifficulty && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Your Selection:
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                <div>
                  <p className="text-xs text-gray-500">Topic</p>
                  <p className="font-bold text-indigo-600 capitalize">
                    {topics.find((t) => t.value === selectedTopic)?.label}
                  </p>
                </div>
              </div>
              <div className="w-px h-10 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <svg
                  className={`w-6 h-6 ${
                    selectedDifficulty === "easy"
                      ? "text-green-600"
                      : selectedDifficulty === "medium"
                      ? "text-orange-600"
                      : "text-red-600"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-xs text-gray-500">Difficulty</p>
                  <p className="font-bold text-indigo-600 capitalize">
                    {selectedDifficulty}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            onClick={onBack}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:shadow-md transition-all flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back</span>
          </button>

          <button
            onClick={handleStart}
            disabled={!selectedTopic || !selectedDifficulty || isLoading}
            className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              selectedTopic && selectedDifficulty && !isLoading
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-xl transform hover:-translate-y-0.5"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <>
                <CircularProgress size={20} color="inherit" />
                <span>Starting...</span>
              </>
            ) : (
              "Start Interview →"
            )}
          </button>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid md:grid-cols-3 gap-4 mt-8">
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
          <svg
            className="w-8 h-8 text-indigo-600 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h4 className="font-semibold text-gray-800 mb-1">Focused Practice</h4>
          <p className="text-sm text-gray-600">
            Questions tailored to your selected topic
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
          <svg
            className="w-8 h-8 text-indigo-600 mb-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
              clipRule="evenodd"
            />
          </svg>
          <h4 className="font-semibold text-gray-800 mb-1">Voice Enabled</h4>
          <p className="text-sm text-gray-600">
            AI asks questions and records your answers
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
          <svg
            className="w-8 h-8 text-indigo-600 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h4 className="font-semibold text-gray-800 mb-1">
            Detailed Feedback
          </h4>
          <p className="text-sm text-gray-600">
            Get comprehensive reports after completion
          </p>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full p-8 border border-white/20 animate-fade-in">
            {/* Animated AI Agent Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                  {(() => {
                    const IconComponent = loadingSteps[currentStep].icon;
                    return <IconComponent className="w-12 h-12 text-white" />;
                  })()}
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full animate-ping opacity-20"></div>
              </div>
            </div>

            {/* Current Step Display */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2 animate-slide-up">
                {loadingSteps[currentStep].title}
              </h3>
              <p className="text-gray-600 animate-fade-in">
                {loadingSteps[currentStep].description}
              </p>
            </div>

            {/* Progress Steps */}
            <div className="space-y-3 mb-6">
              {loadingSteps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
                    index === currentStep
                      ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 scale-105"
                      : index < currentStep
                      ? "bg-green-50 border border-green-200"
                      : "bg-gray-50 border border-gray-200 opacity-50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      index === currentStep
                        ? "bg-indigo-600 text-white animate-bounce"
                        : index < currentStep
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 text-gray-500"
                    }`}
                  >
                    {index < currentStep ? (
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      (() => {
                        const IconComponent = step.icon;
                        return <IconComponent className="w-5 h-5" />;
                      })()
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-semibold text-sm transition-colors ${
                        index === currentStep
                          ? "text-indigo-700"
                          : index < currentStep
                          ? "text-green-700"
                          : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </p>
                    {index === currentStep && (
                      <p className="text-xs text-gray-600 mt-1">
                        {step.description}
                      </p>
                    )}
                  </div>
                  {index === currentStep && (
                    <div className="animate-spin">
                      <CircularProgress size={20} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((currentStep + 1) / loadingSteps.length) * 100}%`,
                }}
              ></div>
            </div>

            {/* Loading Text */}
            <p className="text-center text-sm text-gray-500 animate-pulse">
              Please wait while we prepare everything...
            </p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && !isLoading && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full p-8 border border-white/20 animate-fade-in">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Error Message */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Something Went Wrong
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setError(null);
                  onBack();
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span>Back</span>
              </button>
              <button
                onClick={handleGoBack}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
              >
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicDifficultySelector;
