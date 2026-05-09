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
  /** True when speech recognition has failed and user must type. */
  typingFallback?: boolean;
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
  typingFallback = false,
}: AnswerInputAreaProps) {
  const { t } = useTranslation("common");
  const displayValue =
    currentAnswer + (interimTranscript ? " " + interimTranscript : "");
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        backgroundColor: "var(--card-bg)",
        borderRadius: 3,
        border: "1px solid var(--border-default)",
        borderColor: isListening ? "var(--accent-indigo)" : "var(--border-default)",
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
          backgroundColor: typingFallback
            ? "var(--warning-100)"
            : isListening
              ? "var(--surface-indigo-light)"
              : "var(--surface)",
          border: "1px solid",
          borderColor: typingFallback
            ? "var(--warning-500)"
            : isListening
              ? "var(--accent-indigo)"
              : "var(--border-default)",
        }}
      >
        {typingFallback ? (
          <>
            <IconWrapper icon="mdi:keyboard" size={24} color="var(--warning-500)" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "var(--warning-500)" }}>
                Type your answer
              </Typography>
              <Typography variant="caption" sx={{ color: "var(--warning-500)" }}>
                Speech recognition isn&apos;t available — type your response in the box below. Your answer will be saved normally.
              </Typography>
            </Box>
          </>
        ) : isListening ? (
          <>
            <IconWrapper icon="mdi:microphone" size={24} color="var(--accent-indigo)" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "var(--accent-indigo-dark)" }}>
                Microphone on — listening
              </Typography>
              <Typography variant="caption" sx={{ color: "var(--accent-indigo)" }}>
                Speak your answer; your words will appear in the box below. You can also type if you prefer.
              </Typography>
            </Box>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "var(--ats-success)",
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
            <IconWrapper icon="mdi:microphone" size={24} color="var(--font-tertiary)" />
            <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
              Microphone will listen automatically. Speak your answer or type it below.
            </Typography>
          </>
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, flex: 1, color: "var(--font-primary-dark)" }}
        >
          Your Answer
        </Typography>
        {isQuestionAnswered && (
          <Chip
            icon={<CheckCircle size={16} />}
            label="Answered"
            size="small"
            sx={{
              backgroundColor: "var(--ats-success)",
              color: "var(--font-light)",
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
            backgroundColor: "var(--card-bg)",
            color: "var(--font-primary-dark)",
            "& fieldset": {
              borderColor: isListening ? "var(--primary-200)" : "var(--border-light)",
            },
            "&:hover fieldset": {
              borderColor: isListening ? "var(--accent-indigo)" : "var(--font-tertiary)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "var(--accent-indigo)",
            },
          },
          "& .MuiInputBase-input": {
            color: "var(--font-primary-dark)",
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
              borderColor: "var(--border-light)",
              color: "var(--font-muted)",
              textTransform: "none",
              "&:hover": {
                borderColor: "var(--font-tertiary)",
                backgroundColor: "var(--surface)",
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
              borderColor: "var(--border-light)",
              color: "var(--font-muted)",
              textTransform: "none",
              "&:hover": {
                borderColor: "var(--font-tertiary)",
                backgroundColor: "var(--surface)",
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
            backgroundColor: isLastQuestion ? "var(--ats-success)" : "var(--accent-indigo)",
            color: "var(--font-light)",
            textTransform: "none",
            "&:hover": {
              backgroundColor: isLastQuestion ? "var(--ats-success-muted)" : "var(--accent-indigo-dark)",
            },
          }}
        >
          {isLastQuestion ? "Submit Interview" : "Next Question"}
        </Button>
      </Box>
    </Paper>
  );
});

