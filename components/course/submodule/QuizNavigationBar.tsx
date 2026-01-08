"use client";

import { Box, Typography, Button } from "@mui/material";

interface QuizNavigationBarProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function QuizNavigationBar({
  currentQuestionIndex,
  totalQuestions,
  isSubmitting,
  onPrevious,
  onNext,
  onSubmit,
}: QuizNavigationBarProps) {
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: { xs: 1, sm: 2 },
        py: 1.5,
        backgroundColor: "#ffffff",
        borderRadius: 2,
        border: "1px solid #e5e7eb",
      }}
    >
      {/* Previous Button - Left */}
      <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
        {currentQuestionIndex > 0 && (
          <Button
            variant="outlined"
            onClick={onPrevious}
            disabled={isSubmitting}
            sx={{
              borderColor: "#6366f1",
              color: "#6366f1",
              px: 2.5,
              py: 1,
              minWidth: "110px",
              fontSize: "0.875rem",
              fontWeight: 600,
              borderRadius: 2,
              textTransform: "none",
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
            ← Previous
          </Button>
        )}
      </Box>

      {/* Question Counter - Middle */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: "#6b7280",
            fontWeight: 600,
            fontSize: "0.9375rem",
          }}
        >
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </Typography>
      </Box>

      {/* Next/Submit Button - Right */}
      <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={isLastQuestion ? onSubmit : onNext}
          disabled={isSubmitting}
          sx={{
            background: isLastQuestion
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
              : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            color: "#ffffff",
            px: 3,
            py: 1,
            minWidth: "110px",
            fontSize: "0.875rem",
            fontWeight: 600,
            borderRadius: 2,
            textTransform: "none",
            boxShadow: isLastQuestion
              ? "0 4px 12px rgba(16, 185, 129, 0.3)"
              : "0 4px 12px rgba(99, 102, 241, 0.3)",
            "&:hover": {
              background: isLastQuestion
                ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                : "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
              boxShadow: isLastQuestion
                ? "0 6px 16px rgba(16, 185, 129, 0.4)"
                : "0 6px 16px rgba(99, 102, 241, 0.4)",
              transform: "translateY(-1px)",
            },
            "&:active": {
              transform: "translateY(0)",
            },
            "&:disabled": {
              background: "linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)",
              color: "#ffffff",
              boxShadow: "none",
              opacity: 0.6,
            },
            transition: "all 0.2s ease-in-out",
          }}
        >
          {isLastQuestion
            ? isSubmitting
              ? "Submitting..."
              : "Submit"
            : "Next →"}
        </Button>
      </Box>
    </Box>
  );
}

