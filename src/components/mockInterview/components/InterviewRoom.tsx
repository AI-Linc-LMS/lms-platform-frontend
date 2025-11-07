import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import useFaceDetection from "../hooks/useFaceDetection";
import useFullscreenControl from "../hooks/useFullscreenControl";
import InterviewSetup from "./InterviewSetup";
import ActiveInterviewSession from "./ActiveInterviewSession";
import { mockInterviewAPI, InterviewEvent } from "../services/api";
import { getQuestions } from "../utils/questionGenerator";
import { useProctoring } from "../proctoring/useProctoring";

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
  const [currentFaceWarning, setCurrentFaceWarning] = useState<string | null>(
    null
  );
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
  const speechRecognitionRef = useRef<any>(null);
  const [isSpeechListening, setIsSpeechListening] = useState(false);

  // Custom hooks
  const faceDetection = useFaceDetection(videoRef);
  const fullscreenControl = useFullscreenControl(containerRef);

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

  // Handle face detection - LIVE AND RESPONSIVE
  useEffect(() => {
    if (
      !faceDetection.isLoading &&
      faceDetection.faceDetection &&
      isRecording
    ) {
      const { faceCount, isValidFrame } = faceDetection.faceDetection;

      // IMMEDIATE state updates for live tracking
      if (faceCount === 0 || !isValidFrame) {
        if (currentFaceWarning !== "no_face") {
          setCurrentFaceWarning("no_face");
          logEvent("no_face", { faceCount, isValidFrame }, "warning");
          setSubmissionData((prev) => ({
            ...prev,
            faceValidationFailures: prev.faceValidationFailures + 1,
          }));
        }
      } else if (faceCount > 1) {
        if (currentFaceWarning !== "multiple_faces") {
          setCurrentFaceWarning("multiple_faces");
          logEvent("multiple_faces", { faceCount }, "warning");
          setSubmissionData((prev) => ({
            ...prev,
            multipleFaceDetections: prev.multipleFaceDetections + 1,
          }));
        }
      } else if (faceCount === 1 && isValidFrame) {
        if (currentFaceWarning !== null) {
          setCurrentFaceWarning(null);
          logEvent("face_valid", { faceCount }, "info");
        }
      }
    }
  }, [
    faceDetection.faceDetection,
    faceDetection.isLoading,
    currentFaceWarning,
    isRecording,
    logEvent,
  ]);

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

    // Initialize Speech Recognition
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          if (result.isFinal) {
            finalTranscript += transcript + " ";
          }
        }

        if (finalTranscript.trim()) {
          setUserResponse((prev) => (prev + " " + finalTranscript).trim());
        }
      };

      recognition.onerror = (event: any) => {
        logEvent("recording_start", { error: event.error }, "error");
        setIsSpeechListening(false);
      };

      recognition.onend = () => {
        setIsSpeechListening(false);
      };

      speechRecognitionRef.current = recognition;

      logEvent(
        "recording_start",
        { status: "Speech recognition initialized successfully" },
        "info"
      );
    }

    // Start first question
    setTimeout(() => {
      setIsAvatarAsking(true);
      logEvent(
        "question_change",
        { questionIndex: currentQuestionIndex, question: currentQuestion },
        "info"
      );
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

  // Start face detection when video ready
  useEffect(() => {
    if (isVideoReady && isRecording && !faceDetection.isDetecting) {
      // Start immediately for live detection
      const timer = setTimeout(() => {
        faceDetection.startDetection();
      }, 500); // Reduced delay

      return () => {
        clearTimeout(timer);
      };
    }
  }, [
    isVideoReady,
    isRecording,
    faceDetection.isDetecting,
    faceDetection.startDetection,
  ]);

  // Stop face detection on unmount
  useEffect(() => {
    return () => {
      if (faceDetection.isDetecting) {
        faceDetection.stopDetection();
      }
    };
  }, []);

  // Handle exit
  const handleExitInterview = () => {
    if ((window as any).__unlockFullscreen) {
      (window as any).__unlockFullscreen();
    }
    setExitDialogOpen(true);
  };

  const confirmExit = async () => {
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

    if (isSpeechListening && speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
        setIsSpeechListening(false);
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
    if ((window as any).__lockFullscreen) {
      (window as any).__lockFullscreen();
    }
  };

  // Next question - USER CONTROLLED
  const nextQuestion = () => {
    if (isSpeechListening && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsSpeechListening(false);
    }

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
      setIsAvatarAsking(true);
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

  // Avatar finished speaking - DO NOT AUTO-START
  const handleQuestionComplete = () => {
    setIsAvatarAsking(false);
    // User must manually click "Start Recording" button
  };

  // User manually starts speaking - DIRECT SPEECH RECOGNITION
  const handleStartSpeaking = useCallback(() => {
    if (isAvatarAsking) {
      return;
    }

    if (!speechRecognitionRef.current) {
      logEvent(
        "recording_start",
        { error: "Speech recognition not initialized" },
        "error"
      );
      return;
    }

    try {
      speechRecognitionRef.current.start();
      setIsSpeechListening(true);
      logEvent(
        "recording_start",
        {
          questionIndex: currentQuestionIndex,
          questionText: currentQuestion,
        },
        "info"
      );
    } catch (error) {
      logEvent(
        "recording_start",
        {
          error: String(error),
          questionIndex: currentQuestionIndex,
        },
        "error"
      );
    }
  }, [isAvatarAsking, currentQuestionIndex, currentQuestion, logEvent]);

  // User stops speaking - SAVE ANSWER & AUTO ADVANCE to next question
  const handleStopSpeaking = async () => {
    if (speechRecognitionRef.current && isSpeechListening) {
      speechRecognitionRef.current.stop();
      setIsSpeechListening(false);

      // Save current answer to backend for this question
      if (attemptId && userResponse.trim()) {
        try {
          await mockInterviewAPI.saveQuestionAnswer(attemptId, {
            questionIndex: currentQuestionIndex,
            questionText: currentQuestion,
            answerText: userResponse,
            timestamp: Date.now(),
            duration: elapsedTime,
          });

          logEvent(
            "answer_saved",
            {
              questionIndex: currentQuestionIndex,
              answerLength: userResponse.length,
            },
            "info"
          );
        } catch (error) {
          // Continue even if save fails
          logEvent(
            "answer_save_failed",
            {
              questionIndex: currentQuestionIndex,
              error: String(error),
            },
            "warning"
          );
        }
      }

      // Auto-advance to next question after stopping
      setTimeout(() => {
        nextQuestion();
      }, 500);
    }
  };

  // Speech recognition is now handled directly in handleStartInterview via onresult callback

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

      if (isSpeechListening && speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }

      if ("keyboard" in navigator && "unlock" in (navigator as any).keyboard) {
        (navigator as any).keyboard.unlock();
      }

      fullscreenControl.exitFullscreen();
    };
  }, [isSpeechListening]);

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
          currentFaceWarning={currentFaceWarning}
          submissionData={submissionData}
          isListening={isSpeechListening}
          videoRef={videoRef}
          audioCanvasRef={audioCanvasRef}
          onExitInterview={handleExitInterview}
          onQuestionComplete={handleQuestionComplete}
          onStartSpeaking={handleStartSpeaking}
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
            backgroundColor: "rgba(0, 0, 0, 0.8)",
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
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              overflow: "hidden",
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
