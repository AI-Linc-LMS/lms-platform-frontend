import InterviewAvatar from "./InterviewAvatar";
import { useEffect } from "react";

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
  videoRef: React.RefObject<HTMLVideoElement | null>;
  audioCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  onExitInterview: () => void;
  onQuestionComplete: () => void;
  formatTime: (seconds: number) => string;
  onStartSpeaking?: () => void;
  onStopSpeaking?: () => void;
}

const ActiveInterviewSession: React.FC<ActiveInterviewSessionProps> = ({
  topic,
  difficulty,
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  isAvatarAsking,
  userResponse,
  elapsedTime,
  audioLevel,
  isVideoReady,
  currentFaceWarning,
  isListening,
  videoRef,
  audioCanvasRef,
  onExitInterview,
  onQuestionComplete,
  formatTime,
  onStartSpeaking,
  onStopSpeaking,
}) => {
  useEffect(() => {
    if (
      videoRef.current &&
      videoRef.current.srcObject &&
      videoRef.current.paused
    ) {
      videoRef.current.play().catch(() => {});
    }
  }, [isVideoReady, videoRef]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 overflow-hidden">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-4 flex items-center justify-between border-b-2 border-indigo-500 shadow-xl">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 bg-red-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-red-400/50">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-white font-bold text-sm">LIVE INTERVIEW</span>
          </div>
          <div className="text-white/90 text-sm font-medium">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </div>
        </div>
        <div className="text-white font-mono text-2xl font-bold">
          {formatTime(elapsedTime)}
        </div>
      </div>

      {/* Main Content - 50:50 Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Avatar & Question (50%) */}
        <div className="w-1/2 flex flex-col p-8 space-y-6 overflow-y-auto border-r-2 border-slate-700">
          {/* Avatar Section */}
          <div className="flex-shrink-0">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 border-2 border-slate-700 shadow-2xl">
              <InterviewAvatar
                currentQuestion={currentQuestion}
                isAsking={isAvatarAsking}
                onQuestionComplete={onQuestionComplete}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 backdrop-blur-xl rounded-3xl p-8 border-2 border-blue-500/30 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <svg
                className="w-6 h-6 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              <h3 className="text-blue-300 text-sm font-bold uppercase tracking-wider">
                Current Question
              </h3>
            </div>
            <p className="text-white text-2xl leading-relaxed font-medium">
              {currentQuestion}
            </p>
          </div>

          {/* Your Response */}
          {userResponse && (
            <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-xl rounded-2xl p-6 border-2 border-green-500/30">
              <div className="flex items-center space-x-2 mb-3">
                <svg
                  className="w-5 h-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-green-300 text-sm font-bold">
                  Your Answer
                </span>
              </div>
              <p className="text-white text-base leading-relaxed">
                {userResponse}
              </p>
            </div>
          )}

          {/* Recording Status */}
          {isListening && (
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/50 rounded-2xl p-6 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-ping absolute"></div>
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-green-300 font-bold text-lg">
                    Recording Your Answer...
                  </p>
                  <p className="text-green-200/70 text-sm">
                    Speak clearly and naturally
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-4 pt-4">
            {/* Start/Stop Speaking */}
            {!isAvatarAsking && (
              <>
                {!isListening ? (
                  <button
                    onClick={() => {
                      if (onStartSpeaking) {
                        onStartSpeaking();
                      }
                    }}
                    disabled={!onStartSpeaking}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-5 px-8 rounded-2xl font-bold text-lg shadow-2xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Start Recording Answer</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (onStopSpeaking) {
                        onStopSpeaking();
                      }
                    }}
                    disabled={!onStopSpeaking}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-5 px-8 rounded-2xl font-bold text-lg shadow-2xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Stop & Next Question</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Side - Video Feed (50%) */}
        <div className="w-1/2 flex flex-col bg-gradient-to-br from-slate-800 to-slate-900">
          {/* Topic & Difficulty - Above Video */}
          <div className="bg-slate-900/95 px-8 py-4 border-b-2 border-slate-700">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm font-semibold">
                  Interview Topic:
                </span>
                <span className="text-white text-lg font-bold capitalize">
                  {topic}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm font-semibold">
                  Difficulty Level:
                </span>
                <span
                  className={`text-lg font-bold capitalize ${
                    difficulty === "easy"
                      ? "text-green-400"
                      : difficulty === "medium"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {difficulty}
                </span>
              </div>
            </div>
          </div>

          {/* Video Feed - Takes remaining space */}
          <div className="flex-1 relative bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{
                objectFit: "cover",
                objectPosition: "center",
                transform: "scaleX(-1)",
              }}
            />
            <canvas ref={audioCanvasRef} className="hidden" />

            {/* Face Detection Status Overlay */}
            <div className="absolute top-4 left-4">
              {currentFaceWarning === "no_face" ? (
                <div className="flex items-center space-x-2 bg-red-500/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-red-400">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white font-semibold text-sm">
                    No Face Detected
                  </span>
                </div>
              ) : currentFaceWarning === "multiple_faces" ? (
                <div className="flex items-center space-x-2 bg-orange-500/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-orange-400">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white font-semibold text-sm">
                    Multiple Faces
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 bg-green-500/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-green-400">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-white font-semibold text-sm">
                    Face Verified
                  </span>
                </div>
              )}
            </div>

            {/* Audio Level Indicator */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-xs font-semibold">
                    Microphone
                  </span>
                  <span className="text-white text-xs">
                    {Math.round(audioLevel)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-150"
                    style={{ width: `${audioLevel}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* End Interview Button - Under Video */}
          <div className="bg-slate-900/95 p-6 border-t-2 border-slate-700">
            <button
              onClick={onExitInterview}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-2xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-3"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>End & Submit Interview</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveInterviewSession;
