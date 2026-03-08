"use client";

import { Box, Paper, Typography, TextField, Button, Chip } from "@mui/material";
import { CheckCircle } from "lucide-react";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

export interface AnswerInputAreaProps {
  currentAnswer: string;
  /** Live speech-to-text while user is speaking (shown after currentAnswer). */
  interimTranscript?: string;
  onAnswerChange: (answer: string) => void;
  onSaveAnswer: () => void;
  onPreviousQuestion: () => void;
  onNextQuestion: () => void;
  isQuestionAnswered: boolean;
  canGoPrevious: boolean;
  isLastQuestion: boolean;
  isListening?: boolean;
}

export const AnswerInputArea = memo(function AnswerInputArea({
  currentAnswer,
  interimTranscript = "",
  onAnswerChange,
  onSaveAnswer,
  onPreviousQuestion,
  onNextQuestion,
  isQuestionAnswered,
  canGoPrevious,
  isLastQuestion,
  isListening = false,
}: AnswerInputAreaProps) {
  const { t } = useTranslation("common");
  const displayValue =
    currentAnswer + (interimTranscript ? " " + interimTranscript : "");
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        backgroundColor: "#ffffff",
        borderRadius: 3,
        border: "1px solid #e5e7eb",
        borderColor: isListening ? "#6366f1" : "#e5e7eb",
        borderWidth: isListening ? 2 : 1,
        transition: "border-color 0.2s, border-width 0.2s",
      }}
    >
      {/* Clear listening state so user always knows */}
      <Box
        sx={{
          mb: 2,
          py: 1.5,
          px: 2,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          backgroundColor: isListening ? "#eef2ff" : "#f3f4f6",
          border: "1px solid",
          borderColor: isListening ? "#6366f1" : "#e5e7eb",
        }}
      >
        {isListening ? (
          <>
            <IconWrapper icon="mdi:microphone" size={24} color="#4f46e5" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#3730a3" }}>
                Microphone on — listening
              </Typography>
              <Typography variant="caption" sx={{ color: "#6366f1" }}>
                Speak your answer; your words will appear in the box below.
              </Typography>
            </Box>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                animation: "listeningPulse 1.2s ease-in-out infinite",
                "@keyframes listeningPulse": {
                  "0%, 100%": { opacity: 1, transform: "scale(1)" },
                  "50%": { opacity: 0.6, transform: "scale(1.2)" },
                },
              }}
            />
          </>
        ) : (
          <>
            <IconWrapper icon="mdi:microphone" size={24} color="#9ca3af" />
            <Typography variant="body2" sx={{ color: "#6b7280" }}>
              Microphone will listen automatically. Speak your answer and it will appear below.
            </Typography>
          </>
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
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
        value={displayValue}
        onChange={(e) => onAnswerChange(e.target.value)}
        placeholder="Type your answer here or speak naturally — your speech will appear here as you talk."
        sx={{
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#ffffff",
            color: "#1f2937",
            "& fieldset": {
              borderColor: isListening ? "#a5b4fc" : "#d1d5db",
            },
            "&:hover fieldset": {
              borderColor: isListening ? "#818cf8" : "#9ca3af",
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
            {t("mockInterview.previous")}
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

