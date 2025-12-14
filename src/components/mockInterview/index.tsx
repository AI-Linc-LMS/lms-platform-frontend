import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useState, useEffect } from "react";
import InterviewTypeSelector from "./components/InterviewTypeSelector";
import InterviewModeSelector from "./components/InterviewModeSelector";
import TopicDifficultySelector from "./components/TopicDifficultySelector";
import InterviewScheduler from "./components/InterviewScheduler";
import InterviewWaitingRoom from "./components/InterviewWaitingRoom";
import InterviewRoom from "./components/InterviewRoom";
import PreviousInterviewsList from "./components/PreviousInterviewsList";
import InterviewDetailView from "./components/InterviewDetailView";
import InterviewCompletePage from "./components/InterviewCompletePage";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProctoringProvider } from "./proctoring/ProctoringProvider";
import { InterviewQuestion, mockInterviewAPI } from "./services/api";
import Container from "../../constants/Container";

type InterviewType = "fresh" | "history";
type InterviewMode = "quick" | "scheduled" | null;

export interface InterviewRecord {
  id: string;
  topic: string;
  difficulty: string;
  date: Date;
  duration: number;
  score: number | null;
  status:
    | "completed"
    | "in-progress"
    | "in_progress"
    | "scheduled"
    | "cancelled"
    | "abandoned";
  questionsAnswered: number;
  totalQuestions: number;
  faceValidationIssues?: number;
  multipleFaceDetections?: number;
}

const MockInterview = () => {
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/login");
    }
  }, [navigate]);

  const [, setScheduledInterviewId] = useState<string | null>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<
    InterviewQuestion[]
  >([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
    null
  );
  const [selectedRecord, setSelectedRecord] = useState<InterviewRecord | null>(
    null
  );
  const [listRefreshKey, setListRefreshKey] = useState<number>(0);

  // Type selector handlers
  const handleTypeSelect = (type: InterviewType) => {
    if (type === "fresh") {
      // Clear previous interview data when starting fresh
      sessionStorage.removeItem("interview_topic");
      sessionStorage.removeItem("interview_difficulty");
      navigate("/mock-interview/mode");
    } else if (type === "history") {
      setListRefreshKey((prev) => prev + 1);
      navigate("/mock-interview/previous");
    }
  };

  // Navigate to scheduled interviews
  const handleViewScheduled = () => {
    navigate("/mock-interview/scheduled");
  };

  // Mode selector handlers
  const handleModeSelect = (mode: InterviewMode) => {
    if (mode === "quick") {
      navigate("/mock-interview/quick-setup");
    } else if (mode === "scheduled") {
      navigate("/mock-interview/schedule");
    }
  };

  // Quick start handler
  const handleQuickStart = async (topic: string, difficulty: string) => {
    try {
      // Clear any previous interview flags
      sessionStorage.removeItem("interview_submitting");
      sessionStorage.removeItem("interview_submission_complete");
      sessionStorage.removeItem("interview_attempt_id");
      setSubmissionStatus(null);
      setSubmittedAttemptId(null);

      // Set the state with the interview details BEFORE creating interview
      setSelectedTopic(topic);
      setSelectedDifficulty(difficulty);

      // Store in sessionStorage to persist across navigation
      sessionStorage.setItem("interview_topic", topic);
      sessionStorage.setItem("interview_difficulty", difficulty);

      // Create and start the interview immediately
      const { attemptId, questions } = await mockInterviewAPI.startInterview(
        topic,
        difficulty
      );

      // Update with questions from API
      setInterviewQuestions(questions || []);
      setScheduledInterviewId(attemptId);

      // Navigate to interview room with ID
      navigate(`/mock-interview/interview/${attemptId}`);
    } catch (error: any) {
      // Stay on current page if there's an error
      // Error handling can be added here (e.g., show error toast)
    }
  };

  // Schedule interview handler
  const handleInterviewScheduled = (interviewId: string) => {
    setScheduledInterviewId(interviewId);
    navigate(`/mock-interview/scheduled`);
  };

  // Start interview from waiting room
  const handleStartInterview = (
    questions: InterviewQuestion[],
    interviewId: string
  ) => {
    // Clear any previous interview flags
    sessionStorage.removeItem("interview_submitting");
    sessionStorage.removeItem("interview_submission_complete");
    sessionStorage.removeItem("interview_attempt_id");
    setSubmissionStatus(null);
    setSubmittedAttemptId(null);

    setInterviewQuestions(questions);
    setScheduledInterviewId(interviewId);

    const topic =
      questions.length > 0 ? questions[0].topic || "Interview" : "Interview";
    const difficulty =
      questions.length > 0 ? questions[0].difficulty || "Medium" : "Medium";

    setSelectedTopic(topic);
    setSelectedDifficulty(difficulty);

    // Store in sessionStorage to persist across navigation
    sessionStorage.setItem("interview_topic", topic);
    sessionStorage.setItem("interview_difficulty", difficulty);

    navigate(`/mock-interview/interview/${interviewId}`);
  };

  // Complete interview
  const [submissionStatus, setSubmissionStatus] = useState<boolean | null>(
    () => {
      // Initialize from sessionStorage if available
      const submitting = sessionStorage.getItem("interview_submitting");
      const complete = sessionStorage.getItem("interview_submission_complete");

      if (submitting === "true") {
        return null; // null = submitting
      } else if (complete === "true") {
        return true; // true = success
      } else if (complete === "false") {
        return false; // false = failed
      }
      return null; // default to submitting
    }
  );
  const [submittedAttemptId, setSubmittedAttemptId] = useState<string | null>(
    () => {
      // Get attemptId from sessionStorage if available
      return sessionStorage.getItem("interview_attempt_id");
    }
  );

  // Global cleanup - ensure no media streams leak
  useEffect(() => {
    const cleanupMediaStreams = () => {
      // Only cleanup if NOT on interview room or interview page
      const path = window.location.pathname;
      if (
        path.includes("/mock-interview/interview/") ||
        path.includes("/mock-interview/room")
      ) {
        return; // Don't cleanup during active interview
      }

      const stopStream = (stream: MediaStream | null) => {
        if (!stream) return;
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            // Continue
          }
        });
      };

      // Stop all video/audio elements
      document.querySelectorAll("video, audio").forEach((element) => {
        const mediaElement = element as HTMLMediaElement;
        stopStream(mediaElement.srcObject as MediaStream | null);
        mediaElement.srcObject = null;
      });

      // Clear global streams
      if ((window as any).__globalMediaStreams) {
        (window as any).__globalMediaStreams.forEach(stopStream);
        (window as any).__globalMediaStreams = [];
      }
    };

    // Don't run immediately, wait a bit
    const interval = setInterval(cleanupMediaStreams, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleInterviewComplete = (
    submissionSuccess?: boolean,
    attemptId?: string
  ) => {
    // If undefined, it means submission is in progress
    // If boolean, submission is complete (true = success, false = failed)
    if (submissionSuccess === undefined) {
      // Submission in progress - navigate to complete page

      // Store attemptId in sessionStorage and state FIRST
      if (attemptId) {
        sessionStorage.setItem("interview_attempt_id", attemptId);
        setSubmittedAttemptId(attemptId);
      }

      // Set submission status
      const submitting = sessionStorage.getItem("interview_submitting");
      if (submitting === "true") {
        setSubmissionStatus(null); // null = submitting
      }

      // Navigate to complete page with replace to prevent back navigation
      navigate("/mock-interview/complete", { replace: true });
    } else {
      // Update status after navigation (submission complete)
      setSubmissionStatus(submissionSuccess);

      // Store attemptId if provided
      if (attemptId) {
        sessionStorage.setItem("interview_attempt_id", attemptId);
        setSubmittedAttemptId(attemptId);
      }
    }
  };

  // Check sessionStorage on mount and when route changes
  useEffect(() => {
    const checkSubmissionStatus = () => {
      const submitting = sessionStorage.getItem("interview_submitting");
      const complete = sessionStorage.getItem("interview_submission_complete");

      if (submitting === "true") {
        setSubmissionStatus(null);
      } else if (complete === "true") {
        setSubmissionStatus(true);
      } else if (complete === "false") {
        setSubmissionStatus(false);
      }
    };

    checkSubmissionStatus();
    // Check periodically in case status updates
    const interval = setInterval(checkSubmissionStatus, 500);
    return () => clearInterval(interval);
  }, []);

  // View interview record detail
  const handleViewRecord = (record: InterviewRecord) => {
    setSelectedRecord(record);
    navigate(`/mock-interview/detail/${record.id}`);
  };

  // Interview abort handler
  const handleInterviewAbort = () => {
    navigate("/mock-interview");
  };

  return (
    <ErrorBoundary>
      <Container>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <Routes>
              {/* Default route - Type selector */}
              <Route
                index
                element={
                  <InterviewTypeSelector
                    onSelect={handleTypeSelect}
                    onViewScheduled={handleViewScheduled}
                  />
                }
              />

              {/* Mode selector (Quick Start vs Schedule) */}
              <Route
                path="mode"
                element={
                  <InterviewModeSelector
                    onSelectMode={handleModeSelect}
                    onBack={() => navigate("/mock-interview")}
                  />
                }
              />

              {/* Quick start - Topic/Difficulty selector */}
              <Route
                path="quick-setup"
                element={
                  <TopicDifficultySelector
                    interviewType="fresh"
                    onStart={handleQuickStart}
                    onBack={() => navigate(-1)}
                  />
                }
              />

              {/* Schedule interview */}
              <Route
                path="schedule"
                element={
                  <InterviewScheduler
                    onScheduled={handleInterviewScheduled}
                    onBack={() => navigate(-1)}
                  />
                }
              />

              {/* Scheduled interviews list / waiting room */}
              <Route
                path="scheduled"
                element={
                  <InterviewWaitingRoom
                    onStartSuccess={handleStartInterview}
                    onBack={() => navigate("/mock-interview")}
                  />
                }
              />

              {/* Interview room */}
              <Route
                path="interview/:interviewId"
                element={
                  <InterviewRoomWrapper
                    selectedTopic={selectedTopic}
                    selectedDifficulty={selectedDifficulty}
                    interviewQuestions={interviewQuestions}
                    onComplete={handleInterviewComplete}
                    onBack={handleInterviewAbort}
                  />
                }
              />

              {/* Previous interviews list */}
              <Route
                path="previous"
                element={
                  <PreviousInterviewsList
                    onViewRecord={handleViewRecord}
                    onBack={() => navigate("/mock-interview")}
                    refreshKey={listRefreshKey}
                  />
                }
              />

              {/* Interview detail view */}
              <Route
                path="detail/:recordId"
                element={
                  <InterviewDetailViewWrapper selectedRecord={selectedRecord} />
                }
              />

              {/* Complete page */}
              <Route
                path="complete"
                element={
                  <InterviewCompletePage
                    submissionStatus={submissionStatus}
                    attemptId={submittedAttemptId}
                  />
                }
              />

              {/* Catch-all - redirect to main page */}
              <Route
                path="*"
                element={<Navigate to="/mock-interview" replace />}
              />
            </Routes>
          </div>
        </div>
      </Container>
    </ErrorBoundary>
  );
};

// Wrapper component for InterviewRoom to handle URL params
const InterviewRoomWrapper = ({
  selectedTopic,
  selectedDifficulty,
  interviewQuestions,
  onComplete,
  onBack,
}: {
  selectedTopic: string | null;
  selectedDifficulty: string | null;
  interviewQuestions: InterviewQuestion[];
  onComplete: (submissionSuccess?: boolean, attemptId?: string) => void;
  onBack: () => void;
}) => {
  const { interviewId } = useParams<{ interviewId: string }>();

  // Clear any lingering submission flags when mounting interview room
  useEffect(() => {
    sessionStorage.removeItem("interview_submitting");
    sessionStorage.removeItem("interview_submission_complete");
  }, []);

  if (!interviewId) {
    return <Navigate to="/mock-interview" replace />;
  }

  // Get topic and difficulty from state or sessionStorage
  const topic =
    selectedTopic || sessionStorage.getItem("interview_topic") || "General";
  const difficulty =
    selectedDifficulty ||
    sessionStorage.getItem("interview_difficulty") ||
    "Medium";

  return (
    <ProctoringProvider>
      <InterviewRoom
        topic={topic}
        difficulty={difficulty}
        onComplete={onComplete}
        onBack={onBack}
        interviewId={interviewId}
        questions={interviewQuestions}
      />
    </ProctoringProvider>
  );
};

const InterviewDetailViewWrapper = ({
  selectedRecord,
}: {
  selectedRecord: InterviewRecord | null;
}) => {
  const { recordId } = useParams<{ recordId: string }>();

  // If we have selectedRecord from state, use it
  // Otherwise, create a minimal record from the URL param for navigation
  const record =
    selectedRecord ||
    (recordId
      ? {
          id: recordId,
          topic: "",
          difficulty: "",
          date: new Date(),
          duration: 0,
          score: null,
          status: "completed" as const,
          questionsAnswered: 0,
          totalQuestions: 0,
        }
      : null);

  if (!record) {
    return <Navigate to="/mock-interview/previous" replace />;
  }

  return <InterviewDetailView record={record} />;
};

export default MockInterview;
