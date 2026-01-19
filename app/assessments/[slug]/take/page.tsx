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
import { Box } from "@mui/material";
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
  const [showStartButton, setShowStartButton] = useState(true);
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

  // Timer setup
  const initialTimeSeconds = useMemo(() => {
    if (assessment?.remaining_time) {
      return assessment.remaining_time * 60;
    }
    if (assessment?.duration_minutes) {
      return assessment.duration_minutes * 60;
    }
    return 3600;
  }, [assessment]);

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
  const sections = useMemo(() => {
    if (!assessment) return [];
    return mergeAssessmentSections(
      assessment.quizSection || [],
      assessment.codingProblemSection || []
    );
  }, [assessment]);

  // Proctoring
  const handleViolationThresholdReached = useCallback(() => {
    // Handled by proctoring system
  }, []);

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

      // Parse responseSheet asynchronously after initial render (deferred)
      if (assessment.responseSheet) {
        // Use requestIdleCallback or setTimeout to defer heavy parsing
        const parseResponseSheet = () => {
          try {
            const responseSheet = assessment.responseSheet;
            const loadedResponses: Record<string, Record<string, any>> = {};

            // Process responseSheet - it may be organized by section index or section type
            sections.forEach((section: any, sectionIndex: number) => {
              const sectionType = section.section_type || "quiz";
              const sectionKey = String(sectionIndex + 1);

              // Check if responses exist for this section
              if (responseSheet[sectionKey]) {
                const sectionResponses = responseSheet[sectionKey];
                if (!loadedResponses[sectionType]) {
                  loadedResponses[sectionType] = {};
                }

                // Map section responses to question IDs
                Object.keys(sectionResponses).forEach((questionId) => {
                  const response = sectionResponses[questionId];
                  if (response !== undefined && response !== null) {
                    loadedResponses[sectionType][questionId] = response;
                  }
                });
              }
            });

            // Only update if we found saved responses
            if (Object.keys(loadedResponses).length > 0) {
              setResponses(loadedResponses);
            }
          } catch (error) {
            // Silently fail - already initialized empty structure
          }
        };

        // Defer parsing to prevent blocking initial render
        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
          (window as any).requestIdleCallback(parseResponseSheet, { timeout: 1000 });
        } else {
          setTimeout(parseResponseSheet, 100);
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

  // Start assessment
  const handleStartAssessment = useCallback(async () => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;
    setShowStartButton(false);

    try {
      setAssessmentStarted(true);
      timer.start();

      // Start camera and fullscreen in parallel (non-blocking)
      Promise.all([
        startProctoring().catch(() => {
          showToast(
            "Camera initialization failed. Please ensure camera permissions are granted.",
            "error"
          );
        }),
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
          }),
      ]);
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
  ]);

  // Time up handler
  useEffect(() => {
    timeUpCallbackRef.current = () => {
      showToast("Time is up! Submitting assessment...", "warning");
      handleFinalSubmit();
    };
  }, [handleFinalSubmit, showToast]);

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

  // Section change handler - optimized with transition (non-blocking)
  const handleSectionChange = useCallback((sectionIndex: number) => {
    // Prevent multiple rapid clicks
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    // Use requestIdleCallback or setTimeout for truly non-blocking updates
    const updateSection = () => {
      startTransition(() => {
        setCurrentSectionIndex(sectionIndex);
        setCurrentQuestionIndex(0);
      });
      // Clear transition state after a short delay
      setTimeout(() => setIsTransitioning(false), 100);
    };
    
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(updateSection, { timeout: 50 });
    } else {
      setTimeout(updateSection, 0);
    }
  }, [isTransitioning]);

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

  // Optimized section status - only recalculate when responses change significantly
  const sectionStatus = useMemo(() => {
    return sections.map((section: any) => {
      const sectionType = section.section_type || "quiz";
      const sectionResponses = responses[sectionType] || {};
      // Optimize: only count non-empty responses
      let answered = 0;
      for (const key in sectionResponses) {
        const value = sectionResponses[key];
        if (value !== undefined && value !== null && value !== "") {
          answered++;
        }
      }
      return {
        sectionType: sectionType,
        answered,
        total: section.questions?.length || 0,
      };
    });
  }, [sections, responses]);

  const totalAnswered = useMemo(() => {
    return Object.values(responses).reduce(
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
      // Don't block on isTransitioning for question clicks - allow rapid navigation
      const index = codingQuestions.findIndex((q: any) => q.id === questionId);
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
    [codingQuestions, currentQuestionIndex]
  );

  // Early return
  if (loading || !assessment) {
    return <Loading fullScreen />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        position: "relative",
        overflow: "hidden",
        pb: 0.5,
        userSelect: assessmentStarted ? "none" : "auto",
        WebkitUserSelect: assessmentStarted ? "none" : "auto",
        MozUserSelect: assessmentStarted ? "none" : "auto",
        msUserSelect: assessmentStarted ? "none" : "auto",
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
            proctoringVideoRef={videoRef}
            proctoringStatus={status}
            faceCount={faceCount}
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
            {currentSection && (
              <Box
                sx={{
                  position: "relative",
                  opacity: isTransitioning ? 0.8 : 1,
                  transition: "opacity 0.15s ease-out",
                  willChange: isTransitioning ? "opacity" : "auto",
                  transform: isTransitioning ? "translateX(4px)" : "translateX(0)",
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

      {!assessmentStarted &&
        showStartButton &&
        assessment?.status !== "submitted" && (
          <StartAssessmentButton
            title={assessment.title}
            onStart={handleStartAssessment}
            isInitializing={isInitializing}
          />
        )}
    </Box>
  );
}
