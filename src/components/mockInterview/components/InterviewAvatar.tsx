import React, { useEffect, useRef, useState } from "react";
import useTextToSpeech from "../services/textToSpeechService";

interface InterviewAvatarProps {
  currentQuestion?: string;
  isAsking?: boolean;
  onQuestionComplete?: () => void;
  className?: string;
}

const InterviewAvatar: React.FC<InterviewAvatarProps> = ({
  currentQuestion,
  isAsking = false,
  onQuestionComplete,
  className = "",
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const { speak, stop, isSpeaking: ttsIsSpeaking } = useTextToSpeech();
  const lastQuestionRef = useRef<string>("");

  // Natural eye blinking effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 150); // Blink duration
    }, 3000 + Math.random() * 2000); // Random blink every 3-5 seconds

    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    if (isAsking && currentQuestion && currentQuestion.trim()) {
      if (lastQuestionRef.current === currentQuestion) {
        return;
      }

      lastQuestionRef.current = currentQuestion;
      setIsSpeaking(true);

      setTimeout(() => {
        speak(currentQuestion, {
          rate: 0.95,
          pitch: 1.0,
          volume: 0.85,
        });
      }, 300);
    }
    
    if (!isAsking) {
      lastQuestionRef.current = "";
    }
  }, [isAsking, currentQuestion, speak]);

  useEffect(() => {
    if (!ttsIsSpeaking && isSpeaking) {
      setIsSpeaking(false);
      setTimeout(() => {
        onQuestionComplete?.();
      }, 500);
    }
  }, [ttsIsSpeaking, isSpeaking, onQuestionComplete]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return (
    <div className={`flex flex-col items-center justify-center w-full ${className}`}>
      {/* Human-like Avatar */}
      <div className="relative flex items-center justify-center">
        {/* Glow effect when speaking */}
        {isSpeaking && (
          <div className="absolute inset-0 rounded-full">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse blur-2xl opacity-60"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-ping opacity-40"></div>
          </div>
        )}

        {/* Main Avatar Circle */}
        <div
          className={`relative w-64 h-64 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl transition-all duration-300 ${
            isSpeaking ? "scale-110 shadow-blue-500/50" : "scale-100"
          }`}
        >
          {/* Inner Circle - Face */}
          <div className="relative w-56 h-56 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center overflow-hidden shadow-inner">
            {/* Face Elements */}
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              {/* Hair */}
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-slate-800 to-slate-700 rounded-t-full"></div>

              {/* Eyes */}
              <div className="flex space-x-12 mb-8 relative z-10" style={{ marginTop: '20px' }}>
                {/* Left Eye */}
                <div className="relative">
                  <div className={`w-8 bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-150 ${isSpeaking ? 'scale-110' : ''} ${isBlinking ? 'h-1' : 'h-8'}`}>
                    {!isBlinking && (
                      <div className={`w-4 h-4 bg-slate-900 rounded-full relative transition-all duration-200 ${isSpeaking ? 'animate-pulse' : ''}`}>
                        <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                  {/* Eyebrow */}
                  <div className="absolute -top-3 left-0 right-0 h-1 bg-slate-800 rounded-full transform -translate-y-1"></div>
                </div>

                {/* Right Eye */}
                <div className="relative">
                  <div className={`w-8 bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-150 ${isSpeaking ? 'scale-110' : ''} ${isBlinking ? 'h-1' : 'h-8'}`}>
                    {!isBlinking && (
                      <div className={`w-4 h-4 bg-slate-900 rounded-full relative transition-all duration-200 ${isSpeaking ? 'animate-pulse' : ''}`}>
                        <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                  {/* Eyebrow */}
                  <div className="absolute -top-3 left-0 right-0 h-1 bg-slate-800 rounded-full transform -translate-y-1"></div>
                </div>
              </div>

              {/* Nose */}
              <div className="w-6 h-8 bg-amber-300/40 rounded-full mb-4 shadow-sm"></div>

              {/* Mouth */}
              <div className="relative">
                {isSpeaking ? (
                  <div className="w-20 h-12 bg-slate-800 rounded-full relative overflow-hidden animate-pulse">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-6 bg-red-400 rounded-full"></div>
                    </div>
                  </div>
                ) : (
                  <div className="w-16 h-2 bg-slate-800 rounded-full" style={{ borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }}></div>
                )}
              </div>
            </div>

            {/* Subtle face shading */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-amber-300/20 rounded-full pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* Status Text */}
      <div className="mt-8 text-center w-full">
        <div className="flex items-center justify-center space-x-3 bg-slate-800/50 backdrop-blur-sm px-6 py-3 rounded-full border border-slate-700">
          {isSpeaking ? (
            <>
              <svg className="w-6 h-6 text-blue-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
              <p className="text-xl font-bold text-white">AI Interviewer is asking...</p>
            </>
          ) : isAsking ? (
            <>
              <svg className="w-6 h-6 text-indigo-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p className="text-xl font-bold text-white">Preparing question...</p>
            </>
          ) : (
            <>
              <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-xl font-bold text-white">Ready for your answer</p>
            </>
          )}
        </div>
      </div>

      {/* Sound Wave Animation */}
      {isSpeaking && (
        <div className="mt-6 flex space-x-1 items-end h-12">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 bg-gradient-to-t from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-150"
              style={{
                height: `${12 + Math.abs(Math.sin((i * Math.PI) / 10 + Date.now() / 200)) * 32}px`,
                animationDelay: `${i * 30}ms`,
                animation: 'pulse 0.6s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InterviewAvatar;
