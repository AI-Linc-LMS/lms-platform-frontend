"use client";

import { Box, Paper, Typography, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import { useState, memo } from "react";
import { IconWrapper } from "@/components/common/IconWrapper";

interface QuizQuestion {
  id: string | number;
  question: string;
  answered?: boolean;
}

interface QuizQuestionListProps {
  questions: QuizQuestion[];
  currentQuestionId: string | number;
  onQuestionClick?: (questionId: string | number) => void;
}

const QuizQuestionListComponent = memo(function QuizQuestionList({
  questions,
  currentQuestionId,
  onQuestionClick,
}: QuizQuestionListProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: "#ffffff",
        borderRadius: 2,
        border: "1px solid #e5e7eb",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          borderBottom: expanded ? "1px solid #e5e7eb" : "none",
          "&:hover": {
            backgroundColor: "#f9fafb",
          },
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: "#1a1f2e",
            fontSize: "1rem",
          }}
        >
          Quiz Questions List
        </Typography>
        <IconWrapper
          icon={expanded ? "mdi:chevron-up" : "mdi:chevron-down"}
          size={20}
          color="#6b7280"
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
              background: "#f1f1f1",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#d1d5db",
              borderRadius: "3px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "#9ca3af",
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
                  borderBottom: index < questions.length - 1 ? "1px solid #e5e7eb" : "none",
                }}
              >
                <ListItemButton
                  onClick={() => onQuestionClick && onQuestionClick(question.id)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    backgroundColor: isCurrent ? "#eff6ff" : "transparent",
                    borderLeft: isCurrent ? "3px solid #6366f1" : "3px solid transparent",
                    "&:hover": {
                      backgroundColor: isCurrent ? "#dbeafe" : "#f9fafb",
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
                            color={isCurrent ? "#6366f1" : "#10b981"}
                          />
                        ) : (
                          <IconWrapper
                            icon="mdi:circle-outline"
                            size={20}
                            color={isCurrent ? "#6366f1" : "#d1d5db"}
                          />
                        )}
                        <Typography
                          sx={{
                            fontWeight: isCurrent ? 700 : 500,
                            color: isCurrent
                              ? "#1e40af"
                              : "#6b7280",
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
                        {isCurrent && (
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              backgroundColor: "#6366f1",
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

