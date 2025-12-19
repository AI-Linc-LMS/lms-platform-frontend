import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ProctoringProvider } from "../../../components/mockInterview/proctoring/ProctoringProvider";
import { useProctoring } from "../../../components/mockInterview/proctoring/useProctoring";
import { loadBlazeFaceModel } from "../../../components/mockInterview/utils/faceDetectionLoader";
import { useAssessment } from "../hooks/useAssessment";
import {
  AssessmentHeader,
  QuestionNavigation,
  QuestionDisplay,
  NavigationButtons,
} from "../components/assessment";
import ReferralCodeDisplay from "../components/assessment/ReferralCodeDisplay";

// Inner component that uses proctoring context
const ShortAssessmentContent: React.FC<{
  currentAssessmentId: string;
  queryClient: ReturnType<typeof useQueryClient>;
}> = ({ currentAssessmentId, queryClient }) => {
  const navigate = useNavigate();
  const { logEvent, getEventLog } = useProctoring();

  // Video and fullscreen state
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(false);
  const [fullscreenExitWarningOpen, setFullscreenExitWarningOpen] =
    useState(false);
  const [faceStatus, setFaceStatus] = useState<"single" | "none" | "multiple">(
    "single"
  );
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const blazeFaceModelRef = useRef<any>(null);
  const faceDetectionIntervalRef = useRef<number | null>(null);
  const [faceDetectionReady, setFaceDetectionReady] = useState(false);
  const videoSetupDoneRef = useRef(false);
  const cameraInitializedRef = useRef(false); // Prevent multiple camera initializations

  // Face detection refs (matching InterviewRoom)
  const lastFaceStatusRef = useRef<string>("single");
  const noFaceCountRef = useRef<number>(0);
  const multipleFaceCountRef = useRef<number>(0);
  const noFaceStartTimeRef = useRef<number | null>(null);
  const multipleFaceStartTimeRef = useRef<number | null>(null);
  const lookingAwayStartTimeRef = useRef<number | null>(null);
  const lastFacePositionRef = useRef<{
    x: number;
    y: number;
    size: number;
  } | null>(null);

  // Assessment timing and submission data tracking (matching InterviewRoom)
  const startTimeRef = useRef<number>(Date.now());
  const [submissionData, setSubmissionData] = useState({
    faceValidationFailures: 0,
    multipleFaceDetections: 0,
    fullscreenExits: 0,
    noFaceIncidents: 0,
    noFaceDuration: 0, // in seconds
    lookingAwayIncidents: 0,
    lookingAwayDuration: 0, // in seconds
    multipleFaceIncidents: 0,
  });

  // Function to check if currently in fullscreen
  const checkFullscreenState = useCallback(() => {
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  }, []);

  // Function to enter fullscreen (must be called from user interaction)
  const attemptEnterFullscreen = useCallback(async (): Promise<boolean> => {
    if (hasEnteredFullscreen && checkFullscreenState()) return true;

    try {
      // Use document.documentElement for more reliable fullscreen
      const element = document.documentElement;

      if (element.requestFullscreen) {
        try {
          await element.requestFullscreen({ navigationUI: "hide" });
        } catch (err: any) {
          // If navigationUI option fails, try without it
          if (
            err.name === "TypeError" ||
            err.message?.includes("navigationUI")
          ) {
            await element.requestFullscreen();
          } else {
            throw err;
          }
        }
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      } else {
        throw new Error("Fullscreen API not supported");
      }

      // Wait a bit and verify fullscreen actually worked
      await new Promise((resolve) => setTimeout(resolve, 300));

      const isFullscreen = checkFullscreenState();

      if (isFullscreen) {
        setHasEnteredFullscreen(true);
        logEvent("SCREEN_SHARE_START");
        return true;
      } else {
        // Fullscreen request was made but didn't work
        throw new Error(
          "Fullscreen request failed - browser may have blocked it"
        );
      }
    } catch (error) {
      // Log the error for debugging
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logEvent("SCREEN_SHARE_STOP", { error: errorMessage });
      // Don't set hasEnteredFullscreen to true if it failed
      return false;
    }
  }, [hasEnteredFullscreen, logEvent, checkFullscreenState]);

  const {
    // State
    currentQuestionIndex,
    selectedOption,
    timeRemaining,
    isCompleted,
    questionsData,
    questionsLoading,
    questionsError,
    referralCode,

    // Actions
    handleOptionSelect,
    handleNext,
    handleBack,
    navigateToQuestion,
    handleFinishAssessment,

    // Utilities
    getQuestionButtonStyle,
    getAnsweredCount,
    getRemainingCount,
  } = useAssessment(currentAssessmentId);

  // Wrapper functions to trigger fullscreen on user interaction
  const handleOptionSelectWithFullscreen = useCallback(
    (optionId: string) => {
      attemptEnterFullscreen();
      handleOptionSelect(optionId);
    },
    [attemptEnterFullscreen, handleOptionSelect]
  );

  const handleNextWithFullscreen = useCallback(() => {
    attemptEnterFullscreen();
    handleNext();
  }, [attemptEnterFullscreen, handleNext]);

  const handleBackWithFullscreen = useCallback(() => {
    attemptEnterFullscreen();
    handleBack();
  }, [attemptEnterFullscreen, handleBack]);

  // Collect proctoring metadata - matching InterviewRoom format
  const collectProctoringMetadata = useCallback(() => {
    const proctoringEvents = getEventLog();
    const elapsedTime = Math.round((Date.now() - startTimeRef.current) / 1000); // in seconds

    // Count tab and window switches (matching InterviewRoom logic)
    const tabSwitches = proctoringEvents.filter(
      (e) => e.type === "TAB_BLUR"
    ).length;
    const windowSwitches = proctoringEvents.filter(
      (e) => e.type === "WINDOW_BLUR"
    ).length;

    // Format events array (matching InterviewRoom format)
    const events = proctoringEvents.map((pe) => ({
      timestamp: pe.timestamp,
      type: pe.type.toLowerCase().replace("_", "_") as any,
      data: pe.details || {},
      severity: "warning" as const,
    }));

    // Return metadata in InterviewRoom format
    return {
      events,
      duration: elapsedTime,
      faceValidationFailures: submissionData.faceValidationFailures,
      multipleFaceDetections: submissionData.multipleFaceDetections,
      fullscreenExits: submissionData.fullscreenExits,
      completedQuestions: currentQuestionIndex + 1,
      totalQuestions: questionsData.length,
      metadata: {
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timestamp: Date.now(),
        tabSwitches,
        windowSwitches,
        // Enhanced proctoring metrics
        noFaceIncidents: submissionData.noFaceIncidents,
        noFaceDuration: Math.round(submissionData.noFaceDuration),
        lookingAwayIncidents: submissionData.lookingAwayIncidents,
        lookingAwayDuration: Math.round(submissionData.lookingAwayDuration),
        multipleFaceIncidents: submissionData.multipleFaceIncidents,
      },
    };
  }, [getEventLog, submissionData, currentQuestionIndex, questionsData.length]);

  // Stop all video and audio streams
  const stopAllStreams = useCallback(() => {
    const stopStream = (stream: MediaStream | null) => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };

    // Stop main stream
    if (streamRef.current) {
      stopStream(streamRef.current);
      streamRef.current = null;
    }

    // Stop video element stream
    if (videoRef.current && videoRef.current.srcObject) {
      stopStream(videoRef.current.srcObject as MediaStream);
      videoRef.current.srcObject = null;
      videoRef.current.pause();
    }

    // Stop camera stream state
    if (cameraStream) {
      stopStream(cameraStream);
      setCameraStream(null);
    }

    // Clean up global streams
    if ((window as any).__globalMediaStreams) {
      (window as any).__globalMediaStreams.forEach((s: MediaStream) => {
        stopStream(s);
      });
      (window as any).__globalMediaStreams = [];
    }

    // Stop face detection
    if (faceDetectionIntervalRef.current) {
      clearInterval(faceDetectionIntervalRef.current);
      faceDetectionIntervalRef.current = null;
    }
  }, [cameraStream]);

  // Function to exit fullscreen
  const exitFullscreen = useCallback(() => {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    } catch (error) {
      // Fullscreen exit failed, continue anyway
    }
  }, []);

  // ADDED: Create a new wrapper function for finishing the assessment.
  const handleFinishAndRefetch = async () => {
    // Collect proctoring metadata before submission (includes all face detection events)
    const metadata = collectProctoringMetadata();

    // Exit fullscreen first
    exitFullscreen();

    // Stop all video and audio streams (camera and mic)
    stopAllStreams();

    // Submit with metadata
    handleFinishAssessment(metadata);

    // After completion, invalidate the ["courses"] query.
    queryClient.invalidateQueries({ queryKey: ["courses"] });
  };

  // Initialize camera on mount - ONLY ONCE
  useEffect(() => {
    // Prevent multiple initializations
    if (cameraInitializedRef.current) return;

    const initializeCamera = async () => {
      // Double-check to prevent race conditions
      if (cameraInitializedRef.current) return;
      cameraInitializedRef.current = true;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: true,
        });

        setCameraStream(stream);
        streamRef.current = stream;

        // Register stream globally for cleanup
        if (!(window as any).__globalMediaStreams) {
          (window as any).__globalMediaStreams = [];
        }
        (window as any).__globalMediaStreams.push(stream);

        // Setup video element immediately - InterviewRoom pattern
        if (videoRef.current) {
          const video = videoRef.current;
          video.srcObject = stream;
          video.playsInline = true;
          video.muted = true;
          video.play().catch(() => {});
          setTimeout(() => setIsVideoReady(true), 300);
        }

        logEvent("SCREEN_SHARE_START");

        // Load face detection model
        loadBlazeFaceModel()
          .then((model) => {
            blazeFaceModelRef.current = model;
            setFaceDetectionReady(true);
          })
          .catch(() => {
            // Face detection failed, continue without it
          });
      } catch (error) {
        // Reset flag on error so user can retry
        cameraInitializedRef.current = false;
        // Camera access denied or error - continue without video
        logEvent("SCREEN_SHARE_STOP", { error: "Camera access denied" });
      }
    };

    initializeCamera();

    // Cleanup on unmount
    return () => {
      const stopStream = (stream: MediaStream | null) => {
        if (stream) {
          stream.getTracks().forEach((track) => {
            track.stop();
          });
        }
      };

      if (streamRef.current) {
        stopStream(streamRef.current);
        streamRef.current = null;
      }

      if (videoRef.current && videoRef.current.srcObject) {
        stopStream(videoRef.current.srcObject as MediaStream);
        videoRef.current.srcObject = null;
        videoRef.current.pause();
        videoSetupDoneRef.current = false;
      }

      // Clean up global streams
      if ((window as any).__globalMediaStreams) {
        (window as any).__globalMediaStreams.forEach((s: MediaStream) => {
          stopStream(s);
        });
        (window as any).__globalMediaStreams = [];
      }

      // Stop face detection
      if (faceDetectionIntervalRef.current) {
        clearInterval(faceDetectionIntervalRef.current);
        faceDetectionIntervalRef.current = null;
      }

      // Reset initialization flag on cleanup
      cameraInitializedRef.current = false;
    };
  }, []); // Empty dependency array - only run once on mount

  // Monitor video - using InterviewRoom pattern (EXACT COPY from line 1199)
  useEffect(() => {
    if (!cameraStream || !videoRef.current || !streamRef.current || isCompleted)
      return;

    const video = videoRef.current;

    // Use streamRef.current directly like InterviewRoom to prevent flickering
    if (video.srcObject !== streamRef.current) {
      video.srcObject = streamRef.current;
      video.playsInline = true;
      video.muted = true;
    }

    const ensurePlay = () => {
      if (video.paused && video.srcObject) {
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
  }, [cameraStream, isVideoReady, isCompleted]);

  // Face detection when video is ready - using InterviewRoom pattern
  useEffect(() => {
    if (
      isVideoReady &&
      videoRef.current &&
      videoRef.current.srcObject &&
      blazeFaceModelRef.current &&
      faceDetectionReady &&
      cameraStream &&
      !isCompleted
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

            const currentTime = Date.now();

            // Calculate face position for looking away detection (simplified for ShortAssessment)
            let isLookingAway = false;
            if (faceCount === 1 && predictions[0]) {
              const prediction = predictions[0];
              const [x1, y1] = prediction.topLeft as [number, number];
              const [x2, y2] = prediction.bottomRight as [number, number];
              const faceWidth = x2 - x1;
              const faceHeight = y2 - y1;
              const faceCenterX = (x1 + x2) / 2;
              const faceCenterY = (y1 + y2) / 2;
              const faceSize = faceWidth * faceHeight;

              const videoWidth = videoRef.current.videoWidth;
              const videoHeight = videoRef.current.videoHeight;
              const videoCenterX = videoWidth / 2;
              const videoCenterY = videoHeight / 2;

              // Check if face is significantly off-center (looking away detection)
              const horizontalOffset =
                Math.abs(faceCenterX - videoCenterX) / videoWidth;
              const verticalOffset =
                Math.abs(faceCenterY - videoCenterY) / videoHeight;

              // Threshold: if face center is more than 30% away from center, consider looking away
              isLookingAway = horizontalOffset > 0.3 || verticalOffset > 0.25;

              // Store current face position
              lastFacePositionRef.current = {
                x: faceCenterX / videoWidth,
                y: faceCenterY / videoHeight,
                size: faceSize,
              };
            }

            // Handle "no face" status changes and duration tracking
            if (newStatus === "none") {
              if (lastFaceStatusRef.current !== "none") {
                noFaceStartTimeRef.current = currentTime;
                noFaceCountRef.current++;
                setSubmissionData((prev) => ({
                  ...prev,
                  noFaceIncidents: prev.noFaceIncidents + 1,
                  faceValidationFailures: prev.faceValidationFailures + 1,
                }));
                logEvent("FACE_NOT_DETECTED_START", {
                  timestamp: currentTime,
                  count: noFaceCountRef.current,
                });
              }
            } else {
              if (noFaceStartTimeRef.current !== null) {
                const duration =
                  (currentTime - noFaceStartTimeRef.current) / 1000;
                setSubmissionData((prev) => ({
                  ...prev,
                  noFaceDuration: prev.noFaceDuration + duration,
                }));
                logEvent("FACE_NOT_DETECTED_END", {
                  timestamp: currentTime,
                  duration: duration,
                });
                noFaceStartTimeRef.current = null;
              }
            }

            // Handle "multiple faces" status changes and duration tracking
            if (newStatus === "multiple") {
              if (lastFaceStatusRef.current !== "multiple") {
                multipleFaceStartTimeRef.current = currentTime;
                multipleFaceCountRef.current++;
                setSubmissionData((prev) => ({
                  ...prev,
                  multipleFaceIncidents: prev.multipleFaceIncidents + 1,
                  multipleFaceDetections: prev.multipleFaceDetections + 1,
                }));
                logEvent("MULTIPLE_FACES_START", {
                  timestamp: currentTime,
                  count: multipleFaceCountRef.current,
                  faceCount: faceCount,
                });
              }
            } else {
              if (multipleFaceStartTimeRef.current !== null) {
                const duration =
                  (currentTime - multipleFaceStartTimeRef.current) / 1000;
                logEvent("MULTIPLE_FACES_END", {
                  timestamp: currentTime,
                  duration: duration,
                });
                multipleFaceStartTimeRef.current = null;
              }
            }

            // Handle "looking away" detection
            if (isLookingAway && newStatus === "single") {
              if (lookingAwayStartTimeRef.current === null) {
                lookingAwayStartTimeRef.current = currentTime;
                setSubmissionData((prev) => ({
                  ...prev,
                  lookingAwayIncidents: prev.lookingAwayIncidents + 1,
                }));
                logEvent("LOOKING_AWAY_START", {
                  timestamp: currentTime,
                  facePosition: lastFacePositionRef.current,
                });
              }
            } else {
              if (lookingAwayStartTimeRef.current !== null) {
                const duration =
                  (currentTime - lookingAwayStartTimeRef.current) / 1000;
                setSubmissionData((prev) => ({
                  ...prev,
                  lookingAwayDuration: prev.lookingAwayDuration + duration,
                }));
                logEvent("LOOKING_AWAY_END", {
                  timestamp: currentTime,
                  duration: duration,
                });
                lookingAwayStartTimeRef.current = null;
              }
            }

            lastFaceStatusRef.current = newStatus;
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

                // Step 4: Resume detection
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
            faceDetectionIntervalRef.current = null;
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
          faceDetectionIntervalRef.current = null;
        }
      };
    }
  }, [
    isVideoReady,
    faceDetectionReady,
    cameraStream,
    logEvent,
    faceStatus,
    isCompleted,
  ]);

  // Try to enter fullscreen when questions are loaded (but may fail due to browser security)
  useEffect(() => {
    if (
      !hasEnteredFullscreen &&
      questionsData.length > 0 &&
      !questionsLoading
    ) {
      // Try to enter fullscreen, but it may fail without user gesture
      attemptEnterFullscreen();
    }
  }, [
    hasEnteredFullscreen,
    questionsData.length,
    questionsLoading,
    attemptEnterFullscreen,
  ]);

  // Hide navigation when in fullscreen
  useEffect(() => {
    const hideNavigation = () => {
      const isFullscreen = checkFullscreenState();
      const topNav = document.querySelector(
        'nav[class*="TopNav"]'
      ) as HTMLElement;
      const sidebar = document.querySelector(".side-navigation") as HTMLElement;
      const mobileNav = document.querySelector(
        '[class*="MobileNavBar"]'
      ) as HTMLElement;
      const mainContent = document.querySelector("main") as HTMLElement;

      if (isFullscreen) {
        // Hide navigation elements
        if (topNav) topNav.style.display = "none";
        if (sidebar) sidebar.style.display = "none";
        if (mobileNav) mobileNav.style.display = "none";
        if (mainContent) {
          mainContent.style.marginLeft = "0";
          mainContent.style.paddingTop = "0";
        }
        // Hide any other navigation elements
        document.querySelectorAll("nav").forEach((nav) => {
          if (nav !== sidebar && nav !== mobileNav) {
            (nav as HTMLElement).style.display = "none";
          }
        });
      } else {
        // Show navigation elements
        if (topNav) topNav.style.display = "";
        if (sidebar) sidebar.style.display = "";
        if (mobileNav) mobileNav.style.display = "";
        if (mainContent) {
          mainContent.style.marginLeft = "";
          mainContent.style.paddingTop = "";
        }
        document.querySelectorAll("nav").forEach((nav) => {
          (nav as HTMLElement).style.display = "";
        });
      }
    };

    const wasFullscreenRef = { current: checkFullscreenState() };

    const handleFullscreenChange = () => {
      hideNavigation();
      const isCurrentlyFullscreen = checkFullscreenState();

      // Update hasEnteredFullscreen state based on actual fullscreen state
      if (isCurrentlyFullscreen) {
        setHasEnteredFullscreen(true);
        setFullscreenExitWarningOpen(false);
      } else if (wasFullscreenRef.current) {
        // We were in fullscreen but now we're not
        setHasEnteredFullscreen(false);
        if (!isCompleted) {
          logEvent("WINDOW_BLUR", { reason: "fullscreen_exit" });
          setSubmissionData((prev) => ({
            ...prev,
            fullscreenExits: prev.fullscreenExits + 1,
          }));
          setFullscreenExitWarningOpen(true);

          // Auto-return to fullscreen after showing warning (2 seconds)
          const autoReturnTimer = setTimeout(async () => {
            try {
              const success = await attemptEnterFullscreen();
              if (success || checkFullscreenState()) {
                setFullscreenExitWarningOpen(false);
              }
            } catch (error) {
              // Fullscreen failed, keep warning open
            }
          }, 2000);

          // Store timer to clear if user manually returns
          (window as any).__autoReturnFullscreenTimer = autoReturnTimer;
        }
      }

      wasFullscreenRef.current = isCurrentlyFullscreen;
    };

    // Initial check
    hideNavigation();

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
  }, [isCompleted, logEvent, checkFullscreenState]);

  // Prevent accidental fullscreen exits and disable ESC/swipe
  useEffect(() => {
    // Always prevent ESC if in fullscreen, regardless of hasEnteredFullscreen state
    const isCurrentlyFullscreen = checkFullscreenState();
    if (!isCurrentlyFullscreen && !hasEnteredFullscreen) return;

    const preventExit = (e: KeyboardEvent) => {
      const isFullscreen = checkFullscreenState();

      // Prevent F11 (fullscreen toggle)
      if (e.key === "F11" && isFullscreen) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
      // Prevent ESC key from exiting fullscreen - CRITICAL
      if ((e.key === "Escape" || e.keyCode === 27) && isFullscreen) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        // Force prevent default on window level too
        if (e.cancelable) {
          e.preventDefault();
        }
        return false;
      }
    };

    // Prevent context menu (right-click) which might have exit options
    const preventContextMenu = (e: MouseEvent) => {
      if (checkFullscreenState()) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Prevent double-click from exiting fullscreen
    const preventDoubleClick = (e: MouseEvent) => {
      if (checkFullscreenState() && e.detail > 1) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Prevent swipe gestures (touch events) - block ALL swipes
    const preventSwipe = (e: TouchEvent) => {
      const isFullscreen = checkFullscreenState();
      if (isFullscreen) {
        // Prevent all swipe gestures - block if more than 1 touch or significant movement
        if (e.touches.length > 1) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
        // Also prevent single touch swipes if they're horizontal
        if (e.touches.length === 1) {
          const touch = e.touches[0];
          // Store initial touch position to detect swipe
          if (!(window as any).__touchStartX) {
            (window as any).__touchStartX = touch.clientX;
            (window as any).__touchStartY = touch.clientY;
          }
        }
      }
    };

    // Prevent wheel/scroll gestures that might trigger navigation
    const preventWheel = (e: WheelEvent) => {
      const isFullscreen = checkFullscreenState();
      if (isFullscreen) {
        // Prevent horizontal scrolling/swiping
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
        // Prevent pinch zoom
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      }
    };

    // Prevent touchmove gestures (swipes) - block ALL horizontal swipes
    const preventTouchMove = (e: TouchEvent) => {
      const isFullscreen = checkFullscreenState();
      if (isFullscreen) {
        // Block multi-touch
        if (e.touches.length > 1) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
        // Block horizontal swipes
        if (
          e.touches.length === 1 &&
          (window as any).__touchStartX !== undefined
        ) {
          const touch = e.touches[0];
          const deltaX = Math.abs(
            touch.clientX - (window as any).__touchStartX
          );
          const deltaY = Math.abs(
            touch.clientY - (window as any).__touchStartY
          );
          // If horizontal movement is greater than vertical, it's a swipe
          if (deltaX > deltaY && deltaX > 10) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
          }
        }
      }
    };

    // Clear touch start position on touch end
    const clearTouchStart = () => {
      (window as any).__touchStartX = undefined;
      (window as any).__touchStartY = undefined;
    };

    // Prevent gesture events (iOS)
    const preventGesture = (e: Event) => {
      if (checkFullscreenState()) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Use capture phase and non-passive for maximum blocking
    const options = { capture: true, passive: false };

    document.addEventListener("keydown", preventExit, options);
    document.addEventListener("keyup", preventExit, options);
    document.addEventListener("contextmenu", preventContextMenu, options);
    document.addEventListener("dblclick", preventDoubleClick, options);
    document.addEventListener("touchstart", preventSwipe, options);
    document.addEventListener("touchmove", preventTouchMove, options);
    document.addEventListener("touchend", clearTouchStart, options);
    document.addEventListener("touchcancel", clearTouchStart, options);
    document.addEventListener("wheel", preventWheel, options);
    document.addEventListener("gesturestart", preventGesture, options);
    document.addEventListener("gesturechange", preventGesture, options);
    document.addEventListener("gestureend", preventGesture, options);

    // Also add to window for extra coverage
    window.addEventListener("keydown", preventExit, options);
    window.addEventListener("keyup", preventExit, options);

    return () => {
      document.removeEventListener("keydown", preventExit, options);
      document.removeEventListener("keyup", preventExit, options);
      document.removeEventListener("contextmenu", preventContextMenu, options);
      document.removeEventListener("dblclick", preventDoubleClick, options);
      document.removeEventListener("touchstart", preventSwipe, options);
      document.removeEventListener("touchmove", preventTouchMove, options);
      document.removeEventListener("touchend", clearTouchStart, options);
      document.removeEventListener("touchcancel", clearTouchStart, options);
      document.removeEventListener("wheel", preventWheel, options);
      document.removeEventListener("gesturestart", preventGesture, options);
      document.removeEventListener("gesturechange", preventGesture, options);
      document.removeEventListener("gestureend", preventGesture, options);
      window.removeEventListener("keydown", preventExit, options);
      window.removeEventListener("keyup", preventExit, options);
      clearTouchStart();
    };
  }, [hasEnteredFullscreen, checkFullscreenState]);

  const handleResumeFullscreen = async () => {
    // Clear auto-return timer if user manually returns
    if ((window as any).__autoReturnFullscreenTimer) {
      clearTimeout((window as any).__autoReturnFullscreenTimer);
      (window as any).__autoReturnFullscreenTimer = null;
    }

    try {
      await attemptEnterFullscreen();
      setFullscreenExitWarningOpen(false);
      logEvent("WINDOW_FOCUS", { reason: "fullscreen_resumed" });
    } catch (error) {
      // Fullscreen failed
    }
  };

  const currentQuestion = questionsData[currentQuestionIndex];

  if (questionsLoading) {
    return <div>Loading questions...</div>;
  }

  if (questionsError) {
    return <div>Error loading questions: {questionsError.message}</div>;
  }

  // Assessment completed section
  if (isCompleted) {
    navigate(`/roadmap/${currentAssessmentId}`);
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[var(--neutral-50)] relative"
    >
      {/* Video feed - positioned at right of screen - hide when completed */}
      {cameraStream && !isCompleted && (
        <div className="fixed top-20 right-4 -translate-y-1/2 w-64 h-48 rounded-lg overflow-hidden shadow-2xl">
          {/* Video */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full"
            style={{
              objectFit: "cover",
              transform: "scaleX(-1)",
              display: "block",
              minWidth: "100%",
              minHeight: "100%",
            }}
          />

          {/* Status Indicators - Top Left */}
          <div className="absolute top-2 left-2 z-20 space-y-2">
            {/* Recording Status */}
            <div className="recording-indicator bg-red-500/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center space-x-2 shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-white text-xs font-bold">Recording</span>
            </div>

            {/* Face Status */}
            <div
              className={`face-status-indicator backdrop-blur-md px-3 py-1.5 rounded-full flex items-center space-x-2 shadow-lg ${
                faceStatus === "single" ? "bg-green-500/90" : "bg-yellow-500/90"
              }`}
            >
              <span className="text-white text-xs font-bold">
                {faceStatus === "single"
                  ? "✓ Face Detected"
                  : faceStatus === "none"
                  ? "⚠ No Face"
                  : "⚠ Multiple Faces"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen exit warning */}
      {fullscreenExitWarningOpen && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4 text-red-600">
              Fullscreen Exited
            </h3>
            <p className="text-gray-700 mb-4">
              You have exited fullscreen mode. Please return to fullscreen to
              continue the assessment.
            </p>
            <button
              onClick={handleResumeFullscreen}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Return to Fullscreen
            </button>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          <AssessmentHeader
            timeRemaining={timeRemaining}
            assessmentId={currentAssessmentId}
          />

          {/* Display referral code if present */}
          <ReferralCodeDisplay referralCode={referralCode} className="mb-4" />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="lg:col-span-1">
              <QuestionNavigation
                questionsData={questionsData}
                getQuestionButtonStyle={getQuestionButtonStyle}
                navigateToQuestion={navigateToQuestion}
                getAnsweredCount={getAnsweredCount}
                getRemainingCount={getRemainingCount}
              />
            </div>

            <div className="lg:col-span-3">
              {/* Fullscreen prompt if not entered yet */}
              {!hasEnteredFullscreen &&
                questionsData.length > 0 &&
                !questionsLoading && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-yellow-800">
                          Fullscreen Required
                        </h4>
                        <p className="text-sm text-yellow-700">
                          Please click the button below or interact with the
                          assessment to enter fullscreen mode.
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          attemptEnterFullscreen();
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                      >
                        Enter Fullscreen
                      </button>
                    </div>
                  </div>
                )}

              <QuestionDisplay
                currentQuestion={currentQuestion}
                currentQuestionIndex={currentQuestionIndex}
                totalQuestions={questionsData.length}
                selectedOption={selectedOption}
                handleOptionSelect={handleOptionSelectWithFullscreen}
              />

              <NavigationButtons
                currentQuestionIndex={currentQuestionIndex}
                handleBack={handleBackWithFullscreen}
                handleNext={handleNextWithFullscreen}
                // MODIFIED: Pass the new wrapper function to the Finish button.
                handleFinishAssessment={handleFinishAndRefetch}
                answeredCount={getAnsweredCount()}
                totalQuestions={questionsData.length}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ShortAssessment: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get assessment ID from URL params or location state
  const currentAssessmentId = assessmentId || location.state?.assessmentId;

  // Redirect to assessments list if no assessment ID is provided
  useEffect(() => {
    if (!currentAssessmentId) {
      navigate("/assessments");
      return;
    }
  }, [currentAssessmentId, navigate]);

  // Early return if no assessment ID - component will redirect
  if (!currentAssessmentId) {
    return (
      <div className="min-h-screen bg-[var(--neutral-50)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-500)]"></div>
      </div>
    );
  }

  return (
    <ProctoringProvider
      sessionId={
        currentAssessmentId ? `assessment-${currentAssessmentId}` : undefined
      }
    >
      <ShortAssessmentContent
        currentAssessmentId={currentAssessmentId}
        queryClient={queryClient}
      />
    </ProctoringProvider>
  );
};

export default ShortAssessment;
