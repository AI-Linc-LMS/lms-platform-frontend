import { useState } from "react";

interface TopicDifficultySelectorProps {
  interviewType: "fresh" | "history" | null;
  onStart: (topic: string, difficulty: string) => void;
  onBack: () => void;
}

const TopicDifficultySelector = ({
  onStart,
  onBack,
}: TopicDifficultySelectorProps) => {
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");

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
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
  ];

  const handleStart = () => {
    if (selectedTopic && selectedDifficulty) {
      onStart(selectedTopic, selectedDifficulty);
    }
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
                <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
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
                <svg className={`w-6 h-6 ${
                  selectedDifficulty === "easy"
                    ? "text-green-600"
                    : selectedDifficulty === "medium"
                    ? "text-orange-600"
                    : "text-red-600"
                }`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
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
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:shadow-md transition-all"
          >
            ← Back
          </button>

          <button
            onClick={handleStart}
            disabled={!selectedTopic || !selectedDifficulty}
            className={`px-8 py-3 rounded-xl font-semibold transition-all ${
              selectedTopic && selectedDifficulty
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-xl transform hover:-translate-y-0.5"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Start Interview →
          </button>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid md:grid-cols-3 gap-4 mt-8">
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
          <svg className="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h4 className="font-semibold text-gray-800 mb-1">Focused Practice</h4>
          <p className="text-sm text-gray-600">
            Questions tailored to your selected topic
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
          <svg className="w-8 h-8 text-indigo-600 mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
          <h4 className="font-semibold text-gray-800 mb-1">Voice Enabled</h4>
          <p className="text-sm text-gray-600">
            AI asks questions and records your answers
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
          <svg className="w-8 h-8 text-indigo-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h4 className="font-semibold text-gray-800 mb-1">
            Detailed Feedback
          </h4>
          <p className="text-sm text-gray-600">
            Get comprehensive reports after completion
          </p>
        </div>
      </div>
    </div>
  );
};

export default TopicDifficultySelector;
