"use client";

import { useEffect, useState, useRef, use, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { assessmentService } from "@/lib/services/assessment.service";
import { useProctoring } from "@/lib/hooks/useProctoring";
import { CheckCircle, XCircle, Video, Mic, AlertCircle } from "lucide-react";

interface DeviceStatus {
  camera: boolean;
  microphone: boolean;
  browserSupported: boolean;
}

export default function DeviceCheckPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false); // Start with false - don't block initial render
  const [checking, setChecking] = useState(false);
  const [, setAssessment] = useState<any>(null);
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

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isNavigatingToAssessmentRef = useRef(false);
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
    minConfidence: 0.4,
    smoothFrameCount: 3,
    poorLightingThreshold: 0.4,
    minConfidenceForValidFace: 0.82, // Stricter on device check: reject hand covering face
    onViolation: (violation) => {
      setFaceValidationPassed(false);
      setFaceValidationMessage(violation.message);
    },
    onStatusChange: () => {
      // Status change will trigger useEffect below to update validation
    },
    onFaceCountChange: (count) => {
      if (count === 0) {
        setFaceValidationPassed(false);
        setFaceValidationMessage("No face detected. Please position yourself in front of the camera.");
      } else if (count > 1) {
        setFaceValidationPassed(false);
        setFaceValidationMessage(`${count} faces detected. Only one person should be visible.`);
      }
      // For count === 1, useEffect below will check status
    },
  });

  // Update face validation status when faceCount or faceStatus changes
  useEffect(() => {
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
  }, []);

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

        // Check if assessment is already attempted
        if (data.is_attempted) {
          showToast("This assessment has already been submitted", "warning");
          router.push(`/assessments/${slug}`);
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
      }
    };

    if (slug) {
      loadAssessment();
    }
  }, [slug, router, showToast]);

  const handleStartAssessment = () => {
    if (!deviceStatus.camera || !deviceStatus.microphone) {
      showToast("Please complete all device checks", "error");
      return;
    }

    if (!faceValidationPassed) {
      showToast("Please position your face correctly before starting", "error");
      return;
    }

    // Mark that we're navigating to assessment (so cleanup won't stop camera)
    isNavigatingToAssessmentRef.current = true;

    // Store the stream globally so take page can access it (prevents camera from turning off)
    if (streamRef.current) {
      (window as any).__assessmentStream = streamRef.current;
      // Also store on video element for proctoring service to find
      if (videoRef.current && videoRef.current.srcObject) {
        // Keep the stream attached to video element
        (window as any).__assessmentVideoStream = videoRef.current.srcObject;
      }
    }

    // Stop face detection before navigating (it will restart in the assessment page)
    stopFaceDetection();

    // Navigate to take assessment page immediately
    router.push(`/assessments/${slug}/take`);
  };

  const canProceed =
    deviceStatus.camera &&
    deviceStatus.microphone &&
    deviceStatus.browserSupported &&
    faceValidationPassed;

  // Don't show loading screen - render immediately for better UX

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Header */}
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
            Device Check
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#6b7280", maxWidth: 500, mx: "auto" }}
          >
            Before starting your assessment, we need to verify that your camera
            and microphone are working properly. This ensures a smooth
            assessment experience.
          </Typography>
        </Box>

        {!deviceStatus.browserSupported && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Browser Not Supported
            </Typography>
            <Typography variant="body2">
              Your browser does not support camera/microphone access. Please use
              a modern browser like Chrome, Firefox, Safari, or Edge.
            </Typography>
          </Alert>
        )}

        {/* Device Status Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 3,
            mb: 4,
          }}
        >
          {/* Camera Status */}
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
                  Camera
                </Typography>
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  {deviceStatus.camera
                    ? "Camera is working properly"
                    : "Camera check required"}
                </Typography>
              </Box>
            </Box>

            {cameraError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {cameraError}
              </Alert>
            )}

            {/* Video Preview - Always render, show when camera is working */}
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
                    Camera preview will appear here
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
                    videoRef.current.play().catch(() => {
                      // Handle play error
                    });
                  }
                }}
              />
              
              {/* Face Detection Status Overlay */}
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
                      label="Initializing face detection..."
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

            {/* Face Validation Message */}
            {deviceStatus.camera && !isFaceDetectionInitializing && (
              <Box sx={{ mt: 2 }}>
                {faceValidationPassed ? (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      ✓ Face detected and positioned correctly. You can proceed.
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      {faceValidationMessage ||
                        "Please position your face in front of the camera. Make sure you're looking at the screen, not too close or too far, and only one person is visible."}
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}
          </Paper>

          {/* Microphone Status */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #e5e7eb",
              backgroundColor: deviceStatus.microphone ? "#f0fdf4" : "#fef2f2",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              {deviceStatus.microphone ? (
                <CheckCircle size={32} color="#10b981" />
              ) : (
                <XCircle size={32} color="#ef4444" />
              )}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Microphone
                </Typography>
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  {deviceStatus.microphone
                    ? "Microphone is working properly"
                    : "Microphone check required"}
                </Typography>
              </Box>
            </Box>

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
                  Audio Level
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
                    ? "Speak to test your microphone"
                    : "Microphone is ready"}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {!canProceed
            ? (!deviceStatus.camera || !deviceStatus.microphone) && (
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
                    "&:hover": {
                      backgroundColor: "#4f46e5",
                    },
                  }}
                >
                  {checking
                    ? "Checking Devices..."
                    : "Test Camera & Microphone"}
                </Button>
              )
            : null}

          {canProceed && (
            <Button
              variant="contained"
              size="large"
              onClick={handleStartAssessment}
              endIcon={<IconWrapper icon="mdi:arrow-right" size={24} />}
              disabled={!faceValidationPassed}
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
                ? "Start Assessment"
                : "Position Face Correctly"}
            </Button>
          )}

          <Button
            variant="outlined"
            size="large"
            onClick={() => router.push(`/assessments/${slug}`)}
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
            Cancel
          </Button>
        </Box>

        {/* Info Box */}
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
                Why do we need this?
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#1e40af", fontSize: "0.875rem", lineHeight: 1.7 }}
              >
                Your camera and microphone are essential for the assessment
                process. We use your camera to monitor the assessment session
                and ensure a fair evaluation. Your microphone is used to record
                your answers and analyze your speech using Text-to-Speech (TTS)
                technology for accurate evaluation. Both devices must be working
                properly before you can proceed.
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </MainLayout>
  );
}
