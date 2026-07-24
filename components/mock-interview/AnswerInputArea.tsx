"use client";

import { Box, Paper, Typography, TextField, Button, Chip, Tooltip, CircularProgress } from "@mui/material";
import { CheckCircle } from "lucide-react";
import { memo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { PauseProgressBar } from "./PauseProgressBar";
import { MicWaveform } from "./MicWaveform";

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
   * When true, the Previous/Save/Next buttons are hidden - the parent is driving the
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
   * Pause-detection progress source - a ref pointing to a number in [0, 1]. The PauseProgressBar
   * subcomponent reads this every animation frame and updates its DOM imperatively, so the
   * parent never has to setState/re-render to drive the bar. The parent mutates the ref
   * directly inside the silence-detector poll.
   */
  pauseProgressRef?: { current: number };
  /**
   * When false, hide the live-transcript textarea and the "Your Answer" header. The
   * candidate's STT stream still runs in the background (for the final evaluation
   * transcript) but isn't echoed back on screen - matches the "show questions, not the
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
  /** True while waiting for the next question to load (disables follow-up to avoid double taps). */
  isFetchingNext?: boolean;
  submitDisabled?: boolean;
  /**
   * When set, the conversation-so-far panel scrolls this specific question into view
   * (instead of just snapping to the latest). Used by the "repeat question N" voice
   * command so the candidate sees which past question the AI is re-speaking.
   */
  focusedHistoryQuestionId?: number | null;
  /**
   * Live 0..1 microphone-loudness ref (updated every frame by the take page's Web Audio
   * analyser). Drives the MicWaveform so the candidate gets a real "you're being heard"
   * signal that grows with their voice.
   */
  micLevelRef?: { current: number };
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
  pauseProgressRef,
  showAnswerTextarea = true,
  questionHistory = [],
  isFetchingNext = false,
  submitDisabled = false,
  focusedHistoryQuestionId = null,
  micLevelRef,
}: AnswerInputAreaProps) {
  const { t } = useTranslation("common");
  const displayValue =
    currentAnswer + (interimTranscript ? " " + interimTranscript : "");
  const conversationScrollRef = useRef<HTMLDivElement | null>(null);
  const questionRowRefs = useRef<Map<number, HTMLElement>>(new Map());
  useEffect(() => {
    const el = conversationScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [questionHistory.length]);
  useEffect(() => {
    if (focusedHistoryQuestionId === null) return;
    const node = questionRowRefs.current.get(focusedHistoryQuestionId);
    if (!node) return;
    // Smooth scroll the focused past-question into view so the candidate sees which
    // question the AI is re-speaking. block: "center" keeps it visually anchored.
    node.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusedHistoryQuestionId]);
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
                Speech recognition isn&apos;t available - type your response in the box below. Your answer will be saved normally.
              </Typography>
            </Box>
          </>
        ) : isListening ? (
          <>
            <IconWrapper icon="mdi:microphone" size={24} color="var(--accent-indigo)" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "var(--accent-indigo-dark)" }}>
                Listening
              </Typography>
              <Typography variant="caption" sx={{ color: "var(--accent-indigo)" }}>
                {showAnswerTextarea
                  ? "Speak your answer; your words will appear in the box below. You can also type if you prefer."
                  : "Speak naturally - your answer is being recorded."}
              </Typography>
            </Box>
            {/* Small pulsing presence dot only. The loudness-reactive waveform lives once,
                in the conversation-status row below, so the candidate sees a single wave. */}
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
            background to the evaluator - it's just not echoed on screen. */}
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
            placeholder="Type your answer here or speak naturally - your speech will appear here as you talk."
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
                The interview hasn&apos;t started yet - the first question will appear here.
              </Typography>
            </Box>
          ) : (
            <Box
              ref={conversationScrollRef}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                maxHeight: 150,
                overflowY: "auto",
                pr: 1,
                scrollBehavior: "smooth",
                "&::-webkit-scrollbar": { width: 6 },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "var(--border-light)",
                  borderRadius: 3,
                },
              }}
            >
              {/* Render only the last 2 turns so the video tiles never get squeezed as the
                  conversation grows. We slice for DISPLAY only - the full `questionHistory`
                  is kept intact above so the count chip and the "repeat question N" voice
                  lookup (which indexes the full timeline) stay correct. `realIdx` recovers
                  each row's true 1-based position. */}
              {questionHistory.slice(-2).map((q, idx, shown) => {
                const realIdx = questionHistory.length - shown.length + idx;
                const isCurrent = realIdx === questionHistory.length - 1;
                const isFocused = focusedHistoryQuestionId === q.id && !isCurrent;
                return (
                  <Box
                    key={q.id}
                    ref={(el: HTMLElement | null) => {
                      if (el) questionRowRefs.current.set(q.id, el);
                      else questionRowRefs.current.delete(q.id);
                    }}
                    sx={{
                      ...(isFocused
                        ? {
                            outline: "2px solid var(--accent-indigo)",
                            outlineOffset: 2,
                          }
                        : {}),
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
                      {realIdx + 1}
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
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              minHeight: 36,
            }}
          >
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
                  : undefined,
                "@keyframes convStatusPulse": {
                  "0%, 100%": { opacity: 1, transform: "scale(1)" },
                  "50%": { opacity: 0.5, transform: "scale(1.3)" },
                },
              }}
            />
            <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
              {conversationStatus || "Listening"}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <MicWaveform
              levelRef={micLevelRef}
              active={isListening}
              bars={7}
              color={isListening ? "var(--ats-success)" : "var(--accent-indigo)"}
            />
          </Box>
          {pauseProgressRef ? (
            <PauseProgressBar
              progressRef={pauseProgressRef}
              isListening={isListening}
            />
          ) : null}
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

