"use client";

import { useEffect, useRef, useState, memo, useCallback, useMemo } from "react";
import { Box } from "@mui/material";
import { useInterviewerVoice } from "@/lib/hooks/useInterviewerVoice";

const SPEAKING_LOOP_END = 2.2;
const POST_QUESTION_START = 2.6;
// Idle-loop range (in seconds) — the segment of the clip that shows the interviewer
// making small natural movements (head tilts, blinks, slight body shift) without lip
// motion. Looped continuously while the avatar is "waiting" (candidate is speaking or
// the interviewer is between questions), so the avatar feels alive instead of frozen.
// The window is intentionally pushed past POST_QUESTION_START — the first ~0.5s after
// the avatar finishes speaking still contains residual mouth motion + camera-shift
// that looked jarring when looped, so we start the idle slice at 3.1 and trim the
// tail to 5.5 to keep just the calm "listening" beats.
const IDLE_LOOP_START = 3.1;
const IDLE_LOOP_END = 5.5;

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
  const interviewVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoPhaseRef = useRef<VideoPhase>("waiting");

  useEffect(() => {
    if (interviewVideoSrc?.toLowerCase().endsWith(".gif")) return;
    const video = interviewVideoRef.current;
    if (!interviewVideoSrc || !video) return;

    // Drop into the idle-loop segment of the clip and keep playing — gives the avatar
    // subtle, continuous movement (head, eyes, breath) instead of a frozen still frame
    // while the candidate is speaking. This is the "Avatar stands still like a photo"
    // fix.
    const enterIdleLoop = () => {
      const v = interviewVideoRef.current;
      if (!v || videoPhaseRef.current !== "waiting") return;
      const duration = Number.isFinite(v.duration) ? v.duration : IDLE_LOOP_END;
      const start = Math.min(IDLE_LOOP_START, duration);
      // Only seek if we're not already inside the idle range — avoids resetting the
      // playhead mid-loop on every tick.
      if (v.currentTime < start || v.currentTime > Math.min(IDLE_LOOP_END, duration)) {
        v.currentTime = start;
      }
      // Continue playing the idle segment; the timeupdate handler below loops it.
      v.play().catch((e: unknown) => {
        if ((e as { name?: string })?.name === "AbortError") return;
      });
    };

    const onTimeUpdate = () => {
      const phase = videoPhaseRef.current;
      const t = video.currentTime;
      const duration = video.duration;
      const loopEnd = Number.isFinite(duration)
        ? Math.min(IDLE_LOOP_END, duration)
        : IDLE_LOOP_END;

      if (phase === "speaking" && t >= SPEAKING_LOOP_END) {
        // Loop the speaking lip-sync segment until handleSpeakComplete flips us out.
        video.currentTime = 0;
      } else if (phase === "post-question" && t >= loopEnd) {
        // Post-question idle finished — drop straight into the continuous waiting loop.
        videoPhaseRef.current = "waiting";
        enterIdleLoop();
      } else if (phase === "waiting" && t >= loopEnd) {
        // Loop the idle segment continuously so the avatar never freezes.
        video.currentTime = IDLE_LOOP_START;
      }
    };

    const onEnded = () => {
      const phase = videoPhaseRef.current;
      if (phase === "post-question" || phase === "waiting") {
        videoPhaseRef.current = "waiting";
        enterIdleLoop();
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
      video.pause();
      video.currentTime = 0;
      video.play().catch((e: unknown) => {
        if ((e as { name?: string })?.name === "AbortError") return;
      });
    }
  }, [interviewVideoSrc, isAnimating]);

  const handleSpeakStart = useCallback(() => {
    setIsAnimating(true);
  }, []);

  const handleSpeakComplete = useCallback(() => {
    if (!interviewVideoSrc?.toLowerCase().endsWith(".gif")) {
      const video = interviewVideoRef.current;
      if (video) {
        videoPhaseRef.current = "post-question";
        video.pause();
        video.currentTime = POST_QUESTION_START;
        video.play().catch((e: unknown) => {
          if ((e as { name?: string })?.name === "AbortError") return;
        });
      }
    }
    setIsAnimating(false);
    onSpeakComplete?.();
  }, [interviewVideoSrc, onSpeakComplete]);

  useInterviewerVoice({
    question,
    isSpeaking,
    onSpeakStart: handleSpeakStart,
    onSpeakComplete: handleSpeakComplete,
  });

  // Progressive caption reveal — the subtitle text appears word-by-word as the avatar
  // "speaks" rather than dumping the whole sentence at once. We pace at roughly a natural
  // TTS speaking cadence; exact word-level sync isn't possible across the browser/cloud
  // voice paths, but a steady reveal reads as "the text comes as the interviewer talks".
  // It resets whenever a new question starts speaking.
  const captionWords = useMemo(
    () => (question ? question.trim().split(/\s+/).filter(Boolean) : []),
    [question],
  );
  const [revealedWordCount, setRevealedWordCount] = useState(0);
  useEffect(() => {
    if (!isAnimating || captionWords.length === 0) {
      setRevealedWordCount(0);
      return;
    }
    let shown = 1;
    setRevealedWordCount(shown);
    const PER_WORD_MS = 280; // ~215 wpm, close to the avatar's spoken pace
    const id = window.setInterval(() => {
      shown += 1;
      setRevealedWordCount(shown);
      if (shown >= captionWords.length) {
        window.clearInterval(id);
      }
    }, PER_WORD_MS);
    return () => window.clearInterval(id);
  }, [isAnimating, captionWords]);

  const revealedCaption = useMemo(
    () => captionWords.slice(0, revealedWordCount).join(" "),
    [captionWords, revealedWordCount],
  );

  const isTalking = isAnimating && !isUserSpeaking;
  const isListening = isUserSpeaking && !isAnimating;

  const isGif = interviewVideoSrc?.toLowerCase().endsWith(".gif");
  const showSpinner = isSpeaking && !isAnimating && !question?.trim();

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
        // No inner borderRadius — the parent tile in VideoPreviewArea already clips with
        // `borderRadius: 2 + overflow: hidden`, exactly the way the user-video tile does.
        // Setting a higher radius here was leaving the video visibly rounded on the AI
        // side while the user side stayed square — see the parent wrapper for the actual
        // tile shape.
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
                preload="auto"
                aria-label="AI interviewer video"
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  if (!isAnimating) {
                    // Initial state — start the idle loop instead of freezing on the
                    // last frame, so the avatar feels alive before any question fires.
                    videoPhaseRef.current = "waiting";
                    const duration = Number.isFinite(v.duration) ? v.duration : IDLE_LOOP_END;
                    v.currentTime = Math.min(IDLE_LOOP_START, duration);
                    v.play().catch((err: unknown) => {
                      if ((err as { name?: string })?.name === "AbortError") return;
                      if ((err as { name?: string })?.name === "NotAllowedError") return;
                    });
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

      {/* Interviewer caption — what the avatar is saying, rendered as subtitle text
          at the bottom of the tile while the speaking animation is active. Always
          visible during speech (not gated on accessibility setting) since the user
          explicitly asked for captions to be shown by default. The text fades in/out
          via opacity so the transition feels natural. */}
      {isAnimating && question && (
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5,
            px: 2.5,
            py: 1.5,
            background:
              "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.78) 100%)",
            pointerEvents: "none",
          }}
        >
          <Box
            component="p"
            sx={{
              margin: 0,
              color: "var(--font-light)",
              fontSize: { xs: "0.85rem", sm: "0.95rem" },
              lineHeight: 1.45,
              fontWeight: 500,
              textShadow: "0 1px 4px rgba(0,0,0,0.6)",
            }}
            aria-live="polite"
          >
            {revealedCaption || " "}
          </Box>
        </Box>
      )}

      {showSpinner && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--interview-overlay-bg)",
            // No inner radius — the parent tile already clips with overflow: hidden.
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
