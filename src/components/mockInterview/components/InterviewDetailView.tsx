import { useState, useEffect } from "react";
import { InterviewRecord } from "../index";
import { mockInterviewAPI, InterviewAttempt } from "../services/api";
import { CircularProgress, Chip } from "@mui/material";
import BackButton from "./BackButton";

interface InterviewDetailViewProps {
  record: InterviewRecord;
  onBack: () => void;
}

const InterviewDetailView = ({ record, onBack }: InterviewDetailViewProps) => {
  const [interviewData, setInterviewData] = useState<InterviewAttempt | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterviewDetails = async () => {
      if (!record.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await mockInterviewAPI.getInterviewAttempt(record.id);
        setInterviewData(data);
      } catch (error) {
        // Set error state, will be handled by the null check below
        setInterviewData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviewDetails();
  }, [record.id]);

  const formatDuration = (minutes: number): string => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
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

  if (!interviewData) {
    return (
      <>
        <div className="mb-4">
          <BackButton onClick={onBack} label="Back to List" />
        </div>
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-600">Interview details not found.</p>
        </div>
      </>
    );
  }

  const overallScore = interviewData.evaluation_score?.overall_percentage || 0;

  return (
    <div className="py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <BackButton onClick={onBack} label="Back to List" />
        </div>

        <div
          className={`bg-gradient-to-r ${getScoreGradient(
            overallScore
          )} text-white rounded-2xl p-8 shadow-2xl`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {interviewData.title || `${interviewData.topic} Interview`}
              </h2>
              <p className="text-white/90 mb-3">
                {interviewData.scheduled_date_time &&
                  formatDate(interviewData.scheduled_date_time)}
              </p>
              <Chip
                label={interviewData.status.toUpperCase()}
                className="bg-white/20 text-white font-bold"
              />
            </div>
            <div className="text-right">
              <p className="text-sm text-white/80 mb-1">Overall Score</p>
              <p className="text-6xl font-bold drop-shadow-lg">
                {interviewData.status === "completed"
                  ? `${overallScore}%`
                  : "-"}
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
            {interviewData.difficulty}
          </p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <p className="text-sm text-gray-600 mb-2 flex items-center">
            <span className="mr-2">⏱️</span> Duration
          </p>
          <p className="text-2xl font-bold text-gray-800">
            {formatDuration(interviewData.duration_minutes || 0)}
          </p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <p className="text-sm text-gray-600 mb-2 flex items-center">
            <span className="mr-2">✅</span> Questions
          </p>
          <p className="text-2xl font-bold text-gray-800">
            {interviewData.interview_transcript?.metadata
              ?.completed_questions || 0}
            /{interviewData.questions_for_interview?.length || 0}
          </p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <p className="text-sm text-gray-600 mb-2 flex items-center">
            <span className="mr-2">🎯</span> Status
          </p>
          <p className="text-2xl font-bold capitalize text-gray-800">
            {interviewData.status}
          </p>
        </div>
      </div>

      {/* Questions & Answers */}
      {interviewData.questions_for_interview &&
        interviewData.evaluation_score?.question_scores && (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">💬</span> Questions & Performance
            </h3>
            <div className="space-y-4">
              {interviewData.questions_for_interview.map(
                (question: any, i: number) => {
                  const questionScores = interviewData.evaluation_score
                    ?.question_scores as any;
                  const questionScore = questionScores?.[String(question.id)];
                  const percentage = questionScore?.percentage || 0;

                  return (
                    <div
                      key={question.id}
                      className="border-l-4 border-indigo-500 bg-gray-50 rounded-r-xl pl-6 pr-4 py-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 mb-2">
                            <span className="text-indigo-600">Q{i + 1}:</span>{" "}
                            {question.question_text}
                          </p>
                          <Chip
                            label={question.type}
                            size="small"
                            className="mb-3 capitalize"
                            sx={{
                              backgroundColor: "#e0e7ff",
                              color: "#4338ca",
                            }}
                          />
                          {questionScore && (
                            <>
                              <p className="text-sm text-gray-600 mb-3">
                                {questionScore.feedback}
                              </p>
                              {questionScore.strengths &&
                                questionScore.strengths.length > 0 && (
                                  <div className="mb-2">
                                    <p className="text-xs font-semibold text-green-700 mb-1">
                                      Strengths:
                                    </p>
                                    <ul className="text-xs text-gray-600 list-disc list-inside">
                                      {questionScore.strengths.map(
                                        (s: string, idx: number) => (
                                          <li key={idx}>{s}</li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                              {questionScore.improvements &&
                                questionScore.improvements.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-orange-700 mb-1">
                                      Improvements:
                                    </p>
                                    <ul className="text-xs text-gray-600 list-disc list-inside">
                                      {questionScore.improvements.map(
                                        (imp: string, idx: number) => (
                                          <li key={idx}>{imp}</li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                            </>
                          )}
                        </div>
                        <div className="ml-4 text-right">
                          <div
                            className={`text-2xl font-bold ${getScoreColor(
                              percentage
                            )}`}
                          >
                            {percentage}%
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {questionScore?.score || 0}/
                            {questionScore?.max_score || 0}
                          </div>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${getScoreGradient(
                            percentage
                          )} transition-all`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

      {/* Feedback Sections */}
      {interviewData.evaluation_score && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          {interviewData.evaluation_score.strengths &&
            interviewData.evaluation_score.strengths.length > 0 && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">💪</span> Strengths
                </h3>
                <div className="space-y-3">
                  {interviewData.evaluation_score.strengths.map(
                    (strength: string, i: number) => (
                      <div key={i} className="flex items-start space-x-3">
                        <span className="text-green-600 text-xl">✓</span>
                        <p className="text-gray-700 flex-1">{strength}</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Areas for Improvement */}
          {interviewData.evaluation_score.areas_for_improvement &&
            interviewData.evaluation_score.areas_for_improvement.length > 0 && (
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">📈</span> Areas for Improvement
                </h3>
                <div className="space-y-3">
                  {interviewData.evaluation_score.areas_for_improvement.map(
                    (improvement: string, i: number) => (
                      <div key={i} className="flex items-start space-x-3">
                        <span className="text-orange-600 text-xl">→</span>
                        <p className="text-gray-700 flex-1">{improvement}</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Overall Feedback */}
      {interviewData.evaluation_score?.overall_feedback && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-6 shadow-2xl">
          <h3 className="text-xl font-bold mb-3 flex items-center">
            <span className="mr-2">🎯</span> Overall Feedback
          </h3>
          <p className="text-lg leading-relaxed">
            {interviewData.evaluation_score.overall_feedback}
          </p>
        </div>
      )}
    </div>
  );
};

export default InterviewDetailView;
