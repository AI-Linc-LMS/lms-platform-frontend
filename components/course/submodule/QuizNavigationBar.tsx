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
        backgroundColor: "var(--card-bg)",
        borderRadius: 2,
        border: "1px solid var(--border-default)",
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
              borderColor: "var(--accent-indigo)",
              color: "var(--accent-indigo)",
              px: 2.5,
              py: 1,
              minWidth: "110px",
              fontSize: "0.875rem",
              fontWeight: 600,
              borderRadius: 2,
              textTransform: "none",
              "&:hover": {
                borderColor: "var(--accent-indigo-dark)",
                backgroundColor:
                  "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
              },
              "&.Mui-disabled": {
                borderColor: "var(--border-default)",
                color: "var(--font-tertiary)",
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
            color: "var(--font-secondary)",
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
            background:
              "linear-gradient(135deg, var(--success-500) 0%, color-mix(in srgb, var(--success-500) 85%, black 15%) 100%)",
            color: "var(--font-light)",
            px: 3,
            py: 1,
            minWidth: "130px",
            fontSize: "0.875rem",
            fontWeight: 600,
            borderRadius: 2,
            textTransform: "none",
            boxShadow:
              "0 4px 12px color-mix(in srgb, var(--success-500) 35%, transparent)",
            "&:hover": {
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--success-500) 85%, black 15%) 0%, color-mix(in srgb, var(--success-500) 70%, black 30%) 100%)",
              boxShadow:
                "0 6px 16px color-mix(in srgb, var(--success-500) 45%, transparent)",
              transform: "translateY(-1px)",
            },
            "&:active": {
              transform: "translateY(0)",
            },
            "&.Mui-disabled": {
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--border-default) 80%, var(--surface) 20%) 0%, color-mix(in srgb, var(--font-tertiary) 60%, var(--surface) 40%) 100%)",
              color: "var(--font-light)",
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

