"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import mockInterviewService from "@/lib/services/mock-interview.service";
import { persistSttEngine } from "@/lib/utils/stt-engine";
import { prefetchInterviewerClip } from "@/lib/hooks/useInterviewerVoice";
import { useProctoring } from "@/lib/hooks/useProctoring";
import {
  detectBrowser,
  detectPlatform,
  type BrowserName,
  type PlatformName,
} from "@/lib/utils/browser-detect";
import { getAudioConstraints } from "@/lib/utils/audio-constraints";
import {
  getNoiseSuppressionPreference,
  setNoiseSuppressionPreference,
  isNoiseSuppressionSupported,
  prewarmNoiseSuppression,
} from "@/lib/utils/noise-suppression";
import { Switch } from "@mui/material";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface DeviceStatus {
  camera: boolean;
  microphone: boolean;
  browserSupported: boolean;
}

const TTS_TEXT =
  "This is a test of my microphone and speech recognition.";

export default function MockInterviewDeviceCheckPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    camera: false,
    microphone: false,
    browserSupported: false,
  });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [faceValidationPassed, setFaceValidationPassed] = useState(false);
  const [faceValidationMessage, setFaceValidationMessage] = useState<string>("");
  const [recognizedText, setRecognizedText] = useState<string>("");
  const [ttsMatch, setTtsMatch] = useState<boolean>(false);
  const [browserName, setBrowserName] = useState<BrowserName>("other");
  const [platformName, setPlatformName] = useState<PlatformName>("other");
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [noiseSuppressionEnabled, setNoiseSuppressionEnabledState] = useState(true);
  useEffect(() => {
    setNoiseSuppressionEnabledState(getNoiseSuppressionPreference());
    void prewarmNoiseSuppression();
  }, []);
  const handleNoiseSuppressionToggle = useCallback((next: boolean) => {
    setNoiseSuppressionEnabledState(next);
    setNoiseSuppressionPreference(next);
    if (next) void prewarmNoiseSuppression();
  }, []);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isNavigatingToInterviewRef = useRef(false);
  const [isNavigatingToInterview, setIsNavigatingToInterview] = useState(false);
  const hasAutoTestedRef = useRef(false);
  const speechStreamRef = useRef<MediaStream | null>(null);
  const speechRecorderRef = useRef<MediaRecorder | null>(null);
  const speechStopTimeoutRef = useRef<number | null>(null);
  // Mic calibration captured during this page's lifetime. micNoiseFloorRef tracks the
  // rolling minimum audio level (~ambient room noise); micVoicePeakRef tracks the rolling
  // maximum (~user's actual speech). Both are handed off to the take page on Proceed so the
  // interview's silence-detection can ignore background noise specific to this environment.
  const micNoiseFloorRef = useRef<number>(1);
  const micVoicePeakRef = useRef<number>(0);
  const calibrationSamplesRef = useRef<number>(0);
  // Native window.SpeechRecognition (Chrome). When available we use it as the primary path so
  // OPENAI_API_KEY is NOT required for the mic check; the MediaRecorder + /api/transcribe path
  // below is only used as a fallback for browsers without native STT (Safari) or when native
  // fails with a transient error (Edge's `network` error in particular).
  const speechRecognitionRef = useRef<any>(null);
  // Set when a fallback is already in flight; prevents native onerror + onend from racing.
  const fallbackInFlightRef = useRef(false);

  const normalize = useCallback(
    (text: string) => text.toLowerCase().replace(/[^\w\s]/g, "").trim(),
    []
  );

  const evaluateSpeechMatch = useCallback(
    (transcript: string) => {
      const normalizedTts = normalize(TTS_TEXT);
      const normalizedRecognized = normalize(transcript);
      const ttsWords = normalizedTts.split(/\s+/).filter(Boolean);
      const recognizedWords = normalizedRecognized.split(/\s+/).filter(Boolean);
      const matchRatio =
        ttsWords.filter((w) => recognizedWords.includes(w)).length /
        Math.max(ttsWords.length, 1);
      const isMatch = matchRatio >= 0.5;
      setTtsMatch(isMatch);
      setIsListening(false);
      if (isMatch) {
        showToast(t("mockInterview.deviceCheck.speechSuccess"), "success");
      } else {
        showToast(t("mockInterview.deviceCheck.textNoMatch"), "error");
      }
    },
    [normalize, showToast, t]
  );

  const {
    isInitializing: isFaceDetectionInitializing,
    faceCount,
    status: faceStatus,
    latestViolation,
    startProctoring: startFaceDetection,
    stopProctoring: stopFaceDetection,
    videoRef,
  } = useProctoring({
    autoStart: false,
    detectionInterval: 600,
    violationCooldown: 2000,
    minFaceSize: 20,
    maxFaceSize: 75,
    lookingAwayThreshold: 0.3,
    // Permissive thresholds for device-check (see assessments/[slug]/device-check
    // for the rationale). The interview take page keeps stricter values.
    minConfidence: 0.2,
    smoothFrameCount: 3,
    poorLightingThreshold: 0.4,
    minConfidenceForValidFace: 0.5,
    minEyeSpreadRatio: 0.18,
    onViolation: (violation) => {
      setFaceValidationPassed(false);
      setFaceValidationMessage(violation.message);
    },
    onStatusChange: () => {},
    onFaceCountChange: (count) => {
      if (count === 0) {
        setFaceValidationPassed(false);
        setFaceValidationMessage(t("assessments.deviceCheck.noFaceDetected"));
      } else if (count > 1) {
        setFaceValidationPassed(false);
        setFaceValidationMessage(
          t("assessments.deviceCheck.multipleFaces", { count })
        );
      }
    },
  });

  useEffect(() => {
    if (faceCount === 1 && faceStatus === "NORMAL" && !latestViolation) {
      setFaceValidationPassed(true);
      setFaceValidationMessage(t("mockInterview.deviceCheck.faceDetectedOk"));
    } else {
      setFaceValidationPassed(false);
      if (faceCount === 0) {
        setFaceValidationMessage(t("assessments.deviceCheck.noFaceDetected"));
      } else if (faceCount > 1) {
        setFaceValidationMessage(
          t("assessments.deviceCheck.multipleFaces", { count: faceCount })
        );
      } else if (latestViolation) {
        setFaceValidationMessage(latestViolation.message);
      } else if (faceStatus !== "NORMAL") {
        setFaceValidationMessage(
          t("mockInterview.deviceCheck.positionFace")
        );
      }
    }
  }, [faceCount, faceStatus, latestViolation, t]);

  const testDevices = useCallback(async () => {
    setChecking(true);
    setCameraError(null);
    setMicError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: getAudioConstraints(),
      });

      streamRef.current = stream;

      const videoTracks = stream.getVideoTracks();
      const hasVideo =
        videoTracks.length > 0 && videoTracks[0].readyState === "live";
      const audioTracks = stream.getAudioTracks();
      const hasAudio =
        audioTracks.length > 0 && audioTracks[0].readyState === "live";

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().then(() => {
          if (hasVideo && videoRef.current) {
            const checkVideoReady = () => {
              if (
                videoRef.current &&
                videoRef.current.readyState >= 2 &&
                videoRef.current.videoWidth > 0 &&
                videoRef.current.videoHeight > 0
              ) {
                setTimeout(() => {
                  startFaceDetection().catch((err) => {
                    console.error("Failed to start face detection:", err);
                    setFaceValidationMessage(
                      t("mockInterview.deviceCheck.faceDetectionFailed")
                    );
                  });
                }, 500);
              } else {
                setTimeout(checkVideoReady, 200);
              }
            };
            checkVideoReady();
          }
        }).catch((err: unknown) => {
          const name = (err as { name?: string })?.name;
          // AbortError fires when the element is removed from the DOM
          // mid-play (e.g. user navigates away); NotAllowedError fires
          // when autoplay is blocked. Neither needs surfacing.
          if (name === "AbortError" || name === "NotAllowedError") return;
          console.error("Failed to play video:", err);
        });
      }

      setDeviceStatus({
        camera: hasVideo,
        microphone: hasAudio,
        browserSupported: true,
      });

      if (!hasVideo) {
        setCameraError(t("mockInterview.deviceCheck.cameraNotAccessible"));
      }
      if (!hasAudio) {
        setMicError(t("mockInterview.deviceCheck.micNotAccessible"));
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

          let lastUpdate = 0;
          const updateAudioLevel = () => {
            if (!analyserRef.current) return;
            const now = Date.now();
            if (now - lastUpdate < 100) {
              animationFrameRef.current =
                requestAnimationFrame(updateAudioLevel);
              return;
            }
            lastUpdate = now;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            const average =
              dataArray.reduce((a, b) => a + b) / dataArray.length;
            const normalizedLevel = Math.min(average / 100, 1);
            setAudioLevel(normalizedLevel);

            // Mic calibration:
            // - First ~5 samples (~500ms) are warm-up / mic-priming garbage — skip them.
            // - Noise floor uses an exponential-moving-min (sticky-low) of the current
            //   level: ambient HVAC / fans / breathing don't push it up, but a moment of
            //   true silence below the running floor will pull it down.
            // - Voice peak is just the running max — captures the loudest moment, which
            //   should be the user reading the test sentence.
            calibrationSamplesRef.current += 1;
            if (calibrationSamplesRef.current > 5) {
              // EMA-min: floor only decreases or drifts slowly upward. The 0.9 coefficient
              // means the floor very gradually adapts if the room gets louder.
              micNoiseFloorRef.current = Math.min(
                micNoiseFloorRef.current,
                Math.max(normalizedLevel, 0.005) // hard zero is meaningless; clamp tiny
              );
              micVoicePeakRef.current = Math.max(
                micVoicePeakRef.current,
                normalizedLevel
              );
            }

            animationFrameRef.current =
              requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        } catch {
          // Fail silently
        }
      }

      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        const msg = t("mockInterview.deviceCheck.permissionDenied");
        setCameraError(msg);
        setMicError(msg);
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        setCameraError(t("mockInterview.deviceCheck.noCameraFound"));
        setMicError(t("mockInterview.deviceCheck.noMicFound"));
      } else if (
        error.name === "NotReadableError" ||
        error.name === "TrackStartError"
      ) {
        setCameraError(t("mockInterview.deviceCheck.alreadyInUse"));
        setMicError(t("mockInterview.deviceCheck.micAlreadyInUse"));
      } else {
        setCameraError(t("mockInterview.deviceCheck.failedCamera"));
        setMicError(t("mockInterview.deviceCheck.failedMic"));
      }
    } finally {
      setChecking(false);
    }
  }, [startFaceDetection, t, videoRef]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setBrowserName(detectBrowser());
    setPlatformName(detectPlatform());
    const isSupported =
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    if (!isSupported) {
      setDeviceStatus((prev) => ({ ...prev, browserSupported: false }));
      showToast(t("mockInterview.deviceCheck.browserNotSupported"), "error");
      return;
    }
    setDeviceStatus((prev) => ({ ...prev, browserSupported: true }));
  }, [showToast, t]);

  useEffect(() => {
    if (!deviceStatus.browserSupported) return;
    if (!hasAutoTestedRef.current) {
      hasAutoTestedRef.current = true;
      testDevices();
    }
  }, [deviceStatus.browserSupported, testDevices]);

  useEffect(() => {
    return () => {
      if (speechStopTimeoutRef.current) {
        window.clearTimeout(speechStopTimeoutRef.current);
        speechStopTimeoutRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (!isNavigatingToInterviewRef.current) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        if (typeof window !== "undefined") {
          delete (window as any).__mockInterviewStream;
        }
      }
      if (speechRecorderRef.current) {
        try {
          if (speechRecorderRef.current.state !== "inactive") {
            speechRecorderRef.current.stop();
          }
        } catch {
          // ignore
        }
        speechRecorderRef.current = null;
      }
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.abort();
        } catch {
          // ignore
        }
        speechRecognitionRef.current = null;
      }
      if (speechStreamRef.current) {
        speechStreamRef.current.getTracks().forEach((track) => track.stop());
        speechStreamRef.current = null;
      }
      analyserRef.current = null;
      setAudioLevel(0);
    };
  }, [stopFaceDetection, videoRef]);

  const handleStartTTS = () => {
    if (isListening || isTranscribing) return;
    setRecognizedText("");
    setTtsMatch(false);
    fallbackInFlightRef.current = false;

    // MediaRecorder + /api/transcribe (Whisper) fallback. Requires OPENAI_API_KEY on the
    // Next.js server. Used when native window.SpeechRecognition is unavailable (Safari) or
    // fails with a transient/permanent error (Edge's `network` quirk, etc.).
    const startRecorderFallback = async () => {
      if (fallbackInFlightRef.current) return;
      fallbackInFlightRef.current = true;
      setIsListening(true);
      setIsTranscribing(false);
      try {
        const stream =
          speechStreamRef.current ||
          (await navigator.mediaDevices.getUserMedia({
            audio: getAudioConstraints(),
          }));
        speechStreamRef.current = stream;

        const chunks: BlobPart[] = [];
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : MediaRecorder.isTypeSupported("audio/mp4")
              ? "audio/mp4"
              : "";

        const recorder = new MediaRecorder(
          stream,
          mimeType ? { mimeType } : undefined
        );
        speechRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
          setIsListening(false);
          setIsTranscribing(true);
          try {
            const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
            if (blob.size < 1000) {
              setIsTranscribing(false);
              showToast(t("mockInterview.deviceCheck.noSpeech"), "error");
              return;
            }

            const form = new FormData();
            form.append("file", blob, "speech.webm");
            form.append("language", "en");
            const res = await fetch("/api/transcribe", {
              method: "POST",
              body: form,
            });

            const data = (await res.json().catch(() => ({}))) as {
              text?: string;
              error?: string;
            };

            if (!res.ok) {
              setIsTranscribing(false);
              // 503 is typically missing OPENAI_API_KEY on the server running Next.js.
              showToast(
                data?.error ||
                  t("mockInterview.deviceCheck.speechError"),
                "error"
              );
              return;
            }

            const text = typeof data?.text === "string" ? data.text.trim() : "";
            setIsTranscribing(false);
            if (!text) {
              showToast(t("mockInterview.deviceCheck.noSpeech"), "error");
              return;
            }
            // Whisper produced the transcript here → this browser should use Whisper inside
            // the interview too (native STT was unavailable or failed). Pin it so the
            // interview doesn't re-try the broken native path.
            persistSttEngine("whisper");
            setRecognizedText(text);
            evaluateSpeechMatch(text);
          } catch {
            setIsTranscribing(false);
            showToast(t("mockInterview.deviceCheck.speechError"), "error");
          }
        };

        recorder.start();

        // Stop after a short deterministic window.
        speechStopTimeoutRef.current = window.setTimeout(() => {
          speechStopTimeoutRef.current = null;
          try {
            if (recorder.state !== "inactive") recorder.stop();
          } catch {
            setIsListening(false);
            showToast(t("mockInterview.deviceCheck.speechError"), "error");
          }
        }, 4500);
      } catch (err: any) {
        setIsListening(false);
        if (
          err?.name === "NotAllowedError" ||
          err?.name === "PermissionDeniedError"
        ) {
          showToast(t("mockInterview.deviceCheck.micPermissionDenied"), "error");
        } else {
          showToast(t("mockInterview.deviceCheck.speechError"), "error");
        }
      }
    };

    // Native window.SpeechRecognition is the primary path (Chrome / Chromium). It does NOT
    // need OPENAI_API_KEY and gives instant transcription. We fall through to the Whisper
    // recorder only when the native API doesn't exist or signals it won't deliver (`network`,
    // `service-not-allowed`, `audio-capture`, or onend without a result).
    const SpeechRecognitionCtor =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionCtor) {
      void startRecorderFallback();
      return;
    }

    let nativeSettled = false;
    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      speechRecognitionRef.current = recognition;

      recognition.onresult = (event: any) => {
        nativeSettled = true;
        const transcript = event?.results?.[0]?.[0]?.transcript ?? "";
        if (!transcript) {
          setIsListening(false);
          showToast(t("mockInterview.deviceCheck.noSpeech"), "error");
          return;
        }
        // Native browser STT produced the transcript → use the browser engine inside the
        // interview too.
        persistSttEngine("browser");
        setRecognizedText(transcript);
        evaluateSpeechMatch(transcript);
      };

      recognition.onerror = (event: any) => {
        nativeSettled = true;
        const code = event?.error;
        if (code === "not-allowed" || code === "permission-denied") {
          setIsListening(false);
          showToast(t("mockInterview.deviceCheck.micPermissionDenied"), "error");
          return;
        }
        if (code === "no-speech") {
          setIsListening(false);
          showToast(t("mockInterview.deviceCheck.noSpeech"), "error");
          return;
        }
        if (code === "aborted") {
          setIsListening(false);
          return;
        }
        // network / service-not-allowed / audio-capture — native won't deliver. Fall back.
        void startRecorderFallback();
      };

      recognition.onend = () => {
        // Some Edge versions end without ever firing onresult/onerror; recover via fallback.
        if (!nativeSettled && !fallbackInFlightRef.current) {
          void startRecorderFallback();
        }
      };

      setIsListening(true);
      setIsTranscribing(false);
      recognition.start();
    } catch {
      // Synchronous throw constructing/starting native recognition — fall through to Whisper.
      void startRecorderFallback();
    }
  };

  const handleProceed = async () => {
    if (
      !deviceStatus.camera ||
      !deviceStatus.microphone ||
      !ttsMatch ||
      !faceValidationPassed
    ) {
      showToast(t("mockInterview.deviceCheck.completeAllChecks"), "error");
      return;
    }
    try {
      isNavigatingToInterviewRef.current = true;
      setIsNavigatingToInterview(true);

      if (streamRef.current) {
        (window as any).__mockInterviewStream = streamRef.current;
      }

      // Hand off mic calibration to the take page so its silence detector can ignore this
      // user's background noise. Only stash if the floor actually drifted below the initial
      // sentinel (1) and the peak captured a real voice signal (>0.1); otherwise the take
      // page falls back to its built-in default threshold.
      if (
        typeof window !== "undefined" &&
        micVoicePeakRef.current > 0.1 &&
        micNoiseFloorRef.current < 1
      ) {
        (window as any).__mockInterviewMicCalibration = {
          noise_floor: micNoiseFloorRef.current,
          voice_peak: micVoicePeakRef.current,
        };
      }

      const startedInterview = await mockInterviewService.startInterview(
        Number(params.id)
      );

      // Prewarm the interviewer's opening TTS clip while the router transitions to the take
      // page — the module-level clip cache survives client-side navigation, so the first
      // question speaks instantly instead of paying a cold /api/tts round-trip on top of
      // camera/proctoring init.
      const opening =
        startedInterview.current_question ??
        (startedInterview.questions_for_interview || [])[0] ??
        null;
      prefetchInterviewerClip(opening?.question_text || opening?.question || "");

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          `mockInterviewStarted_${params.id}`,
          JSON.stringify(startedInterview)
        );
      }

      stopFaceDetection();
      router.push(`/mock-interview/${params.id}/take`);
    } catch (error) {
      isNavigatingToInterviewRef.current = false;
      setIsNavigatingToInterview(false);
      showToast(t("mockInterview.deviceCheck.startInterviewFailed"), "error");
    }
  };

  const canProceed =
    deviceStatus.camera &&
    deviceStatus.microphone &&
    deviceStatus.browserSupported &&
    ttsMatch &&
    faceValidationPassed;

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: "var(--accent-indigo)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <IconWrapper icon="mdi:camera" size={40} color="var(--font-light)" />
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 1,
              fontSize: { xs: "1.5rem", md: "2rem" },
            }}
          >
            {t("mockInterview.deviceCheck.title")}
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "var(--font-secondary)", maxWidth: 500, mx: "auto" }}
          >
            {t("mockInterview.deviceCheck.description")}
          </Typography>
        </Box>

        {!deviceStatus.browserSupported && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              {t("mockInterview.deviceCheck.title")}
            </Typography>
            <Typography variant="body2">
              {t("mockInterview.deviceCheck.browserNotSupported")}
            </Typography>
          </Alert>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 3,
            mb: 4,
          }}
        >
          {/* Camera + Face */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid var(--border-default)",
              backgroundColor: deviceStatus.camera ? "var(--surface-success-light)" : "var(--surface-error-light)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              {deviceStatus.camera ? (
                <CheckCircle size={32} color="var(--course-cta)" />
              ) : (
                <XCircle size={32} color="var(--ats-error)" />
              )}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {t("mockInterview.deviceCheck.camera")}
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                  {deviceStatus.camera
                    ? t("mockInterview.deviceCheck.cameraWorking")
                    : t("mockInterview.deviceCheck.cameraRequired")}
                </Typography>
              </Box>
            </Box>
            {cameraError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {cameraError}
              </Alert>
            )}
            <Box
              sx={{
                mt: 2,
                borderRadius: 2,
                overflow: "hidden",
                border: deviceStatus.camera
                  ? faceValidationPassed
                    ? "2px solid var(--course-cta)"
                    : "2px solid var(--warning-amber)"
                  : "2px solid var(--border-default)",
                backgroundColor: "var(--font-dark)",
                minHeight: deviceStatus.camera ? "auto" : "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {!deviceStatus.camera && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "var(--overlay-dark)",
                    zIndex: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ color: "var(--font-light)" }}>
                    {t("mockInterview.deviceCheck.cameraPreview")}
                  </Typography>
                </Box>
              )}
              {(isFaceDetectionInitializing || isNavigatingToInterview) && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0, 0, 0, 0.85)",
                    zIndex: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#ffffff" }}>
                    {isNavigatingToInterview
                      ? t("mockInterview.deviceCheck.startingInterview")
                      : t("mockInterview.deviceCheck.checkingDevices")}
                  </Typography>
                </Box>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  maxHeight: "300px",
                  minHeight: "200px",
                  objectFit: "cover",
                  backgroundColor: "#000000",
                }}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    videoRef.current.play().catch(() => {});
                  }
                }}
              />
              {/* Face-detection chip stack. Hidden once the candidate has clicked
                  "Start Interview" — at that point the "Starting interview…" overlay
                  covers the camera feed, so the model momentarily sees a black frame and
                  starts reporting `faceCount === 0`. Showing a "No face" chip + warning
                  in that exact window made the candidate think they were being told to
                  fix something even though the camera pre-flight had already passed and
                  the interview was already kicking off. We freeze the post-Start state
                  to whatever the validation showed at the moment of click. */}
              {deviceStatus.camera && !isNavigatingToInterview && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    zIndex: 2,
                  }}
                >
                  {isFaceDetectionInitializing && (
                      <Chip
                        icon={<CircularProgress size={16} />}
                        label={t("mockInterview.deviceCheck.initializingFaceDetection")}
                        size="small"
                        sx={{ backgroundColor: "var(--accent-indigo)", color: "var(--font-light)" }}
                      />
                  )}
                  {!isFaceDetectionInitializing && (
                    <>
                      <Chip
                        icon={
                          faceValidationPassed ? (
                            <CheckCircle size={16} />
                          ) : (
                            <XCircle size={16} />
                          )
                        }
                        label={
                          faceCount === 0
                            ? "No face"
                            : faceCount > 1
                            ? `${faceCount} faces`
                            : faceValidationPassed
                            ? "Face OK"
                            : "Adjust position"
                        }
                        size="small"
                        sx={{
                          backgroundColor: faceValidationPassed
                            ? "var(--course-cta)"
                            : "var(--ats-error)",
                          color: "var(--font-light)",
                        }}
                      />
                      {faceStatus !== "NORMAL" && latestViolation && (
                        <Chip
                          icon={<AlertCircle size={14} />}
                          label={latestViolation.message}
                          size="small"
                          sx={{
                            backgroundColor: "var(--warning-amber)",
                            color: "var(--font-light)",
                            fontSize: "0.7rem",
                            maxWidth: "200px",
                          }}
                        />
                      )}
                    </>
                  )}
                </Box>
              )}
            </Box>
            {deviceStatus.camera && !isFaceDetectionInitializing && !isNavigatingToInterview && (
              <Box sx={{ mt: 2 }}>
                {faceValidationPassed ? (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      ✓ {t("mockInterview.deviceCheck.faceDetectedOk")}
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      {faceValidationMessage ||
                        t("mockInterview.deviceCheck.positionFace")}
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}
          </Paper>

          {/* Microphone + Speech */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid var(--border-default)",
              backgroundColor: ttsMatch ? "var(--success-50)" : "var(--error-100)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              {ttsMatch ? (
                <CheckCircle size={32} color="var(--ats-success)" />
              ) : (
                <XCircle size={32} color="var(--ats-error)" />
              )}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {t("mockInterview.deviceCheck.speechTest")}
                </Typography>
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  {ttsMatch
                    ? t("mockInterview.deviceCheck.textMatches")
                    : t("mockInterview.deviceCheck.readToVerify")}
                </Typography>
                {micError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {micError}
                  </Alert>
                )}
                {deviceStatus.microphone && (
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: "#6b7280", display: "block", mb: 1 }}
                    >
                      {t("mockInterview.deviceCheck.audioLevel")}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={audioLevel * 100}
                      sx={{
                        height: 8,
                        borderRadius: 1,
                        backgroundColor: "#e5e7eb",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: "#10b981",
                          borderRadius: 1,
                        },
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: "#6b7280", display: "block", mt: 0.5 }}
                    >
                      {audioLevel > 0.1
                        ? t("mockInterview.deviceCheck.speakToTest")
                        : t("mockInterview.deviceCheck.microphoneReady")}
                    </Typography>
                    {isNoiseSuppressionSupported() && (
                      <Box
                        sx={{
                          mt: 2,
                          py: 1,
                          px: 1.5,
                          borderRadius: 2,
                          border: "1px solid var(--border-default)",
                          backgroundColor: "var(--card-bg)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1.5,
                          minHeight: 44,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "var(--font-primary-dark)" }}
                        >
                          Noise cancellation
                        </Typography>
                        <Switch
                          checked={noiseSuppressionEnabled}
                          onChange={(_, checked) => handleNoiseSuppressionToggle(checked)}
                          inputProps={{
                            "aria-label": "Toggle noise cancellation",
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 2,
                mb: 2,
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: "#1f2937",
                  fontWeight: 500,
                  lineHeight: 1.8,
                  fontSize: "1rem",
                }}
              >
                "{TTS_TEXT}"
              </Typography>
            </Paper>
            {isListening && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 2,
                  backgroundColor: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: 2,
                  mb: 2,
                }}
              >
                <CircularProgress size={20} sx={{ color: "#3b82f6" }} />
                <Typography variant="body2" sx={{ color: "#1e40af" }}>
                  {t("mockInterview.deviceCheck.listening")}
                </Typography>
              </Box>
            )}
            {recognizedText && !isListening && (
              <Box
                sx={{
                  p: 2,
                  backgroundColor: ttsMatch ? "#ecfdf5" : "#fef2f2",
                  border: `1px solid ${ttsMatch ? "#a7f3d0" : "#fecaca"}`,
                  borderRadius: 2,
                  mb: 2,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "#6b7280",
                    display: "block",
                    mb: 0.5,
                    fontWeight: 600,
                  }}
                >
                  {t("mockInterview.deviceCheck.recognizedText")}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: ttsMatch ? "#065f46" : "#991b1b",
                    fontStyle: "italic",
                  }}
                >
                  "{recognizedText}"
                </Typography>
                {!ttsMatch && (
                  <Typography
                    variant="caption"
                    sx={{ color: "#dc2626", display: "block", mt: 1 }}
                  >
                    {t("mockInterview.deviceCheck.textNoMatch")}
                  </Typography>
                )}
              </Box>
            )}
            {browserName === "edge" && platformName === "windows" && !ttsMatch && (
              <Alert severity="info" icon={<AlertCircle size={20} />} sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Using Microsoft Edge?
                </Typography>
                <Typography variant="body2">
                  If speech isn&apos;t recognized, open <b>Windows Settings → Privacy &amp; Security → Speech</b> and turn on{" "}
                  <b>Online speech recognition</b>, then reload this page.
                </Typography>
              </Alert>
            )}
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                onClick={handleStartTTS}
                disabled={isListening || !deviceStatus.microphone}
                startIcon={
                  isListening ? (
                    <CircularProgress size={18} />
                  ) : (
                    <IconWrapper icon="mdi:microphone" size={20} />
                  )
                }
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  py: 1.25,
                  borderColor: "#6366f1",
                  color: "#6366f1",
                  "&:hover": {
                    borderColor: "#4f46e5",
                    backgroundColor: "#eef2ff",
                  },
                  "&:disabled": {
                    borderColor: "#e5e7eb",
                    color: "#9ca3af",
                  },
                }}
              >
                {isListening
                  ? t("mockInterview.deviceCheck.listening").split("...")[0]
                  : t("mockInterview.deviceCheck.startSpeechTest")}
              </Button>
            </Box>
          </Paper>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {!canProceed &&
            (!deviceStatus.camera || !deviceStatus.microphone) && (
              <Button
                variant="contained"
                size="large"
                onClick={testDevices}
                disabled={checking || !deviceStatus.browserSupported}
                startIcon={
                  checking ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <IconWrapper icon="mdi:play-circle" size={24} />
                  )
                }
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  backgroundColor: "#6366f1",
                  "&:hover": { backgroundColor: "#4f46e5" },
                }}
              >
                {checking
                  ? t("mockInterview.deviceCheck.checkingDevices")
                  : t("mockInterview.deviceCheck.testCameraMic")}
              </Button>
            )}
          {canProceed && (
            <Button
              variant="contained"
              size="large"
              onClick={handleProceed}
              disabled={!faceValidationPassed}
              endIcon={<IconWrapper icon="mdi:arrow-right" size={24} />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                px: 4,
                py: 1.5,
                backgroundColor: faceValidationPassed ? "#10b981" : "#9ca3af",
                "&:hover": {
                  backgroundColor: faceValidationPassed ? "#059669" : "#9ca3af",
                },
                "&:disabled": {
                  backgroundColor: "#9ca3af",
                  color: "#ffffff",
                },
              }}
            >
              {faceValidationPassed
                ? t("mockInterview.deviceCheck.proceedToInterview")
                : t("mockInterview.deviceCheck.positionFace")}
            </Button>
          )}
          <Button
            variant="outlined"
            size="large"
            onClick={() => {
              // Backing out of device-check means the candidate never reached the
              // interviewer — mark the claimed attempt failed (fire-and-forget) so it shows
              // as "Failed" for the admin and frees the template to be retaken, rather than
              // lingering as a phantom in-progress/scheduled attempt.
              void mockInterviewService.abandonInterview(Number(params.id));
              router.push("/mock-interview");
            }}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              px: 4,
              py: 1.5,
              borderColor: "#e5e7eb",
              color: "#6b7280",
              "&:hover": {
                borderColor: "#d1d5db",
                backgroundColor: "#f9fafb",
              },
            }}
          >
            {t("mockInterview.deviceCheck.cancel")}
          </Button>
        </Box>

        <Paper
          elevation={0}
          sx={{
            mt: 4,
            p: 3,
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
            <IconWrapper icon="mdi:information" size={24} color="#3b82f6" />
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, color: "#1e40af", mb: 0.5 }}
              >
                {t("mockInterview.deviceCheck.whyWeNeedThis")}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#1e40af",
                  fontSize: "0.875rem",
                  lineHeight: 1.7,
                }}
              >
                {t("mockInterview.deviceCheck.whyDescription")}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </MainLayout>
  );
}
