"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { QuestionCard } from "@/components/interview/room/QuestionCard";
import { InterviewTranscript } from "@/components/interview/room/InterviewTranscript";
import {
  INTERVIEW_PHASE_LABEL,
  InterviewPresence,
} from "@/components/interview/room/InterviewPresence";
import {
  CodingQuestionModal,
  type CodingProblemPayload,
} from "@/components/mock-interview/CodingQuestionModal";
import { MCQQuestionModal, type MCQOption } from "@/components/mock-interview/MCQQuestionModal";
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
import { useScreenWakeLock } from "@/lib/hooks/useScreenWakeLock";
import type { NextQuestion } from "@/lib/services/interview.service";

/**
 * The live interview room.
 *
 * **The URL never changes while anything here is happening.** Preflight, the call and the
 * modals are all states of this one route, because the global camera route guard tears media
 * streams down on pathname change; the result redirect fires only after teardown.
 *
 * Structured questions open the SAME modals the old module used (CodingQuestionModal,
 * MCQQuestionModal): they are pure-props components, and reusing them means the live room and
 * the admin review render a coding problem identically. The mic is muted while a modal is up,
 * so thinking aloud over the editor is not transcribed as an answer to nothing.
 */

const BOOT_STEPS = [
  "Setting up your interview",
  "Preparing questions",
  "Connecting to the interviewer",
];

/** Judge0 language ids for the modal's language picker. The server grades by these. */
const LANGUAGE_IDS: Record<string, number> = {
  python: 71,
  javascript: 63,
  java: 62,
  cpp: 54,
  sql: 82,
};

/** Map the server's render payload onto the modal's contract. */
function toModalProblem(question: NextQuestion): CodingProblemPayload | null {
  const coding = question.coding;
  if (!coding) return null;
  const starters = Object.fromEntries(
    Object.entries(coding.starter_code || {}).map(([k, v]) => [k.toLowerCase(), v]),
  );
  const language =
    ("python" in starters && "python") ||
    Object.keys(starters).find((k) => k in LANGUAGE_IDS) ||
    "python";
  return {
    title: coding.title,
    statement: coding.statement,
    sample_input: coding.sample_input,
    sample_output: coding.sample_output,
    constraints: coding.constraints
      ? coding.constraints.split(/\n+/).map((line) => line.trim()).filter(Boolean)
      : undefined,
    starter_code: starters[language] ?? "",
    language,
  };
}

function toMcqOptions(question: NextQuestion): MCQOption[] {
  const options = question.options;
  if (!options) return [];
  return (["a", "b", "c", "d"] as const)
    .map((id) => ({ id, text: options[id] }))
    .filter((option) => Boolean(option.text));
}

/** Human copy per getUserMedia failure. A DOMException name is not an explanation. */
function micErrorCopy(error: unknown): string {
  const name = (error as DOMException)?.name ?? "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Your browser blocked the microphone. Click the lock icon in the address bar, allow the microphone, then try again.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No microphone was found. Plug one in or check your input settings, then try again.";
  }
  if (name === "NotReadableError") {
    return "Another app is using your microphone. Close it and try again.";
  }
  return "We could not access your microphone. Check your settings and try again.";
}

/**
 * The pre-call mic check. Permission is asked HERE, on a calm screen with an explanation,
 * rather than mid-dial where a blocked prompt reads as a hung page. The meter proves the
 * microphone is actually picking you up, which a green permission alone does not.
 */
function MicPreflight({
  onReady,
  onCancel,
}: {
  onReady: () => void;
  onCancel: () => void;
}) {
  const [state, setState] = useState<"asking" | "ok" | "error">("asking");
  const [errorCopy, setErrorCopy] = useState("");
  const meterRef = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const buf = new Uint8Array(analyser.frequencyBinCount);
        let raf = 0;
        const tick = () => {
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i += 1) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          const level = Math.min(1, Math.sqrt(sum / buf.length) * 4);
          // Written straight to the DOM at frame rate; state would re-render 60x/s.
          if (meterRef.current) meterRef.current.style.transform = `scaleX(${level})`;
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        cleanupRef.current = () => {
          cancelAnimationFrame(raf);
          void ctx.close().catch(() => undefined);
          stream.getTracks().forEach((t) => t.stop());
        };
        setState("ok");
      } catch (error) {
        if (!cancelled) {
          setErrorCopy(micErrorCopy(error));
          setState("error");
        }
      }
    })();
    return () => {
      cancelled = true;
      cleanupRef.current();
    };
  }, []);

  return (
    <Box
      sx={{
        maxWidth: 460,
        mx: "auto",
        mt: { xs: 6, md: 10 },
        borderRadius: "var(--radius-card, 12px)",
        border: `1px solid ${ROOM_BORDER}`,
        bgcolor: ROOM_PANEL,
        p: { xs: 3, md: 4 },
        textAlign: "center",
      }}
    >
      <Icon
        icon={state === "error" ? "solar:microphone-slash-bold-duotone" : "solar:microphone-3-bold-duotone"}
        width={40}
        height={40}
        style={{ color: state === "error" ? ROOM_RED : ROOM_VIOLET }}
      />
      <Typography sx={{ mt: 2, fontWeight: 600, fontSize: "1.1rem", color: ROOM_TEXT }}>
        {state === "error" ? "Microphone needed" : "Check your microphone"}
      </Typography>

      {state === "error" ? (
        <Typography sx={{ mt: 1, fontSize: "0.92rem", color: ROOM_TEXT_DIM }}>
          {errorCopy}
        </Typography>
      ) : (
        <>
          <Typography sx={{ mt: 1, fontSize: "0.92rem", color: ROOM_TEXT_DIM }}>
            Say something. The bar should move when you speak.
          </Typography>
          <Box
            sx={{
              mt: 2.5,
              height: 6,
              borderRadius: 999,
              bgcolor: "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <Box
              ref={meterRef}
              sx={{
                height: "100%",
                width: "100%",
                transformOrigin: "left",
                transform: "scaleX(0)",
                bgcolor: ROOM_GREEN,
                transition: "transform 90ms linear",
              }}
            />
          </Box>
        </>
      )}

      <Box sx={{ mt: 3, display: "flex", gap: 1.5, justifyContent: "center" }}>
        <Button
          onClick={onCancel}
          sx={{
            textTransform: "none",
            color: ROOM_TEXT_DIM,
            border: `1px solid ${ROOM_BORDER}`,
            borderRadius: 999,
            px: 2.5,
          }}
        >
          Cancel
        </Button>
        {state !== "error" ? (
          <Button
            onClick={() => {
              cleanupRef.current();
              onReady();
            }}
            disabled={state !== "ok"}
            variant="contained"
            disableElevation
            startIcon={
              state === "asking" ? <CircularProgress size={14} sx={{ color: "inherit" }} /> : undefined
            }
            sx={{ textTransform: "none", borderRadius: 999, px: 3, fontWeight: 600 }}
          >
            {state === "asking" ? "Waiting for permission" : "Start interview"}
          </Button>
        ) : (
          <Button
            onClick={() => window.location.reload()}
            variant="contained"
            disableElevation
            sx={{ textTransform: "none", borderRadius: 999, px: 3, fontWeight: 600 }}
          >
            Try again
          </Button>
        )}
      </Box>
    </Box>
  );
}

/** mm:ss, never negative. The server enforces the cap; this is courtesy. */
function Countdown({ connectedAt, plannedMinutes }: { connectedAt: number; plannedMinutes: number }) {
  // Clock reads live in the effect, never in render: render stays pure and the strict
  // hooks rules stay quiet.
  const [remaining, setRemaining] = useState(plannedMinutes * 60);
  useEffect(() => {
    const compute = () =>
      setRemaining(
        Math.max(0, plannedMinutes * 60 - Math.floor((Date.now() - connectedAt) / 1000)),
      );
    compute();
    const timer = setInterval(compute, 1000);
    return () => clearInterval(timer);
  }, [connectedAt, plannedMinutes]);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const low = remaining <= 120;
  return (
    <Typography
      sx={{
        fontSize: "0.88rem",
        fontVariantNumeric: "tabular-nums",
        color: low ? ROOM_RED : ROOM_TEXT_DIM,
        fontWeight: low ? 600 : 400,
      }}
    >
      {minutes}:{String(seconds).padStart(2, "0")}
    </Typography>
  );
}

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
    plannedMinutes,
    connectedAt,
    sessionId,
    dropped,
    connect,
    end,
    setMuted: setMicMuted,
    getLevels,
    submitStructured,
  } = useRealtimeInterview();

  const [preflightDone, setPreflightDone] = useState(false);
  const [muted, setMuted] = useState(false);
  const [bootStep, setBootStep] = useState(0);
  // The id of the structured question already submitted, so its modal never re-opens.
  // Openness is DERIVED from this rather than set in an effect.
  const [submittedId, setSubmittedId] = useState<number | null>(null);
  const startedRef = useRef(false);
  const bootStartedRef = useRef(0);
  const finishedSessionRef = useRef<string>("");

  const live = LIVE_PHASES.includes(phase);
  const booting = phase === "starting" || phase === "connecting";

  // Phones dim and lock mid-call; a locked screen kills the mic.
  useScreenWakeLock(live);

  useEffect(() => {
    if (!preflightDone || !templateId || startedRef.current) return;
    startedRef.current = true;
    void connect(templateId);
  }, [connect, preflightDone, templateId]);

  useEffect(() => {
    if (!booting) {
      bootStartedRef.current = 0;
      return;
    }
    if (!bootStartedRef.current) bootStartedRef.current = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - bootStartedRef.current;
      setBootStep(Math.min(Math.floor(elapsed / 1600), BOOT_STEPS.length - 1));
    }, 400);
    return () => clearInterval(timer);
  }, [booting]);

  useEffect(() => {
    if (sessionId) finishedSessionRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    if (phase === "ended" && finishedSessionRef.current) {
      router.push(`/interview/result/${finishedSessionRef.current}`);
    }
  }, [phase, router]);

  // A structured question's modal is OPEN whenever the current question is structured and
  // not yet submitted: derived, never set in an effect. The mic mutes while it is up, so
  // thinking aloud over an editor is not transcribed as the answer to a question nobody
  // asked. setMicMuted touches the media track, not React state, so an effect is the right
  // place for it.
  const structuredKind =
    currentQuestion?.kind === "coding" && currentQuestion.coding
      ? "coding"
      : currentQuestion?.kind === "mcq" && currentQuestion.options
        ? "mcq"
        : null;
  const structuredOpen =
    structuredKind !== null && currentQuestion?.question_id !== submittedId;

  useEffect(() => {
    setMicMuted(structuredOpen ? true : muted);
  }, [muted, setMicMuted, structuredOpen]);

  const currentQuestionId = currentQuestion?.question_id ?? null;
  const closeStructured = useCallback(() => {
    if (currentQuestionId) setSubmittedId(currentQuestionId);
  }, [currentQuestionId]);

  const submitCoding = useCallback(
    (payload: { code: string; language: string }) => {
      if (!currentQuestion) return;
      void submitStructured(currentQuestion, {
        code: payload.code,
        language_id: LANGUAGE_IDS[payload.language] ?? LANGUAGE_IDS.python,
      });
      closeStructured();
    },
    [closeStructured, currentQuestion, submitStructured],
  );

  const submitMcq = useCallback(
    (selected: { ids: string[] }) => {
      if (!currentQuestion || !selected.ids.length) return;
      void submitStructured(currentQuestion, { choice: selected.ids[0] });
      closeStructured();
    },
    [closeStructured, currentQuestion, submitStructured],
  );

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
        minHeight: "100dvh",
        background: ROOM_BG,
        color: ROOM_TEXT,
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 4 },
      }}
    >
      {!preflightDone ? (
        <MicPreflight
          onReady={() => setPreflightDone(true)}
          onCancel={() => router.push("/interview")}
        />
      ) : (
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
            {live && connectedAt && plannedMinutes > 0 ? (
              <Countdown connectedAt={connectedAt} plannedMinutes={plannedMinutes} />
            ) : null}
            {questionCount > 0 && currentQuestion?.position ? (
              <Typography
                sx={{
                  fontSize: "0.82rem",
                  color: ROOM_TEXT_FAINT,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                Q {currentQuestion.position} of {questionCount}
              </Typography>
            ) : null}
          </Box>

          <Box
            sx={{
              height: currentQuestion?.question ? { xs: 96, md: 128 } : { xs: 220, md: 300 },
              transition: "height 320ms cubic-bezier(.175,.885,.32,1.1)",
              mb: 2.5,
            }}
          >
            <InterviewPresence phase={phase} getLevels={getLevels} />
          </Box>

          {phase === "failed" ? (
            <Box
              sx={{
                borderRadius: "var(--radius-card, 12px)",
                border: `1px solid ${ROOM_RED}`,
                bgcolor: ROOM_PANEL,
                p: 3,
                mb: 3,
              }}
            >
              <Typography sx={{ color: ROOM_TEXT, fontWeight: 600, mb: 0.5 }}>
                {dropped ? "The call dropped" : "Could not connect"}
              </Typography>
              <Typography sx={{ color: ROOM_TEXT_DIM, fontSize: "0.92rem", mb: 2 }}>
                {error}
              </Typography>
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <Button
                  onClick={() => router.push("/interview")}
                  sx={{
                    textTransform: "none",
                    color: ROOM_TEXT_DIM,
                    border: `1px solid ${ROOM_BORDER}`,
                    borderRadius: 999,
                    px: 2.5,
                  }}
                >
                  Back to interviews
                </Button>
                {!dropped ? (
                  <Button
                    onClick={() => {
                      startedRef.current = false;
                      void connect(templateId);
                    }}
                    variant="contained"
                    disableElevation
                    sx={{ textTransform: "none", borderRadius: 999, px: 2.5, fontWeight: 600 }}
                  >
                    Try again
                  </Button>
                ) : null}
              </Box>
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
                borderRadius: 999,
                px: 2.5,
              }}
            >
              {muted ? "Unmute" : "Mute"}
            </Button>
            <Button
              onClick={() => void end()}
              disabled={phase === "ending" || phase === "ended" || phase === "failed"}
              sx={{
                textTransform: "none",
                color: ROOM_RED,
                border: `1px solid ${ROOM_BORDER}`,
                borderRadius: 999,
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
      )}

      <CodingQuestionModal
        open={structuredOpen && structuredKind === "coding"}
        problem={currentQuestion ? toModalProblem(currentQuestion) : null}
        spokenIntro={currentQuestion?.question}
        onSubmit={submitCoding}
      />
      <MCQQuestionModal
        open={structuredOpen && structuredKind === "mcq"}
        options={currentQuestion ? toMcqOptions(currentQuestion) : []}
        multiSelect={false}
        spokenIntro={currentQuestion?.question}
        onSubmit={submitMcq}
      />
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
