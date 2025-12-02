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
  // --- states ---
  const [isSpeaking, setIsSpeaking] = useState(false); // visual speaking state
  const [isBlinking, setIsBlinking] = useState(false);
  const [headTilt, setHeadTilt] = useState(0);
  const [headBob, setHeadBob] = useState(0);
  const [mouthShape, setMouthShape] = useState<0 | 1 | 2>(0);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const { speak, stop, isSpeaking: ttsIsSpeaking } = useTextToSpeech();
  const lastQuestionRef = useRef<string>("");

  // --- Blinking: variable intervals & occasional double blink ---
  useEffect(() => {
    let alive = true;
    const blinkLoop = async () => {
      while (alive) {
        // pause
        const wait = 1500 + Math.random() * 3000;
        await new Promise((res) => setTimeout(res, wait));
        if (!alive) break;

        // single blink
        setIsBlinking(true);
        await new Promise((res) => setTimeout(res, 90 + Math.random() * 80));
        setIsBlinking(false);

        // sometimes a double blink
        if (Math.random() < 0.18) {
          await new Promise((res) => setTimeout(res, 80 + Math.random() * 120));
          setIsBlinking(true);
          await new Promise((res) => setTimeout(res, 80 + Math.random() * 80));
          setIsBlinking(false);
        }
      }
    };

    blinkLoop();
    return () => {
      alive = false;
    };
  }, []);

  // --- Eye micro-movements (saccades) ---
  useEffect(() => {
    let alive = true;
    const loop = async () => {
      while (alive) {
        const interval = 1400 + Math.random() * 2500;
        await new Promise((res) => setTimeout(res, interval));
        if (!alive) break;

        const maxX = 4;
        const maxY = 3;
        setEyeOffset({
          x: Math.round((Math.random() * 2 - 1) * maxX),
          y: Math.round((Math.random() * 2 - 1) * maxY),
        });

        // quick micro-saccade after a short delay sometimes
        if (Math.random() < 0.3) {
          await new Promise((r) => setTimeout(r, 120 + Math.random() * 140));
          setEyeOffset({
            x: Math.round((Math.random() * 2 - 1) * maxX),
            y: Math.round((Math.random() * 2 - 1) * maxY),
          });
        }
      }
    };

    loop();
    return () => {
      alive = false;
    };
  }, []);

  // --- Head motion: bob + tilt while speaking, gentle breathing idle when silent ---
  useEffect(() => {
    let rafId: number | null = null;
    let start = Date.now();

    const step = () => {
      const t = (Date.now() - start) / 1000;
      if (isSpeaking) {
        // livelier when speaking
        setHeadBob(Math.sin(t * 2.5) * 3.2); // small bob
        setHeadTilt(Math.sin(t * 1.6) * 2.2); // small tilt
      } else {
        // slow breathing when idle
        setHeadBob(Math.sin(t * 0.6) * 1.8);
        setHeadTilt(Math.sin(t * 0.35) * 0.8);
      }
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isSpeaking]);

  // --- Lip-sync (shape switching based on TTS speaking flag) ---
  useEffect(() => {
    if (!ttsIsSpeaking) {
      setMouthShape(0);
      return;
    }

    let alive = true;
    const loop = async () => {
      while (alive) {
        // quicker changes while speaking
        const r = Math.random();
        // bias toward mid-open shapes most of the time
        if (r < 0.45) setMouthShape(1);
        else if (r < 0.9) setMouthShape(2);
        else setMouthShape(0);
        await new Promise((res) => setTimeout(res, 80 + Math.random() * 160));
      }
    };
    loop();

    return () => {
      alive = false;
      setMouthShape(0);
    };
  }, [ttsIsSpeaking]);

  // --- TTS orchestration: speak when isAsking + new question ---
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

  // --- Sync local visual speaking with TTS state, call completion callback ---
  useEffect(() => {
    if (!ttsIsSpeaking && isSpeaking) {
      // finished speaking
      setIsSpeaking(false);
      // small delay so exit animation shows
      setTimeout(() => {
        onQuestionComplete?.();
      }, 500);
    } else if (ttsIsSpeaking && !isSpeaking) {
      setIsSpeaking(true);
    }
  }, [ttsIsSpeaking, isSpeaking, onQuestionComplete]);

  // --- stop TTS on unmount ---
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  // --- Sound wave helper: approximate animated heights ---
  const soundBarHeight = (i: number) => {
    // if speaking, produce dynamic heights, otherwise minimal
    if (!isSpeaking) return 6;
    // pseudo-random but stable per render using i and time
    const seed = Date.now() / 200 + i * 0.7;
    const v = 12 + Math.abs(Math.sin(seed)) * 36;
    return Math.round(v);
  };

  // --- Render ---
  return (
    <div
      className={`flex flex-col items-center justify-center w-full ${className}`}
    >
      {/* Avatar + glow */}
      <div className="relative flex items-center justify-center">
        {isSpeaking && (
          <div className="absolute inset-0 rounded-full pointer-events-none">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse blur-3xl opacity-50"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-ping opacity-30"></div>
          </div>
        )}

        <div
          className={`relative w-72 h-72 rounded-full bg-gradient-to-br from-indigo-600 via-blue-700 to-purple-700 flex items-center justify-center shadow-2xl transition-all duration-300`}
          style={{
            transform: `scale(${
              isSpeaking ? 1.05 : 1
            }) translateY(${headBob}px) rotate(${headTilt}deg)`,
            boxShadow: isSpeaking
              ? "0 25px 50px -12px rgba(59, 130, 246, 0.6)"
              : "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div className="relative w-64 h-64 rounded-full overflow-hidden bg-gradient-to-br from-amber-50 via-amber-100 to-amber-150 shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-b from-sky-200/30 via-transparent to-transparent"></div>

            {/* Hair */}
            <div className="absolute top-0 left-0 right-0 h-24 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-700 to-slate-600 rounded-t-full"></div>
              <div className="absolute top-2 left-8 w-1 h-16 bg-slate-900/30 rounded-full transform -rotate-12"></div>
              <div className="absolute top-1 right-12 w-1 h-14 bg-slate-900/30 rounded-full transform rotate-12"></div>
              <div className="absolute top-3 left-16 w-1 h-12 bg-slate-900/30 rounded-full transform -rotate-6"></div>
            </div>

            {/* Facial area */}
            <div className="relative w-full h-full flex flex-col items-center pt-16">
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-16 h-8 bg-white/20 rounded-full blur-lg"></div>

              {/* Eyes (with offset applied to pupils) */}
              <div className="flex space-x-14 mb-10 relative z-10">
                {/* Left eye */}
                <div className="relative">
                  <div
                    className={`absolute -top-4 left-0 w-10 h-1.5 bg-slate-700 rounded-full transition-all duration-200 ${
                      isSpeaking ? "translate-y-0.5" : ""
                    }`}
                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}
                  />
                  <div className="absolute -top-1 -left-1 w-10 h-10 bg-amber-200 rounded-full"></div>

                  <div
                    className={`relative w-9 bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-150 ${
                      isSpeaking ? "scale-105" : ""
                    } ${isBlinking ? "h-1" : "h-9"}`}
                    style={{ overflow: "hidden" }}
                  >
                    {!isBlinking && (
                      <div
                        className={`relative w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 transition-all duration-200 ${
                          isSpeaking ? "scale-110" : ""
                        }`}
                      >
                        <div
                          className="absolute top-1/2 left-1/2 bg-black rounded-full"
                          style={{
                            width: 10,
                            height: 10,
                            transform: `translate(-50%, -50%) translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
                          }}
                        >
                          <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-white rounded-full opacity-90"></div>
                          <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-white/50 rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isBlinking && (
                    <>
                      <div className="absolute top-0 left-2 w-px h-2 bg-slate-800/60 transform -rotate-45"></div>
                      <div className="absolute top-0 left-4 w-px h-2 bg-slate-800/60 transform -rotate-30"></div>
                      <div className="absolute top-0 right-2 w-px h-2 bg-slate-800/60 transform rotate-45"></div>
                    </>
                  )}
                </div>

                {/* Right eye */}
                <div className="relative">
                  <div
                    className={`absolute -top-4 left-0 w-10 h-1.5 bg-slate-700 rounded-full transition-all duration-200 ${
                      isSpeaking ? "translate-y-0.5" : ""
                    }`}
                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}
                  />
                  <div className="absolute -top-1 -left-1 w-10 h-10 bg-amber-200 rounded-full"></div>

                  <div
                    className={`relative w-9 bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-150 ${
                      isSpeaking ? "scale-105" : ""
                    } ${isBlinking ? "h-1" : "h-9"}`}
                    style={{ overflow: "hidden" }}
                  >
                    {!isBlinking && (
                      <div
                        className={`relative w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 transition-all duration-200 ${
                          isSpeaking ? "scale-110" : ""
                        }`}
                      >
                        <div
                          className="absolute top-1/2 left-1/2 bg-black rounded-full"
                          style={{
                            width: 10,
                            height: 10,
                            transform: `translate(-50%, -50%) translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
                          }}
                        >
                          <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-white rounded-full opacity-90"></div>
                          <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-white/50 rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isBlinking && (
                    <>
                      <div className="absolute top-0 left-2 w-px h-2 bg-slate-800/60 transform -rotate-45"></div>
                      <div className="absolute top-0 left-4 w-px h-2 bg-slate-800/60 transform -rotate-30"></div>
                      <div className="absolute top-0 right-2 w-px h-2 bg-slate-800/60 transform rotate-45"></div>
                    </>
                  )}
                </div>
              </div>

              {/* Nose */}
              <div className="relative mb-6">
                <div className="w-7 h-12 bg-gradient-to-br from-amber-200 to-amber-300 rounded-full shadow-sm"></div>
                <div className="absolute bottom-1 left-1 w-1.5 h-2 bg-amber-400 rounded-full"></div>
                <div className="absolute bottom-1 right-1 w-1.5 h-2 bg-amber-400 rounded-full"></div>
              </div>

              {/* Mouth (lip sync shapes) */}
              <div className="relative">
                {/* Closed */}
                {mouthShape === 0 && (
                  <div
                    className="w-20 h-3 bg-gradient-to-b from-red-400 to-red-500 rounded-full shadow-sm"
                    style={{
                      borderRadius: "50% 50% 50% 50% / 100% 100% 80% 80%",
                      transition: "height 120ms ease, transform 120ms ease",
                    }}
                  />
                )}

                {/* Slight open */}
                {mouthShape === 1 && (
                  <div
                    className="w-20 h-6 rounded-full bg-gradient-to-b from-red-300 to-red-400 overflow-hidden shadow-inner"
                    style={{ transition: "height 120ms ease" }}
                  />
                )}

                {/* Wide open */}
                {mouthShape === 2 && (
                  <div className="w-24 h-14 bg-gradient-to-b from-red-300 to-red-400 rounded-full overflow-hidden shadow-inner">
                    <div className="absolute top-1 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
                      <div className="w-2.5 h-3 bg-white rounded-sm" />
                      <div className="w-2.5 h-3 bg-white rounded-sm" />
                      <div className="w-2.5 h-3 bg-white rounded-sm" />
                    </div>
                    <div className="absolute top-4 inset-x-2 bottom-2 bg-gradient-to-b from-red-600 to-red-800 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-amber-300/30 rounded-full pointer-events-none"></div>
            <div className="absolute top-32 left-8 w-12 h-8 bg-pink-200/40 rounded-full blur-md"></div>
            <div className="absolute top-32 right-8 w-12 h-8 bg-pink-200/40 rounded-full blur-md"></div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-amber-300/30 rounded-full blur-lg"></div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="mt-8 text-center w-full">
        <div className="flex items-center justify-center space-x-3 bg-slate-800/50 backdrop-blur-sm px-6 py-3 rounded-full border border-slate-700">
          {isSpeaking ? (
            <>
              <svg
                className="w-6 h-6 text-blue-400 animate-pulse"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-xl font-bold text-white">
                AI Interviewer is asking...
              </p>
            </>
          ) : isAsking ? (
            <>
              <svg
                className="w-6 h-6 text-indigo-400 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <p className="text-xl font-bold text-white">
                Preparing question...
              </p>
            </>
          ) : (
            <>
              <svg
                className="w-6 h-6 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-xl font-bold text-white">
                Ready for your answer
              </p>
            </>
          )}
        </div>
      </div>

      {/* Sound wave */}
      {isSpeaking && (
        <div className="mt-6 flex space-x-1 items-end h-12">
          {Array.from({ length: 20 }).map((_, i) => {
            const h = soundBarHeight(i);
            return (
              <div
                key={i}
                className="w-1.5 rounded-full transition-all duration-150"
                style={{
                  height: `${h}px`,
                  background: "linear-gradient(180deg,#3b82f6,#7c3aed)",
                  opacity: 0.95,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InterviewAvatar;
