import AIAgent from "./AIAgent";
import { useEffect } from "react";
import React from "react";
import "./InterviewRoom.css";

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

  // Disable right-click, trackpad gestures, and zoom
  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Enhanced gesture prevention
    const preventGestures = (e: WheelEvent) => {
      // Prevent zoom with Ctrl+wheel
      if (e.ctrlKey) {
        e.preventDefault();
        return false;
      }
      // Prevent pinch zoom on trackpad
      if (e.deltaY && Math.abs(e.deltaY) > 10) {
        e.preventDefault();
        return false;
      }
    };

    // Prevent touch gestures
    const preventTouchGestures = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
        return false;
      }
    };

    // Prevent keyboard zoom
    const preventKeyboardZoom = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === '+' || e.key === '-' || e.key === '0' || e.key === '=')
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Prevent browser fullscreen controls from appearing at top
    const preventTopHover = (e: MouseEvent) => {
      // If mouse is in the top 50px area, prevent default behavior
      if (e.clientY < 50 && document.fullscreenElement) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("contextmenu", preventContextMenu);
    document.addEventListener("wheel", preventGestures, { passive: false });
    document.addEventListener("touchmove", preventTouchGestures, { passive: false });
    document.addEventListener("gesturestart", (e) => e.preventDefault());
    document.addEventListener("gesturechange", (e) => e.preventDefault());
    document.addEventListener("gestureend", (e) => e.preventDefault());
    document.addEventListener("keydown", preventKeyboardZoom);
    document.addEventListener("mousemove", preventTopHover, true);

    return () => {
      document.removeEventListener("contextmenu", preventContextMenu);
      document.removeEventListener("wheel", preventGestures as any);
      document.removeEventListener("touchmove", preventTouchGestures as any);
      document.removeEventListener("gesturestart", (e) => e.preventDefault());
      document.removeEventListener("gesturechange", (e) => e.preventDefault());
      document.removeEventListener("gestureend", (e) => e.preventDefault());
      document.removeEventListener("keydown", preventKeyboardZoom);
      document.removeEventListener("mousemove", preventTopHover, true);
    };
  }, []);

  return (
    <div className="interview-room-container fixed inset-0 bg-white flex flex-col select-none">
      {/* Top Header with Exit Button */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <svg
              className="w-6 h-6 text-white"
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
            <h1 className="text-xl font-bold text-white">
              {topic} Interview
            </h1>
            <p className="text-xs text-white/80">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                In Progress
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-white text-sm font-semibold bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
            {formatTime(elapsedTime)}
          </div>
          <button
            onClick={onExitInterview}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span>EXIT</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side - Questions & Content */}
        <div className="w-1/2 flex flex-col bg-gray-50">
          {/* Current Question - Large Display */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wide">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {formatTime(elapsedTime)}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
              {currentQuestion}
            </h2>
          </div>

          {/* Tabs Header */}
          <div className="bg-white border-b border-gray-200 px-6 flex space-x-1">
            <button
              className="px-4 py-3 text-sm font-medium border-b-2 border-purple-600 text-purple-600"
            >
              Live Transcript
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="tab-content space-y-4">
              {isListening && (
                <div className="bg-green-50 rounded-lg p-5 border-l-4 border-green-500 shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold text-green-700 uppercase tracking-wide">
                      Recording Your Answer
                    </span>
                  </div>
                  <p className="text-gray-800 text-base leading-relaxed min-h-[100px]">
                    {currentTranscript ||
                      "Start speaking... Your answer is being recorded."}
                  </p>
                </div>
              )}

              {lastSavedAnswer && (
                <div className="bg-blue-50 rounded-lg p-5 border-l-4 border-blue-500 shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                      Last Saved Answer
                    </span>
                  </div>
                  <p className="text-gray-800 text-base leading-relaxed">
                    {lastSavedAnswer}
                  </p>
                </div>
              )}

              {isListening && onStopSpeaking && (
                <button
                  onClick={onStopSpeaking}
                  className="next-question-btn w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center space-x-3 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg
                    className="w-6 h-6"
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
          </div>
        </div>

        {/* Right Side - Video Feed with Controls Inside */}
        <div className="w-1/2 bg-gray-900 relative">
          {/* Video */}
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
          <div className="absolute top-6 right-6 z-30">
            <div className={`w-40 h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-700 border-4 border-white/30 shadow-2xl ${isAgentSpeaking ? 'ai-avatar-speaking' : ''}`}>
              <AIAgent isSpeaking={isAgentSpeaking} />
            </div>
          </div>

          {/* Status Indicators - Top Left */}
          <div className="absolute top-6 left-6 z-20 space-y-3">
            {/* Recording Status */}
            <div className="recording-indicator bg-red-500/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center space-x-2 shadow-lg">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-bold">Recording</span>
            </div>
            
            {/* Face Status */}
            <div className={`face-status-indicator backdrop-blur-md px-4 py-2 rounded-full flex items-center space-x-2 shadow-lg ${
              faceStatus === "single"
                ? "bg-green-500/90"
                : "bg-yellow-500/90"
            }`}>
              <span className="text-white text-sm font-bold">
                {faceStatus === "single"
                  ? "✓ Face Detected"
                  : faceStatus === "none"
                  ? "⚠ No Face"
                  : "⚠ Multiple Faces"}
              </span>
            </div>
          </div>

          {/* Audio Visualizer - Bottom */}
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-10">
            <div className="flex items-end space-x-1">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 40 + 10}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveInterviewSession;
