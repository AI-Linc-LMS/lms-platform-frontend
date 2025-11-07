import { useState, useEffect } from "react";
import { InterviewRecord } from "../index";
import { mockInterviewAPI, InterviewReport } from "../services/api";
import { CircularProgress, Chip } from "@mui/material";

interface InterviewDetailViewProps {
  record: InterviewRecord;
  onBack: () => void;
}

const InterviewDetailView = ({ record, onBack }: InterviewDetailViewProps) => {
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        try {
          const data = await mockInterviewAPI.getInterviewReport(record.id);
          setReport(data);
        } catch (apiError) {
          // Use mock report if API fails
          setReport(mockReport);
        }
      } catch (error) {
        // Fallback to mock report
        setReport(mockReport);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [record.id]);

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-600";
    if (score >= 60) return "from-orange-500 to-yellow-600";
    return "from-red-500 to-rose-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CircularProgress size={60} />
      </div>
    );
  }

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

        <div className={`bg-gradient-to-r ${getScoreGradient(record.score || 0)} text-white rounded-2xl p-8 shadow-2xl`}>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {record.topic} Interview
              </h2>
              <p className="text-white/90 mb-3">{formatDate(record.date)}</p>
              <Chip
                label={record.status.toUpperCase()}
                className="bg-white/20 text-white font-bold"
              />
            </div>
            <div className="text-right">
              <p className="text-sm text-white/80 mb-1">Overall Score</p>
              <p className="text-6xl font-bold drop-shadow-lg">
                {record.status === "abandoned" ? "-" : `${record.score}%`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <p className="text-sm text-gray-600 mb-2 flex items-center">
            <span className="mr-2">📊</span> Difficulty
          </p>
          <p className="text-2xl font-bold capitalize text-gray-800">
            {record.difficulty}
          </p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <p className="text-sm text-gray-600 mb-2 flex items-center">
            <span className="mr-2">⏱️</span> Duration
          </p>
          <p className="text-2xl font-bold text-gray-800">
            {formatDuration(record.duration)}
          </p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <p className="text-sm text-gray-600 mb-2 flex items-center">
            <span className="mr-2">✅</span> Questions
          </p>
          <p className="text-2xl font-bold text-gray-800">
            {record.questionsAnswered}/{record.totalQuestions}
          </p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <p className="text-sm text-gray-600 mb-2 flex items-center">
            <span className="mr-2">🎯</span> Status
          </p>
          <p className="text-2xl font-bold capitalize text-gray-800">
            {record.status}
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      {report && record.status === "completed" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
            <p className="text-sm text-gray-600 mb-3">Technical Accuracy</p>
            <div className="relative">
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
                  style={{ width: `${report.technicalAccuracy}%` }}
                ></div>
              </div>
              <p className="text-xl font-bold text-blue-600 mt-2">
                {report.technicalAccuracy}%
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
            <p className="text-sm text-gray-600 mb-3">Communication Skills</p>
            <div className="relative">
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-600 transition-all"
                  style={{ width: `${report.communicationSkills}%` }}
                ></div>
              </div>
              <p className="text-xl font-bold text-purple-600 mt-2">
                {report.communicationSkills}%
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
            <p className="text-sm text-gray-600 mb-3">Confidence Level</p>
            <div className="relative">
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all"
                  style={{ width: `${report.confidence}%` }}
                ></div>
              </div>
              <p className="text-xl font-bold text-green-600 mt-2">
                {report.confidence}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recording Section */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">📹</span> Interview Recording
        </h3>
        <div className="bg-gradient-to-br from-gray-900 to-slate-800 rounded-xl aspect-video flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20"></div>
          <div className="text-center text-white relative z-10">
            <div className="text-6xl mb-4 animate-pulse">▶️</div>
            <p className="text-lg font-semibold mb-2">Interview Recording Available</p>
            <p className="text-sm text-gray-300">
              Duration: {formatDuration(record.duration)}
            </p>
            <button className="mt-4 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl font-semibold transition-all">
              Play Recording
            </button>
          </div>
        </div>
      </div>

      {/* Questions & Answers */}
      {report && report.questionScores && (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">💬</span> Questions & Performance
          </h3>
          <div className="space-y-4">
            {report.questionScores.map((qs, i) => (
              <div
                key={qs.questionId}
                className="border-l-4 border-indigo-500 bg-gray-50 rounded-r-xl pl-6 pr-4 py-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 mb-2">
                      <span className="text-indigo-600">Q{i + 1}:</span> Question about {record.topic}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">{qs.feedback}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <div
                      className={`text-2xl font-bold ${getScoreColor(qs.score)}`}
                    >
                      {qs.score}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Score</div>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getScoreGradient(qs.score)} transition-all`}
                    style={{ width: `${qs.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Sections */}
      {report && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">💪</span> Strengths
            </h3>
            <div className="space-y-3">
              {report.strengths.map((strength, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <p className="text-gray-700 flex-1">{strength}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">📈</span> Areas for Improvement
            </h3>
            <div className="space-y-3">
              {report.improvements.map((improvement, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <span className="text-orange-600 text-xl">→</span>
                  <p className="text-gray-700 flex-1">{improvement}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Behavioral Notes */}
      {report && report.behavioralNotes.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">👤</span> Behavioral Observations
          </h3>
          <div className="space-y-3">
            {report.behavioralNotes.map((note, i) => (
              <div key={i} className="flex items-start space-x-3">
                <span className="text-blue-600 text-xl">•</span>
                <p className="text-gray-700 flex-1">{note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Recommendation */}
      {report && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-6 shadow-2xl">
          <h3 className="text-xl font-bold mb-3 flex items-center">
            <span className="mr-2">🎯</span> Recommendation
          </h3>
          <p className="text-lg leading-relaxed">{report.recommendation}</p>
        </div>
      )}
    </div>
  );
};

// Mock report data
const mockReport: InterviewReport = {
  attemptId: "1",
  overallScore: 85,
  questionScores: [
    {
      questionId: "q1",
      score: 90,
      feedback: "Excellent understanding of core concepts with clear explanations.",
    },
    {
      questionId: "q2",
      score: 85,
      feedback: "Good answer, but could improve on explaining edge cases.",
    },
    {
      questionId: "q3",
      score: 80,
      feedback: "Solid response with room for optimization discussion.",
    },
  ],
  strengths: [
    "Strong grasp of fundamental concepts",
    "Clear and structured communication",
    "Good problem-solving approach",
    "Confident delivery and composure",
  ],
  improvements: [
    "Consider discussing time complexity in more detail",
    "Practice explaining trade-offs between approaches",
    "Work on providing more real-world examples",
  ],
  behavioralNotes: [
    "Maintained good eye contact throughout",
    "Spoke clearly and at appropriate pace",
    "Showed enthusiasm for the subject matter",
  ],
  technicalAccuracy: 85,
  communicationSkills: 88,
  confidence: 82,
  recommendation:
    "Strong performance overall! You demonstrate solid technical knowledge and communication skills. Focus on deepening your understanding of algorithmic complexity and system design patterns to reach the next level. Keep practicing and you'll be ready for senior-level positions.",
};

export default InterviewDetailView;
