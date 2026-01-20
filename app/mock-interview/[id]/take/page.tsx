"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box } from "@mui/material";
import { Loading } from "@/components/common/Loading";
import { useToast } from "@/components/common/Toast";
import mockInterviewService, {
  MockInterviewDetail,
  InterviewQuestion,
  InterviewResponse,
} from "@/lib/services/mock-interview.service";
import { useProctoring } from "@/lib/hooks/useProctoring";
import { useFullscreenMonitor } from "@/lib/hooks/useFullscreenMonitor";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { stopAllMediaTracks } from "@/lib/utils/cameraUtils";
import {
  InterviewHeader,
  VideoPreviewArea,
  AnswerInputArea,
  QuestionListSidebar,
  FullscreenWarningDialog,
  EndInterviewDialog,
} from "@/components/mock-interview";

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
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const isInitializingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
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
  const testDevices = async () => {
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

      userStreamRef.current = stream;

      // Check video tracks
      const videoTracks = stream.getVideoTracks();
      const hasVideo =
        videoTracks.length > 0 && videoTracks[0].readyState === "live";

      // Check audio tracks
      const audioTracks = stream.getAudioTracks();
      const hasAudio =
        audioTracks.length > 0 && audioTracks[0].readyState === "live";

      // Set video element source
      if (proctoringVideoRef.current) {
        proctoringVideoRef.current.srcObject = stream;
        proctoringVideoRef.current.play();
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
      showToast("Failed to access camera or microphone", "error");
    }
  };

  useEffect(() => {
    testDevices();
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

  // Disable ESC and right-click
  useKeyboardShortcuts({
    enabled: interviewStarted,
    onEscape: () => {
      showToast("ESC key is disabled during the interview", "warning");
    },
  });

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "en-US";

      recognitionInstance.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        const newText = finalTranscript || interimTranscript;
        setRecognizedText(newText);

        // Append to current answer (only final results to avoid duplicates)
        if (finalTranscript) {
          setCurrentAnswer((prev) => {
            const trimmed = prev.trim();
            return trimmed
              ? `${trimmed} ${finalTranscript.trim()}`
              : finalTranscript.trim();
          });
        }
      };

      recognitionInstance.onerror = (event: any) => {
        if (event.error !== "no-speech") {
          showToast("Speech recognition error: " + event.error, "error");
        }
      };

      recognitionInstance.onend = () => {
        // Auto-restart if interview is started
        if (interviewStarted && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (error) {
            // Already started or error - ignore
          }
        }
      };

      recognitionRef.current = recognitionInstance;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          // Ignore
        }
      }
    };
  }, [interviewStarted, showToast]);

  // Auto-start speech recognition when interview starts - always active
  useEffect(() => {
    if (!interviewStarted || !recognitionRef.current) return;

    const startListening = () => {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (error) {
        // Already started or error - ignore
      }
    };

    // Small delay to ensure recognition is initialized
    const timer = setTimeout(startListening, 500);

    // Keep speech recognition always active
    const keepListening = setInterval(() => {
      if (recognitionRef.current && interviewStarted) {
        try {
          if (
            recognitionRef.current.state === "stopped" ||
            recognitionRef.current.state === "inactive"
          ) {
            recognitionRef.current.start();
            setIsListening(true);
          }
        } catch (error) {
          // Ignore errors
        }
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(keepListening);
    };
  }, [interviewStarted]);

  // Load interview data on mount (call start API)
  useEffect(() => {
    const loadInterview = async () => {
      try {
        setLoading(true);
        // Call start API to get questions
        const startedInterview = await mockInterviewService.startInterview(
          interviewId
        );
        setInterview(startedInterview);
        setStartTime(new Date(startedInterview.started_at || new Date()));
      } catch (error) {
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

  // Get user video stream for preview and audio monitoring
  useEffect(() => {
    if (!interviewStarted || !isProctoringActive) return;

    let isActive = true;

    const getUserStream = async () => {
      try {
        // Get audio stream for microphone level monitoring
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        userStreamRef.current = audioStream;

        // Setup audio level monitoring
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(audioStream);
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

    getUserStream();

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
      if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach((track) => track.stop());
        userStreamRef.current = null;
      }
    };
  }, [interviewStarted, isProctoringActive, showToast]);

  // Handle start interview
  const handleStartInterview = useCallback(async () => {
    if (isInitializingRef.current || !interview) return;
    isInitializingRef.current = true;
    setShowStartButton(false);

    try {
      // Set interview started first to render video element
      setInterviewStarted(true);

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

      // Auto-read first question
      const questions =
        interview.questions_for_interview || interview.questions;
      if (questions && questions.length > 0) {
        setIsSpeaking(true);
      }
    } catch (error: any) {
      showToast(error.message || "Failed to start interview", "error");
      setShowStartButton(true);
      setInterviewStarted(false);
      isInitializingRef.current = false;
    }
  }, [interview, startProctoring, enterFullscreen, showToast]);

  // Speech recognition is always active - no toggle needed

  // Get current question - support both questions_for_interview and questions
  const currentQuestion = useMemo(() => {
    const questions =
      interview?.questions_for_interview || interview?.questions;
    if (!questions) return null;
    return questions[currentQuestionIndex] || null;
  }, [interview, currentQuestionIndex]);

  // Get question text (support both question and question_text)
  const getQuestionText = useCallback((question: InterviewQuestion | null) => {
    if (!question) return "";
    return question.question_text || question.question || "";
  }, []);

  // Handle question read complete
  const handleSpeakComplete = useCallback(() => {
    setIsSpeaking(false);
  }, []);

  // Handle answer change
  const handleAnswerChange = useCallback((answer: string) => {
    setCurrentAnswer(answer);
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

      // Stop proctoring
      stopProctoring();

      // Stop all media tracks (camera and audio)
      stopAllMediaTracks();

      // Stop all media tracks again after a brief delay to catch any missed streams
      await new Promise((resolve) => setTimeout(resolve, 50));
      stopAllMediaTracks();

      // Navigate to success page
      showToast("Interview submitted successfully!", "success");
      router.push(`/mock-interview/${interviewId}/submission-success`);
    } catch (error) {
      showToast("Failed to submit interview", "error");
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
    router,
    showToast,
  ]);

  // Handle next question
  const handleNextQuestion = useCallback(() => {
    const questions =
      interview?.questions_for_interview || interview?.questions;
    if (!questions) return;

    // Clear auto-save timer and save immediately before moving
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

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
    interview,
    currentQuestionIndex,
    currentQuestion,
    responses,
    handleSaveAnswer,
    handleSubmitInterview,
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
    setShowEndInterviewDialog(true);
  }, []);

  // Confirm end interview
  const handleConfirmEndInterview = useCallback(() => {
    setShowEndInterviewDialog(false);
    handleSubmitInterview();
  }, [handleSubmitInterview]);

  // Cancel end interview
  const handleCancelEndInterview = useCallback(() => {
    setShowEndInterviewDialog(false);
  }, []);

  // Fullscreen warning state
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [showEndInterviewDialog, setShowEndInterviewDialog] = useState(false);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isProctoringActive) {
        stopProctoring();
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isProctoringActive, stopProctoring]);

  if (loading) {
    return <Loading fullScreen />;
  }

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
        backgroundColor: "#ffffff",
        color: "#1f2937",
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
        onTimeUp={handleSubmitInterview}
        onEndInterview={handleEndInterview}
        isProctoringActive={isProctoringActive}
        proctoringStatus={proctoringStatus}
        faceCount={faceCount}
        latestViolation={
          latestViolation
            ? {
                type: latestViolation.type,
                message: latestViolation.message,
              }
            : null
        }
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
            latestViolation={
              latestViolation
                ? {
                    type: latestViolation.type,
                    message: latestViolation.message,
                  }
                : null
            }
            isSpeaking={isSpeaking}
            questionText={getQuestionText(currentQuestion)}
            onSpeakComplete={handleSpeakComplete}
            interviewTitle={interview.title}
            questionsCount={questions?.length}
            durationMinutes={interview.duration_minutes}
          />

          {interviewStarted && currentQuestion && (
            <AnswerInputArea
              currentAnswer={currentAnswer}
              onAnswerChange={handleAnswerChange}
              onSaveAnswer={handleSaveAnswer}
              onPreviousQuestion={handlePreviousQuestion}
              onNextQuestion={handleNextQuestion}
              isQuestionAnswered={isQuestionAnswered}
              canGoPrevious={currentQuestionIndex > 0}
              isLastQuestion={currentQuestionIndex >= totalQuestions - 1}
            />
          )}
        </Box>

        {interviewStarted && (
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
