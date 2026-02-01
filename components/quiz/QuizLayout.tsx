"use client";

import {
  Box,
  Paper,
  Typography,
  Button,
  Breadcrumbs,
  Link,
} from "@mui/material";
import { QuizTimer } from "./QuizTimer";
import { QuizQuestionList } from "./QuizQuestionList";
import { QuestionTitle } from "./QuestionTitle";
import { AnswerOptionsList } from "./AnswerOptionsList";
import { ExplanationSection } from "./ExplanationSection";

export interface QuizQuestion {
  id: string | number;
  question: string;
  options: QuizOption[];
}

export interface QuizOption {
  id: string | number;
  label: string;
  value: string;
}

export interface QuizLayoutProps {
  // Breadcrumbs
  breadcrumbs?: Array<{ label: string; href?: string }>;

  // Current question
  currentQuestionIndex: number;
  currentQuestion: QuizQuestion;
  selectedAnswer?: string | number;

  // All questions
  questions: Array<{
    id: string | number;
    question: string;
    answered?: boolean;
  }>;
  totalQuestions: number;

  // Timer
  timeRemaining?: number; // in seconds
  totalDurationSeconds?: number; // total duration for progress circle
  onTimeUp?: () => void;

  // Actions
  onAnswerSelect: (answerId: string | number) => void;
  onNextQuestion?: () => void;
  onPreviousQuestion?: () => void;
  onFinalSubmit: () => void;
  onQuestionClick?: (questionId: string | number) => void;

  // UI state
  isSubmitting?: boolean;
  showCorrectAnswer?: boolean;
  correctAnswerId?: string | number;
  isReadOnly?: boolean; // For viewing past submissions
  explanation?: string; // Explanation for the current question
}

export function QuizLayout({
  breadcrumbs = [],
  currentQuestionIndex,
  currentQuestion,
  selectedAnswer,
  questions,
  totalQuestions,
  timeRemaining,
  totalDurationSeconds,
  onTimeUp,
  onAnswerSelect,
  onNextQuestion,
  onPreviousQuestion,
  onFinalSubmit,
  onQuestionClick,
  isSubmitting = false,
  showCorrectAnswer = false,
  correctAnswerId,
  isReadOnly = false,
  explanation,
}: QuizLayoutProps) {
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const answeredCount = questions.filter((q) => q.answered).length;
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: { xs: 2, md: 3 },
        maxWidth: "100%",
      }}
    >
      {/* Left Sidebar - Timer and Question List */}
      <Box
        sx={{
          width: { xs: "100%", md: "320px" },
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          order: { xs: 1, md: 0 },
        }}
      >
        {/* Timer */}
        {timeRemaining !== undefined && (
          <QuizTimer
            timeRemaining={timeRemaining}
            totalDurationSeconds={totalDurationSeconds}
            onTimeUp={onTimeUp}
          />
        )}

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
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <Breadcrumbs
            separator=">"
            sx={{
              mb: 3,
              "& .MuiBreadcrumbs-separator": {
                color: "#6b7280",
              },
            }}
          >
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return isLast || !crumb.href ? (
                <Typography
                  key={index}
                  sx={{
                    color: isLast ? "#1a1f2e" : "#6b7280",
                    fontWeight: isLast ? 600 : 400,
                  }}
                >
                  {crumb.label}
                </Typography>
              ) : (
                <Link
                  key={index}
                  href={crumb.href}
                  sx={{
                    color: "#6366f1",
                    textDecoration: "none",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  {crumb.label}
                </Link>
              );
            })}
          </Breadcrumbs>
        )}

        {/* Question Card */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3, md: 4 },
            backgroundColor: "#ffffff",
            borderRadius: 2,
            border: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Question Title */}
          <QuestionTitle question={currentQuestion.question} />

          {/* Answer Options */}
          <AnswerOptionsList
            options={currentQuestion.options}
            selectedAnswer={selectedAnswer}
            showCorrectAnswer={showCorrectAnswer}
            correctAnswerId={correctAnswerId}
            isReadOnly={isReadOnly}
            isSubmitting={isSubmitting}
            onAnswerSelect={onAnswerSelect}
          />

          {/* Explanation */}
          {explanation && <ExplanationSection explanation={explanation} />}

          {/* Navigation and Submit Buttons */}
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
                mb: { xs: isLastQuestion ? 0 : 1 },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#6b7280",
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
                disabled={isFirstQuestion || isSubmitting}
                sx={{
                  borderColor: "#6366f1",
                  color: "#6366f1",
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
                    borderColor: "#4f46e5",
                    backgroundColor: "#6366f115",
                  },
                  "&:disabled": {
                    borderColor: "#d1d5db",
                    color: "#9ca3af",
                  },
                }}
              >
                Previous
              </Button>

              {/* Progress indicator - desktop middle */}
              {!isLastQuestion && (
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
                      color: "#6b7280",
                      fontWeight: 500,
                    }}
                  >
                    {answeredCount} of {totalQuestions} answered
                  </Typography>
                </Box>
              )}

              {/* Next / Final Submit Buttons */}
              {!isLastQuestion ? (
                <Button
                  variant="contained"
                  onClick={onNextQuestion}
                  disabled={isSubmitting}
                  sx={{
                    backgroundColor: "#6366f1",
                    color: "#ffffff",
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
                      backgroundColor: "#4f46e5",
                    },
                    "&:disabled": {
                      backgroundColor: "#d1d5db",
                      color: "#9ca3af",
                    },
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={onFinalSubmit}
                  disabled={isSubmitting}
                  sx={{
                    background: isReadOnly
                      ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
                      : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    px: { xs: 3, sm: 5 },
                    py: 1.5,
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: "none",
                    flex: 1,
                    minWidth: { xs: "auto", sm: "200px" },
                    boxShadow: isReadOnly
                      ? "0 4px 12px rgba(99, 102, 241, 0.3)"
                      : "0 4px 12px rgba(16, 185, 129, 0.3)",
                    "&:hover": {
                      background: isReadOnly
                        ? "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)"
                        : "linear-gradient(135deg, #059669 0%, #047857 100%)",
                      boxShadow: isReadOnly
                        ? "0 6px 16px rgba(99, 102, 241, 0.4)"
                        : "0 6px 16px rgba(16, 185, 129, 0.4)",
                      transform: "translateY(-1px)",
                    },
                    "&:active": {
                      transform: "translateY(0)",
                    },
                    "&:disabled": {
                      background:
                        "linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)",
                      color: "#ffffff",
                      boxShadow: "none",
                      opacity: 0.6,
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  {isReadOnly
                    ? "Back"
                    : isSubmitting
                    ? "Submitting..."
                    : "Submit Quiz"}
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
