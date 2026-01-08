"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Typography, Button } from "@mui/material";
import { ContentDetail, coursesService } from "@/lib/services/courses.service";
import {
  QuizLayout,
  QuizQuestion,
  QuizResults,
  QuizAnswer,
} from "@/components/quiz";
import { Loading } from "@/components/common/Loading";
import { useToast } from "@/components/common/Toast";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { CompletionDialog } from "@/components/common/CompletionDialog";
import { PastSubmissionsTable } from "./PastSubmissionsTable";
import { QuizStartScreen } from "./QuizStartScreen";
import { QuizNavigationBar } from "./QuizNavigationBar";

interface QuizContentProps {
  content: ContentDetail;
  courseId: number;
  pastSubmissions: any[];
  loadingSubmissions: boolean;
  onStartQuiz: () => void;
  onQuizComplete?: (obtainedMarks?: number) => void;
}

interface QuizState {
  quizStarted: boolean;
  currentQuestionIndex: number;
  answers: Record<string | number, string>;
  timeRemaining?: number;
  startTime?: number;
}

export function QuizContent({
  content,
  courseId,
  pastSubmissions,
  loadingSubmissions,
  onStartQuiz,
  onQuizComplete,
}: QuizContentProps) {
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<
    string | number | undefined
  >();
  const [answers, setAnswers] = useState<Record<string | number, string>>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<
    Set<string | number>
  >(new Set());
  const [timeRemaining, setTimeRemaining] = useState<number | undefined>(
    undefined
  );
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState<{
    score: number;
    correctAnswers: number;
    answers: QuizAnswer[];
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogProps, setConfirmDialogProps] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [viewingPastSubmission, setViewingPastSubmission] = useState<
    any | null
  >(null);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [completionStats, setCompletionStats] = useState<any>(null);
  const { showToast } = useToast();
  const startTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Storage key for quiz state
  const storageKey = `quiz_${courseId}_${content.id}`;

  // Clear all quiz-related localStorage
  const clearAllQuizStorage = () => {
    if (typeof window !== "undefined") {
      // Clear current quiz storage
      localStorage.removeItem(storageKey);

      // Clear all quiz-related localStorage items
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("quiz_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }
  };

  // Load quiz state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        try {
          const state: QuizState = JSON.parse(savedState);
          if (
            state.quizStarted &&
            state.timeRemaining &&
            state.timeRemaining > 0
          ) {
            setQuizStarted(true);
            setCurrentQuestionIndex(state.currentQuestionIndex);
            setAnswers(state.answers);
            setTimeRemaining(state.timeRemaining);
            setAnsweredQuestions(
              new Set(Object.keys(state.answers).map(Number))
            );
            startTimeRef.current = state.startTime || Date.now();
            // Calculate remaining time
            if (state.startTime) {
              const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
              const remaining = Math.max(
                0,
                (state.timeRemaining || 0) - elapsed
              );
              setTimeRemaining(remaining);
            }
          }
        } catch (error) {
          localStorage.removeItem(storageKey);
        }
      }
    }
  }, [storageKey]);

  // Save quiz state to localStorage (but NOT when viewing past submissions)
  useEffect(() => {
    if (
      quizStarted &&
      !viewingPastSubmission &&
      typeof window !== "undefined"
    ) {
      const state: QuizState = {
        quizStarted,
        currentQuestionIndex,
        answers,
        timeRemaining,
        startTime: startTimeRef.current || Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [
    quizStarted,
    currentQuestionIndex,
    answers,
    timeRemaining,
    storageKey,
    viewingPastSubmission,
  ]);

  // Timer countdown
  useEffect(() => {
    if (quizStarted && timeRemaining !== undefined && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === undefined || prev <= 1) {
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
            }
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };
    }
  }, [quizStarted, timeRemaining]);

  // Load quiz questions when quiz starts
  useEffect(() => {
    if (quizStarted && content.details) {
      loadQuizQuestions();
    }
  }, [quizStarted, content.id]);

  const loadQuizQuestions = async () => {
    try {
      setLoadingQuiz(true);
      // Check if questions are in content.details.mcqs (not questions)
      const mcqs = content.details?.mcqs || content.details?.questions;

      if (mcqs && Array.isArray(mcqs) && mcqs.length > 0) {
        const questions: QuizQuestion[] = mcqs.map((q: any, index: number) => {
          // Map options to A, B, C, D format
          const options = (q.options || []).map(
            (opt: string, optIndex: number) => {
              const optionLetter = String.fromCharCode(65 + optIndex); // A, B, C, D
              return {
                id: optionLetter,
                label: opt,
                value: optionLetter,
              };
            }
          );

          return {
            id: q.id || index,
            question: q.question_text || q.question || `Question ${index + 1}`,
            options,
            correctAnswer: q.correct_option, // Store correct answer for results
            explanation: q.explanation, // Store explanation for results
          };
        });

        setQuizQuestions(questions);

        // Set timer - convert minutes to seconds
        const durationInMinutes =
          content.details?.durating_in_minutes ||
          content.details?.duration_in_minutes ||
          content.duration_in_minutes ||
          15;
        const quizDuration = durationInMinutes * 60; // Convert to seconds
        setTimeRemaining(quizDuration);
        startTimeRef.current = Date.now();
      } else {
        showToast("Quiz questions not available", "error");
        setQuizStarted(false);
      }
    } catch (error) {
      showToast("Failed to load quiz questions", "error");
      setQuizStarted(false);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setAnsweredQuestions(new Set());
    setSelectedAnswer(undefined);
    setShowResults(false);
    setQuizResults(null);
    onStartQuiz(); // Track activity
  };

  const handleAnswerSelect = (answerId: string | number) => {
    setSelectedAnswer(answerId);

    // Auto-save answer when selected
    const currentQuestion = quizQuestions[currentQuestionIndex];
    if (currentQuestion) {
      const newAnswers = {
        ...answers,
        [currentQuestion.id]: String(answerId),
      };
      setAnswers(newAnswers);
      setAnsweredQuestions((prev) => new Set([...prev, currentQuestion.id]));
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      const nextQuestion = quizQuestions[currentQuestionIndex + 1];
      setSelectedAnswer(answers[nextQuestion.id] || undefined);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const prevQuestion = quizQuestions[currentQuestionIndex - 1];
      setSelectedAnswer(answers[prevQuestion.id] || undefined);
    }
  };

  const handleFinalSubmit = () => {
    // Check if all questions are answered
    const unansweredQuestions = quizQuestions.filter((q) => !answers[q.id]);

    if (unansweredQuestions.length > 0) {
      setConfirmDialogProps({
        title: "Unanswered Questions",
        message: `You have ${unansweredQuestions.length} unanswered question(s). Are you sure you want to submit the quiz? You cannot change your answers after submission.`,
        onConfirm: () => {
          setShowConfirmDialog(false);
          handleSubmitQuiz(answers);
        },
      });
    } else {
      setConfirmDialogProps({
        title: "Submit Quiz",
        message:
          "Are you sure you want to submit the quiz? You cannot change your answers after submission.",
        onConfirm: () => {
          setShowConfirmDialog(false);
          handleSubmitQuiz(answers);
        },
      });
    }
    setShowConfirmDialog(true);
  };

  const handleSubmitQuiz = async (
    finalAnswers: Record<string | number, string>
  ) => {
    try {
      setIsSubmitting(true);

      // Calculate score and prepare user answers for API
      let correctCount = 0;
      const userAnswers: Array<{
        questionId: number | string;
        isCorrect: boolean;
        questionIndex: number;
        selectedOption: string;
      }> = [];

      const quizAnswers: QuizAnswer[] = quizQuestions.map((q, index) => {
        const selected = finalAnswers[q.id];
        const correct = (q as any).correctAnswer;
        const isCorrect = selected === correct;

        if (isCorrect) correctCount++;

        // Prepare user answer for API submission
        userAnswers.push({
          questionId: q.id,
          isCorrect,
          questionIndex: index,
          selectedOption: selected || "",
        });

        return {
          questionId: q.id,
          questionText: q.question,
          selectedAnswer: selected || "",
          correctAnswer: correct || "",
          isCorrect,
          explanation: (q as any).explanation,
          options: q.options.map((opt) => ({
            id: String(opt.id),
            label: opt.label,
            value: opt.value,
          })),
        };
      });

      const score = correctCount;
      const totalQuestions = quizQuestions.length;

      // Calculate obtained marks if total marks are defined for the quiz
      const totalMarks = content.marks || 0;
      const obtainedMarks =
        totalMarks > 0
          ? Math.round((correctCount / totalQuestions) * totalMarks)
          : correctCount;

      // Call activity API to mark quiz as complete with user answers - MUST be called before showing results
      try {
        await coursesService.createUserActivity(courseId, content.id, "Quiz", {
          userAnswers,
        });
      } catch (error: any) {
        // Show error but don't fail the quiz submission
        showToast("Quiz submitted but activity tracking failed", "warning");
      }

      // Clear localStorage - clear all quiz-related storage
      clearAllQuizStorage();

      // Clear timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      // Show results
      setQuizResults({
        score,
        correctAnswers: correctCount,
        answers: quizAnswers,
      });
      setShowResults(true);
      setQuizStarted(false);

      // Show completion dialog
      setCompletionStats({
        score: correctCount,
        maxScore: totalQuestions,
        obtainedMarks,
        totalMarks,
      });
      setShowCompletionDialog(true);
    } catch (error) {
      showToast("Failed to submit quiz", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuestionClick = (questionId: string | number) => {
    const index = quizQuestions.findIndex((q) => q.id === questionId);
    if (index !== -1) {
      setCurrentQuestionIndex(index);
      setSelectedAnswer(answers[questionId] || undefined);
    }
  };

  const handleTimeUp = async () => {
    showToast("Time's up! Quiz will be submitted automatically.", "warning");
    // Auto-submit quiz when time is up
    await handleSubmitQuiz(answers);
  };

  const handleRetakeQuiz = () => {
    setShowResults(false);
    setQuizResults(null);
    setAnswers({});
    setAnsweredQuestions(new Set());
    setCurrentQuestionIndex(0);
    setSelectedAnswer(undefined);
    // Clear all quiz-related localStorage before retaking
    clearAllQuizStorage();
    handleStartQuiz();
  };

  const handleBackToCourse = () => {
    setShowResults(false);
    setQuizResults(null);
    setQuizStarted(false);
    // Clear all quiz-related localStorage
    clearAllQuizStorage();
  };

  // Convert past submission to QuizAnswer format
  const convertPastSubmissionToQuizAnswers = (
    submission: any
  ): QuizAnswer[] => {
    if (!submission?.custom_dimension?.userAnswers || !quizQuestions.length) {
      return [];
    }

    const userAnswers = submission.custom_dimension.userAnswers;
    return quizQuestions.map((q, index) => {
      // Find the user answer for this question
      const userAnswer = userAnswers.find(
        (ua: any) => ua.questionId === q.id || ua.questionIndex === index
      );

      if (!userAnswer) {
        return {
          questionId: q.id,
          questionText: q.question,
          selectedAnswer: "",
          correctAnswer: (q as any).correctAnswer || "",
          isCorrect: false,
          explanation: (q as any).explanation,
          options: q.options.map((opt) => ({
            id: String(opt.id),
            label: opt.label,
            value: opt.value,
          })),
        };
      }

      // Find the correct answer from the question
      const correctAnswer = (q as any).correctAnswer || "";

      return {
        questionId: q.id,
        questionText: q.question,
        selectedAnswer: userAnswer.selectedOption || "",
        correctAnswer,
        isCorrect: userAnswer.isCorrect || false,
        explanation: (q as any).explanation,
        options: q.options.map((opt) => ({
          id: String(opt.id),
          label: opt.label,
          value: opt.value,
        })),
      };
    });
  };

  const handleViewPastSubmission = async (submission: any) => {
    try {
      setLoadingQuiz(true);

      // Load questions directly from content.details if not already loaded
      let questionsToUse = quizQuestions;

      if (questionsToUse.length === 0 && content.details) {
        const mcqs = content.details?.mcqs || content.details?.questions;

        if (mcqs && Array.isArray(mcqs) && mcqs.length > 0) {
          questionsToUse = mcqs.map((q: any, index: number) => {
            const options = (q.options || []).map(
              (opt: string, optIndex: number) => {
                const optionLetter = String.fromCharCode(65 + optIndex);
                return {
                  id: optionLetter,
                  label: opt,
                  value: optionLetter,
                };
              }
            );
            return {
              id: q.id || index,
              question:
                q.question_text || q.question || `Question ${index + 1}`,
              options,
              correctAnswer: q.correct_option,
              explanation: q.explanation,
            };
          });

          // Set the questions in state for future use
          setQuizQuestions(questionsToUse);
        }
      }

      if (questionsToUse.length > 0) {
        // Clear quiz localStorage to prevent auto-start on reload
        clearAllQuizStorage();

        setViewingPastSubmission(submission);
        setCurrentQuestionIndex(0);
        // Set answers from submission
        const userAnswers = submission?.custom_dimension?.userAnswers || [];
        const answersMap: Record<string | number, string> = {};
        userAnswers.forEach((ua: any) => {
          const question = questionsToUse.find(
            (q) =>
              q.id === ua.questionId ||
              questionsToUse.findIndex((q2) => q2.id === q.id) ===
                ua.questionIndex
          );
          if (question) {
            answersMap[question.id] = ua.selectedOption;
          }
        });
        setAnswers(answersMap);
        setAnsweredQuestions(new Set(Object.keys(answersMap).map(Number)));
        setSelectedAnswer(answersMap[questionsToUse[0]?.id] || undefined);
        setQuizStarted(true); // Use quiz started state to show QuizLayout
      } else {
        showToast("Unable to load quiz questions", "error");
      }
    } catch (error) {
      showToast("Failed to load submission", "error");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleBackFromPastSubmission = () => {
    // Clear localStorage to ensure quiz doesn't auto-start
    clearAllQuizStorage();

    setShowResults(false);
    setQuizResults(null);
    setViewingPastSubmission(null);
    setQuizStarted(false);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setAnsweredQuestions(new Set());
    setSelectedAnswer(undefined);
  };

  // Show results (current or past submission)
  if (showResults && quizResults) {
    return (
      <QuizResults
        score={quizResults.score}
        totalQuestions={quizQuestions.length}
        correctAnswers={quizResults.correctAnswers}
        answers={quizResults.answers}
        onRetake={viewingPastSubmission ? undefined : handleRetakeQuiz}
        onBack={
          viewingPastSubmission
            ? handleBackFromPastSubmission
            : handleBackToCourse
        }
      />
    );
  }

  // If quiz is started, show QuizLayout
  if (quizStarted) {
    if (loadingQuiz) {
      return <Loading />;
    }

    if (quizQuestions.length === 0) {
      return (
        <Box sx={{ p: 3 }}>
          <Typography>No questions available for this quiz.</Typography>
          <Button onClick={() => setQuizStarted(false)} sx={{ mt: 2 }}>
            Go Back
          </Button>
        </Box>
      );
    }

    const currentQuestion = quizQuestions[currentQuestionIndex];
    const questionList = quizQuestions.map((q) => ({
      id: q.id,
      question: q.question,
      answered: answeredQuestions.has(q.id),
    }));

    // Build breadcrumbs
    const breadcrumbs = [
      { label: "Home", href: "/" },
      { label: "Course", href: `/courses/${courseId}` },
      { label: content.content_title },
    ];

    // Get correct answer for current question when viewing past submission
    const isViewingSubmission = viewingPastSubmission !== null;
    const currentSelectedAnswer = selectedAnswer || answers[currentQuestion.id];
    // Find the correct answer option ID (correctAnswer is stored as A, B, C, D)
    const correctAnswerValue = isViewingSubmission
      ? (currentQuestion as any).correctAnswer
      : undefined;
    const correctAnswerId = correctAnswerValue
      ? currentQuestion.options.find(
          (opt) =>
            opt.value === correctAnswerValue || opt.id === correctAnswerValue
        )?.id
      : undefined;
    const currentExplanation = isViewingSubmission
      ? (currentQuestion as any).explanation
      : undefined;

    return (
      <>
        {/* Back to Course button when viewing past submission */}
        {isViewingSubmission && (
          <Box sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              onClick={handleBackFromPastSubmission}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                textTransform: "none",
                fontSize: "0.9375rem",
                fontWeight: 600,
                borderColor: "#6366f1",
                color: "#6366f1",
                "&:hover": {
                  borderColor: "#4f46e5",
                  backgroundColor: "#6366f115",
                },
              }}
            >
              ← Back to Course
            </Button>
          </Box>
        )}
        <CompletionDialog
          open={showCompletionDialog}
          onClose={() => {
            setShowCompletionDialog(false);
            onQuizComplete?.(completionStats?.score);
          }}
          contentType="Quiz"
          contentTitle={content.content_title}
          stats={completionStats}
        />
        <ConfirmDialog
          open={showConfirmDialog}
          title={confirmDialogProps?.title || "Confirm"}
          message={confirmDialogProps?.message || ""}
          confirmText="Submit"
          cancelText="Cancel"
          confirmColor="primary"
          onConfirm={() => {
            if (confirmDialogProps?.onConfirm) {
              confirmDialogProps.onConfirm();
            }
          }}
          onCancel={() => setShowConfirmDialog(false)}
        />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* Navigation Bar - Only show when not viewing submission */}
          {!isViewingSubmission && (
            <QuizNavigationBar
              currentQuestionIndex={currentQuestionIndex}
              totalQuestions={quizQuestions.length}
              isSubmitting={isSubmitting}
              onPrevious={handlePreviousQuestion}
              onNext={handleNextQuestion}
              onSubmit={handleFinalSubmit}
            />
          )}

          {/* QuizLayout - Center */}
          <QuizLayout
            breadcrumbs={breadcrumbs}
            currentQuestionIndex={currentQuestionIndex}
            currentQuestion={currentQuestion}
            selectedAnswer={currentSelectedAnswer}
            questions={questionList}
            totalQuestions={quizQuestions.length}
            timeRemaining={isViewingSubmission ? undefined : timeRemaining}
            onTimeUp={handleTimeUp}
            onAnswerSelect={isViewingSubmission ? () => {} : handleAnswerSelect}
            onNextQuestion={handleNextQuestion}
            onPreviousQuestion={handlePreviousQuestion}
            onFinalSubmit={
              isViewingSubmission
                ? handleBackFromPastSubmission
                : handleFinalSubmit
            }
            onQuestionClick={handleQuestionClick}
            isSubmitting={isSubmitting}
            showCorrectAnswer={isViewingSubmission}
            correctAnswerId={correctAnswerId}
            isReadOnly={isViewingSubmission}
            explanation={currentExplanation}
          />
        </Box>
      </>
    );
  }

  // Show quiz start screen
  return (
    <>
      <CompletionDialog
        open={showCompletionDialog}
        onClose={() => {
          setShowCompletionDialog(false);
          onQuizComplete?.(completionStats?.obtainedMarks);
        }}
        contentType="Quiz"
        contentTitle={content.content_title}
        stats={completionStats}
      />
      <ConfirmDialog
        open={showConfirmDialog}
        title={confirmDialogProps?.title || "Confirm"}
        message={confirmDialogProps?.message || ""}
        confirmText="Submit"
        cancelText="Cancel"
        confirmColor="primary"
        onConfirm={() => {
          if (confirmDialogProps?.onConfirm) {
            confirmDialogProps.onConfirm();
          }
        }}
        onCancel={() => setShowConfirmDialog(false)}
      />
      <Box sx={{ mb: 3 }}>
        <QuizStartScreen content={content} onStartQuiz={handleStartQuiz} />
        <PastSubmissionsTable
          submissions={pastSubmissions}
          loading={loadingSubmissions}
          onViewSubmission={handleViewPastSubmission}
        />
      </Box>
    </>
  );
}
