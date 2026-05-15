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
  /**
   * When true, the Previous/Save/Next buttons are hidden — the parent is driving the
   * conversation via silence-based auto-advance (ChatGPT voice-mode style) and an explicit
   * Next button would just confuse the user. A subtle status hint replaces them.
   */
  hideNavigationButtons?: boolean;
  /**
   * Optional status text shown in place of the navigation buttons when hideNavigationButtons
   * is true (e.g., "Listening…", "Moving on…").
   */
  conversationStatus?: string;
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
  hideNavigationButtons = false,
  conversationStatus,
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
      {hideNavigationButtons ? (
        // Silence-driven mode is the PRIMARY way to advance, but speech recognition isn't
        // perfect — sometimes the candidate finishes and the silence threshold doesn't fire
        // (e.g., audio level still bouncing from background noise). We keep a single
        // explicit button as a manual fallback so the candidate can always advance even when
        // auto-detect misses.
        <Box
          sx={{
            mt: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            minHeight: 36,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: isListening
                  ? "var(--ats-success)"
                  : "var(--font-tertiary)",
                animation: isListening
                  ? "convStatusPulse 1.2s ease-in-out infinite"
                  : undefined,
                "@keyframes convStatusPulse": {
                  "0%, 100%": { opacity: 1, transform: "scale(1)" },
                  "50%": { opacity: 0.5, transform: "scale(1.3)" },
                },
              }}
            />
            <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
              {conversationStatus ||
                "Speak naturally — pause when you're done and the interviewer will follow up."}
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={onNextQuestion}
            // For mid-interview "Follow up" turns we require some answer text before
            // letting the candidate skip. For the FINAL action ("Submit Interview" — fired
            // either after the last question OR after the closing remark) we always allow
            // the click: the candidate may have nothing to say to a thank-you, and we
            // don't want to trap them in a disabled-button limbo.
            disabled={!isLastQuestion && !currentAnswer.trim()}
            sx={{
              backgroundColor: isLastQuestion
                ? "var(--ats-success)"
                : "var(--accent-indigo)",
              color: "var(--font-light)",
              textTransform: "none",
              fontWeight: 600,
              px: 2.5,
              py: 0.75,
              "&:hover": {
                backgroundColor: isLastQuestion
                  ? "var(--ats-success-muted)"
                  : "var(--accent-indigo-dark)",
              },
              "&.Mui-disabled": {
                backgroundColor: "var(--surface)",
                color: "var(--font-tertiary)",
              },
            }}
          >
            {isLastQuestion ? "Submit Interview" : "Follow up"}
          </Button>
        </Box>
      ) : (
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
      )}
    </Paper>
  );
});

