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
        insetInlineStart: 0,
        insetInlineEnd: 0,
        zIndex: 1200,
        px: { xs: 2, md: 3 },
        py: 1.5,
        borderBottom: "1px solid var(--border-default)",
        backgroundColor: "var(--card-bg)",
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
            color: "var(--font-muted)",
            fontSize: "0.875rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          Question {questionNum} of {totalQuestions}
        </Typography>

        {/* Section Tabs - Scroll when more than 6 sections instead of wrapping to 2 lines */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "center",
            flexWrap: sections.length > 6 ? "nowrap" : "wrap",
            overflowX: sections.length > 6 ? "auto" : "visible",
            overflowY: "hidden",
            maxHeight: sections.length > 6 ? "48px" : "none",
            "&::-webkit-scrollbar": {
              height: "4px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "var(--border-light)",
              borderRadius: "2px",
            },
          }}
        >
          {sections.map((section, index) => {
            const questionsCount = section.questions?.length || 0;
            const isActive = index === currentSectionIndex;
            const sectionType = section.section_type || "quiz";
            const isCoding = sectionType === "coding";
            const isSubjective = sectionType === "subjective";

            const activeBorder = isCoding
              ? "var(--accent-blue-light)"
              : isSubjective
                ? "var(--assessment-subjective-accent)"
                : "var(--accent-purple)";
            const activeBg = isCoding
              ? "var(--surface-blue-light)"
              : isSubjective
                ? "var(--assessment-subjective-surface-active)"
                : "var(--surface-indigo-light)";
            const activeBgHover = isCoding
              ? "var(--primary-50)"
              : isSubjective
                ? "var(--assessment-subjective-surface-hover)"
                : "var(--primary-50)";
            const activeText = isCoding
              ? "var(--accent-blue-light)"
              : isSubjective
                ? "var(--assessment-subjective-fg)"
                : "var(--accent-purple)";
            const activeShadow = isCoding
              ? "0 2px 6px 0 color-mix(in srgb, var(--accent-blue-light) 18%, transparent)"
              : isSubjective
                ? "0 2px 6px 0 var(--assessment-subjective-shadow)"
                : "0 2px 6px 0 color-mix(in srgb, var(--accent-purple) 18%, transparent)";
            const activeShadowHover = isCoding
              ? "0 3px 8px 0 color-mix(in srgb, var(--accent-blue-light) 26%, transparent)"
              : isSubjective
                ? "0 3px 8px 0 var(--assessment-subjective-shadow-lg)"
                : "0 3px 8px 0 color-mix(in srgb, var(--accent-purple) 26%, transparent)";
            const borderHover = isCoding
              ? "var(--accent-blue-light)"
              : isSubjective
                ? "var(--assessment-subjective-accent-hover)"
                : "var(--accent-purple)";
            const iconName = isCoding
              ? "mdi:code-braces"
              : isSubjective
                ? "mdi:text-box-outline"
                : "mdi:clipboard-text";
            const defaultTitle =
              sectionType === "coding"
                ? "Coding"
                : sectionType === "subjective"
                  ? "Subjective"
                  : "Quiz";

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
                  backgroundColor: isActive ? activeBg : "var(--card-bg)",
                  border: `2px solid ${
                    isActive ? activeBorder : "var(--border-default)"
                  }`,
                  borderRadius: 1.5,
                  cursor: onSectionChange ? "pointer" : "default",
                  transition: "all 0.15s ease-out",
                  boxShadow: isActive
                    ? activeShadow
                    : "0 1px 2px 0 var(--surface-subtle)",
                  whiteSpace: "nowrap",
                  "&:hover": onSectionChange
                    ? {
                        borderColor: borderHover,
                        backgroundColor: isActive ? activeBgHover : "var(--surface)",
                        transform: "translateY(-1px)",
                        boxShadow: activeShadowHover,
                      }
                    : {},
                }}
              >
                <IconWrapper
                  icon={iconName}
                  size={14}
                  color={isActive ? activeText : "var(--font-secondary)"}
                />
        <Typography
          variant="caption"
          sx={{
            color: isActive ? activeText : "var(--font-secondary)",
            fontSize: { xs: "0.7rem", md: "0.75rem" },
            fontWeight: isActive ? 700 : 600,
            whiteSpace: "nowrap",
          }}
        >
          {section.title || defaultTitle}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: isActive
              ? isCoding
                ? "var(--accent-blue-light)"
                : isSubjective
                  ? "var(--assessment-subjective-count)"
                  : "var(--accent-purple)"
              : "var(--font-tertiary)",
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
            backgroundColor: "var(--neutral-100)",
            borderRadius: 0.75,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "var(--font-secondary)",
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
            borderColor: "var(--accent-indigo)",
            color: "var(--accent-indigo)",
            borderRadius: 1.5,
            px: 2.5,
            py: 1,
            fontSize: "0.875rem",
            fontWeight: 600,
            textTransform: "none",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              borderColor: "var(--accent-indigo-dark)",
              backgroundColor: "var(--surface-indigo-light)",
              transform: "translateX(-2px)",
            },
            "&:disabled": {
              borderColor: "var(--border-default)",
              color: "var(--font-tertiary)",
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
            backgroundColor: "var(--accent-indigo)",
            color: "var(--font-light)",
            borderRadius: 1.5,
            px: 3,
            py: 1,
            fontSize: "0.875rem",
            fontWeight: 600,
            textTransform: "none",
            boxShadow:
              "0 2px 8px 0 color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              backgroundColor: "var(--accent-indigo-dark)",
              boxShadow:
                "0 4px 12px 0 color-mix(in srgb, var(--accent-indigo) 45%, transparent)",
              transform: "translateX(2px)",
            },
            "&:disabled": {
              backgroundColor: "var(--border-default)",
              color: "var(--font-tertiary)",
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
