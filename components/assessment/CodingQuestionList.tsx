"use client";

import { Box, Paper, Typography, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import { useState, memo } from "react";
import { IconWrapper } from "@/components/common/IconWrapper";

interface CodingQuestion {
  id: string | number;
  title: string;
  answered?: boolean;
}

interface CodingQuestionListProps {
  questions: CodingQuestion[];
  currentQuestionId: string | number;
  onQuestionClick?: (questionId: string | number) => void;
}

const CodingQuestionListComponent = memo(function CodingQuestionList({
  questions,
  currentQuestionId,
  onQuestionClick,
}: CodingQuestionListProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: "var(--font-light)",
        borderRadius: 2,
        border: "1px solid var(--border-default)",
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
          borderBottom: expanded ? "1px solid var(--border-default)" : "none",
          "&:hover": {
            backgroundColor: "var(--surface)",
          },
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: "var(--font-primary-dark)",
            fontSize: "1rem",
          }}
        >
          Coding Problems
        </Typography>
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
              background: "var(--neutral-100)",
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
                  borderBottom: index < questions.length - 1 ? "1px solid var(--border-default)" : "none",
                }}
              >
                <ListItemButton
                  onClick={() => onQuestionClick && onQuestionClick(question.id)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    backgroundColor: isCurrent ? "color-mix(in srgb, var(--surface-blue-light) 90%, var(--card-bg))" : "transparent",
                    "&:hover": {
                      backgroundColor: isCurrent ? "var(--surface-blue-light)" : "var(--surface)",
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
                            color="var(--course-cta)"
                          />
                        ) : (
                          <IconWrapper
                            icon="mdi:code-braces"
                            size={20}
                            color={isCurrent ? "var(--accent-blue-light)" : "var(--border-light)"}
                          />
                        )}
                        <Typography
                          sx={{
                            fontWeight: isCurrent ? 600 : 400,
                            color: isCurrent
                              ? "color-mix(in srgb, var(--accent-blue) 82%, var(--font-dark))"
                              : "var(--font-secondary)",
                            fontSize: "0.875rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                          }}
                        >
                          {question.title || `Problem ${index + 1}`}
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

export { CodingQuestionListComponent as CodingQuestionList };

