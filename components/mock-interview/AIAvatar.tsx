"use client";

import { useEffect, useRef, useState, memo } from "react";
import { Box } from "@mui/material";

const SPEAKING_LOOP_END = 2.2;
const POST_QUESTION_START = 2.6;
const POST_QUESTION_END = 6;
const WAITING_LAST_FRAME = 5.8;

type VideoPhase = "speaking" | "post-question" | "waiting";

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
  const videoPhaseRef = useRef<VideoPhase>("waiting");

  useEffect(() => {
    if (interviewVideoSrc?.toLowerCase().endsWith(".gif")) return;
    const video = interviewVideoRef.current;
    if (!interviewVideoSrc || !video) return;

    const seekToLastFrame = () => {
      const v = interviewVideoRef.current;
      if (!v || videoPhaseRef.current !== "waiting") return;
      const end = Number.isFinite(v.duration) ? Math.min(WAITING_LAST_FRAME, v.duration) : WAITING_LAST_FRAME;
      v.currentTime = end;
      v.pause();
    };

    const onTimeUpdate = () => {
      const phase = videoPhaseRef.current;
      const t = video.currentTime;
      const duration = video.duration;
      const end = Number.isFinite(duration) ? Math.min(POST_QUESTION_END, duration) : POST_QUESTION_END;

      if (phase === "speaking" && t >= SPEAKING_LOOP_END) {
        video.currentTime = 0;
      } else if (phase === "post-question" && t >= end) {
        videoPhaseRef.current = "waiting";
        seekToLastFrame();
      }
    };

    const onEnded = () => {
      const phase = videoPhaseRef.current;
      if (phase === "post-question") {
        videoPhaseRef.current = "waiting";
        seekToLastFrame();
      } else if (phase === "waiting") {
        seekToLastFrame();
      }
    };

    video.muted = true;
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, [interviewVideoSrc]);

  useEffect(() => {
    if (interviewVideoSrc?.toLowerCase().endsWith(".gif")) return;
    const video = interviewVideoRef.current;
    if (!interviewVideoSrc || !video) return;

    if (isAnimating) {
      videoPhaseRef.current = "speaking";
      video.loop = false;
      video.currentTime = 0;
      video.play().catch(() => {});
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
        if (!interviewVideoSrc?.toLowerCase().endsWith(".gif")) {
          const video = interviewVideoRef.current;
          if (video) {
            videoPhaseRef.current = "post-question";
            video.currentTime = POST_QUESTION_START;
            video.play().catch(() => {});
          }
        }
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

  const isGif = interviewVideoSrc?.toLowerCase().endsWith(".gif");

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
              "& video, & img": {
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center 28%",
                transform: "none",
                transformOrigin: "center center",
              },
            }}
          >
            {isGif ? (
              <img
                src={interviewVideoSrc}
                alt="AI interviewer"
                style={{ display: "block" }}
              />
            ) : (
              <video
                ref={interviewVideoRef}
                src={interviewVideoSrc}
                muted
                playsInline
                aria-label="AI interviewer video"
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  if (!isAnimating) {
                    videoPhaseRef.current = "waiting";
                    const end = Number.isFinite(v.duration) ? Math.min(WAITING_LAST_FRAME, v.duration) : WAITING_LAST_FRAME;
                    v.currentTime = end;
                    v.pause();
                  }
                }}
              />
            )}
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
