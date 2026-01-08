"use client";

import { Box, Paper, Typography, TextField, Button, Chip } from "@mui/material";
import { CheckCircle } from "lucide-react";
import { memo } from "react";

interface AnswerInputAreaProps {
  currentAnswer: string;
  onAnswerChange: (answer: string) => void;
  onSaveAnswer: () => void;
  onPreviousQuestion: () => void;
  onNextQuestion: () => void;
  isQuestionAnswered: boolean;
  canGoPrevious: boolean;
  isLastQuestion: boolean;
}

export const AnswerInputArea = memo(function AnswerInputArea({
  currentAnswer,
  onAnswerChange,
  onSaveAnswer,
  onPreviousQuestion,
  onNextQuestion,
  isQuestionAnswered,
  canGoPrevious,
  isLastQuestion,
}: AnswerInputAreaProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        backgroundColor: "#ffffff",
        borderRadius: 3,
        border: "1px solid #e5e7eb",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, flex: 1, color: "#111827" }}
        >
          Your Answer
        </Typography>
        {isQuestionAnswered && (
          <Chip
            icon={<CheckCircle size={16} />}
            label="Answered"
            size="small"
            sx={{
              backgroundColor: "#10b981",
              color: "#ffffff",
            }}
          />
        )}
      </Box>
      <TextField
        fullWidth
        multiline
        rows={6}
        value={currentAnswer}
        onChange={(e) => onAnswerChange(e.target.value)}
        placeholder="Type your answer here or speak naturally - your speech will be automatically transcribed..."
        sx={{
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#ffffff",
            color: "#1f2937",
            "& fieldset": {
              borderColor: "#d1d5db",
            },
            "&:hover fieldset": {
              borderColor: "#9ca3af",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#6366f1",
            },
          },
          "& .MuiInputBase-input": {
            color: "#1f2937",
          },
        }}
      />
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mt: 2,
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onPreviousQuestion}
            disabled={!canGoPrevious}
            sx={{
              borderColor: "#d1d5db",
              color: "#374151",
              textTransform: "none",
              "&:hover": {
                borderColor: "#9ca3af",
                backgroundColor: "#f9fafb",
              },
            }}
          >
            Previous
          </Button>
          <Button
            variant="outlined"
            onClick={onSaveAnswer}
            disabled={!currentAnswer}
            sx={{
              borderColor: "#d1d5db",
              color: "#374151",
              textTransform: "none",
              "&:hover": {
                borderColor: "#9ca3af",
                backgroundColor: "#f9fafb",
              },
            }}
          >
            Save Answer
          </Button>
        </Box>
        <Button
          variant="contained"
          onClick={onNextQuestion}
          sx={{
            backgroundColor: isLastQuestion ? "#10b981" : "#6366f1",
            color: "#ffffff",
            textTransform: "none",
            "&:hover": {
              backgroundColor: isLastQuestion ? "#059669" : "#4f46e5",
            },
          }}
        >
          {isLastQuestion ? "Submit Interview" : "Next Question"}
        </Button>
      </Box>
    </Paper>
  );
});

