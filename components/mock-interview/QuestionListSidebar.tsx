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
        borderLeft: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
      }}
    >
      {/* Tabs */}
      <Box
        sx={{
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Tabs
          value={0}
          sx={{
            "& .MuiTab-root": {
              color: "#6b7280",
              textTransform: "none",
              fontWeight: 600,
              "&.Mui-selected": {
                color: "#6366f1",
              },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#6366f1",
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
                  backgroundColor: isCurrent ? "#6366f1" : "#ffffff",
                  borderRadius: 2,
                  cursor: "pointer",
                  border: isCurrent
                    ? "2px solid #6366f1"
                    : "1px solid #e5e7eb",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: isCurrent ? "#6366f1" : "#f9fafb",
                    borderColor: "#6366f1",
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
                      color: isCurrent ? "#ffffff" : "#6b7280",
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
                        color: isCurrent ? "#ffffff" : "#111827",
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
                        <CheckCircle size={14} color="#10b981" />
                        <Typography
                          variant="caption"
                          sx={{ color: "#10b981", fontSize: "0.75rem" }}
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

