// components/TopicDifficultySelector.tsx
import { useState } from "react";

interface Topic {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Difficulty {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  badge: string;
}

interface TopicDifficultySelectorProps {
  interviewType: "fresh" | "continue" | null;
  onStart: (topic: string, difficulty: string) => void;
  onBack: () => void;
}

const TopicDifficultySelector = ({
  interviewType,
  onStart,
  onBack,
}: TopicDifficultySelectorProps) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
    null
  );

  const topics: Topic[] = [
    {
      id: "react",
      name: "React",
      icon: "⚛️",
      color: "from-cyan-500 to-blue-500",
    },
    {
      id: "javascript",
      name: "JavaScript",
      icon: "📜",
      color: "from-yellow-400 to-orange-500",
    },
    {
      id: "typescript",
      name: "TypeScript",
      icon: "🔷",
      color: "from-blue-600 to-indigo-600",
    },
    {
      id: "nodejs",
      name: "Node.js",
      icon: "🟢",
      color: "from-green-500 to-emerald-600",
    },
    {
      id: "system-design",
      name: "System Design",
      icon: "🏗️",
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "dsa",
      name: "Data Structures",
      icon: "🧮",
      color: "from-red-500 to-rose-600",
    },
  ];

  const difficulties: Difficulty[] = [
    {
      id: "easy",
      name: "Easy",
      icon: "🌱",
      description: "Perfect for beginners",
      color: "border-green-300 hover:border-green-500 bg-green-50",
      badge: "bg-green-500",
    },
    {
      id: "medium",
      name: "Medium",
      icon: "🔥",
      description: "Intermediate challenge",
      color: "border-orange-300 hover:border-orange-500 bg-orange-50",
      badge: "bg-orange-500",
    },
    {
      id: "hard",
      name: "Hard",
      icon: "⚡",
      description: "Advanced concepts",
      color: "border-red-300 hover:border-red-500 bg-red-50",
      badge: "bg-red-500",
    },
  ];

  const handleStart = () => {
    if (selectedTopic && selectedDifficulty) {
      onStart(selectedTopic, selectedDifficulty);
    }
  };

  return (
    <div className="py-8">
      {/* Topic Selection */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Select Interview Topic
        </h2>
        <p className="text-gray-600 mb-6">
          Choose the area you want to practice
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setSelectedTopic(topic.id)}
              className={`relative p-6 rounded-xl border-2 transition-all duration-300 transform hover:-translate-y-1 ${
                selectedTopic === topic.id
                  ? "border-indigo-500 shadow-lg scale-105"
                  : "border-gray-200 hover:border-indigo-300 hover:shadow-md"
              }`}
            >
              {selectedTopic === topic.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}

              <div
                className={`w-16 h-16 bg-gradient-to-br ${topic.color} rounded-xl flex items-center justify-center text-3xl mb-3 mx-auto`}
              >
                {topic.icon}
              </div>
              <h3 className="font-semibold text-gray-800 text-center">
                {topic.name}
              </h3>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Selection */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Choose Difficulty Level
        </h2>
        <p className="text-gray-600 mb-6">Select based on your skill level</p>

        <div className="grid md:grid-cols-3 gap-6">
          {difficulties.map((difficulty) => (
            <button
              key={difficulty.id}
              onClick={() => setSelectedDifficulty(difficulty.id)}
              className={`p-6 rounded-xl border-2 transition-all duration-300 transform hover:-translate-y-1 ${
                difficulty.color
              } ${
                selectedDifficulty === difficulty.id
                  ? "scale-105 shadow-xl"
                  : "shadow-md"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{difficulty.icon}</span>
                {selectedDifficulty === difficulty.id && (
                  <div
                    className={`w-8 h-8 ${difficulty.badge} rounded-full flex items-center justify-center`}
                  >
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {difficulty.name}
              </h3>
              <p className="text-sm text-gray-600">{difficulty.description}</p>
            </button>
          ))}
        </div>
      </div>

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
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-xl transform hover:-translate-y-1"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Start Interview →
        </button>
      </div>
    </div>
  );
};

export default TopicDifficultySelector;
