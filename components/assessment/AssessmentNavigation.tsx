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
        px: 3,
        py: 1.5,
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 3,
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

        {/* Section Tabs - Compact */}
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
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
                  px: 1.5,
                  py: 0.75,
                  backgroundColor: isActive
                    ? isCoding
                      ? "#dbeafe"
                      : "#f3e8ff"
                    : "#f9fafb",
                  border: `1px solid ${
                    isActive ? (isCoding ? "#3b82f6" : "#a855f7") : "#e5e7eb"
                  }`,
                  borderRadius: 1,
                  cursor: onSectionChange ? "pointer" : "default",
                  transition: "all 0.2s",
                  "&:hover": onSectionChange
                    ? {
                        borderColor: isCoding ? "#3b82f6" : "#a855f7",
                        transform: "translateY(-1px)",
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
                    fontSize: "0.7rem",
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
                    color: "#9ca3af",
                    fontSize: "0.65rem",
                    fontWeight: 500,
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
          startIcon={<IconWrapper icon="mdi:chevron-left" size={16} />}
          sx={{
            borderColor: "#d1d5db",
            color: "#374151",
            borderRadius: 1,
            fontSize: "0.875rem",
            "&:hover": {
              borderColor: "#9ca3af",
              backgroundColor: "#f9fafb",
            },
            "&:disabled": {
              borderColor: "#e5e7eb",
              color: "#9ca3af",
            },
          }}
        >
          Previous
        </Button>
        <Button
          variant="contained"
          onClick={onNext}
          disabled={isLastQuestion}
          endIcon={<IconWrapper icon="mdi:chevron-right" size={16} />}
          sx={{
            backgroundColor: "#374151",
            color: "#ffffff",
            borderRadius: 1,
            fontSize: "0.875rem",
            "&:hover": {
              backgroundColor: "#1f2937",
            },
            "&:disabled": {
              backgroundColor: "#e5e7eb",
              color: "#9ca3af",
            },
          }}
        >
          Next
        </Button>
      </Box>
    </Paper>
  );
});
