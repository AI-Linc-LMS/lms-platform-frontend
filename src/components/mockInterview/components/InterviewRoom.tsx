import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import useFullscreenControl from "../hooks/useFullscreenControl";
import InterviewSetup from "./InterviewSetup";
import ActiveInterviewSession from "./ActiveInterviewSession";
import { mockInterviewAPI, InterviewEvent } from "../services/api";
import { getQuestions } from "../utils/questionGenerator";
import { useProctoring } from "../proctoring/useProctoring";
import {
  aiInterviewerVoice,
  AI_INTERVIEWER_SCRIPTS,
} from "../utils/speechSynthesis";

interface InterviewRoomProps {
  topic: string;
  difficulty: string;
  onBack: () => void;
  onComplete: () => void;
}

const InterviewRoom = ({
  topic,
  difficulty,
  onBack,
  onComplete,
}: InterviewRoomProps) => {
  // Proctoring
  const { eventLog, getEventLog } = useProctoring();

  // Interview attempt ID
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // State management
  const [isRecording, setIsRecording] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAvatarAsking, setIsAvatarAsking] = useState(false);
  const [userResponse, setUserResponse] = useState("");
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [interviewEvents, setInterviewEvents] = useState<InterviewEvent[]>([]);
  const [submissionData, setSubmissionData] = useState({
    warnings: [] as string[],
    events: [] as InterviewEvent[],
    faceValidationFailures: 0,
    multipleFaceDetections: 0,
    fullscreenExits: 0,
    tabSwitches: 0,
    windowSwitches: 0,
    audioIssues: 0,
    totalDuration: 0,
  });
  const [preInitializedStream, setPreInitializedStream] =
    useState<MediaStream | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioCanvasRef = useRef<HTMLCanvasElement>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const chunkIndexRef = useRef<number>(0);
  const answerStartTimeRef = useRef<number>(0);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [hasGivenIntroduction, setHasGivenIntroduction] = useState(false);
  const [isRecordingAnswer, setIsRecordingAnswer] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  // Lightweight face detection (no canvas overlay)
  const [faceStatus, setFaceStatus] = useState<"single" | "none" | "multiple">(
    "single"
  );
  const faceDetectionIntervalRef = useRef<number | null>(null);
  const blazeFaceModelRef = useRef<any>(null);

  // Custom hooks
  const fullscreenControl = useFullscreenControl(containerRef);

  // Initialize Speech Recognition ONCE (not dependent on isRecordingAnswer)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("⚠️ Speech Recognition not supported in this browser");
      alert(
        "Speech recognition is not supported in your browser. Please use Chrome or Edge."
      );
      return;
    }

    // Request microphone permission explicitly
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        console.log("✅ Microphone access granted");
      })
      .catch((error) => {
        console.error("❌ Microphone access denied:", error);
        alert(
          "Microphone access is required for speech-to-text. Please allow microphone access."
        );
      });

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Changed to false - restart manually for better control
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log("🎤 Speech recognition started successfully");
      };

      recognition.onresult = (event: any) => {
        console.log("🎙️ Speech detected!");
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
            console.log("✅ Final transcript:", transcript);
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setCurrentTranscript((prev) => {
            const updated = prev + finalTranscript;
            console.log("📝 Updated transcript:", updated);
            return updated;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error("❌ Speech recognition error:", event.error);

        if (
          event.error === "not-allowed" ||
          event.error === "service-not-allowed"
        ) {
          alert(
            "Microphone permission denied. Please enable microphone access in your browser settings."
          );
        } else if (event.error === "no-speech") {
          console.log("⚠️ No speech detected, continuing to listen...");
        } else if (event.error === "network") {
          console.error(
            "Network error - speech recognition may not work offline"
          );
        }
      };

      recognition.onend = () => {
        console.log("🔇 Speech recognition ended");
        // Auto-restart if still in recording mode
        setTimeout(() => {
          if (recognitionRef.current && isRecordingAnswer) {
            try {
              console.log("🔄 Restarting speech recognition automatically...");
              recognitionRef.current.start();
            } catch (error: any) {
              if (error.message.includes("already started")) {
                console.log("ℹ️ Recognition already running");
              } else {
                console.error("Failed to restart recognition:", error);
              }
            }
          }
        }, 100);
      };

      recognitionRef.current = recognition;
      console.log("✅ Speech Recognition initialized and ready");
    } catch (error) {
      console.error("❌ Failed to initialize speech recognition:", error);
      alert(
        "Failed to initialize speech recognition. Please refresh and try again."
      );
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          console.log("🛑 Speech recognition stopped on cleanup");
        } catch (e) {
          // Silent
        }
      }
    };
  }, []); // Only initialize ONCE on mount

  // Initialize lightweight face detection with retry logic
  const [faceDetectionReady, setFaceDetectionReady] = useState(false);
  const MAX_DETECTION_RETRIES = 3;

  useEffect(() => {
    const initFaceDetection = async (retryCount = 0) => {
      try {
        console.log(
          `🔄 Initializing face detection (attempt ${
            retryCount + 1
          }/${MAX_DETECTION_RETRIES})...`
        );

        // Load TensorFlow.js
        const tf = await import("@tensorflow/tfjs");
        await tf.setBackend("webgl");
        await tf.ready();
        console.log("✅ TensorFlow.js ready");

        // Load BlazeFace model
        const blazeface = await import("@tensorflow-models/blazeface");
        const model = await blazeface.load();
        blazeFaceModelRef.current = model;
        setFaceDetectionReady(true);
        console.log("✅ Face detection model loaded successfully");
      } catch (error) {
        console.error(
          `❌ Failed to load face detection (attempt ${retryCount + 1}):`,
          error
        );

        // Retry loading
        if (retryCount < MAX_DETECTION_RETRIES - 1) {
          console.log(`🔄 Retrying in 2 seconds...`);
          setTimeout(() => {
            initFaceDetection(retryCount + 1);
          }, 2000);
        } else {
          console.error("❌ Face detection failed after all retries");
          alert(
            "Face detection could not be initialized. Interview will continue without face monitoring."
          );
        }
      }
    };

    initFaceDetection();
  }, []);

  // Track face detection violations
  const lastFaceStatusRef = useRef<string>("single");
  const noFaceCountRef = useRef<number>(0);
  const multipleFaceCountRef = useRef<number>(0);

  // Start face detection when recording - MAXIMUM ROBUSTNESS
  useEffect(() => {
    if (
      isRecording &&
      videoRef.current &&
      blazeFaceModelRef.current &&
      faceDetectionReady
    ) {
      console.log("👀 Starting ROBUST face detection with violation tracking...");

      let consecutiveErrors = 0;
      const MAX_CONSECUTIVE_ERRORS = 3; // Reduced for faster recovery
      let detectionActive = true;
      let lastSuccessfulDetection = Date.now();

      const detectFaces = async () => {
        if (!detectionActive) return;

        try {
          // Comprehensive video validation
          if (!videoRef.current || !videoRef.current.srcObject) {
            console.log("⚠️ Video or stream not available");
            return;
          }

          // Check video readiness
          if (videoRef.current.readyState < 2) {
            console.log("⚠️ Video not ready, readyState:", videoRef.current.readyState);
            return;
          }

          // Check video dimensions
          const width = videoRef.current.videoWidth;
          const height = videoRef.current.videoHeight;
          
          if (width === 0 || height === 0) {
            console.log("⚠️ Invalid video dimensions:", width, height);
            return;
          }

          // Ensure video is playing
          if (videoRef.current.paused) {
            try {
              await videoRef.current.play();
            } catch (playError) {
              console.error("Failed to play video:", playError);
              return;
            }
          }

          // Perform face detection
          const predictions = await blazeFaceModelRef.current.estimateFaces(
            videoRef.current,
            false
          );
          const faceCount = predictions.length;

          // Reset error counter and update last successful detection
          consecutiveErrors = 0;
          lastSuccessfulDetection = Date.now();

          // Update face status dynamically
          const newStatus =
            faceCount === 0 ? "none" : faceCount === 1 ? "single" : "multiple";

          // Log status changes
          if (newStatus !== lastFaceStatusRef.current) {
            console.log(
              `👤 Face status changed: ${lastFaceStatusRef.current} → ${newStatus} (${faceCount} faces)`
            );
            lastFaceStatusRef.current = newStatus;

            // Log proctoring violations
            if (newStatus === "none") {
              noFaceCountRef.current++;
              logEvent(
                "no_face",
                {
                  timestamp: Date.now(),
                  count: noFaceCountRef.current,
                  message: "No face detected in camera view",
                },
                "warning"
              );

              setSubmissionData((prev) => ({
                ...prev,
                faceValidationFailures: prev.faceValidationFailures + 1,
              }));

              console.warn(
                `⚠️ NO FACE DETECTED (Total violations: ${noFaceCountRef.current})`
              );
            } else if (newStatus === "multiple") {
              multipleFaceCountRef.current++;
              logEvent(
                "multiple_faces",
                {
                  timestamp: Date.now(),
                  count: multipleFaceCountRef.current,
                  faceCount: faceCount,
                  message: "Multiple faces detected",
                },
                "warning"
              );

              setSubmissionData((prev) => ({
                ...prev,
                multipleFaceDetections: prev.multipleFaceDetections + 1,
              }));

              console.warn(
                `⚠️ MULTIPLE FACES DETECTED: ${faceCount} (Total violations: ${multipleFaceCountRef.current})`
              );
            } else {
              console.log("✅ Single face detected - OK");
            }
          }

          setFaceStatus(newStatus);
        } catch (error) {
          consecutiveErrors++;
          const timeSinceLastSuccess = Date.now() - lastSuccessfulDetection;
          
          console.error(
            `❌ Face detection error (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}, ${Math.round(timeSinceLastSuccess/1000)}s since last success):`,
            error
          );

          // If too many consecutive errors OR too long without success, try to recover
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS || timeSinceLastSuccess > 10000) {
            console.warn(
              "⚠️ Face detection failing, attempting FULL recovery..."
            );
            consecutiveErrors = 0;
            detectionActive = false; // Pause detection during recovery

            // Comprehensive recovery strategy
            try {
              // Step 1: Clear the old model
              blazeFaceModelRef.current = null;
              
              // Step 2: Give it a moment to cleanup
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Step 3: Reload TensorFlow backend
              const tf = await import("@tensorflow/tfjs");
              await tf.setBackend('webgl');
              await tf.ready();
              console.log("✅ TensorFlow backend reinitialized");
              
              // Step 4: Reload BlazeFace model
              const blazeface = await import("@tensorflow-models/blazeface");
              const model = await blazeface.load();
              blazeFaceModelRef.current = model;
              
              console.log("✅ Face detection model FULLY reloaded");
              
              // Step 5: Resume detection
              detectionActive = true;
              lastSuccessfulDetection = Date.now();
              
            } catch (reloadError) {
              console.error("❌ Failed to recover face detection:", reloadError);
              // Try one more time after a longer wait
              setTimeout(async () => {
                try {
                  const blazeface = await import("@tensorflow-models/blazeface");
                  const model = await blazeface.load();
                  blazeFaceModelRef.current = model;
                  detectionActive = true;
                  console.log("✅ Face detection recovered on retry");
                } catch (e) {
                  console.error("❌ Final recovery attempt failed:", e);
                }
              }, 2000);
            }
          }
        }
      };

      // Run detection at optimal frequency (300ms for stability)
      faceDetectionIntervalRef.current = window.setInterval(detectFaces, 300);

      // Run first detection after a brief delay to ensure video is fully ready
      setTimeout(detectFaces, 500);

      // Health check interval - monitor detection health
      const healthCheckInterval = setInterval(() => {
        const timeSinceLastSuccess = Date.now() - lastSuccessfulDetection;
        if (timeSinceLastSuccess > 15000) {
          console.warn(`⚠️ No successful face detection in ${Math.round(timeSinceLastSuccess/1000)}s - detection may be stalled`);
        }
      }, 5000);

      return () => {
        detectionActive = false;
        
        if (faceDetectionIntervalRef.current) {
          clearInterval(faceDetectionIntervalRef.current);
          console.log("👀 Face detection stopped");
          console.log(
            `📊 Final face violation stats: No face: ${noFaceCountRef.current}, Multiple faces: ${multipleFaceCountRef.current}`
          );
        }
        
        if (healthCheckInterval) {
          clearInterval(healthCheckInterval);
        }
      };
    }
  }, [isRecording]); // logEvent is stable, no need in deps

  // Get questions - MEMOIZED to prevent re-generation
  const questions = useMemo(() => {
    return getQuestions(topic, difficulty, 10);
  }, [topic, difficulty]);

  // Current question - MEMOIZED to prevent re-triggering avatar speech
  const currentQuestion = useMemo(() => {
    return questions[currentQuestionIndex];
  }, [questions, currentQuestionIndex]);

  // Helper function to log events
  const logEvent = useCallback(
    (
      type: InterviewEvent["type"],
      data: any,
      severity: InterviewEvent["severity"] = "info"
    ) => {
      const event: InterviewEvent = {
        timestamp: Date.now(),
        type,
        data,
        severity,
      };

      setInterviewEvents((prev) => [...prev, event]);

      setSubmissionData((prev) => ({
        ...prev,
        events: [...prev.events, event],
        warnings:
          severity === "warning" || severity === "error"
            ? [...prev.warnings, `${type}: ${JSON.stringify(data)}`]
            : prev.warnings,
      }));

      if (attemptId) {
        mockInterviewAPI.trackEvent(attemptId, event).catch(() => {});
      }
    },
    [attemptId]
  );

  // Track proctoring events - LIVE
  useEffect(() => {
    const proctoringEvents = getEventLog();
    const tabSwitches = proctoringEvents.filter(
      (e) => e.type === "TAB_BLUR"
    ).length;
    const windowSwitches = proctoringEvents.filter(
      (e) => e.type === "WINDOW_BLUR"
    ).length;

    setSubmissionData((prev) => ({
      ...prev,
      tabSwitches,
      windowSwitches,
    }));
  }, [eventLog, getEventLog]);

  // Keyboard lock
  const lockKeyboard = useCallback(async () => {
    try {
      if ("keyboard" in navigator && "lock" in (navigator as any).keyboard) {
        await (navigator as any).keyboard.lock(["Escape"]);
      }
    } catch (error) {
      // Not available
    }

    const preventEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "F11") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener("keydown", preventEscape, true);

    return () => {
      document.removeEventListener("keydown", preventEscape, true);
      if ("keyboard" in navigator && "unlock" in (navigator as any).keyboard) {
        (navigator as any).keyboard.unlock();
      }
    };
  }, []);

  // Handle camera ready
  const handleCameraReady = useCallback(
    (stream: MediaStream) => {
      setPreInitializedStream(stream);
      logEvent("camera_ready", { status: "pre_initialized" }, "info");
    },
    [logEvent]
  );

  // Format time
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Timer functions
  const startTimer = () => {
    if (timerIntervalRef.current === null) {
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopTimer = () => {
    if (timerIntervalRef.current !== null) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // Audio visualization
  const setupAudioVisualization = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.85;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      visualizeAudio();
    } catch (error) {
      // Failed
    }
  };

  const visualizeAudio = () => {
    if (!analyserRef.current || !audioCanvasRef.current) return;

    const canvas = audioCanvasRef.current;
    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) return;

    const bufferLength = analyserRef.current.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyserRef.current) return;

      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = "rgba(0, 0, 0, 0.1)";
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      canvasCtx.lineWidth = 3;
      canvasCtx.strokeStyle = "rgb(16, 185, 129)";
      canvasCtx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();

      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      const normalizedLevel = Math.min(100, ((average - 128) / 128) * 100);
      setAudioLevel(Math.abs(normalizedLevel));
    };

    draw();
  };

  // Start interview
  const handleStartInterview = async () => {
    if (!preInitializedStream) {
      alert("Camera not ready. Please wait...");
      return;
    }

    // Initialize with backend
    try {
      const { attemptId: newAttemptId } = await mockInterviewAPI.startInterview(
        topic,
        difficulty
      );
      setAttemptId(newAttemptId);
      logEvent(
        "question_change",
        { action: "interview_started", attemptId: newAttemptId },
        "info"
      );
    } catch (error) {
      const localId = `local-${Date.now()}`;
      setAttemptId(localId);
      logEvent(
        "question_change",
        { action: "interview_started", attemptId: localId },
        "info"
      );
    }

    streamRef.current = preInitializedStream;
    setIsRecording(true);
    startTimer();

    // Setup video
    if (videoRef.current) {
      const video = videoRef.current;
      video.srcObject = preInitializedStream;
      video.playsInline = true;
      video.muted = true;
      video.play().catch(() => {});
      setTimeout(() => setIsVideoReady(true), 300);
    }

    // Enter fullscreen
    try {
      await fullscreenControl.enterFullscreen();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await lockKeyboard();
      if ((window as any).__lockFullscreen) {
        (window as any).__lockFullscreen();
      }
    } catch (err) {
      // Continue anyway
    }

    // Setup MediaRecorder with chunk uploading
    const mediaRecorder = new MediaRecorder(preInitializedStream, {
      mimeType: "video/webm;codecs=vp8,opus",
    });

    recordedChunksRef.current = [];

    mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);

        if (attemptId) {
          try {
            await mockInterviewAPI.uploadMediaChunk(
              attemptId,
              event.data,
              chunkIndexRef.current,
              "video"
            );
            chunkIndexRef.current++;
          } catch (error) {
            // Continue
          }
        }
      }
    };

    mediaRecorder.onstop = () => {
      new Blob(recordedChunksRef.current, { type: "video/webm" });
    };

    mediaRecorder.start(5000);
    mediaRecorderRef.current = mediaRecorder;

    setupAudioVisualization(preInitializedStream);

    // Give AI introduction and then ask first question
    const startInterviewFlow = async () => {
      if (!hasGivenIntroduction) {
        await giveVoiceIntroduction();
        setHasGivenIntroduction(true);
        // Wait a bit before first question
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Speak first question
      logEvent(
        "question_change",
        { questionIndex: currentQuestionIndex, question: currentQuestion },
        "info"
      );
      await speakQuestion(currentQuestion);
    };

    setTimeout(() => {
      startInterviewFlow();
    }, 2000);
  };

  // Monitor video
  useEffect(() => {
    if (!isRecording || !videoRef.current || !streamRef.current) return;

    const video = videoRef.current;

    if (video.srcObject !== streamRef.current) {
      video.srcObject = streamRef.current;
    }

    const ensurePlay = () => {
      if (video.paused) {
        video.play().catch(() => {
          setTimeout(ensurePlay, 200);
        });
      }
    };

    ensurePlay();

    const interval = setInterval(() => {
      if (video.paused && video.srcObject) {
        video.play().catch(() => {});
      }

      if (!isVideoReady && video.readyState >= 2 && !video.paused) {
        setIsVideoReady(true);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isRecording, isVideoReady]);

  // Handle exit
  const handleExitInterview = () => {
    console.log("🚪 Exit button clicked - opening confirmation dialog");
    if ((window as any).__unlockFullscreen) {
      (window as any).__unlockFullscreen();
    }
    setExitDialogOpen(true);
  };

  const confirmExit = async () => {
    console.log("✅ Confirm exit clicked - ending interview");
    // Close dialog first
    setExitDialogOpen(false);

    // Submit to backend
    if (attemptId) {
      try {
        const answers = interviewEvents
          .filter((e) => e.type === "user_response")
          .map((e, idx) => ({
            questionId: `q${idx + 1}`,
            answerText: e.data.transcript || "",
            timestamp: e.timestamp,
            confidence: e.data.confidence,
          }));

        let videoBlob: Blob | undefined;
        if (recordedChunksRef.current.length > 0) {
          videoBlob = new Blob(recordedChunksRef.current, {
            type: "video/webm",
          });
        }

        const proctoringEvents = getEventLog();
        const tabSwitches = proctoringEvents.filter(
          (e) => e.type === "TAB_BLUR"
        ).length;
        const windowSwitches = proctoringEvents.filter(
          (e) => e.type === "WINDOW_BLUR"
        ).length;

        await mockInterviewAPI.submitInterview({
          attemptId,
          answers,
          events: [
            ...interviewEvents,
            ...proctoringEvents.map((pe) => ({
              timestamp: pe.timestamp,
              type: pe.type.toLowerCase().replace("_", "_") as any,
              data: pe.details || {},
              severity: "warning" as const,
            })),
          ],
          duration: elapsedTime,
          faceValidationFailures: submissionData.faceValidationFailures,
          multipleFaceDetections: submissionData.multipleFaceDetections,
          fullscreenExits: submissionData.fullscreenExits,
          completedQuestions: currentQuestionIndex + 1,
          totalQuestions: questions.length,
          videoBlob,
          metadata: {
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            timestamp: Date.now(),
            tabSwitches,
            windowSwitches,
          },
        });
      } catch (error) {
        // Continue even if submission fails
      }
    }

    // Exit fullscreen
    try {
      if ((window as any).__unlockFullscreen) {
        (window as any).__unlockFullscreen();
      }
      await fullscreenControl.exitFullscreen();
    } catch (error) {
      // Continue even if fullscreen exit fails
    }

    // Cleanup
    stopTimer();
    setIsRecording(false);

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        // Continue
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (error) {
        // Continue
      }
    }

    if ("keyboard" in navigator && "unlock" in (navigator as any).keyboard) {
      try {
        (navigator as any).keyboard.unlock();
      } catch (error) {
        // Continue
      }
    }

    // Navigate to completion page - DO THIS LAST
    // Use setTimeout to ensure all cleanup is done
    setTimeout(() => {
      onComplete();
    }, 100);
  };

  const cancelExit = () => {
    setExitDialogOpen(false);
    // Re-lock fullscreen immediately
    setTimeout(() => {
      if ((window as any).__lockFullscreen) {
        (window as any).__lockFullscreen();
      }
    }, 100);
  };

  // Next question - Move to next without saving (already saved in handleStopSpeaking)
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;

      logEvent(
        "question_change",
        {
          previousIndex: currentQuestionIndex,
          nextIndex,
          previousQuestion: currentQuestion,
          nextQuestion: questions[nextIndex],
          userResponse: userResponse,
        },
        "info"
      );

      setCurrentQuestionIndex(nextIndex);
      setUserResponse("");

      // Speak the next question
      setTimeout(() => {
        speakQuestion(questions[nextIndex]);
      }, 500);
    } else {
      logEvent(
        "question_change",
        {
          action: "interview_complete",
          totalQuestions: questions.length,
          finalResponse: userResponse,
        },
        "info"
      );
      handleExitInterview();
    }
  };

  // AI Voice Introduction
  const giveVoiceIntroduction = useCallback(async () => {
    const introScript = AI_INTERVIEWER_SCRIPTS.introduction[0];

    try {
      setIsAgentSpeaking(true);
      setIsAvatarAsking(true);

      await aiInterviewerVoice.speak(introScript, {
        rate: 0.9,
        pitch: 1.0,
        volume: 0.8,
        onStart: () => setIsAgentSpeaking(true),
        onEnd: () => {
          setIsAgentSpeaking(false);
          setIsAvatarAsking(false);
        },
      });
    } catch (error) {
      console.error("Error during voice introduction:", error);
      setIsAgentSpeaking(false);
      setIsAvatarAsking(false);
    }
  }, []);

  // Speak a question using TTS
  const speakQuestion = useCallback(
    async (question: string) => {
      try {
        setIsAgentSpeaking(true);
        setIsAvatarAsking(true);

        await aiInterviewerVoice.speak(question, {
          rate: 0.9,
          pitch: 1.0,
          volume: 0.8,
          onStart: () => {
            setIsAgentSpeaking(true);
            setIsAvatarAsking(true);
          },
          onEnd: () => {
            // Use setTimeout to ensure we're outside the speech synthesis callback
            setTimeout(() => {
              setIsAgentSpeaking(false);
              setIsAvatarAsking(false);
              // Start recording answer and speech recognition
              answerStartTimeRef.current = elapsedTime;
              setIsRecordingAnswer(true);
              setCurrentTranscript(""); // Clear previous transcript

              // Start speech recognition
              if (recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                  console.log("🎤 Speech recognition started for answer");
                } catch (error: any) {
                  if (
                    error.message &&
                    error.message.includes("already started")
                  ) {
                    console.log("ℹ️ Speech recognition already active");
                  } else {
                    console.error("Failed to start speech recognition:", error);
                    alert(
                      "Failed to start speech recognition. Please check your microphone permissions."
                    );
                  }
                }
              } else {
                console.error("❌ Speech recognition not initialized!");
                alert(
                  "Speech recognition is not available. Please refresh the page."
                );
              }

              logEvent(
                "recording_start",
                {
                  questionIndex: currentQuestionIndex,
                  questionText: question,
                  videoTimestamp: elapsedTime,
                },
                "info"
              );
            }, 100);
          },
        });
      } catch (error) {
        console.error("Error speaking question:", error);
        setTimeout(() => {
          setIsAgentSpeaking(false);
          setIsAvatarAsking(false);
          // Track answer start even if speech fails
          answerStartTimeRef.current = elapsedTime;
          setIsRecordingAnswer(true);
          setCurrentTranscript("");

          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
              console.log(
                "🎤 Speech recognition started for answer (after error)"
              );
            } catch (error: any) {
              if (error.message && error.message.includes("already started")) {
                console.log("ℹ️ Speech recognition already active");
              } else {
                console.error("Failed to start speech recognition:", error);
              }
            }
          }
        }, 100);
      }
    },
    [elapsedTime, currentQuestionIndex, logEvent]
  );

  // Stop recording and save answer
  const handleStopSpeaking = async () => {
    console.log("🔘 Next Question button clicked!", {
      answerStartTime: answerStartTimeRef.current,
      isRecordingAnswer,
      currentTranscript: currentTranscript.substring(0, 50) + "...",
    });

    // Stop speech recognition (if active)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Failed to stop speech recognition:", error);
      }
    }

    // Disable recording immediately to prevent double-click
    setIsRecordingAnswer(false);

    const answerEndTime = elapsedTime;
    const answerStartTime = answerStartTimeRef.current || 0;
    const answerDuration = answerEndTime - answerStartTime;

    // Get the transcribed text (or use empty if no speech)
    const transcribedText = currentTranscript.trim() || "";

    // Always set user response (even if empty - indicates they skipped)
    const displayResponse = transcribedText || "(Answer skipped)";
    setUserResponse(displayResponse);

    // Reset for next answer
    answerStartTimeRef.current = 0;
    setCurrentTranscript("");

    // Save answer with video timestamps to backend (with fallback)
    if (attemptId) {
      try {
        await mockInterviewAPI.saveQuestionAnswer(attemptId, {
          questionIndex: currentQuestionIndex,
          questionText: currentQuestion,
          answerText: transcribedText || "(No answer provided)",
          timestamp: Date.now(),
          duration: answerDuration,
        });

        console.log("✅ Answer saved:", {
          questionIndex: currentQuestionIndex,
          transcript: transcribedText,
          duration: answerDuration,
        });

        logEvent(
          "answer_saved",
          {
            questionIndex: currentQuestionIndex,
            questionText: currentQuestion,
            answerText: transcribedText,
            videoStartTime: answerStartTime,
            videoEndTime: answerEndTime,
            duration: answerDuration,
          },
          "info"
        );
      } catch (error) {
        console.error("❌ Failed to save answer (continuing anyway):", error);

        // FALLBACK: Store answer locally if API fails
        const localAnswer = {
          questionIndex: currentQuestionIndex,
          questionText: currentQuestion,
          answerText: transcribedText || "(No answer provided)",
          timestamp: Date.now(),
          duration: answerDuration,
          savedLocally: true,
        };

        // Store in localStorage as backup
        const existingAnswers = localStorage.getItem(
          `interview_${attemptId}_answers`
        );
        const answers = existingAnswers ? JSON.parse(existingAnswers) : [];
        answers.push(localAnswer);
        localStorage.setItem(
          `interview_${attemptId}_answers`,
          JSON.stringify(answers)
        );

        console.log("💾 Answer saved locally as fallback");

        logEvent(
          "answer_save_failed",
          {
            questionIndex: currentQuestionIndex,
            error: String(error),
            storedLocally: true,
          },
          "warning"
        );
      }
    }

    // Auto-advance after short delay (ALWAYS advance, even if API fails)
    console.log("⏭️  Advancing to next question in 300ms...");
    setTimeout(() => {
      console.log("⏭️  Calling nextQuestion()");
      nextQuestion();
    }, 300);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopTimer();

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      // Stop any ongoing TTS speech
      aiInterviewerVoice.stop();

      if ("keyboard" in navigator && "unlock" in (navigator as any).keyboard) {
        (navigator as any).keyboard.unlock();
      }

      fullscreenControl.exitFullscreen();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-white"
      style={{ position: "relative" }}
    >
      {!isRecording ? (
        <InterviewSetup
          topic={topic}
          difficulty={difficulty}
          onStart={handleStartInterview}
          onBack={onBack}
          onCameraReady={handleCameraReady}
        />
      ) : (
        <ActiveInterviewSession
          topic={topic}
          difficulty={difficulty}
          currentQuestion={currentQuestion}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          isAvatarAsking={isAvatarAsking}
          userResponse={userResponse}
          elapsedTime={elapsedTime}
          audioLevel={audioLevel}
          isVideoReady={isVideoReady}
          currentFaceWarning={null}
          submissionData={submissionData}
          isListening={isRecordingAnswer}
          currentTranscript={currentTranscript}
          faceStatus={faceStatus}
          videoRef={videoRef}
          audioCanvasRef={audioCanvasRef}
          isAgentSpeaking={isAgentSpeaking}
          onExitInterview={handleExitInterview}
          onStopSpeaking={handleStopSpeaking}
          formatTime={formatTime}
        />
      )}

      {/* Exit Dialog - Works in Fullscreen */}
      {exitDialogOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              // Clicked on backdrop - do nothing (prevent accidental close)
            }
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
              overflow: "hidden",
              animation: "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    End Interview?
                  </h2>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white p-6">
              <p className="text-gray-700 text-base mb-4">
                Are you sure you want to end this interview session? Your
                recording will be saved and submitted for evaluation.
              </p>
              <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm font-semibold text-blue-900">
                    Time Elapsed: {formatTime(elapsedTime)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-blue-800">
                    Questions Completed: {currentQuestionIndex + 1} of{" "}
                    {questions.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-gray-200 p-6 flex justify-end space-x-3">
              <button
                onClick={cancelExit}
                className="px-6 py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold text-base hover:bg-indigo-50 transition-all duration-200 transform hover:scale-105"
              >
                Continue Interview
              </button>
              <button
                onClick={confirmExit}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold text-base shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                End & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewRoom;
