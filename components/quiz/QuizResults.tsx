"use client";

import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Chip,
  LinearProgress,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { normalizeEncoding } from "@/lib/utils/text-utils";

export interface QuizAnswer {
  questionId: string | number;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
  options: Array<{ id: string; label: string; value: string }>;
}

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  answers: QuizAnswer[];
  onRetake?: () => void;
  onBack?: () => void;
}

export function QuizResults({
  score,
  totalQuestions,
  correctAnswers,
  answers,
  onRetake,
  onBack,
}: QuizResultsProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  const getScoreColor = () => {
    if (percentage >= 80) return "#10b981";
    if (percentage >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const getScoreLabel = () => {
    if (percentage >= 80) return "Excellent!";
    if (percentage >= 60) return "Good Job!";
    return "Keep Practicing!";
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < answers.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const currentAnswer = answers[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === answers.length - 1;

  return (
    <Box
      sx={{
        maxWidth: "1200px",
        mx: "auto",
        p: { xs: 2, sm: 3, md: 4 },
      }}
    >
      {/* Back to Course Button - Top */}
      {onBack && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            onClick={onBack}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: "none",
              fontSize: "0.9375rem",
              fontWeight: 600,
              borderColor: "#6366f1",
              color: "#6366f1",
              "&:hover": {
                borderColor: "#4f46e5",
                backgroundColor: "#6366f115",
              },
            }}
          >
            ← Back to Course
          </Button>
        </Box>
      )}

      {/* Score Summary Card */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          backgroundColor: "#ffffff",
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          textAlign: "center",
          background: `linear-gradient(135deg, ${getScoreColor()}15 0%, ${getScoreColor()}05 100%)`,
        }}
      >
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            backgroundColor: getScoreColor(),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3,
            boxShadow: `0 8px 24px ${getScoreColor()}40`,
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              color: "#ffffff",
              fontSize: { xs: "2.25rem", sm: "2.5rem" },
            }}
          >
            {percentage}%
          </Typography>
        </Box>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "#1a1f2e",
            mb: 1,
            fontSize: { xs: "1.5rem", sm: "2rem" },
          }}
        >
          {getScoreLabel()}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: "#6b7280",
            mb: 3,
          }}
        >
          You scored {correctAnswers} out of {totalQuestions} questions
          correctly
        </Typography>

        <Box sx={{ maxWidth: "400px", mx: "auto", mb: 3 }}>
          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{
              height: 12,
              borderRadius: 6,
              backgroundColor: "#e5e7eb",
              "& .MuiLinearProgress-bar": {
                backgroundColor: getScoreColor(),
                borderRadius: 6,
              },
            }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Chip
            label={`Score: ${score}/${totalQuestions}`}
            sx={{
              backgroundColor: `${getScoreColor()}20`,
              color: getScoreColor(),
              fontWeight: 600,
              fontSize: "0.875rem",
              px: 2,
            }}
          />
          <Chip
            label={`Correct: ${correctAnswers}`}
            sx={{
              backgroundColor: "#10b98120",
              color: "#10b981",
              fontWeight: 600,
              fontSize: "0.875rem",
              px: 2,
            }}
          />
          <Chip
            label={`Incorrect: ${totalQuestions - correctAnswers}`}
            sx={{
              backgroundColor: "#ef444420",
              color: "#ef4444",
              fontWeight: 600,
              fontSize: "0.875rem",
              px: 2,
            }}
          />
        </Box>
      </Paper>

      {/* Detailed Results */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          backgroundColor: "#ffffff",
          borderRadius: 3,
          border: "1px solid #e5e7eb",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "#1a1f2e",
            mb: 3,
          }}
        >
          Detailed Results
        </Typography>

        {/* Navigation Bar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
            px: { xs: 1, sm: 2 },
            py: 1.5,
            backgroundColor: "#f9fafb",
            borderRadius: 2,
            border: "1px solid #e5e7eb",
          }}
        >
          {/* Previous Button - Left */}
          <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
            {!isFirstQuestion && (
              <Button
                variant="outlined"
                onClick={handlePreviousQuestion}
                sx={{
                  borderColor: "#6366f1",
                  color: "#6366f1",
                  px: 2.5,
                  py: 1,
                  minWidth: "110px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#4f46e5",
                    backgroundColor: "#6366f115",
                  },
                }}
              >
                ← Previous
              </Button>
            )}
          </Box>

          {/* Question Counter - Middle */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "#6b7280",
                fontWeight: 600,
                fontSize: "0.9375rem",
              }}
            >
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </Typography>
          </Box>

          {/* Next Button - Right */}
          <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
            {!isLastQuestion && (
              <Button
                variant="contained"
                onClick={handleNextQuestion}
                sx={{
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  color: "#ffffff",
                  px: 3,
                  py: 1,
                  minWidth: "110px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: "none",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
                    boxShadow: "0 6px 16px rgba(99, 102, 241, 0.4)",
                    transform: "translateY(-1px)",
                  },
                  "&:active": {
                    transform: "translateY(0)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                Next →
              </Button>
            )}
          </Box>
        </Box>

        {/* Current Question Result */}
        {currentAnswer && (
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                mb: 2,
              }}
            >
              <Box
                sx={{
                  minWidth: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: currentAnswer.isCorrect
                    ? "#10b981"
                    : "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconWrapper
                  icon={currentAnswer.isCorrect ? "mdi:check" : "mdi:close"}
                  size={20}
                  color="#ffffff"
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: "#1a1f2e",
                    mb: 2,
                    fontSize: "1.125rem",
                  }}
                >
                  Question {currentQuestionIndex + 1}:{" "}
                  {currentAnswer.questionText}
                </Typography>

                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  {currentAnswer.options.map((option) => {
                    const isSelected =
                      option.value === currentAnswer.selectedAnswer;
                    const isCorrect =
                      option.value === currentAnswer.correctAnswer;

                    return (
                      <Paper
                        key={option.id}
                        elevation={0}
                        sx={{
                          p: 2,
                          border:
                            isCorrect && isSelected
                              ? "2px solid #10b981"
                              : isCorrect
                              ? "2px solid #10b981"
                              : isSelected
                              ? "2px solid #ef4444"
                              : "1px solid #e5e7eb",
                          backgroundColor:
                            isCorrect && isSelected
                              ? "#f0fdf4"
                              : isCorrect
                              ? "#f0fdf4"
                              : isSelected
                              ? "#fef2f2"
                              : "#ffffff",
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography
                          sx={{
                            color: "#1a1f2e",
                            fontWeight: isSelected || isCorrect ? 500 : 400,
                          }}
                        >
                          {option.label}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            alignItems: "center",
                          }}
                        >
                          {isCorrect && (
                            <Chip
                              label="Correct"
                              size="small"
                              sx={{
                                backgroundColor: "#10b981",
                                color: "#ffffff",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                              }}
                            />
                          )}
                          {isSelected && !isCorrect && (
                            <Chip
                              label="Your Answer"
                              size="small"
                              sx={{
                                backgroundColor: "#ef4444",
                                color: "#ffffff",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                              }}
                            />
                          )}
                          {isSelected && isCorrect && (
                            <Chip
                              label="Your Answer"
                              size="small"
                              sx={{
                                backgroundColor: "#10b981",
                                color: "#ffffff",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                              }}
                            />
                          )}
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>

                {currentAnswer.explanation && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      backgroundColor: "#f9fafb",
                      borderRadius: 2,
                      borderLeft: "4px solid #6366f1",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "#6366f1",
                        mb: 0.5,
                      }}
                    >
                      Explanation:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#4b5563",
                        lineHeight: 1.6,
                      }}
                    >
                      {normalizeEncoding(currentAnswer.explanation)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Action Buttons */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          justifyContent: "center",
          mt: 4,
          flexWrap: "wrap",
        }}
      >
        {onBack && (
          <Button
            variant="outlined"
            onClick={onBack}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontSize: "1rem",
              fontWeight: 600,
              borderColor: "#6366f1",
              color: "#6366f1",
              "&:hover": {
                borderColor: "#4f46e5",
                backgroundColor: "#6366f115",
              },
            }}
          >
            Back to Course
          </Button>
        )}
        {onRetake && (
          <Button
            variant="contained"
            onClick={onRetake}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontSize: "1rem",
              fontWeight: 600,
              backgroundColor: "#6366f1",
              "&:hover": {
                backgroundColor: "#4f46e5",
              },
            }}
          >
            Retake Quiz
          </Button>
        )}
      </Box>
    </Box>
  );
}
