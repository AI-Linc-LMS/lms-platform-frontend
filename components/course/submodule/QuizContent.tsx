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
  totalDurationSeconds?: number;
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
  const [totalDurationSeconds, setTotalDurationSeconds] = useState<
    number | undefined
  >(undefined);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState<{
    score: number;
    correctAnswers: number;
    answers: QuizAnswer[];
    obtainedMarks?: number;
    totalMarks?: number;
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

  // No quiz auto-start: do not restore from localStorage on mount.
  // User must explicitly click "Start Quiz" to begin.

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
        totalDurationSeconds,
        startTime: startTimeRef.current || Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [
    quizStarted,
    currentQuestionIndex,
    answers,
    timeRemaining,
    totalDurationSeconds,
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
        setTotalDurationSeconds(quizDuration);
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

      // Prepare user answers for API
      const userAnswers: Array<{
        questionId: number | string;
        questionIndex: number;
        selectedOption: string;
      }> = quizQuestions.map((q, index) => {
        const selected = finalAnswers[q.id];
        const correct = (q as any).correctAnswer;
        return {
          questionId: q.id,
          questionIndex: index,
          selectedOption: selected || "",
        };
      });

      let quizAnswers: QuizAnswer[];
      let correctCount: number;
      let score: number;
      let totalQuestions: number;
      let obtainedMarks: number;
      let totalMarks: number;

      // Call activity API - response may include questions, obtained_marks, maximum_marks
      try {
        const apiResponse = await coursesService.createUserActivity(
          courseId,
          content.id,
          "Quiz",
          { userAnswers }
        );

        // Use API response if it includes questions and marks
        if (
          apiResponse?.questions &&
          Array.isArray(apiResponse.questions) &&
          apiResponse.questions.length > 0
        ) {
          quizAnswers = apiQuestionsToQuizAnswers(apiResponse.questions);
          correctCount = apiResponse.questions.filter(
            (q: any) => q.is_correct === true
          ).length;
          totalQuestions = apiResponse.questions.length;
          obtainedMarks =
            apiResponse.obtained_marks ?? apiResponse.obtainedMarks ?? correctCount;
          totalMarks =
            apiResponse.maximum_marks ?? apiResponse.maximumMarks ?? content.marks ?? totalQuestions;
          score = correctCount;
        } else {
          throw new Error("No questions in response");
        }
      } catch (error: any) {
        // Fallback: compute from quizQuestions (we don't send isCorrect to API, get from response)
        quizAnswers = quizQuestions.map((q, index) => {
          const selected = userAnswers[index]?.selectedOption ?? finalAnswers[q.id] ?? "";
          const correct = (q as any).correctAnswer ?? "";
          const isCorrect = selected === correct;
          return {
            questionId: q.id,
            questionText: q.question,
            selectedAnswer: selected,
            correctAnswer: correct,
            isCorrect,
            explanation: (q as any).explanation,
            options: q.options.map((opt) => ({
              id: String(opt.id),
              label: opt.label,
              value: opt.value,
            })),
          };
        });
        correctCount = quizAnswers.filter((a) => a.isCorrect).length;
        totalQuestions = quizQuestions.length;
        const marksFromContent = content.marks || 0;
        obtainedMarks =
          marksFromContent > 0
            ? Math.round((correctCount / totalQuestions) * marksFromContent)
            : correctCount;
        totalMarks = marksFromContent > 0 ? marksFromContent : totalQuestions;
        score = correctCount;

        if (error?.message !== "No questions in response") {
          showToast("Quiz submitted but activity tracking failed", "warning");
        }
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
        obtainedMarks: totalMarks > 0 ? obtainedMarks : undefined,
        totalMarks: totalMarks > 0 ? totalMarks : undefined,
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

  // Convert API question format to QuizAnswer format (for results display)
  const apiQuestionsToQuizAnswers = (apiQuestions: any[]): QuizAnswer[] => {
    return apiQuestions.map((q: any, index: number) => {
      const opts = q.options || {};
      const optionKeys = Object.keys(opts).length > 0 ? Object.keys(opts).sort() : ["A", "B", "C", "D"];
      const options = optionKeys.map((key) => ({
        id: key,
        label: opts[key] || "",
        value: key,
      }));
      return {
        questionId: q.question_id ?? q.id ?? index,
        questionText: q.question_text ?? q.question ?? `Question ${index + 1}`,
        selectedAnswer: q.selected_option ?? "",
        correctAnswer: q.correct_option ?? "",
        isCorrect: q.is_correct ?? false,
        explanation: q.explanation,
        options,
      };
    });
  };

  // Convert past-submissions API format to QuizQuestion format
  // API: { question_id, question_text, options: {A:"...",B:"..."}, selected_option, correct_option, is_correct, explanation }
  const apiQuestionsToQuizQuestions = (apiQuestions: any[]): QuizQuestion[] => {
    return apiQuestions.map((q: any, index: number) => {
      const opts = q.options || {};
      const optionKeys = Object.keys(opts).length > 0 ? Object.keys(opts).sort() : ["A", "B", "C", "D"];
      const options = optionKeys.map((key) => ({
        id: key,
        label: opts[key] || "",
        value: key,
      }));
      return {
        id: q.question_id ?? q.id ?? index,
        question: q.question_text ?? q.question ?? `Question ${index + 1}`,
        options,
        correctAnswer: q.correct_option,
        explanation: q.explanation,
      };
    });
  };

  const handleViewPastSubmission = async (submission: any) => {
    try {
      setLoadingQuiz(true);

      let questionsToUse: QuizQuestion[] = [];
      let submissionToUse = submission;

      // Always fetch past-submission detail when we have an id - ensures full response
      // (questions, obtained_marks, maximum_marks, correct_option, selected_option, explanation)
      if (submission?.id) {
        try {
          const detail = await coursesService.getPastSubmissionDetail(
            courseId,
            content.id,
            submission.id
          );
          // Use fetched response as primary - it has the complete response sheet structure
          submissionToUse = { ...submission, ...detail };
        } catch {
          // Detail endpoint may not exist, use list item as-is
        }
      }

      const apiQuestions =
        submissionToUse?.questions ??
        submissionToUse?.question_details ??
        submissionToUse?.details?.questions;

      if (apiQuestions && Array.isArray(apiQuestions) && apiQuestions.length > 0) {
        questionsToUse = apiQuestionsToQuizQuestions(apiQuestions);
      }

      // Fallback: load from content.details (legacy) when no questions in response
      if (questionsToUse.length === 0 && content.details) {
        const mcqs = content.details?.mcqs || content.details?.questions;
        if (mcqs && Array.isArray(mcqs) && mcqs.length > 0) {
          questionsToUse = mcqs.map((q: any, index: number) => {
            const options = (q.options || []).map(
              (opt: string, optIndex: number) => {
                const optionLetter = String.fromCharCode(65 + optIndex);
                return {
                  id: optionLetter,
                  label: typeof opt === "string" ? opt : (opt as any)?.label ?? "",
                  value: optionLetter,
                };
              }
            );
            if (Array.isArray(options) && options.length === 0 && (q.options || typeof q.options === "object")) {
              const opts = typeof q.options === "object" ? q.options : {};
              Object.entries(opts || {}).forEach(([k, v]) => {
                options.push({ id: k, label: String(v), value: k });
              });
            }
            return {
              id: q.id || index,
              question: q.question_text || q.question || `Question ${index + 1}`,
              options,
              correctAnswer: q.correct_option,
              explanation: q.explanation,
            };
          });
        }
      }

      if (questionsToUse.length > 0) {
        clearAllQuizStorage();
        setQuizQuestions(questionsToUse);
        setViewingPastSubmission(submissionToUse);

        const apiQuestionsForResults =
          submissionToUse?.questions ??
          submissionToUse?.question_details ??
          submissionToUse?.details?.questions;

        // Build quiz results from API questions (correct_option, selected_option, explanation from API)
        if (apiQuestionsForResults && Array.isArray(apiQuestionsForResults)) {
          const quizAnswers = apiQuestionsToQuizAnswers(apiQuestionsForResults);
          const correctCount = apiQuestionsForResults.filter(
            (q: any) => q.is_correct === true
          ).length;
          const obtainedMarks =
            submissionToUse.obtained_marks ??
            submissionToUse.obtainedMarks ??
            correctCount;
          const totalMarks =
            submissionToUse.maximum_marks ??
            submissionToUse.maximumMarks ??
            content.marks ??
            questionsToUse.length;

          setQuizResults({
            score: correctCount,
            correctAnswers: correctCount,
            answers: quizAnswers,
            obtainedMarks:
              totalMarks > 0 ? Number(obtainedMarks) : undefined,
            totalMarks: totalMarks > 0 ? Number(totalMarks) : undefined,
          });
        } else {
          // Legacy: build from questionsToUse + custom_dimension.userAnswers
          const quizAnswers = convertPastSubmissionToQuizAnswers(submissionToUse);
          const correctCount = quizAnswers.filter((a) => a.isCorrect).length;
          const obtainedMarks =
            submissionToUse.obtained_marks ??
            submissionToUse.obtainedMarks ??
            correctCount;
          const totalMarks =
            submissionToUse.maximum_marks ??
            submissionToUse.maximumMarks ??
            content.marks ??
            questionsToUse.length;

          setQuizResults({
            score: correctCount,
            correctAnswers: correctCount,
            answers: quizAnswers,
            obtainedMarks:
              totalMarks > 0 ? Number(obtainedMarks) : undefined,
            totalMarks: totalMarks > 0 ? Number(totalMarks) : undefined,
          });
        }
        setShowResults(true);

        // Build answers map for navigation if user goes back to browse (legacy path)
        const answersMap: Record<string | number, string> = {};
        if (apiQuestionsForResults && Array.isArray(apiQuestionsForResults)) {
          apiQuestionsForResults.forEach((q: any, idx: number) => {
            const qId = q.question_id ?? q.id ?? questionsToUse[idx]?.id ?? idx;
            const selected = q.selected_option ?? "";
            if (qId != null) answersMap[qId] = selected;
          });
        } else {
          const userAnswers =
            submissionToUse?.custom_dimension?.userAnswers || [];
          userAnswers.forEach((ua: any) => {
            const question = questionsToUse.find(
              (q) =>
                q.id === ua.questionId ||
                questionsToUse.findIndex((q2) => q2.id === q.id) === ua.questionIndex
            );
            if (question) answersMap[question.id] = ua.selectedOption;
          });
        }
        setAnswers(answersMap);
        setAnsweredQuestions(new Set(Object.keys(answersMap).map(Number)));
        setSelectedAnswer(answersMap[questionsToUse[0]?.id] ?? undefined);
        setCurrentQuestionIndex(0);
        setQuizStarted(false);
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
        obtainedMarks={quizResults.obtainedMarks}
        totalMarks={quizResults.totalMarks}
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
            totalDurationSeconds={totalDurationSeconds}
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
