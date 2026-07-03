"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { Box, Button, Chip, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import mockInterviewService, {
  type InterviewQuestion,
  type InterviewResponse,
} from "@/lib/services/mock-interview.service";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import type { InterviewResult } from "@/lib/types/adaptive-journey";
import { notifyContentCompleted } from "@/lib/streak/streakCelebration";
import { useSpeechToText } from "@/lib/hooks/useSpeechToText";
import { prefetchInterviewerClip, unlockInterviewerAudio } from "@/lib/hooks/useInterviewerVoice";
import { useScreenWakeLock } from "@/lib/hooks/useScreenWakeLock";
import { readSttEngine } from "@/lib/utils/stt-engine";
import { detectBrowser } from "@/lib/utils/browser-detect";
import { getAudioConstraints } from "@/lib/utils/audio-constraints";
import { registerMediaStream } from "@/lib/utils/media-stream-registry";
import { AIAvatar } from "@/components/mock-interview/AIAvatar";
import { MicWaveform } from "@/components/mock-interview/MicWaveform";
import { PauseProgressBar } from "@/components/mock-interview/PauseProgressBar";
import { QuickDeviceCheck, type QuickDeviceCheckStatus } from "@/components/mock-interview/QuickDeviceCheck";

// Strip STT hallucinations (YouTube/caption boilerplate Whisper emits on near-silent audio)
// from a final chunk before it lands in the answer — the same second-pass filter the
// platform interview runs on top of the hook's own filtering.
const STT_HALLUCINATIONS: RegExp[] = [
  /\b(?:thanks?|thank\s+you)\s+(?:so\s+much\s+)?for\s+watch(?:ing)?(?:\s+(?:this\s+video|the\s+video|today))?[!.]*/gi,
  /\b(?:please\s+)?(?:don'?t\s+forget\s+to\s+)?(?:like\s+and\s+)?subscribe(?:\s+(?:to\s+(?:my|the|our)\s+channel|to\s+the\s+channel|now))?[!.]*/gi,
  /\bsee\s+you\s+(?:in\s+the\s+)?next\s+(?:video|time)[!.]*/gi,
  /[\[(](?:music|applause|laughter|silence|inaudible|sound\s+effect)[\])][!.]*/gi,
  /^\s*(?:music|applause|laughter|silence|inaudible)\s*$/gim,
  /^\s*(?:bye[-\s]?bye|bye|goodbye)[!.]*\s*$/gim,
];

function sanitizeSttFragment(raw: string): string {
  if (!raw) return "";
  let cleaned = raw;
  for (const rx of STT_HALLUCINATIONS) cleaned = cleaned.replace(rx, " ");
  return cleaned.replace(/\s{2,}/g, " ").trim();
}

const TIER_COLOR: Record<string, string> = { beginner: "#fbbf24", intermediate: "#60a5fa", advanced: "#4ade80" };
const INTERVIEW_AVATAR_SRC = "/videos/Interview.mp4";
// Auto-advance after the candidate goes quiet for this long (once they've said something
// and the interviewer has finished speaking) — the same "voice mode" feel as the platform
// mock interview, instead of a press-and-hold mic.
const SILENCE_ADVANCE_MS = 4500;
// Default normalized mic gate (0–1, getByteFrequencyData average / 255), used until the
// per-environment calibration replaces it. Above the gate = the candidate is speaking.
const MIC_SILENCE_GATE = 0.06;
// At "Begin" the AI speaks the first question while the candidate is silent — a free window
// to sample the room's noise floor. After that we track the candidate's voice peak and place
// the gate 25% of the way from floor → peak (the platform's calibrated formula), so a noisy
// room doesn't keep the mic "listening" forever and a quiet room still detects soft speech.
const MIC_CALIBRATION_MS = 2500;
const MIC_GATE_MIN = 0.03;
const MIC_GATE_MAX = 0.4;

const qText = (q: InterviewQuestion | null): string => (q ? (q.question_text || q.question || "").trim() : "");
const fmtClock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s) % 60).padStart(2, "0")}`;

type Bubble = { role: "ai" | "student"; text: string };

function CourseInterviewInner() {
  const { push } = useInstantNavigation();
  const params = useParams();
  const sp = useSearchParams();
  const courseId = Number(params.courseId);
  const interviewId = Number(params.interviewId);
  const topic = sp.get("topic") || "";
  const difficulty = sp.get("difficulty") || "Intermediate";

  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [resultLoading, setResultLoading] = useState(false);

  const [question, setQuestion] = useState<InterviewQuestion | null>(null);
  const [turn, setTurn] = useState(1);
  const [maxTurns, setMaxTurns] = useState(0);
  const [currentIsFinal, setCurrentIsFinal] = useState(false);
  const [closingRemark, setClosingRemark] = useState<string | null>(null);

  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [speakText, setSpeakText] = useState<string>("");
  const [transcript, setTranscript] = useState<Bubble[]>([]);
  const [answer, setAnswer] = useState("");
  const [interim, setInterim] = useState("");
  const [typing, setTyping] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [selfViewOn, setSelfViewOn] = useState(false);

  const respRef = useRef<InterviewResponse[]>([]);
  const startedAtRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const answerRef = useRef("");
  const lastSpeechRef = useRef(0);
  const sendAnswerRef = useRef<() => void>(() => {});
  // Synchronous re-entrancy locks — the React `busy` state updates a render late, so it
  // can't stop the silence timer and a manual click from both firing in the same tick.
  const sendingRef = useRef(false);
  const submittingRef = useRef(false);
  // Mirror of `typing` for the STT callbacks: while the candidate types, ambient voice
  // fragments must not interleave into the typed answer.
  const typingRef = useRef(false);
  // Which action the in-interview error banner's Retry re-runs (a failed follow-up fetch
  // restores the answer so sendAnswer can re-send the SAME turn; a failed submit re-submits).
  const retryActionRef = useRef<"send" | "submit">("send");
  // Mic-level analyser (the reliable silence signal, like the platform interview).
  const audioCtxRef = useRef<AudioContext | null>(null);
  // AudioContext pre-created SYNCHRONOUSLY in the Begin click (WebKit only resumes a context
  // from inside a real gesture; startMicAnalyser runs after an await, too late on iOS).
  const preCreatedCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  // Self-view webcam — a small passive mirror of the candidate (no face detection), so the
  // call feels two-sided. Camera is best-effort; denial never blocks the interview.
  const selfViewRef = useRef<HTMLVideoElement | null>(null);
  const selfViewStreamRef = useRef<MediaStream | null>(null);
  // Callback ref: the <video> only mounts once selfViewOn flips true (after the stream is
  // acquired), so attach the stream the moment the element exists.
  const attachSelfView = useCallback((el: HTMLVideoElement | null) => {
    selfViewRef.current = el;
    if (el && selfViewStreamRef.current) {
      el.srcObject = selfViewStreamRef.current;
      void el.play().catch(() => {});
    }
  }, []);
  const stopSelfView = useCallback(() => {
    selfViewStreamRef.current?.getTracks().forEach((t) => t.stop());
    selfViewStreamRef.current = null;
    if (selfViewRef.current) selfViewRef.current.srcObject = null;
    setSelfViewOn(false);
  }, []);
  const micRafRef = useRef<number>(0);
  const micLevelRef = useRef(0);        // 0..1 loudness → MicWaveform
  const pauseProgressRef = useRef(0);   // 0..1 toward auto-advance → PauseProgressBar
  const aiSpeakingRef = useRef(false);
  // Per-environment calibration of the silence gate.
  const gateRef = useRef(MIC_SILENCE_GATE);
  const noiseFloorRef = useRef(0);
  const voicePeakRef = useRef(0);

  // Which STT engine to force. Priority: the engine the Begin-screen device check just PROVED
  // works in this browser > a previously pinned engine (platform device-check) > the Edge pin
  // (its native SpeechRecognition is broken; Whisper is what a device-check concludes there)
  // > auto-decide.
  const [deviceCheck, setDeviceCheck] = useState<QuickDeviceCheckStatus>({
    camera: null, mic: null, speechOk: false, engine: null,
  });
  const pinnedEngine = useMemo(
    () => readSttEngine() ?? (detectBrowser() === "edge" ? ("whisper" as const) : undefined),
    []
  );
  const forcedEngine = deviceCheck.engine ?? pinnedEngine;

  // Warm the interviewer's OPENING clip while the candidate is still reading the Begin screen.
  // The journey card stashes the opening question text at claim time (sessionStorage), because
  // the detail API only serves completed interviews. Cache is keyed by exact text, so if the
  // tailored plan swaps the opening between claim and start, this is simply an unused warm-up.
  useEffect(() => {
    if (!interviewId) return;
    try {
      const stashed = sessionStorage.getItem(`adaptiveInterviewOpening_${interviewId}`);
      if (stashed) prefetchInterviewerClip(stashed);
    } catch {
      /* sessionStorage unavailable — the Begin-click prefetch still covers most of the win */
    }
  }, [interviewId]);

  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  useEffect(() => {
    aiSpeakingRef.current = aiSpeaking;
  }, [aiSpeaking]);

  useEffect(() => {
    typingRef.current = typing;
  }, [typing]);

  const bumpSpeech = () => {
    lastSpeechRef.current = performance.now();
  };

  // Drive silence detection off the real mic level: whenever the mic is above the gate the
  // candidate is speaking, so we keep the activity timestamp fresh; once it drops, the
  // silence interval can fire. A second, separate getUserMedia from the STT stream is fine.
  const stopMicAnalyser = useCallback(() => {
    if (micRafRef.current) {
      cancelAnimationFrame(micRafRef.current);
      micRafRef.current = 0;
    }
    try {
      void audioCtxRef.current?.close();
    } catch {
      /* already closed */
    }
    audioCtxRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
  }, []);

  const startMicAnalyser = useCallback(async () => {
    if (audioCtxRef.current) return;
    try {
      // Same constraints as the STT capture (echoCancellation etc.) so the level the gate
      // sees matches what the recognizer hears — a raw stream reads systematically louder.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: getAudioConstraints() });
      micStreamRef.current = stream;
      // Prefer the context pre-created (and resumed) inside the Begin click — a context built
      // here, after the getUserMedia await, stays suspended on iOS/Safari (silent analyser).
      const ctx = preCreatedCtxRef.current ?? new AudioContext();
      preCreatedCtxRef.current = null;
      if (ctx.state === "suspended") void ctx.resume().catch(() => {});
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = ctx;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const calibStart = performance.now();
      let calibSum = 0;
      let calibCount = 0;
      gateRef.current = MIC_SILENCE_GATE;
      const loop = () => {
        if (!audioCtxRef.current) return;
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
        micLevelRef.current = avg;
        const t = performance.now();

        if (t - calibStart < MIC_CALIBRATION_MS) {
          // Calibration window: the candidate is silent (AI speaking Q1) → sample ambient.
          calibSum += avg;
          calibCount += 1;
        } else {
          if (noiseFloorRef.current === 0 && calibCount > 0) {
            noiseFloorRef.current = calibSum / calibCount;
          }
          // Track recent loudness as the voice peak (slow decay so a one-off transient relaxes);
          // and let the floor drift down to new quiet so the gate stays accurate.
          voicePeakRef.current = Math.max(avg, voicePeakRef.current * 0.999);
          if (avg < noiseFloorRef.current) {
            noiseFloorRef.current += (avg - noiseFloorRef.current) * 0.05;
          }
          const floor = noiseFloorRef.current;
          const peak = voicePeakRef.current;
          const gate =
            peak > floor + 0.02
              ? floor + (peak - floor) * 0.25 // platform formula once we have a real voice peak
              : floor + 0.025; // no clear speech yet — sit just above the floor
          gateRef.current = Math.min(MIC_GATE_MAX, Math.max(MIC_GATE_MIN, gate));
        }

        if (avg > gateRef.current) lastSpeechRef.current = t;
        // Fill the pause bar only while we're actually waiting for the answer to land.
        const waiting = !aiSpeakingRef.current && answerRef.current.trim().length > 0;
        pauseProgressRef.current = waiting ? Math.min(1, (t - lastSpeechRef.current) / SILENCE_ADVANCE_MS) : 0;
        micRafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      /* no analyser — the STT-event bumps below still provide a fallback signal */
    }
  }, []);

  useEffect(() => () => { stopMicAnalyser(); stopSelfView(); }, [stopMicAnalyser, stopSelfView]);

  // Returning to a backgrounded tab: the rAF-driven analyser was throttled, so lastSpeechRef
  // is stale — re-prime it so the silence auto-advance can't fire the instant the tab wakes.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") bumpSpeech();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // ---- voice: student answers continuously (browser STT + Whisper fallback). STT is
  //      PAUSED while the AI speaks, so it never fights the interviewer's voice. ----
  const stt = useSpeechToText({
    continuous: true,
    preferWhisper: true,
    paused: aiSpeaking,
    lang: "en-US",
    forcedEngine,
    onInterim: (t) => {
      // While typing, ambient voice must not pollute the typed answer; while the follow-up
      // fetch is in flight the visible buffer belongs to the NEXT turn — suppress both.
      if (typingRef.current || sendingRef.current) return;
      setInterim(t);
      bumpSpeech();
    },
    onFinal: (t) => {
      if (typingRef.current) return;
      const cleaned = sanitizeSttFragment(t);
      setInterim("");
      if (!cleaned) return;
      if (sendingRef.current && respRef.current.length > 0) {
        // The candidate kept talking while the next question was being fetched — those words
        // belong to the answer JUST sent, not the (empty) buffer of the upcoming turn.
        const prev = respRef.current[respRef.current.length - 1];
        prev.answer = `${prev.answer} ${cleaned}`.replace(/\s+/g, " ").trim();
        return;
      }
      setAnswer((a) => (a ? `${a} ${cleaned}` : cleaned).replace(/\s+/g, " "));
      bumpSpeech();
    },
  });

  // If speech recognition dies for good (mic denied, engines exhausted), don't leave the
  // candidate talking at a lit-but-deaf mic — flip to typing mode with the hook's message
  // visible below the controls.
  useEffect(() => {
    if (stt.needsTypingFallback) setTyping(true);
  }, [stt.needsTypingFallback]);

  // Keep the screen awake during the interview — phones dim/lock mid-answer otherwise, which
  // suspends timers and (on iOS) can end capture entirely. Best-effort; unsupported = no-op.
  useScreenWakeLock(started && !submitted);

  // timer (elapsed)
  useEffect(() => {
    if (!started || submitted) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [started, submitted]);

  // autoscroll transcript
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript, answer, interim]);

  const askQuestion = useCallback((q: InterviewQuestion | null) => {
    const text = qText(q);
    if (!text) return;
    setTranscript((tr) => [...tr, { role: "ai", text }]);
    setSpeakText(text);
    setAiSpeaking(true);
  }, []);

  const doSubmit = useCallback(async () => {
    if (submittingRef.current || busy) return;
    submittingRef.current = true;
    setBusy(true);
    setEvaluating(true);
    try {
      window.speechSynthesis?.cancel();
      stt.stop();
      stopMicAnalyser();
      stopSelfView();
      await mockInterviewService.submitInterview(interviewId, {
        transcript: {
          responses: respRef.current,
          total_duration_seconds: Math.round((performance.now() - startedAtRef.current) / 1000),
          metadata: {
            face_validation_failures: 0,
            multiple_face_detections: 0,
            fullscreen_exits: 0,
            completed_questions: respRef.current.length,
            total_questions: respRef.current.length,
          },
        },
      });
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      setSubmitted(true);
      setEvaluating(false);
      // Poll for the level insight (no marks) — the evaluation runs in the background.
      setResultLoading(true);
      for (let i = 0; i < 10; i++) {
        try {
          const r = await adaptiveJourneyService.getInterviewResult(courseId);
          if (r.done && r.insight) {
            setResult(r);
            notifyContentCompleted(); // eval done + scored → counts toward the streak
            break;
          }
        } catch {
          /* retry */
        }
        await new Promise((res) => setTimeout(res, 2500));
      }
      setResultLoading(false);
    } catch {
      retryActionRef.current = "submit";
      setError("Couldn't submit your interview. Please try again.");
    } finally {
      setBusy(false);
      setEvaluating(false);
      submittingRef.current = false;
    }
  }, [busy, courseId, interviewId, stt, stopMicAnalyser, stopSelfView]);

  const sendAnswer = useCallback(async () => {
    if (sendingRef.current || busy || !question) return;
    const text = answerRef.current.trim();
    if (!text) return;
    sendingRef.current = true;
    try {
      const resp: InterviewResponse = { question_id: question.id, question_text: qText(question), answer: text };
      respRef.current = [...respRef.current, resp];
      setTranscript((tr) => [...tr, { role: "student", text }]);
      setAnswer("");
      setInterim("");
      if (currentIsFinal) {
        await doSubmit();
        return;
      }
      setBusy(true);
      try {
        const next = await mockInterviewService.getNextQuestion(interviewId, {
          previous_question_id: question.id,
          candidate_answer: text,
        });
        setError(null);
        if (next.is_closing_remark || next.interview_complete || !next.question) {
          const remark = next.closing_remark || "Thanks — that's the end of the interview.";
          setClosingRemark(remark);
          setTranscript((tr) => [...tr, { role: "ai", text: remark }]);
          setSpeakText(remark);
          setAiSpeaking(true);
          setQuestion(null);
          // No more questions to answer — stop capturing so the mic isn't held open
          // (and Whisper isn't billed) while the closing remark plays + results load.
          stt.stop();
          stopMicAnalyser();
        } else {
          setQuestion(next.question);
          setTurn(next.turn_number);
          setMaxTurns(next.max_turns);
          setCurrentIsFinal(!!next.is_final_question);
          askQuestion(next.question);
        }
      } catch {
        // Roll back the optimistic commit: keep the candidate's words in the answer box and
        // off respRef, so Retry re-sends the SAME turn (no duplicate server-side response)
        // and nothing is lost. Without this, a transient failure was a silent dead-end —
        // the error state only rendered on the pre-start screen. Restore from the popped
        // entry (not the snapshot): continuation speech during the fetch was routed into it.
        const popped = respRef.current[respRef.current.length - 1];
        respRef.current = respRef.current.slice(0, -1);
        setTranscript((tr) => tr.slice(0, -1));
        setAnswer(popped?.answer ?? text);
        retryActionRef.current = "send";
        setError("The interviewer didn't respond. Your answer is saved — tap Retry.");
      } finally {
        setBusy(false);
      }
    } finally {
      sendingRef.current = false;
    }
  }, [busy, question, currentIsFinal, interviewId, doSubmit, askQuestion, stt, stopMicAnalyser]);

  useEffect(() => {
    sendAnswerRef.current = () => void sendAnswer();
  }, [sendAnswer]);

  // Silence-based auto-advance: once the interviewer has finished and the candidate has
  // said something, a few seconds of quiet sends the answer automatically (voice mode).
  useEffect(() => {
    if (!started || submitted || aiSpeaking || busy || !question || typing) return;
    // Measure the silence window from when listening actually (re)starts — not from a
    // stale timestamp (e.g. after typing, or between questions) which would otherwise
    // auto-send an answer instantly with no grace period.
    lastSpeechRef.current = performance.now();
    const id = setInterval(() => {
      if (answerRef.current.trim() && performance.now() - lastSpeechRef.current > SILENCE_ADVANCE_MS) {
        clearInterval(id);
        sendAnswerRef.current();
      }
    }, 400);
    return () => clearInterval(id);
  }, [started, submitted, aiSpeaking, busy, question, typing]);

  const begin = async () => {
    setBusy(true);
    // SYNCHRONOUS gesture work first — iOS/Safari only honor these inside the click, and any
    // await below discards the transient activation:
    // 1) bless the shared TTS <audio> element + prime speechSynthesis (else the interviewer is
    //    SILENT on every iPhone/iPad browser),
    // 2) create + resume the analyser AudioContext (created after an await it stays suspended
    //    on WebKit and the mic level/silence gate reads zero forever).
    unlockInterviewerAudio();
    try {
      const ctx = new AudioContext();
      if (ctx.state === "suspended") void ctx.resume().catch(() => {});
      preCreatedCtxRef.current = ctx;
    } catch {
      /* startMicAnalyser will create its own as a fallback */
    }
    try {
      // Fullscreen rides the same click gesture but is NOT awaited — serializing it in front
      // of /start added its animation time to the silence before the interviewer's first word.
      try {
        void document.documentElement.requestFullscreen?.()?.catch?.(() => {});
      } catch {
        /* optional */
      }
      const d = await mockInterviewService.startInterview(interviewId);
      // Warm the opening question's TTS clip NOW — before React even renders the avatar — so
      // the interviewer's first word plays from cache instead of paying a cold /api/tts
      // round-trip (the main "it takes a while for the interviewer to ask" latency).
      prefetchInterviewerClip(qText(d.current_question ?? null));
      if (d.resume_window_expired || ["completed", "finalized"].includes(String(d.status))) {
        setSubmitted(true);
        return;
      }
      if (d.is_resume && Array.isArray(d.conversation_history)) {
        respRef.current = d.conversation_history.map((h) => ({ question_id: h.question_id, question_text: h.question_text, answer: h.answer }));
        setTranscript(d.conversation_history.flatMap((h) => [{ role: "ai" as const, text: h.question_text }, { role: "student" as const, text: h.answer }]));
      }
      if (d.is_resume) {
        // Restore what a reload loses: the wrap-up flag (or an answered final question would be
        // re-asked as a normal turn) and the visible clock (server started_at, not zero).
        if (typeof d.turn_number === "number" && typeof d.max_turns === "number" && d.max_turns > 0) {
          setCurrentIsFinal(d.turn_number >= d.max_turns);
        }
        if (d.started_at) {
          const secs = Math.floor((Date.now() - new Date(d.started_at).getTime()) / 1000);
          if (Number.isFinite(secs) && secs > 0) setElapsed(secs);
        }
      }
      startedAtRef.current = performance.now();
      bumpSpeech();
      setQuestion(d.current_question ?? null);
      setTurn(d.turn_number ?? 1);
      setMaxTurns(d.max_turns ?? 0);
      setStarted(true);
      // Begin continuous capture + the mic-level analyser in the same user gesture (mic
      // permission + audio unlock, so the AudioContext isn't created suspended).
      stt.start();
      void startMicAnalyser();
      // Best-effort self-view (a small mirror of the candidate, like a real video call).
      // Acquired in the same Begin gesture so the camera prompt rides the click. Failure or
      // denial must NEVER block the interview — it's purely a presence cue.
      void (async () => {
        try {
          const cam = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
            audio: false,
          });
          selfViewStreamRef.current = cam;
          registerMediaStream(cam);
          setSelfViewOn(true); // renders the tile → the callback ref attaches the stream
        } catch {
          /* no camera / denied — interview continues without the self-view */
        }
      })();
      askQuestion(d.current_question ?? null);
    } catch (e) {
      const code = (e as { response?: { status?: number } })?.response?.status;
      setError(code === 400 ? "This interview has already been completed." : "Couldn't start the interview. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // ---- render: terminal state — level insight (no marks, like calibration) ----
  if (submitted) {
    const ins = result?.insight;
    const CARD = { p: { xs: 2, md: 2.5 }, borderRadius: 3, bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" } as const;
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#0b1220", color: "white", py: { xs: 3, md: 6 }, px: 2, display: "flex", justifyContent: "center" }}>
        <Box sx={{ width: "100%", maxWidth: 680 }}>
          <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
            <Icon icon="mdi:check-decagram" width={44} color="#4ade80" />
            <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", textAlign: "center" }}>
              {ins ? ins.headline : "Interview submitted"}
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.82rem", textAlign: "center" }}>
              No marks or right/wrong — this is your level and how the course will adapt to you.
            </Typography>
          </Stack>

          {resultLoading && !ins && (
            <Stack alignItems="center" spacing={1.5} sx={{ py: 4 }}>
              <CircularProgress size={26} sx={{ color: "#a855f7" }} />
              <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>Reading your level…</Typography>
            </Stack>
          )}

          {ins && (
            <Stack spacing={2}>
              <Box sx={CARD}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontWeight: 700 }}>Your level</Typography>
                  <Chip label={ins.level_label} sx={{ fontWeight: 800, color: "#0b1220", bgcolor: TIER_COLOR[ins.field_tier] ?? "#60a5fa" }} />
                </Stack>
                <Box sx={{ mt: 1.5, height: 8, borderRadius: 4, bgcolor: "rgba(255,255,255,0.08)" }}>
                  <Box sx={{ width: `${Math.round(ins.ability_index)}%`, height: "100%", borderRadius: 4, bgcolor: TIER_COLOR[ins.field_tier] ?? "#60a5fa" }} />
                </Box>
                <Typography sx={{ mt: 1.5, color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>{ins.summary}</Typography>
              </Box>

              {(ins.strengths.length > 0 || ins.growth_areas.length > 0) && (
                <Box sx={CARD}>
                  {ins.strengths.length > 0 && (
                    <>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: "#86efac", mb: 0.75 }}>You came across strong on</Typography>
                      <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.75, mb: ins.growth_areas.length ? 1.75 : 0 }}>
                        {ins.strengths.map((s) => <Chip key={s.area} size="small" icon={<Icon icon="mdi:check-circle" width={14} />} label={s.area} sx={{ fontWeight: 700, color: "#86efac", bgcolor: "rgba(34,197,94,0.12)" }} />)}
                      </Stack>
                    </>
                  )}
                  {ins.growth_areas.length > 0 && (
                    <>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: "#fcd34d", mb: 0.75 }}>We&apos;ll support you on</Typography>
                      <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.75 }}>
                        {ins.growth_areas.map((g) => <Chip key={g.area} size="small" icon={<Icon icon="mdi:trending-up" width={14} />} label={g.area} sx={{ fontWeight: 700, color: "#fcd34d", bgcolor: "rgba(245,158,11,0.12)" }} />)}
                      </Stack>
                    </>
                  )}
                </Box>
              )}

              <Box sx={{ ...CARD, bgcolor: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
                <Typography sx={{ fontWeight: 800, color: "#c4b5fd", mb: 1 }}>✦ How AI Linc will adapt to you</Typography>
                <Stack spacing={1}>
                  {ins.how_ai_helps.map((h, i) => (
                    <Stack key={i} direction="row" spacing={1}>
                      <Icon icon="mdi:arrow-right-thin" width={18} color="#c4b5fd" style={{ flexShrink: 0, marginTop: 2 }} />
                      <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: "0.88rem" }}>{h}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Stack>
          )}

          {!resultLoading && !ins && (
            <Typography sx={{ textAlign: "center", color: "rgba(255,255,255,0.6)", py: 2 }}>
              Your level insight is being prepared — it&apos;ll appear in your course shortly.
            </Typography>
          )}

          <Stack alignItems="center" sx={{ mt: 3 }}>
            <Button variant="contained" onClick={() => push(`/adaptive-courses/${courseId}`)}
              sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2, px: 4, py: 1.1, color: "white", background: "linear-gradient(135deg, #7c3aed, #db2777)" }}>
              Start my personalized journey →
            </Button>
          </Stack>
        </Box>
      </Box>
    );
  }

  if (error && !started) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#0b1220", color: "white", p: 3 }}>
        <Stack alignItems="center" spacing={1.5} sx={{ maxWidth: 420, textAlign: "center" }}>
          <Icon icon="mdi:alert-circle-outline" width={44} color="#fca5a5" />
          <Typography sx={{ color: "rgba(255,255,255,0.8)" }}>{error}</Typography>
          <Stack direction="row" spacing={1.5}>
            <Button variant="contained" disabled={busy} onClick={() => { setError(null); void begin(); }}
              startIcon={busy ? <CircularProgress size={15} sx={{ color: "white" }} /> : <Icon icon="mdi:refresh" width={18} />}
              sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2, background: "linear-gradient(135deg, #7c3aed, #db2777)" }}>
              Try again
            </Button>
            <Button variant="outlined" onClick={() => push(`/adaptive-courses/${courseId}`)} sx={{ color: "white", borderColor: "rgba(255,255,255,0.3)", textTransform: "none" }}>Back to course</Button>
          </Stack>
        </Stack>
      </Box>
    );
  }

  // ---- begin gate ----
  if (!started) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#0b1220", color: "white", p: 3 }}>
        <Stack alignItems="center" spacing={2.5} sx={{ maxWidth: 560, textAlign: "center" }}>
          <Box sx={{ width: { xs: 220, md: 300 }, height: { xs: 150, md: 200 }, borderRadius: 4, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
            <AIAvatar interviewVideoSrc={INTERVIEW_AVATAR_SRC} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.4rem" }}>Meet your AI interviewer</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.62)", lineHeight: 1.6 }}>
            {topic ? `${topic} · ` : ""}{difficulty} · a short spoken conversation. The interviewer asks each question
            out loud — just <b>speak your answer</b>, and it advances when you pause. It adapts to you and gauges your level.
          </Typography>
          <Stack direction="row" spacing={3.5} justifyContent="center" sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.78rem" }}>
            {[
              { icon: "mdi:microphone", label: "Voice" },
              { icon: "mdi:closed-caption-outline", label: "Live captions" },
              { icon: "mdi:robot-happy-outline", label: "Adaptive" },
            ].map((x) => (
              <Stack key={x.label} alignItems="center" spacing={0.6}>
                <Icon icon={x.icon} width={20} />
                <span>{x.label}</span>
              </Stack>
            ))}
          </Stack>

          {/* Device check BEFORE the interview: permissions are prompted here (not mid-interview,
              where the recognizer used to fire not-allowed while the prompt was still open), the
              candidate sees their mic level, and the speech test pins the exact STT engine that
              works in this browser. Voice Begin unlocks when the speech check passes. Unmounted
              the moment Begin is clicked (busy) so its mic/camera streams are RELEASED before the
              interview acquires its own — iOS is unforgiving about stacked audio captures. */}
          {!busy && <QuickDeviceCheck onStatus={setDeviceCheck} />}

          <Button variant="contained" disabled={busy || !deviceCheck.speechOk} onClick={begin}
            startIcon={busy ? <CircularProgress size={16} sx={{ color: "white" }} /> : <Icon icon="mdi:microphone" width={20} />}
            sx={{ mt: 1, textTransform: "none", fontWeight: 800, borderRadius: 2, px: 4, py: 1.2,
              background: "linear-gradient(135deg, #7c3aed, #db2777)",
              "&.Mui-disabled": { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" } }}>
            {busy ? "Connecting…" : deviceCheck.speechOk ? "Begin interview" : "Pass the mic check to begin"}
          </Button>
          {!deviceCheck.speechOk && (
            <Button disabled={busy} onClick={() => { setTyping(true); void begin(); }}
              startIcon={<Icon icon="mdi:keyboard-outline" width={16} />}
              sx={{ textTransform: "none", color: "rgba(255,255,255,0.55)", fontSize: "0.8rem" }}>
              Can&apos;t use a mic? Start and type your answers instead
            </Button>
          )}
        </Stack>
      </Box>
    );
  }

  const phase = aiSpeaking ? "Interviewer speaking" : stt.isListening ? "Listening…" : busy ? "Thinking…" : "Your turn";
  const phaseColor = aiSpeaking ? "#a855f7" : stt.isListening ? "#22c55e" : "#64748b";
  const liveAnswer = (answer + (interim ? ` ${interim}` : "")).trim();
  const finishing = !question && !!closingRemark;

  return (
    <Box sx={{ height: "100vh", "@supports (height: 100dvh)": { height: "100dvh" }, overflow: "hidden", bgcolor: "#0b1220", color: "white", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: { xs: 2, md: 3 }, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Box>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>AI Mock Interviewer</Typography>
            <Chip size="small" label="LIVE" sx={{ height: 18, fontSize: "0.58rem", fontWeight: 800, color: "white", background: "linear-gradient(135deg, #7c3aed, #db2777)" }} />
          </Stack>
          <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>
            {topic ? `${topic} · ` : ""}{difficulty} round
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Chip size="small" icon={<Icon icon="mdi:clock-outline" width={14} />} label={`${fmtClock(elapsed)}`}
            sx={{ color: "rgba(255,255,255,0.8)", bgcolor: "rgba(255,255,255,0.06)", fontWeight: 700, fontSize: "0.72rem", "& .MuiChip-icon": { color: "rgba(255,255,255,0.6)" } }} />
          <Chip size="small" label={`Q${turn}${maxTurns ? ` of ~${maxTurns}` : ""}`} sx={{ color: "#c4b5fd", bgcolor: "rgba(124,58,237,0.18)", fontWeight: 800, fontSize: "0.72rem", display: { xs: "none", sm: "inline-flex" } }} />
          <Button variant="contained" disabled={busy} onClick={doSubmit}
            sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2, bgcolor: "rgba(239,68,68,0.15)", color: "#fca5a5", boxShadow: "none", "&:hover": { bgcolor: "rgba(239,68,68,0.25)" } }}>
            End &amp; get level
          </Button>
        </Stack>
      </Stack>

      {/* Call layout: the stage (interviewer + PiP self-view + live badge) up top, the
          conversation beside it on desktop / between stage and controls on mobile, and the
          controls docked at the bottom. Grid AREAS replace the old flex-spacer layout, whose
          stretch behavior opened a huge dead void between the self-view and the controls on
          stacked (mobile) viewports and pushed the conversation below the fold. */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0,1.1fr) minmax(0,1fr)" },
          gridTemplateRows: { xs: "auto minmax(0,1fr) auto", md: "minmax(0,1fr) auto" },
          gridTemplateAreas: {
            xs: '"stage" "convo" "controls"',
            md: '"stage convo" "controls convo"',
          },
        }}
      >
        {/* Stage — the interviewer fills it like a real call */}
        <Box sx={{ gridArea: "stage", p: { xs: 2, md: 3 }, pb: { xs: 1, md: 1.5 }, minHeight: 0, display: "flex" }}>
          <Box
            sx={{
              position: "relative", width: "100%", aspectRatio: "16 / 10", maxHeight: "100%", m: "auto",
              borderRadius: 4, overflow: "hidden",
              border: stt.isListening ? "2px solid #22c55e" : "1px solid rgba(255,255,255,0.1)",
              transition: "border-color 200ms ease",
              boxShadow: "0 24px 60px -32px rgba(0,0,0,0.9)",
            }}
          >
            <AIAvatar
              isSpeaking={aiSpeaking}
              question={speakText}
              onSpeakComplete={() => setAiSpeaking(false)}
              isUserSpeaking={stt.isListening}
              interviewVideoSrc={INTERVIEW_AVATAR_SRC}
            />
            {/* Live status badge ON the video, like a call overlay */}
            <Chip
              size="small"
              icon={<Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: phaseColor, boxShadow: `0 0 8px ${phaseColor}` }} />}
              label={phase}
              sx={{
                position: "absolute", top: 10, left: 10, zIndex: 2,
                color: "#fff", fontWeight: 800, fontSize: "0.72rem",
                bgcolor: "rgba(2,6,23,0.55)", backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            />
            {/* Self-view PiP — top-right of the stage (bottom edge belongs to the captions).
                Only shown once the camera is granted; denial leaves the layout unchanged. */}
            {selfViewOn && (
              <Box
                sx={{
                  position: "absolute", top: 10, right: 10, zIndex: 2,
                  width: { xs: 92, sm: 118, md: 148 }, aspectRatio: "4 / 3",
                  borderRadius: 2, overflow: "hidden", bgcolor: "#020617",
                  border: "1px solid rgba(255,255,255,0.25)",
                  boxShadow: "0 12px 30px -12px rgba(0,0,0,0.9)",
                }}
              >
                <video ref={attachSelfView} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
                <Box sx={{ position: "absolute", bottom: 4, left: 6, px: 0.75, py: 0.15, borderRadius: 1, bgcolor: "rgba(2,6,23,0.72)", fontSize: "0.6rem", fontWeight: 800, letterSpacing: 0.3, color: "rgba(255,255,255,0.85)" }}>You</Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* Controls — docked under the stage (desktop) / pinned to the bottom (mobile) */}
        <Box sx={{ gridArea: "controls", px: { xs: 2, md: 3 }, pb: { xs: 1.5, md: 2.5 }, pt: 0.5 }}>
          {finishing ? (
            <Button fullWidth variant="contained" disabled={busy} onClick={doSubmit}
              endIcon={busy ? <CircularProgress size={15} sx={{ color: "white" }} /> : <Icon icon="mdi:flag-checkered" width={18} />}
              sx={{ py: 1.3, borderRadius: 2.5, textTransform: "none", fontWeight: 800, color: "#fff", background: "linear-gradient(135deg, #16a34a, #22c55e)" }}>
              {busy ? "Finishing…" : "Finish & see my level"}
            </Button>
          ) : typing ? (
            <Box>
              <TextField fullWidth multiline minRows={2} placeholder="Type your answer…" value={answer} onChange={(e) => setAnswer(e.target.value)}
                inputProps={{ style: { color: "#ffffff", WebkitTextFillColor: "#ffffff", caretColor: "#a855f7" } }}
                sx={{
                  "& .MuiOutlinedInput-root": { bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2, "& fieldset": { borderColor: "rgba(255,255,255,0.18)" }, "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" } },
                  "& .MuiInputBase-input, & .MuiOutlinedInput-input, & textarea": { color: "#fff !important", WebkitTextFillColor: "#fff !important" },
                  "& textarea::placeholder, & .MuiInputBase-input::placeholder": { color: "rgba(255,255,255,0.5) !important", WebkitTextFillColor: "rgba(255,255,255,0.5) !important", opacity: 1 },
                }} />
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button fullWidth variant="contained" disabled={busy || !answer.trim()} onClick={() => void sendAnswer()}
                  endIcon={busy ? <CircularProgress size={15} sx={{ color: "white" }} /> : <Icon icon="mdi:send" width={16} />}
                  sx={{ py: 1.05, borderRadius: 2.5, textTransform: "none", fontWeight: 800, color: "#fff", background: "linear-gradient(135deg, #6366f1, #a855f7)", "&.Mui-disabled": { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" } }}>
                  {busy ? "Sending…" : currentIsFinal ? "Send & finish" : "Send answer"}
                </Button>
                <Button onClick={() => setTyping(false)} sx={{ textTransform: "none", color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>Use voice</Button>
              </Stack>
            </Box>
          ) : (
            <Stack spacing={1}>
              {/* One compact voice bar: waveform + status + silence countdown + actions. */}
              <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <MicWaveform levelRef={micLevelRef} active={!aiSpeaking && !busy} color="#22c55e" />
                    <Typography sx={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.6)" }}>
                      {aiSpeaking ? "Interviewer speaking" : answer.trim() ? "Pause to send" : "Listening…"}
                    </Typography>
                  </Stack>
                  <Button size="small" onClick={() => setTyping(true)} startIcon={<Icon icon="mdi:keyboard-outline" width={15} />}
                    sx={{ textTransform: "none", color: "rgba(255,255,255,0.55)", fontSize: "0.74rem", minWidth: 0 }}>
                    Type instead
                  </Button>
                </Stack>
                <PauseProgressBar progressRef={pauseProgressRef} isListening={!aiSpeaking && !busy && !!answer.trim()} />
              </Box>
              <Button fullWidth variant="contained" disabled={busy || aiSpeaking || !answer.trim()} onClick={() => void sendAnswer()}
                endIcon={busy ? <CircularProgress size={15} sx={{ color: "white" }} /> : <Icon icon="mdi:send" width={16} />}
                sx={{ py: 1.3, borderRadius: 2.5, textTransform: "none", fontWeight: 800, color: "#fff", background: "linear-gradient(135deg, #6366f1, #a855f7)", "&.Mui-disabled": { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" } }}>
                {busy ? "Sending…" : answer.trim() ? (currentIsFinal ? "Done — send & finish" : "Done answering") : aiSpeaking ? "Interviewer is speaking…" : "Listening — speak your answer"}
              </Button>
            </Stack>
          )}
          {/* In-interview failures used to be invisible (the error screen only rendered
              pre-start), leaving the interview looking frozen. Surface them inline with a
              Retry that re-runs exactly what failed — the answer was restored by the
              rollback, so retrying can't duplicate a turn. */}
          {error && (
            <Stack direction="row" spacing={1} alignItems="center"
              sx={{ mt: 1.5, p: 1.25, borderRadius: 2, bgcolor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)" }}>
              <Icon icon="mdi:alert-circle-outline" width={18} color="#fca5a5" style={{ flexShrink: 0 }} />
              <Typography sx={{ flex: 1, fontSize: "0.78rem", color: "#fecaca" }}>{error}</Typography>
              <Button size="small" disabled={busy}
                onClick={() => {
                  setError(null);
                  if (retryActionRef.current === "submit") void doSubmit();
                  else void sendAnswer();
                }}
                sx={{ textTransform: "none", fontWeight: 800, color: "#fecaca", bgcolor: "rgba(239,68,68,0.2)", "&:hover": { bgcolor: "rgba(239,68,68,0.3)" } }}>
                Retry
              </Button>
            </Stack>
          )}
          {stt.error && <Typography sx={{ mt: 1, fontSize: "0.7rem", color: "#fca5a5", textAlign: "center" }}>{stt.error}</Typography>}
        </Box>

        {/* Conversation — beside the call on desktop, between stage and controls on mobile
            (it now absorbs the spare viewport height that used to render as a dead void). */}
        <Box sx={{ gridArea: "convo", display: "flex", flexDirection: "column", minHeight: 0, borderLeft: { md: "1px solid rgba(255,255,255,0.08)" }, borderTop: { xs: "1px solid rgba(255,255,255,0.06)", md: "none" } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: { xs: 2, md: 3 }, py: { xs: 1.1, md: 1.75 }, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: "0.9rem", md: "1rem" } }}>Conversation</Typography>
            <Chip size="small" label="Auto-captions on" sx={{ height: 22, fontSize: "0.66rem", bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)" }} />
          </Stack>
          <Box ref={scrollRef} sx={{ flex: 1, overflowY: "auto", p: { xs: 2, md: 3 } }}>
            <Stack spacing={2}>
              {transcript.map((b, i) => (
                <Stack key={i} direction="row" justifyContent={b.role === "ai" ? "flex-start" : "flex-end"} spacing={1}>
                  {b.role === "ai" && <Box sx={{ width: 26, height: 26, flexShrink: 0, mt: 0.5, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #db2777)", display: "grid", placeItems: "center" }}><Icon icon="mdi:robot-happy-outline" width={15} color="white" /></Box>}
                  <Box sx={{ maxWidth: "82%", p: 1.5, borderRadius: 3,
                    bgcolor: b.role === "ai" ? "rgba(255,255,255,0.05)" : "#4f46e5",
                    border: b.role === "ai" ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                    <Typography sx={{ fontSize: "0.92rem", lineHeight: 1.5 }}>{b.text}</Typography>
                  </Box>
                  {b.role === "student" && <Box sx={{ width: 26, height: 26, flexShrink: 0, mt: 0.5, borderRadius: "50%", bgcolor: "#6366f1", display: "grid", placeItems: "center", fontSize: "0.7rem", fontWeight: 800 }}>You</Box>}
                </Stack>
              ))}
              {liveAnswer && !aiSpeaking && (
                <Stack direction="row" justifyContent="flex-end">
                  <Box sx={{ maxWidth: "82%", p: 1.5, borderRadius: 3, bgcolor: "rgba(79,70,229,0.6)" }}>
                    <Typography sx={{ fontSize: "0.92rem", lineHeight: 1.5 }}>{liveAnswer}<Box component="span" sx={{ ml: 0.5, display: "inline-block", width: 8, height: 16, bgcolor: "white", animation: "blink 1s steps(2) infinite", "@keyframes blink": { "50%": { opacity: 0 } } }} /></Typography>
                  </Box>
                </Stack>
              )}
              {busy && !aiSpeaking && <Typography sx={{ textAlign: "center", fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>following up…</Typography>}
            </Stack>
          </Box>
        </Box>
      </Box>

      {evaluating && (
        <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(11,18,32,0.88)", display: "grid", placeItems: "center", zIndex: 20 }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress size={48} sx={{ color: "#a855f7" }} />
            <Typography sx={{ color: "white", fontWeight: 700 }}>Reading your level…</Typography>
          </Stack>
        </Box>
      )}
    </Box>
  );
}

export default function CourseInterviewPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#0b1220" }}>
          <CircularProgress sx={{ color: "#a855f7" }} />
        </Box>
      }
    >
      <CourseInterviewInner />
    </Suspense>
  );
}
