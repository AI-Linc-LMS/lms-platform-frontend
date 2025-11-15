import { useState } from "react";
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
import { InterviewQuestion } from "./services/api";

type InterviewType = "fresh" | "history";
type InterviewMode = "quick" | "scheduled" | null;
type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

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
  const [step, setStep] = useState<Step>(1);
  const [interviewType, setInterviewType] = useState<InterviewType | null>(
    null
  );
  const [interviewMode, setInterviewMode] = useState<InterviewMode>(null);
  const [scheduledInterviewId, setScheduledInterviewId] = useState<
    string | null
  >(null);
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
  const [listRefreshKey, setListRefreshKey] = useState<number>(0); // Track refresh trigger

  const handleTypeSelect = (type: InterviewType) => {
    setInterviewType(type);
    if (type === "fresh") {
      setStep(2); // Go to mode selector
    } else if (type === "history") {
      setListRefreshKey((prev) => prev + 1); // Trigger refresh
      setStep(6); // Show previous interviews list
    }
  };

  const handleModeSelect = (mode: InterviewMode) => {
    setInterviewMode(mode);
    if (mode === "quick") {
      setStep(3); // Go to topic/difficulty selector (quick start)
    } else if (mode === "scheduled") {
      setStep(4); // Go to scheduler
    }
  };

  const handleQuickStart = (topic: string, difficulty: string) => {
    setSelectedTopic(topic);
    setSelectedDifficulty(difficulty);
    setInterviewQuestions([]); // No API questions, will use local generation
    setScheduledInterviewId(null); // No interview ID for quick start
    setStep(5); // Go directly to interview room
  };

  const handleInterviewScheduled = (interviewId: string) => {
    setScheduledInterviewId(interviewId);
    setStep(7); // Go to waiting room
  };

  const handleStartInterview = (questions: InterviewQuestion[]) => {
    setInterviewQuestions(questions);
    // Extract topic and difficulty from the first question or use defaults
    if (questions.length > 0) {
      setSelectedTopic(questions[0].topic || "Interview");
      setSelectedDifficulty(questions[0].difficulty || "Medium");
    }
    setStep(5); // Go to interview room
  };

  const handleInterviewComplete = () => {
    // After interview completion, show success page directly
    setStep(8);
    setInterviewType(null);
    setInterviewMode(null);
  };

  const handleViewHistoryFromComplete = () => {
    setListRefreshKey((prev) => prev + 1); // Trigger refresh
    setStep(6);
    setInterviewType("history");
  };

  const handleStartNewFromComplete = () => {
    setStep(1);
    setInterviewType(null);
    setInterviewMode(null);
    setScheduledInterviewId(null);
    setInterviewQuestions([]);
    setSelectedTopic(null);
    setSelectedDifficulty(null);
  };

  const handleViewRecord = (record: InterviewRecord) => {
    setSelectedRecord(record);
    setStep(7); // Show detail view (reusing step 7 for both waiting room and detail view)
  };

  const handleBackFromList = () => {
    setStep(1);
    setInterviewType(null);
  };

  const handleBackFromDetail = () => {
    setListRefreshKey((prev) => prev + 1); // Trigger refresh
    setStep(6);
    setSelectedRecord(null);
  };

  const handleBackFromModeSelector = () => {
    setStep(1);
    setInterviewType(null);
    setInterviewMode(null);
  };

  const handleBackFromTopicSelector = () => {
    setStep(2); // Go back to mode selector
  };

  const handleBackFromScheduler = () => {
    setStep(2); // Go back to mode selector
    setInterviewMode(null);
  };

  const handleBackFromWaitingRoom = () => {
    setStep(4); // Go back to scheduler
  };

  const handleInterviewAbort = () => {
    // When user cancels/backs out during interview
    setStep(1);
    setInterviewType(null);
    setInterviewMode(null);
    setScheduledInterviewId(null);
    setInterviewQuestions([]);
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Choose your interview type to get started";
      case 2:
        return "Select your interview mode";
      case 3:
        return "Select topic and difficulty level";
      case 4:
        return "Schedule your mock interview";
      case 5:
        return "Interview in progress";
      case 6:
        return "Your previous interview sessions";
      case 7:
        return interviewMode === "scheduled" && scheduledInterviewId
          ? "Interview waiting room"
          : "Interview details and review";
      case 8:
        return "Interview completed successfully";
      default:
        return "";
    }
  };

  return (
    <ProctoringProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Mock Interview Practice
              </h1>
              <p className="text-gray-600">{getStepTitle()}</p>
            </div>

            {/* Progress Indicator - Show based on mode */}
            {interviewType === "fresh" && step >= 1 && step <= 5 && (
              <div className="mb-8 flex items-center justify-center space-x-3">
                {interviewMode === "quick" && (
                  // Quick Start: Type → Mode → Topic → Interview
                  <>
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold bg-indigo-600 text-white">
                        1
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Type
                      </span>
                    </div>
                    <div className="h-1 w-12 bg-indigo-600"></div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold bg-indigo-600 text-white">
                        2
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Mode
                      </span>
                    </div>
                    <div
                      className={`h-1 w-12 ${
                        step >= 3 ? "bg-indigo-600" : "bg-gray-300"
                      }`}
                    ></div>
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                          step >= 3
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        3
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Setup
                      </span>
                    </div>
                    <div
                      className={`h-1 w-12 ${
                        step >= 5 ? "bg-indigo-600" : "bg-gray-300"
                      }`}
                    ></div>
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                          step >= 5
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        4
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Interview
                      </span>
                    </div>
                  </>
                )}
                {interviewMode === "scheduled" && (
                  // Scheduled: Type → Mode → Schedule → Prepare → Interview
                  <>
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold bg-indigo-600 text-white">
                        1
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Type
                      </span>
                    </div>
                    <div className="h-1 w-10 bg-indigo-600"></div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold bg-indigo-600 text-white">
                        2
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Mode
                      </span>
                    </div>
                    <div
                      className={`h-1 w-10 ${
                        step >= 4 ? "bg-indigo-600" : "bg-gray-300"
                      }`}
                    ></div>
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                          step >= 4
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        3
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Schedule
                      </span>
                    </div>
                    <div
                      className={`h-1 w-10 ${
                        step >= 7 ? "bg-indigo-600" : "bg-gray-300"
                      }`}
                    ></div>
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                          step >= 7
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        4
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Prepare
                      </span>
                    </div>
                    <div
                      className={`h-1 w-10 ${
                        step >= 5 ? "bg-indigo-600" : "bg-gray-300"
                      }`}
                    ></div>
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                          step >= 5
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        5
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Interview
                      </span>
                    </div>
                  </>
                )}
                {!interviewMode && step === 2 && (
                  // Just show first 2 steps at mode selection
                  <>
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold bg-indigo-600 text-white">
                        1
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Type
                      </span>
                    </div>
                    <div className="h-1 w-12 bg-indigo-600"></div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold bg-indigo-600 text-white">
                        2
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Mode
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step Content */}
            {step !== 5 && step !== 8 && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                {step === 1 && (
                  <InterviewTypeSelector 
                    onSelect={handleTypeSelect} 
                    onViewScheduled={() => setStep(6)}
                  />
                )}
                {step === 2 && (
                  <InterviewModeSelector
                    onSelectMode={handleModeSelect}
                    onBack={handleBackFromModeSelector}
                  />
                )}
                {step === 3 && (
                  <TopicDifficultySelector
                    interviewType={interviewType}
                    onStart={handleQuickStart}
                    onBack={handleBackFromTopicSelector}
                  />
                )}
                {step === 4 && (
                  <InterviewScheduler
                    onScheduled={handleInterviewScheduled}
                    onBack={handleBackFromScheduler}
                  />
                )}
                {step === 6 && (
                  <PreviousInterviewsList
                    onViewRecord={handleViewRecord}
                    onBack={handleBackFromList}
                    refreshKey={listRefreshKey}
                  />
                )}
                {step === 7 && scheduledInterviewId && !selectedRecord && (
                  <InterviewWaitingRoom
                    onStartSuccess={handleStartInterview}
                    onBack={handleBackFromWaitingRoom}
                  />
                )}
                {step === 7 && selectedRecord && (
                  <InterviewDetailView
                    record={selectedRecord}
                    onBack={handleBackFromDetail}
                  />
                )}
              </div>
            )}

            {/* Interview Room - Full Screen */}
            {step === 5 && (
              <InterviewRoom
                topic={selectedTopic!}
                difficulty={selectedDifficulty!}
                onBack={handleInterviewAbort}
                onComplete={handleInterviewComplete}
                interviewId={scheduledInterviewId}
                questions={interviewQuestions}
              />
            )}

            {/* Completion Page - No Container */}
            {step === 8 && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <InterviewCompletePage
                  onViewHistory={handleViewHistoryFromComplete}
                  onStartNew={handleStartNewFromComplete}
                />
              </div>
            )}
          </div>
        </div>
      </ErrorBoundary>
    </ProctoringProvider>
  );
};

export default MockInterview;
