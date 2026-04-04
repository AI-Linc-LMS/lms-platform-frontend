"use client";

import { Box, Paper, Typography, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import { useState, memo } from "react";
import { IconWrapper } from "@/components/common/IconWrapper";

/** Check if string contains HTML tags so we can render with dangerouslySetInnerHTML */
function hasHtml(str: unknown): str is string {
  return typeof str === "string" && /<[a-z][\s\S]*>/i.test(str);
}

interface QuizQuestion {
  id: string | number;
  question: string;
  answered?: boolean;
}

interface QuizQuestionListProps {
  questions: QuizQuestion[];
  currentQuestionId: string | number;
  onQuestionClick?: (questionId: string | number) => void;
  /** Sidebar header (default: Quiz Questions List) */
  listTitle?: string;
  /** Optional one-line hint under the title (e.g. subjective navigation) */
  listSubtitle?: string;
  /** Visual accent for current row / icons */
  variant?: "quiz" | "subjective";
}

/** Colors from app/globals.css */
const VARIANT_STYLES = {
  quiz: {
    currentBg: "var(--surface-indigo-light)",
    currentHover: "var(--surface-blue-light)",
    accent: "var(--accent-indigo)",
    answered: "var(--success-500)",
    muted: "var(--font-secondary)",
    currentText: "var(--accent-indigo-dark)",
  },
  subjective: {
    currentBg: "var(--assessment-subjective-surface-active)",
    currentHover: "var(--assessment-subjective-surface-hover)",
    accent: "var(--assessment-subjective-accent)",
    answered: "var(--assessment-subjective-answered)",
    muted: "var(--assessment-subjective-muted)",
    currentText: "var(--assessment-subjective-fg-strong)",
  },
} as const;

const QuizQuestionListComponent = memo(function QuizQuestionList({
  questions,
  currentQuestionId,
  onQuestionClick,
  listTitle = "Quiz Questions List",
  listSubtitle,
  variant = "quiz",
}: QuizQuestionListProps) {
  const c = VARIANT_STYLES[variant];
  const [expanded, setExpanded] = useState(true);

  return (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: "var(--card-bg)",
        borderRadius: 2,
        border: "1px solid var(--border-default)",
        overflow: "hidden",
        boxShadow:
          variant === "subjective"
            ? "0 1px 3px 0 var(--assessment-subjective-shadow)"
            : "none",
      }}
    >
      {/* Header */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          p: 2,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
          cursor: "pointer",
          borderBottom: expanded ? "1px solid var(--border-default)" : "none",
          backgroundColor:
            variant === "subjective"
              ? "var(--assessment-subjective-header-strip-bg)"
              : "transparent",
          "&:hover": {
            backgroundColor:
              variant === "subjective"
                ? "var(--assessment-subjective-surface-hover)"
                : "var(--surface)",
          },
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "var(--font-primary-dark)",
              fontSize: "1rem",
              lineHeight: 1.3,
            }}
          >
            {listTitle}
          </Typography>
          {listSubtitle ? (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 0.5,
                color:
                  variant === "subjective"
                    ? "var(--assessment-subjective-muted)"
                    : "var(--font-secondary)",
                fontSize: "0.75rem",
                lineHeight: 1.4,
              }}
            >
              {listSubtitle}
            </Typography>
          ) : null}
        </Box>
        <IconWrapper
          icon={expanded ? "mdi:chevron-up" : "mdi:chevron-down"}
          size={20}
          color="var(--font-secondary)"
        />
      </Box>

      {/* Question List */}
      {expanded && (
        <List 
          sx={{ 
            p: 0, 
            maxHeight: { xs: "300px", md: "500px" }, 
            overflowY: "auto",
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              background: "var(--surface)",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "var(--border-light)",
              borderRadius: "3px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "var(--font-tertiary)",
            },
          }}
        >
          {questions.map((question, index) => {
            const isCurrent = question.id === currentQuestionId;
            const isAnswered = question.answered;

            return (
              <ListItem
                key={question.id}
                disablePadding
                sx={{
                  borderBottom:
                    index < questions.length - 1
                      ? "1px solid var(--border-default)"
                      : "none",
                }}
              >
                <ListItemButton
                  onClick={() => onQuestionClick && onQuestionClick(question.id)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    backgroundColor: isCurrent ? c.currentBg : "transparent",
                    borderLeft: isCurrent ? `3px solid ${c.accent}` : "3px solid transparent",
                    "&:hover": {
                      backgroundColor: isCurrent ? c.currentHover : "#f9fafb",
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                        }}
                      >
                        {isAnswered ? (
                          <IconWrapper
                            icon="mdi:check-circle"
                            size={20}
                            color={isCurrent ? c.accent : c.answered}
                          />
                        ) : (
                          <IconWrapper
                            icon="mdi:circle-outline"
                            size={20}
                            color={isCurrent ? c.accent : "var(--border-light)"}
                          />
                        )}
                        {hasHtml(question.question) ? (
                          <Box
                            component="span"
                            sx={{
                              fontWeight: isCurrent ? 700 : 500,
                              color: isCurrent ? c.currentText : c.muted,
                              fontSize: "0.875rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1,
                              lineHeight: 1.5,
                              "& p": { margin: 0, display: "inline" },
                              "& br": { display: "none" },
                            }}
                            dangerouslySetInnerHTML={{
                              __html: question.question || `Quiz question ${index + 1}`,
                            }}
                          />
                        ) : (
                          <Typography
                            sx={{
                              fontWeight: isCurrent ? 700 : 500,
                              color: isCurrent
                                ? c.currentText
                                : c.muted,
                              fontSize: "0.875rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1,
                              lineHeight: 1.5,
                            }}
                          >
                            {question.question || `Quiz question ${index + 1}`}
                          </Typography>
                        )}
                        {isCurrent && (
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              backgroundColor: c.accent,
                              ml: 0.5,
                            }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      )}
    </Paper>
  );
}, (prevProps, nextProps) => {
  // If current question changed, we MUST re-render (navigation)
  if (prevProps.currentQuestionId !== nextProps.currentQuestionId) return false;
  if (prevProps.listTitle !== nextProps.listTitle) return false;
  if (prevProps.listSubtitle !== nextProps.listSubtitle) return false;
  if (prevProps.variant !== nextProps.variant) return false;

  // If questions array length changed, re-render
  if (prevProps.questions.length !== nextProps.questions.length) return false;
  
  // Only check if the current question's answered status changed (optimized)
  const prevCurrent = prevProps.questions.find(q => q.id === prevProps.currentQuestionId);
  const nextCurrent = nextProps.questions.find(q => q.id === nextProps.currentQuestionId);
  if (prevCurrent?.answered !== nextCurrent?.answered) return false;
  
  // Check if any question's answered status changed (but only for visible questions)
  // This is a lighter check than filtering all questions
  for (let i = 0; i < Math.min(prevProps.questions.length, nextProps.questions.length); i++) {
    if (prevProps.questions[i]?.answered !== nextProps.questions[i]?.answered) {
      return false; // Re-render if answered status changed
    }
  }
  
  return true; // Skip re-render
});

// Export as named export for barrel file compatibility
export { QuizQuestionListComponent as QuizQuestionList };

