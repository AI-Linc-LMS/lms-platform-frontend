"use client";

import { Box, Paper, Typography, Button, useTheme } from "@mui/material";
import { memo, useMemo, useRef } from "react";
import {
  QuizQuestionList,
  QuestionTitle,
  AnswerOptionsList,
} from "@/components/quiz";

export interface QuizQuestion {
  id: string | number;
  question: string;
  options: QuizOption[];
  /** Default single (MCQ); multiple = MSQ (checkboxes). */
  question_style?: "single" | "multiple";
}

export interface QuizOption {
  id: string | number;
  label: string;
  value: string;
}

interface AssessmentQuizLayoutProps {
  currentQuestionIndex: number;
  currentQuestion: QuizQuestion;
  selectedAnswer?: string | number | string[];
  questions: Array<{
    id: string | number;
    question: string;
    answered?: boolean;
  }>;
  totalQuestions: number;
  onAnswerSelect: (answerId: string | number) => void;
  onClearAnswer?: () => void;
  onNextQuestion?: () => void;
  onPreviousQuestion?: () => void;
  onQuestionClick?: (questionId: string | number) => void;
}

export const AssessmentQuizLayout = memo(
  function AssessmentQuizLayout({
    currentQuestionIndex,
    currentQuestion,
    selectedAnswer,
    questions = [],
    totalQuestions,
    onAnswerSelect,
    onClearAnswer,
    onNextQuestion,
    onPreviousQuestion,
    onQuestionClick,
  }: AssessmentQuizLayoutProps) {
    const theme = useTheme();
    const isMsq = currentQuestion.question_style === "multiple";
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
    const isFirstQuestion = currentQuestionIndex === 0;

    // Optimized answered count - use ref to cache
    const answeredCountRef = useRef<number>(0);
    const lastQuestionsHashRef = useRef<string>("");
    
    const answeredCount = useMemo(() => {
      if (!questions || questions.length === 0) {
        answeredCountRef.current = 0;
        return 0;
      }
      
      // Create a simple hash of answered statuses
      const hash = questions.map(q => `${q.id}:${q.answered ? '1' : '0'}`).join(',');
      
      // Only recalculate if hash changed
      if (hash === lastQuestionsHashRef.current) {
        return answeredCountRef.current;
      }
      
      lastQuestionsHashRef.current = hash;
      const count = questions.filter((q) => q.answered).length;
      answeredCountRef.current = count;
      return count;
    }, [questions]);

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { md: "stretch" },
          gap: { xs: 2, md: 3 },
          maxWidth: "100%",
        }}
      >
        {/* Left Sidebar - Question List */}
        <Box
          sx={{
            width: { xs: "100%", md: "min(360px, 34vw)" },
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 0,
            order: { xs: 1, md: 0 },
            alignSelf: { xs: "stretch", md: "flex-start" },
            minHeight: { md: 0 },
            position: { md: "sticky" },
            top: { md: theme.spacing(18.5) },
            maxHeight: {
              md: `calc(100vh - ${theme.spacing(18.5)} - 16px)`,
            },
            zIndex: { md: 1 },
          }}
        >
          {/* Question List */}
          <QuizQuestionList
            questions={questions}
            currentQuestionId={currentQuestion.id}
            onQuestionClick={onQuestionClick}
          />
        </Box>

        {/* Right Main Content */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            order: { xs: 0, md: 1 },
          }}
        >
          {/* Question Card */}
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              p: { xs: 2, sm: 3, md: 4 },
              backgroundColor: "var(--font-light)",
              borderRadius: 2,
              border: "1px solid var(--border-default)",
              display: "flex",
              flexDirection: "column",
              minHeight: { md: "min(520px, 70vh)" },
              boxShadow:
                "0 10px 40px color-mix(in srgb, var(--primary-900) 9%, transparent), 0 1px 0 color-mix(in srgb, var(--primary-900) 6%, transparent)",
            }}
          >
            {/* Question Title */}
            <QuestionTitle question={currentQuestion.question} />

            {/* Answer Options */}
            <AnswerOptionsList
              options={currentQuestion.options}
              selectedAnswer={selectedAnswer}
              showCorrectAnswer={false}
              isReadOnly={false}
              isSubmitting={false}
              onAnswerSelect={onAnswerSelect}
              multiSelect={isMsq}
            />

            {/* Clear Answer Button - Only show if answer is selected */}
            {onClearAnswer &&
              (isMsq
                ? Array.isArray(selectedAnswer) && selectedAnswer.length > 0
                : selectedAnswer !== undefined && selectedAnswer !== null) && (
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  variant="text"
                  onClick={onClearAnswer}
                  sx={{
                    color: "var(--error-500)",
                    textTransform: "none",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    px: 2,
                    py: 0.75,
                    "&:hover": {
                      backgroundColor: "color-mix(in srgb, var(--error-500) 12%, transparent)",
                      color: "var(--error-600)",
                    },
                  }}
                >
                  Clear Answer
                </Button>
              </Box>
            )}

            {/* Navigation Buttons - No Submit Button */}
            <Box
              sx={{
                mt: 4,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "stretch", sm: "center" },
                gap: 2,
              }}
            >
              {/* Progress indicator - mobile top */}
              <Box
                sx={{
                  display: { xs: "block", sm: "none" },
                  textAlign: "center",
                  mb: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--font-secondary)",
                    fontWeight: 500,
                  }}
                >
                  {answeredCount} of {totalQuestions} answered
                </Typography>
              </Box>

              {/* Button Group */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                  width: { xs: "100%", sm: "auto" },
                  alignItems: { xs: "stretch", sm: "center" },
                  justifyContent: "space-between",
                }}
              >
                {/* Previous Button */}
                <Button
                  variant="outlined"
                  onClick={onPreviousQuestion}
                  disabled={isFirstQuestion}
                  sx={{
                    borderColor: "var(--accent-indigo)",
                    color: "var(--accent-indigo)",
                    px: { xs: 2, sm: 3 },
                    py: 1.5,
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: "none",
                    flex: { xs: 1, sm: "none" },
                    minWidth: {
                      xs: "auto",
                      sm: "120px",
                    },
                    "&:hover": {
                      borderColor: "var(--accent-indigo-dark)",
                      backgroundColor: "color-mix(in srgb, var(--accent-indigo) 9%, transparent)",
                    },
                    "&:disabled": {
                      borderColor: "var(--border-light)",
                      color: "var(--font-tertiary)",
                    },
                  }}
                >
                  Previous
                </Button>

                {/* Progress indicator - desktop middle */}
                <Box
                  sx={{
                    display: { xs: "none", sm: "flex" },
                    alignItems: "center",
                    minWidth: "150px",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: "var(--font-secondary)",
                      fontWeight: 500,
                    }}
                  >
                    {answeredCount} of {totalQuestions} answered
                  </Typography>
                </Box>

                {/* Next Button - Always show, never Submit */}
                <Button
                  variant="contained"
                  onClick={onNextQuestion}
                  disabled={isLastQuestion}
                  sx={{
                    backgroundColor: "var(--accent-indigo)",
                    color: "var(--font-light)",
                    px: { xs: 2, sm: 4 },
                    py: 1.5,
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: "none",
                    flex: { xs: 1, sm: "none" },
                    minWidth: {
                      xs: "auto",
                      sm: "140px",
                    },
                    "&:hover": {
                      backgroundColor: "var(--accent-indigo-dark)",
                    },
                    "&:disabled": {
                      backgroundColor: "var(--border-light)",
                      color: "var(--font-tertiary)",
                    },
                  }}
                >
                  Next
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    );
  },
  (prevProps, nextProps) => {
    // If question index or question changed, we MUST re-render (navigation)
    if (prevProps.currentQuestionIndex !== nextProps.currentQuestionIndex) return false;
    if (prevProps.currentQuestion.id !== nextProps.currentQuestion.id) return false;
    
    // If selected answer changed, re-render
    const selEq =
      prevProps.selectedAnswer === nextProps.selectedAnswer ||
      (Array.isArray(prevProps.selectedAnswer) &&
        Array.isArray(nextProps.selectedAnswer) &&
        JSON.stringify(prevProps.selectedAnswer) ===
          JSON.stringify(nextProps.selectedAnswer));
    if (!selEq) return false;
    
    // If total questions changed, re-render
    if (prevProps.totalQuestions !== nextProps.totalQuestions) return false;

    // If questions array length changed, re-render
    if (prevProps.questions.length !== nextProps.questions.length) return false;

    // Quick check: if current question's answered status changed, re-render
    const currentQId = nextProps.currentQuestion.id;
    const prevCurrentAnswered = prevProps.questions.find((q) => q.id === currentQId)?.answered;
    const nextCurrentAnswered = nextProps.questions.find((q) => q.id === currentQId)?.answered;
    if (prevCurrentAnswered !== nextCurrentAnswered) return false;

    // Only check total answered count if it's different (optimized)
    const prevAnswered = prevProps.questions.filter((q) => q.answered).length;
    const nextAnswered = nextProps.questions.filter((q) => q.answered).length;
    if (prevAnswered !== nextAnswered) return false;

    // All checks passed - skip re-render
    return true;
  }
);
