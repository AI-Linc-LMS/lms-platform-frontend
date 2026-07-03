"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box } from "@mui/material";
import { useToast } from "@/components/common/Toast";
import mockInterviewService, {
  MockInterviewDetail,
  InterviewQuestion,
  InterviewResponse,
  NextQuestionResponse,
} from "@/lib/services/mock-interview.service";
import { useProctoring } from "@/lib/hooks/useProctoring";
import { useFullscreenMonitor } from "@/lib/hooks/useFullscreenMonitor";
import { useSpeechToText } from "@/lib/hooks/useSpeechToText";
import { readSttEngine } from "@/lib/utils/stt-engine";
import { detectBrowser } from "@/lib/utils/browser-detect";
import { unlockInterviewerAudio } from "@/lib/hooks/useInterviewerVoice";
import { useScreenWakeLock } from "@/lib/hooks/useScreenWakeLock";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { stopAllMediaTracks, registerMediaStream } from "@/lib/utils/cameraUtils";
import { cleanInterviewTitle } from "@/lib/utils/mock-interview-title";
import {
  getAudioConstraints,
  VIDEO_CAMERA_CONSTRAINTS,
} from "@/lib/utils/audio-constraints";
import { applyNoiseSuppression } from "@/lib/utils/noise-suppression";
import {
  InterviewHeader,
  VideoPreviewArea,
  AnswerInputArea,
  QuestionListSidebar,
  FullscreenWarningDialog,
  EndInterviewDialog,
} from "@/components/mock-interview";
import { CodingQuestionModal } from "@/components/mock-interview/CodingQuestionModal";
import { MCQQuestionModal } from "@/components/mock-interview/MCQQuestionModal";

const INTERVIEW_AVATAR_SRC = "/videos/Interview.mp4";

export default function TakeMockInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = Number(params.id);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [interview, setInterview] = useState<MockInterviewDetail | null>(null);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [showEndInterviewDialog, setShowEndInterviewDialog] = useState(false);
  const [isEndingInterview, setIsEndingInterview] = useState(false);

  // Dynamic (turn-based) interview state. For legacy interviews these stay null/false and the
  // page falls back to the existing 5-question, index-driven flow.
  const [dynamicCurrentQuestion, setDynamicCurrentQuestion] =
    useState<InterviewQuestion | null>(null);
  const [dynamicTurnNumber, setDynamicTurnNumber] = useState<number>(1);
  const [dynamicMaxTurns, setDynamicMaxTurns] = useState<number>(5);
  const [dynamicIsFinalQuestion, setDynamicIsFinalQuestion] =
    useState<boolean>(false);
  // True after the backend has handed us the closing remark (a natural verbal wrap-up,
  // NOT a question). When set:
  //   - silence-based auto-advance is suppressed (we're not waiting for another answer)
  //   - the action button reads "Submit Interview"
  //   - the avatar speaks the closing remark via existing TTS pipeline
  const [isClosingRemark, setIsClosingRemark] = useState<boolean>(false);
  const [isFetchingNext, setIsFetchingNext] = useState(false);

  const [isCodingModalOpen, setIsCodingModalOpen] = useState<boolean>(false);
  const [isMCQModalOpen, setIsMCQModalOpen] = useState<boolean>(false);
  const lastStructuredQuestionIdRef = useRef<number | null>(null);
  // When the coding modal opened — used to credit the ACTUAL seconds spent coding (capped
  // server-side) so an early submit doesn't hand back unused time.
  const codingModalOpenedAtRef = useRef<number>(0);

  const [nudgeText, setNudgeText] = useState<string | null>(null);
  const nudgeSilenceCountRef = useRef(0);
  const nudgeProbeCountRef = useRef(0);
  const nudgeProbeUsedThisTurnRef = useRef(false);
  const recentProbeIndexRef = useRef(-1);
  const nudgeSpeakCompleteAtRef = useRef<number>(0);
  const advanceAfterNudgeRef = useRef(false);
  const MAX_PROBES_PER_INTERVIEW = 3;
  const rewindOriginalAnswerRef = useRef<string>("");
  const rewindActiveRef = useRef(false);

  const [codingTimeBudgetSeconds, setCodingTimeBudgetSeconds] = useState<number>(0);
  const [interviewBonusSeconds, setInterviewBonusSeconds] = useState<number>(0);
  // Which STT engine the device-check mic test proved works in this browser. Read once on
  // mount (client-side) and forced into useSpeechToText so the interview uses the exact path
  // that passed the test — the fix for "mic works on the test page but fails inside".
  // Keep the screen awake during the interview (phones dim/lock mid-answer otherwise).
  useScreenWakeLock(interviewStarted);
  const [forcedSttEngine] = useState<"browser" | "whisper" | undefined>(
    // Same Edge default as the adaptive surface: with nothing pinned, Edge's broken native
    // SpeechRecognition would burn ~10s of retries before Whisper takes over.
    () => readSttEngine() ?? (detectBrowser() === "edge" ? "whisper" : undefined),
  );

  const isInitializingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const userStreamRef = useRef<MediaStream | null>(null);
  const noiseSuppressionTeardownRef = useRef<(() => void) | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioLevelRef = useRef<number>(0);
  const lastTranscriptChangeAtRef = useRef<number>(0);
  const eyeMovementCountRef = useRef(0);
  const lastEyeMovementWarningRef = useRef(0);
  // ── Freeze watchdog state ──────────────────────────────────────────────
  // `lastPipelineActivityRef` is the heartbeat: it's bumped whenever the interview pipeline
  // is demonstrably alive (the silence-detector tick, STT activity, the avatar producing
  // audio, a fetch in flight). A GENUINE total freeze is the only thing that lets it go
  // stale — normal thinking-silence keeps the detector ticking, so it is never mistaken for
  // a freeze. `speakingStartedAtRef`/`fetchStartedAtRef` catch the two "stuck" sub-cases
  // (avatar stuck with no audio; next-question call hung). `freezeRecoverPhaseRef` sequences
  // a gentle in-place recovery before a last-resort reload. `intentionalReloadRef` lets that
  // reload skip the "are you sure you want to leave" guard.
  const lastPipelineActivityRef = useRef<number>(Date.now());
  const speakingStartedAtRef = useRef<number>(0);
  const fetchStartedAtRef = useRef<number>(0);
  const freezeRecoverPhaseRef = useRef<"idle" | "soft">("idle");
  const softRecoverAtRef = useRef<number>(0);
  const intentionalReloadRef = useRef<boolean>(false);
  // True while the interviewer voice is genuinely producing audio (lifted from AIAvatar). The
  // watchdog uses it to tell a long question (audio playing) from a dead-TTS stall.
  const audioActiveRef = useRef<boolean>(false);
  // After any recovery we hold off re-evaluating for a beat so a settling pipeline can't be
  // re-flagged → this is what stops the "reconnecting again and again" loop.
  const recoverCooldownUntilRef = useRef<number>(0);
  // Timestamp recorded when proctoring starts. Used to silently drop NO_FACE /
  // POOR_LIGHTING violation toasts during the first PROCTORING_WARMUP_MS while the
  // camera stream is still attaching + the face-detection model is warming up. The
  // shared ProctoringService also has its own warmup (5.5s) but that only activates
  // after videoElement.readyState >= 2 — on the take page the video is sometimes still
  // at readyState 1 when proctoring kicks off, so the service-level warmup never
  // arms and the first detection tick fires a "no face" toast at the candidate. This
  // consumer-level grace period mirrors what the assessment proctoring stack does
  // implicitly and fixes the reported "click Proceed → no face detected toast" bug.
  const proctoringStartedAtRef = useRef<number | null>(null);
  const PROCTORING_WARMUP_MS = 6000;

  const tabSwitchCountRef = useRef(0);
  const windowSwitchCountRef = useRef(0);

  // Proctoring hooks with enhanced configuration
  const {
    isActive: isProctoringActive,
    isInitializing: isProctoringInitializing,
    startProctoring,
    stopProctoring,
    violations,
    faceCount,
    status: proctoringStatus,
    latestViolation,
    videoRef: proctoringVideoRef,
  } = useProctoring({
    // Enhanced proctoring configuration
    minFaceSize: 15, // 15% of video height - face too far
    maxFaceSize: 70, // 70% of video height - face too close
    lookingAwayThreshold: 0.25, // 25% off-center - looking away
    detectionInterval: 250, // Check every 500ms for faster updates
    violationCooldown: 1000, // 1 second cooldown between same violation
    onViolation: (violation) => {
      // Suppress face-detection violations during the startup warmup so a slow camera
      // attach doesn't toast the candidate "no face detected!" the moment they click
      // Proceed. The ProctoringService has its own internal grace period but it only
      // arms after videoElement.readyState >= 2; this consumer-level filter is a
      // belt-and-suspenders catch for the readyState-1-at-startup case.
      const isStartupNoiseViolation =
        violation.type === "NO_FACE" || violation.type === "POOR_LIGHTING";
      const startedAt = proctoringStartedAtRef.current;
      const inWarmup =
        startedAt !== null && Date.now() - startedAt < PROCTORING_WARMUP_MS;
      if (isStartupNoiseViolation && inWarmup) {
        return;
      }
      // Show toast for high severity violations
      if (violation.severity === "high") {
        showToast(violation.message, "error");
      } else if (violation.severity === "medium") {
        // Special handling for eye movement violations with penalty warning
        if (violation.type === "EYE_MOVEMENT") {
          eyeMovementCountRef.current += 1;
          const now = Date.now();
          // Show warning every 3 violations to avoid spam (with 5 second cooldown)
          if (now - lastEyeMovementWarningRef.current > 5000) {
            lastEyeMovementWarningRef.current = now;
            showToast(
              `Eye movement detected`,
              "warning"
            );
          }
        } else {
          showToast(violation.message, "warning");
        }
      }
    },
    onStatusChange: (status) => {
      // Status changes handled automatically
    },
    onFaceCountChange: (count) => {
      // Face count changes handled automatically
    },
  });
  const testDevices = useCallback(async () => {
    try {
      // Reuse stream from device-check when available for a smooth transition
      let stream: MediaStream | null = null;
      if (typeof window !== "undefined" && (window as any).__mockInterviewStream) {
        const globalStream = (window as any).__mockInterviewStream;
        const videoTracks = globalStream.getVideoTracks();
        if (videoTracks.length > 0 && videoTracks[0].readyState === "live") {
          stream = globalStream;
        }
      }
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: VIDEO_CAMERA_CONSTRAINTS,
          audio: getAudioConstraints(),
        });
      }

      try {
        const ns = await applyNoiseSuppression(stream);
        if (ns.outputStream !== stream) {
          noiseSuppressionTeardownRef.current?.();
          noiseSuppressionTeardownRef.current = ns.teardown;
          stream = ns.outputStream;
        }
      } catch {
        // already logged inside applyNoiseSuppression; fall through with raw stream
      }

      userStreamRef.current = stream;
      registerMediaStream(stream);

      const videoTracks = stream.getVideoTracks();
      const hasVideo =
        videoTracks.length > 0 && videoTracks[0].readyState === "live";
      const audioTracks = stream.getAudioTracks();
      const hasAudio =
        audioTracks.length > 0 && audioTracks[0].readyState === "live";

      if (proctoringVideoRef.current) {
        proctoringVideoRef.current.srcObject = stream;
        // play() returns a Promise that rejects with AbortError if the
        // element is removed from the DOM (or src changes) before it
        // resolves — e.g. on unmount. Swallow it.
        proctoringVideoRef.current.play().catch((err: unknown) => {
          if ((err as { name?: string })?.name === "AbortError") return;
          if ((err as { name?: string })?.name === "NotAllowedError") return;
        });
      }

      if (hasAudio && audioTracks.length > 0) {
        try {
          const audioContext = new AudioContext();
          // WebKit creates contexts suspended outside a gesture — a suspended analyser reads
          // all-zero and the silence logic thinks the mic is dead (same guard as line ~631).
          if (audioContext.state === "suspended") {
            void audioContext.resume().catch(() => {});
          }
          audioContextRef.current = audioContext;
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.8;
          source.connect(analyser);
          analyserRef.current = analyser;

          const updateAudioLevel = () => {
            if (!analyserRef.current) return;
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            const average =
              dataArray.reduce((a, b) => a + b) / dataArray.length;
            const normalizedLevel = Math.min(average / 100, 1);
            audioLevelRef.current = normalizedLevel;
            animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        } catch {
          // Fail silently
        }
      }

      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      showToast("Failed to access camera or microphone", "error");
    }
  }, [showToast]);

  useEffect(() => {
    testDevices();
  }, [testDevices]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const existing = document.querySelector(
      `link[rel="preload"][href="${INTERVIEW_AVATAR_SRC}"]`
    );
    if (existing) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "video";
    link.href = INTERVIEW_AVATAR_SRC;
    link.type = "video/mp4";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);
  // Initialize camera and start proctoring immediately on page load
  useEffect(() => {
    if (isProctoringActive || isProctoringInitializing) return;

    const initializeCamera = async () => {
      // Wait for video element to be available
      const checkVideoElement = () => {
        if (!proctoringVideoRef.current) {
          // Retry on next frame
          requestAnimationFrame(checkVideoElement);
          return;
        }

        // Video element is ready, start proctoring immediately
        // Proctoring service will reuse existing stream if available
        proctoringStartedAtRef.current = Date.now();
        startProctoring().catch((error) => {
          // Silently fail - will retry or user will see error when starting interview
        });
      };

      // Start checking after a brief delay to ensure component is mounted
      requestAnimationFrame(checkVideoElement);
    };

    // Start proctoring as soon as component mounts, don't wait for interview
    initializeCamera();
  }, [isProctoringActive, isProctoringInitializing, startProctoring]);

  const { enterFullscreen, violations: fullscreenViolations } =
    useFullscreenMonitor();

  // Whisper hallucinates well-known phrases on silent / very-quiet audio segments because
  // its training corpus was YouTube/social-media-heavy. The candidate's transcript would
  // get polluted with "Thank you for watching", "I hate that", "Please like and subscribe"
  // etc. — exact phrases that never came out of the candidate's mouth. This sanitizer runs
  // on every final STT chunk before it's appended to currentAnswer.
  const sanitizeSttFragment = useCallback((raw: string): string => {
    if (!raw) return "";
    let cleaned = raw;
    // Phrase-level removals. Case-insensitive, with optional surrounding punctuation. Order
    // matters: remove longer multi-word phrases before single fragments so the latter don't
    // shadow the former.
    const hallucinationPatterns: RegExp[] = [
      // YouTube boilerplate
      /\b(?:thanks?|thank\s+you)\s+(?:so\s+much\s+)?for\s+watch(?:ing)?(?:\s+(?:this\s+video|the\s+video|today))?[!.]*/gi,
      /\b(?:please\s+)?(?:don'?t\s+forget\s+to\s+)?(?:like\s+and\s+)?subscribe(?:\s+(?:to\s+(?:my|the|our)\s+channel|to\s+the\s+channel|now))?[!.]*/gi,
      /\b(?:hit\s+the\s+)?(?:bell\s+icon|notification\s+bell)\b[!.]*/gi,
      /\bclick\s+the\s+(?:link|button)\s+(?:below|in\s+the\s+description)\b[!.]*/gi,
      /\bsee\s+you\s+(?:in\s+the\s+)?next\s+(?:video|time)[!.]*/gi,
      // Social-media / chat hallucinations
      /\bi\s+hate\s+that[!.]*/gi,
      /\bi\s+love\s+you[!.]*/gi,
      // Captioner placeholder noise
      /[\[(](?:music|applause|laughter|silence|inaudible|sound\s+effect)[\])][!.]*/gi,
      /^\s*(?:music|applause|laughter|silence|inaudible)\s*$/gim,
      // Standalone "Bye." / "Bye-bye." sign-offs on a near-silent segment
      /^\s*(?:bye[-\s]?bye|bye|goodbye)[!.]*\s*$/gim,
    ];
    for (const rx of hallucinationPatterns) {
      cleaned = cleaned.replace(rx, " ");
    }
    // Collapse the whitespace left behind by removals, then trim. Multiple sequential
    // hallucinations might leave 3+ spaces; we normalize to single spaces.
    cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
    // If the entire chunk was a hallucination (e.g., the user was silent and Whisper just
    // returned "Thank you for watching"), the cleaned text is empty — return "" so onFinal
    // appends nothing instead of " " (which would otherwise widen the currentAnswer).
    return cleaned;
  }, []);

  // EVALUATION TRANSCRIPT NOTE:
  // `useSpeechToText` is configured with `preferWhisper: true` below — that means
  // browser STT drives transcripts whenever it's working (free, fast, accurate enough
  // for most Chrome users), and Whisper takes over as a fallback when browser STT
  // fails (Edge `network` errors, Safari/Firefox without native STT, etc.). Whichever
  // engine is active for a given utterance pipes its `final` chunk through `onFinal`
  // here → `setCurrentAnswer` → ultimately the `transcript.responses[].answer` field
  // the backend evaluator reads. So the evaluation transcript IS Whisper-quality
  // whenever browser STT is unreliable. A future enhancement is to re-transcribe only the
  // low-quality (noise-garbled) answers with Whisper at submit time from per-answer
  // recorded audio — selectively, so we fix noise without "fixing" genuinely wrong answers.
  const speechToText = useSpeechToText({
    onFinal: (text) => {
      // Heartbeat: real speech proves the candidate is being heard (pipeline alive).
      lastPipelineActivityRef.current = Date.now();
      const cleaned = sanitizeSttFragment(text || "");
      if (!cleaned) {
        // Whole chunk was hallucinated boilerplate — discard, don't append.
        setInterimTranscript("");
        return;
      }
      setCurrentAnswer((prev) =>
        prev ? `${prev.trim()} ${cleaned}`.trim() : cleaned
      );
      setInterimTranscript("");
    },
    onInterim: (text) => {
      lastPipelineActivityRef.current = Date.now();
      setInterimTranscript(text || "");
    },
    continuous: true,
    lang: "en-US",
    preferWhisper: true,
    paused: isSpeaking,
    // Use the exact engine the device-check mic test proved works in this browser, so the
    // interview never diverges from the test (the core "passes on testing, fails inside" fix,
    // esp. on Edge → "whisper").
    forcedEngine: forcedSttEngine,
  });
  const {
    start: startStt,
    stop: stopStt,
    transcript: recognizedText,
    isListening,
    error: sttError,
    tip: sttTip,
    needsTypingFallback,
  } = speechToText;

  const isAdminClipboardWindow =
    isCodingModalOpen && interview?.duration_minutes === 2;
  useKeyboardShortcuts({
    enabled: interviewStarted,
    suspend: isAdminClipboardWindow,
    onEscape: () => {
      showToast("ESC key is disabled during the interview", "warning");
    },
  });

  // STT errors/tips are surfaced only before the interview starts. Once the
  // user is inside the interview, transient speech-recognition warnings
  // ("needs internet", "enable Online speech recognition", etc.) are noisy
  // and distracting — Whisper continues recording independently, so we
  // suppress them. Permission-level failures still surface via setup checks.
  useEffect(() => {
    if (!interviewStarted && sttError) {
      showToast(sttError, needsTypingFallback ? "warning" : "error");
    }
  }, [sttError, needsTypingFallback, showToast, interviewStarted]);

  useEffect(() => {
    if (!interviewStarted && sttTip) showToast(sttTip, "info");
  }, [sttTip, showToast, interviewStarted]);

  // Load interview data on mount: use sessionStorage if coming from device-check, else call start API
  useEffect(() => {
    // Seed dynamic-mode state from a /start/ response. For legacy (non-dynamic) interviews
    // this is a no-op and the existing index-driven flow takes over.
    const applyDynamicSeed = (started: MockInterviewDetail) => {
      if (!started.is_dynamic) return;
      // Resume: rebuild the prior answered turns BEFORE setting the current question so the
      // "conversation so far" panel, the rewind, and the numbered "repeat question N" voice
      // lookup all line up with the real timeline after a reload/reconnect.
      if (
        Array.isArray(started.conversation_history) &&
        started.conversation_history.length > 0
      ) {
        setResponses(
          started.conversation_history.map((c) => ({
            question_id: c.question_id,
            answer: c.answer || "",
            question_text: c.question_text || "",
          })),
        );
      }
      if (started.current_question) {
        setDynamicCurrentQuestion(started.current_question);
      }
      if (typeof started.turn_number === "number") {
        setDynamicTurnNumber(started.turn_number);
      }
      if (typeof started.max_turns === "number") {
        setDynamicMaxTurns(started.max_turns);
      }
      // Seed the visible timer's bonus accumulator from the backend so a mid-interview
      // reload preserves the correct effective budget. /start/ surfaces it as
      // `bonus_seconds` on the MockInterview row.
      if (typeof started.bonus_seconds === "number") {
        setInterviewBonusSeconds(started.bonus_seconds);
      }
      // On a fresh dynamic interview, /start/ only returns the OPENING question. The opening
      // is final only if max_turns is 1 (degenerate case).
      const turnNo = started.turn_number ?? 1;
      const maxT = started.max_turns ?? 5;
      setDynamicIsFinalQuestion(turnNo >= maxT);

      // Freeze hard-recovery checkpoint: if we reloaded to recover from a freeze, restore the
      // candidate's un-submitted answer for the current question (prior turns are already
      // replayed via conversation_history above).
      try {
        const ckptKey = `mockInterviewResume_${interviewId}`;
        const raw = sessionStorage.getItem(ckptKey);
        if (raw) {
          sessionStorage.removeItem(ckptKey);
          const saved = JSON.parse(raw) as {
            interviewId?: number;
            currentAnswer?: string;
            ts?: number;
          };
          if (
            saved &&
            saved.interviewId === interviewId &&
            saved.currentAnswer &&
            typeof saved.ts === "number" &&
            Date.now() - saved.ts < 180000
          ) {
            setCurrentAnswer(saved.currentAnswer);
          }
        }
      } catch {
        // ignore malformed checkpoint
      }
    };

    const storageKey = `mockInterviewStarted_${interviewId}`;
    const cached = typeof window !== "undefined" ? sessionStorage.getItem(storageKey) : null;

    if (cached) {
      try {
        const startedInterview = JSON.parse(cached) as MockInterviewDetail;
        if (startedInterview?.id === interviewId) {
          sessionStorage.removeItem(storageKey);
          setInterview(startedInterview);
          setStartTime(new Date(startedInterview.started_at || new Date()));
          applyDynamicSeed(startedInterview);
          return;
        }
      } catch {
        sessionStorage.removeItem(storageKey);
      }
    }

    const loadInterview = async () => {
      try {
        setLoading(true);
        const startedInterview = await mockInterviewService.startInterview(
          interviewId
        );
        // Resume window lapsed (or resume disabled): the backend already auto-submitted the
        // partial answers and marked the attempt completed. Send the candidate to their
        // result instead of trying to resume an expired session.
        if (startedInterview.resume_window_expired) {
          showToast(
            "Your session expired — we submitted your answers and are preparing your result.",
            "info",
          );
          router.push(`/mock-interview/${interviewId}/result`);
          return;
        }
        setInterview(startedInterview);
        setStartTime(new Date(startedInterview.started_at || new Date()));
        applyDynamicSeed(startedInterview);
      } catch (error) {
        // The /start/ endpoint returns 400 with a clear `error` field when the interview
        // is already completed or has been cancelled. Route the candidate to the right
        // place instead of showing a generic "Failed to load" + bounce. We use Axios's
        // structured response shape; a non-Axios error or unexpected shape still falls
        // through to the generic handler at the bottom.
        const axiosErr = error as {
          response?: { status?: number; data?: { error?: string } };
        };
        const status = axiosErr?.response?.status;
        const serverMessage = (axiosErr?.response?.data?.error || "").toLowerCase();

        if (status === 400 && serverMessage.includes("completed")) {
          showToast(
            "This interview is already complete — opening your results.",
            "info"
          );
          router.push(`/mock-interview/${interviewId}/result`);
          return;
        }

        if (status === 400 && serverMessage.includes("cancelled")) {
          showToast("This interview was cancelled.", "warning");
          router.push("/mock-interview");
          return;
        }

        showToast("Failed to load interview", "error");
        router.push("/mock-interview");
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) {
      loadInterview();
    }
  }, [interviewId, router, showToast]);

  // Use existing camera stream for audio level (avoid second mic request so mic works for STT)
  useEffect(() => {
    if (!interviewStarted || !isProctoringActive) return;

    let isActive = true;
    let streamToClean: MediaStream | null = null;

    const setupAudioLevel = async () => {
      try {
        const videoEl = proctoringVideoRef.current;
        const existingStream = (videoEl?.srcObject as MediaStream) ?? null;
        const hasAudio = existingStream?.getAudioTracks().some((t) => t.readyState === "live");

        const stream = hasAudio
          ? existingStream!
          : await navigator.mediaDevices.getUserMedia({
              audio: getAudioConstraints(),
            });
        if (!hasAudio) streamToClean = stream;

        userStreamRef.current = stream;
        if (!hasAudio) registerMediaStream(stream);

        const audioContext = new AudioContext();
        // A context created off the gesture path can come up suspended; resume so the
        // analyser reports real levels (otherwise the waveform/silence-detector see silence).
        if (audioContext.state === "suspended") {
          audioContext.resume().catch(() => {});
        }
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const updateAudioLevel = () => {
          if (!isActive || !analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
          const normalizedLevel = average / 255;
          audioLevelRef.current = normalizedLevel;
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        };

        updateAudioLevel();
      } catch (error) {
        showToast("Failed to access microphone", "error");
      }
    };

    setupAudioLevel();

    return () => {
      isActive = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (streamToClean) {
        streamToClean.getTracks().forEach((t) => t.stop());
      }
      userStreamRef.current = null;
    };
  }, [interviewStarted, isProctoringActive, showToast]);

  const isDynamicInterview = !!interview?.is_dynamic;

  // Handle start interview
  const handleStartInterview = useCallback(async () => {
    if (isInitializingRef.current || !interview) return;
    isInitializingRef.current = true;
    // Start speech-to-text first (same user gesture as click — required by browser for mic),
    // and bless the TTS paths (shared <audio> element + speechSynthesis primer) SYNCHRONOUSLY —
    // iOS/Safari block both for the whole interview if the first play happens after an await.
    startStt();
    unlockInterviewerAudio();
    setShowStartButton(false);
    setInterviewStarted(true);

    try {
      // Auto-read first question — kicked off FIRST, so the interviewer's voice is not gated
      // behind camera/face-model init (startProctoring below can take 1-3s; the TTS fetch and
      // proctoring warm up concurrently now). For dynamic interviews
      // `questions_for_interview` is intentionally empty (so the candidate can't see future
      // questions); the opening question lives on `interview.current_question` and is
      // mirrored into `dynamicCurrentQuestion`.
      const hasOpeningQuestion = isDynamicInterview
        ? !!dynamicCurrentQuestion
        : !!(
            (interview.questions_for_interview || interview.questions)?.length
          );
      if (hasOpeningQuestion) {
        setIsSpeaking(true);
      }

      // Resume any suspended AudioContext on THIS user gesture. Browsers (Edge/Safari, and
      // Chrome under strict-autoplay) create AudioContexts in "suspended" state until a user
      // gesture resumes them. While suspended the analyser reports ~0 level, which the
      // silence detector reads as "not speaking" and fires the false "check your mic" nudge
      // (and makes the mic look unrecognized). The Start click is our gesture — use it.
      try {
        if (audioContextRef.current && audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume();
        }
      } catch {
        // non-fatal — the level meter recovers when the context resumes later
      }

      // Wait for video element to be rendered (use requestAnimationFrame for next render)
      await new Promise<void>((resolve) => {
        const checkVideoElement = () => {
          if (proctoringVideoRef.current) {
            resolve();
          } else {
            // Retry on next frame
            requestAnimationFrame(checkVideoElement);
          }
        };
        // Start checking after current render cycle
        requestAnimationFrame(checkVideoElement);
      });

      // Enter fullscreen first (non-blocking)
      enterFullscreen().catch(() => {
        showToast("Failed to enter fullscreen mode", "warning");
      });

      // Start proctoring. Reset the warmup window so the camera re-attach doesn't surface a
      // stale "no face" toast (see onViolation suppression). Runs while the avatar is
      // already speaking the opening question.
      proctoringStartedAtRef.current = Date.now();
      await startProctoring().catch((error) => {
        showToast(
          "Camera initialization failed. Please ensure camera permissions are granted.",
          "error"
        );
      });
    } catch (error: any) {
      showToast(error.message || "Failed to start interview", "error");
      setIsSpeaking(false);
      setShowStartButton(true);
      setInterviewStarted(false);
      isInitializingRef.current = false;
    }
  }, [
    interview,
    isDynamicInterview,
    dynamicCurrentQuestion,
    startProctoring,
    enterFullscreen,
    showToast,
    startStt,
  ]);

  // Speech recognition is always active - no toggle needed

  // Get current question. Dynamic interviews drive from a single in-memory question that the
  // backend hands us turn-by-turn via /next-question/ — the candidate never sees future ones.
  // Legacy interviews continue to index into the pre-generated questions array.
  const currentQuestion = useMemo<InterviewQuestion | null>(() => {
    if (isDynamicInterview) {
      return dynamicCurrentQuestion;
    }
    const questions =
      interview?.questions_for_interview || interview?.questions;
    if (!questions) return null;
    return questions[currentQuestionIndex] || null;
  }, [
    isDynamicInterview,
    dynamicCurrentQuestion,
    interview,
    currentQuestionIndex,
  ]);

  // Get question text (support both question and question_text)
  const getQuestionText = useCallback((question: InterviewQuestion | null) => {
    if (!question) return "";
    return question.question_text || question.question || "";
  }, []);

  useEffect(() => {
    if (!currentQuestion) return;
    if (lastStructuredQuestionIdRef.current === currentQuestion.id) return;
    const qtype = (currentQuestion.type || "").toLowerCase();
    if (qtype === "coding" && currentQuestion.coding_problem) {
      setIsCodingModalOpen(true);
      setIsMCQModalOpen(false);
      codingModalOpenedAtRef.current = Date.now();
      lastStructuredQuestionIdRef.current = currentQuestion.id;
    } else if (qtype === "mcq" && (currentQuestion.mcq_options?.length ?? 0) >= 2) {
      setIsMCQModalOpen(true);
      setIsCodingModalOpen(false);
      lastStructuredQuestionIdRef.current = currentQuestion.id;
    } else {
      setIsCodingModalOpen(false);
      setIsMCQModalOpen(false);
    }
  }, [currentQuestion]);


  // Build the "conversation so far" list shown in place of the live transcript textarea.
  // Pulls from the candidate's already-answered turns (each `responses` entry has the
  // question_text we stamped on it) and appends the current question if it hasn't been
  // recorded yet. Closing-remark turns are excluded — those aren't questions, they're the
  // interviewer's wrap-up speech.
  const questionHistory = useMemo(() => {
    const seen = new Set<number>();
    const out: Array<{ id: number; question_text: string }> = [];
    for (const r of responses) {
      if (typeof r.question_id !== "number" || seen.has(r.question_id)) continue;
      seen.add(r.question_id);
      out.push({
        id: r.question_id,
        question_text: r.question_text || "",
      });
    }
    if (currentQuestion && !seen.has(currentQuestion.id) && !isClosingRemark) {
      out.push({
        id: currentQuestion.id,
        question_text: getQuestionText(currentQuestion),
      });
    }
    return out;
  }, [responses, currentQuestion, isClosingRemark, getQuestionText]);

  // Watchdog #1: isSpeaking can get stuck true if the browser TTS engine fails silently
  // (no onend event from speechSynthesis). The avatar visually stops talking but the
  // React flag stays true, which permanently suspends the silence detector and STT
  // routing — the candidate sees "Listening" forever with nothing happening. Hard cap
  // any single speech utterance at 35s.
  useEffect(() => {
    if (!isSpeaking) return;
    const timeout = window.setTimeout(() => {
      setIsSpeaking(false);
      if (nudgeText !== null) {
        setNudgeText(null);
        nudgeSpeakCompleteAtRef.current = Date.now();
        if (advanceAfterNudgeRef.current) {
          advanceAfterNudgeRef.current = false;
          const fn = handleNextQuestionRef.current;
          if (fn) void fn();
        }
      }
    }, 35000);
    return () => window.clearTimeout(timeout);
  }, [isSpeaking, nudgeText]);

  // Watchdog #2: isFetchingNext is set true during /next-question/ and reset in the
  // finally block. If the request hangs (network stall, backend deadlock) longer than
  // any realistic LLM round-trip, force-reset it so the silence detector can resume.
  useEffect(() => {
    if (!isFetchingNext) return;
    const timeout = window.setTimeout(() => {
      setIsFetchingNext(false);
    }, 35000);
    return () => window.clearTimeout(timeout);
  }, [isFetchingNext]);

  // Stamp when the avatar starts speaking and when a next-question fetch starts — the freeze
  // watchdog uses these to detect the two "stuck" sub-cases (avatar stuck with no audio,
  // hung fetch) without mistaking a legitimately-long question/fetch for a freeze. While
  // either is genuinely active we also keep the pipeline heartbeat warm.
  useEffect(() => {
    // Bump the heartbeat on BOTH transitions so the brief gap between speech ending and the
    // silence loop re-arming is never misread as a stall.
    lastPipelineActivityRef.current = Date.now();
    if (isSpeaking) speakingStartedAtRef.current = Date.now();
  }, [isSpeaking]);
  useEffect(() => {
    lastPipelineActivityRef.current = Date.now();
    if (isFetchingNext) fetchStartedAtRef.current = Date.now();
  }, [isFetchingNext]);

  const handleSpeakComplete = useCallback(() => {
    setIsSpeaking(false);
    if (nudgeText !== null) {
      setNudgeText(null);
      nudgeSpeakCompleteAtRef.current = Date.now();
      if (advanceAfterNudgeRef.current) {
        advanceAfterNudgeRef.current = false;
        const fn = handleNextQuestionRef.current;
        if (fn) void fn();
      }
    }
  }, [nudgeText]);

  // Stable callback for AIAvatar's "voice is actually playing" signal. Updates the ref and
  // keeps the freeze-watchdog heartbeat warm while real audio is playing, so a long question
  // (or slow cloud-TTS startup) is never mistaken for a stall.
  const handleAudioActiveChange = useCallback(
    (active: boolean) => {
      audioActiveRef.current = active;
      if (active) {
        lastPipelineActivityRef.current = Date.now();
        // Real audio played → the pipeline is healthy. Reset the hard-reload budget so a much
        // later, unrelated freeze still gets a fresh recovery allowance.
        try {
          sessionStorage.removeItem(`mockInterviewHardReloads_${interviewId}`);
        } catch {}
      }
    },
    [interviewId],
  );

  // Handle answer change (clear interim when user types)
  const handleAnswerChange = useCallback((answer: string) => {
    setCurrentAnswer(answer);
    setInterimTranscript("");
  }, []);

  // Handle save answer
  const handleSaveAnswer = useCallback(() => {
    if (!currentQuestion) return;

    setResponses((prevResponses) => {
      const existingIndex = prevResponses.findIndex(
        (r) => r.question_id === currentQuestion.id
      );

      const newResponse: InterviewResponse = {
        question_id: currentQuestion.id,
        answer: currentAnswer,
        // Stamp the question text so the question-history panel can render the full
        // conversation without a separate id→text lookup.
        question_text:
          currentQuestion.question_text || currentQuestion.question || "",
      };

      if (existingIndex >= 0) {
        const updated = [...prevResponses];
        updated[existingIndex] = newResponse;
        return updated;
      } else {
        return [...prevResponses, newResponse];
      }
    });
  }, [currentQuestion, currentAnswer]);

  // Refs for silence-based auto-advance state. These are NOT React state because we don't
  // want the JSX to re-render on every audio tick.
  const silenceAdvanceTimerRef = useRef<number | null>(null);
  const handleNextQuestionRef = useRef<
    | ((
        overrideAnswerText?: unknown,
        options?: { forceClose?: boolean; codingSecondsSpent?: number },
      ) => Promise<void>)
    | null
  >(null);
  // Snapshot of the answer text at the moment we fire /next-question/. Used to detect words
  // the candidate spoke DURING the fetch so we can append them to the previous answer
  // instead of discarding them when we reset currentAnswer for the new question.
  const answerAtAdvanceRef = useRef<string>("");
  const previousQuestionIdAtAdvanceRef = useRef<number | null>(null);
  const [conversationStatus, setConversationStatus] = useState<string>("");
  const [focusedHistoryQuestionId, setFocusedHistoryQuestionId] = useState<number | null>(null);
  useEffect(() => {
    if (focusedHistoryQuestionId === null) return;
    // Auto-clear the focus highlight after a few seconds — the candidate should see
    // which past question the AI re-spoke, but the marker shouldn't stick around.
    const timeout = window.setTimeout(() => {
      setFocusedHistoryQuestionId(null);
    }, 6000);
    return () => window.clearTimeout(timeout);
  }, [focusedHistoryQuestionId]);
  // 0-1 value the answer-input area renders as the "Interviewer is waiting" bar.
  // Updated by the silence detector on every poll — climbs from 0 → 1 over the
  // SILENCE_THRESHOLD_MS window of quiet, drops back to 0 when the candidate speaks
  // again. Gives the candidate a visible thinking budget instead of an invisible
  // countdown.
  const pauseProgressRef = useRef<number>(0);
  const setPauseProgress = useCallback((value: number) => {
    pauseProgressRef.current = value;
  }, []);

  // Live mirror of currentAnswer into a ref. handleNextQuestion is an async function and the
  // value of `currentAnswer` it closed over is stale by the time the /next-question/ POST
  // resolves — we need to read whatever the candidate has TYPED OR SPOKEN since the advance
  // fired, so we can preserve their continuation instead of discarding it.
  const currentAnswerRef = useRef<string>("");
  useEffect(() => {
    currentAnswerRef.current = currentAnswer;
  }, [currentAnswer]);

  // Live mirror of currentQuestion for the freeze watchdog's soft-recovery (so it can re-ask
  // the current question without re-running on every question change).
  const currentQuestionRef = useRef<InterviewQuestion | null>(null);
  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);

  // Auto-save answer when it changes (debounced)
  useEffect(() => {
    if (!currentQuestion || !currentAnswer.trim()) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer to auto-save after 2 seconds of no changes
    autoSaveTimerRef.current = setTimeout(() => {
      handleSaveAnswer();
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [currentAnswer, currentQuestion, handleSaveAnswer]);

  const submitInFlightRef = useRef(false);
  const handleSubmitInterview = useCallback(async () => {
    if (!interview || !startTime) return;
    if (submitInFlightRef.current) return;
    submitInFlightRef.current = true;

    try {
      let finalResponses = [...responses];
      if (currentAnswer && currentQuestion) {
        const existingIndex = finalResponses.findIndex(
          (r) => r.question_id === currentQuestion.id
        );
        const newResponse: InterviewResponse = {
          question_id: currentQuestion.id,
          answer: currentAnswer,
          question_text:
            currentQuestion.question_text || currentQuestion.question || "",
        };
        if (existingIndex >= 0) {
          finalResponses[existingIndex] = newResponse;
        } else {
          finalResponses.push(newResponse);
        }
      }

      // Calculate duration
      const endTime = new Date();
      const totalDurationSeconds = Math.floor(
        (endTime.getTime() - startTime.getTime()) / 1000
      );

      // "Face validation failures" is the aggregate of every face-detection-related
      // violation surfaced by the proctoring service — NO_FACE (face out of frame),
      // POOR_LIGHTING (model can't see), MULTIPLE_FACES (someone else in frame),
      // FACE_TOO_CLOSE / FACE_TOO_FAR (improper distance). Looking-away is tracked
      // separately because it's an attention metric, not a face-presence one.
      const faceValidationFailures = violations.filter(
        (v) =>
          v.type === "NO_FACE" ||
          v.type === "POOR_LIGHTING" ||
          v.type === "MULTIPLE_FACES" ||
          v.type === "FACE_TOO_CLOSE" ||
          v.type === "FACE_TOO_FAR"
      ).length;
      const multipleFaceDetections = violations.filter(
        (v) => v.type === "MULTIPLE_FACES"
      ).length;
      const lookingAwayCount = violations.filter(
        (v) => v.type === "LOOKING_AWAY"
      ).length;
      const eyeMovementCount = violations.filter(
        (v) => v.type === "EYE_MOVEMENT"
      ).length;
      const faceTooCloseCount = violations.filter(
        (v) => v.type === "FACE_TOO_CLOSE"
      ).length;
      const faceTooFarCount = violations.filter(
        (v) => v.type === "FACE_TOO_FAR"
      ).length;
      const fullscreenExits = fullscreenViolations.length;

      // Get questions count
      const questions =
        interview.questions_for_interview || interview.questions;
      const totalQuestions = questions?.length || 0;

      const requestBody = {
        transcript: {
          responses: finalResponses,
          total_duration_seconds: totalDurationSeconds,
          logs: [],
          metadata: {
            face_validation_failures: faceValidationFailures,
            multiple_face_detections: multipleFaceDetections,
            looking_away_count: lookingAwayCount,
            eye_movement_count: eyeMovementCount,
            face_too_close_count: faceTooCloseCount,
            face_too_far_count: faceTooFarCount,
            fullscreen_exits: fullscreenExits,
            tabSwitches: tabSwitchCountRef.current,
            windowSwitches: windowSwitchCountRef.current,
            completed_questions: finalResponses.length,
            total_questions: totalQuestions,
          },
        },
      };

      await mockInterviewService.submitInterview(interviewId, requestBody);

      // Exit fullscreen first
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      } catch (error) {
        // Silently fail if fullscreen exit fails
      }

      stopProctoring();
      stopStt();

      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (noiseSuppressionTeardownRef.current) {
        noiseSuppressionTeardownRef.current();
        noiseSuppressionTeardownRef.current = null;
      }
      if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach((track) => track.stop());
        userStreamRef.current = null;
      }

      stopAllMediaTracks();

      await new Promise((resolve) => setTimeout(resolve, 50));
      stopAllMediaTracks();

      // Backend now returns 202 immediately and runs LLM evaluation in a background
      // thread, so this navigation is instant. The submission-success page shows a quick
      // confirmation, then the candidate clicks through to /result/ which polls for the
      // evaluation to finish (typically 5–15s).
      showToast(
        "Interview submitted. Your evaluation is being prepared.",
        "success"
      );
      router.push(`/mock-interview/${interviewId}/submission-success`);
    } catch (error) {
      const statusCode =
        (error as { response?: { status?: number } })?.response?.status;
      if (statusCode === 400) {
        router.push(`/mock-interview/${interviewId}/submission-success`);
        return;
      }
      showToast("Failed to submit interview", "error");
      submitInFlightRef.current = false;
      setIsEndingInterview(false);
    }
  }, [
    interview,
    interviewId,
    responses,
    currentAnswer,
    currentQuestion,
    startTime,
    violations,
    fullscreenViolations,
    stopProctoring,
    stopStt,
    router,
    showToast,
  ]);

  const closingAutoSubmitFiredRef = useRef(false);
  useEffect(() => {
    if (!isClosingRemark) return;
    if (isSpeaking) return;
    if (closingAutoSubmitFiredRef.current) return;
    if (submitInFlightRef.current) return;
    closingAutoSubmitFiredRef.current = true;
    handleSubmitInterview();
  }, [isClosingRemark, isSpeaking, handleSubmitInterview]);

  const handleNextQuestion = useCallback(async (
    overrideAnswerText?: unknown,
    options?: { forceClose?: boolean; codingSecondsSpent?: number },
  ) => {
    const overrideString =
      typeof overrideAnswerText === "string" ? overrideAnswerText : undefined;
    const forceClose = !!options?.forceClose;
    const codingSecondsSpent = options?.codingSecondsSpent;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    if (isDynamicInterview) {
      if (!currentQuestion) return;
      if (isFetchingNext) return; // guard against double-tap

      const liveAnswer = `${currentAnswerRef.current || ""} ${interimTranscript || ""}`
        .replace(/\s+/g, " ")
        .trim();
      let answerForThisTurn = (overrideString ?? liveAnswer).trim();

      if (
        rewindActiveRef.current &&
        rewindOriginalAnswerRef.current &&
        overrideString === undefined
      ) {
        const original = rewindOriginalAnswerRef.current.trim();
        answerForThisTurn = answerForThisTurn
          ? `${original} ${answerForThisTurn}`.trim()
          : original;
        rewindActiveRef.current = false;
        rewindOriginalAnswerRef.current = "";
      }
      const questionTextForThisTurn =
        currentQuestion.question_text || currentQuestion.question || "";

      setResponses((prev) => {
        const existingIndex = prev.findIndex(
          (r) => r.question_id === currentQuestion.id
        );
        const entry: InterviewResponse = {
          question_id: currentQuestion.id,
          answer: answerForThisTurn,
          question_text: questionTextForThisTurn,
        };
        if (existingIndex >= 0) {
          const copy = [...prev];
          copy[existingIndex] = entry;
          return copy;
        }
        return [...prev, entry];
      });

      // End-interview verbal command. If the candidate's "answer" is actually a request to
      // stop the interview, submit instead of asking another question. This mirrors how
      // ChatGPT voice mode lets you say "okay we can stop" and the conversation ends. We
      // match common phrasings against the trimmed answer (case-insensitive). The regex is
      // anchored to whole-phrase matches so a CANDIDATE who just SAYS "stop" mid-sentence
      // ("hash and stop using…") doesn't trigger; only if the *answer overall* is an
      // explicit end-request.
      const lowerAnswer = answerForThisTurn.toLowerCase();
      // Every pattern now REQUIRES an explicit "interview"/"session" noun (or an
      // unmistakable sign-off), so a real answer that merely contains "stop", "finish", or
      // "no more questions" as content can no longer trigger a submit. The "End Interview"
      // button is always available as the deliberate fallback.
      const endPhrases = [
        /\b(end|stop|finish|exit|quit)\s+(the\s+|this\s+|my\s+)?(interview|session)\b/,
        /\b(let'?s|can\s+we|could\s+we|please)\s+(end|stop|finish|wrap\s*up)\s+(the\s+|this\s+|my\s+)?(interview|session)\b/,
        /\bi\s+(want|'?d\s+like|wanna)\s+to\s+(end|stop|finish|quit)\s+(the\s+|this\s+|my\s+)?(interview|session)\b/,
        /\bi'?m\s+done\s+with\s+(the\s+|this\s+|my\s+)?(interview|session)\b/,
        /\bthat'?s\s+(all|enough)\s+(for\s+(me|today|now)|from\s+me)\b/,
      ];
      const isEndRequest =
        // Only a SHORT utterance that is essentially just the end-request counts. A longer
        // answer that happens to reference ending is treated as content, not a command.
        lowerAnswer.length > 0 &&
        lowerAnswer.length < 60 &&
        endPhrases.some((rx) => rx.test(lowerAnswer));
      if (isEndRequest) {
        showToast("Okay — wrapping up the interview now.", "info");
        handleSubmitInterview();
        return;
      }

      // "Repeat that question" / "say it again" / "repeat question 3" — re-speak a question
      // without advancing or writing a response. Two flavors:
      //   (a) Plain repeat → re-speaks the CURRENT question.
      //   (b) Numbered repeat ("repeat question 3", "say question 2 again") → looks up
      //       question N from the conversation history, re-speaks its text via the
      //       nudge mechanism, and bumps focusedQuestionId so the conversation-so-far
      //       panel auto-scrolls the candidate to that question's row.
      const numberWords: Record<string, number> = {
        one: 1, two: 2, three: 3, four: 4, five: 5,
        six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
        first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
        sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
      };
      const numberedRepeatMatch =
        lowerAnswer.match(
          /\b(repeat|say|read|ask|go\s+back\s+to)\s+(the\s+|question\s+)?(?:question\s+)?(?:number\s+)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\b/,
        ) ||
        lowerAnswer.match(
          /\bquestion\s+(?:number\s+)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\b(?:.*\b(again|repeat|once\s+more))?/,
        );
      let numberedTargetIndex: number | null = null;
      if (numberedRepeatMatch) {
        const raw =
          numberedRepeatMatch[3] ?? numberedRepeatMatch[1] ?? "";
        const parsed = Number.parseInt(raw, 10);
        if (Number.isFinite(parsed)) {
          numberedTargetIndex = parsed;
        } else if (numberWords[raw]) {
          numberedTargetIndex = numberWords[raw];
        }
      }

      const plainRepeatPhrases = [
        /\b(can|could|would)\s+you\s+(please\s+)?(repeat|say)\s+(it|that|the\s+question)\s*(again|once\s+more)?\b/,
        /\brepeat\s+(this\s+|the\s+)?(question|one)\s*(again)?\b/,
        /\bsay\s+(it|that)\s+(again|once\s+more)\b/,
        /\b(ask|say)\s+(it|the\s+question)\s+again\b/,
        /\bone\s+more\s+time\b/,
        /\bi\s+didn'?t\s+(catch|hear|understand)\s+(that|the\s+question)\b/,
        /\bwhat\s+was\s+(the\s+|that\s+)?question\b/,
        /\bcould\s+you\s+repeat\b/,
      ];
      const isPlainRepeat =
        !numberedTargetIndex &&
        lowerAnswer.length > 0 &&
        lowerAnswer.length < 120 &&
        plainRepeatPhrases.some((rx) => rx.test(lowerAnswer));

      const isNumberedRepeat =
        numberedTargetIndex !== null &&
        numberedTargetIndex >= 1 &&
        numberedTargetIndex <= responses.length + 1;

      if ((isPlainRepeat || isNumberedRepeat) && currentQuestion && !isClosingRemark) {
        setResponses((prev) =>
          prev.filter((r) => r.question_id !== currentQuestion.id),
        );
        setCurrentAnswer("");
        setInterimTranscript("");
        nudgeSilenceCountRef.current = 0;
        // Block probes for the rest of this turn so the candidate hears the repeat and
        // gets to answer in peace. Without this, the candidate's first acknowledgment
        // word ("okay", "hmm") gets caught by STT, the silence detector fires, and the
        // probe ("Want to go a level deeper?") fires on a single syllable. Probes
        // belong AFTER a real short/unclear answer, not after a repeat request.
        nudgeProbeUsedThisTurnRef.current = true;
        nudgeSpeakCompleteAtRef.current = 0;
        advanceAfterNudgeRef.current = false;

        if (isNumberedRepeat && numberedTargetIndex !== null) {
          // Find the question by 1-indexed position in the conversation timeline.
          // questionHistory is built from responses (in order) + currentQuestion at the
          // tail; both share the same numbering the candidate would say aloud.
          const target = questionHistory[numberedTargetIndex - 1];
          if (target) {
            setFocusedHistoryQuestionId(target.id);
            setConversationStatus(
              `Repeating question ${numberedTargetIndex}…`,
            );
            const ack =
              numberedTargetIndex === questionHistory.length
                ? "Sure, here it is again. "
                : `Sure, repeating question ${numberedTargetIndex}. `;
            triggerNudge(`${ack}${target.question_text}`);
            return;
          }
          // Fallback: number out of range, treat as plain repeat.
        }

        setConversationStatus("Repeating the question…");
        // Plain repeat — re-speak the current question with a short acknowledgment.
        // We use the nudge mechanism (same TTS pipeline) and override questionText for
        // the duration of the speech, so the candidate hears "Sure, here it is again:"
        // before the question without changing currentQuestion's stored text.
        const currentText =
          currentQuestion.question_text || currentQuestion.question || "";
        triggerNudge(`Sure, here it is again. ${currentText}`);
        return;
      }

      const rewindPhrases = [
        /\bgo\s+back\s+to\s+(the\s+)?(previous|last|prior)\s+(question|one)\b/,
        /\b(answer|finish|complete)\s+(the\s+)?(previous|last|prior)\s+(question|one)\b/,
        /\bi\s+wasn'?t\s+(done|finished)\b/,
        /\b(let'?s|can\s+we|could\s+we)\s+go\s+back\b/,
        /\b(re-?do|redo)\s+(the\s+)?(previous|last|prior)\s+(question|one)\b/,
        /\bi\s+want(ed)?\s+to\s+(add|say|answer|finish)\s+(more\s+)?(to\s+)?(the\s+|my\s+)?(previous|last|prior)\b/,
        /\bback\s+to\s+(the\s+)?(previous|last)\b/,
        /\bi\s+meant\s+to\s+(say|add)\s+more\b/,
      ];
      const isRewindRequest =
        !rewindActiveRef.current &&
        lowerAnswer.length > 0 &&
        lowerAnswer.length < 200 &&
        rewindPhrases.some((rx) => rx.test(lowerAnswer));

      if (isRewindRequest) {
        if (isFetchingNext) return;
        const previousResponseEntry = responses.find(
          (r) => r.question_id !== currentQuestion.id,
        );
        if (!previousResponseEntry) {
          showToast(
            "There's no prior question to go back to yet — please continue with this one.",
            "info",
          );
          return;
        }
        try {
          setIsFetchingNext(true);
          setConversationStatus("Going back to your previous question…");
          const rewound = await mockInterviewService.rewindToPreviousQuestion(
            interviewId,
          );
          setResponses((prev) =>
            prev.filter((r) => r.question_id !== currentQuestion.id),
          );
          const rewoundQuestion: InterviewQuestion = {
            ...rewound.question,
            question_text: `Sure, going back to your previous question. ${
              rewound.question.question_text || rewound.question.question || ""
            }`,
          };
          setDynamicCurrentQuestion(rewoundQuestion);
          setDynamicTurnNumber(rewound.turn_number);
          setDynamicMaxTurns(rewound.max_turns);
          setDynamicIsFinalQuestion(false);
          setCurrentAnswer("");
          setInterimTranscript("");
          rewindOriginalAnswerRef.current = rewound.previous_answer || "";
          rewindActiveRef.current = true;
          nudgeSilenceCountRef.current = 0;
          nudgeProbeUsedThisTurnRef.current = false;
          nudgeSpeakCompleteAtRef.current = 0;
          advanceAfterNudgeRef.current = false;
          setIsSpeaking(true);
        } catch (err) {
          showToast(
            "Couldn't go back to the previous question. Please continue with this one.",
            "error",
          );
        } finally {
          setIsFetchingNext(false);
        }
        return;
      }

      if (isClosingRemark) {
        handleSubmitInterview();
        return;
      }

      // Snapshot what we're advancing FROM so we can preserve any continuation spoken
      // during the next-question fetch (see below).
      answerAtAdvanceRef.current = answerForThisTurn;
      previousQuestionIdAtAdvanceRef.current = currentQuestion.id;

      // Otherwise ask the backend for the next conversational follow-up. The backend uses the
      // candidate's answer + the interview plan to generate a real follow-up.
      //
      // Perceived-latency trick: flip conversationStatus to "Got it — following up…" and
      // clear the interim transcript IMMEDIATELY, before awaiting the API. The OpenAI call
      // typically takes 1-3 seconds; without this the candidate sees no visible reaction
      // between clicking the Follow-up button and the new question arriving, which feels
      // laggy even though the system is working. With it, the UI confirms the click on the
      // same paint as the click itself.
      setConversationStatus("Got it — following up…");
      setInterimTranscript("");
      setIsFetchingNext(true);
      try {
        const next: NextQuestionResponse =
          await mockInterviewService.getNextQuestion(interviewId, {
            previous_question_id: currentQuestion.id,
            candidate_answer: answerForThisTurn,
            force_close: forceClose,
            ...(typeof codingSecondsSpent === "number"
              ? { coding_seconds_spent: codingSecondsSpent }
              : {}),
          });

        // Closing-remark path: backend says we're at the wrap-up, hands us a natural
        // verbal close instead of another question. We surface it to the candidate by
        // treating it as a "question" the avatar speaks, but mark a separate
        // `isClosingRemark` flag (which is what now drives the "Submit Interview" button
        // label via `isLastQuestion`) so:
        //   - silence-detection auto-advance is suppressed (no answer expected)
        //   - the action button reads "Submit Interview"
        //   - the closing-remark grace timer starts once the avatar finishes speaking
        //   - the candidate hears the close, then taps Submit when ready
        if (next.is_closing_remark && next.closing_remark) {
          const closingTurn: InterviewQuestion = {
            id: (currentQuestion.id ?? 0) + 1,
            question_text: next.closing_remark,
            type: "behavioral",
          };
          setDynamicCurrentQuestion(closingTurn);
          setDynamicIsFinalQuestion(true);
          setIsClosingRemark(true);
          setCurrentAnswer("");
          setInterimTranscript("");
          setIsSpeaking(true); // avatar reads the close out loud
          setConversationStatus(
            "Interview complete — submitting your responses automatically."
          );
          return;
        }

        // Safety: backend signaled the interview is done WITHOUT a closing remark — fall
        // back to immediate submit (legacy path; should be rare now that the backend
        // always tries to generate a remark first).
        if (next.interview_complete || !next.question) {
          handleSubmitInterview();
          return;
        }

        // ===== Preserve user's continuation =====
        // /next-question/ takes ~1-3s. If the candidate keeps speaking during that window
        // (they thought of more to say), STT appends to currentAnswer. Without this block,
        // we'd setCurrentAnswer("") below and silently discard those words — the next
        // question would land while the candidate is still finishing the previous answer.
        // Instead, we append the delta to the PREVIOUS question's response so the full
        // answer is preserved both for the final transcript and (next time around) for the
        // AI's follow-up context.
        const answerNow = currentAnswerRef.current.trim();
        const previousAnswered = answerAtAdvanceRef.current;
        const previousQid = previousQuestionIdAtAdvanceRef.current;
        if (
          previousQid !== null &&
          answerNow.length > previousAnswered.length &&
          answerNow.startsWith(previousAnswered)
        ) {
          const continuation = answerNow.slice(previousAnswered.length).trim();
          if (continuation) {
            setResponses((prev) =>
              prev.map((r) =>
                r.question_id === previousQid
                  ? {
                      ...r,
                      answer: `${r.answer} ${continuation}`.trim(),
                    }
                  : r
              )
            );
          }
        }

        setDynamicCurrentQuestion(next.question);
        setDynamicTurnNumber(next.turn_number);
        setDynamicMaxTurns(next.max_turns);
        setDynamicIsFinalQuestion(!!next.is_final_question);
        nudgeSilenceCountRef.current = 0;
        nudgeProbeUsedThisTurnRef.current = false;
        nudgeSpeakCompleteAtRef.current = 0;
        advanceAfterNudgeRef.current = false;
        rewindActiveRef.current = false;
        rewindOriginalAnswerRef.current = "";
        // Capture per-coding-turn budget (5/7/10 min based on interview difficulty). The
        // backend always sends 0 for non-coding turns, so this resets cleanly when the
        // candidate finishes a coding modal and the AI moves on. The CodingQuestionModal
        // reads this via its `budgetSeconds` prop to render its own countdown.
        setCodingTimeBudgetSeconds(
          typeof next.coding_time_budget_seconds === "number"
            ? next.coding_time_budget_seconds
            : 0,
        );
        // NOTE: we intentionally do NOT fold the backend's running bonus_seconds into the
        // visible timer mid-session. The main timer is PAUSED during the coding modal, which
        // already gives the coding time back for free — adding the bonus on top is exactly the
        // double-count that let an early coding submit inflate the remaining time. The bonus
        // baseline is seeded once from /start/ (for resume, where the pause history is lost),
        // and the backend still records the actual coding seconds for that resume baseline.
        setCurrentAnswer("");
        setInterimTranscript("");
        setIsSpeaking(true);
        answerAtAdvanceRef.current = "";
        previousQuestionIdAtAdvanceRef.current = null;
        void questionTextForThisTurn;
      } catch (error) {
        showToast("Couldn't load the next question — please try again.", "error");
      } finally {
        setIsFetchingNext(false);
      }
      return;
    }

    // ===== Legacy (pre-generated 5-questions) flow =====
    const questions =
      interview?.questions_for_interview || interview?.questions;
    if (!questions) return;

    // Save current answer before moving
    if (currentQuestion) {
      handleSaveAnswer();
    }

    // If last question, submit interview
    if (currentQuestionIndex >= questions.length - 1) {
      handleSubmitInterview();
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer(
        responses.find(
          (r) => r.question_id === questions[currentQuestionIndex + 1].id
        )?.answer || ""
      );
      setIsSpeaking(true); // Auto-read next question
    }
  }, [
    isDynamicInterview,
    isFetchingNext,
    dynamicIsFinalQuestion,
    interview,
    currentQuestionIndex,
    currentQuestion,
    currentAnswer,
    responses,
    interviewId,
    handleSaveAnswer,
    handleSubmitInterview,
    showToast,
  ]);

  // Keep a ref to handleNextQuestion so the silence-detection effect can call the *current*
  // version without itself needing to re-run on every render (which would clobber the timer).
  useEffect(() => {
    handleNextQuestionRef.current = handleNextQuestion;
  }, [handleNextQuestion]);

  const handleCodingModalSubmit = useCallback(
    (payload: { code: string; language: string }) => {
      const formatted = `[Coding answer · ${payload.language}]\n${payload.code}`;
      // Actual time spent in the editor — the backend credits this (capped) so an early
      // submit credits less and never inflates the remaining interview time.
      const codingSecondsSpent = codingModalOpenedAtRef.current
        ? Math.max(0, Math.round((Date.now() - codingModalOpenedAtRef.current) / 1000))
        : 0;
      codingModalOpenedAtRef.current = 0;
      setIsCodingModalOpen(false);
      setCurrentAnswer(formatted);
      void handleNextQuestion(formatted, { codingSecondsSpent });
    },
    [handleNextQuestion],
  );

  const handleMCQModalSubmit = useCallback(
    (payload: { ids: string[]; labels: string[] }) => {
      const selectionText = payload.labels.length
        ? payload.labels.join(", ")
        : "(no option selected)";
      const idsText = payload.ids.length ? payload.ids.join(", ") : "—";
      const formatted = `[MCQ answer] Selected: ${selectionText} (ids: ${idsText})`;
      setIsMCQModalOpen(false);
      setCurrentAnswer(formatted);
      void handleNextQuestion(formatted);
    },
    [handleNextQuestion],
  );

  // Bump the "last transcript change" timestamp whenever the candidate types or speaks.
  useEffect(() => {
    if (!isDynamicInterview) return;
    if (!currentAnswer && !interimTranscript) return;
    lastTranscriptChangeAtRef.current = Date.now();
  }, [isDynamicInterview, currentAnswer, interimTranscript]);

  const SILENCE_MIC_CHECK_NUDGE =
    "Please respond. You're either not speaking, or there might be a microphone issue — please check your mic.";
  const SILENCE_GIVEUP_NUDGE =
    "Alright, let's move on to the next question.";
  const PROBE_NUDGES = useMemo(
    () => [
      "Would you like to add anything to that, or shall we move on?",
      "Want to go a level deeper there before we continue?",
      "Is there more you'd want to mention on that one?",
      "Anything else you'd add — an example, a trade-off, something you've run into?",
    ],
    [],
  );

  const isAnswerUnclearOrShort = useCallback((text: string): boolean => {
    const t = text.trim();
    if (t.length < 60) return true;
    const lastChar = t.slice(-1);
    if (lastChar === "." || lastChar === "?" || lastChar === "!") {
      return t.length < 90;
    }
    const tail = t.toLowerCase().replace(/[,;:\s]+$/, "");
    const fillers = ["um", "uh", "so", "and", "but", "or", "you know", "i mean", "well"];
    for (const f of fillers) {
      if (tail.endsWith(" " + f) || tail === f) return true;
    }
    return false;
  }, []);

  const triggerNudge = useCallback((text: string) => {
    setNudgeText(text);
    setIsSpeaking(true);
    setConversationStatus("Interviewer is checking in…");
    setPauseProgress(0);
  }, []);

  // Silence-based auto-advance, ChatGPT-voice-mode style. While the candidate is answering
  // we poll: if there's been no transcript change for SILENCE_THRESHOLD_MS and the avatar
  // isn't currently speaking the question, treat that as "candidate is done" and advance.
  // The threshold is generous (3.5s) so a thinking pause doesn't trip auto-advance — if the
  // candidate resumes speaking, the change-bump above resets the clock.
  useEffect(() => {
    if (!isDynamicInterview) return;
    if (!interviewStarted) return;
    if (!currentQuestion) return;
    // Don't auto-advance while the avatar is speaking the question, while we're waiting on
    // the next question API call, or while a manual submit is already in flight.
    if (isSpeaking || isFetchingNext || isEndingInterview) return;
    // Closing-remark mode: backend already told us the interview is over and the avatar is
    // delivering a wrap-up. We're not waiting for another answer, so auto-advance is moot —
    // the candidate just hits Submit when ready.
    if (isClosingRemark) return;
    // Structured-question mode (coding / mcq popup is open). The answer comes from the
    // modal's Submit button, not from STT — so silence here is meaningless and we mustn't
    // auto-advance with an empty STT buffer.
    if (isCodingModalOpen || isMCQModalOpen) return;

    if (!currentAnswerRef.current.trim()) {
      lastTranscriptChangeAtRef.current = Date.now();
    } else if (lastTranscriptChangeAtRef.current === 0) {
      lastTranscriptChangeAtRef.current = Date.now();
    }

    const SILENCE_THRESHOLD_DEFAULT_MS = 5000;
    const SILENCE_THRESHOLD_SENTENCE_END_MS = 3500;
    const SILENCE_THRESHOLD_FILLER_MS = 6500;
    const SILENCE_THRESHOLD_INTRO_MS = 6500;
    const INTRO_MIN_LENGTH = 80;
    const POLL_INTERVAL_MS = 100;
    const TOTAL_SILENCE_HARD_CAP_MS = 25000;
    const AUDIO_BURST_GRACE_MS = 1200;
    const FILLER_ENDINGS = [
      "um", "uh", "uhh", "umm", "hmm", "er", "erm",
      "so", "like", "and", "but", "or", "because", "well",
      "you know", "i mean", "kind of", "sort of", "right",
    ];
    const turnNumberForThreshold = dynamicTurnNumber;
    const pickSilenceThreshold = (rawText: string): number => {
      const t = rawText.trim();
      if (!t) return SILENCE_THRESHOLD_DEFAULT_MS;
      if (turnNumberForThreshold <= 1 && t.length < INTRO_MIN_LENGTH) {
        return SILENCE_THRESHOLD_INTRO_MS;
      }
      const lastChar = t.slice(-1);
      if (lastChar === "." || lastChar === "?" || lastChar === "!") {
        return SILENCE_THRESHOLD_SENTENCE_END_MS;
      }
      const tail = t.toLowerCase().replace(/[,;:\s]+$/, "");
      for (const f of FILLER_ENDINGS) {
        if (tail.endsWith(" " + f) || tail === f) {
          return SILENCE_THRESHOLD_FILLER_MS;
        }
      }
      return SILENCE_THRESHOLD_DEFAULT_MS;
    };

    // Audio activity gate: anything below this level is treated as silence. By default we
    // use 0.06 (the previous static threshold), but if the device-check page calibrated the
    // user's voice and ambient noise, we use a calibrated value that filters out background
    // noise specific to *this* user's environment.
    let audioGateThreshold = 0.06;
    if (typeof window !== "undefined") {
      const cal = (window as any).__mockInterviewMicCalibration as
        | { noise_floor?: number; voice_peak?: number }
        | undefined;
      if (cal && typeof cal.noise_floor === "number" && typeof cal.voice_peak === "number") {
        // Threshold = noise_floor + ~25% of the floor-to-voice gap. This lets through real
        // speech (which is well above the floor) while ignoring whatever bumps the room has
        // (HVAC, keyboard taps, distant chatter).
        const gap = Math.max(0, cal.voice_peak - cal.noise_floor);
        audioGateThreshold = Math.min(
          0.5,
          Math.max(0.04, cal.noise_floor + gap * 0.25)
        );
      }
    }

    const intervalId = window.setInterval(() => {
      // Heartbeat: this loop only runs while we're legitimately waiting for an answer, so
      // its tick is proof the pipeline is alive. The freeze watchdog reads this — normal
      // thinking-silence keeps it warm and is therefore never treated as a freeze.
      lastPipelineActivityRef.current = Date.now();
      const text = currentAnswerRef.current.trim();
      const sinceLastChange = Date.now() - lastTranscriptChangeAtRef.current;

      if (!text) {
        const stage = nudgeSilenceCountRef.current;
        const POST_NUDGE_GRACE_MS = 4000;
        const FIRST_NUDGE_AT_MS = 5000;

        // If the candidate is currently speaking but STT hasn't flushed a final chunk
        // yet — they have an interim transcript, or the mic is hot above the noise gate
        // — DO NOT escalate the nudge ladder. Most often this happens right after the
        // mic-check nudge ends: the candidate jumps in with their answer, STT is
        // catching up, currentAnswer is still "". Without this gate the giveup nudge
        // would fire and skip past the answer they're already giving.
        const userMidSpeech =
          (interimTranscript && interimTranscript.trim().length > 0) ||
          audioLevelRef.current > audioGateThreshold;
        if (userMidSpeech) {
          setConversationStatus("Listening");
          setPauseProgress(0);
          // Keep the grace timer alive — when the final chunk lands, the speech branch
          // takes over naturally. If the audio activity drops again before any final
          // chunk arrives, the next poll re-enters this branch and the timer resumes.
          return;
        }

        if (stage === 0 && sinceLastChange >= FIRST_NUDGE_AT_MS) {
          nudgeSilenceCountRef.current = 1;
          window.clearInterval(intervalId);
          silenceAdvanceTimerRef.current = null;
          triggerNudge(SILENCE_MIC_CHECK_NUDGE);
          return;
        }

        if (
          stage === 1 &&
          nudgeSpeakCompleteAtRef.current > 0 &&
          Date.now() - nudgeSpeakCompleteAtRef.current >= POST_NUDGE_GRACE_MS
        ) {
          nudgeSilenceCountRef.current = 2;
          window.clearInterval(intervalId);
          silenceAdvanceTimerRef.current = null;
          advanceAfterNudgeRef.current = true;
          triggerNudge(SILENCE_GIVEUP_NUDGE);
          return;
        }

        if (sinceLastChange >= TOTAL_SILENCE_HARD_CAP_MS) {
          window.clearInterval(intervalId);
          silenceAdvanceTimerRef.current = null;
          setConversationStatus("Moving on…");
          setPauseProgress(0);
          const fn = handleNextQuestionRef.current;
          if (fn) void fn();
          return;
        }

        const waitProgress = Math.min(1, sinceLastChange / TOTAL_SILENCE_HARD_CAP_MS);
        setPauseProgress(waitProgress > 0.6 ? waitProgress : 0);
        setConversationStatus("Listening");
        return;
      }

      if (interimTranscript) {
        setConversationStatus("Listening");
        setPauseProgress(0);
        return;
      }

      if (
        audioLevelRef.current > audioGateThreshold &&
        sinceLastChange < AUDIO_BURST_GRACE_MS
      ) {
        setConversationStatus("Listening");
        setPauseProgress(0);
        return;
      }

      const threshold = pickSilenceThreshold(text);
      const progress = Math.min(1, sinceLastChange / threshold);
      setPauseProgress(progress);
      if (sinceLastChange >= threshold) {
        window.clearInterval(intervalId);
        silenceAdvanceTimerRef.current = null;
        setPauseProgress(0);

        const shouldProbe =
          !nudgeProbeUsedThisTurnRef.current &&
          nudgeProbeCountRef.current < MAX_PROBES_PER_INTERVIEW &&
          isAnswerUnclearOrShort(text);

        if (shouldProbe) {
          nudgeProbeUsedThisTurnRef.current = true;
          nudgeProbeCountRef.current += 1;
          let probeIndex =
            (recentProbeIndexRef.current + 1) % PROBE_NUDGES.length;
          if (PROBE_NUDGES.length > 1 && probeIndex === recentProbeIndexRef.current) {
            probeIndex = (probeIndex + 1) % PROBE_NUDGES.length;
          }
          recentProbeIndexRef.current = probeIndex;
          triggerNudge(PROBE_NUDGES[probeIndex]);
          return;
        }

        setConversationStatus("Following up…");
        const fn = handleNextQuestionRef.current;
        if (fn) {
          void fn();
        }
      } else if (progress >= 0.25) {
        setConversationStatus("Interviewer is going to follow up…");
      } else {
        setConversationStatus("Listening");
      }
    }, POLL_INTERVAL_MS);

    silenceAdvanceTimerRef.current = intervalId;
    return () => {
      window.clearInterval(intervalId);
      silenceAdvanceTimerRef.current = null;
    };
  }, [
    isDynamicInterview,
    interviewStarted,
    currentQuestion,
    isSpeaking,
    isFetchingNext,
    isEndingInterview,
    isClosingRemark,
    isCodingModalOpen,
    isMCQModalOpen,
    dynamicTurnNumber,
    currentAnswer,
    interimTranscript,
    triggerNudge,
    isAnswerUnclearOrShort,
    SILENCE_MIC_CHECK_NUDGE,
    SILENCE_GIVEUP_NUDGE,
    PROBE_NUDGES,
  ]);

  // ── Freeze watchdog ────────────────────────────────────────────────────
  // Recovers ONLY from a genuine total stall — the rare "everything stopped" case the user
  // described (timer/avatar/mic all dead at once). It deliberately does NOT fire on normal
  // thinking-silence (the silence loop keeps the heartbeat warm) or while the interviewer is
  // speaking. Detected freeze types:
  //   • stuck-speaking : avatar flagged speaking but no audio for too long (dead TTS),
  //   • stuck-fetch    : the next-question request hung,
  //   • stall          : the conversation loop flat-lined with nothing happening,
  //   • mic-dead       : the microphone track ended mid-interview.
  // First we try a seamless in-place recovery (cancel stuck speech, re-arm mic, re-ask the
  // current question — no page reload, no camera re-grant). If it's still frozen a few
  // seconds later, we checkpoint the answer and reload; /start/ then replays the
  // conversation so the candidate resumes from the last point.
  useEffect(() => {
    if (!interviewStarted || !isDynamicInterview) return;

    const FREEZE_STALL_MS = 15000;
    // Only a dead-TTS stall: flagged speaking but NO audio for this long. Cloud-TTS fetch +
    // retries can legitimately take ~10s before audio starts, so keep this comfortably above
    // that. A long question that IS playing keeps audioActive true and is never flagged.
    const STUCK_SPEAKING_NO_AUDIO_MS = 22000;
    const STUCK_FETCH_MS = 28000;
    const SOFT_TO_HARD_MS = 8000;
    const RECOVER_COOLDOWN_MS = 20000;
    const MAX_HARD_RELOADS = 2;

    const doSoftRecover = () => {
      showToast("Reconnecting the interview…", "info");
      try {
        window.speechSynthesis?.cancel();
      } catch {}
      setIsSpeaking(false);
      setIsFetchingNext(false);
      setNudgeText(null);
      nudgeSilenceCountRef.current = 0;
      advanceAfterNudgeRef.current = false;
      // Re-arm speech-to-text (the engine may have died silently).
      try {
        stopStt();
      } catch {}
      try {
        startStt();
      } catch {}
      lastTranscriptChangeAtRef.current = Date.now();
      lastPipelineActivityRef.current = Date.now();
      // Hold off re-evaluating while the pipeline settles — this is what prevents a
      // repeated "reconnecting again and again" loop.
      recoverCooldownUntilRef.current = Date.now() + RECOVER_COOLDOWN_MS;
      // Re-ask the current question so the avatar speaks again (no media re-grant needed).
      window.setTimeout(() => {
        if (currentQuestionRef.current) {
          setIsSpeaking(true);
        }
      }, 250);
    };

    const doHardRecover = () => {
      // Cap auto-reloads so a browser with genuinely dead TTS can't reload-loop forever.
      let reloadCount = 0;
      try {
        reloadCount = parseInt(
          sessionStorage.getItem(`mockInterviewHardReloads_${interviewId}`) || "0",
          10,
        ) || 0;
      } catch {}
      if (reloadCount >= MAX_HARD_RELOADS) {
        // Give up on auto-reload; fall back to a soft recover and a longer cooldown so the
        // candidate can keep going (and use the End Interview button if truly stuck).
        recoverCooldownUntilRef.current = Date.now() + RECOVER_COOLDOWN_MS * 3;
        freezeRecoverPhaseRef.current = "idle";
        doSoftRecover();
        return;
      }
      try {
        sessionStorage.setItem(
          `mockInterviewHardReloads_${interviewId}`,
          String(reloadCount + 1),
        );
      } catch {}
      showToast("Recovering your session — resuming where you left off…", "info");
      // Checkpoint the un-submitted current answer so it survives the reload (the prior
      // turns are replayed by /start/).
      try {
        sessionStorage.setItem(
          `mockInterviewResume_${interviewId}`,
          JSON.stringify({
            interviewId,
            currentAnswer: currentAnswerRef.current || "",
            interim: interimTranscript || "",
            ts: Date.now(),
          }),
        );
      } catch {}
      intentionalReloadRef.current = true;
      try {
        stopProctoring();
      } catch {}
      stopAllMediaTracks();
      window.setTimeout(() => window.location.reload(), 150);
    };

    const id = window.setInterval(() => {
      const now = Date.now();
      // Post-recovery cooldown: don't re-flag while a recovery is settling.
      if (now < recoverCooldownUntilRef.current) {
        lastPipelineActivityRef.current = now;
        return;
      }
      // Modals / closing remark are legitimate "busy" states (candidate is coding/answering
      // an MCQ, or the interview is wrapping up) — never a freeze.
      if (isCodingModalOpen || isMCQModalOpen || isClosingRemark || isEndingInterview) {
        lastPipelineActivityRef.current = now;
        freezeRecoverPhaseRef.current = "idle";
        return;
      }
      // stuck-speaking ONLY when flagged speaking but NO audio is actually playing (real dead
      // TTS). A long question that's genuinely playing keeps audioActive true → not a freeze.
      const stuckSpeaking =
        isSpeaking &&
        !audioActiveRef.current &&
        now - speakingStartedAtRef.current > STUCK_SPEAKING_NO_AUDIO_MS;
      const stuckFetch =
        isFetchingNext && now - fetchStartedAtRef.current > STUCK_FETCH_MS;
      const stalled =
        !isSpeaking &&
        !isFetchingNext &&
        !audioActiveRef.current &&
        now - lastPipelineActivityRef.current > FREEZE_STALL_MS;
      const stream = userStreamRef.current;
      const micDead =
        !isSpeaking &&
        !!stream &&
        stream.getAudioTracks().length > 0 &&
        stream.getAudioTracks().every((t) => t.readyState === "ended");
      const frozen = stuckSpeaking || stuckFetch || stalled || micDead;

      if (!frozen) {
        freezeRecoverPhaseRef.current = "idle";
        return;
      }
      if (freezeRecoverPhaseRef.current === "idle") {
        freezeRecoverPhaseRef.current = "soft";
        softRecoverAtRef.current = now;
        doSoftRecover();
        return;
      }
      // Still frozen after the soft attempt's grace window → reload + resume.
      if (now - softRecoverAtRef.current > SOFT_TO_HARD_MS) {
        window.clearInterval(id);
        doHardRecover();
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [
    interviewStarted,
    isDynamicInterview,
    isSpeaking,
    isFetchingNext,
    isCodingModalOpen,
    isMCQModalOpen,
    isClosingRemark,
    isEndingInterview,
    interimTranscript,
    interviewId,
    startStt,
    stopStt,
    stopProctoring,
    showToast,
  ]);

  // Handle previous question
  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      const questions =
        interview?.questions_for_interview || interview?.questions;
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setCurrentAnswer(
        responses.find(
          (r) => r.question_id === questions?.[currentQuestionIndex - 1].id
        )?.answer || ""
      );
      setIsSpeaking(true); // Auto-read previous question
    }
  }, [currentQuestionIndex, responses, interview]);

  // Handle end interview
  const handleEndInterview = useCallback(() => {
    if (isEndingInterview) return;
    setShowEndInterviewDialog(true);
  }, [isEndingInterview]);

  // Confirm end interview
  const handleConfirmEndInterview = useCallback(() => {
    setShowEndInterviewDialog(false);
    setIsEndingInterview(true);
    handleSubmitInterview();
  }, [handleSubmitInterview]);

  // Cancel end interview
  const handleCancelEndInterview = useCallback(() => {
    setShowEndInterviewDialog(false);
  }, []);

  // Handle re-enter fullscreen
  const handleReEnterFullscreen = useCallback(async () => {
    try {
      await enterFullscreen();
      const isFS =
        !!document.fullscreenElement ||
        !!(document as any).webkitFullscreenElement ||
        !!(document as any).mozFullScreenElement ||
        !!(document as any).msFullscreenElement;
      if (isFS) {
        setShowFullscreenWarning(false);
      }
    } catch (error) {
      // Silently fail
    }
  }, [enterFullscreen]);

  // Monitor fullscreen changes
  useEffect(() => {
    if (!interviewStarted) return;

    const handleFullscreenChange = () => {
      const isFS =
        !!document.fullscreenElement ||
        !!(document as any).webkitFullscreenElement ||
        !!(document as any).mozFullScreenElement ||
        !!(document as any).msFullscreenElement;

      if (!isFS && interviewStarted) {
        setShowFullscreenWarning(true);
      } else if (isFS) {
        setShowFullscreenWarning(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, [interviewStarted]);

  useEffect(() => {
    if (!interviewStarted) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        tabSwitchCountRef.current += 1;
      }
    };
    const onWindowBlur = () => {
      if (document.visibilityState === "visible") {
        windowSwitchCountRef.current += 1;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onWindowBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [interviewStarted]);

  // Prevent back button navigation and refresh during interview
  useEffect(() => {
    if (!interviewStarted) return;

    const handlePopState = (event: PopStateEvent) => {
      // Push state again to prevent navigation
      window.history.pushState(null, "", window.location.href);
      showToast("Navigation is disabled during the interview", "warning");
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // The freeze watchdog's hard-recovery reload is intentional — don't nag with the
      // "are you sure you want to leave" prompt (it would block the auto-reload).
      if (intentionalReloadRef.current) return undefined;
      event.preventDefault();
      event.returnValue =
        "Are you sure you want to leave? Your progress may be lost.";
      return event.returnValue;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent F5, Ctrl+R, Ctrl+Shift+R
      if (
        event.key === "F5" ||
        (event.ctrlKey && event.key === "r") ||
        (event.ctrlKey && event.shiftKey && event.key === "R")
      ) {
        event.preventDefault();
        showToast("Refresh is disabled during the interview", "warning");
        return false;
      }
    };

    // Push state to prevent back navigation
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [interviewStarted, showToast]);

  useEffect(() => {
    return () => {
      if (isProctoringActive) {
        stopProctoring();
      }
    };
  }, [isProctoringActive, stopProctoring]);

  const latestViolationProp = useMemo(
    () =>
      latestViolation
        ? { type: latestViolation.type, message: latestViolation.message }
        : null,
    [latestViolation?.type, latestViolation?.message]
  );

  // Stable handler passed to InterviewTimer. The timer's effect deps include this callback
  // and the parent re-renders many times per second from STT updates. Without a
  // stable reference the timer would clear+recreate its setInterval every render and the
  // 1-second tick would never fire — that's why the on-screen timer froze at 6:58.
  // We use the "latest ref" pattern: handleTimeUp's identity stays stable across renders,
  // but it always invokes the current handleSubmitInterview through the ref.
  const submitInterviewRef = useRef(handleSubmitInterview);
  useEffect(() => {
    submitInterviewRef.current = handleSubmitInterview;
  }, [handleSubmitInterview]);

  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  const isDynamicRef = useRef<boolean>(!!interview?.is_dynamic);
  useEffect(() => {
    isDynamicRef.current = !!interview?.is_dynamic;
  }, [interview?.is_dynamic]);

  const [needsTimerWrapUp, setNeedsTimerWrapUp] = useState(false);
  const isClosingRemarkRef = useRef(isClosingRemark);
  useEffect(() => {
    isClosingRemarkRef.current = isClosingRemark;
  }, [isClosingRemark]);

  const handleTimeUp = useCallback(() => {
    if (!isDynamicRef.current) {
      submitInterviewRef.current();
      return;
    }
    if (isClosingRemarkRef.current) return;
    showToastRef.current(
      "Time's up — wrapping up the interview now.",
      "info"
    );
    setNeedsTimerWrapUp(true);
  }, []);

  useEffect(() => {
    if (!needsTimerWrapUp) return;
    if (isClosingRemark) {
      setNeedsTimerWrapUp(false);
      return;
    }
    if (isFetchingNext) {
      return;
    }
    setNeedsTimerWrapUp(false);
    const fn = handleNextQuestionRef.current;
    if (fn) void fn(undefined, { forceClose: true });
  }, [needsTimerWrapUp, isFetchingNext, isClosingRemark]);

  if (!interview) {
    return null;
  }

  const questions = interview?.questions_for_interview || interview?.questions;
  const totalQuestions = questions?.length || 0;
  const isQuestionAnswered = currentQuestion
    ? responses.some((r) => r.question_id === currentQuestion.id)
    : false;

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
          backgroundColor: "var(--card-bg)",
          color: "var(--font-primary-dark)",
        overflow: "hidden",
      }}
    >
      <InterviewHeader
        title={interview.title || "Mock Interview"}
        topic={interview.topic}
        difficulty={interview.difficulty}
        interviewStarted={interviewStarted}
        onBack={() => router.push("/mock-interview")}
        durationMinutes={interview.duration_minutes}
        startedAt={
          startTime ||
          (interview.started_at ? new Date(interview.started_at) : null)
        }
        onTimeUp={handleTimeUp}
        onEndInterview={handleEndInterview}
        endInterviewDisabled={showEndInterviewDialog || isEndingInterview}
        isProctoringActive={isProctoringActive}
        proctoringStatus={proctoringStatus}
        faceCount={faceCount}
        latestViolation={latestViolationProp}
        timerPaused={isCodingModalOpen}
        bonusSeconds={interviewBonusSeconds}
      />

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left Side - Video & Answer Area */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            p: 3,
            gap: 3,
          }}
        >
          <VideoPreviewArea
            loading={loading}
            interviewStarted={interviewStarted}
            showStartButton={showStartButton}
            onStartInterview={handleStartInterview}
            isInitializing={isInitializingRef.current}
            proctoringVideoRef={proctoringVideoRef}
            isProctoringActive={isProctoringActive}
            proctoringStatus={proctoringStatus}
            faceCount={faceCount}
            latestViolation={latestViolationProp}
            isSpeaking={isSpeaking}
            questionText={nudgeText || getQuestionText(currentQuestion)}
            onSpeakComplete={handleSpeakComplete}
            isUserSpeaking={isListening}
            interviewVideoSrc={INTERVIEW_AVATAR_SRC}
            interviewTitle={cleanInterviewTitle(interview?.title)}
            questionsCount={questions?.length}
            durationMinutes={interview.duration_minutes}
            onAudioActiveChange={handleAudioActiveChange}
          />

          {interviewStarted && currentQuestion && (
            <AnswerInputArea
              currentAnswer={currentAnswer}
              interimTranscript={interimTranscript}
              onAnswerChange={handleAnswerChange}
              onSaveAnswer={handleSaveAnswer}
              onPreviousQuestion={handlePreviousQuestion}
              onNextQuestion={handleNextQuestion}
              isQuestionAnswered={isQuestionAnswered}
              // Dynamic interviews are real conversations — going back to "edit" a previous
              // answer doesn't match how a real interview works, so Previous is disabled.
              canGoPrevious={!isDynamicInterview && currentQuestionIndex > 0}
              isLastQuestion={
                // The "Submit Interview" button label is reserved for the closing-remark
                // phase only — every QUESTION (even the LLM's final synthesizing one) keeps
                // the "Follow up" affordance so the candidate's last answer routes through
                // /next-question/, which then returns the closing remark for the avatar to
                // speak. Without this guard the AI's last question would submit immediately
                // without the wrap-up speech the user asked for.
                isDynamicInterview
                  ? isClosingRemark
                  : currentQuestionIndex >= totalQuestions - 1
              }
              isListening={isListening}
              typingFallback={false}
              // Dynamic interviews are driven by silence-detection auto-advance, so we hide
              // the Previous / Save / Next buttons entirely — the candidate just speaks and
              // pauses, ChatGPT-voice-mode style.
              hideNavigationButtons={isDynamicInterview}
              conversationStatus={
                isDynamicInterview ? conversationStatus : undefined
              }
              pauseProgressRef={
                isDynamicInterview && !isClosingRemark ? pauseProgressRef : undefined
              }
              isFetchingNext={isFetchingNext}
              // Dynamic interviews hide the live transcript on screen and show the
              // running question history instead. Legacy interviews keep the textarea
              // since they still rely on the candidate seeing/editing their answer text.
              showAnswerTextarea={!isDynamicInterview}
              questionHistory={isDynamicInterview ? questionHistory : []}
              focusedHistoryQuestionId={focusedHistoryQuestionId}
              submitDisabled={isClosingRemark && isSpeaking}
              micLevelRef={audioLevelRef}
            />
          )}
        </Box>

        {/* Dynamic interviews intentionally hide the question list — the candidate should not
            see upcoming questions; the AI generates each follow-up from the prior answer. */}
        {interviewStarted && !isDynamicInterview && (
          <QuestionListSidebar
            questions={questions || []}
            currentQuestionIndex={currentQuestionIndex}
            responses={responses}
            onQuestionClick={(index) => {
              setCurrentQuestionIndex(index);
              setCurrentAnswer(
                responses.find((r) => r.question_id === questions?.[index].id)
                  ?.answer || ""
              );
              setIsSpeaking(true);
            }}
          />
        )}
      </Box>

      <FullscreenWarningDialog
        open={showFullscreenWarning}
        onReEnterFullscreen={handleReEnterFullscreen}
      />

      <EndInterviewDialog
        open={showEndInterviewDialog}
        onConfirm={handleConfirmEndInterview}
        onCancel={handleCancelEndInterview}
      />

      <CodingQuestionModal
        open={isCodingModalOpen}
        problem={currentQuestion?.coding_problem ?? null}
        spokenIntro={getQuestionText(currentQuestion)}
        budgetSeconds={codingTimeBudgetSeconds}
        allowClipboard={interview?.duration_minutes === 2}
        onSubmit={handleCodingModalSubmit}
      />
      <MCQQuestionModal
        open={isMCQModalOpen}
        options={currentQuestion?.mcq_options ?? []}
        multiSelect={!!currentQuestion?.mcq_multi_select}
        spokenIntro={getQuestionText(currentQuestion)}
        onSubmit={handleMCQModalSubmit}
      />
    </Box>
  );
}
