import AIAgent from "./AIAgent";
import { useEffect, useState } from "react";
import React from "react";

interface ActiveInterviewSessionProps {
  topic: string;
  difficulty: string;
  currentQuestion: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  isAvatarAsking: boolean;
  userResponse: string;
  elapsedTime: number;
  audioLevel: number;
  isVideoReady: boolean;
  currentFaceWarning: string | null;
  submissionData: {
    faceValidationFailures: number;
    multipleFaceDetections: number;
    tabSwitches?: number;
    windowSwitches?: number;
  };
  isListening: boolean;
  currentTranscript?: string;
  faceStatus?: "single" | "none" | "multiple";
  videoRef: React.RefObject<HTMLVideoElement | null>;
  audioCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  isAgentSpeaking?: boolean;
  onExitInterview: () => void;
  formatTime: (seconds: number) => string;
  onStopSpeaking?: () => void;
  lastSavedAnswer?: string;
}

const ActiveInterviewSession: React.FC<ActiveInterviewSessionProps> = ({
  topic,
  difficulty,
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  elapsedTime,
  isListening,
  currentTranscript = "",
  faceStatus = "single",
  videoRef,
  audioCanvasRef,
  isAgentSpeaking = false,
  onExitInterview,
  formatTime,
  onStopSpeaking,
  lastSavedAnswer,
}) => {
  void difficulty;

  const [activeTab, setActiveTab] = useState<
    "transcript" | "scorecard" | "outputs" | "notes"
  >("transcript");

  // Generate question list
  const questionsList = Array.from({ length: totalQuestions }, (_, i) => ({
    number: i + 1,
    text: `Question ${i + 1}`,
    isActive: i === currentQuestionIndex,
    isCompleted: i < currentQuestionIndex,
  }));

  // Disable right-click
  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const preventGestures = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("contextmenu", preventContextMenu);
    document.addEventListener("wheel", preventGestures, { passive: false });

    return () => {
      document.removeEventListener("contextmenu", preventContextMenu);
      document.removeEventListener("wheel", preventGestures as any);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {topic} Interview
            </h1>
            <p className="text-xs text-gray-500">
              Candidate Name -{" "}
              <span className="text-blue-600">In progress</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onExitInterview}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            End Interview
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side - Video Feed */}
        <div className="w-1/2 bg-gray-900 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{
              objectFit: "cover",
              transform: "scaleX(-1)",
            }}
          />
          <canvas ref={audioCanvasRef} className="hidden" />

          {/* AI Avatar Overlay - Top Right */}
          <div className="absolute top-4 right-4 z-30">
            <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-white/30 shadow-2xl">
              <AIAgent isSpeaking={isAgentSpeaking} />
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full text-xs font-semibold text-gray-900 shadow-lg">
              Alex
            </div>
          </div>

          {/* Control Buttons - Bottom Center */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 z-20">
            <button className="w-12 h-12 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 transition-all">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button className="w-12 h-12 bg-red-600/90 hover:bg-red-700/90 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 transition-all">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button className="w-12 h-12 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 transition-all">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            </button>
            <button className="w-12 h-12 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 transition-all">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Question List - Bottom Left */}
          <div className="absolute bottom-6 left-6 w-64 max-h-96 bg-white rounded-2xl shadow-2xl overflow-hidden z-20">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-900">Question List</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {questionsList.map((q) => (
                <div
                  key={q.number}
                  className={`flex items-center space-x-3 px-4 py-3 border-b border-gray-100 ${
                    q.isActive
                      ? "bg-purple-50 border-l-4 border-l-purple-600"
                      : ""
                  } ${q.isCompleted ? "bg-green-50" : ""}`}
                >
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      q.isCompleted
                        ? "bg-green-500 text-white"
                        : q.isActive
                        ? "bg-purple-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {q.isCompleted ? "✓" : q.number}
                  </div>
                  <span
                    className={`text-sm ${
                      q.isActive
                        ? "font-semibold text-gray-900"
                        : "text-gray-600"
                    }`}
                  >
                    What inspired you to become a {topic}?
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Content Tabs */}
        <div className="w-1/2 flex flex-col bg-gray-50">
          {/* Tabs Header */}
          <div className="bg-white border-b border-gray-200 px-6 flex space-x-1">
            <button
              onClick={() => setActiveTab("transcript")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "transcript"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Live Transcript
            </button>
            <button
              onClick={() => setActiveTab("scorecard")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "scorecard"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Scorecard
            </button>
            <button
              onClick={() => setActiveTab("outputs")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "outputs"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Outputs
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "notes"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Notes
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "transcript" && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      Current Question
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(elapsedTime)}
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">{currentQuestion}</p>
                </div>

                {isListening && (
                  <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-semibold text-green-700 uppercase">
                        Recording Your Answer
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {currentTranscript ||
                        "Start speaking... Your answer is being recorded."}
                    </p>
                  </div>
                )}

                {lastSavedAnswer && (
                  <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-xs font-semibold text-blue-700 uppercase">
                        Last Saved Answer
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {lastSavedAnswer}
                    </p>
                  </div>
                )}

                {isListening && onStopSpeaking && (
                  <button
                    onClick={onStopSpeaking}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all shadow-lg"
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
                        d="M13 5l7 7-7 7M5 5l7 7-7 7"
                      />
                    </svg>
                    <span>Next Question</span>
                  </button>
                )}
              </div>
            )}

            {activeTab === "scorecard" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-purple-100 rounded-full mb-3">
                      <span className="text-3xl font-bold text-purple-600">
                        {currentQuestionIndex}/{totalQuestions}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Overall Score
                    </h3>
                    <p className="text-sm text-gray-500">
                      Questions answered so far
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    "English Proficiency",
                    "Communication Skill",
                    "Design Thinking",
                    "Collaboration",
                  ].map((skill, idx) => (
                    <div
                      key={skill}
                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">
                          {skill}
                        </span>
                        <span className="text-sm font-bold text-purple-600">
                          {[5, 6, 8, 9][idx]}/10
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          style={{ width: `${[50, 60, 80, 90][idx]}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "outputs" && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Session Outputs
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Recording Status:</span>
                    <span className="font-semibold text-green-600">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Questions Asked:</span>
                    <span className="font-semibold">
                      {currentQuestionIndex} / {totalQuestions}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Duration:</span>
                    <span className="font-semibold">
                      {formatTime(elapsedTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Face Status:</span>
                    <span
                      className={`font-semibold ${
                        faceStatus === "single"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {faceStatus === "single"
                        ? "✓ Verified"
                        : faceStatus === "none"
                        ? "⚠ No Face"
                        : "⚠ Multiple"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Interview Notes
                </h3>
                <textarea
                  placeholder="Add your notes here..."
                  className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  defaultValue=""
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveInterviewSession;
