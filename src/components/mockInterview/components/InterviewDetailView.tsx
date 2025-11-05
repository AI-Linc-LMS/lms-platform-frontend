// components/InterviewDetailView.tsx
import { InterviewRecord } from "../index";

interface InterviewDetailViewProps {
  record: InterviewRecord;
  onBack: () => void;
}

const InterviewDetailView = ({ record, onBack }: InterviewDetailViewProps) => {
  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="py-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="mb-4 px-4 py-2 text-indigo-600 hover:text-indigo-800 font-semibold transition-colors flex items-center space-x-2"
        >
          <span>←</span>
          <span>Back to List</span>
        </button>

        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {record.topic} Interview
              </h2>
              <p className="text-indigo-100">{formatDate(record.date)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-indigo-100 mb-1">Score</p>
              <p className="text-5xl font-bold">
                {record.status === "abandoned" ? "-" : `${record.score}%`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <p className="text-sm text-gray-600 mb-2">Difficulty</p>
          <p className="text-2xl font-bold capitalize text-gray-800">
            {record.difficulty}
          </p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <p className="text-sm text-gray-600 mb-2">Duration</p>
          <p className="text-2xl font-bold text-gray-800">
            {formatDuration(record.duration)}
          </p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <p className="text-sm text-gray-600 mb-2">Questions</p>
          <p className="text-2xl font-bold text-gray-800">
            {record.questionsAnswered}/{record.totalQuestions}
          </p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <p className="text-sm text-gray-600 mb-2">Status</p>
          <p className="text-2xl font-bold capitalize text-gray-800">
            {record.status}
          </p>
        </div>
      </div>

      {/* Recording Section */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          📹 Interview Recording
        </h3>
        <div className="bg-gray-900 rounded-xl aspect-video flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-6xl mb-4">▶️</div>
            <p>Interview Recording</p>
            <p className="text-sm text-gray-400">
              Duration: {formatDuration(record.duration)}
            </p>
          </div>
        </div>
      </div>

      {/* Questions & Answers */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          💬 Questions & Answers
        </h3>
        <div className="space-y-4">
          {[...Array(record.questionsAnswered)].map((_, i) => (
            <div key={i} className="border-l-4 border-indigo-500 pl-4 py-2">
              <p className="font-semibold text-gray-800 mb-2">
                Q{i + 1}: Sample question about {record.topic}?
              </p>
              <p className="text-gray-600 text-sm mb-2">
                Your answer: Lorem ipsum dolor sit amet, consectetur adipiscing
                elit...
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-green-600 font-semibold">
                  ✓ Correct
                </span>
                <span className="text-xs text-gray-500">
                  Score: {Math.floor(Math.random() * 20) + 80}/100
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">✨ AI Feedback</h3>
        <div className="space-y-3 text-gray-700">
          <p>• Strong understanding of core concepts</p>
          <p>• Good problem-solving approach</p>
          <p>• Consider improving time complexity analysis</p>
          <p>• Excellent communication skills</p>
        </div>
      </div>
    </div>
  );
};

export default InterviewDetailView;
