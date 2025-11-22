import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import useFullscreenControl from "../hooks/useFullscreenControl";
import InterviewSetup from "./InterviewSetup";
import ActiveInterviewSession from "./ActiveInterviewSession";
import {
  mockInterviewAPI,
  InterviewEvent,
  InterviewQuestion,
} from "../services/api";
import { getQuestions } from "../utils/questionGenerator";
import { useProctoring } from "../proctoring/useProctoring";
import {
  aiInterviewerVoice,
  AI_INTERVIEWER_SCRIPTS,
} from "../utils/speechSynthesis";
import { loadBlazeFaceModel } from "../utils/faceDetectionLoader";

interface InterviewRoomProps {
  topic: string;
  difficulty: string;
  onBack: () => void;
  onComplete: (submissionSuccess?: boolean) => void;
  interviewId?: string | null;
  questions?: any[];
}

const InterviewRoom = ({
  topic,
  difficulty,
  onBack,
  onComplete,
  interviewId: providedInterviewId,
}: InterviewRoomProps) => {
  // Proctoring
  const { eventLog, getEventLog } = useProctoring();

  // Interview attempt ID - use provided ID or null
  const [attemptId, setAttemptId] = useState<string | null>(
    providedInterviewId || null
  );

  // State management
  const [isRecording, setIsRecording] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [fullscreenExitWarningOpen, setFullscreenExitWarningOpen] =
    useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // Keep for submission
  const [remainingTime, setRemainingTime] = useState(0); // Countdown timer
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAvatarAsking, setIsAvatarAsking] = useState(false);
  const [userResponse, setUserResponse] = useState("");
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState<
    InterviewQuestion[]
  >([]);
  const [interviewEvents, setInterviewEvents] = useState<InterviewEvent[]>([]);
  const [savedAnswers, setSavedAnswers] = useState<
    Array<{
      questionId: number | string;
      questionText: string;
      answerText: string;
      timestamp: number;
      duration: number;
    }>
  >([]);
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
  const preInitializedStreamRef = useRef<MediaStream | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCanvasRef = useRef<HTMLCanvasElement>(null);
  const answerStartTimeRef = useRef<number>(0);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [hasGivenIntroduction, setHasGivenIntroduction] = useState(false);
  const [isRecordingAnswer, setIsRecordingAnswer] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [typedText, setTypedText] = useState("");
  const recognitionRef = useRef<any>(null);
  const isRecordingAnswerRef = useRef<boolean>(false);

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
      alert(
        "Speech recognition is not supported in your browser. Please use Chrome or Edge."
      );
      return;
    }

    // Request microphone permission explicitly
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        // Microphone access granted
      })
      .catch(() => {
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
        // Speech recognition started
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setCurrentTranscript((prev) => {
            const updated = prev + finalTranscript;
            return updated;
          });
        }
      };

      recognition.onerror = (event: any) => {
        if (
          event.error === "not-allowed" ||
          event.error === "service-not-allowed"
        ) {
          alert(
            "Microphone permission denied. Please enable microphone access in your browser settings."
          );
        } else if (event.error === "no-speech") {
          // No speech detected, continuing to listen
        } else if (event.error === "network") {
          // Network error - speech recognition may not work offline
        }
      };

      recognition.onend = () => {
        // Auto-restart if still in recording mode - use ref to check state
        setTimeout(() => {
          try {
            // Check if we should still be recording using ref
            if (recognitionRef.current && isRecordingAnswerRef.current) {
              recognitionRef.current.start();
            }
          } catch (error: any) {
            if (error.message && error.message.includes("already started")) {
              // Recognition already running
            }
          }
        }, 100);
      };

      recognitionRef.current = recognition;
    } catch (error) {
      alert(
        "Failed to initialize speech recognition. Please refresh and try again."
      );
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
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
        const model = await loadBlazeFaceModel();
        blazeFaceModelRef.current = model;
        setFaceDetectionReady(true);
      } catch (error) {
        // Retry loading
        if (retryCount < MAX_DETECTION_RETRIES - 1) {
          setTimeout(() => {
            initFaceDetection(retryCount + 1);
          }, 2000);
        } else {
          alert(
            "Face detection could not be initialized. Interview will continue without face monitoring."
          );
        }
      }
    };

    initFaceDetection();
  }, []);

  // Track previous fullscreen state to detect exits
  const wasFullscreenRef = useRef<boolean>(false);
  // Preserve recording state when fullscreen exits
  const wasRecordingAnswerBeforeExitRef = useRef<boolean>(false);
  const transcriptBeforeExitRef = useRef<string>("");

  // Listen for fullscreen exit during interview - stop AI, camera, and audio
  useEffect(() => {
    if (!isRecording) {
      wasFullscreenRef.current = false;
      return;
    }

    // Initialize the ref when recording starts
    const checkInitialFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
    wasFullscreenRef.current = checkInitialFullscreen;

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      // If we were in fullscreen and now we're not, stop everything
      if (!isCurrentlyFullscreen && wasFullscreenRef.current && isRecording) {
        // Preserve recording state before stopping
        wasRecordingAnswerBeforeExitRef.current = isRecordingAnswerRef.current;
        transcriptBeforeExitRef.current = currentTranscript;

        // Pause the interview - stop timer
        stopTimer();

        // Stop AI speaking immediately
        aiInterviewerVoice.stop();
        setIsAgentSpeaking(false);
        setIsAvatarAsking(false);

        // Stop speech recognition
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
            isRecordingAnswerRef.current = false;
            setIsRecordingAnswer(false);
          } catch (e) {
            // Ignore errors
          }
        }

        // Turn off camera and audio - stop ALL streams immediately
        const stopAllStreams = (stream: MediaStream | null) => {
          if (stream) {
            stream.getTracks().forEach((track) => {
              if (track.readyState === "live") {
                track.stop();
              }
            });
          }
        };

        // Stop all possible streams
        stopAllStreams(streamRef.current);
        stopAllStreams(preInitializedStreamRef.current);
        stopAllStreams(preInitializedStream);

        // Also check video element for any attached stream
        if (videoRef.current && videoRef.current.srcObject) {
          const videoStream = videoRef.current.srcObject as MediaStream;
          stopAllStreams(videoStream);
          videoRef.current.srcObject = null;
          videoRef.current.pause();
        }

        // Track fullscreen exit
        setSubmissionData((prev) => ({
          ...prev,
          fullscreenExits: prev.fullscreenExits + 1,
        }));

        if (logEventRef.current) {
          logEventRef.current(
            "fullscreen_exit",
            {
              timestamp: Date.now(),
              message:
                "User exited fullscreen mode - AI speech, camera, and audio stopped",
            },
            "warning"
          );
        }

        // Show warning modal
        setFullscreenExitWarningOpen(true);
      }

      // Update the ref for next check
      wasFullscreenRef.current = isCurrentlyFullscreen;
    };

    // Listen for fullscreen changes
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
  }, [isRecording, preInitializedStream]);

  // Track face detection violations
  const lastFaceStatusRef = useRef<string>("single");
  const noFaceCountRef = useRef<number>(0);
  const multipleFaceCountRef = useRef<number>(0);
  const logEventRef = useRef<
    | ((
        type: InterviewEvent["type"],
        data: any,
        severity?: InterviewEvent["severity"]
      ) => void)
    | null
  >(null);

  // Start face detection when recording - MAXIMUM ROBUSTNESS
  useEffect(() => {
    if (
      isRecording &&
      isVideoReady &&
      videoRef.current &&
      videoRef.current.srcObject &&
      blazeFaceModelRef.current &&
      faceDetectionReady
    ) {
      // Wait a bit for video to be fully ready before starting detection
      const startDetection = setTimeout(() => {
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 3; // Reduced for faster recovery
        let detectionActive = true;
        let lastSuccessfulDetection = Date.now();

        const detectFaces = async () => {
          if (!detectionActive) return;

          try {
            // Comprehensive video validation
            if (!videoRef.current || !videoRef.current.srcObject) {
              return;
            }

            // Check video readiness
            if (videoRef.current.readyState < 2) {
              return;
            }

            // Check video dimensions
            const width = videoRef.current.videoWidth;
            const height = videoRef.current.videoHeight;

            if (width === 0 || height === 0) {
              return;
            }

            // Ensure video is playing
            if (videoRef.current.paused) {
              try {
                await videoRef.current.play();
              } catch (playError) {
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
              faceCount === 0
                ? "none"
                : faceCount === 1
                ? "single"
                : "multiple";

            // Log status changes
            if (newStatus !== lastFaceStatusRef.current) {
              lastFaceStatusRef.current = newStatus;

              // Log proctoring violations
              if (newStatus === "none") {
                noFaceCountRef.current++;
                if (logEventRef.current) {
                  logEventRef.current(
                    "no_face",
                    {
                      timestamp: Date.now(),
                      count: noFaceCountRef.current,
                      message: "No face detected in camera view",
                    },
                    "warning"
                  );
                }

                setSubmissionData((prev) => ({
                  ...prev,
                  faceValidationFailures: prev.faceValidationFailures + 1,
                }));
              } else if (newStatus === "multiple") {
                multipleFaceCountRef.current++;
                if (logEventRef.current) {
                  logEventRef.current(
                    "multiple_faces",
                    {
                      timestamp: Date.now(),
                      count: multipleFaceCountRef.current,
                      faceCount: faceCount,
                      message: "Multiple faces detected",
                    },
                    "warning"
                  );
                }

                setSubmissionData((prev) => ({
                  ...prev,
                  multipleFaceDetections: prev.multipleFaceDetections + 1,
                }));
              }
            }

            setFaceStatus(newStatus);
          } catch (error) {
            consecutiveErrors++;
            const timeSinceLastSuccess = Date.now() - lastSuccessfulDetection;

            // If too many consecutive errors OR too long without success, try to recover
            if (
              consecutiveErrors >= MAX_CONSECUTIVE_ERRORS ||
              timeSinceLastSuccess > 10000
            ) {
              consecutiveErrors = 0;
              detectionActive = false; // Pause detection during recovery

              // Comprehensive recovery strategy
              try {
                // Step 1: Clear the old model
                blazeFaceModelRef.current = null;

                // Step 2: Give it a moment to cleanup
                await new Promise((resolve) => setTimeout(resolve, 500));

                // Step 3: Reload BlazeFace model via dynamic loader
                const model = await loadBlazeFaceModel();
                blazeFaceModelRef.current = model;

                // Step 5: Resume detection
                detectionActive = true;
                lastSuccessfulDetection = Date.now();
              } catch (reloadError) {
                // Try one more time after a longer wait
                setTimeout(async () => {
                  try {
                    const model = await loadBlazeFaceModel();
                    blazeFaceModelRef.current = model;
                    detectionActive = true;
                  } catch (e) {
                    // Final recovery attempt failed
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
            // No successful face detection in a while - detection may be stalled
          }
        }, 5000);

        return () => {
          detectionActive = false;

          if (faceDetectionIntervalRef.current) {
            clearInterval(faceDetectionIntervalRef.current);
          }

          if (healthCheckInterval) {
            clearInterval(healthCheckInterval);
          }
        };
      }, 1000); // Wait 1 second for video to be fully ready

      return () => {
        clearTimeout(startDetection);
        if (faceDetectionIntervalRef.current) {
          clearInterval(faceDetectionIntervalRef.current);
        }
      };
    }
  }, [isRecording, isVideoReady, faceDetectionReady]); // Added dependencies for video readiness

  // Get questions - Use provided questions or generate locally as fallback
  const questions = useMemo(() => {
    if (interviewQuestions && interviewQuestions.length > 0) {
      return interviewQuestions;
    }
    return getQuestions(topic, difficulty, 10);
  }, [interviewQuestions, topic, difficulty]);

  // Current question - MEMOIZED to prevent re-triggering avatar speech
  const currentQuestion = useMemo(() => {
    return interviewQuestions[currentQuestionIndex];
  }, [interviewQuestions, currentQuestionIndex]);

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

      // Events are tracked locally and will be submitted at the end
    },
    [attemptId]
  );

  // Update logEvent ref whenever logEvent changes
  useEffect(() => {
    logEventRef.current = logEvent;
  }, [logEvent]);

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
      preInitializedStreamRef.current = stream; // Also store in ref
      logEvent("camera_ready", { status: "pre_initialized" }, "info");
    },
    [logEvent]
  );

  // Format time (for countdown display)
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Timer functions - countdown timer
  const startTimer = () => {
    if (timerIntervalRef.current === null) {
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1); // Keep for submission
        setRemainingTime((prev) => {
          if (prev <= 0) {
            return 0; // Don't go negative
          }
          return prev - 1; // Countdown
        });
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
  const setupAudioVisualization = async (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();

      // Resume audio context if suspended (required by some browsers)
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.85;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      visualizeAudio();
    } catch (error) {
      // Failed to setup audio visualization
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

    // Use provided interview ID or create fallback
    const currentAttemptId =
      providedInterviewId || attemptId || `local-${Date.now()}`;

    if (!attemptId) {
      setAttemptId(currentAttemptId);
    }
    const {
      attemptId: newAttemptId,
      questions: newQuestions,
      duration_minutes,
    } = await mockInterviewAPI.startInterviewById(currentAttemptId);
    setAttemptId(newAttemptId);
    setInterviewQuestions(newQuestions);

    // Set countdown timer from duration_minutes
    const durationSeconds = (duration_minutes || 25) * 60; // Default to 25 minutes if not provided
    setRemainingTime(durationSeconds);
    setElapsedTime(0); // Reset elapsed time

    logEvent(
      "question_change",
      {
        action: "interview_started",
        attemptId: newAttemptId,
        questions: newQuestions,
        duration_minutes: duration_minutes || 25,
      },
      "info"
    );

    streamRef.current = preInitializedStream;
    setIsRecording(true);
    // Timer will start after AI introduction

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
      await new Promise((resolve) => setTimeout(resolve, 500)); // Reduced from 1000ms
      await lockKeyboard();
      if ((window as any).__lockFullscreen) {
        (window as any).__lockFullscreen();
      }
    } catch (err) {
      // Continue anyway
    }

    // Note: Media recording is not performed - only visual indicators shown to user
    await setupAudioVisualization(preInitializedStream);

    // Give AI introduction and then ask first question - start immediately
    const startInterviewFlow = async () => {
      if (!hasGivenIntroduction) {
        await giveVoiceIntroduction();
        setHasGivenIntroduction(true);
        // Start timer after introduction
        startTimer();
        // Wait a bit before first question
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Speak first question - ensure we have questions loaded
      const firstQuestion = newQuestions[0];
      if (firstQuestion) {
        logEvent(
          "question_change",
          { questionIndex: 0, question: firstQuestion },
          "info"
        );
        await speakQuestion(firstQuestion.question_text || "");
      }
    };

    // Start immediately without delay
    startInterviewFlow();
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
    if ((window as any).__unlockFullscreen) {
      (window as any).__unlockFullscreen();
    }
    setExitDialogOpen(true);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const confirmExit = async () => {
    // Set submitting flag immediately in sessionStorage
    sessionStorage.setItem("interview_submitting", "true");
    setIsSubmitting(true);
    setExitDialogOpen(false);

    // TURN OFF CAMERA AND AUDIO IMMEDIATELY - BEFORE NAVIGATION
    const stopAllStreams = (stream: MediaStream | null) => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          if (track.readyState === "live" || track.readyState === "ended") {
            track.stop();
          }
        });
      }
    };

    // Stop all possible streams
    stopAllStreams(streamRef.current);
    stopAllStreams(preInitializedStreamRef.current);
    stopAllStreams(preInitializedStream);

    // Also check video element for any attached stream
    if (videoRef.current && videoRef.current.srcObject) {
      const videoStream = videoRef.current.srcObject as MediaStream;
      stopAllStreams(videoStream);
      videoRef.current.srcObject = null;
      videoRef.current.pause();
    }

    // Stop speech recognition immediately
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }

    // Stop audio context and visualization
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
        audioContextRef.current = null;
        analyserRef.current = null;
      } catch (error) {
        // Continue
      }
    }

    // Stop AI speaking
    aiInterviewerVoice.stop();
    setIsAgentSpeaking(false);
    setIsAvatarAsking(false);

    // Stop recording (visual indicator only)
    stopTimer();
    setIsRecording(false);

    // Clear refs
    streamRef.current = null;
    preInitializedStreamRef.current = null;
    setPreInitializedStream(null);

    // Cleanup and exit fullscreen
    try {
      if ((window as any).__unlockFullscreen) {
        (window as any).__unlockFullscreen();
      }
      await fullscreenControl.exitFullscreen();
    } catch (error) {
      // Continue even if fullscreen exit fails
    }

    // Navigate to complete page with submitting flag (AFTER stopping everything)
    onComplete(undefined); // undefined = submitting

    if ("keyboard" in navigator && "unlock" in (navigator as any).keyboard) {
      try {
        (navigator as any).keyboard.unlock();
      } catch (error) {
        // Continue
      }
    }

    // Submit to backend in background
    let submissionSuccess = false;
    if (attemptId) {
      try {
        // Use savedAnswers array which has proper question IDs
        const answers = savedAnswers.map((answer) => ({
          questionId: answer.questionId,
          answerText: answer.answerText,
          timestamp: answer.timestamp,
          duration: answer.duration,
        }));

        // Also check sessionStorage for any backup answers
        try {
          const backupAnswers = sessionStorage.getItem(
            `interview_${attemptId}_answers`
          );
          if (backupAnswers) {
            const parsed = JSON.parse(backupAnswers);
            parsed.forEach((backup: any) => {
              const existingIndex = answers.findIndex(
                (a) => a.questionId === backup.questionIndex + 1
              );
              if (existingIndex < 0) {
                // Add backup answer if not already in answers
                answers.push({
                  questionId: backup.questionIndex + 1,
                  answerText: backup.answerText,
                  timestamp: backup.timestamp,
                  duration: backup.duration || 0,
                });
              }
            });
          }
        } catch (e) {
          // Ignore sessionStorage errors
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
          totalQuestions: interviewQuestions.length,
          metadata: {
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            timestamp: Date.now(),
            tabSwitches,
            windowSwitches,
          },
        });

        submissionSuccess = true;
      } catch (error) {
        submissionSuccess = false;
      }

      // Clear submitting flag and set completion status
      sessionStorage.removeItem("interview_submitting");
      sessionStorage.setItem(
        "interview_submission_complete",
        submissionSuccess ? "true" : "false"
      );

      // Update submission status after completion
      // Use a small delay to ensure navigation has happened
      setTimeout(() => {
        onComplete(submissionSuccess);
      }, 100);
    } else {
      // No attemptId, mark as completed immediately
      sessionStorage.removeItem("interview_submitting");
      sessionStorage.setItem("interview_submission_complete", "true");
      setTimeout(() => {
        onComplete(true);
      }, 100);
    }
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

  // Handle fullscreen exit warning - continue interview
  const handleContinueInterview = async () => {
    setFullscreenExitWarningOpen(false);

    // Re-enter fullscreen
    try {
      await fullscreenControl.enterFullscreen();
      await new Promise((resolve) => setTimeout(resolve, 500));
      await lockKeyboard();
      if ((window as any).__lockFullscreen) {
        (window as any).__lockFullscreen();
      }

      // Update fullscreen ref
      wasFullscreenRef.current = true;

      // Re-initialize camera and audio
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        streamRef.current = stream;
        setPreInitializedStream(stream);
        preInitializedStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsVideoReady(true);
        }

        // Clean up old audio context if it exists
        if (audioContextRef.current) {
          try {
            audioContextRef.current.close();
          } catch (e) {
            // Ignore errors
          }
          audioContextRef.current = null;
          analyserRef.current = null;
        }

        // Stop any existing audio visualization animation
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        // Re-setup audio visualization with new stream
        await setupAudioVisualization(stream);

        // Restart timer
        startTimer();

        // Restore recording state if we were recording before exit
        if (wasRecordingAnswerBeforeExitRef.current) {
          setIsRecordingAnswer(true);
          isRecordingAnswerRef.current = true;
          setCurrentTranscript(transcriptBeforeExitRef.current);

          // Restart speech recognition
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // Ignore if already started
            }
          }
        }

        if (logEventRef.current) {
          logEventRef.current(
            "camera_ready",
            { status: "re_initialized_after_fullscreen_exit" },
            "info"
          );

          logEventRef.current(
            "fullscreen_enter",
            {
              timestamp: Date.now(),
              message:
                "User re-entered fullscreen mode - camera and audio re-initialized",
            },
            "info"
          );
        }
      } catch (error) {
        alert(
          "Failed to re-initialize camera and microphone. Please check permissions."
        );
      }
    } catch (error) {
      // Show error or try again
      alert("Please re-enter fullscreen mode to continue the interview.");
    }
  };

  // Handle fullscreen exit warning - exit interview
  const handleExitFromFullscreenWarning = () => {
    setFullscreenExitWarningOpen(false);
    // Open the exit dialog
    setExitDialogOpen(true);
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
        speakQuestion(interviewQuestions[nextIndex]?.question_text || "");
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
              isRecordingAnswerRef.current = true; // Update ref
              setCurrentTranscript(""); // Clear previous transcript
              setTypedText(""); // Clear previous typed text

              // Start speech recognition
              if (recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch (error: any) {
                  if (
                    error.message &&
                    error.message.includes("already started")
                  ) {
                    // Speech recognition already active
                  } else {
                    alert(
                      "Failed to start speech recognition. Please check your microphone permissions."
                    );
                  }
                }
              } else {
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
        setTimeout(() => {
          setIsAgentSpeaking(false);
          setIsAvatarAsking(false);
          // Track answer start even if speech fails
          answerStartTimeRef.current = elapsedTime;
          setIsRecordingAnswer(true);
          isRecordingAnswerRef.current = true; // Update ref
          setCurrentTranscript("");
          setTypedText("");

          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (error: any) {
              if (error.message && error.message.includes("already started")) {
                // Speech recognition already active
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
    // Stop speech recognition (if active)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        // Failed to stop speech recognition
      }
    }

    // Disable recording immediately to prevent double-click
    setIsRecordingAnswer(false);
    isRecordingAnswerRef.current = false; // Update ref

    const answerEndTime = elapsedTime;
    const answerStartTime = answerStartTimeRef.current || 0;
    const answerDuration = answerEndTime - answerStartTime;

    // Merge typed text with transcribed text
    const typedPart = typedText.trim();
    const spokenPart = currentTranscript.trim();
    const transcribedText = [typedPart, spokenPart]
      .filter((part) => part.length > 0)
      .join(" ") || "";

    // Always set user response (even if empty - indicates they skipped)
    const displayResponse = transcribedText || "(Answer skipped)";
    setUserResponse(displayResponse);

    // Reset for next answer
    answerStartTimeRef.current = 0;
    setCurrentTranscript("");
    setTypedText("");

    // Get question ID from current question
    const questionId = currentQuestion?.id || currentQuestionIndex + 1;
    const questionText = currentQuestion?.question_text || "";

    // Save answer to state array for submission
    const answerData = {
      questionId: questionId,
      questionText: questionText,
      answerText: transcribedText || "(No answer provided)",
      timestamp: Date.now(),
      duration: answerDuration,
    };

    setSavedAnswers((prev) => {
      // Update existing answer if question was answered before, otherwise add new
      const existingIndex = prev.findIndex((a) => a.questionId === questionId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = answerData;
        return updated;
      }
      return [...prev, answerData];
    });

    // Save answer with video timestamps to backend (with fallback)
    if (attemptId) {
      try {
        await mockInterviewAPI.saveQuestionAnswer(attemptId, {
          questionIndex: currentQuestionIndex,
          questionText: questionText,
          answerText: transcribedText || "(No answer provided)",
          timestamp: Date.now(),
          duration: answerDuration,
        });

        logEvent(
          "answer_saved",
          {
            questionId: questionId,
            questionIndex: currentQuestionIndex,
            questionText: questionText,
            answerText: transcribedText,
            videoStartTime: answerStartTime,
            videoEndTime: answerEndTime,
            duration: answerDuration,
          },
          "info"
        );
      } catch (error) {
        // FALLBACK: Store answer locally if API fails
        const localAnswer = {
          questionIndex: currentQuestionIndex,
          questionText: currentQuestion?.question_text || "",
          answerText: transcribedText || "(No answer provided)",
          timestamp: Date.now(),
          duration: answerDuration,
          savedLocally: true,
        };

        // Store in sessionStorage as backup
        const existingAnswers = sessionStorage.getItem(
          `interview_${attemptId}_answers`
        );
        const answers = existingAnswers ? JSON.parse(existingAnswers) : [];
        answers.push(localAnswer);
        sessionStorage.setItem(
          `interview_${attemptId}_answers`,
          JSON.stringify(answers)
        );

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
    setTimeout(() => {
      nextQuestion();
    }, 300);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopTimer();

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
          currentQuestion={currentQuestion?.question_text || ""}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={interviewQuestions.length}
          isAvatarAsking={isAvatarAsking}
          userResponse={userResponse}
          elapsedTime={remainingTime}
          audioLevel={audioLevel}
          isVideoReady={isVideoReady}
          currentFaceWarning={null}
          submissionData={submissionData}
          isListening={isRecordingAnswer}
          currentTranscript={currentTranscript}
          typedText={typedText}
          onTypedTextChange={setTypedText}
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
                    Submit your interview for evaluation
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
                    Time Remaining: {formatTime(remainingTime)}
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
                disabled={isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold text-base shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  "End & Submit"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Exit Warning Dialog */}
      {fullscreenExitWarningOpen && (
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
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-yellow-600"
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
                    Fullscreen Exited
                  </h2>
                  <p className="text-sm text-gray-500">
                    You exited fullscreen mode
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white p-6">
              <p className="text-gray-700 text-base mb-4">
                The interview must be conducted in fullscreen mode. Please
                re-enter fullscreen to continue, or exit the interview.
              </p>
              <div className="mt-4 p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                <div className="flex items-start space-x-3">
                  <svg
                    className="w-5 h-5 text-yellow-600 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-yellow-900 mb-1">
                      Important Notice
                    </p>
                    <p className="text-sm text-yellow-800">
                      Exiting fullscreen during the interview is not allowed.
                      Your session will be monitored for compliance.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-gray-200 p-6 flex justify-end space-x-3">
              <button
                onClick={handleExitFromFullscreenWarning}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold text-base hover:bg-gray-50 transition-all duration-200 transform hover:scale-105"
              >
                Exit Interview
              </button>
              <button
                onClick={handleContinueInterview}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-base shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                Continue Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewRoom;
