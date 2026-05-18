"use client";

import { Box, Paper, Typography, TextField, Button, Chip, Tooltip } from "@mui/material";
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
  /**
   * Pause-detection progress in the range [0, 1]. Drives the visible "Interviewer is
   * waiting" bar that fills while the candidate is silent. 0 = candidate is currently
   * speaking (or no silence yet), 1 = fully expired (about to advance). The parent
   * computes this from elapsed-silence vs the wait threshold.
   */
  pauseProgress?: number;
  /**
   * When false, hide the live-transcript textarea and the "Your Answer" header. The
   * candidate's STT stream still runs in the background (for the final evaluation
   * transcript) but isn't echoed back on screen — matches the "show questions, not the
   * raw user transcript" UX. Falls back to showing the textarea when `typingFallback`
   * is true, since typing is the only path when STT is dead.
   */
  showAnswerTextarea?: boolean;
  /**
   * Numbered list of questions the interviewer has asked so far. Rendered in place of
   * the textarea when `showAnswerTextarea` is false. Each item is one question; the
   * most recent appears at the bottom.
   */
  questionHistory?: Array<{ id: number; question_text: string }>;
  submitDisabled?: boolean;
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
  pauseProgress = 0,
  showAnswerTextarea = true,
  questionHistory = [],
  submitDisabled = false,
}: AnswerInputAreaProps) {
  const { t } = useTranslation("common");
  const displayValue =
    currentAnswer + (interimTranscript ? " " + interimTranscript : "");
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
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
          mb: 1.25,
          py: 1,
          px: 1.5,
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
                {showAnswerTextarea
                  ? "Speak your answer; your words will appear in the box below. You can also type if you prefer."
                  : "Speak naturally. Your answer is being recorded for evaluation."}
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

      {/* Two render modes for the answer region:
          - Legacy / typing-fallback: show "Your Answer" header + multiline textarea
            so the candidate can see and edit what STT is producing (or type it themselves
            when STT is broken).
          - Hidden-answer mode (the new dynamic-interview default): replace both with a
            minimal numbered list of interviewer questions, like a real interview's
            "conversation so far" view. The candidate's transcript still streams in the
            background to the evaluator — it's just not echoed on screen. */}
      {showAnswerTextarea || typingFallback ? (
        <>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}
          >
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
                  borderColor: isListening
                    ? "var(--primary-200)"
                    : "var(--border-light)",
                },
                "&:hover fieldset": {
                  borderColor: isListening
                    ? "var(--accent-indigo)"
                    : "var(--font-tertiary)",
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
        </>
      ) : (
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 1,
            }}
          >
            <IconWrapper
              icon="mdi:comment-question-outline"
              size={20}
              color="var(--font-tertiary)"
            />
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: "var(--font-primary-dark)",
                letterSpacing: "0.02em",
                textTransform: "uppercase",
                fontSize: "0.75rem",
              }}
            >
              Conversation so far
            </Typography>
            <Chip
              label={questionHistory.length}
              size="small"
              sx={{
                height: 18,
                fontSize: "0.7rem",
                fontWeight: 700,
                backgroundColor: "var(--surface)",
                color: "var(--font-secondary)",
              }}
            />
          </Box>
          {questionHistory.length === 0 ? (
            <Box
              sx={{
                py: 3,
                textAlign: "center",
                color: "var(--font-tertiary)",
                fontStyle: "italic",
              }}
            >
              <Typography variant="body2">
                The interview hasn&apos;t started yet — the first question will appear here.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                maxHeight: 200,
                overflowY: "auto",
                pr: 1,
                // Subtle styling for the scroll thumb so the panel reads as scrollable.
                "&::-webkit-scrollbar": { width: 6 },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "var(--border-light)",
                  borderRadius: 3,
                },
              }}
            >
              {questionHistory.map((q, idx) => {
                const isCurrent = idx === questionHistory.length - 1;
                return (
                  <Box
                    key={q.id}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: isCurrent
                        ? "var(--surface-indigo-light)"
                        : "var(--surface)",
                      border: "1px solid",
                      borderColor: isCurrent
                        ? "var(--accent-indigo)"
                        : "var(--border-default)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Box
                      sx={{
                        flexShrink: 0,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        backgroundColor: isCurrent
                          ? "var(--accent-indigo)"
                          : "var(--border-default)",
                        color: isCurrent
                          ? "var(--font-light)"
                          : "var(--font-secondary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {idx + 1}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        color: isCurrent
                          ? "var(--font-primary-dark)"
                          : "var(--font-secondary)",
                        fontWeight: isCurrent ? 500 : 400,
                        lineHeight: 1.55,
                      }}
                    >
                      {q.question_text}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}
      {hideNavigationButtons ? (
        // Dynamic interview mode. Two stacked rows:
        //   1. Live status pill ("Listening…" while speaking, "Interviewer is waiting"
        //      while paused), plus the explicit fallback button (Follow up / Submit).
        //   2. Visible progress bar that fills during silence so the candidate SEES
        //      the wait elapsing and can interrupt by speaking again (which resets it).
        // The progress bar replaces the old invisible silence detector — candidates
        // were thinking and getting auto-advanced with no warning. Now the pause is
        // a deliberate, visible state.
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box
            sx={{
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
                    : "var(--accent-indigo)",
                  animation: isListening
                    ? "convStatusPulse 1.2s ease-in-out infinite"
                    : pauseProgress > 0
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
                  (isListening
                    ? "Listening…"
                    : "Speak naturally — pause when you're done and the interviewer will follow up.")}
              </Typography>
            </Box>
            <Tooltip
              title={
                isLastQuestion
                  ? submitDisabled
                    ? "Available once the interviewer finishes their closing feedback."
                    : "Finish the interview and view your evaluation."
                  : "Tap if the interviewer doesn't pick up that you've finished. Asks them to move on to the next question right away."
              }
              arrow
              placement="top"
            >
              <span>
                <Button
                  variant="contained"
                  onClick={onNextQuestion}
                  disabled={
                    (isLastQuestion && submitDisabled) ||
                    (!isLastQuestion && !currentAnswer.trim())
                  }
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
              </span>
            </Tooltip>
          </Box>
          {/* Pause progress bar. Width animates from 0% → 100% based on the parent's
              pauseProgress prop. When the candidate resumes speaking, the parent sets
              pauseProgress back to 0 — the bar visibly collapses, signalling "you have
              the floor again". When it reaches 100% the parent auto-advances. */}
          <Box
            sx={{
              position: "relative",
              height: 6,
              borderRadius: 999,
              backgroundColor: "var(--surface)",
              overflow: "hidden",
              border: "1px solid var(--border-default)",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                width: `${Math.min(100, Math.max(0, pauseProgress * 100))}%`,
                background:
                  pauseProgress > 0
                    ? "linear-gradient(90deg, var(--accent-indigo) 0%, var(--accent-indigo-dark) 100%)"
                    : "var(--ats-success)",
                opacity: pauseProgress > 0 || isListening ? 1 : 0.25,
                // Smooth growth during silence; instant collapse when the candidate
                // resumes speaking (transition off when pauseProgress drops to 0 so the
                // reset isn't laggy).
                transition:
                  pauseProgress > 0
                    ? "width 150ms linear"
                    : "width 0ms linear, opacity 200ms ease",
              }}
            />
          </Box>
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
          disabled={isLastQuestion && submitDisabled}
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

