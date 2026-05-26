"use client";

import { Box, Paper, Typography, Tabs, Tab } from "@mui/material";
import { CheckCircle } from "lucide-react";
import { memo } from "react";

interface Question {
  id: number;
  question_text?: string;
  question?: string;
}

interface QuestionListSidebarProps {
  questions: Question[];
  currentQuestionIndex: number;
  responses: Array<{ question_id: number; answer: string }>;
  onQuestionClick: (index: number) => void;
}

export const QuestionListSidebar = memo(function QuestionListSidebar({
  questions,
  currentQuestionIndex,
  responses,
  onQuestionClick,
}: QuestionListSidebarProps) {
  return (
    <Box
      sx={{
        width: 400,
        display: "flex",
        flexDirection: "column",
        borderLeft: "1px solid var(--border-default)",
        backgroundColor: "var(--card-bg)",
      }}
    >
      {/* Tabs */}
      <Box
        sx={{
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <Tabs
          value={0}
          sx={{
            "& .MuiTab-root": {
              color: "var(--font-secondary)",
              textTransform: "none",
              fontWeight: 600,
              "&.Mui-selected": {
                color: "var(--primary-700)",
              },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "var(--primary-500)",
            },
          }}
        >
          <Tab label="Question List" />
        </Tabs>
      </Box>

      {/* Question List */}
      <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {questions.map((question, index) => {
            const isAnswered = responses.some(
              (r) => r.question_id === question.id
            );
            const isCurrent = index === currentQuestionIndex;

            return (
              <Paper
                key={question.id}
                elevation={0}
                onClick={() => onQuestionClick(index)}
                sx={{
                  p: 2,
                  backgroundColor: isCurrent ? "var(--primary-500)" : "var(--card-bg)",
                  borderRadius: 2,
                  cursor: "pointer",
                  border: isCurrent
                    ? "2px solid var(--primary-500)"
                    : "1px solid var(--border-default)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: isCurrent ? "var(--primary-600)" : "var(--surface)",
                    borderColor: "var(--primary-500)",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: isCurrent ? "var(--font-light)" : "var(--font-secondary)",
                      minWidth: 40,
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: isCurrent ? "var(--font-light)" : "var(--font-primary)",
                        mb: 1,
                      }}
                    >
                      {question.question_text || question.question}
                    </Typography>
                    {isAnswered && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          mt: 1,
                        }}
                      >
                        <CheckCircle size={14} color="var(--success-500, #10b981)" />
                        <Typography
                          variant="caption"
                          sx={{
                            color: "var(--success-500, #10b981)",
                            fontSize: "0.75rem",
                          }}
                        >
                          Answer provided
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
});
