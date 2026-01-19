"use client";

import { Box, Paper, Typography, Button } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { memo, useMemo } from "react";

interface AssessmentNavigationProps {
  currentSectionIndex: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  sections: Array<{
    title?: string;
    section_type?: string;
    questions?: Array<any>;
  }>;
  currentSectionQuestionCount: number;
  isLastQuestion: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSectionChange?: (sectionIndex: number) => void;
}

export const AssessmentNavigation = memo(function AssessmentNavigation({
  currentSectionIndex,
  currentQuestionIndex,
  totalQuestions,
  sections,
  isLastQuestion,
  onPrevious,
  onNext,
  onSectionChange,
}: AssessmentNavigationProps) {
  // Memoize question number calculation
  const questionNum = useMemo(() => {
    let num = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
      num += sections[i]?.questions?.length || 0;
    }
    return num + currentQuestionIndex + 1;
  }, [currentSectionIndex, currentQuestionIndex, sections]);

  return (
    <Paper
      elevation={0}
      sx={{
        position: "fixed",
        top: 90,
        left: 0,
        right: 0,
        zIndex: 1200,
        px: { xs: 2, md: 3 },
        py: 1.5,
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: { xs: 1.5, md: 3 },
      }}
    >
      {/* Left: Question Counter & Section Tabs */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flex: 1,
          minWidth: 0,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: "#374151",
            fontSize: "0.875rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          Question {questionNum} of {totalQuestions}
        </Typography>

        {/* Section Tabs - Improved Styling */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
            flexWrap: "wrap",
            overflowX: "auto",
            "&::-webkit-scrollbar": {
              height: "4px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#d1d5db",
              borderRadius: "2px",
            },
          }}
        >
          {sections.map((section, index) => {
            const questionsCount = section.questions?.length || 0;
            const isActive = index === currentSectionIndex;
            const sectionType = section.section_type || "quiz";
            const isCoding = sectionType === "coding";

            return (
              <Box
                key={index}
                onClick={() => onSectionChange?.(index)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: { xs: 1.5, md: 2 },
                  py: { xs: 0.75, md: 1 },
                  backgroundColor: isActive
                    ? isCoding
                      ? "#eff6ff"
                      : "#f5f3ff"
                    : "#ffffff",
                  border: `2px solid ${
                    isActive ? (isCoding ? "#3b82f6" : "#a855f7") : "#e5e7eb"
                  }`,
                  borderRadius: 1.5,
                  cursor: onSectionChange ? "pointer" : "default",
                  transition: "all 0.15s ease-out",
                  boxShadow: isActive
                    ? `0 2px 6px 0 ${
                        isCoding ? "rgba(59, 130, 246, 0.15)" : "rgba(168, 85, 247, 0.15)"
                      }`
                    : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                  whiteSpace: "nowrap",
                  "&:hover": onSectionChange
                    ? {
                        borderColor: isCoding ? "#2563eb" : "#9333ea",
                        backgroundColor: isActive
                          ? isCoding
                            ? "#dbeafe"
                            : "#ede9fe"
                          : "#f9fafb",
                        transform: "translateY(-1px)",
                        boxShadow: `0 3px 8px 0 ${
                          isCoding ? "rgba(59, 130, 246, 0.2)" : "rgba(168, 85, 247, 0.2)"
                        }`,
                      }
                    : {},
                }}
              >
                <IconWrapper
                  icon={isCoding ? "mdi:code-braces" : "mdi:clipboard-text"}
                  size={14}
                  color={
                    isActive ? (isCoding ? "#2563eb" : "#9333ea") : "#6b7280"
                  }
                />
        <Typography
          variant="caption"
          sx={{
            color: isActive
              ? isCoding
                ? "#2563eb"
                : "#9333ea"
              : "#6b7280",
            fontSize: { xs: "0.7rem", md: "0.75rem" },
            fontWeight: isActive ? 700 : 600,
            whiteSpace: "nowrap",
          }}
        >
          {section.title ||
            `${sectionType === "coding" ? "Coding" : "Quiz"}`}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: isActive ? (isCoding ? "#3b82f6" : "#a855f7") : "#9ca3af",
            fontSize: { xs: "0.65rem", md: "0.7rem" },
            fontWeight: isActive ? 600 : 500,
          }}
        >
          ({questionsCount})
        </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Current Question in Section Badge */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: 1,
            py: 0.5,
            backgroundColor: "#f3f4f6",
            borderRadius: 0.75,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "#6b7280",
              fontSize: "0.7rem",
              fontWeight: 600,
            }}
          >
            {currentQuestionIndex + 1}/
            {sections[currentSectionIndex]?.questions?.length || 0}
          </Typography>
        </Box>
      </Box>

      {/* Right: Navigation Buttons */}
      <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
        <Button
          variant="outlined"
          onClick={onPrevious}
          disabled={currentQuestionIndex === 0 && currentSectionIndex === 0}
          startIcon={<IconWrapper icon="mdi:chevron-left" size={18} />}
          sx={{
            borderColor: "#6366f1",
            color: "#6366f1",
            borderRadius: 1.5,
            px: 2.5,
            py: 1,
            fontSize: "0.875rem",
            fontWeight: 600,
            textTransform: "none",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              borderColor: "#4f46e5",
              backgroundColor: "#eff6ff",
              transform: "translateX(-2px)",
            },
            "&:disabled": {
              borderColor: "#e5e7eb",
              color: "#9ca3af",
              transform: "none",
            },
          }}
        >
          Previous
        </Button>
        <Button
          variant="contained"
          onClick={onNext}
          disabled={isLastQuestion}
          endIcon={<IconWrapper icon="mdi:chevron-right" size={18} />}
          sx={{
            backgroundColor: "#6366f1",
            color: "#ffffff",
            borderRadius: 1.5,
            px: 3,
            py: 1,
            fontSize: "0.875rem",
            fontWeight: 600,
            textTransform: "none",
            boxShadow: "0 2px 8px 0 rgba(99, 102, 241, 0.3)",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              backgroundColor: "#4f46e5",
              boxShadow: "0 4px 12px 0 rgba(99, 102, 241, 0.4)",
              transform: "translateX(2px)",
            },
            "&:disabled": {
              backgroundColor: "#e5e7eb",
              color: "#9ca3af",
              boxShadow: "none",
              transform: "none",
            },
          }}
        >
          Next
        </Button>
      </Box>
    </Paper>
  );
});
