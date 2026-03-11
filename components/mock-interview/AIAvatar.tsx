"use client";

import { useEffect, useRef, useState, memo } from "react";
import { Box } from "@mui/material";

interface AIAvatarProps {
  isSpeaking?: boolean;
  question?: string;
  onSpeakComplete?: () => void;
  isUserSpeaking?: boolean;
  interviewVideoSrc?: string;
}

export const AIAvatar = memo(function AIAvatar({
  isSpeaking = false,
  question,
  onSpeakComplete,
  isUserSpeaking = false,
  interviewVideoSrc,
}: AIAvatarProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const interviewVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = interviewVideoRef.current;
    if (!interviewVideoSrc || !video) return;

    if (isAnimating) {
      video.loop = true;
      video.muted = true;
      video.play().catch(() => {});
    } else {
      video.pause();
      const seekToLastFrame = () => {
        if (!isNaN(video.duration) && isFinite(video.duration)) {
          video.currentTime = video.duration;
        }
      };
      if (video.readyState >= 1) {
        seekToLastFrame();
      } else {
        video.addEventListener("loadedmetadata", seekToLastFrame, { once: true });
      }
    }
  }, [interviewVideoSrc, isAnimating]);

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

      utterance.onstart = () => setIsAnimating(true);
      utterance.onend = () => {
        setIsAnimating(false);
        onSpeakComplete?.();
      };
      utterance.onerror = () => {
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
    };
  }, [question, isSpeaking, onSpeakComplete]);

  const isTalking = isAnimating && !isUserSpeaking;
  const isListening = isUserSpeaking && !isAnimating;

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
        backgroundColor: "var(--interview-surface)",
        borderRadius: 3,
        overflow: "hidden",
        "@keyframes listenDot": {
          "0%, 100%": { transform: "scale(0.9)", opacity: 0.9 },
          "50%": { transform: "scale(1.2)", opacity: 1 },
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "none",
          transition: "transform 0.4s ease",
        }}
      >
        {interviewVideoSrc && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              minHeight: 280,
              overflow: "hidden",
              zIndex: 1,
              "& video": {
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center center",
                transform: "scale(1.06)",
                transformOrigin: "center center",
              },
            }}
          >
            <video
              ref={interviewVideoRef}
              src={interviewVideoSrc}
              muted
              playsInline
              aria-label="AI interviewer video"
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (!isAnimating && !isNaN(v.duration) && isFinite(v.duration)) {
                  v.currentTime = v.duration;
                  v.pause();
                }
              }}
            />
          </Box>
        )}

        {isListening && (
          <Box
            sx={{
              position: "absolute",
              bottom: 12,
              left: 12,
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.5,
              py: 0.5,
              backgroundColor: "var(--interview-badge-listening-bg)",
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
                backgroundColor: "var(--font-light)",
                animation: "listenDot 0.6s ease-in-out infinite",
              }}
            />
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "var(--font-light)",
                animation: "listenDot 0.6s ease-in-out infinite 0.2s",
              }}
            />
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "var(--font-light)",
                animation: "listenDot 0.6s ease-in-out infinite 0.4s",
              }}
            />
          </Box>
        )}

        {isTalking && (
          <Box
            sx={{
              position: "absolute",
              bottom: 12,
              left: 12,
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 2,
              py: 0.5,
              backgroundColor: "var(--interview-badge-speaking-bg)",
              borderRadius: 2,
              backdropFilter: "blur(8px)",
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "var(--font-light)",
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
                backgroundColor: "var(--font-light)",
                animation: "speakDot 0.8s ease-in-out infinite 0.15s",
              }}
            />
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "var(--font-light)",
                animation: "speakDot 0.8s ease-in-out infinite 0.3s",
              }}
            />
          </Box>
        )}
      </Box>

      {isSpeaking && !isAnimating && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--interview-overlay-bg)",
            borderRadius: 3,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              border: "3px solid var(--interview-spinner-border)",
              borderTopColor: "var(--accent-indigo)",
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
