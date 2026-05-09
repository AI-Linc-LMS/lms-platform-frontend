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
import { useProctoring } from "@/lib/hooks/useProctoring";
import {
  detectBrowser,
  detectPlatform,
  type BrowserName,
  type PlatformName,
} from "@/lib/utils/browser-detect";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface DeviceStatus {
  camera: boolean;
  microphone: boolean;
  browserSupported: boolean;
}

const TTS_TEXT =
  "This is a test of my microphone and speech recognition.";
const SPEECH_RETRY_DELAYS_MS = [500, 1000, 2000];
const SPEECH_TIP_RETRY_THRESHOLD = 2;

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
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string>("");
  const [ttsMatch, setTtsMatch] = useState<boolean>(false);
  const [speechSkipped, setSpeechSkipped] = useState<boolean>(false);
  const [speechTip, setSpeechTip] = useState<string | null>(null);
  const [browserName, setBrowserName] = useState<BrowserName>("other");
  const [platformName, setPlatformName] = useState<PlatformName>("other");
  const [recognition, setRecognition] = useState<any>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isNavigatingToInterviewRef = useRef(false);
  const [isNavigatingToInterview, setIsNavigatingToInterview] = useState(false);
  const hasAutoTestedRef = useRef(false);
  const speechRetryCountRef = useRef(0);
  const speechRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioLevelObservedRef = useRef(false);

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
    minConfidence: 0.4,
    smoothFrameCount: 3,
    poorLightingThreshold: 0.4,
    minConfidenceForValidFace: 0.82,
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
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
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
        }).catch((err) => {
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
            if (normalizedLevel > 0.05) audioLevelObservedRef.current = true;
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

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = "en-US";
      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setRecognizedText(transcript);
        const normalize = (text: string) =>
          text.toLowerCase().replace(/[^\w\s]/g, "").trim();
        const normalizedTts = normalize(TTS_TEXT);
        const normalizedRecognized = normalize(transcript);
        const ttsWords = normalizedTts.split(/\s+/);
        const recognizedWords = normalizedRecognized.split(/\s+/);
        const matchRatio =
          ttsWords.filter((w) => recognizedWords.includes(w)).length /
          ttsWords.length;
        const isMatch = matchRatio >= 0.5;
        setTtsMatch(isMatch);
        setIsListening(false);
        speechRetryCountRef.current = 0;
        setSpeechTip(null);
        if (isMatch) {
          showToast(t("mockInterview.deviceCheck.speechSuccess"), "success");
        } else {
          showToast(t("mockInterview.deviceCheck.textNoMatch"), "error");
        }
      };
      recognitionInstance.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          showToast(t("mockInterview.deviceCheck.micPermissionDenied"), "error");
          return;
        }
        if (event.error === "no-speech") {
          showToast(t("mockInterview.deviceCheck.noSpeech"), "error");
          return;
        }
        if (event.error === "aborted") {
          return;
        }
        // network / audio-capture / generic — auto-retry with backoff before
        // surfacing as a hard error. Edge frequently emits transient `network`.
        speechRetryCountRef.current += 1;
        const attempt = speechRetryCountRef.current;
        const browser = detectBrowser();
        const platform = detectPlatform();
        if (
          browser === "edge" &&
          platform === "windows" &&
          attempt >= SPEECH_TIP_RETRY_THRESHOLD
        ) {
          setSpeechTip(
            "Speech recognition can fail in Edge if Online Speech Recognition is off. Open Windows Settings → Privacy & Security → Speech and turn it on, then reload. You can also click 'Skip speech test' below if your microphone is detected."
          );
        } else if (
          browser === "edge" &&
          platform === "mac" &&
          attempt >= SPEECH_TIP_RETRY_THRESHOLD
        ) {
          setSpeechTip(
            "On Edge for macOS, allow microphone access in System Settings → Privacy & Security → Microphone, then reload. If speech still doesn&apos;t match, click 'Skip speech test' and continue."
          );
        } else if (
          platform === "mac" &&
          (browser === "chrome" || browser === "safari" || browser === "other") &&
          attempt >= SPEECH_TIP_RETRY_THRESHOLD
        ) {
          setSpeechTip(
            "On macOS, allow microphone access for your browser in System Settings → Privacy & Security → Microphone, then reload. If speech still doesn't match, click 'Skip speech test' and continue."
          );
        }
        if (attempt <= SPEECH_RETRY_DELAYS_MS.length) {
          const delay = SPEECH_RETRY_DELAYS_MS[attempt - 1];
          if (speechRetryTimeoutRef.current) clearTimeout(speechRetryTimeoutRef.current);
          speechRetryTimeoutRef.current = setTimeout(() => {
            try {
              setIsListening(true);
              setRecognizedText("");
              recognitionInstance.start();
            } catch {
              setIsListening(false);
            }
          }, delay);
        } else {
          showToast(t("mockInterview.deviceCheck.speechError"), "error");
        }
      };
      recognitionInstance.onend = () => setIsListening(false);
      setRecognition(recognitionInstance);
    } else {
      showToast(t("mockInterview.deviceCheck.speechNotSupported"), "warning");
      // No browser STT at all — make sure user can still proceed via skip.
      setSpeechTip(
        "Speech recognition isn't available in this browser. Once your microphone is detected, you can click 'Skip speech test' to continue and type your answers during the interview."
      );
    }
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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (speechRetryTimeoutRef.current) {
        clearTimeout(speechRetryTimeoutRef.current);
        speechRetryTimeoutRef.current = null;
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
      analyserRef.current = null;
      setAudioLevel(0);
    };
  }, [stopFaceDetection, videoRef]);

  const handleStartTTS = () => {
    if (!recognition) {
      showToast(t("mockInterview.deviceCheck.speechNotAvailable"), "error");
      return;
    }
    speechRetryCountRef.current = 0;
    if (speechRetryTimeoutRef.current) {
      clearTimeout(speechRetryTimeoutRef.current);
      speechRetryTimeoutRef.current = null;
    }
    setSpeechTip(null);
    setIsListening(true);
    setRecognizedText("");
    setTtsMatch(false);
    setSpeechSkipped(false);
    recognition.start();
  };

  const handleSkipSpeechTest = () => {
    if (speechRetryTimeoutRef.current) {
      clearTimeout(speechRetryTimeoutRef.current);
      speechRetryTimeoutRef.current = null;
    }
    if (recognition) {
      try {
        recognition.stop();
      } catch {}
    }
    setIsListening(false);
    setSpeechSkipped(true);
    showToast(
      "Speech test skipped. You can type your answers during the interview.",
      "info"
    );
  };

  const handleProceed = async () => {
    if (
      !deviceStatus.camera ||
      !deviceStatus.microphone ||
      (!ttsMatch && !speechSkipped) ||
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

      const startedInterview = await mockInterviewService.startInterview(
        Number(params.id)
      );

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

  const canSkipSpeech =
    deviceStatus.microphone &&
    !ttsMatch &&
    !speechSkipped &&
    (audioLevelObservedRef.current ||
      speechRetryCountRef.current >= SPEECH_TIP_RETRY_THRESHOLD ||
      !recognition);

  const canProceed =
    deviceStatus.camera &&
    deviceStatus.microphone &&
    deviceStatus.browserSupported &&
    (ttsMatch || speechSkipped) &&
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
              backgroundColor: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <IconWrapper icon="mdi:camera" size={40} color="#ffffff" />
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
            sx={{ color: "#6b7280", maxWidth: 500, mx: "auto" }}
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
              border: "1px solid #e5e7eb",
              backgroundColor: deviceStatus.camera ? "#f0fdf4" : "#fef2f2",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              {deviceStatus.camera ? (
                <CheckCircle size={32} color="#10b981" />
              ) : (
                <XCircle size={32} color="#ef4444" />
              )}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {t("mockInterview.deviceCheck.camera")}
                </Typography>
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
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
                    ? "2px solid #10b981"
                    : "2px solid #f59e0b"
                  : "2px solid #e5e7eb",
                backgroundColor: "#000000",
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
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    zIndex: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#ffffff" }}>
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
              {deviceStatus.camera && (
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
                      sx={{ backgroundColor: "#6366f1", color: "#ffffff" }}
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
                            ? "#10b981"
                            : "#ef4444",
                          color: "#ffffff",
                        }}
                      />
                      {faceStatus !== "NORMAL" && latestViolation && (
                        <Chip
                          icon={<AlertCircle size={14} />}
                          label={latestViolation.message}
                          size="small"
                          sx={{
                            backgroundColor: "#f59e0b",
                            color: "#ffffff",
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
            {deviceStatus.camera && !isFaceDetectionInitializing && (
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
              backgroundColor: ttsMatch || speechSkipped ? "var(--success-50)" : "var(--error-100)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              {ttsMatch || speechSkipped ? (
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
                    : speechSkipped
                      ? "Speech test skipped — you can type answers during the interview."
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
            {browserName === "edge" && platformName === "windows" && !ttsMatch && !speechSkipped && (
              <Alert severity="info" icon={<AlertCircle size={20} />} sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Using Microsoft Edge?
                </Typography>
                <Typography variant="body2">
                  If speech isn&apos;t recognized, open <b>Windows Settings → Privacy &amp; Security → Speech</b> and turn on{" "}
                  <b>Online speech recognition</b>, then reload this page. You can also click <b>Skip speech test</b> below to continue and type your answers during the interview.
                </Typography>
              </Alert>
            )}
            {browserName === "edge" && platformName === "mac" && !ttsMatch && !speechSkipped && (
              <Alert severity="info" icon={<AlertCircle size={20} />} sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Using Microsoft Edge on macOS?
                </Typography>
                <Typography variant="body2">
                  If speech isn&apos;t recognized, open <b>System Settings → Privacy &amp; Security → Microphone</b> and allow access for Edge, then reload this page. You can also click <b>Skip speech test</b> to continue and type answers during the interview.
                </Typography>
              </Alert>
            )}
            {platformName === "mac" && (browserName === "chrome" || browserName === "safari" || browserName === "other") && !ttsMatch && !speechSkipped && (
              <Alert severity="info" icon={<AlertCircle size={20} />} sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Using macOS?
                </Typography>
                <Typography variant="body2">
                  If speech isn&apos;t recognized, open <b>System Settings → Privacy &amp; Security → Microphone</b> and allow access for your browser, then reload this page. You can also click <b>Skip speech test</b> to continue and type answers during the interview.
                </Typography>
              </Alert>
            )}
            {speechTip && !(browserName === "edge" && platformName === "windows") && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">{speechTip}</Typography>
              </Alert>
            )}
            {speechSkipped && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Speech test skipped. Your microphone is detected — you can type answers during the interview.
                </Typography>
              </Alert>
            )}
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                onClick={handleStartTTS}
                disabled={isListening || !deviceStatus.microphone || speechSkipped}
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
              {canSkipSpeech && (
                <Button
                  variant="text"
                  onClick={handleSkipSpeechTest}
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    color: "#6b7280",
                    "&:hover": { color: "#374151", backgroundColor: "#f3f4f6" },
                  }}
                >
                  Skip speech test
                </Button>
              )}
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
            onClick={() => router.push("/mock-interview")}
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
