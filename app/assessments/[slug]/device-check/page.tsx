"use client";

import { useEffect, useState, useRef, use, useCallback } from "react";
import { useRouter } from "next/navigation";
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
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  assessmentService,
  type AssessmentDetail,
} from "@/lib/services/assessment.service";
import { isCurrentDeviceAllowedForAssessment } from "@/lib/utils/assessment-device";
import { AssessmentDeviceStatusPanel } from "@/components/assessment/AssessmentDeviceStatusPanel";
import { useProctoring } from "@/lib/hooks/useProctoring";
import { StatusChip, type ChipTone } from "@/components/admin/assessment/shared";
import { stripHtmlTags } from "@/lib/utils/html-utils";

interface DeviceStatus {
  camera: boolean;
  microphone: boolean;
  browserSupported: boolean;
}

/** Maps a StatusChip tone to its token-backed foreground color (icon-tile tint + icon). */
const ROW_TONE_COLOR: Record<ChipTone, string> = {
  success: "var(--success-500)",
  warning: "var(--warning-500)",
  error: "var(--error-500)",
  info: "var(--accent-indigo)",
  neutral: "var(--font-secondary)",
  ai: "var(--ai-pink)",
  proctored: "var(--tone-proctored)",
};

export default function DeviceCheckPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { t } = useTranslation("common");
  const { slug } = use(params);
  const router = useRouter();
  const [, setLoading] = useState(false); // Start with false - don't block initial render
  const [checking, setChecking] = useState(false);
  const [deviceAccessDenied, setDeviceAccessDenied] = useState(false);
  const [deniedAssessment, setDeniedAssessment] =
    useState<AssessmentDetail | null>(null);
  // Loaded detail — used only for the header subtitle (title). Does not gate flow.
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    camera: false,
    microphone: false,
    browserSupported: false,
  });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const [networkSpeed, setNetworkSpeed] = useState<number | null>(null);
    const [networkStatus, setNetworkStatus] = useState<
      "good" | "moderate" | "poor" | "testing" | null
    >(null);

  const [mobileAssessmentGate, setMobileAssessmentGate] = useState<
    "pending" | "ok"
  >("pending");

  // ✅ FACE VALIDATION STATE
  const [faceValidationPassed, setFaceValidationPassed] = useState(false);
  const [faceValidationMessage, setFaceValidationMessage] = useState<string>("");

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isNavigatingToAssessmentRef = useRef(false);
  const [isNavigatingToAssessment, setIsNavigatingToAssessment] = useState(false);
  const hasAutoTestedRef = useRef(false);
  const { showToast } = useToast();

  // Face detection proctoring - use its videoRef
  const {
    isActive: isFaceDetectionActive,
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
    minFaceSize: 20, // Strictly reject faces beyond 2-3 meters
    maxFaceSize: 75,
    lookingAwayThreshold: 0.3,
    // Permissive thresholds for the device-check screen: this is just verifying
    // "camera works and we can see a face" — not anti-cheat. On low-end devices
    // and grainy 640x480 webcams BlazeFace returns lower-confidence boxes and
    // noisier landmarks for real faces, which previously read as "No face".
    // The take/proctoring pages keep their own (stricter) thresholds.
    minConfidence: 0.2,
    smoothFrameCount: 3,
    poorLightingThreshold: 0.4,
    minConfidenceForValidFace: 0.5,
    minEyeSpreadRatio: 0.18,
    onViolation: (violation) => {
      // Once the user has committed to starting the assessment, freeze
      // validation state — stopping the detector for hand-off to the take
      // page produces transient "no face / violation" events that would
      // otherwise flash a misleading error during the countdown.
      if (isNavigatingToAssessmentRef.current) return;
      setFaceValidationPassed(false);
      setFaceValidationMessage(violation.message);
    },
    onStatusChange: () => {
      // Status change will trigger useEffect below to update validation
    },
    onFaceCountChange: (count) => {
      if (isNavigatingToAssessmentRef.current) return;
      if (count === 0) {
        setFaceValidationPassed(false);
        setFaceValidationMessage(t("assessments.deviceCheck.noFaceDetected"));
      } else if (count > 1) {
        setFaceValidationPassed(false);
        setFaceValidationMessage(t("assessments.deviceCheck.multipleFaces", { count }));
      }
      // For count === 1, useEffect below will check status
    },
  });

  // Update face validation status when faceCount or faceStatus changes
  useEffect(() => {
    if (isNavigatingToAssessmentRef.current) return;
    if (faceCount === 1 && faceStatus === "NORMAL" && !latestViolation) {
      setFaceValidationPassed(true);
      setFaceValidationMessage("Face detected and positioned correctly");
    } else {
      setFaceValidationPassed(false);
      // Update message based on current state
      if (faceCount === 0) {
        setFaceValidationMessage("No face detected. Please position yourself in front of the camera.");
      } else if (faceCount > 1) {
        setFaceValidationMessage(`${faceCount} faces detected. Only one person should be visible.`);
      } else if (latestViolation) {
        setFaceValidationMessage(latestViolation.message);
      } else if (faceStatus !== "NORMAL") {
        setFaceValidationMessage("Please adjust your position - look at the screen and maintain proper distance.");
      }
    }
  }, [faceCount, faceStatus, latestViolation]);

  // ✅ INTERNET SPEED TEST
  const testInternetSpeed = useCallback(async () => {
    setNetworkStatus("testing");

    const TEST_URL = "https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg";
    const ATTEMPTS = 2;
    const MAX_BYTES = 150 * 1024;
    const ATTEMPT_TIMEOUT_MS = 4000;
    const speeds: number[] = [];

    for (let i = 0; i < ATTEMPTS; i++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
      try {
        const start = performance.now();
        const res = await fetch(TEST_URL, {
          cache: "no-store",
          headers: { Range: `bytes=0-${MAX_BYTES - 1}` },
          signal: controller.signal,
        });

        // some servers may ignore Range — read what we get and measure length
        const buf = await res.arrayBuffer();
        const end = performance.now();
        const duration = (end - start) / 1000;
        if (duration > 0 && buf && buf.byteLength > 0) {
          const bits = buf.byteLength * 8;
          const mbps = bits / duration / (1024 * 1024);
          if (isFinite(mbps) && mbps > 0) speeds.push(mbps);
        }
      } catch (e) {
      } finally {
        clearTimeout(timeout);
      }
    }

    if (speeds.length === 0) {
      setNetworkStatus("poor");
      setNetworkSpeed(null);
      return;
    }

    speeds.sort((a, b) => a - b);
    const median = speeds[Math.floor(speeds.length / 2)];
    setNetworkSpeed(median);

    if (median > 5) setNetworkStatus("good");
    else if (median >= 1.0) setNetworkStatus("moderate");
    else setNetworkStatus("poor");
  }, []);


  // Test devices
  const testDevices = useCallback(async () => {
    setChecking(true);
    setCameraError(null);
    setMicError(null);

    try {
      // Request camera and microphone access - use lower resolution for faster check
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

      // Check video tracks
      const videoTracks = stream.getVideoTracks();
      const hasVideo =
        videoTracks.length > 0 && videoTracks[0].readyState === "live";

      // Check audio tracks
      const audioTracks = stream.getAudioTracks();
      const hasAudio =
        audioTracks.length > 0 && audioTracks[0].readyState === "live";

      // Set video element source and start face detection
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().then(() => {
          // Start face detection once video is playing and has metadata
          if (hasVideo && videoRef.current) {
            const checkVideoReady = () => {
              if (
                videoRef.current &&
                videoRef.current.readyState >= 2 &&
                videoRef.current.videoWidth > 0 &&
                videoRef.current.videoHeight > 0
              ) {
                // Video is ready, start face detection
                setTimeout(() => {
                  startFaceDetection().catch((err) => {
                    console.error("Failed to start face detection:", err);
                    setFaceValidationMessage("Face detection failed to initialize");
                  });
                }, 500);
              } else {
                // Wait a bit more and check again
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
        setCameraError("Camera is not accessible or not working properly");
      }

      if (!hasAudio) {
        setMicError("Microphone is not accessible or not working properly");
      }

      // Test microphone levels (visual feedback)
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

          // Monitor audio levels - throttled to reduce CPU usage
          let lastUpdate = 0;
          const updateAudioLevel = () => {
            if (!analyserRef.current) return;

            const now = Date.now();
            // Only update every 100ms to reduce CPU usage
            if (now - lastUpdate < 100) {
              animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
              return;
            }
            lastUpdate = now;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            const average =
              dataArray.reduce((a, b) => a + b) / dataArray.length;
            const normalizedLevel = Math.min(average / 100, 1); // Normalize to 0-1
            setAudioLevel(normalizedLevel);

            animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };

          updateAudioLevel();
        } catch (error) {
          // Fail silently or handle appropriately
        }
      }

       testInternetSpeed();


      setLoading(false);
    } catch (error: any) {
      setLoading(false);

      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        setCameraError(
          "Camera/microphone access denied. Please allow access and try again."
        );
        setMicError(
          "Camera/microphone access denied. Please allow access and try again."
        );
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        setCameraError(
          "No camera found. Please connect a camera and try again."
        );
        setMicError(
          "No microphone found. Please connect a microphone and try again."
        );
      } else if (
        error.name === "NotReadableError" ||
        error.name === "TrackStartError"
      ) {
        setCameraError("Camera is already in use by another application.");
        setMicError("Microphone is already in use by another application.");
      } else {
        setCameraError(
          "Failed to access camera. Please check your device settings."
        );
        setMicError(
          "Failed to access microphone. Please check your device settings."
        );
      }
    } finally {
      setChecking(false);
    }
  }, [testInternetSpeed]);

  // Check browser support and auto-test devices on mount
  useEffect(() => {
    // Check if browser supports media devices
    const browserSupported = !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    );

    if (!browserSupported) {
      setDeviceStatus({
        camera: false,
        microphone: false,
        browserSupported: false,
      });
      return;
    }

    // Set browser as supported
    setDeviceStatus((prev) => ({
      ...prev,
      browserSupported: true,
    }));

    // Auto-test devices once on mount
    if (!hasAutoTestedRef.current) {
      hasAutoTestedRef.current = true;
      testDevices();
    }
  }, [testDevices]);

  // Cleanup on unmount - but only stop camera if NOT navigating to assessment
  useEffect(() => {
    return () => {
      // Always cleanup animation frame and audio context
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Only stop camera if NOT navigating to the assessment page
      // This keeps camera on for assessment flow, but turns it off if navigating elsewhere
      if (!isNavigatingToAssessmentRef.current) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        // Clean up global stream reference if not navigating to assessment
        if (typeof window !== "undefined") {
          delete (window as any).__assessmentStream;
          delete (window as any).__assessmentVideoStream;
        }
      } else {
        // Navigating to assessment - ensure stream is preserved
        // Don't clear videoRef.srcObject - let take page reuse it
        // Stream is already stored globally in handleStartAssessment
      }

      analyserRef.current = null;
      setAudioLevel(0);
    };
  }, [stopFaceDetection]);

  // Load assessment details - simplified, don't block on it
  useEffect(() => {
    const loadAssessment = async () => {
      try {
        const data = await assessmentService.getAssessmentDetail(slug);
        setAssessment(data);

        if (!isCurrentDeviceAllowedForAssessment(data)) {
          setDeniedAssessment(data);
          setDeviceAccessDenied(true);
          return;
        }

        // Check if assessment is already submitted — block re-entry.
        // (`is_attempted` is true for in-progress too; only redirect when
        // actually submitted so resume-in-progress still works.)
        // EXCEPTION: if admin has granted an unconsumed retake, the
        // start-assessment endpoint will consume it and create a fresh
        // in-progress submission once the user reaches the take page, so we
        // let the device-check flow proceed.
        if (
          (data.status === "submitted" || data.status === "finalized") &&
          !data.can_reattempt
        ) {
          showToast("This assessment has already been submitted", "warning");
          // replace, not push: don't leave device-check in history so
          // back-navigation can't return here.
          router.replace(`/assessments/${slug}`);
          return;
        }

        // Redirect to take page if proctoring is disabled
        if (data.proctoring_enabled === false) {
          router.push(`/assessments/${slug}/take`);
          return;
        }
      } catch (error: any) {
        // Don't block on error, just show toast
        showToast("Failed to load assessment details", "error");
      } finally {
        setLoading(false);
        setMobileAssessmentGate("ok");
      }
    };

    if (slug) {
      loadAssessment();
    }
  }, [slug, router, showToast, t]);

  const handleStartAssessment = () => {
    if (!deviceStatus.camera || !deviceStatus.microphone) {
      showToast("Please complete all device checks", "error");
      return;
    }

    if (!faceValidationPassed) {
      showToast("Please position your face correctly before starting", "error");
      return;
    }

    const networkTooSlow = networkSpeed !== null && networkSpeed < 0.1;
    if (networkTooSlow) {
      showToast("Connection too slow (<100 kbps). Please switch network.", "error");
      return;
    }

    if (networkStatus === "poor") {
      showToast("Your connection is slow — you may start, but video may buffer.", "warning");
    }

    // Mark that we're navigating to assessment (so cleanup won't stop camera)
    isNavigatingToAssessmentRef.current = true;
    setIsNavigatingToAssessment(true);

    // Store the stream globally so take page can access it (prevents camera from turning off)
    if (streamRef.current) {
      (window as any).__assessmentStream = streamRef.current;
      // Also store on video element for proctoring service to find
      if (videoRef.current && videoRef.current.srcObject) {
        // Keep the stream attached to video element
        (window as any).__assessmentVideoStream = videoRef.current.srcObject;
      }
    }

    // Stop face detection only — keep camera/mic tracks live for the take page (same MediaStream as __assessmentStream)
    stopFaceDetection({ preserveMediaStream: true });

    // Navigate to take assessment page immediately
    router.push(`/assessments/${slug}/take`);
  };

  const networkAllowsProceed = !(networkSpeed !== null && networkSpeed < 0.1);

  const devicesAndBrowserReady =
    deviceStatus.camera &&
    deviceStatus.microphone &&
    deviceStatus.browserSupported;

  const canProceed =
    devicesAndBrowserReady && faceValidationPassed && networkAllowsProceed;

  if (deviceAccessDenied && deniedAssessment) {
    return (
      <MainLayout>
        <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 }, px: 2 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 3,
              border: "1px solid var(--border-default)",
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                backgroundColor: "color-mix(in srgb, var(--warning-500) 18%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              <IconWrapper
                icon="mdi:cellphone-off"
                size={40}
                color="var(--ats-warning-muted)"
              />
            </Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, color: "var(--font-primary-dark)", mb: 1 }}
            >
              {t("assessmentDevice.deviceCheckBlockedTitle")}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "var(--font-secondary)", mb: 3, maxWidth: 480, mx: "auto" }}
            >
              {t("assessmentDevice.deviceCheckBlockedSubtitle")}
            </Typography>
            <Box sx={{ textAlign: "left", mb: 3 }}>
              <AssessmentDeviceStatusPanel
                assessment={deniedAssessment}
                sx={{ mb: 0 }}
              />
            </Box>
            <Button
              variant="contained"
              size="large"
              startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
              onClick={() => router.push(`/assessments/${slug}`)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                px: 3,
                backgroundColor: "var(--accent-indigo)",
                "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
              }}
            >
              {t("assessmentDevice.backToAssessment")}
            </Button>
          </Paper>
        </Container>
      </MainLayout>
    );
  }

  // Don't show loading screen - render immediately for better UX

  if (mobileAssessmentGate === "pending") {
    return (
      <MainLayout>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 360,
            py: 8,
          }}
        >
          <CircularProgress size={40} sx={{ color: "var(--accent-indigo)" }} />
        </Box>
      </MainLayout>
    );
  }

  // ---- Derived, render-only readiness descriptors (no flow gating) ----
  const cameraReady = deviceStatus.camera;
  const micReady = deviceStatus.microphone;

  const cameraTone: ChipTone = cameraReady ? "success" : "error";
  const micTone: ChipTone = micReady ? "success" : "error";
  const netTone: ChipTone =
    networkStatus === "testing" || networkStatus === null
      ? "neutral"
      : !networkAllowsProceed
      ? "error"
      : networkStatus === "poor"
      ? "warning"
      : "success";
  const fsTone: ChipTone = deviceStatus.browserSupported ? "success" : "error";

  const netSub =
    networkStatus === "testing"
      ? "Checking connection..."
      : networkSpeed !== null
      ? `${networkSpeed.toFixed(1)} Mbps — ${
          networkStatus === "good"
            ? "stable"
            : networkStatus === "moderate"
            ? "usable"
            : "slow"
        }`
      : "Connection check required";

  const netChip =
    netTone === "neutral"
      ? "Checking"
      : netTone === "success"
      ? "Ready"
      : netTone === "warning"
      ? "Slow"
      : "Too slow";

  const checklistRows: {
    key: string;
    icon: string;
    name: string;
    sub: string;
    tone: ChipTone;
    chip: string;
  }[] = [
    {
      key: "camera",
      icon: "mdi:camera-outline",
      name: "Camera",
      sub: cameraReady
        ? "Camera is working properly"
        : cameraError || "Camera check required",
      tone: cameraTone,
      chip: cameraReady ? "Ready" : "Pending",
    },
    {
      key: "microphone",
      icon: "mdi:microphone-outline",
      name: "Microphone",
      sub: micReady
        ? "Microphone is working properly"
        : micError || "Microphone check required",
      tone: micTone,
      chip: micReady ? "Ready" : "Pending",
    },
    {
      key: "internet",
      icon: "mdi:wifi",
      name: "Internet connection",
      sub: netSub,
      tone: netTone,
      chip: netChip,
    },
    {
      key: "fullscreen",
      icon: "mdi:fullscreen",
      name: "Fullscreen support",
      sub: deviceStatus.browserSupported
        ? "Browser compatible"
        : "Browser not supported",
      tone: fsTone,
      chip: deviceStatus.browserSupported ? "Ready" : "Unsupported",
    },
  ];

  const assessmentTitle = stripHtmlTags(assessment?.title || "").trim();

  return (
    <MainLayout fullWidthContent>
      <Box
        sx={{
          backgroundColor: "var(--canvas)",
          minHeight: { xs: "calc(100vh - 56px)", sm: "calc(100vh - 64px)" },
          width: "100%",
        }}
      >
        <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
          {/* Eyebrow + title + subtitle */}
          <Box
            sx={{
              textAlign: "center",
              mb: { xs: 3, md: 4 },
              maxWidth: 640,
              mx: "auto",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--ai-pink)",
                mb: 1.25,
              }}
            >
              Before you begin
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                mb: 1.25,
                fontSize: { xs: "1.55rem", md: "2.05rem" },
                color: "var(--font-primary-dark)",
                lineHeight: 1.2,
              }}
            >
              Let&apos;s make sure everything works
            </Typography>
            <Typography
              sx={{
                color: "var(--font-secondary)",
                maxWidth: 540,
                mx: "auto",
                fontSize: "0.95rem",
                lineHeight: 1.6,
              }}
            >
              {assessmentTitle || "This assessment"} is proctored — a quick
              systems check keeps your attempt from being interrupted.
            </Typography>
          </Box>

          {!deviceStatus.browserSupported && (
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: "var(--radius-card)" }}
            >
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Browser not supported
              </Typography>
              <Typography variant="body2">
                Your browser does not support camera/microphone access. Please
                use a modern browser like Chrome, Firefox, Safari, or Edge.
              </Typography>
            </Alert>
          )}

          {/* Two columns: camera preview + readiness checklist */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.05fr 1fr" },
              gap: { xs: 2.5, md: 3 },
              alignItems: "start",
            }}
          >
            {/* LEFT — camera preview */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: "var(--radius-card)",
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--card-bg)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1.5,
                }}
              >
                <IconWrapper
                  icon="mdi:camera-outline"
                  size={18}
                  color="var(--font-secondary)"
                />
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "var(--font-primary-dark)",
                  }}
                >
                  Camera preview
                </Typography>
              </Box>

              <Box
                sx={{
                  position: "relative",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid var(--border-default)",
                  backgroundColor: "var(--assessment-video-letterbox-bg)",
                  aspectRatio: "16 / 10",
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
                      backgroundColor:
                        "color-mix(in srgb, var(--font-dark) 72%, transparent)",
                      zIndex: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "var(--font-light)" }}
                    >
                      Camera preview will appear here
                    </Typography>
                  </Box>
                )}

                {(isFaceDetectionInitializing || isNavigatingToAssessment) && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor:
                        "color-mix(in srgb, var(--font-dark) 86%, transparent)",
                      zIndex: 3,
                    }}
                  >
                    <CircularProgress
                      size={26}
                      sx={{ color: "var(--font-light)" }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: "var(--font-light)" }}
                    >
                      {isNavigatingToAssessment
                        ? "Starting assessment..."
                        : "Initializing face detection..."}
                    </Typography>
                  </Box>
                )}

                <Box
                  component="video"
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    objectFit: "cover",
                    backgroundColor: "var(--assessment-video-letterbox-bg)",
                  }}
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      videoRef.current.play().catch(() => {
                        // Handle play error
                      });
                    }
                  }}
                />

                {faceValidationPassed && !isNavigatingToAssessment && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      zIndex: 2,
                      borderRadius: 999,
                      boxShadow:
                        "0 4px 14px -4px color-mix(in srgb, var(--font-dark) 55%, transparent)",
                    }}
                  >
                    <StatusChip
                      label="Face detected"
                      tone="success"
                      icon="mdi:check"
                    />
                  </Box>
                )}
              </Box>

              {deviceStatus.camera &&
                !isFaceDetectionInitializing &&
                !isNavigatingToAssessment &&
                !faceValidationPassed && (
                  <Box
                    sx={{
                      mt: 1.25,
                      display: "flex",
                      gap: 0.75,
                      alignItems: "flex-start",
                      color: "var(--warning-500)",
                    }}
                  >
                    <IconWrapper
                      icon="mdi:alert-circle-outline"
                      size={16}
                      color="var(--warning-500)"
                    />
                    <Typography sx={{ fontSize: "0.78rem", lineHeight: 1.5 }}>
                      {faceValidationMessage ||
                        "Position your face in the frame — look at the screen, one person only."}
                    </Typography>
                  </Box>
                )}

              {/* Mic level */}
              <Box sx={{ mt: 2.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 0.75,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: "var(--font-primary-dark)",
                    }}
                  >
                    Mic level
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      color: "var(--font-secondary)",
                    }}
                  >
                    {audioLevel > 0.1 ? "Sounds good" : "Speak to test your mic"}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={audioLevel * 100}
                  sx={{
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: "var(--border-default)",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: "var(--success-500)",
                      borderRadius: 999,
                    },
                  }}
                />
              </Box>
            </Paper>

            {/* RIGHT — readiness checklist */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: "var(--radius-card)",
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--card-bg)",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "var(--font-primary-dark)",
                  mb: 2,
                }}
              >
                System readiness
              </Typography>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}
              >
                {checklistRows.map((row) => {
                  const toneColor = ROW_TONE_COLOR[row.tone];
                  return (
                    <Box
                      key={row.key}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        p: 1.25,
                        borderRadius: 12,
                        border: "1px solid var(--border-default)",
                        backgroundColor: "var(--surface)",
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: `color-mix(in srgb, ${toneColor} 14%, var(--surface) 86%)`,
                        }}
                      >
                        <IconWrapper
                          icon={row.icon}
                          size={20}
                          color={toneColor}
                        />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            color: "var(--font-primary-dark)",
                          }}
                        >
                          {row.name}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.78rem",
                            color: "var(--font-secondary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.sub}
                        </Typography>
                      </Box>
                      <StatusChip label={row.chip} tone={row.tone} />
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </Box>

          {/* Amber tip banner */}
          <Box
            sx={{
              mt: 3,
              display: "flex",
              gap: 1.5,
              alignItems: "flex-start",
              p: 2,
              borderRadius: "var(--radius-card)",
              backgroundColor:
                "color-mix(in srgb, var(--warning-500) 10%, var(--card-bg))",
              border:
                "1px solid color-mix(in srgb, var(--warning-500) 30%, transparent)",
            }}
          >
            <IconWrapper
              icon="mdi:lightbulb-on-outline"
              size={20}
              color="var(--warning-500)"
            />
            <Typography
              sx={{
                fontSize: "0.85rem",
                color: "var(--font-primary-dark)",
                lineHeight: 1.6,
              }}
            >
              <Box component="span" sx={{ fontWeight: 700 }}>
                Tip:
              </Box>{" "}
              find a quiet, well-lit spot. Once you start, leaving fullscreen or
              switching tabs will be flagged and may pause your timer.
            </Typography>
          </Box>

          {/* Actions */}
          <Box
            sx={{
              mt: 3,
              mx: "auto",
              maxWidth: 520,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              alignItems: "stretch",
            }}
          >
            {canProceed ? (
              <Button
                fullWidth
                size="large"
                onClick={handleStartAssessment}
                startIcon={
                  <IconWrapper
                    icon="mdi:fullscreen"
                    size={22}
                    color="var(--font-light)"
                  />
                }
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "1rem",
                  py: 1.5,
                  borderRadius: "var(--radius-card)",
                  background: "var(--gradient-ai)",
                  color: "var(--font-light)",
                  boxShadow:
                    "0 14px 30px -12px color-mix(in srgb, var(--ai-pink) 65%, transparent)",
                  "&:hover": {
                    background: "var(--gradient-ai)",
                    filter: "brightness(1.05)",
                  },
                }}
              >
                Enter fullscreen &amp; begin
              </Button>
            ) : (
              <>
                {devicesAndBrowserReady &&
                  faceValidationPassed &&
                  !networkAllowsProceed && (
                    <Alert
                      severity={networkStatus === "poor" ? "error" : "info"}
                      sx={{ borderRadius: "var(--radius-card)" }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {networkStatus === "testing" || networkStatus === null
                          ? t("assessments.deviceCheck.networkWaitTest")
                          : t("assessments.deviceCheck.networkPoorCannotStart")}
                      </Typography>
                    </Alert>
                  )}

                {devicesAndBrowserReady &&
                  faceValidationPassed &&
                  !networkAllowsProceed && (
                    <Button
                      fullWidth
                      variant="outlined"
                      size="large"
                      onClick={() => void testInternetSpeed()}
                      disabled={networkStatus === "testing"}
                      startIcon={
                        networkStatus === "testing" ? (
                          <CircularProgress size={20} />
                        ) : (
                          <IconWrapper icon="mdi:wifi-refresh" size={22} />
                        )
                      }
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        py: 1.4,
                        borderRadius: "var(--radius-card)",
                        borderColor: "var(--accent-indigo)",
                        color: "var(--accent-indigo-dark)",
                      }}
                    >
                      {t("assessments.deviceCheck.recheckInternet")}
                    </Button>
                  )}

                {(!deviceStatus.camera || !deviceStatus.microphone) && (
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={testDevices}
                    disabled={checking || !deviceStatus.browserSupported}
                    startIcon={
                      checking ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <IconWrapper
                          icon="mdi:camera-retake-outline"
                          size={22}
                        />
                      )
                    }
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      py: 1.4,
                      borderRadius: "var(--radius-card)",
                      backgroundColor: "var(--accent-indigo)",
                      "&:hover": {
                        backgroundColor: "var(--accent-indigo-dark)",
                      },
                    }}
                  >
                    {checking
                      ? "Checking devices..."
                      : "Test camera & microphone"}
                  </Button>
                )}
              </>
            )}

            <Button
              variant="text"
              onClick={() => router.push(`/assessments/${slug}`)}
              startIcon={
                <IconWrapper
                  icon="mdi:arrow-left"
                  size={18}
                  color="var(--font-secondary)"
                />
              }
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: "var(--font-secondary)",
                alignSelf: "center",
                "&:hover": {
                  backgroundColor: "transparent",
                  color: "var(--font-primary-dark)",
                },
              }}
            >
              Back to assessment
            </Button>
          </Box>
        </Container>
      </Box>
    </MainLayout>
  );
}
