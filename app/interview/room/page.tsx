"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Button, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { QuestionCard } from "@/components/interview/room/QuestionCard";
import { InterviewTranscript } from "@/components/interview/room/InterviewTranscript";
import {
  INTERVIEW_PHASE_LABEL,
  InterviewPresence,
} from "@/components/interview/room/InterviewPresence";
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
import { LIVE_PHASES, useRealtimeInterview } from "@/lib/hooks/useRealtimeInterview";

/**
 * The live interview room.
 *
 * **The URL never changes while the call is up.** `/interview/room?template=<id>` is where the
 * whole interview happens, including after the session id is known: the global camera route
 * guard tears media streams down on pathname change, so rewriting the URL mid-call would kill
 * the microphone and the interviewer's voice.
 *
 * The interviewer is the Strands ribbon, not an avatar. A static face with a lip-sync loop
 * drifts out of sync with the audio, which is one of the things that made the old room feel
 * wrong; a ribbon driven by the actual waveform has no mouth to fall out of sync.
 */

/** Reassurance while the paper is authored and the call is dialled. */
const BOOT_STEPS = [
  "Setting up your interview",
  "Preparing questions",
  "Connecting to the interviewer",
];

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
    sessionId,
    connect,
    end,
    setMuted: setMicMuted,
    getLevels,
  } = useRealtimeInterview();

  const [muted, setMuted] = useState(false);
  const [bootStep, setBootStep] = useState(0);
  const startedRef = useRef(false);
  const finishedSessionRef = useRef<string>("");

  const live = LIVE_PHASES.includes(phase);
  const booting = phase === "starting" || phase === "connecting";

  useEffect(() => {
    if (!templateId || startedRef.current) return;
    startedRef.current = true;
    void connect(templateId);
  }, [connect, templateId]);

  // Something visibly moves while the paper is authored and the call is dialled. The first
  // build showed a bare status word for the whole wait and read as a hung page.
  useEffect(() => {
    if (!booting) {
      setBootStep(0);
      return;
    }
    const timer = setInterval(
      () => setBootStep((i) => Math.min(i + 1, BOOT_STEPS.length - 1)),
      1600,
    );
    return () => clearInterval(timer);
  }, [booting]);

  useEffect(() => {
    if (sessionId) finishedSessionRef.current = sessionId;
  }, [sessionId]);

  // Navigate only AFTER teardown. Leaving while the call is live trips the route guard and
  // cuts the audio mid-question.
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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: ROOM_BG,
        color: ROOM_TEXT,
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              flexShrink: 0,
              bgcolor: live ? ROOM_GREEN : phase === "failed" ? ROOM_RED : ROOM_TEXT_FAINT,
              animation: booting ? "interviewPulse 1.2s ease-in-out infinite" : "none",
              "@keyframes interviewPulse": {
                "0%,100%": { opacity: 0.35 },
                "50%": { opacity: 1 },
              },
            }}
          />
          <Typography sx={{ fontSize: "0.9rem", color: ROOM_TEXT_DIM }}>
            {booting ? BOOT_STEPS[bootStep] : INTERVIEW_PHASE_LABEL[phase]}
          </Typography>
          <Box sx={{ flex: 1 }} />
          {questionCount > 0 && currentQuestion?.position ? (
            <Typography
              sx={{
                fontSize: "0.82rem",
                color: ROOM_TEXT_FAINT,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              Question {currentQuestion.position} of {questionCount}
            </Typography>
          ) : null}
        </Box>

        {/* The interviewer. Owns the stage before the first question lands, then makes room. */}
        <Box
          sx={{
            height: currentQuestion?.question ? { xs: 96, md: 128 } : { xs: 220, md: 300 },
            transition: "height 320ms cubic-bezier(.175,.885,.32,1.1)",
            mb: 2.5,
          }}
        >
          <InterviewPresence phase={phase} getLevels={getLevels} />
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

        <Box
          sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr" }, gap: 3 }}
        >
          <QuestionCard question={currentQuestion} total={questionCount} />
          <InterviewTranscript entries={transcript} />
        </Box>

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
