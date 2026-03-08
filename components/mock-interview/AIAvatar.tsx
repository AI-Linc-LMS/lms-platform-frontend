"use client";

import { useEffect, useRef, useState, memo } from "react";
import { Box } from "@mui/material";

interface AIAvatarProps {
  isSpeaking?: boolean;
  question?: string;
  onSpeakComplete?: () => void;
  /** When true, avatar shows "listening" expression (user is talking). */
  isUserSpeaking?: boolean;
}

const BLINK_MIN_MS = 2000;
const BLINK_MAX_MS = 5000;
const BLINK_DURATION_MS = 120;
const MOUTH_SPEAK_CYCLE_MS = 180;

function scheduleNextBlink(cb: () => void): number {
  const delay = BLINK_MIN_MS + Math.random() * (BLINK_MAX_MS - BLINK_MIN_MS);
  return window.setTimeout(cb, delay);
}

export const AIAvatar = memo(function AIAvatar({
  isSpeaking = false,
  question,
  onSpeakComplete,
  isUserSpeaking = false,
}: AIAvatarProps) {
  const [eyesClosed, setEyesClosed] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0); // 0 = closed, 1 = open (for speaking)
  const [isAnimating, setIsAnimating] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const blinkTimerRef = useRef<number | null>(null);
  const mouthIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Blinking: random interval
  useEffect(() => {
    const doBlink = () => {
      setEyesClosed(true);
      const openTimer = window.setTimeout(() => {
        setEyesClosed(false);
        blinkTimerRef.current = scheduleNextBlink(doBlink);
      }, BLINK_DURATION_MS);
      return () => clearTimeout(openTimer);
    };
    blinkTimerRef.current = scheduleNextBlink(doBlink);
    return () => {
      if (blinkTimerRef.current != null) clearTimeout(blinkTimerRef.current);
    };
  }, []);

  // TTS and speaking mouth animation
  useEffect(() => {
    if (question && isSpeaking) {
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(question);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        setIsAnimating(true);
        setMouthOpen(0);
        // Rhythmic mouth open/close while speaking
        mouthIntervalRef.current = setInterval(() => {
          setMouthOpen((prev) => (prev === 0 ? 1 : 0));
        }, MOUTH_SPEAK_CYCLE_MS);
      };

      utterance.onend = () => {
        if (mouthIntervalRef.current) {
          clearInterval(mouthIntervalRef.current);
          mouthIntervalRef.current = null;
        }
        setMouthOpen(0);
        setIsAnimating(false);
        onSpeakComplete?.();
      };

      utterance.onerror = () => {
        if (mouthIntervalRef.current) {
          clearInterval(mouthIntervalRef.current);
          mouthIntervalRef.current = null;
        }
        setMouthOpen(0);
        setIsAnimating(false);
        onSpeakComplete?.();
      };

      speechSynthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }

    return () => {
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }
      if (mouthIntervalRef.current) {
        clearInterval(mouthIntervalRef.current);
        mouthIntervalRef.current = null;
      }
    };
  }, [question, isSpeaking, onSpeakComplete]);

  const isTalking = isAnimating;
  const isListening = isUserSpeaking && !isTalking;

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 280,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
        borderRadius: 3,
        overflow: "hidden",
        "@keyframes listenDot": {
          "0%, 100%": { transform: "scale(0.9)", opacity: 0.9 },
          "50%": { transform: "scale(1.2)", opacity: 1 },
        },
      }}
    >
      {/* Human-like face container with optional listening tilt */}
      <Box
        sx={{
          position: "relative",
          width: 200,
          height: 240,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: isListening ? "rotate(-2deg)" : "rotate(0deg)",
          transition: "transform 0.4s ease",
        }}
      >
        {/* Soft background glow */}
        <Box
          sx={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: isTalking
              ? "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)"
              : isListening
                ? "radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(100,116,139,0.1) 0%, transparent 70%)",
            animation: isTalking ? "avatarGlow 2s ease-in-out infinite" : "none",
            "@keyframes avatarGlow": {
              "0%, 100%": { opacity: 1, transform: "scale(1)" },
              "50%": { opacity: 0.7, transform: "scale(1.05)" },
            },
          }}
        />

        {/* Face SVG — human-like skin, eyes, and features */}
        <Box
          component="svg"
          viewBox="0 0 200 220"
          sx={{
            width: 200,
            height: 220,
            overflow: "visible",
            filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.06))",
          }}
        >
          <defs>
            <linearGradient id="skinBase" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f0e2d8" />
              <stop offset="35%" stopColor="#e5d4c8" />
              <stop offset="70%" stopColor="#dcc8ba" />
              <stop offset="100%" stopColor="#d2bcae" />
            </linearGradient>
            <radialGradient id="foreheadHighlight" cx="50%" cy="30%" r="50%">
              <stop offset="0%" stopColor="rgba(255,248,242,0.4)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="cheekWarmth" cx="50%" cy="55%" r="45%">
              <stop offset="0%" stopColor="rgba(230,190,175,0.35)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="chinShadow" cx="50%" cy="95%" r="40%">
              <stop offset="0%" stopColor="rgba(180,150,140,0.15)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <linearGradient id="irisGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6b5b4f" />
              <stop offset="50%" stopColor="#4a4038" />
              <stop offset="100%" stopColor="#3d342e" />
            </linearGradient>
            <linearGradient id="lipGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#b89585" />
              <stop offset="100%" stopColor="#9a7b6e" />
            </linearGradient>
          </defs>

          {/* Head — oval */}
          <ellipse cx="100" cy="106" rx="80" ry="96" fill="url(#skinBase)" stroke="#c4ad9d" strokeWidth="1" />
          <ellipse cx="100" cy="106" rx="80" ry="96" fill="url(#foreheadHighlight)" />
          <ellipse cx="100" cy="110" rx="72" ry="86" fill="url(#cheekWarmth)" />
          <ellipse cx="100" cy="106" rx="80" ry="96" fill="url(#chinShadow)" />

          {/* Nose — soft bridge and tip */}
          <path d="M 100 72 Q 99 95 100 118 Q 101 125 100 132" fill="none" stroke="#c9b5a5" strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
          <ellipse cx="100" cy="132" rx="4" ry="3" fill="rgba(200,175,165,0.3)" />

          {/* Left eye */}
          <g transform="translate(56, 86)">
            {eyesClosed ? (
              <path d="M -11 1 Q 0 5 11 1" fill="none" stroke="#5a4d42" strokeWidth="1.8" strokeLinecap="round" />
            ) : (
              <>
                <ellipse cx="0" cy="0" rx="13" ry="9" fill="#faf8f5" stroke="#e8e2dc" strokeWidth="0.8" />
                <ellipse cx="0" cy="0" rx="8" ry="10" fill="url(#irisGradient)" />
                <ellipse cx="0" cy="-1" rx="2.5" ry="3" fill="#2a2520" />
                <ellipse cx="1.5" cy="-2.5" rx="1.5" ry="2" fill="rgba(255,255,255,0.7)" />
              </>
            )}
          </g>
          {/* Right eye */}
          <g transform="translate(144, 86)">
            {eyesClosed ? (
              <path d="M -11 1 Q 0 5 11 1" fill="none" stroke="#5a4d42" strokeWidth="1.8" strokeLinecap="round" />
            ) : (
              <>
                <ellipse cx="0" cy="0" rx="13" ry="9" fill="#faf8f5" stroke="#e8e2dc" strokeWidth="0.8" />
                <ellipse cx="0" cy="0" rx="8" ry="10" fill="url(#irisGradient)" />
                <ellipse cx="0" cy="-1" rx="2.5" ry="3" fill="#2a2520" />
                <ellipse cx="1.5" cy="-2.5" rx="1.5" ry="2" fill="rgba(255,255,255,0.7)" />
              </>
            )}
          </g>

          {/* Eyebrows — soft, natural */}
          <g transform={`translate(0, ${isListening ? -0.5 : 0})`}>
            <path
              d="M 46 72 Q 62 68 78 72 Q 92 75 100 74 Q 108 73 122 72 Q 138 68 154 72"
              fill="none"
              stroke="#6b5b52"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.9"
            />
          </g>

          {/* Mouth — lips when idle/listening, open when talking */}
          <g transform="translate(100, 150)">
            {isTalking && mouthOpen >= 1 ? (
              <ellipse cx="0" cy="5" rx="12" ry="8" fill="#7a6560" />
            ) : isListening ? (
              <path d="M -12 0 Q 0 8 12 0" fill="none" stroke="url(#lipGradient)" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <>
                <path d="M -14 -1 Q 0 4 14 -1" fill="none" stroke="url(#lipGradient)" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M -12 1 Q 0 5 12 1" fill="none" stroke="url(#lipGradient)" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
              </>
            )}
          </g>
        </Box>

        {/* Listening indicator dots when user is speaking */}
        {isListening && (
          <Box
            sx={{
              position: "absolute",
              bottom: -8,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.5,
              py: 0.5,
              backgroundColor: "rgba(34, 197, 94, 0.9)",
              borderRadius: 2,
              backdropFilter: "blur(8px)",
              animation: "listenPulse 1.5s ease-in-out infinite",
              "@keyframes listenPulse": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.85 },
              },
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#fff",
                animation: "listenDot 0.6s ease-in-out infinite",
              }}
            />
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#fff",
                animation: "listenDot 0.6s ease-in-out infinite 0.2s",
              }}
            />
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#fff",
                animation: "listenDot 0.6s ease-in-out infinite 0.4s",
              }}
            />
          </Box>
        )}

        {/* Speaking indicator when AI is talking */}
        {isTalking && (
          <Box
            sx={{
              position: "absolute",
              bottom: -8,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 2,
              py: 0.5,
              backgroundColor: "rgba(99, 102, 241, 0.9)",
              borderRadius: 2,
              backdropFilter: "blur(8px)",
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#fff",
                animation: "speakDot 0.8s ease-in-out infinite",
                "@keyframes speakDot": {
                  "0%, 100%": { transform: "scale(0.8)", opacity: 0.8 },
                  "50%": { transform: "scale(1.2)", opacity: 1 },
                },
              }}
            />
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#fff",
                animation: "speakDot 0.8s ease-in-out infinite 0.15s",
              }}
            />
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#fff",
                animation: "speakDot 0.8s ease-in-out infinite 0.3s",
              }}
            />
          </Box>
        )}
      </Box>

      {/* Loading overlay only when about to speak but TTS not started yet */}
      {isSpeaking && !isAnimating && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(248, 250, 252, 0.85)",
            borderRadius: 3,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              border: "3px solid #e2e8f0",
              borderTopColor: "#6366f1",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              "@keyframes spin": { to: { transform: "rotate(360deg)" } },
            }}
          />
        </Box>
      )}
    </Box>
  );
});
