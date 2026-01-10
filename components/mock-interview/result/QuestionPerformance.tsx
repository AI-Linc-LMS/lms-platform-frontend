"use client";

import {
  Paper,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { memo } from "react";

interface Question {
  id: number;
  type: string;
  question_text: string;
  expected_key_points: string[];
}

interface QuestionScore {
  score: number;
  max_score: number;
  percentage: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

interface QuestionPerformanceProps {
  questions: Question[];
  question_scores: Record<string, QuestionScore>;
  expandedQuestion: number | false;
  onQuestionToggle: (id: number) => void;
  getScoreColor: (percentage: number) => { bg: string; color: string; main: string };
}

const QuestionPerformanceComponent = ({
  questions,
  question_scores,
  expandedQuestion,
  onQuestionToggle,
  getScoreColor,
}: QuestionPerformanceProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid #e5e7eb",
        mb: 4,
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
        Questions & Performance
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {questions.map((question, index) => {
          const questionScore = question_scores[question.id];
          const percentage = questionScore?.percentage || 0;
          const scoreColor = getScoreColor(percentage);

          return (
            <Accordion
              key={question.id}
              expanded={expandedQuestion === question.id}
              onChange={() => onQuestionToggle(question.id)}
              sx={{
                borderRadius: 2,
                border: "1px solid #e5e7eb",
                "&:before": { display: "none" },
                boxShadow: "none",
              }}
            >
              <AccordionSummary
                expandIcon={<IconWrapper icon="mdi:chevron-down" size={24} />}
                sx={{ "&:hover": { backgroundColor: "#f9fafb" } }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: scoreColor.bg,
                      color: scoreColor.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Box sx={{ flex: 1, mr: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {question.question_text}
                      </Typography>
                      <Chip
                        label={question.type}
                        size="small"
                        sx={{
                          backgroundColor:
                            question.type === "practical" ? "#dbeafe" : "#f3f4f6",
                          color: question.type === "practical" ? "#1e40af" : "#374151",
                          fontSize: "0.7rem",
                          height: 20,
                        }}
                      />
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          flex: 1,
                          height: 8,
                          borderRadius: 1,
                          backgroundColor: "#f3f4f6",
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: scoreColor.main,
                            borderRadius: 1,
                          },
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: scoreColor.main, minWidth: 80 }}
                      >
                        {questionScore?.score || 0}/{questionScore?.max_score || 0} (
                        {percentage}%)
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Divider sx={{ mb: 3 }} />

                {/* Feedback */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, mb: 1, color: "#1f2937" }}
                  >
                    Feedback
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      backgroundColor: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: "#4b5563" }}>
                      {questionScore?.feedback || "No feedback available"}
                    </Typography>
                  </Paper>
                </Box>

                {/* Strengths */}
                {questionScore?.strengths && questionScore.strengths.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        mb: 1,
                        color: "#1f2937",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <IconWrapper icon="mdi:check-circle" size={18} color="#10b981" />
                      Strengths
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {questionScore.strengths.map((strength, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1,
                            p: 1.5,
                            backgroundColor: "#f0fdf4",
                            borderRadius: 2,
                            border: "1px solid #bbf7d0",
                          }}
                        >
                          <IconWrapper
                            icon="mdi:arrow-right-circle"
                            size={18}
                            color="#16a34a"
                          />
                          <Typography variant="body2" sx={{ color: "#15803d" }}>
                            {strength}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Improvements */}
                {questionScore?.improvements && questionScore.improvements.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        mb: 1,
                        color: "#1f2937",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <IconWrapper icon="mdi:lightbulb-on" size={18} color="#f59e0b" />
                      Areas for Improvement
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {questionScore.improvements.map((improvement, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1,
                            p: 1.5,
                            backgroundColor: "#fef3c7",
                            borderRadius: 2,
                            border: "1px solid #fde68a",
                          }}
                        >
                          <IconWrapper
                            icon="mdi:arrow-right-circle"
                            size={18}
                            color="#d97706"
                          />
                          <Typography variant="body2" sx={{ color: "#b45309" }}>
                            {improvement}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Expected Key Points */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, mb: 1, color: "#1f2937" }}
                  >
                    Expected Key Points
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    {question.expected_key_points.map((point, idx) => (
                      <Box
                        key={idx}
                        sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
                      >
                        <IconWrapper icon="mdi:circle-small" size={18} color="#6b7280" />
                        <Typography variant="body2" sx={{ color: "#6b7280" }}>
                          {point}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Paper>
  );
};

export const QuestionPerformance = memo(QuestionPerformanceComponent);
QuestionPerformance.displayName = "QuestionPerformance";

