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

  // Data hooks
  const { assessment, loading } = useAssessmentData(slug);

  // Preload proctoring model in background
  useEffect(() => {
    if (assessment && !loading) {
      import("@/lib/services/proctoring.service").then(
        ({ getProctoringService }) => {
          const service = getProctoringService();
          service.initializeModel().catch(() => {
            // Silently fail - will load on demand
          });
        }
      );
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

  // Sections
  const sections = useMemo(() => {
    if (!assessment) return [];
    return mergeAssessmentSections(
      assessment.quizSection,
      assessment.codingProblemSection
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

  // Security measures
  useAssessmentSecurity({ enabled: assessmentStarted });
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

  // Initialize responses
  useEffect(() => {
    if (assessment && sections.length > 0) {
      const initialResponses: Record<string, Record<string, any>> = {};
      sections.forEach((section: any) => {
        initialResponses[section.section_type || "quiz"] = {};
      });
      setResponses(initialResponses);

      const firstQuizIndex = sections.findIndex(
        (section: any) => (section.section_type || "quiz") === "quiz"
      );
      if (firstQuizIndex !== -1) {
        setCurrentSectionIndex(firstQuizIndex);
        setCurrentQuestionIndex(0);
      }
    }
  }, [assessment, sections]);

  // Auto-save
  useAutoSave({
    enabled: assessmentStarted && !submitting,
    slug,
    responses,
    metadata,
  });

  // Track proctoring state
  useEffect(() => {
    isProctoringActiveRef.current = isProctoringActive;
  }, [isProctoringActive]);

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
  });

  // Start assessment
  const handleStartAssessment = useCallback(async () => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;
    setShowStartButton(false);

    try {
      setAssessmentStarted(true);
      timer.start();

      // Start camera and fullscreen in parallel
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
      if (isProctoringActiveRef.current) {
        stopProctoring();
      }
      // Additional cleanup - stop all media tracks
      try {
        const { stopAllMediaTracks } = require("@/lib/utils/cameraUtils");
        stopAllMediaTracks();
        // Force stop all video elements
        document.querySelectorAll("video").forEach((video) => {
          if (video.srcObject) {
            (video.srcObject as MediaStream).getTracks().forEach((track) => {
              track.stop();
            });
            video.srcObject = null;
          }
        });
      } catch (error) {
        // Silently fail
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Answer change handler
  const handleAnswerChange = useCallback(
    (sectionType: string, questionId: string | number, answer: any) => {
      setResponses((prev) => {
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

  // Dialog handlers
  const handleShowSubmitDialog = useCallback(() => {
    setShowSubmitDialog(true);
  }, []);

  const handleCloseSubmitDialog = useCallback(() => {
    setShowSubmitDialog(false);
  }, []);

  // Section change handler
  const handleSectionChange = useCallback((sectionIndex: number) => {
    setIsTransitioning(true);
    startTransition(() => {
      setCurrentSectionIndex(sectionIndex);
      setCurrentQuestionIndex(0);
      setTimeout(() => setIsTransitioning(false), 100);
    });
  }, []);

  // Computed values
  const currentSection =
    sections.length > 0 ? sections[currentSectionIndex] : null;
  const sectionType = currentSection?.section_type || "quiz";

  const quizQuestions = useMemo(() => {
    if (!currentSection || sectionType !== "quiz") return [];
    return currentSection.questions || [];
  }, [currentSection, sectionType]);

  const mappedQuizQuestions = useMemo(() => {
    return quizQuestions.map((q: any) => ({
      id: q.id,
      question: q.question,
      answered: !!responses[sectionType]?.[q.id],
    }));
  }, [quizQuestions, responses, sectionType]);

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

  const totalAnswered = useMemo(() => {
    return Object.values(responses).reduce(
      (sum: number, sectionResponses: any) =>
        sum +
        Object.keys(sectionResponses).filter((key) => sectionResponses[key])
          .length,
      0
    );
  }, [responses]);

  // Handlers
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

  const currentQuizQuestion = quizQuestions[currentQuestionIndex];
  const currentAnswer = currentQuizQuestion
    ? responses[sectionType]?.[currentQuizQuestion.id]
    : undefined;

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
                          { code, language }
                        );
                      }}
                      onCodeSubmit={(result) => {
                        const questionId = (currentSection as any).questions[
                          currentQuestionIndex
                        ].id;
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
