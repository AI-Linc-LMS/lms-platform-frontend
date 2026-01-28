"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
import mockInterviewService from "@/lib/services/mock-interview.service";
import { CheckCircle, XCircle, Video, Mic } from "lucide-react";

interface DeviceStatus {
  camera: boolean;
  microphone: boolean;
  browserSupported: boolean;
}

export default function MockInterviewDeviceCheckPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    camera: false,
    microphone: false,
    browserSupported: false,
  });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [canProceed, setCanProceed] = useState(false);
  const [ttsText] = useState<string>(
    "This is a test of my microphone and speech recognition."
  );
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string>("");
  const [ttsMatch, setTtsMatch] = useState<boolean>(false);
  const [recognition, setRecognition] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isNavigatingToInterviewRef = useRef(false);

  // Check browser support and initialize speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isSupported =
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    setDeviceStatus((prev) => ({ ...prev, browserSupported: !!isSupported }));

    if (!isSupported) {
      setLoading(false);
      showToast(
        "Your browser doesn't support camera/microphone access",
        "error"
      );
    }

    // Initialize Speech Recognition
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

        // Simple text matching (case-insensitive, remove punctuation)
        const normalize = (text: string) =>
          text
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .trim();
        const normalizedTts = normalize(ttsText);
        const normalizedRecognized = normalize(transcript);

        // Check if recognized text contains key phrases from TTS text
        const ttsWords = normalizedTts.split(/\s+/);
        const recognizedWords = normalizedRecognized.split(/\s+/);
        const matchRatio =
          ttsWords.filter((word) => recognizedWords.includes(word)).length /
          ttsWords.length;

        const isMatch = matchRatio >= 0.5; // At least 50% word match
        setTtsMatch(isMatch);
        setIsListening(false);

        if (isMatch) {
          showToast("Speech recognition successful! Text matches.", "success");
        } else {
          showToast("Text doesn't match. Please try again.", "error");
        }
      };

      recognitionInstance.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === "no-speech") {
          showToast("No speech detected. Please try again.", "error");
        } else if (event.error === "not-allowed") {
          showToast("Microphone permission denied.", "error");
        } else {
          showToast("Speech recognition error. Please try again.", "error");
        }
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    } else {
      showToast("Speech recognition not supported in this browser", "warning");
    }
  }, [showToast, ttsText]);

  // Test devices
  const testDevices = async () => {
    setChecking(true);
    setCameraError(null);
    setMicError(null);

    try {
      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
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

      streamRef.current = stream;

      // Check video tracks
      const videoTracks = stream.getVideoTracks();
      const hasVideo =
        videoTracks.length > 0 && videoTracks[0].readyState === "live";

      // Check audio tracks
      const audioTracks = stream.getAudioTracks();
      const hasAudio =
        audioTracks.length > 0 && audioTracks[0].readyState === "live";

      // Set video element source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Play immediately - no delay
        videoRef.current.play().catch(() => {
          // Handle play error silently
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

          // Monitor audio levels continuously
          const updateAudioLevel = () => {
            if (!analyserRef.current) return;

            const dataArray = new Uint8Array(
              analyserRef.current.frequencyBinCount
            );
            analyserRef.current.getByteFrequencyData(dataArray);
            const average =
              dataArray.reduce((a, b) => a + b) / dataArray.length;
            const normalizedLevel = Math.min(average / 100, 1);
            setAudioLevel(normalizedLevel);

            animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };

          updateAudioLevel();
        } catch (error) {
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
  };

  // Auto-start device testing when page loads
  useEffect(() => {
    if (deviceStatus.browserSupported && !checking && loading) {
      testDevices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceStatus.browserSupported]);

  // Cleanup on unmount - but only stop camera if NOT navigating to interview
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

      // Only stop camera if NOT navigating to the interview take page
      // This keeps camera on for interview flow, but turns it off if navigating elsewhere
      if (!isNavigatingToInterviewRef.current) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }

      analyserRef.current = null;
      setAudioLevel(0);
    };
  }, []);

  const handleStartTTS = () => {
    if (!recognition) {
      showToast("Speech recognition not available", "error");
      return;
    }
    setIsListening(true);
    setRecognizedText("");
    setTtsMatch(false);
    recognition.start();
  };

  const handleProceed = async () => {
    if (!deviceStatus.camera || !deviceStatus.microphone || !ttsMatch) {
      showToast("Please complete all device checks", "error");
      return;
    }
    try {
      // Set flag to prevent camera cleanup when navigating
      isNavigatingToInterviewRef.current = true;

      // Store the stream globally so take page can access it
      // Use window object to persist across navigation
      if (streamRef.current) {
        (window as any).__mockInterviewStream = streamRef.current;
      }

      // Start the interview
      await mockInterviewService.startInterview(Number(params.id));

      // Navigate to take page - camera stream will persist
      router.push(`/mock-interview/${params.id}/take`);
    } catch (error) {
      isNavigatingToInterviewRef.current = false; // Reset on error
      showToast("Failed to start interview", "error");
    }
  };

  // Update canProceed when all conditions are met
  useEffect(() => {
    setCanProceed(deviceStatus.camera && deviceStatus.microphone && ttsMatch);
  }, [deviceStatus.camera, deviceStatus.microphone, ttsMatch]);


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
            Before starting your interview, we need to verify that your camera
            and microphone are working properly. This ensures a smooth interview
            experience.
          </Typography>
        </Box>

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
                  ? "2px solid #10b981"
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
            </Box>
          </Paper>

          {/* TTS and mic Verification */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #e5e7eb",
              backgroundColor: ttsMatch ? "#f0fdf4" : "#fef2f2",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              {ttsMatch ? (
                <CheckCircle size={32} color="#10b981" />
              ) : (
                <XCircle size={32} color="#ef4444" />
              )}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Speech Recognition and Microphone Test
                </Typography>
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  {ttsMatch
                    ? "Text matches successfully"
                    : "Read the text below to verify your microphone"}
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
              </Box>
            </Box>

            {/* Text to Read */}
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
                "{ttsText}"
              </Typography>
            </Paper>

            {/* Recognition Status */}
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
                  Listening... Please speak the text above.
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
                  Recognized Text:
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
                    Text doesn't match. Please try again.
                  </Typography>
                )}
              </Box>
            )}

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
              {isListening ? "Listening..." : "Start Speech Test"}
            </Button>
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
              onClick={handleProceed}
              endIcon={<IconWrapper icon="mdi:arrow-right" size={24} />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                px: 4,
                py: 1.5,
                backgroundColor: "#10b981",
                "&:hover": {
                  backgroundColor: "#059669",
                },
              }}
            >
              Proceed to Interview
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
                Your camera and microphone are essential for the interview
                process. We use your camera to monitor the interview session and
                ensure a fair assessment. Your microphone is used to record your
                answers to interview questions and analyze your speech using
                Text-to-Speech (TTS) technology for accurate evaluation. Both
                devices must be working properly before you can proceed.
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </MainLayout>
  );
}
