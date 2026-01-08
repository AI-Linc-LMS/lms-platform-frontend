"use client";

import { Box, Paper, Typography, Button } from "@mui/material";
import { memo, useMemo } from "react";
import {
  QuizQuestionList,
  QuestionTitle,
  AnswerOptionsList,
} from "@/components/quiz";

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

interface AssessmentQuizLayoutProps {
  currentQuestionIndex: number;
  currentQuestion: QuizQuestion;
  selectedAnswer?: string | number;
  questions: Array<{
    id: string | number;
    question: string;
    answered?: boolean;
  }>;
  totalQuestions: number;
  onAnswerSelect: (answerId: string | number) => void;
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
    onNextQuestion,
    onPreviousQuestion,
    onQuestionClick,
  }: AssessmentQuizLayoutProps) {
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
    const isFirstQuestion = currentQuestionIndex === 0;

    // Memoize answered count to prevent expensive recalculation on every render
    const answeredCount = useMemo(
      () => questions?.filter((q) => q.answered).length || 0,
      [questions]
    );

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 2, md: 3 },
          maxWidth: "100%",
        }}
      >
        {/* Left Sidebar - Question List */}
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
              showCorrectAnswer={false}
              isReadOnly={false}
              isSubmitting={false}
              onAnswerSelect={onAnswerSelect}
            />

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
                  disabled={isFirstQuestion}
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

                {/* Next Button - Always show, never Submit */}
                <Button
                  variant="contained"
                  onClick={onNextQuestion}
                  disabled={isLastQuestion}
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
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    );
  },
  (prevProps, nextProps) => {
    // Optimized comparison - check if render is actually needed
    if (prevProps.currentQuestionIndex !== nextProps.currentQuestionIndex)
      return false;
    if (prevProps.currentQuestion.id !== nextProps.currentQuestion.id)
      return false;
    if (prevProps.selectedAnswer !== nextProps.selectedAnswer) return false;
    if (prevProps.totalQuestions !== nextProps.totalQuestions) return false;

    // Only check questions array length - don't deep compare
    if (prevProps.questions.length !== nextProps.questions.length) return false;

    // Check if answered status changed for any question
    const prevAnswered = prevProps.questions.filter((q) => q.answered).length;
    const nextAnswered = nextProps.questions.filter((q) => q.answered).length;
    if (prevAnswered !== nextAnswered) return false;

    return true; // No need to re-render
  }
);
