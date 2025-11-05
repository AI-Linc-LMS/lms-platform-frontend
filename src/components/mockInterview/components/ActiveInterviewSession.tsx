// components/interview/ActiveInterviewSession.tsx

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
  cameraPermissionGranted: boolean;
  currentFaceWarning: string | null;
  submissionData: any;
  interviewEvents: any[];
  isListening: boolean;
  isFaceDetectionLoading: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  audioCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  onNextQuestion: () => void;
  onExitInterview: () => void;
  onQuestionComplete: () => void;
  formatTime: (seconds: number) => string;
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
  cameraPermissionGranted,
  currentFaceWarning,
  submissionData,
  interviewEvents,
  isListening,
  isFaceDetectionLoading,
  videoRef,
  audioCanvasRef,
  onNextQuestion,
  onExitInterview,
  onQuestionComplete,
  formatTime,
}) => {
  // Ensure video stream is properly connected
  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject && videoRef.current.paused) {
      videoRef.current.play().catch(() => {
        // Video play failed
      });
    }
  }, [isVideoReady, videoRef]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      {/* Modern Top Bar */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Left Section - Status Indicators */}
            <div className="flex items-center space-x-6">
              {/* Recording Status */}
              <div className="flex items-center space-x-2 bg-red-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-red-400/30">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                <span className="font-bold text-sm tracking-wide">RECORDING</span>
              </div>

              {/* Audio Level */}
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
                <div className="w-28 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-150 shadow-lg"
                    style={{ width: `${audioLevel}%` }}
                  ></div>
                </div>
              </div>

              {/* Face Detection Status */}
              {!isFaceDetectionLoading && (
                <div
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full backdrop-blur-sm border transition-all duration-300 ${
                    currentFaceWarning === null
                      ? "bg-green-500/20 border-green-400/30 text-green-100"
                      : currentFaceWarning === "multiple_faces"
                      ? "bg-yellow-500/20 border-yellow-400/30 text-yellow-100 animate-pulse"
                      : "bg-red-500/20 border-red-400/30 text-red-100 animate-pulse"
                  }`}
                >
                  <span className="text-xl">
                    {currentFaceWarning === null
                      ? "✓"
                      : currentFaceWarning === "multiple_faces"
                      ? "⚠"
                      : "⚠"}
                  </span>
                  <span className="text-sm font-semibold">
                    {currentFaceWarning === null
                      ? "Face Verified"
                      : currentFaceWarning === "multiple_faces"
                      ? "Multiple Faces!"
                      : "No Face Detected!"}
                  </span>
                </div>
              )}
            </div>

            {/* Center - Timer */}
            <div className="flex flex-col items-center">
              <div className="text-4xl font-mono font-bold tracking-wider text-white drop-shadow-lg">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-xs text-blue-200 mt-1 font-medium">Interview Duration</div>
            </div>

            {/* Right Section - Topic & Difficulty */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-lg font-bold text-white">{topic}</div>
                <div className="text-sm text-blue-200 capitalize">{difficulty} Level</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-green-400 to-lime-400 transition-all duration-500 shadow-lg"
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid lg:grid-cols-12 gap-6 p-6 overflow-hidden">
        {/* Left Sidebar - Interview Panel */}
        <div className="lg:col-span-4 flex flex-col space-y-4 overflow-y-auto">
          {/* Interviewer Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-2xl">
            <div className="text-center">
              <InterviewAvatar
                currentQuestion={currentQuestion}
                isAsking={isAvatarAsking}
                onQuestionComplete={onQuestionComplete}
              />
              <h3 className="text-xl font-bold text-white mt-4 mb-2">AI Interviewer</h3>
              <div className="inline-flex items-center px-4 py-2 bg-indigo-500/20 rounded-full border border-indigo-400/30">
                <span className="text-indigo-300 text-sm font-semibold">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </span>
              </div>
              
              {/* Waiting for Video Ready Indicator */}
              {!isVideoReady && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-yellow-300 text-xs font-semibold">
                      Loading video...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Current Question Card */}
          <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 rounded-2xl p-6 border border-blue-500/30 shadow-xl backdrop-blur-sm">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <p className="text-sm font-bold text-blue-300 uppercase tracking-wider">
                Current Question
              </p>
            </div>
            <p className="text-white text-base leading-relaxed">{currentQuestion}</p>
          </div>

          {/* Response Card */}
          {isListening && (
            <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 rounded-2xl p-6 border border-green-500/30 shadow-xl backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-sm font-bold text-green-300 uppercase tracking-wider flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  Listening...
                </p>
              </div>
              <p className="text-green-100 text-sm min-h-[4rem] leading-relaxed">
                {userResponse || "Start speaking your answer..."}
              </p>
            </div>
          )}

          {/* Stats Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50 shadow-xl">
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">
              Interview Statistics
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300 text-sm">Face Validation Issues</span>
                <span
                  className={`text-sm font-bold px-3 py-1 rounded-full ${
                    submissionData.faceValidationFailures > 0
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-green-500/20 text-green-400 border border-green-500/30"
                  }`}
                >
                  {submissionData.faceValidationFailures}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300 text-sm">Multiple Face Detections</span>
                <span
                  className={`text-sm font-bold px-3 py-1 rounded-full ${
                    submissionData.multipleFaceDetections > 0
                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      : "bg-green-500/20 text-green-400 border border-green-500/30"
                  }`}
                >
                  {submissionData.multipleFaceDetections}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300 text-sm">Total Events Logged</span>
                <span className="text-sm font-bold text-blue-400 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30">
                  {interviewEvents.length}
                </span>
              </div>
            </div>

            {/* Warning Display */}
            {currentFaceWarning && (
              <div
                className={`mt-4 p-4 rounded-xl text-sm border-2 ${
                  currentFaceWarning === "multiple_faces"
                    ? "bg-yellow-500/10 text-yellow-200 border-yellow-500/30"
                    : "bg-red-500/10 text-red-200 border-red-500/30"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <strong className="block mb-1">Warning:</strong>
                    {currentFaceWarning === "multiple_faces"
                      ? "Multiple faces detected in frame. Please ensure only you are visible to the camera."
                      : "No face detected in frame. Please ensure your face is clearly visible to the camera for verification."}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Next Question Button */}
          <button
            onClick={onNextQuestion}
            disabled={isAvatarAsking}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 border border-green-400/30"
          >
            {currentQuestionIndex < totalQuestions - 1
              ? "Next Question →"
              : "Complete Interview ✓"}
          </button>
        </div>

        {/* Right Panel - Video Display */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {/* Video Container */}
          <div className="flex-1 relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full bg-black"
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />

            {/* Loading Overlay */}
            {!isVideoReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-slate-900 z-20">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-20 h-20 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1s" }}></div>
                </div>
                <p className="text-white text-lg font-semibold mt-6">Starting Interview...</p>
                <p className="text-slate-400 text-sm mt-2">
                  Preparing your camera stream
                </p>
                <p className="text-slate-500 text-xs mt-4 max-w-md text-center px-4">
                  This should only take a few seconds
                </p>
              </div>
            )}

            {/* Recording Badge */}
            <div className="absolute top-6 left-6 bg-red-600/90 backdrop-blur-sm text-white px-5 py-3 rounded-full text-sm font-bold flex items-center shadow-2xl border border-red-400/50">
              <div className="w-3 h-3 bg-white rounded-full mr-3 animate-pulse shadow-lg"></div>
              REC
            </div>

            {/* Camera Status Badge */}
            <div className="absolute top-6 right-6 bg-black/70 backdrop-blur-md text-white px-5 py-3 rounded-full text-sm flex items-center space-x-2 shadow-xl border border-white/10">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              <span className="font-semibold">{isVideoReady ? "Live" : "Loading..."}</span>
            </div>

            {/* Face Frame Guide Overlay - Only show during setup */}
            {!isVideoReady && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-64 h-80 md:w-80 md:h-96">
                  {/* Face oval guide */}
                  <div className="absolute inset-0 border-4 border-blue-400/50 rounded-full" 
                       style={{ borderStyle: 'dashed' }}>
                  </div>
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-500/90 px-4 py-2 rounded-lg text-white text-sm font-semibold whitespace-nowrap">
                    Position your face here
                  </div>
                </div>
              </div>
            )}

            {/* Audio Waveform Overlay */}
            <div className="absolute bottom-6 left-6 right-6 bg-black/70 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/10">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
                <span className="text-white text-sm font-bold uppercase tracking-wider">
                  Audio Recording Active
                </span>
              </div>
              <canvas
                ref={audioCanvasRef}
                width={800}
                height={60}
                className="w-full rounded-lg"
                style={{ backgroundColor: "rgba(15, 23, 42, 0.5)" }}
              />
            </div>
          </div>

          {/* Control Panel */}
          <div className="flex justify-center items-center space-x-6 bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl shadow-xl border border-slate-700/50">
            <button
              onClick={onExitInterview}
              className="px-10 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-full font-bold text-lg transition-all transform hover:scale-105 flex items-center space-x-3 shadow-xl hover:shadow-2xl border border-red-500/30"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              <span>End Interview</span>
            </button>

            <div className="flex items-center space-x-3 bg-slate-700/50 px-6 py-3 rounded-full border border-slate-600/50">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
              <span className="text-white text-lg font-mono font-bold tracking-wider">
                {formatTime(elapsedTime)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveInterviewSession;
