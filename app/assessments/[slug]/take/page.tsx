"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  use,
  lazy,
  Suspense,
  startTransition,
  memo,
} from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Button } from "@mui/material";
import { Loading } from "@/components/common/Loading";
import { useToast } from "@/components/common/Toast";
import { useAssessmentProctoring } from "@/lib/hooks/useAssessmentProctoring";
import { useAssessmentData } from "@/lib/hooks/useAssessmentData";
import { useAssessmentTimer } from "@/lib/hooks/useAssessmentTimer";
import { useAssessmentNavigation } from "@/lib/hooks/useAssessmentNavigation";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAutoSave } from "@/lib/hooks/useAutoSave";
import { useAssessmentSubmission } from "@/lib/hooks/useAssessmentSubmission";
import { useFullscreenHandler } from "@/lib/hooks/useFullscreenHandler";
import { useAssessmentSecurity } from "@/lib/hooks/useAssessmentSecurity";
import { AssessmentTimerBar } from "@/components/assessment/AssessmentTimerBar";
import { AssessmentNavigation } from "@/components/assessment/AssessmentNavigation";
import { StartAssessmentButton } from "@/components/assessment/StartAssessmentButton";
import { AssessmentQuizLayout } from "@/components/assessment/AssessmentQuizLayout";
import { AssessmentCodingLayout } from "@/components/assessment/AssessmentCodingLayout";
import { mergeAssessmentSections } from "@/utils/assessment.utils";
import { stopAllMediaTracks } from "@/lib/utils/cameraUtils";
import { getProctoringService } from "@/lib/services/proctoring.service";

// Lazy load dialogs only
const SubmissionDialog = lazy(() =>
  import("@/components/assessment/SubmissionDialog").then((m) => ({
    default: m.SubmissionDialog,
  }))
);
const FullscreenWarningDialog = lazy(() =>
  import("@/components/assessment/FullscreenWarningDialog").then((m) => ({
    default: m.FullscreenWarningDialog,
  }))
);

const MAX_VIOLATIONS = 100;

// Memoized question component to prevent unnecessary re-renders
const MemoizedQuizLayout = memo(AssessmentQuizLayout);
const MemoizedCodingLayout = memo(AssessmentCodingLayout);

export default function TakeAssessmentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { showToast } = useToast();

  // State
  const [submitting, setSubmitting] = useState(false);
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [showStartButton, setShowStartButton] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [responses, setResponses] = useState<
    Record<string, Record<string, any>>
  >({});

  // Refs
  const timeUpCallbackRef = useRef<(() => void) | null>(null);
  const isProctoringActiveRef = useRef(false);
  const isInitializingRef = useRef(false);
  const hasCheckedSubmission = useRef(false);
  const hasLoadedResponses = useRef(false);
  const answerChangeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Data hooks
  const { assessment, loading } = useAssessmentData(slug);

  // Preload proctoring model in background (non-blocking)
  useEffect(() => {
    if (assessment && !loading) {
      // Use requestIdleCallback if available, otherwise setTimeout
      const schedulePreload = () => {
        import("@/lib/services/proctoring.service").then(
          ({ getProctoringService }) => {
            const service = getProctoringService();
            service.initializeModel().catch(() => {
              // Silently fail - will load on demand
            });
          }
        );
      };

      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as any).requestIdleCallback(schedulePreload, { timeout: 2000 });
      } else {
        setTimeout(schedulePreload, 1000);
      }
    }
  }, [assessment, loading]);

  // Timer setup - ALWAYS use remaining_time if available
  const initialTimeSeconds = useMemo(() => {
    if (assessment?.remaining_time !== undefined && assessment?.remaining_time !== null) {
      return assessment.remaining_time * 60; // Convert minutes to seconds
    }
    if (assessment?.duration_minutes) {
      return assessment.duration_minutes * 60;
    }
    return 3600;
  }, [assessment?.remaining_time, assessment?.duration_minutes]);

  const timer = useAssessmentTimer({
    initialTimeSeconds,
    autoStart: false,
    onTimeUp: () => {
      if (timeUpCallbackRef.current) {
        timeUpCallbackRef.current();
      }
    },
  });

  // Sections - memoized to prevent unnecessary recalculations
  // Calculate immediately but use startTransition for updates to prevent blocking
  const sections = useMemo(() => {
    if (!assessment) return [];
    const merged = mergeAssessmentSections(
      assessment.quizSection || [],
      assessment.codingProblemSection || []
    );
    // Debug: Log sections to help diagnose issues
    if (merged.length === 0) {
      console.warn("No sections found in assessment:", {
        quizSection: assessment.quizSection,
        codingProblemSection: assessment.codingProblemSection,
        assessment: assessment
      });
    }
    return merged;
  }, [assessment]);

  // Proctoring
  const handleViolationThresholdReached = useCallback(() => {
    // Handled by proctoring system
  }, []);

  // Track eye movement violations for warnings
  const eyeMovementCountRef = useRef(0);
  const lastEyeMovementWarningRef = useRef(0);

  const {
    isActive: isProctoringActive,
    isInitializing,
    faceCount,
    status,
    metadata,
    startProctoring,
    stopProctoring,
    enterFullscreen,
    videoRef,
  } = useAssessmentProctoring({
    assessmentId: assessment?.id || 0,
    maxViolations: MAX_VIOLATIONS,
    onViolationThresholdReached: handleViolationThresholdReached,
    autoStart: false,
  });

  // Show warning when eye movement violations occur
  useEffect(() => {
    const eyeMovementCount = metadata.proctoring.eye_movement_count || 0;
    
    if (eyeMovementCount > eyeMovementCountRef.current) {
      eyeMovementCountRef.current = eyeMovementCount;
      
      // Show warning every 3 violations to avoid spam
      const now = Date.now();
      if (now - lastEyeMovementWarningRef.current > 5000) { // 5 second cooldown
        lastEyeMovementWarningRef.current = now;
        // showToast(
        //   `Eye movement detected`,
        //   "warning"
        // );
      }
    }
  }, [metadata.proctoring.eye_movement_count, showToast]);

  // Navigation
  const navigation = useAssessmentNavigation({
    currentSectionIndex,
    currentQuestionIndex,
    sections,
    setCurrentSectionIndex,
    setCurrentQuestionIndex,
  });

  // Security measures - disable beforeunload during submission
  useAssessmentSecurity({ enabled: assessmentStarted, submitting });
  useKeyboardShortcuts({ enabled: assessmentStarted });

  // Check if already submitted
  useEffect(() => {
    if (assessment && !hasCheckedSubmission.current) {
      hasCheckedSubmission.current = true;
      if (assessment.status === "submitted") {
        showToast("This assessment has already been submitted", "warning");
        router.push(`/assessments/${slug}`);
      }
    }
  }, [assessment, slug, router, showToast]);

  // Load saved responses from responseSheet - ASYNC and DEFERRED to prevent freeze
  useEffect(() => {
    if (assessment && sections.length > 0 && !hasLoadedResponses.current) {
      hasLoadedResponses.current = true;

      // Initialize empty structure immediately (non-blocking)
      const initialResponses: Record<string, Record<string, any>> = {};
      sections.forEach((section: any) => {
        const sectionType = section.section_type || "quiz";
        if (!initialResponses[sectionType]) {
          initialResponses[sectionType] = {};
        }
      });
      setResponses(initialResponses);

      // Set initial section and question immediately - use first section by order
      if (sections.length > 0) {
        setCurrentSectionIndex(0);
        setCurrentQuestionIndex(0);
      }

      // Parse responseSheet asynchronously after initial render (deferred with longer delay)
      if (assessment.responseSheet) {
        // Use requestIdleCallback or setTimeout to defer heavy parsing - longer delay to prevent freeze
        const parseResponseSheet = () => {
          try {
            const responseSheet = assessment.responseSheet;
            const loadedResponses: Record<string, Record<string, any>> = {};

            // Process quizSectionId array - structure: quizSectionId[0]["75"]["84205"] = "a"
            if (responseSheet.quizSectionId && Array.isArray(responseSheet.quizSectionId)) {
              if (!loadedResponses["quiz"]) {
                loadedResponses["quiz"] = {};
              }

              responseSheet.quizSectionId.forEach((sectionData: any) => {
                // sectionData is like: { "75": { "84205": "a", "84206": "a", ... } }
                Object.keys(sectionData).forEach((sectionIdKey) => {
                  const questionResponses = sectionData[sectionIdKey];
                  
                  // Map each question response - bind ALL responses including null
                  Object.keys(questionResponses).forEach((questionIdKey) => {
                    const response = questionResponses[questionIdKey];
                    const questionId = Number(questionIdKey);
                    
                    // Bind ALL responses including null (null means question was cleared/unanswered)
                    // Store with multiple ID formats for compatibility
                    if (response !== undefined) {
                      loadedResponses["quiz"][questionId] = response;
                      loadedResponses["quiz"][String(questionId)] = response;
                    }
                  });
                });
              });
            }

            // Process codingProblemSectionId array - similar structure
            if (responseSheet.codingProblemSectionId && Array.isArray(responseSheet.codingProblemSectionId)) {
              if (!loadedResponses["coding"]) {
                loadedResponses["coding"] = {};
              }

              responseSheet.codingProblemSectionId.forEach((sectionData: any) => {
                Object.keys(sectionData).forEach((sectionIdKey) => {
                  const questionResponses = sectionData[sectionIdKey];
                  
                  Object.keys(questionResponses).forEach((questionIdKey) => {
                    const response = questionResponses[questionIdKey];
                    const questionId = Number(questionIdKey);
                    
                    if (response !== undefined) {
                      loadedResponses["coding"][questionId] = response;
                      loadedResponses["coding"][String(questionId)] = response;
                    }
                  });
                });
              });
            }

            // Only update if we found saved responses - use startTransition for non-blocking update
            if (Object.keys(loadedResponses).length > 0) {
              startTransition(() => {
                setResponses(loadedResponses);
              });
            }
          } catch (error) {
            console.error("Error parsing responseSheet:", error);
            // Silently fail - already initialized empty structure
          }
        };

        // Defer parsing with much longer delay to prevent blocking UI and camera
        // Parse after camera has initialized and UI is interactive (3+ seconds)
        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
          (window as any).requestIdleCallback(parseResponseSheet, { timeout: 8000 });
        } else {
          setTimeout(parseResponseSheet, 3000);
        }
      }
    }
  }, [assessment, sections]);

  // Auto-save
  useAutoSave({
    enabled: assessmentStarted && !submitting,
    slug,
    responses,
    sections,
    metadata,
  });

  // Track proctoring state
  useEffect(() => {
    isProctoringActiveRef.current = isProctoringActive;
  }, [isProctoringActive]);

  // Stop camera immediately when submission starts
  useEffect(() => {
    if (submitting) {
      // Stop camera as soon as submission starts
      try {
        stopProctoring();
        try {
          const proctoringService = getProctoringService();
          if (proctoringService) {
            proctoringService.stopProctoring();
          }
        } catch (error) {
          // Continue
        }
        stopAllMediaTracks();
        document.querySelectorAll("video, audio").forEach((element) => {
          const mediaElement = element as HTMLVideoElement | HTMLAudioElement;
          if (mediaElement.srcObject) {
            (mediaElement.srcObject as MediaStream).getTracks().forEach((track) => {
              track.stop();
            });
            mediaElement.srcObject = null;
          }
        });
      } catch (error) {
        // Silently fail
      }
    }
  }, [submitting, stopProctoring]);

  // Fullscreen handler
  const {
    showFullscreenWarning,
    setShowFullscreenWarning,
    handleReEnterFullscreen,
  } = useFullscreenHandler({
    enabled: assessmentStarted,
    submitting,
    enterFullscreen,
  });

  // Submission handler
  const { handleFinalSubmit } = useAssessmentSubmission({
    assessment,
    slug,
    responses,
    sections,
    metadata,
    navigation,
    stopProctoring,
    setSubmitting,
    setShowFullscreenWarning,
    setShowSubmitDialog,
  });

  // Pre-initialize camera IMMEDIATELY as soon as videoRef is available (before assessment starts)
  // This ensures camera is ready when assessment starts
  useEffect(() => {
    if (
      videoRef.current &&
      assessment &&
      !loading &&
      assessment.status !== "submitted" &&
      !assessmentStarted &&
      assessment.proctoring_enabled !== false
    ) {
      // Start camera immediately - don't wait for assessment to start
      // This makes camera preview appear instantly when assessment begins
      const startCameraEarly = async () => {
        try {
          // Start proctoring immediately (non-blocking)
          startProctoring().catch(() => {
            // Silently fail - will retry when assessment starts
          });
        } catch (error) {
          // Silently fail
        }
      };
      
      // Start immediately - no delay
      startCameraEarly();
    }
  }, [videoRef.current, assessment, loading, assessmentStarted, startProctoring]);

  // Start assessment - prioritize camera, defer heavy operations
  const handleStartAssessment = useCallback(async () => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;
    setShowStartButton(false);

    try {
      // Start timer first (non-blocking)
      setAssessmentStarted(true);
      timer.start();

      // Camera should already be started by pre-initialization
      // Just ensure video is playing if camera is already active
      if (assessment?.proctoring_enabled !== false) {
        // If camera isn't already active, start it now
        if (!isProctoringActive) {
          startProctoring().catch(() => {
            showToast(
              "Camera initialization failed. Please ensure camera permissions are granted.",
              "error"
            );
          });
        } else if (videoRef.current) {
          // Camera is already active, just ensure video is playing
          if (videoRef.current.srcObject) {
            videoRef.current.play().catch(() => {
              // Silently fail - will retry
            });
          }
        }
      }

      // Defer fullscreen to allow camera to start
      setTimeout(() => {
        enterFullscreen()
          .then(() => {
            setTimeout(() => {
              const isFS =
                !!document.fullscreenElement ||
                !!(document as any).webkitFullscreenElement ||
                !!(document as any).mozFullScreenElement ||
                !!(document as any).msFullscreenElement;

              if (!isFS) {
                setShowFullscreenWarning(true);
              }
            }, 100);
          })
          .catch(() => {
            setShowFullscreenWarning(true);
          });
      }, 100);
    } catch (error: any) {
      showToast(error.message || "Failed to start assessment.", "error");
      setShowStartButton(true);
      isInitializingRef.current = false;
    }
  }, [
    timer,
    startProctoring,
    enterFullscreen,
    showToast,
    setShowFullscreenWarning,
    assessment,
    videoRef,
  ]);

  // Time up handler
  useEffect(() => {
    timeUpCallbackRef.current = () => {
      showToast("Time is up! Submitting assessment...", "warning");
      handleFinalSubmit();
    };
  }, [handleFinalSubmit, showToast]);
  
  // Track if timer has been initialized to prevent multiple resets
  const timerInitializedRef = useRef(false);
  const lastRemainingTimeRef = useRef<number | null>(null);
  
  // Update timer when remaining_time changes (for resuming assessments) - DEFERRED to prevent freeze
  useEffect(() => {
    if (assessment?.remaining_time !== undefined && assessment?.remaining_time !== null) {
      const newTimeSeconds = assessment.remaining_time * 60;
      
      // If remaining_time is 0, auto-submit immediately
      if (assessment.remaining_time === 0 && assessmentStarted && !submitting) {
        showToast("Time is up! Submitting assessment...", "warning");
        handleFinalSubmit();
        return;
      }
      
      // Only reset if time actually changed (not just on every render)
      if (lastRemainingTimeRef.current !== assessment.remaining_time) {
        lastRemainingTimeRef.current = assessment.remaining_time;
        
        // Defer timer reset to prevent blocking initial render
        const resetTimer = () => {
          const timeDifference = Math.abs(timer.remainingSeconds - newTimeSeconds);
          // Only reset if difference is significant (more than 10 seconds) or not initialized
          if (!timerInitializedRef.current || timeDifference > 10) {
            timerInitializedRef.current = true;
            timer.reset(newTimeSeconds);
            if (assessmentStarted) {
              timer.start();
            }
          }
        };
        
        // Defer with longer delay to prevent freeze
        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
          (window as any).requestIdleCallback(resetTimer, { timeout: 1000 });
        } else {
          setTimeout(resetTimer, 300);
        }
      }
    }
  }, [assessment?.remaining_time, assessment?.status, assessmentStarted, submitting, timer, showToast, handleFinalSubmit]);
  
  // Auto-start when assessment loads (if not submitted) - deferred to prevent freeze
  useEffect(() => {
    if (
      assessment &&
      !loading &&
      assessment.status !== "submitted" &&
      !assessmentStarted &&
      !showStartButton &&
      sections.length > 0
    ) {
      // Defer auto-start to allow initial render, timer, and camera pre-warming
      const startTimer = setTimeout(() => {
        handleStartAssessment();
      }, 150);
      
      return () => clearTimeout(startTimer);
    }
  }, [assessment, loading, assessmentStarted, showStartButton, sections.length, handleStartAssessment]);

  // Cleanup on unmount - ensure camera is always stopped
  useEffect(() => {
    return () => {
      // Aggressively stop camera on unmount
      try {
        // Stop proctoring hook
        if (isProctoringActiveRef.current) {
          stopProctoring();
        }

        // Stop proctoring service
        try {
          const proctoringService = getProctoringService();
          if (proctoringService) {
            proctoringService.stopProctoring();
          }
        } catch (error) {
          // Continue
        }

        // Stop all media tracks utility
        try {
          stopAllMediaTracks();
        } catch (error) {
          // Continue
        }

        // Force stop all video and audio elements
        document.querySelectorAll("video, audio").forEach((element) => {
          const mediaElement = element as HTMLVideoElement | HTMLAudioElement;
          if (mediaElement.srcObject) {
            const stream = mediaElement.srcObject as MediaStream;
            stream.getTracks().forEach((track) => {
              track.stop(); // Stop regardless of state
            });
            mediaElement.srcObject = null;
            mediaElement.pause();
          }
        });

        // Additional cleanup: stop any getUserMedia streams
        if (navigator.mediaDevices) {
          navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
              stream.getTracks().forEach((track) => track.stop());
            })
            .catch(() => {
              // Ignore - this is just cleanup
            });
        }
      } catch (error) {
        // Silently fail - but try one more pass
        try {
          document.querySelectorAll("video, audio").forEach((element) => {
            const mediaElement = element as HTMLVideoElement | HTMLAudioElement;
            if (mediaElement.srcObject) {
              (mediaElement.srcObject as MediaStream).getTracks().forEach((track) => {
                track.stop();
              });
              mediaElement.srcObject = null;
            }
          });
        } catch (finalError) {
          // Last resort
        }
      }

      // Clear debounce timer
      if (answerChangeDebounceRef.current) {
        clearTimeout(answerChangeDebounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Answer change handler - debounced to prevent excessive updates
  const handleAnswerChange = useCallback(
    (sectionType: string, questionId: string | number, answer: any) => {
      // Clear existing debounce
      if (answerChangeDebounceRef.current) {
        clearTimeout(answerChangeDebounceRef.current);
      }

      // Debounce for 100ms to batch rapid changes
      answerChangeDebounceRef.current = setTimeout(() => {
        setResponses((prev) => {
          // If answer is null/undefined, remove it from responses (clear answer)
          if (answer === null || answer === undefined) {
            const newSectionResponses = { ...prev[sectionType] };
            delete newSectionResponses[questionId];
            // Only update if the answer actually existed
            if (prev[sectionType]?.[questionId] !== undefined) {
              return {
                ...prev,
                [sectionType]: newSectionResponses,
              };
            }
            return prev;
          }

          // Quick check to avoid unnecessary state updates
          const currentAnswer = prev[sectionType]?.[questionId];
          if (
            currentAnswer === answer ||
            (typeof answer === "object" &&
              typeof currentAnswer === "object" &&
              JSON.stringify(currentAnswer) === JSON.stringify(answer))
          ) {
            return prev;
          }

          return {
            ...prev,
            [sectionType]: {
              ...prev[sectionType],
              [questionId]: answer,
            },
          };
        });
      }, 100);
    },
    []
  );

  // Dialog handlers
  const handleShowSubmitDialog = useCallback(() => {
    setShowSubmitDialog(true);
  }, []);

  const handleCloseSubmitDialog = useCallback(() => {
    setShowSubmitDialog(false);
  }, []);

  // Section change handler - IMMEDIATE, never block navigation
  const handleSectionChange = useCallback((sectionIndex: number) => {
    // Never block navigation - update immediately
    setCurrentSectionIndex(sectionIndex);
    setCurrentQuestionIndex(0);
    // Don't use transition state - it blocks navigation
  }, []);

  // Computed values - heavily memoized
  const currentSection = useMemo(
    () => (sections.length > 0 ? sections[currentSectionIndex] : null),
    [sections, currentSectionIndex]
  );

  const sectionType = useMemo(
    () => currentSection?.section_type || "quiz",
    [currentSection]
  );

  const quizQuestions = useMemo(() => {
    if (!currentSection || sectionType !== "quiz") return [];
    return currentSection.questions || [];
  }, [currentSection, sectionType]);

  const mappedQuizQuestions = useMemo(() => {
    if (!quizQuestions.length) return [];
    const sectionResponses = responses[sectionType] || {};
    return quizQuestions.map((q: any) => ({
      id: q.id,
      question: q.question,
      answered: !!sectionResponses[q.id],
    }));
  }, [quizQuestions, responses, sectionType]);

  // Optimized section status - use ref to prevent recalculation on every navigation
  const sectionStatusRef = useRef<any[]>([]);
  const lastResponsesHashRef = useRef<string>("");
  
  const sectionStatus = useMemo(() => {
    // Create a simple hash of responses to detect actual changes
    const responsesHash = JSON.stringify(Object.keys(responses).map(key => ({
      key,
      count: Object.keys(responses[key] || {}).length
    })));
    
    // Only recalculate if responses actually changed
    if (responsesHash === lastResponsesHashRef.current && sectionStatusRef.current.length > 0) {
      return sectionStatusRef.current;
    }
    
    lastResponsesHashRef.current = responsesHash;
    
    const status = sections.map((section: any) => {
      const sectionType = section.section_type || "quiz";
      const sectionResponses = responses[sectionType] || {};
      const sectionQuestions = section.questions || [];
      
      // Count answered questions for THIS specific section only
      let answered = 0;
      sectionQuestions.forEach((question: any) => {
        const questionId = question.id;
        const response = sectionResponses[questionId];
        
        // For quiz: check if answer is selected
        if (sectionType === "quiz") {
          if (response !== undefined && response !== null && response !== "") {
            answered++;
          }
        } 
        // For coding: check if code was explicitly submitted
        else if (sectionType === "coding") {
          if (
            response &&
            response.submitted === true &&
            (response.tc_passed !== undefined ||
              response.total_tc !== undefined ||
              response.passed !== undefined ||
              response.total_test_cases !== undefined)
          ) {
            answered++;
          }
        }
      });
      
      return {
        sectionName: section.title || section.section_type || "Section",
        sectionType: sectionType,
        answered,
        total: sectionQuestions.length,
      };
    });
    
    sectionStatusRef.current = status;
    return status;
  }, [sections, responses]);

  // Optimized totalAnswered - use ref to prevent recalculation on every navigation
  const totalAnsweredRef = useRef<number>(0);
  const lastTotalAnsweredHashRef = useRef<string>("");
  
  const totalAnswered = useMemo(() => {
    // Create a simple hash to detect actual changes
    const hash = JSON.stringify(Object.keys(responses).map(key => ({
      key,
      count: Object.keys(responses[key] || {}).length
    })));
    
    // Only recalculate if responses actually changed
    if (hash === lastTotalAnsweredHashRef.current) {
      return totalAnsweredRef.current;
    }
    
    lastTotalAnsweredHashRef.current = hash;
    
    const total = Object.values(responses).reduce(
      (sum: number, sectionResponses: any) => {
        if (!sectionResponses || typeof sectionResponses !== "object") {
          return sum;
        }
        return (
          sum +
          Object.keys(sectionResponses).filter(
            (key) =>
              sectionResponses[key] !== undefined &&
              sectionResponses[key] !== null &&
              sectionResponses[key] !== ""
          ).length
        );
      },
      0
    );
    
    totalAnsweredRef.current = total;
    return total;
  }, [responses]);

  // Handlers - memoized
  const handleQuizAnswerSelect = useCallback(
    (answerId: string | number) => {
      const question = quizQuestions[currentQuestionIndex];
      if (question) {
        handleAnswerChange(sectionType, question.id, answerId);
      }
    },
    [quizQuestions, currentQuestionIndex, sectionType, handleAnswerChange]
  );

  const handleClearAnswer = useCallback(() => {
    const question = quizQuestions[currentQuestionIndex];
    if (question) {
      // Clear the answer by setting it to null
      handleAnswerChange(sectionType, question.id, null);
    }
  }, [quizQuestions, currentQuestionIndex, sectionType, handleAnswerChange]);

  const handleQuizQuestionClick = useCallback(
    (questionId: string | number) => {
      // Don't block on isTransitioning for question clicks - allow rapid navigation
      const index = quizQuestions.findIndex((q: any) => q.id === questionId);
      if (index !== -1 && index !== currentQuestionIndex) {
        // Use requestIdleCallback for non-blocking updates
        const updateQuestion = () => {
          startTransition(() => {
            setCurrentQuestionIndex(index);
          });
        };
        
        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
          (window as any).requestIdleCallback(updateQuestion, { timeout: 30 });
        } else {
          setTimeout(updateQuestion, 0);
        }
      }
    },
    [quizQuestions, currentQuestionIndex]
  );

  const currentQuizQuestion = useMemo(
    () => quizQuestions[currentQuestionIndex],
    [quizQuestions, currentQuestionIndex]
  );

  const currentAnswer = useMemo(() => {
    if (!currentQuizQuestion) return undefined;
    return responses[sectionType]?.[currentQuizQuestion.id];
  }, [currentQuizQuestion, responses, sectionType]);

  // Get current coding question details - memoized
  const currentCodingQuestion = useMemo(() => {
    if (!currentSection || sectionType !== "coding") return null;
    return (currentSection as any).questions?.[currentQuestionIndex] || null;
  }, [currentSection, sectionType, currentQuestionIndex]);

  const currentCodingResponse = useMemo(() => {
    if (!currentCodingQuestion) return null;
    return responses["coding"]?.[currentCodingQuestion.id] || null;
  }, [currentCodingQuestion, responses]);

  // Get coding questions for navigation - optimized
  const codingQuestions = useMemo(() => {
    if (!currentSection || sectionType !== "coding") return [];
    const codingResponses = responses["coding"] || {};
    return (currentSection.questions || []).map((q: any) => {
      const response = codingResponses[q.id];
      // Mark as answered ONLY if code was explicitly submitted (has submitted flag)
      // OR has test case results (indicating code was run/submitted)
      // Don't mark as answered just because template code was saved
      const isAnswered = !!(
        response &&
        response.submitted === true &&
        (response.tc_passed !== undefined ||
          response.total_tc !== undefined ||
          response.passed !== undefined ||
          response.total_test_cases !== undefined)
      );
      return {
        id: q.id,
        title: q.title,
        answered: isAnswered,
      };
    });
  }, [currentSection, sectionType, responses]);

  // Handle coding question click
  const handleCodingQuestionClick = useCallback(
    (questionId: string | number) => {
      // IMMEDIATE navigation - never block
      const index = codingQuestions.findIndex((q: any) => q.id === questionId);
      if (index !== -1 && index !== currentQuestionIndex) {
        // Update immediately - no delays
        setCurrentQuestionIndex(index);
      }
    },
    [codingQuestions, currentQuestionIndex]
  );

  // Early return
  if (loading || !assessment) {
    return <Loading fullScreen />;
  }

  // Check if assessment has no sections/questions
  if (sections.length === 0) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
          p: 4,
        }}
      >
        <Typography variant="h5" sx={{ color: "#ef4444", fontWeight: 600 }}>
          No Questions Available
        </Typography>
        <Typography variant="body1" sx={{ color: "#6b7280", textAlign: "center" }}>
          This assessment does not have any questions configured. Please contact the administrator.
        </Typography>
        <Button
          variant="contained"
          onClick={() => router.push(`/assessments/${slug}`)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        position: "relative",
        overflow: "hidden",
        pb: 0.5,
        userSelect: assessmentStarted && !submitting ? "none" : "auto",
        WebkitUserSelect: assessmentStarted && !submitting ? "none" : "auto",
        MozUserSelect: assessmentStarted && !submitting ? "none" : "auto",
        msUserSelect: assessmentStarted && !submitting ? "none" : "auto",
        pointerEvents: submitting ? "none" : "auto",
      }}
      onContextMenu={(e) => {
        if (assessmentStarted) {
          e.preventDefault();
          return false;
        }
      }}
      onCopy={(e) => {
        if (assessmentStarted) {
          e.preventDefault();
          return false;
        }
      }}
      onCut={(e) => {
        if (assessmentStarted) {
          e.preventDefault();
          return false;
        }
      }}
      onPaste={(e) => {
        if (assessmentStarted) {
          e.preventDefault();
          return false;
        }
      }}
    >
      {assessmentStarted && (
        <>
          <AssessmentTimerBar
            title={assessment.title}
            formattedTime={timer.formattedTime}
            isLastQuestion={navigation.isLastQuestion}
            submitting={submitting}
            onSubmit={handleShowSubmitDialog}
            proctoringVideoRef={assessment?.proctoring_enabled !== false ? videoRef : undefined}
            proctoringStatus={assessment?.proctoring_enabled !== false ? status : undefined}
            faceCount={assessment?.proctoring_enabled !== false ? faceCount : undefined}
          />

          <AssessmentNavigation
            currentSectionIndex={currentSectionIndex}
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={navigation.totalQuestions}
            sections={sections}
            currentSectionQuestionCount={navigation.currentSectionQuestionCount}
            isLastQuestion={navigation.isLastQuestion}
            onPrevious={navigation.handlePrevious}
            onNext={navigation.handleNext}
            onSectionChange={handleSectionChange}
          />

          <Box
            sx={{
              pt: 18.5,
              pb: 2,
              px: { xs: 2, md: 4 },
              maxWidth: "100%",
              height: "100vh",
              overflow: "auto",
              boxSizing: "border-box",
            }}
          >
            {currentSection ? (
              <Box
                sx={{
                  position: "relative",
                }}
              >
                {sectionType === "quiz" && currentQuizQuestion && (
                  <MemoizedQuizLayout
                    currentQuestionIndex={currentQuestionIndex}
                    currentQuestion={currentQuizQuestion as any}
                    selectedAnswer={currentAnswer}
                    questions={mappedQuizQuestions}
                    totalQuestions={quizQuestions.length}
                    onAnswerSelect={handleQuizAnswerSelect}
                    onClearAnswer={handleClearAnswer}
                    onNextQuestion={navigation.handleNext}
                    onPreviousQuestion={navigation.handlePrevious}
                    onQuestionClick={handleQuizQuestionClick}
                  />
                )}

                {sectionType === "coding" && currentCodingQuestion && (
                  <MemoizedCodingLayout
                    key={`coding-${currentCodingQuestion.id}-${currentQuestionIndex}`}
                    slug={slug}
                    questionId={currentCodingQuestion.id}
                    problemData={{
                      details: currentCodingQuestion,
                    }}
                    initialCode={
                      currentCodingResponse?.code ||
                      currentCodingQuestion.template_code?.python ||
                      currentCodingQuestion.template_code?.python3 ||
                      ""
                    }
                    initialLanguage={
                      currentCodingResponse?.language || "python"
                    }
                    questions={codingQuestions}
                    totalQuestions={codingQuestions.length}
                    currentQuestionIndex={currentQuestionIndex}
                    onQuestionClick={handleCodingQuestionClick}
                    onNextQuestion={navigation.handleNext}
                    onPreviousQuestion={navigation.handlePrevious}
                    onCodeChange={(code, language) => {
                      handleAnswerChange(
                        "coding",
                        currentCodingQuestion.id,
                        {
                          code,
                          language,
                          ...(currentCodingResponse || {}),
                        }
                      );
                    }}
                    onCodeSubmit={(result) => {
                      setResponses((prev) => ({
                        ...prev,
                        coding: {
                          ...prev.coding,
                          [currentCodingQuestion.id]: {
                            ...prev.coding?.[currentCodingQuestion.id],
                            code:
                              result.best_code ||
                              prev.coding?.[currentCodingQuestion.id]?.code ||
                              "",
                            language:
                              prev.coding?.[currentCodingQuestion.id]
                                ?.language || "python",
                            tc_passed: result.tc_passed ?? result.passed ?? 0,
                            total_tc:
                              result.total_tc ?? result.total_test_cases ?? 0,
                            submitted: true, // Mark as submitted
                          },
                        },
                      }));
                    }}
                  />
                )}

                {/* Show message if section exists but has no questions */}
                {sectionType === "quiz" && !currentQuizQuestion && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "400px",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ color: "#6b7280" }}>
                      No questions available in this section
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                      This section does not contain any questions.
                    </Typography>
                  </Box>
                )}

                {sectionType === "coding" && !currentCodingQuestion && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "400px",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ color: "#6b7280" }}>
                      No coding problems available in this section
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                      This section does not contain any coding problems.
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "400px",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <Typography variant="h6" sx={{ color: "#6b7280" }}>
                  No section available
                </Typography>
                <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                  Unable to load assessment sections. Please refresh the page.
                </Typography>
              </Box>
            )}
          </Box>

          <Suspense fallback={null}>
            {showSubmitDialog && (
              <SubmissionDialog
                open={showSubmitDialog}
                sections={sectionStatus}
                totalQuestions={navigation.totalQuestions}
                totalAnswered={totalAnswered}
                onClose={handleCloseSubmitDialog}
                onConfirm={handleFinalSubmit}
                submitting={submitting}
              />
            )}

            {showFullscreenWarning && !submitting && (
              <FullscreenWarningDialog
                open={showFullscreenWarning}
                onReEnterFullscreen={handleReEnterFullscreen}
              />
            )}
          </Suspense>
        </>
      )}

      {/* Auto-start assessment - no start button needed */}
    </Box>
  );
}
