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
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { stopAllMediaTracks, registerMediaStream } from "@/lib/utils/cameraUtils";
import {
  InterviewHeader,
  VideoPreviewArea,
  AnswerInputArea,
  QuestionListSidebar,
  FullscreenWarningDialog,
  EndInterviewDialog,
} from "@/components/mock-interview";

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
  const [audioLevel, setAudioLevel] = useState<number>(0);
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

  const isInitializingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const userStreamRef = useRef<MediaStream | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const eyeMovementCountRef = useRef(0);
  const lastEyeMovementWarningRef = useRef(0);

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
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
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
            setAudioLevel(normalizedLevel);
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

  const speechToText = useSpeechToText({
    onFinal: (text) => {
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
    onInterim: (text) => setInterimTranscript(text || ""),
    continuous: true,
    lang: "en-US",
    preferWhisper: true,
    paused: isSpeaking,
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

  // Disable ESC and right-click
  useKeyboardShortcuts({
    enabled: interviewStarted,
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
      if (started.current_question) {
        setDynamicCurrentQuestion(started.current_question);
      }
      if (typeof started.turn_number === "number") {
        setDynamicTurnNumber(started.turn_number);
      }
      if (typeof started.max_turns === "number") {
        setDynamicMaxTurns(started.max_turns);
      }
      // On a fresh dynamic interview, /start/ only returns the OPENING question. The opening
      // is final only if max_turns is 1 (degenerate case).
      const turnNo = started.turn_number ?? 1;
      const maxT = started.max_turns ?? 5;
      setDynamicIsFinalQuestion(turnNo >= maxT);
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
          audio: { noiseSuppression: true, echoCancellation: true },
        });
        if (!hasAudio) streamToClean = stream;

        userStreamRef.current = stream;
        if (!hasAudio) registerMediaStream(stream);

        const audioContext = new AudioContext();
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
          setAudioLevel(average / 255);
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
    // Start speech-to-text first (same user gesture as click — required by browser for mic)
    startStt();
    setShowStartButton(false);
    setInterviewStarted(true);

    try {
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

      // Start proctoring immediately
      await startProctoring().catch((error) => {
        showToast(
          "Camera initialization failed. Please ensure camera permissions are granted.",
          "error"
        );
      });

      // Auto-read first question. For dynamic interviews `questions_for_interview` is
      // intentionally empty (so the candidate can't see future questions); the opening
      // question lives on `interview.current_question` and is mirrored into
      // `dynamicCurrentQuestion`. Check `currentQuestion` (which resolves to either source
      // via the useMemo) so the avatar speaks in both modes.
      const hasOpeningQuestion = isDynamicInterview
        ? !!dynamicCurrentQuestion
        : !!(
            (interview.questions_for_interview || interview.questions)?.length
          );
      if (hasOpeningQuestion) {
        setIsSpeaking(true);
      }
    } catch (error: any) {
      showToast(error.message || "Failed to start interview", "error");
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

  // Handle question read complete
  const handleSpeakComplete = useCallback(() => {
    setIsSpeaking(false);
  }, []);

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
  const lastTranscriptChangeAtRef = useRef<number>(0);
  const handleNextQuestionRef = useRef<(() => Promise<void>) | null>(null);
  // Live mic energy mirrored into a ref so the silence interval can read it without making
  // the page re-render. We bump lastTranscriptChangeAtRef whenever audio crosses a "user is
  // speaking" threshold — that way, an "umm" or a half-second of resumed speech (which won't
  // produce STT output until the recognizer chunks it) still defers the auto-advance.
  const audioLevelRef = useRef<number>(0);
  // Snapshot of the answer text at the moment we fire /next-question/. Used to detect words
  // the candidate spoke DURING the fetch so we can append them to the previous answer
  // instead of discarding them when we reset currentAnswer for the new question.
  const answerAtAdvanceRef = useRef<string>("");
  const previousQuestionIdAtAdvanceRef = useRef<number | null>(null);
  const [conversationStatus, setConversationStatus] = useState<string>("");

  useEffect(() => {
    audioLevelRef.current = audioLevel;
    if (audioLevel > 0.06) {
      // Treat "I can hear noise from the mic" as a transcript change, even if STT hasn't
      // finalized yet. Without this, a candidate who resumes speaking JUST as the silence
      // threshold elapses can still get auto-advanced before their next chunk lands.
      lastTranscriptChangeAtRef.current = Date.now();
    }
  }, [audioLevel]);

  // Live mirror of currentAnswer into a ref. handleNextQuestion is an async function and the
  // value of `currentAnswer` it closed over is stale by the time the /next-question/ POST
  // resolves — we need to read whatever the candidate has TYPED OR SPOKEN since the advance
  // fired, so we can preserve their continuation instead of discarding it.
  const currentAnswerRef = useRef<string>("");
  useEffect(() => {
    currentAnswerRef.current = currentAnswer;
  }, [currentAnswer]);

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

  // Handle submit interview
  const handleSubmitInterview = useCallback(async () => {
    if (!interview || !startTime) return;

    try {
      // Get latest responses (including any unsaved answer)
      let finalResponses = [...responses];
      if (currentAnswer && currentQuestion) {
        const existingIndex = finalResponses.findIndex(
          (r) => r.question_id === currentQuestion.id
        );
        const newResponse: InterviewResponse = {
          question_id: currentQuestion.id,
          answer: currentAnswer,
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

      // Process violations - count all violation types
      const faceValidationFailures = violations.filter(
        (v) => v.type === "NO_FACE" || v.type === "POOR_LIGHTING"
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

      // Prepare submission data
      const requestBody = {
        transcript: {
          responses: finalResponses,
          total_duration_seconds: totalDurationSeconds,
          logs: [], // Add any logs if needed
          metadata: {
            face_validation_failures: faceValidationFailures,
            multiple_face_detections: multipleFaceDetections,
            looking_away_count: lookingAwayCount,
            eye_movement_count: eyeMovementCount,
            face_too_close_count: faceTooCloseCount,
            face_too_far_count: faceTooFarCount,
            fullscreen_exits: fullscreenExits,
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
      if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach((track) => track.stop());
        userStreamRef.current = null;
      }

      stopAllMediaTracks();

      await new Promise((resolve) => setTimeout(resolve, 50));
      stopAllMediaTracks();

      // Navigate to success page
      showToast("Interview submitted successfully!", "success");
      router.push(`/mock-interview/${interviewId}/submission-success`);
    } catch (error) {
      showToast("Failed to submit interview", "error");
      // Reset the "ending" lock so End Interview stays clickable. Without this, a failed
      // submit (e.g., a transient 500 from the eval LLM call) would trap the candidate with
      // a permanently disabled End button.
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

  // Handle next question
  const handleNextQuestion = useCallback(async () => {
    // Clear auto-save timer; we want to record the answer for THIS question right now.
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    // ===== Dynamic (turn-based) flow =====
    if (isDynamicInterview) {
      if (!currentQuestion) return;
      if (isFetchingNext) return; // guard against double-tap

      // Capture the answer text for this turn and record it locally so the transcript stays
      // in sync with what the backend will receive at submit time.
      const answerForThisTurn = currentAnswer.trim();
      const questionTextForThisTurn =
        currentQuestion.question_text || currentQuestion.question || "";

      setResponses((prev) => {
        const existingIndex = prev.findIndex(
          (r) => r.question_id === currentQuestion.id
        );
        const entry: InterviewResponse = {
          question_id: currentQuestion.id,
          answer: answerForThisTurn,
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
      const endPhrases = [
        /\bi\s+want\s+to\s+end\s+(this\s+)?interview\b/,
        /\b(let'?s|can\s+we)\s+(end|stop|finish|wrap\s*up)\s+(this\s+)?(interview)?\b/,
        /\bno\s+more\s+questions?\b/,
        /\b(end|stop|finish|exit)\s+(the\s+)?interview\b/,
        /\bthat'?s\s+(all|enough)\s+for\s+(me|today|now)\b/,
        /\bi'?m\s+done\s+(with\s+)?(this\s+)?(interview|now)\b/,
      ];
      const isEndRequest =
        // Only allow the end-request match for short utterances; if the candidate gave a
        // long answer that happens to contain "end the interview" as a side reference,
        // they probably didn't mean to actually end it.
        lowerAnswer.length > 0 &&
        lowerAnswer.length < 200 &&
        endPhrases.some((rx) => rx.test(lowerAnswer));
      if (isEndRequest) {
        showToast("Okay — wrapping up the interview now.", "info");
        handleSubmitInterview();
        return;
      }

      // If the question we just answered was the FINAL question of the interview, we don't
      // ask for another follow-up — we submit.
      if (dynamicIsFinalQuestion) {
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
          });

        // Closing-remark path: backend says we're in the final minute, hands us a natural
        // verbal wrap-up text instead of another question. We surface it to the candidate
        // by treating it as a "question" the avatar speaks, but mark dynamicIsFinalQuestion
        // and a separate isClosingRemark flag so:
        //   - silence-detection auto-advance is suppressed (no answer expected)
        //   - the action button reads "Submit Interview" (already gated on
        //     dynamicIsFinalQuestion via isLastQuestion)
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
            "Interview complete — submit when you're ready."
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
        setCurrentAnswer("");
        setInterimTranscript("");
        setIsSpeaking(true); // Avatar narrates the new question (drives facial movement).
        // Reset the snapshot so a future advance doesn't accidentally treat stale state as
        // "continuation."
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

  // Bump the "last transcript change" timestamp whenever the candidate types or speaks.
  useEffect(() => {
    if (!isDynamicInterview) return;
    if (!currentAnswer && !interimTranscript) return;
    lastTranscriptChangeAtRef.current = Date.now();
  }, [isDynamicInterview, currentAnswer, interimTranscript]);

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

    // Silence threshold tuning:
    // - 500ms feels snappy — matches the cadence of a real interviewer who jumps in the
    //   instant they hear the candidate finish a thought. Risk of cutting off a thinking
    //   pause is mitigated by (a) the audio-level gate below — if the candidate is still
    //   making sound (mid-word, breathing), we don't count that as silence; and (b) the
    //   noise-floor calibration from device-check, so background hum doesn't fool it.
    // - CONFIRM_PAUSE_MS (150) flips the status hint to "Wrapping up…" at ~350ms elapsed,
    //   giving the candidate a brief visual cue before the advance fires.
    const SILENCE_THRESHOLD_MS = 500;
    const CONFIRM_PAUSE_MS = 150;
    const POLL_INTERVAL_MS = 100;

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
      const text = currentAnswer.trim();
      // Need at least *something* spoken before we count silence as "done." Otherwise the
      // very moment the avatar finishes speaking we'd auto-advance with an empty answer.
      if (!text) {
        setConversationStatus("Listening — speak when you're ready.");
        return;
      }
      // STT might still have an interim chunk in flight; don't advance until it settles.
      if (interimTranscript) {
        setConversationStatus("Listening…");
        return;
      }
      // Live audio: if the candidate is currently making noise above the calibrated
      // threshold, they're probably still talking — STT just hasn't chunked the words yet.
      if (audioLevelRef.current > audioGateThreshold) {
        setConversationStatus("Listening…");
        return;
      }
      const sinceLastChange = Date.now() - lastTranscriptChangeAtRef.current;
      const remaining = SILENCE_THRESHOLD_MS - sinceLastChange;
      if (remaining <= 0) {
        // Fire once, then let the next render's guard (isFetchingNext) suppress re-entry.
        window.clearInterval(intervalId);
        silenceAdvanceTimerRef.current = null;
        setConversationStatus("Got it — following up.");
        const fn = handleNextQuestionRef.current;
        if (fn) {
          void fn();
        }
      } else if (remaining <= CONFIRM_PAUSE_MS) {
        setConversationStatus("Wrapping up — speak now if you want to add more.");
      } else {
        setConversationStatus("Listening…");
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
    // Re-bind when these change so the threshold check sees fresh values without depending
    // on a stale closure.
    currentAnswer,
    interimTranscript,
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

  // Prevent back button navigation and refresh during interview
  useEffect(() => {
    if (!interviewStarted) return;

    const handlePopState = (event: PopStateEvent) => {
      // Push state again to prevent navigation
      window.history.pushState(null, "", window.location.href);
      showToast("Navigation is disabled during the interview", "warning");
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
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
  // and the parent re-renders many times per second from audioLevel/STT state. Without a
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

  const handleTimeUp = useCallback(() => {
    if (isDynamicRef.current) {
      showToastRef.current(
        "You're past the suggested time — wrap up your current answer.",
        "info"
      );
      return;
    }
    submitInterviewRef.current();
  }, []);

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
        // For dynamic interviews the timer is advisory — we just nudge the candidate to wrap
        // up instead of auto-submitting. CRITICAL: this must reference a stable callback. The
        // page re-renders ~60×/sec (audio level updates) and InterviewTimer keys its
        // setInterval on the onTimeUp ref — a new arrow each render would clear+recreate the
        // interval before its 1-second tick fires, freezing the timer. See handleTimeUp below.
        onTimeUp={handleTimeUp}
        onEndInterview={handleEndInterview}
        endInterviewDisabled={showEndInterviewDialog || isEndingInterview}
        isProctoringActive={isProctoringActive}
        proctoringStatus={proctoringStatus}
        faceCount={faceCount}
        latestViolation={latestViolationProp}
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
            questionText={getQuestionText(currentQuestion)}
            onSpeakComplete={handleSpeakComplete}
            isUserSpeaking={isListening}
            interviewVideoSrc={INTERVIEW_AVATAR_SRC}
            interviewTitle={interview?.title}
            questionsCount={questions?.length}
            durationMinutes={interview.duration_minutes}
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
                isDynamicInterview
                  ? dynamicIsFinalQuestion
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
    </Box>
  );
}
