"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Button, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { QuestionCard } from "@/components/interview/room/QuestionCard";
import { InterviewTranscript } from "@/components/interview/room/InterviewTranscript";
import {
  ROOM_BG,
  ROOM_BORDER,
  ROOM_GREEN,
  ROOM_PANEL,
  ROOM_RED,
  ROOM_TEXT,
  ROOM_TEXT_DIM,
  ROOM_TEXT_FAINT,
  ROOM_VIOLET,
} from "@/components/ai-tutor/room/roomTokens";
import { useRealtimeInterview } from "@/lib/hooks/useRealtimeInterview";

/**
 * The live interview room.
 *
 * **The URL never changes while the call is up.** `/interview/room?template=<id>` is where the
 * whole interview happens, including after the real session id is known. The global camera
 * route guard tears media streams down on pathname change, so rewriting the URL mid-call would
 * kill the microphone and the interviewer's voice. The same constraint shapes the tutor room.
 *
 * Dark, matching the tutor's session room and importing the same tokens, because the two are
 * the same kind of surface: a place you talk to something, not a page of content.
 */

const PHASE_COPY: Record<string, string> = {
  idle: "Ready when you are.",
  starting: "Setting up your interview...",
  connecting: "Connecting...",
  live: "Live",
  ending: "Wrapping up...",
  ended: "Finished",
  failed: "Something went wrong",
};

function InterviewRoom() {
  const router = useRouter();
  const params = useSearchParams();
  const templateId = Number(params.get("template") || 0);

  const {
    phase,
    error,
    transcript,
    currentQuestion,
    questionCount,
    candidateSpeaking,
    sessionId,
    connect,
    end,
    setMuted: setMicMuted,
  } = useRealtimeInterview();

  const [muted, setMuted] = useState(false);
  const startedRef = useRef(false);
  const finishedSessionRef = useRef<string>("");

  // Auto-start once. A candidate arriving here has already agreed to sit the interview on the
  // previous screen, so a second "begin" click is friction in a timed exercise.
  useEffect(() => {
    if (!templateId || startedRef.current) return;
    startedRef.current = true;
    void connect(templateId);
  }, [connect, templateId]);

  // Capture the session id while it is still available, so the redirect below survives the
  // hook resetting its refs during teardown.
  useEffect(() => {
    if (sessionId) finishedSessionRef.current = sessionId;
  }, [sessionId]);

  // Navigate only AFTER teardown, never during. Leaving while the call is live would trip the
  // route guard and cut the audio mid-question.
  useEffect(() => {
    if (phase === "ended" && finishedSessionRef.current) {
      router.push(`/interview/result/${finishedSessionRef.current}`);
    }
  }, [phase, router]);

  const toggleMute = useCallback(() => {
    setMuted((was) => {
      const next = !was;
      setMicMuted(next);
      return next;
    });
  }, [setMicMuted]);

  const live = phase === "live";

  return (
    <Box sx={{ minHeight: "100vh", background: ROOM_BG, color: ROOM_TEXT, px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 } }}>
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: live ? ROOM_GREEN : phase === "failed" ? ROOM_RED : ROOM_TEXT_FAINT,
              flexShrink: 0,
            }}
          />
          <Typography sx={{ fontSize: "0.9rem", color: ROOM_TEXT_DIM }}>
            {PHASE_COPY[phase] ?? phase}
          </Typography>
          <Box sx={{ flex: 1 }} />
          {candidateSpeaking ? (
            <Typography sx={{ fontSize: "0.8rem", color: ROOM_VIOLET }}>Listening</Typography>
          ) : null}
        </Box>

        {error ? (
          <Box
            sx={{
              borderRadius: "var(--radius-card, 12px)",
              border: `1px solid ${ROOM_RED}`,
              bgcolor: ROOM_PANEL,
              p: 3,
              mb: 3,
            }}
          >
            <Typography sx={{ color: ROOM_TEXT, mb: 1.5 }}>{error}</Typography>
            <Button
              onClick={() => {
                startedRef.current = false;
                void connect(templateId);
              }}
              sx={{ color: ROOM_VIOLET, textTransform: "none" }}
            >
              Try again
            </Button>
          </Box>
        ) : null}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr" }, gap: 3 }}>
          <QuestionCard question={currentQuestion} total={questionCount} />
          <InterviewTranscript entries={transcript} />
        </Box>

        {/* Controls */}
        <Box
          sx={{
            mt: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Button
            onClick={toggleMute}
            disabled={!live}
            startIcon={
              <Icon icon={muted ? "solar:microphone-slash-bold" : "solar:microphone-3-bold"} />
            }
            sx={{
              textTransform: "none",
              color: ROOM_TEXT,
              border: `1px solid ${ROOM_BORDER}`,
              borderRadius: "999px",
              px: 2.5,
            }}
          >
            {muted ? "Unmute" : "Mute"}
          </Button>
          <Button
            onClick={() => void end()}
            disabled={phase === "ending" || phase === "ended"}
            sx={{
              textTransform: "none",
              color: ROOM_RED,
              border: `1px solid ${ROOM_BORDER}`,
              borderRadius: "999px",
              px: 2.5,
            }}
          >
            End interview
          </Button>
        </Box>

        <Typography
          sx={{ mt: 2, textAlign: "center", fontSize: "0.78rem", color: ROOM_TEXT_FAINT }}
        >
          Speak naturally. You can interrupt the interviewer at any point.
        </Typography>
      </Box>
    </Box>
  );
}

export default function InterviewRoomPage() {
  return (
    <Suspense fallback={null}>
      <InterviewRoom />
    </Suspense>
  );
}
