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
                    "&:hover": {
                      backgroundColor: "#f9fafb",
                    },
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
                            color="#374151"
                          />
                        ) : (
                          <IconWrapper
                            icon="mdi:circle-outline"
                            size={20}
                            color="#d1d5db"
                          />
                        )}
                        <Typography
                          sx={{
                            fontWeight: isCurrent ? 600 : 400,
                            color: isCurrent
                              ? "#1a1f2e"
                              : "#6b7280",
                            fontSize: "0.875rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                          }}
                        >
                          {question.question || `Quiz question ${index + 1}`}
                        </Typography>
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
  // Only re-render if current question changed or answered status changed
  if (prevProps.currentQuestionId !== nextProps.currentQuestionId) return false;
  if (prevProps.questions.length !== nextProps.questions.length) return false;
  
  // Check if answered count changed
  const prevAnswered = prevProps.questions.filter(q => q.answered).length;
  const nextAnswered = nextProps.questions.filter(q => q.answered).length;
  if (prevAnswered !== nextAnswered) return false;
  
  return true; // Skip re-render
});

// Export as named export for barrel file compatibility
export { QuizQuestionListComponent as QuizQuestionList };

