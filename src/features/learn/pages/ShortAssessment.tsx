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
  const location = useLocation();
  const { logEvent, getEventLog } = useProctoring();

  // Get camera stream from global variable (passed from InstructionPage)
  // MediaStream cannot be serialized in navigation state, so we use a global variable
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(
    (window as any).__assessmentCameraStream || null
  );
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
  const previousPathRef = useRef<string>("");
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

  // Function to reset layout (show navigation, restore styles)
  const resetLayout = useCallback(() => {
    // Find all navigation elements
    const topNav = document.querySelector(
      'nav[class*="TopNav"], header[class*="TopNav"], header'
    ) as HTMLElement;
    const sidebar = document.querySelector(".side-navigation") as HTMLElement;
    const sidebarNav = document.querySelector(
      "nav.fixed.z-\\[1111\\]"
    ) as HTMLElement;
    const mobileNav = document.querySelector(
      '[class*="MobileNavBar"]'
    ) as HTMLElement;
    const mainContent = document.querySelector("main") as HTMLElement;

    // Show navigation elements - remove inline styles completely to restore CSS defaults
    if (topNav) {
      topNav.style.removeProperty("display");
    }
    if (sidebar) {
      sidebar.style.removeProperty("display");
    }
    if (sidebarNav) {
      sidebarNav.style.removeProperty("display");
    }
    if (mobileNav) {
      mobileNav.style.removeProperty("display");
    }
    if (mainContent) {
      mainContent.style.removeProperty("marginLeft");
      mainContent.style.removeProperty("paddingTop");
      mainContent.style.removeProperty("margin-left");
      mainContent.style.removeProperty("padding-top");
    }

    // Show any other navigation elements
    document.querySelectorAll("nav").forEach((nav) => {
      const navElement = nav as HTMLElement;
      navElement.style.removeProperty("display");
      // Only set display if it was explicitly hidden
      if (navElement.style.display === "none") {
        navElement.style.display = "";
      }
    });

    // Also check for header elements
    document.querySelectorAll("header").forEach((header) => {
      const headerElement = header as HTMLElement;
      headerElement.style.removeProperty("display");
      if (headerElement.style.display === "none") {
        headerElement.style.display = "";
      }
    });
  }, []);

  // Function to enter fullscreen (must be called from user interaction)
  const attemptEnterFullscreen = useCallback(async (): Promise<boolean> => {
    // If already in fullscreen, return true
    if (checkFullscreenState()) {
      setHasEnteredFullscreen(true);
      return true;
    }

    try {
      const element = document.documentElement;
      let fullscreenPromise: Promise<void> | null = null;

      // Try to request fullscreen
      if (element.requestFullscreen) {
        try {
          fullscreenPromise = element.requestFullscreen({
            navigationUI: "hide",
          }) as Promise<void>;
        } catch (err: any) {
          // If navigationUI option fails, try without it
          if (
            err.name === "TypeError" ||
            err.message?.includes("navigationUI")
          ) {
            fullscreenPromise = element.requestFullscreen() as Promise<void>;
          } else {
            throw err;
          }
        }
      } else if ((element as any).webkitRequestFullscreen) {
        fullscreenPromise = (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        fullscreenPromise = (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        fullscreenPromise = (element as any).msRequestFullscreen();
      } else {
        throw new Error("Fullscreen API not supported");
      }

      // Wait for the promise to resolve
      if (fullscreenPromise) {
        await fullscreenPromise;
      }

      // Wait a moment for the fullscreen change event to fire
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check if fullscreen was actually entered
      const isFullscreen = checkFullscreenState();

      if (isFullscreen) {
        setHasEnteredFullscreen(true);
        logEvent("SCREEN_SHARE_START");
        return true;
      } else {
        // Fullscreen request was made but didn't work - wait a bit more and check again
        await new Promise((resolve) => setTimeout(resolve, 400));
        const isFullscreenRetry = checkFullscreenState();
        if (isFullscreenRetry) {
          setHasEnteredFullscreen(true);
          logEvent("SCREEN_SHARE_START");
          return true;
        }
        throw new Error(
          "Fullscreen request failed - browser may have blocked it"
        );
      }
    } catch (error) {
      // Log the error for debugging
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Fullscreen error:", errorMessage, error);
      logEvent("SCREEN_SHARE_STOP", { error: errorMessage });
      return false;
    }
  }, [logEvent, checkFullscreenState]);

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
  const exitFullscreen = useCallback(async (): Promise<void> => {
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
      // Fullscreen exit failed, continue anyway
      console.error("Error exiting fullscreen:", error);
    }
  }, []);

  // ADDED: Create a new wrapper function for finishing the assessment.
  const handleFinishAndRefetch = async () => {
    // Collect proctoring metadata before submission (includes all face detection events)
    const metadata = collectProctoringMetadata();

    // Clear any auto-return timers
    if ((window as any).__autoReturnFullscreenTimer) {
      clearTimeout((window as any).__autoReturnFullscreenTimer);
      (window as any).__autoReturnFullscreenTimer = null;
    }

    // Close fullscreen warning modal if open
    setFullscreenExitWarningOpen(false);

    // Exit fullscreen and wait for it to complete
    try {
      await exitFullscreen();

      // Wait for fullscreen to actually exit (with timeout)
      let attempts = 0;
      while (checkFullscreenState() && attempts < 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }
    } catch (error) {
      // Continue even if exit fails
      console.error("Error exiting fullscreen:", error);
    }

    // Reset layout (show navigation, restore styles)
    resetLayout();

    // Reset fullscreen state
    setHasEnteredFullscreen(false);

    // Stop all video and audio streams (camera and mic)
    stopAllStreams();

    // Submit with metadata
    handleFinishAssessment(metadata);

    // After completion, invalidate the ["courses"] query.
    queryClient.invalidateQueries({ queryKey: ["courses"] });
  };

  // Get the stream from global variable (set by InstructionPage) - run on mount
  useEffect(() => {
    // Get stream from global variable
    const globalStream = (window as any)
      .__assessmentCameraStream as MediaStream | null;

    if (!globalStream) {
      console.error(
        "Camera stream not found - InstructionPage should have set it"
      );
      return;
    }

    // Use the stream immediately - don't check if it's active, just use it
    console.log("Setting up camera stream from InstructionPage");
    setCameraStream(globalStream);
    streamRef.current = globalStream;

    // Register stream globally for cleanup (but don't stop it here)
    if (!(window as any).__globalMediaStreams) {
      (window as any).__globalMediaStreams = [];
    }
    if (!(window as any).__globalMediaStreams.includes(globalStream)) {
      (window as any).__globalMediaStreams.push(globalStream);
    }

    // Setup video element with retry logic
    const setupVideo = () => {
      if (videoRef.current && globalStream) {
        const video = videoRef.current;
        video.srcObject = globalStream;
        video.playsInline = true;
        video.muted = true;
        video
          .play()
          .then(() => {
            console.log("Video playing successfully");
            setTimeout(() => setIsVideoReady(true), 300);
          })
          .catch((err) => {
            console.warn("Video play failed, retrying...", err);
            setTimeout(setupVideo, 200);
          });
      } else if (!videoRef.current) {
        // Video ref not ready yet, retry
        setTimeout(setupVideo, 100);
      }
    };

    // Start setup immediately
    setupVideo();

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

    // Auto-enter fullscreen after a delay to ensure everything is ready
    const fullscreenTimer = setTimeout(async () => {
      if (!checkFullscreenState()) {
        console.log("Attempting to enter fullscreen...");
        const success = await attemptEnterFullscreen();
        if (success) {
          console.log("Fullscreen entered successfully");
        } else {
          console.warn("Fullscreen entry failed, will retry");
          // Retry once more after a delay
          setTimeout(async () => {
            await attemptEnterFullscreen();
          }, 1000);
        }
      }
    }, 1000);

    return () => {
      clearTimeout(fullscreenTimer);
    };
  }, []); // Run only on mount

  // Cleanup camera on unmount - only when actually leaving the page
  useEffect(() => {
    return () => {
      // Only cleanup when assessment is completed or we're actually navigating away
      // The stream should persist during the assessment
      const stopStream = (stream: MediaStream | null) => {
        if (stream) {
          stream.getTracks().forEach((track) => {
            track.stop();
          });
        }
      };

      // Only stop streams if assessment is completed
      if (isCompleted) {
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

        // Clear the global stream reference
        (window as any).__assessmentCameraStream = null;
      }

      // Always stop face detection on unmount
      if (faceDetectionIntervalRef.current) {
        clearInterval(faceDetectionIntervalRef.current);
        faceDetectionIntervalRef.current = null;
      }
    };
  }, [isCompleted]);

  // Monitor video - ensure it stays connected and playing
  useEffect(() => {
    if (!cameraStream || !videoRef.current || !streamRef.current || isCompleted)
      return;

    const video = videoRef.current;
    const stream = streamRef.current;

    // Always ensure video is connected to stream
    if (video.srcObject !== stream) {
      console.log("Reconnecting video to stream");
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;
    }

    const ensurePlay = () => {
      if (video.paused && video.srcObject) {
        video
          .play()
          .then(() => {
            console.log("Video play ensured");
          })
          .catch((err) => {
            console.warn("Video play failed, retrying...", err);
            setTimeout(ensurePlay, 200);
          });
      }
    };

    ensurePlay();

    const interval = setInterval(() => {
      // Always reconnect if srcObject is lost
      if (!video.srcObject && stream) {
        console.log("Video srcObject lost, reconnecting...");
        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;
        video.setAttribute("autoplay", "true");
      }

      // Ensure stream tracks are still active
      const videoTracks = stream.getVideoTracks();
      const activeVideoTracks = videoTracks.filter(
        (track) => track.readyState === "live"
      );
      if (activeVideoTracks.length === 0 && videoTracks.length > 0) {
        console.warn(
          "Video tracks became inactive - stream may have been stopped"
        );
      }

      // Ensure video is playing
      if (video.paused && video.srcObject) {
        video.play().catch(() => {});
      }

      // Ensure video is visible
      if (
        video.style.display === "none" ||
        video.style.visibility === "hidden"
      ) {
        video.style.display = "block";
        video.style.visibility = "visible";
      }

      // Check if video is ready
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

  // Auto-enter fullscreen when camera is ready and questions are loaded
  useEffect(() => {
    if (
      !checkFullscreenState() &&
      cameraStream &&
      streamRef.current &&
      questionsData.length > 0 &&
      !questionsLoading &&
      isVideoReady
    ) {
      // Auto-enter fullscreen after everything is ready
      const enterFullscreenTimer = setTimeout(async () => {
        console.log("Auto-entering fullscreen...");
        const success = await attemptEnterFullscreen();
        if (success) {
          console.log("Fullscreen entered successfully");
        } else {
          console.warn("Fullscreen entry failed, will retry");
          // Retry once more after a delay
          setTimeout(async () => {
            await attemptEnterFullscreen();
          }, 1000);
        }
      }, 800);

      return () => clearTimeout(enterFullscreenTimer);
    }
  }, [
    cameraStream,
    questionsData.length,
    questionsLoading,
    isVideoReady,
    attemptEnterFullscreen,
    checkFullscreenState,
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
        // Clear any auto-return timer
        if ((window as any).__autoReturnFullscreenTimer) {
          clearTimeout((window as any).__autoReturnFullscreenTimer);
          (window as any).__autoReturnFullscreenTimer = null;
        }
      } else if (wasFullscreenRef.current) {
        // We were in fullscreen but now we're not
        if (!isCompleted) {
          // Reset layout (show navigation, restore styles)
          resetLayout();

          // Show modal IMMEDIATELY - synchronous state update (no delays)
          setFullscreenExitWarningOpen(true);
          setHasEnteredFullscreen(false);

          // Log and update submission data (non-blocking)
          logEvent("WINDOW_BLUR", { reason: "fullscreen_exit" });
          setSubmissionData((prev) => ({
            ...prev,
            fullscreenExits: prev.fullscreenExits + 1,
          }));

          // Try to re-enter fullscreen immediately with retry logic
          const tryEnterFullscreen = async (attempt: number = 1) => {
            try {
              const success = await attemptEnterFullscreen();
              await new Promise((resolve) => setTimeout(resolve, 300));
              const isFullscreenNow = checkFullscreenState();

              if (success || isFullscreenNow) {
                // Hide navigation again after entering fullscreen
                const topNav = document.querySelector(
                  'nav[class*="TopNav"]'
                ) as HTMLElement;
                const sidebar = document.querySelector(
                  ".side-navigation"
                ) as HTMLElement;
                const mobileNav = document.querySelector(
                  '[class*="MobileNavBar"]'
                ) as HTMLElement;
                const mainContent = document.querySelector(
                  "main"
                ) as HTMLElement;

                if (topNav) topNav.style.display = "none";
                if (sidebar) sidebar.style.display = "none";
                if (mobileNav) mobileNav.style.display = "none";
                if (mainContent) {
                  mainContent.style.marginLeft = "0";
                  mainContent.style.paddingTop = "0";
                }
                document.querySelectorAll("nav").forEach((nav) => {
                  if (nav !== sidebar && nav !== mobileNav) {
                    (nav as HTMLElement).style.display = "none";
                  }
                });

                setFullscreenExitWarningOpen(false);
                setHasEnteredFullscreen(true);
              } else if (attempt < 3) {
                // Retry up to 3 times with increasing delays
                const delay = attempt * 500; // 500ms, 1000ms, 1500ms
                const autoReturnTimer = setTimeout(() => {
                  tryEnterFullscreen(attempt + 1);
                }, delay);
                (window as any).__autoReturnFullscreenTimer = autoReturnTimer;
              } else {
                // Keep modal open if all attempts failed
                console.error(
                  "Failed to auto-return to fullscreen after 3 attempts"
                );
              }
            } catch (error) {
              if (attempt < 3) {
                // Retry on error
                const delay = attempt * 500;
                const autoReturnTimer = setTimeout(() => {
                  tryEnterFullscreen(attempt + 1);
                }, delay);
                (window as any).__autoReturnFullscreenTimer = autoReturnTimer;
              } else {
                console.error("Failed to auto-return to fullscreen:", error);
              }
            }
          };

          // Start the auto-return process immediately
          tryEnterFullscreen(1);
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
  }, [
    isCompleted,
    logEvent,
    checkFullscreenState,
    attemptEnterFullscreen,
    resetLayout,
  ]);

  // Monitor ESC key and fullscreen state to ensure modal shows
  useEffect(() => {
    if (isCompleted) return;

    let wasFullscreen = checkFullscreenState();

    const checkFullscreenAfterESC = () => {
      // Check if fullscreen state changed
      const isCurrentlyFullscreen = checkFullscreenState();

      // If we were in fullscreen and now we're not, show the modal IMMEDIATELY
      if (
        wasFullscreen &&
        !isCurrentlyFullscreen &&
        !fullscreenExitWarningOpen
      ) {
        // Reset layout (show navigation, restore styles)
        resetLayout();

        // Show modal immediately - prioritize this
        setFullscreenExitWarningOpen(true);
        setHasEnteredFullscreen(false);

        // Log and update (non-blocking)
        logEvent("WINDOW_BLUR", { reason: "fullscreen_exit_detected" });
        setSubmissionData((prev) => ({
          ...prev,
          fullscreenExits: prev.fullscreenExits + 1,
        }));

        // Try to re-enter fullscreen immediately with retry logic
        const tryEnterFullscreen = async (attempt: number = 1) => {
          try {
            const success = await attemptEnterFullscreen();
            await new Promise((resolve) => setTimeout(resolve, 300));
            const isFullscreenNow = checkFullscreenState();

            if (success || isFullscreenNow) {
              // Hide navigation again after entering fullscreen
              const topNav = document.querySelector(
                'nav[class*="TopNav"]'
              ) as HTMLElement;
              const sidebar = document.querySelector(
                ".side-navigation"
              ) as HTMLElement;
              const mobileNav = document.querySelector(
                '[class*="MobileNavBar"]'
              ) as HTMLElement;
              const mainContent = document.querySelector("main") as HTMLElement;

              if (topNav) topNav.style.display = "none";
              if (sidebar) sidebar.style.display = "none";
              if (mobileNav) mobileNav.style.display = "none";
              if (mainContent) {
                mainContent.style.marginLeft = "0";
                mainContent.style.paddingTop = "0";
              }
              document.querySelectorAll("nav").forEach((nav) => {
                if (nav !== sidebar && nav !== mobileNav) {
                  (nav as HTMLElement).style.display = "none";
                }
              });

              setFullscreenExitWarningOpen(false);
              setHasEnteredFullscreen(true);
            } else if (attempt < 3) {
              // Retry up to 3 times with increasing delays
              const delay = attempt * 500; // 500ms, 1000ms, 1500ms
              setTimeout(() => {
                tryEnterFullscreen(attempt + 1);
              }, delay);
            } else {
              // Keep modal open if all attempts failed
              console.error(
                "Failed to auto-return to fullscreen after 3 attempts"
              );
            }
          } catch (error) {
            if (attempt < 3) {
              // Retry on error
              const delay = attempt * 500;
              setTimeout(() => {
                tryEnterFullscreen(attempt + 1);
              }, delay);
            } else {
              console.error("Failed to auto-return to fullscreen:", error);
            }
          }
        };

        // Start the auto-return process immediately
        tryEnterFullscreen(1);
      }

      wasFullscreen = isCurrentlyFullscreen;
    };

    // Monitor fullscreen state very frequently for quick detection (25ms for near-instant)
    const monitorInterval = setInterval(checkFullscreenAfterESC, 25);

    // Also check immediately on mount/update
    checkFullscreenAfterESC();

    // Also check after a very short delay to catch any missed changes
    const immediateCheck = setTimeout(checkFullscreenAfterESC, 10);

    return () => {
      clearInterval(monitorInterval);
      clearTimeout(immediateCheck);
    };
  }, [
    isCompleted,
    fullscreenExitWarningOpen,
    logEvent,
    attemptEnterFullscreen,
    resetLayout,
  ]);

  // Handle ESC key - allow it but show warning and try to re-enter fullscreen
  useEffect(() => {
    if (isCompleted) return;

    const handleESC = (e: KeyboardEvent) => {
      const isFullscreen = checkFullscreenState();

      // Only handle ESC if we're in fullscreen and assessment is not completed
      if (
        e.key === "Escape" &&
        isFullscreen &&
        !isCompleted &&
        !fullscreenExitWarningOpen
      ) {
        // Don't prevent default - let ESC work naturally
        // But immediately check if fullscreen was exited and show warning

        // Use a small delay to check after browser processes ESC
        setTimeout(() => {
          const stillFullscreen = checkFullscreenState();
          if (!stillFullscreen && !isCompleted) {
            // Reset layout (show navigation, restore styles)
            resetLayout();

            // Show modal IMMEDIATELY
            setFullscreenExitWarningOpen(true);
            setHasEnteredFullscreen(false);
            logEvent("WINDOW_BLUR", { reason: "esc_key_pressed" });
            setSubmissionData((prev) => ({
              ...prev,
              fullscreenExits: prev.fullscreenExits + 1,
            }));

            // Try to re-enter fullscreen immediately with retry logic
            const tryEnterFullscreen = async (attempt: number = 1) => {
              try {
                const success = await attemptEnterFullscreen();
                await new Promise((resolve) => setTimeout(resolve, 300));
                const isFullscreenNow = checkFullscreenState();

                if (success || isFullscreenNow) {
                  // Hide navigation again after entering fullscreen
                  const topNav = document.querySelector(
                    'nav[class*="TopNav"]'
                  ) as HTMLElement;
                  const sidebar = document.querySelector(
                    ".side-navigation"
                  ) as HTMLElement;
                  const mobileNav = document.querySelector(
                    '[class*="MobileNavBar"]'
                  ) as HTMLElement;
                  const mainContent = document.querySelector(
                    "main"
                  ) as HTMLElement;

                  if (topNav) topNav.style.display = "none";
                  if (sidebar) sidebar.style.display = "none";
                  if (mobileNav) mobileNav.style.display = "none";
                  if (mainContent) {
                    mainContent.style.marginLeft = "0";
                    mainContent.style.paddingTop = "0";
                  }
                  document.querySelectorAll("nav").forEach((nav) => {
                    if (nav !== sidebar && nav !== mobileNav) {
                      (nav as HTMLElement).style.display = "none";
                    }
                  });

                  setFullscreenExitWarningOpen(false);
                  setHasEnteredFullscreen(true);
                } else if (attempt < 3) {
                  // Retry up to 3 times with increasing delays
                  const delay = attempt * 500; // 500ms, 1000ms, 1500ms
                  const autoReturnTimer = setTimeout(() => {
                    tryEnterFullscreen(attempt + 1);
                  }, delay);
                  (window as any).__autoReturnFullscreenTimer = autoReturnTimer;
                } else {
                  // Keep modal open if all attempts failed
                  console.error(
                    "Failed to auto-return to fullscreen after 3 attempts"
                  );
                }
              } catch (error) {
                if (attempt < 3) {
                  // Retry on error
                  const delay = attempt * 500;
                  const autoReturnTimer = setTimeout(() => {
                    tryEnterFullscreen(attempt + 1);
                  }, delay);
                  (window as any).__autoReturnFullscreenTimer = autoReturnTimer;
                } else {
                  console.error("Failed to auto-return to fullscreen:", error);
                }
              }
            };

            // Start the auto-return process immediately
            tryEnterFullscreen(1);
          }
        }, 50); // Small delay to let browser process ESC
      }

      // Prevent F11 (fullscreen toggle)
      if (e.key === "F11" && isFullscreen && !isCompleted) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    // Prevent context menu (right-click) which might have exit options
    const preventContextMenu = (e: MouseEvent) => {
      if (checkFullscreenState() && !isCompleted) {
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

    document.addEventListener("keydown", handleESC, options);
    document.addEventListener("keyup", handleESC, options);
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
    window.addEventListener("keydown", handleESC, options);
    window.addEventListener("keyup", handleESC, options);

    return () => {
      document.removeEventListener("keydown", handleESC, options);
      document.removeEventListener("keyup", handleESC, options);
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
      window.removeEventListener("keydown", handleESC, options);
      window.removeEventListener("keyup", handleESC, options);
      clearTouchStart();
    };
  }, [
    hasEnteredFullscreen,
    checkFullscreenState,
    isCompleted,
    fullscreenExitWarningOpen,
    attemptEnterFullscreen,
    logEvent,
    resetLayout,
  ]);

  const handleResumeFullscreen = async () => {
    // Clear auto-return timer if user manually returns
    if ((window as any).__autoReturnFullscreenTimer) {
      clearTimeout((window as any).__autoReturnFullscreenTimer);
      (window as any).__autoReturnFullscreenTimer = null;
    }

    try {
      const success = await attemptEnterFullscreen();
      if (success || checkFullscreenState()) {
        // Hide navigation again after entering fullscreen
        const topNav = document.querySelector(
          'nav[class*="TopNav"]'
        ) as HTMLElement;
        const sidebar = document.querySelector(
          ".side-navigation"
        ) as HTMLElement;
        const mobileNav = document.querySelector(
          '[class*="MobileNavBar"]'
        ) as HTMLElement;
        const mainContent = document.querySelector("main") as HTMLElement;

        if (topNav) topNav.style.display = "none";
        if (sidebar) sidebar.style.display = "none";
        if (mobileNav) mobileNav.style.display = "none";
        if (mainContent) {
          mainContent.style.marginLeft = "0";
          mainContent.style.paddingTop = "0";
        }
        document.querySelectorAll("nav").forEach((nav) => {
          if (nav !== sidebar && nav !== mobileNav) {
            (nav as HTMLElement).style.display = "none";
          }
        });

        setFullscreenExitWarningOpen(false);
        setHasEnteredFullscreen(true);
        logEvent("WINDOW_FOCUS", { reason: "fullscreen_resumed" });
      }
    } catch (error) {
      // Fullscreen failed - keep modal open
      console.error("Failed to enter fullscreen:", error);
    }
  };

  // Prevent ESC from closing the fullscreen exit warning modal
  useEffect(() => {
    if (!fullscreenExitWarningOpen) return;

    const preventModalClose = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        // Don't close the modal - user must click the button
        return false;
      }
    };

    // Use capture phase to catch ESC before anything else
    document.addEventListener("keydown", preventModalClose, {
      capture: true,
      passive: false,
    });
    window.addEventListener("keydown", preventModalClose, {
      capture: true,
      passive: false,
    });

    return () => {
      document.removeEventListener("keydown", preventModalClose, {
        capture: true,
      } as any);
      window.removeEventListener("keydown", preventModalClose, {
        capture: true,
      } as any);
    };
  }, [fullscreenExitWarningOpen]);

  // Exit fullscreen on route change
  useEffect(() => {
    // Initialize previousPathRef on first render
    if (previousPathRef.current === "") {
      previousPathRef.current = location.pathname;
      return;
    }

    // Check if pathname changed
    if (previousPathRef.current !== location.pathname) {
      // Route changed - exit fullscreen
      const handleRouteChange = async () => {
        if (checkFullscreenState()) {
          try {
            await exitFullscreen();
            // Wait a bit for fullscreen to fully exit before resetting layout
            setTimeout(() => {
              resetLayout();
            }, 200);
            stopAllStreams();
            setHasEnteredFullscreen(false);
            setFullscreenExitWarningOpen(false);
          } catch (error) {
            console.error("Error exiting fullscreen on route change:", error);
            // Even if exit fails, reset layout
            resetLayout();
          }
        } else {
          // Not in fullscreen, just reset layout
          resetLayout();
        }
      };
      handleRouteChange();
      previousPathRef.current = location.pathname;
    }
  }, [
    location.pathname,
    exitFullscreen,
    resetLayout,
    stopAllStreams,
    checkFullscreenState,
  ]);

  // Cleanup on unmount - exit fullscreen and stop all streams ONLY when assessment is completed
  useEffect(() => {
    return () => {
      // Only cleanup if assessment is completed or we're actually navigating away
      if (isCompleted) {
        // Exit fullscreen
        if (checkFullscreenState()) {
          exitFullscreen().catch(() => {
            // Ignore errors during cleanup
          });
        }

        // Reset layout
        resetLayout();

        // Stop all streams only when completed
        stopAllStreams();

        // Clear any timers
        if ((window as any).__autoReturnFullscreenTimer) {
          clearTimeout((window as any).__autoReturnFullscreenTimer);
          (window as any).__autoReturnFullscreenTimer = null;
        }

        // Stop face detection
        if (faceDetectionIntervalRef.current) {
          clearInterval(faceDetectionIntervalRef.current);
          faceDetectionIntervalRef.current = null;
        }

        // Clear global stream reference
        (window as any).__assessmentCameraStream = null;
      } else {
        // Assessment not completed - only stop face detection, keep streams running
        if (faceDetectionIntervalRef.current) {
          clearInterval(faceDetectionIntervalRef.current);
          faceDetectionIntervalRef.current = null;
        }
      }
    };
  }, [
    isCompleted,
    exitFullscreen,
    resetLayout,
    stopAllStreams,
    checkFullscreenState,
  ]);

  // Exit fullscreen when assessment is completed (safety check)
  useEffect(() => {
    if (isCompleted) {
      // Exit fullscreen first
      if (checkFullscreenState()) {
        exitFullscreen()
          .then(() => {
            // Wait a bit for fullscreen to fully exit
            setTimeout(() => {
              resetLayout();
            }, 200);
          })
          .catch(() => {
            // Even if exit fails, reset layout
            resetLayout();
          });
      } else {
        // Not in fullscreen, just reset layout
        resetLayout();
      }
      setHasEnteredFullscreen(false);
      setFullscreenExitWarningOpen(false);
    }
  }, [isCompleted, exitFullscreen, resetLayout, checkFullscreenState]);

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
      {/* Video feed - positioned at right of screen - always show when camera is available */}
      {cameraStream && streamRef.current && !isCompleted && (
        <div className="fixed top-20 right-4 w-64 h-48 rounded-lg overflow-hidden shadow-2xl z-50 bg-black">
          {/* Video */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{
              transform: "scaleX(-1)",
              display: "block",
              visibility: "visible",
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
        <div
          className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center"
          onKeyDown={(e) => {
            // Prevent ESC from closing the modal
            if (e.key === "Escape" || e.keyCode === 27) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
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
