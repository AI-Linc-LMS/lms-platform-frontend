"use client";

import { Box, Typography, Button } from "@mui/material";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("common");
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
            ← {t("quiz.previous")}
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
          {t("quiz.questionOf", {
            current: currentQuestionIndex + 1,
            total: totalQuestions,
          })}
        </Typography>
      </Box>

      {/* Submit Early (or Submit on last question) - Right */}
      <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={isSubmitting}
          sx={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#ffffff",
            px: 3,
            py: 1,
            minWidth: "130px",
            fontSize: "0.875rem",
            fontWeight: 600,
            borderRadius: 2,
            textTransform: "none",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
            "&:hover": {
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              boxShadow: "0 6px 16px rgba(16, 185, 129, 0.4)",
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
          {isSubmitting
            ? t("quiz.submitting")
            : isLastQuestion
              ? t("quiz.submitQuiz")
              : t("quiz.submitEarly")}
        </Button>
      </Box>
    </Box>
  );
}

