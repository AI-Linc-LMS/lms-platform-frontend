"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Button, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { QuestionCard } from "@/components/interview/room/QuestionCard";
import { InterviewTranscript } from "@/components/interview/room/InterviewTranscript";
import { Preflight, type PreflightResult } from "@/components/interview/room/Preflight";
import { MONITOR_OFF, type MonitorSnapshot } from "@/components/interview/room/monitoring";
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
} from "@/components/ai-tutor/room/roomTokens";
import { LIVE_PHASES, useRealtimeInterview } from "@/lib/hooks/useRealtimeInterview";
import { useScreenWakeLock } from "@/lib/hooks/useScreenWakeLock";
import interviewService, { type NextQuestion } from "@/lib/services/interview.service";

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

/**
 * The face detector, loaded only once somebody is actually in a room.
 *
 * Its import chain is TensorFlow plus BlazeFace, and this is the module whose first reported
 * problem was how long it took to start. `ssr: false` because it touches WebGL and a camera.
 */
const CameraMonitor = dynamic(() => import("@/components/interview/room/CameraMonitor"), {
  ssr: false,
});

function InterviewRoom() {
  const router = useRouter();
  const params = useSearchParams();
  const templateId = Number(params.get("template") || 0);
  // A practice run arrives with a typed topic instead of a template.
  const topic = (params.get("topic") || "").trim();
  const practiceMinutes = Number(params.get("minutes") || 10);
  const practiceDifficulty = params.get("difficulty") || "Medium";
  const practiceType = params.get("type") || "mixed";
  // A follow-up carries no topic of its own: the server inherits it from the source sitting.
  const followUpOf = params.get("followUp") || "";

  const {
    phase,
    error,
    transcript,
    currentQuestion,
    questionCount,
    interimInterviewer,
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
  // Carried out of the preflight so monitoring continues into the call rather than being
  // acquired twice, and so the attempt records what was not working.
  const [degraded, setDegraded] = useState<string[]>([]);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  // State rather than a ref: mounting the monitor depends on it.
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [monitor, setMonitor] = useState<MonitorSnapshot>(MONITOR_OFF);
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
    if (!preflightDone || startedRef.current) return;
    if (!templateId && !topic && !followUpOf) return;
    startedRef.current = true;
    void connect(
      templateId
        ? templateId
        : {
            topic,
            minutes: practiceMinutes,
            difficulty: practiceDifficulty,
            interview_type: practiceType,
            follow_up_of: followUpOf || undefined,
          },
    );
  }, [
    connect,
    followUpOf,
    practiceDifficulty,
    practiceMinutes,
    practiceType,
    preflightDone,
    templateId,
    topic,
  ]);

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

  // The room is now on the camera guard's allow list, which is what lets it hold a camera at
  // all, and also means the guard will not clean up after us. Stop the preflight's camera
  // ourselves when the room goes away.
  useEffect(() => {
    const streamRef = cameraStreamRef;
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

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

  // Tell the server what could not be checked, so a reviewer sees "monitoring did not run"
  // rather than "monitoring saw nothing", which are very different things.
  //
  // Not only what the device check found. Monitoring can stop working after it passed: a
  // laptop wakes from sleep, another app takes the camera. A report that only ever describes
  // the first thirty seconds would say a sitting was watched when most of it was not.
  const degradedNow = useMemo(() => {
    const all = new Set(degraded);
    if (preflightDone && monitor.state === "unavailable") {
      all.add("face_monitoring_unavailable");
    }
    return Array.from(all);
  }, [degraded, monitor.state, preflightDone]);

  // What has already been sent, so a later loss is reported and a repeat is not.
  const reportedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!sessionId) return;
    const fresh = degradedNow.filter((item) => !reportedRef.current.has(item));
    if (!fresh.length) return;
    fresh.forEach((item) => reportedRef.current.add(item));
    void interviewService
      .reportPreflight(sessionId, Array.from(reportedRef.current))
      .catch(() => undefined);
  }, [degradedNow, sessionId]);

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
      {/*
        Outside the branch on purpose. Everything below switches between the preflight and the
        call; the monitor must not, because unmounting it takes the detector's video element
        with it and monitoring would silently stop the moment the interview began.
      */}
      <CameraMonitor stream={cameraStream} onSnapshot={setMonitor} compact={preflightDone} />

      {!preflightDone ? (
        <Preflight
          monitor={monitor}
          onCameraStream={(stream) => {
            cameraStreamRef.current = stream;
            setCameraStream(stream);
          }}
          onReady={(result: PreflightResult) => {
            cameraStreamRef.current = result.cameraStream;
            setDegraded(result.degraded);
            setPreflightDone(true);
          }}
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
                      void connect(
                        templateId
                          ? templateId
                          : {
                              topic,
                              minutes: practiceMinutes,
                              difficulty: practiceDifficulty,
                              interview_type: practiceType,
                              follow_up_of: followUpOf || undefined,
                            },
                      );
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
            <InterviewTranscript
              entries={transcript}
              interim={interimInterviewer}
              connecting={booting}
            />
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
