import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

// Import custom hooks and components
import useFaceDetection from "../hooks/useFaceDetection";
import useMediaCapture from "../hooks/useMediaCapture";
import useFullscreenControl from "../hooks/useFullscreenControl";
import InterviewSetup from "./InterviewSetup";
import ActiveInterviewSession from "./ActiveInterviewSession";

interface InterviewRoomProps {
  topic: string;
  difficulty: string;
  onBack: () => void;
}

// Mock interview questions
const mockQuestions = {
  javascript: {
    beginner: [
      "Can you explain what JavaScript is and how it differs from other programming languages?",
      "What are the different data types in JavaScript?",
      "How do you declare variables in JavaScript?",
      "What is the difference between let, const, and var?",
      "Can you explain what a function is in JavaScript?",
    ],
    intermediate: [
      "What is closure in JavaScript and can you provide an example?",
      "Explain the concept of hoisting in JavaScript.",
      "What are arrow functions and how do they differ from regular functions?",
      "Can you explain the difference between synchronous and asynchronous programming?",
      "What is the event loop in JavaScript?",
    ],
    advanced: [
      "Explain prototypal inheritance in JavaScript.",
      "What are Promises and how do they work?",
      "Can you describe the difference between call, apply, and bind?",
      "What is the difference between shallow and deep copying?",
      "Explain how the this keyword works in different contexts.",
    ],
  },
  react: {
    beginner: [
      "What is React and why would you use it?",
      "What is JSX and how does it work?",
      "What are components in React?",
      "What is the difference between functional and class components?",
      "How do you handle events in React?",
    ],
    intermediate: [
      "What are React hooks and why were they introduced?",
      "Explain the useState and useEffect hooks.",
      "What is the difference between controlled and uncontrolled components?",
      "How does React's virtual DOM work?",
      "What is prop drilling and how can you avoid it?",
    ],
    advanced: [
      "Explain React's reconciliation algorithm.",
      "What are higher-order components and render props?",
      "How does React's context API work?",
      "What are the rules of hooks and why do they exist?",
      "Explain React's batching mechanism and concurrent features.",
    ],
  },
};

const InterviewRoom = ({ topic, difficulty, onBack }: InterviewRoomProps) => {
  // Event and warning tracking interface
  interface InterviewEvent {
    timestamp: number;
    type:
      | "face_detection"
      | "camera_permission"
      | "audio_permission"
      | "multiple_faces"
      | "no_face"
      | "face_valid"
      | "question_change"
      | "user_response"
      | "camera_ready"
      | "fullscreen_lock";
    data: any;
    severity: "info" | "warning" | "error";
  }

  // State management
  const [isRecording, setIsRecording] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAvatarAsking, setIsAvatarAsking] = useState(false);
  const [userResponse, setUserResponse] = useState("");
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [currentFaceWarning, setCurrentFaceWarning] = useState<string | null>(
    null
  );
  const [interviewEvents, setInterviewEvents] = useState<InterviewEvent[]>([]);
  const [submissionData, setSubmissionData] = useState({
    warnings: [] as string[],
    events: [] as InterviewEvent[],
    faceValidationFailures: 0,
    multipleFaceDetections: 0,
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

  // Custom hooks
  const faceDetection = useFaceDetection(videoRef);
  const mediaCapture: any = useMediaCapture();
  const fullscreenControl = useFullscreenControl(containerRef);

  // Get questions for current topic and difficulty
  const getQuestions = () => {
    const topicKey = topic.toLowerCase() as keyof typeof mockQuestions;
    const difficultyKey =
      difficulty.toLowerCase() as keyof typeof mockQuestions.javascript;
    return (
      mockQuestions[topicKey]?.[difficultyKey] ||
      mockQuestions.javascript.beginner
    );
  };

  const questions = getQuestions();
  const currentQuestion = questions[currentQuestionIndex];

  // Helper function to log events
  const logEvent = (
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
  };

  // Keyboard and fullscreen lock
  const lockKeyboard = useCallback(async () => {
    try {
      // Modern Keyboard Lock API (Chrome 68+)
      if ("keyboard" in navigator && "lock" in (navigator as any).keyboard) {
        await (navigator as any).keyboard.lock(["Escape"]);
        logEvent(
          "fullscreen_lock",
          { method: "keyboard_lock_api", status: "locked" },
          "info"
        );
      }
    } catch (error) {
      // Keyboard Lock API not available
    }

    // Fallback: Prevent ESC and F11 keys
    const preventEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "F11") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener("keydown", preventEscape, true);
    logEvent(
      "fullscreen_lock",
      { method: "event_listener", status: "locked" },
      "info"
    );

    // Store cleanup function
    return () => {
      document.removeEventListener("keydown", preventEscape, true);
      if ("keyboard" in navigator && "unlock" in (navigator as any).keyboard) {
        (navigator as any).keyboard.unlock();
      }
    };
  }, []);

  // Handle camera ready from setup
  const handleCameraReady = useCallback((stream: MediaStream) => {
    setPreInitializedStream(stream);
    setCameraPermissionGranted(true);
    logEvent("camera_permission", { status: "pre_initialized" }, "info");
  }, []);

  // Handle face detection changes
  useEffect(() => {
    if (!faceDetection.isLoading && faceDetection.faceDetection) {
      const { faceCount, isValidFrame } = faceDetection.faceDetection;

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
    } else if (!faceDetection.isLoading && !faceDetection.faceDetection) {
      if (currentFaceWarning !== "no_face") {
        setCurrentFaceWarning("no_face");
        logEvent("no_face", { reason: "no_detection_data" }, "warning");
      }
    }
  }, [
    faceDetection.faceDetection,
    faceDetection.isLoading,
    currentFaceWarning,
  ]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start timer
  const startTimer = () => {
    if (timerIntervalRef.current === null) {
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
  };

  // Stop timer
  const stopTimer = () => {
    if (timerIntervalRef.current !== null) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // Setup audio visualization
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
      // Audio visualization setup failed
    }
  };

  // Visualize audio levels
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

  // Start interview with pre-initialized stream
  const handleStartInterview = async () => {
    if (!preInitializedStream) {
      alert("Camera not ready. Please wait...");
      return;
    }

    logEvent("question_change", { action: "interview_started" }, "info");

    // Use the pre-initialized stream
    streamRef.current = preInitializedStream;
    setIsRecording(true);
    startTimer();

    // Setup video FAST - no complex waiting
    if (videoRef.current) {
      const video = videoRef.current;
      video.srcObject = preInitializedStream;

      // Simple play attempt
      video.play().catch(() => {});

      // Mark ready quickly
      setTimeout(() => setIsVideoReady(true), 500);
    }

    // Enter fullscreen - WAIT and ensure it works
    try {
      await fullscreenControl.enterFullscreen();

      // Wait longer for fullscreen to truly establish
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if actually in fullscreen
      const isInFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );

      if (!isInFullscreen) {
        // Retry once
        await fullscreenControl.enterFullscreen();
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      await lockKeyboard();

      // Lock fullscreen immediately after keyboard
      if ((window as any).__lockFullscreen) {
        (window as any).__lockFullscreen();
      }
    } catch (err) {
      // Fullscreen failed, continue anyway
    }

    // Setup MediaRecorder
    const mediaRecorder = new MediaRecorder(preInitializedStream, {
      mimeType: "video/webm;codecs=vp8,opus",
    });

    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      new Blob(chunks, { type: "video/webm" });
    };

    mediaRecorder.start(1000);
    mediaRecorderRef.current = mediaRecorder;

    // Setup audio visualization
    setupAudioVisualization(preInitializedStream);

    // Start first question FAST - no waiting for face detection
    // Face detection runs in background and shows warnings independently
    setTimeout(() => {
      setIsAvatarAsking(true);
      logEvent(
        "question_change",
        {
          questionIndex: currentQuestionIndex,
          question: currentQuestion,
        },
        "info"
      );
    }, 1200);
  };

  // Monitor and ensure video plays
  useEffect(() => {
    if (!isRecording || !videoRef.current || !streamRef.current) {
      return;
    }

    const video = videoRef.current;

    // Ensure video is assigned and playing
    if (video.srcObject !== streamRef.current) {
      video.srcObject = streamRef.current;
    }

    // Aggressive play attempts
    const ensurePlay = () => {
      if (video.paused) {
        video.play().catch(() => {
          // Retry
          setTimeout(ensurePlay, 200);
        });
      }
    };

    ensurePlay();

    // Check every 500ms
    const interval = setInterval(() => {
      if (video.paused && video.srcObject) {
        video.play().catch(() => {});
      }

      // Mark ready if playing
      if (!isVideoReady && video.readyState >= 2 && !video.paused) {
        setIsVideoReady(true);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isRecording, isVideoReady]);

  // Start face detection when video is ready
  useEffect(() => {
    if (isVideoReady && isRecording) {
      faceDetection.startDetection();
      return () => {
        faceDetection.stopDetection();
      };
    }
  }, [isVideoReady, isRecording, faceDetection]);

  // Handle exit interview
  const handleExitInterview = () => {
    // Unlock fullscreen temporarily to prevent auto re-entry
    if ((window as any).__unlockFullscreen) {
      (window as any).__unlockFullscreen();
    }

    setExitDialogOpen(true);
  };

  const confirmExit = async () => {
    stopTimer();
    setIsRecording(false);

    const finalSubmissionData = {
      ...submissionData,
      totalDuration: elapsedTime,
      completedQuestions: currentQuestionIndex + 1,
      totalQuestions: questions.length,
      events: interviewEvents,
      endTime: Date.now(),
      topic,
      difficulty,
    };

    logEvent(
      "question_change",
      {
        action: "interview_ended",
        submissionData: finalSubmissionData,
      },
      "info"
    );

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

    if (mediaCapture.isListening) {
      mediaCapture.stopSpeechRecognition();
    }

    // Unlock keyboard
    if ("keyboard" in navigator && "unlock" in (navigator as any).keyboard) {
      (navigator as any).keyboard.unlock();
    }

    // Unlock fullscreen before exiting
    if ((window as any).__unlockFullscreen) {
      (window as any).__unlockFullscreen();
    }

    await fullscreenControl.exitFullscreen();
    setExitDialogOpen(false);
    onBack();
  };

  const cancelExit = () => {
    setExitDialogOpen(false);

    // Re-lock fullscreen
    if ((window as any).__lockFullscreen) {
      (window as any).__lockFullscreen();
    }
  };

  // Move to next question
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setUserResponse("");
      setIsAvatarAsking(true);

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

      if (mediaCapture.isListening) {
        mediaCapture.stopSpeechRecognition();
      }
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

  // Handle avatar finishing speaking
  const handleQuestionComplete = () => {
    setIsAvatarAsking(false);
    setTimeout(() => {
      mediaCapture.startSpeechRecognition();
    }, 500);
  };

  // Speech recognition effect
  useEffect(() => {
    if (
      mediaCapture.speechResult?.isFinal &&
      mediaCapture.speechResult.transcript
    ) {
      const transcript = mediaCapture.speechResult.transcript;

      logEvent(
        "user_response",
        {
          questionIndex: currentQuestionIndex,
          transcript,
          confidence: mediaCapture.speechResult.confidence || 0,
          question: currentQuestion,
        },
        "info"
      );

      setUserResponse((prev) => {
        const newResponse = prev + " " + transcript;
        return newResponse.trim();
      });
    }
  }, [mediaCapture.speechResult, currentQuestionIndex, currentQuestion]);

  // Cleanup on unmount
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

      if (mediaCapture.isListening) {
        mediaCapture.stopSpeechRecognition();
      }

      if ("keyboard" in navigator && "unlock" in (navigator as any).keyboard) {
        (navigator as any).keyboard.unlock();
      }

      fullscreenControl.exitFullscreen();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          cameraPermissionGranted={cameraPermissionGranted}
          currentFaceWarning={currentFaceWarning}
          submissionData={submissionData}
          interviewEvents={interviewEvents}
          isListening={mediaCapture.isListening}
          isFaceDetectionLoading={faceDetection.isLoading}
          videoRef={videoRef}
          audioCanvasRef={audioCanvasRef}
          onNextQuestion={nextQuestion}
          onExitInterview={handleExitInterview}
          onQuestionComplete={handleQuestionComplete}
          formatTime={formatTime}
        />
      )}

      {/* Exit Confirmation Dialog - Visible in Fullscreen */}
      <Dialog
        open={exitDialogOpen}
        onClose={(_event, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") {
            return;
          }
          cancelExit();
        }}
        disableEscapeKeyDown
        disablePortal={false}
        maxWidth="sm"
        fullWidth
        container={() => containerRef.current}
        sx={{
          position: "absolute",
          "& .MuiDialog-container": {
            zIndex: 9999999,
            position: "absolute",
          },
          "& .MuiBackdrop-root": {
            zIndex: 9999998,
            position: "absolute",
          },
          "& .MuiDialog-paper": {
            zIndex: 9999999,
            backgroundColor: "white",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            position: "relative",
          },
        }}
        style={{
          zIndex: 9999999,
          position: "absolute",
        }}
      >
        <DialogTitle
          className="text-xl font-bold"
          sx={{ backgroundColor: "white" }}
        >
          End Interview?
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: "white" }}>
          <DialogContentText>
            Are you sure you want to end this interview session? Your recording
            will be saved and submitted for evaluation.
          </DialogContentText>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-1">
              Time Elapsed: {formatTime(elapsedTime)}
            </p>
            <p className="text-sm text-blue-800">
              Questions Completed: {currentQuestionIndex + 1} of{" "}
              {questions.length}
            </p>
          </div>
        </DialogContent>
        <DialogActions className="p-4" sx={{ backgroundColor: "white" }}>
          <Button
            onClick={cancelExit}
            variant="outlined"
            className="font-semibold"
          >
            Continue Interview
          </Button>
          <Button
            onClick={confirmExit}
            variant="contained"
            color="error"
            className="font-semibold"
          >
            End & Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default InterviewRoom;
