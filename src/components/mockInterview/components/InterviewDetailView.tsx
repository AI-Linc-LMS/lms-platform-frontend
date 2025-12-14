import { useState, useEffect } from "react";
import { InterviewRecord } from "../index";
import { mockInterviewAPI, InterviewAttempt } from "../services/api";
import { CircularProgress, Chip } from "@mui/material";
import BackButton from "./BackButton";
import { useNavigate } from "react-router-dom";

interface InterviewDetailViewProps {
  record: InterviewRecord;
}

const InterviewDetailView = ({ record }: InterviewDetailViewProps) => {
  const [interviewData, setInterviewData] = useState<InterviewAttempt | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const toTitleCase = (str: string) => {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Media stream cleanup effect
  useEffect(() => {
    const activeStreams = new Set<MediaStream>();
    let cleanupTimeout: number;

    // Function to stop all media streams
    const stopAllMediaStreams = () => {
      // Stop all tracked streams
      activeStreams.forEach((stream) => {
        stream.getTracks().forEach((track) => {
          if (track.readyState !== "ended") {
            track.stop();
          }
        });
      });
      activeStreams.clear();

      // Stop streams from video elements
      document.querySelectorAll("video").forEach((video) => {
        const stream = video.srcObject as MediaStream | null;
        if (stream) {
          stream.getTracks().forEach((track) => {
            if (track.readyState !== "ended") {
              track.stop();
            }
          });
          video.srcObject = null;
          video.pause();
          video.load();
        }
      });

      // Stop streams from audio elements
      document.querySelectorAll("audio").forEach((audio) => {
        const stream = audio.srcObject as MediaStream | null;
        if (stream) {
          stream.getTracks().forEach((track) => {
            if (track.readyState !== "ended") {
              track.stop();
            }
          });
          audio.srcObject = null;
          audio.pause();
          audio.load();
        }
      });

      // Clear global references if they exist
      if ((window as any).__globalMediaStreams) {
        (window as any).__globalMediaStreams.forEach((stream: MediaStream) => {
          stream.getTracks().forEach((track: MediaStreamTrack) => {
            if (track.readyState !== "ended") {
              track.stop();
            }
          });
        });
        (window as any).__globalMediaStreams = [];
      }
    };

    // Track new streams that appear
    const trackNewStreams = () => {
      document.querySelectorAll("video, audio").forEach((element) => {
        const mediaElement = element as HTMLMediaElement;
        const stream = mediaElement.srcObject as MediaStream | null;
        if (stream && !activeStreams.has(stream)) {
          activeStreams.add(stream);
        }
      });
    };

    // Set up MutationObserver to watch for new media elements
    const observer = new MutationObserver(() => {
      trackNewStreams();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Immediate cleanup - stop any existing streams
    cleanupTimeout = setTimeout(() => {
      stopAllMediaStreams();
      trackNewStreams(); // Track any that appear after initial cleanup
    }, 100);

    // Cleanup on unmount
    return () => {
      clearTimeout(cleanupTimeout);
      observer.disconnect();
      stopAllMediaStreams();
    };
  }, []); // Run once on mount

  // Fetch interview details
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
        console.error("Failed to fetch interview details:", error);
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
          <BackButton
            onClick={() => {
              navigate("/mock-interview/previous");
            }}
            label="Back to List"
          />
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
          <BackButton
            onClick={() => {
              navigate("/mock-interview/previous");
            }}
            label="Back to List"
          />
        </div>

        <div
          className={`bg-gradient-to-r ${getScoreGradient(
            overallScore
          )} text-white rounded-2xl p-8 shadow-2xl`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {toTitleCase((interviewData.title as string) || "") ||
                  `${toTitleCase(interviewData.topic)} Interview`}
              </h2>
              <p className="text-white/90 mb-3">
                {interviewData.scheduled_date_time &&
                  formatDate(interviewData.scheduled_date_time)}
              </p>
              <Chip
                label={interviewData.status.toUpperCase()}
                sx={{ color: "#ffffff", backgroundColor: "#ffffff/20" }}
                className="text-white font-bold capitalize"
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

      {/* Proctoring Statistics */}
      {interviewData.interview_transcript?.metadata && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-6 mb-8 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">🔍</span> Proctoring Report
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* No Face Detected */}
            {(interviewData.interview_transcript.metadata.noFaceIncidents !==
              undefined ||
              interviewData.interview_transcript.metadata.noFaceDuration) && (
              <div
                className={`bg-white rounded-lg p-4 border-2 ${
                  (interviewData.interview_transcript.metadata
                    .noFaceIncidents || 0) > 5
                    ? "border-red-300"
                    : (interviewData.interview_transcript.metadata
                        .noFaceIncidents || 0) > 2
                    ? "border-orange-300"
                    : "border-green-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">
                    Face Not Detected
                  </p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      (interviewData.interview_transcript.metadata
                        .noFaceIncidents || 0) > 5
                        ? "bg-red-100 text-red-700"
                        : (interviewData.interview_transcript.metadata
                            .noFaceIncidents || 0) > 2
                        ? "bg-orange-100 text-orange-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {(interviewData.interview_transcript.metadata
                      .noFaceIncidents || 0) > 5
                      ? "HIGH"
                      : (interviewData.interview_transcript.metadata
                          .noFaceIncidents || 0) > 2
                      ? "MEDIUM"
                      : "LOW"}
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-800 mb-1">
                  {interviewData.interview_transcript.metadata
                    .noFaceIncidents || 0}
                </p>
                <p className="text-sm text-gray-600">
                  incidents (
                  {interviewData.interview_transcript.metadata.noFaceDuration ||
                    0}
                  s total)
                </p>
              </div>
            )}

            {/* Looking Away */}
            {(interviewData.interview_transcript.metadata
              .lookingAwayIncidents !== undefined ||
              interviewData.interview_transcript.metadata
                .lookingAwayDuration) && (
              <div
                className={`bg-white rounded-lg p-4 border-2 ${
                  (interviewData.interview_transcript.metadata
                    .lookingAwayIncidents || 0) > 10
                    ? "border-red-300"
                    : (interviewData.interview_transcript.metadata
                        .lookingAwayIncidents || 0) > 5
                    ? "border-orange-300"
                    : "border-green-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">
                    Looking Away
                  </p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      (interviewData.interview_transcript.metadata
                        .lookingAwayIncidents || 0) > 10
                        ? "bg-red-100 text-red-700"
                        : (interviewData.interview_transcript.metadata
                            .lookingAwayIncidents || 0) > 5
                        ? "bg-orange-100 text-orange-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {(interviewData.interview_transcript.metadata
                      .lookingAwayIncidents || 0) > 10
                      ? "HIGH"
                      : (interviewData.interview_transcript.metadata
                          .lookingAwayIncidents || 0) > 5
                      ? "MEDIUM"
                      : "LOW"}
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-800 mb-1">
                  {interviewData.interview_transcript.metadata
                    .lookingAwayIncidents || 0}
                </p>
                <p className="text-sm text-gray-600">
                  incidents (
                  {interviewData.interview_transcript.metadata
                    .lookingAwayDuration || 0}
                  s total)
                </p>
              </div>
            )}

            {/* Multiple Faces */}
            {interviewData.interview_transcript.metadata
              .multipleFaceIncidents !== undefined && (
              <div
                className={`bg-white rounded-lg p-4 border-2 ${
                  (interviewData.interview_transcript.metadata
                    .multipleFaceIncidents || 0) > 3
                    ? "border-red-300"
                    : (interviewData.interview_transcript.metadata
                        .multipleFaceIncidents || 0) > 0
                    ? "border-orange-300"
                    : "border-green-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">
                    Multiple Faces
                  </p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      (interviewData.interview_transcript.metadata
                        .multipleFaceIncidents || 0) > 3
                        ? "bg-red-100 text-red-700"
                        : (interviewData.interview_transcript.metadata
                            .multipleFaceIncidents || 0) > 0
                        ? "bg-orange-100 text-orange-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {(interviewData.interview_transcript.metadata
                      .multipleFaceIncidents || 0) > 3
                      ? "HIGH"
                      : (interviewData.interview_transcript.metadata
                          .multipleFaceIncidents || 0) > 0
                      ? "MEDIUM"
                      : "NONE"}
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-800 mb-1">
                  {interviewData.interview_transcript.metadata
                    .multipleFaceIncidents || 0}
                </p>
                <p className="text-sm text-gray-600">incidents detected</p>
              </div>
            )}

            {/* Tab Switches */}
            {interviewData.interview_transcript.metadata.tabSwitches !==
              undefined && (
              <div
                className={`bg-white rounded-lg p-4 border-2 ${
                  (interviewData.interview_transcript.metadata.tabSwitches ||
                    0) > 5
                    ? "border-red-300"
                    : (interviewData.interview_transcript.metadata
                        .tabSwitches || 0) > 2
                    ? "border-orange-300"
                    : "border-green-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">
                    Tab Switches
                  </p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      (interviewData.interview_transcript.metadata
                        .tabSwitches || 0) > 5
                        ? "bg-red-100 text-red-700"
                        : (interviewData.interview_transcript.metadata
                            .tabSwitches || 0) > 2
                        ? "bg-orange-100 text-orange-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {(interviewData.interview_transcript.metadata.tabSwitches ||
                      0) > 5
                      ? "HIGH"
                      : (interviewData.interview_transcript.metadata
                          .tabSwitches || 0) > 2
                      ? "MEDIUM"
                      : "LOW"}
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-800 mb-1">
                  {interviewData.interview_transcript.metadata.tabSwitches || 0}
                </p>
                <p className="text-sm text-gray-600">times switched away</p>
              </div>
            )}

            {/* Window Switches */}
            {interviewData.interview_transcript.metadata.windowSwitches !==
              undefined && (
              <div
                className={`bg-white rounded-lg p-4 border-2 ${
                  (interviewData.interview_transcript.metadata.windowSwitches ||
                    0) > 5
                    ? "border-red-300"
                    : (interviewData.interview_transcript.metadata
                        .windowSwitches || 0) > 2
                    ? "border-orange-300"
                    : "border-green-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">
                    Window Switches
                  </p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      (interviewData.interview_transcript.metadata
                        .windowSwitches || 0) > 5
                        ? "bg-red-100 text-red-700"
                        : (interviewData.interview_transcript.metadata
                            .windowSwitches || 0) > 2
                        ? "bg-orange-100 text-orange-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {(interviewData.interview_transcript.metadata
                      .windowSwitches || 0) > 5
                      ? "HIGH"
                      : (interviewData.interview_transcript.metadata
                          .windowSwitches || 0) > 2
                      ? "MEDIUM"
                      : "LOW"}
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-800 mb-1">
                  {interviewData.interview_transcript.metadata.windowSwitches ||
                    0}
                </p>
                <p className="text-sm text-gray-600">times switched away</p>
              </div>
            )}

            {/* Integrity Score */}
            {(() => {
              const noFace =
                interviewData.interview_transcript.metadata.noFaceIncidents ||
                0;
              const lookAway =
                interviewData.interview_transcript.metadata
                  .lookingAwayIncidents || 0;
              const multiFace =
                interviewData.interview_transcript.metadata
                  .multipleFaceIncidents || 0;
              const tabSwitch =
                interviewData.interview_transcript.metadata.tabSwitches || 0;
              const windowSwitch =
                interviewData.interview_transcript.metadata.windowSwitches || 0;

              const plagiarismScore = Math.min(
                100,
                noFace * 5 +
                  lookAway * 2 +
                  multiFace * 10 +
                  tabSwitch * 3 +
                  windowSwitch * 3
              );

              return (
                <div
                  className={`bg-white rounded-lg p-4 border-2 ${
                    plagiarismScore > 50
                      ? "border-red-300"
                      : plagiarismScore > 25
                      ? "border-orange-300"
                      : "border-green-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-700">
                      Integrity Score
                    </p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        plagiarismScore > 50
                          ? "bg-red-100 text-red-700"
                          : plagiarismScore > 25
                          ? "bg-orange-100 text-orange-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {plagiarismScore > 50
                        ? "REVIEW"
                        : plagiarismScore > 25
                        ? "CAUTION"
                        : "GOOD"}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-gray-800 mb-1">
                    {Math.max(0, 100 - plagiarismScore)}%
                  </p>
                  <p className="text-sm text-gray-600">confidence level</p>
                </div>
              );
            })()}
          </div>

          <div className="mt-4 p-4 bg-white rounded-lg border border-amber-200">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Note:</span> This report tracks
              behavioral patterns during the interview. High violations may
              indicate potential integrity concerns and warrant manual review.
            </p>
          </div>
        </div>
      )}

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
