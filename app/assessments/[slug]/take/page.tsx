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
} from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import { Loading } from "@/components/common/Loading";
import { useToast } from "@/components/common/Toast";
import { useAssessmentProctoring } from "@/lib/hooks/useAssessmentProctoring";
import { useAssessmentData } from "@/lib/hooks/useAssessmentData";
import { useAssessmentTimer } from "@/lib/hooks/useAssessmentTimer";
import { useAssessmentNavigation } from "@/lib/hooks/useAssessmentNavigation";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { AssessmentTimerBar } from "@/components/assessment/AssessmentTimerBar";
import { AssessmentNavigation } from "@/components/assessment/AssessmentNavigation";
// Don't lazy load main content - it blocks timer and causes freeze
import { AssessmentQuizLayout } from "@/components/assessment/AssessmentQuizLayout";
import { AssessmentCodingLayout } from "@/components/assessment/AssessmentCodingLayout";
import {
  assessmentService,
  AssessmentMetadata,
} from "@/lib/services/assessment.service";
import { mergeAssessmentSections } from "@/utils/assessment.utils";
import { stopAllMediaTracks } from "@/lib/utils/cameraUtils";
import { getProctoringService } from "@/lib/services/proctoring.service";

// Only lazy load dialogs - they're not critical for initial render
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

export default function TakeAssessmentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [responses, setResponses] = useState<
    Record<string, Record<string, any>>
  >({});

  const { showToast } = useToast();
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeUpCallbackRef = useRef<(() => void) | null>(null);
  const isProctoringActiveRef = useRef(false);
  const isInitializingRef = useRef(false);

  const { assessment, loading } = useAssessmentData(slug);

  // Preload proctoring model as soon as assessment loads (before user clicks start)
  useEffect(() => {
    if (assessment && !loading) {
      // Preload the TensorFlow model in the background
      import("@/lib/services/proctoring.service").then(
        ({ getProctoringService }) => {
          const service = getProctoringService();
          service.initializeModel().catch(() => {
            // Silently fail - model will be loaded on demand
          });
        }
      );
    }
  }, [assessment, loading]);

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
    autoStart: false, // We'll manually start this
    onTimeUp: () => {
      if (timeUpCallbackRef.current) {
        timeUpCallbackRef.current();
      }
    },
  });

  const sections = useMemo(() => {
    if (!assessment) return [];
    return mergeAssessmentSections(
      assessment.quizSection,
      assessment.codingProblemSection
    );
  }, [assessment]);

  // Violation threshold callback - no longer force submits
  const handleViolationThresholdReached = useCallback(() => {
    // Maximum violation threshold reached - handled by proctoring system
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

  const navigation = useAssessmentNavigation({
    currentSectionIndex,
    currentQuestionIndex,
    sections,
    setCurrentSectionIndex,
    setCurrentQuestionIndex,
  });

  useKeyboardShortcuts({
    enabled: assessmentStarted,
  });

  // Check if assessment is already submitted (only check once when assessment loads)
  const hasCheckedSubmission = useRef(false);
  useEffect(() => {
    if (assessment && !hasCheckedSubmission.current) {
      hasCheckedSubmission.current = true;
      if (assessment.status === "submitted") {
        showToast("This assessment has already been submitted", "warning");
        router.push(`/assessments/${slug}`);
      }
    }
  }, [assessment, slug, router, showToast]);

  useEffect(() => {
    if (assessment && sections.length > 0) {
      const initialResponses: Record<string, Record<string, any>> = {};
      sections.forEach((section: any) => {
        initialResponses[section.section_type || "quiz"] = {};
      });
      setResponses(initialResponses);

      // Set default section to first quiz/MCQ section
      const firstQuizIndex = sections.findIndex(
        (section: any) => (section.section_type || "quiz") === "quiz"
      );
      if (firstQuizIndex !== -1) {
        setCurrentSectionIndex(firstQuizIndex);
        setCurrentQuestionIndex(0);
      }
    }
  }, [assessment, sections]);

  // Handle start assessment button click (user gesture for fullscreen)
  const handleStartAssessment = async () => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;
    setShowStartButton(false);

    try {
      // Start UI immediately for instant feedback
      setAssessmentStarted(true);
      timer.start();

      // Start camera and fullscreen in parallel (both non-blocking)
      Promise.all([
        startProctoring().catch(() => {
          showToast(
            "Camera initialization failed. Please ensure camera permissions are granted.",
            "error"
          );
        }),
        enterFullscreen()
          .then(() => {
            // Quick check for fullscreen
            setTimeout(() => {
              const isFS =
                !!document.fullscreenElement ||
                !!(document as any).webkitFullscreenElement ||
                !!(document as any).mozFullScreenElement ||
                !!(document as any).msFullscreenElement;

              if (!isFS) {
                setShowFullscreenWarning(true);
              }
            }, 100); // Reduced from 200ms to 100ms
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
  };

  // Track proctoring state in ref for cleanup
  useEffect(() => {
    isProctoringActiveRef.current = isProctoringActive;
  }, [isProctoringActive]);

  // Prevent refresh and back navigation during assessment
  useEffect(() => {
    if (!assessmentStarted) return;

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
        showToast("Refresh is disabled during the assessment", "warning");
        return false;
      }
    };

    const handlePopState = (event: PopStateEvent) => {
      // Push state again to prevent navigation
      window.history.pushState(null, "", window.location.href);
      showToast("Navigation is disabled during the assessment", "warning");
    };

    // Push state to prevent back navigation
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [assessmentStarted, showToast]);

  // Cleanup on unmount only - don't stop proctoring when still on the page
  useEffect(() => {
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      // Only stop proctoring on component unmount (navigation away)
      if (isProctoringActiveRef.current) {
        stopProctoring();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only cleanup on unmount

  const handleAnswerChange = useCallback(
    (sectionType: string, questionId: string | number, answer: any) => {
      // Use functional update to avoid unnecessary re-renders
      setResponses((prev) => {
        // Check if answer is the same to avoid unnecessary update
        if (prev[sectionType]?.[questionId] === answer) {
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
    },
    []
  );

  const handleFinalSubmit = useCallback(async () => {
    if (!assessment) return;

    try {
      setSubmitting(true);

      // Calculate total duration
      const totalDurationSeconds =
        (new Date().getTime() -
          new Date(metadata.timing.started_at).getTime()) /
        1000;

      // Calculate completed questions
      const completedQuestions = Object.values(responses).reduce(
        (count, sectionResponses) => {
          return count + Object.keys(sectionResponses).length;
        },
        0
      );

      // Calculate total questions
      const totalQuestions = navigation.totalQuestions;

      // Extract proctoring data from metadata
      const faceValidationFailures = metadata.proctoring.face_violations.filter(
        (v) => v.type === "NO_FACE" || v.type === "MULTIPLE_FACES"
      ).length;
      const multipleFaceDetections = metadata.proctoring.face_violations.filter(
        (v) => v.type === "MULTIPLE_FACES"
      ).length;
      const fullscreenExits = metadata.proctoring.fullscreen_exits.length;

      // Format responses according to API structure
      // Structure: { quizSectionId: [{ "1": { "101": "A" } }], codingProblemSectionId: [{ "1": { "301": {...} } }] }
      const formattedResponses: Record<string, Array<Record<string, any>>> = {};

      // Initialize arrays for each section type
      const quizSectionId: Array<Record<string, any>> = [];
      const codingProblemSectionId: Array<Record<string, any>> = [];

      sections.forEach((section: any, sectionIndex: number) => {
        const sectionType = section.section_type || "quiz";
        const sectionResponses = responses[sectionType] || {};

        // Get questions for this section
        const sectionQuestions = section.questions || [];
        const sectionResponseData: Record<string, any> = {};

        sectionQuestions.forEach((question: any) => {
          const questionId = question.id;
          const questionResponse = sectionResponses[questionId];

          if (questionResponse) {
            if (sectionType === "coding") {
              // For coding: include tc_passed, total_tc, best_code
              sectionResponseData[questionId] = {
                tc_passed:
                  questionResponse.tc_passed ?? questionResponse.passed ?? 0,
                total_tc:
                  questionResponse.total_tc ??
                  questionResponse.total_test_cases ??
                  0,
                best_code:
                  questionResponse.best_code ?? questionResponse.code ?? "",
              };
            } else {
              // For quiz: just the answer value (string)
              sectionResponseData[questionId] = questionResponse;
            }
          }
        });

        // Only add if there are responses
        if (Object.keys(sectionResponseData).length > 0) {
          // Use 1-based index for section
          const sectionEntry = {
            [String(sectionIndex + 1)]: sectionResponseData,
          };

          if (sectionType === "coding") {
            codingProblemSectionId.push(sectionEntry);
          } else {
            quizSectionId.push(sectionEntry);
          }
        }
      });

      // Add to formatted responses only if there are responses
      if (quizSectionId.length > 0) {
        formattedResponses.quizSectionId = quizSectionId;
      }
      if (codingProblemSectionId.length > 0) {
        formattedResponses.codingProblemSectionId = codingProblemSectionId;
      }

      // Prepare request body in the new format
      const requestBody = {
        transcript: {
          responses: formattedResponses,
          total_duration_seconds: totalDurationSeconds,
          logs: [], // Empty logs array - can be populated if needed
          metadata: {
            ...metadata,
            face_validation_failures: faceValidationFailures,
            multiple_face_detections: multipleFaceDetections,
            fullscreen_exits: fullscreenExits,
            completed_questions: completedQuestions,
            total_questions: totalQuestions,
          },
        },
      };

      await assessmentService.finalSubmit(
        slug,
        formattedResponses,
        requestBody
      );

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

      // Stop proctoring and camera for cleanup
      // Call stopProctoring from hook first
      stopProctoring();

      // Also explicitly stop the proctoring service to ensure cleanup
      try {
        const proctoringService = getProctoringService();
        proctoringService.stopProctoring();
      } catch (error) {
        // Silently fail if service is not available
      }

      // Aggressively stop all media tracks (camera and audio)
      stopAllMediaTracks();

      // Stop all media tracks again after a brief delay to catch any missed streams
      await new Promise((resolve) => setTimeout(resolve, 50));
      stopAllMediaTracks();

      // One more cleanup pass to ensure everything is stopped
      await new Promise((resolve) => setTimeout(resolve, 50));
      stopAllMediaTracks();

      // Navigate to success page
      showToast("Assessment submitted successfully!", "success");
      router.replace(`/assessments/${slug}/submission-success`);
    } catch (error: any) {
      showToast("Failed to submit assessment", "error");
      setSubmitting(false);
    }
  }, [
    metadata,
    responses,
    navigation,
    stopProctoring,
    slug,
    router,
    showToast,
    assessment,
  ]);

  useEffect(() => {
    timeUpCallbackRef.current = () => {
      showToast("Time is up! Submitting assessment...", "warning");
      handleFinalSubmit();
    };
  }, [handleFinalSubmit, showToast]);

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
      // Silently fail re-entry
    }
  }, [enterFullscreen]);

  // Memoize submit dialog handler
  const handleShowSubmitDialog = useCallback(() => {
    setShowSubmitDialog(true);
  }, []);

  const handleCloseSubmitDialog = useCallback(() => {
    setShowSubmitDialog(false);
  }, []);

  // Memoize section change handler with startTransition to keep timer smooth
  const handleSectionChange = useCallback((sectionIndex: number) => {
    setIsTransitioning(true);
    startTransition(() => {
      setCurrentSectionIndex(sectionIndex);
      setCurrentQuestionIndex(0);
      // Clear transition after a brief delay
      setTimeout(() => setIsTransitioning(false), 100);
    });
  }, []);

  useEffect(() => {
    if (!assessmentStarted) return;

    const handleFullscreenChange = () => {
      const isFS =
        !!document.fullscreenElement ||
        !!(document as any).webkitFullscreenElement ||
        !!(document as any).mozFullScreenElement ||
        !!(document as any).msFullscreenElement;

      if (!isFS && assessmentStarted) {
        // Show dialog and let user click the button (which is a valid user gesture)
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
  }, [assessmentStarted, handleReEnterFullscreen]);

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURN
  // Compute variables safely (handle null/empty cases)
  const currentSection =
    sections.length > 0 ? sections[currentSectionIndex] : null;
  const sectionType = currentSection?.section_type || "quiz";

  const quizQuestions = useMemo(() => {
    if (!currentSection || sectionType !== "quiz") return [];
    return currentSection.questions || [];
  }, [currentSection, sectionType]);

  // Memoize mapped quiz questions to prevent unnecessary re-renders
  const mappedQuizQuestions = useMemo(() => {
    return quizQuestions.map((q: any) => ({
      id: q.id,
      question: q.question,
      answered: !!responses[sectionType]?.[q.id],
    }));
  }, [quizQuestions, responses, sectionType]);

  // Memoize quiz answer select handler - compute currentQuizQuestion inside
  const handleQuizAnswerSelect = useCallback(
    (answerId: string | number) => {
      const question = quizQuestions[currentQuestionIndex];
      if (question) {
        handleAnswerChange(sectionType, question.id, answerId);
      }
    },
    [quizQuestions, currentQuestionIndex, sectionType, handleAnswerChange]
  );

  // Memoize question click handler with startTransition for smooth switching
  const handleQuizQuestionClick = useCallback(
    (questionId: string | number) => {
      const index = quizQuestions.findIndex((q: any) => q.id === questionId);
      if (index !== -1) {
        setIsTransitioning(true);
        startTransition(() => {
          setCurrentQuestionIndex(index);
          setTimeout(() => setIsTransitioning(false), 100);
        });
      }
    },
    [quizQuestions]
  );

  // Memoize section status to prevent recalculation on every render
  const sectionStatus = useMemo(() => {
    return sections.map((section: any) => {
      const sectionType = section.section_type || "quiz";
      const sectionResponses = responses[sectionType] || {};
      const answered = Object.keys(sectionResponses).filter(
        (key) =>
          sectionResponses[key] !== undefined && sectionResponses[key] !== ""
      ).length;
      return {
        sectionType: sectionType,
        answered,
        total: section.questions?.length || 0,
      };
    });
  }, [sections, responses]);

  // Memoize total answered count
  const totalAnswered = useMemo(() => {
    return Object.values(responses).reduce(
      (sum: number, sectionResponses: any) =>
        sum +
        Object.keys(sectionResponses).filter((key) => sectionResponses[key])
          .length,
      0
    );
  }, [responses]);

  const currentQuizQuestion = quizQuestions[currentQuestionIndex];
  const currentAnswer = currentQuizQuestion
    ? responses[sectionType]?.[currentQuizQuestion.id]
    : undefined;

  // NOW we can have the early return AFTER all hooks
  if (loading || !assessment) {
    return <Loading fullScreen />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        position: "relative",
        overflow: "hidden", // Changed from auto to prevent scrolling
        pb: 0.5, // Reduced from 10 to minimal padding
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
    >
      {/* ALWAYS render the video element in the same place in the DOM tree */}
      {assessmentStarted && (
        <>
          {/* Timer Bar - Fixed at top */}
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

          {/* Navigation Bar - Fixed below timer */}
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

          {/* Main Content Area - Optimized spacing */}
          <Box
            sx={{
              pt: 18.5, // Increased padding to prevent header cut (timer + navigation height)
              pb: 2, // Minimal bottom padding
              px: { xs: 2, md: 4 },
              maxWidth: "100%",
              height: "100vh", // Full viewport height
              overflow: "auto", // Allow scroll only if content exceeds
              boxSizing: "border-box",
            }}
          >
            {currentSection && (
              <Box
                sx={{
                  position: "relative",
                  opacity: isTransitioning ? 0.6 : 1,
                  transition: "opacity 0.15s ease-in-out",
                }}
              >
                {sectionType === "quiz" && currentQuizQuestion && (
                  <AssessmentQuizLayout
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

                {sectionType === "coding" &&
                  (currentSection as any).questions?.[currentQuestionIndex] && (
                    <AssessmentCodingLayout
                      key={`coding-section-${currentSectionIndex}`}
                      slug={slug}
                      questionId={
                        (currentSection as any).questions[currentQuestionIndex]
                          .id
                      }
                      problemData={{
                        details: (currentSection as any).questions[
                          currentQuestionIndex
                        ],
                      }}
                      initialCode={
                        responses["coding"]?.[
                          (currentSection as any).questions[
                            currentQuestionIndex
                          ].id
                        ]?.code ||
                        (currentSection as any).questions[currentQuestionIndex]
                          .template_code?.python ||
                        ""
                      }
                      initialLanguage={
                        responses["coding"]?.[
                          (currentSection as any).questions[
                            currentQuestionIndex
                          ].id
                        ]?.language || "python"
                      }
                      onCodeChange={(code, language) => {
                        handleAnswerChange(
                          "coding",
                          (currentSection as any).questions[
                            currentQuestionIndex
                          ].id,
                          {
                            code,
                            language,
                          }
                        );
                      }}
                      onCodeSubmit={(result) => {
                        const questionId = (currentSection as any).questions[
                          currentQuestionIndex
                        ].id;
                        // Update response with test case results
                        setResponses((prev) => ({
                          ...prev,
                          coding: {
                            ...prev.coding,
                            [questionId]: {
                              ...prev.coding?.[questionId],
                              code:
                                result.best_code ||
                                prev.coding?.[questionId]?.code,
                              language:
                                prev.coding?.[questionId]?.language || "python",
                              tc_passed: result.tc_passed ?? result.passed,
                              total_tc:
                                result.total_tc ?? result.total_test_cases,
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

            {showFullscreenWarning && (
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
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f9fafb",
            }}
          >
            <Paper
              elevation={2}
              sx={{
                maxWidth: 500,
                p: 4,
                textAlign: "center",
              }}
            >
              <Typography variant="h5" fontWeight={600} gutterBottom>
                {assessment.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Click the button below to start your assessment in fullscreen
                mode.
              </Typography>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleStartAssessment}
                disabled={isInitializing}
                sx={{
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: 600,
                  backgroundColor: "#374151",
                  "&:hover": {
                    backgroundColor: "#1f2937",
                  },
                }}
              >
                {isInitializing ? "Starting..." : "Start Assessment"}
              </Button>
            </Paper>
          </Box>
        )}

      {/* Removed extra loader - not needed as proctoring starts immediately */}
    </Box>
  );
}
