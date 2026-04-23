"use client";

import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Chip,
  Stack,
  Collapse,
  ButtonBase,
} from "@mui/material";
import { memo, useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { QuizQuestionList } from "@/components/quiz";
import { QuestionTitle } from "@/components/quiz/QuestionTitle";
import { IconWrapper } from "@/components/common/IconWrapper";
import { MathSymbolToolbar } from "@/components/assessment/MathSymbolToolbar";

export interface SubjectiveQuestionItem {
  id: string | number;
  question_text: string;
  max_marks?: number;
  question_type?: string;
}

function formatQuestionTypeLabel(type: string) {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

const WRITING_TIP_ITEMS = [
  {
    icon: "mdi:format-list-checks" as const,
    title: "Cover every part of the question",
    description:
      "If the question has multiple bullets or sub-questions, respond to each one so markers never have to infer what you meant.",
  },
  {
    icon: "mdi:format-list-numbered" as const,
    title: "Use a clear structure",
    description:
      "A short setup line helps; then numbered points or short paragraphs are easier to mark than one dense block of text.",
  },
  {
    icon: "mdi:scale-balance" as const,
    title: "Case-style: assumptions first",
    description:
      "State your assumptions explicitly, walk through your reasoning, then end with a clear takeaway or recommendation.",
  },
  {
    icon: "mdi:target" as const,
    title: "Match depth to the marks",
    description:
      "Quality beats word count. Aim for enough detail to earn the marks shown — avoid padding or repeating the question.",
  },
];

interface AssessmentSubjectiveLayoutProps {
  currentQuestionIndex: number;
  currentQuestion: SubjectiveQuestionItem;
  answerText: string;
  questions: Array<{
    id: string | number;
    question: string;
    answered?: boolean;
  }>;
  totalQuestions: number;
  onAnswerChange: (text: string) => void;
  onNextQuestion?: () => void;
  onPreviousQuestion?: () => void;
  onQuestionClick?: (questionId: string | number) => void;
}

export const AssessmentSubjectiveLayout = memo(
  function AssessmentSubjectiveLayout({
    currentQuestionIndex,
    currentQuestion,
    answerText,
    questions = [],
    totalQuestions,
    onAnswerChange,
    onNextQuestion,
    onPreviousQuestion,
    onQuestionClick,
  }: AssessmentSubjectiveLayoutProps) {
    const { t } = useTranslation("common");
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
    const isFirstQuestion = currentQuestionIndex === 0;

    const answeredCountRef = useRef<number>(0);
    const lastQuestionsHashRef = useRef<string>("");

    const answeredCount = useMemo(() => {
      if (!questions || questions.length === 0) {
        answeredCountRef.current = 0;
        return 0;
      }
      const hash = questions.map((q) => `${q.id}:${q.answered ? "1" : "0"}`).join(",");
      if (hash === lastQuestionsHashRef.current) {
        return answeredCountRef.current;
      }
      lastQuestionsHashRef.current = hash;
      const count = questions.filter((q) => q.answered).length;
      answeredCountRef.current = count;
      return count;
    }, [questions]);

    const { charCount, wordCount } = useMemo(() => {
      const trimmed = answerText.trim();
      const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
      return { charCount: answerText.length, wordCount: words.length };
    }, [answerText]);

    const hasDraft = charCount > 0;
    const [writingTipsOpen, setWritingTipsOpen] = useState(false);
    const toggleWritingTips = useCallback(() => {
      setWritingTipsOpen((o) => !o);
    }, []);

    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
    const pendingCaretRef = useRef<number | null>(null);

    useEffect(() => {
      pendingCaretRef.current = null;
    }, [currentQuestion.id]);

    const insertAtCaret = useCallback(
      (text: string) => {
        const el = textAreaRef.current;
        const len = answerText.length;
        const start = el ? el.selectionStart : len;
        const end = el ? el.selectionEnd : len;
        const next = answerText.slice(0, start) + text + answerText.slice(end);
        pendingCaretRef.current = start + text.length;
        onAnswerChange(next);
      },
      [answerText, onAnswerChange],
    );

    useEffect(() => {
      const pos = pendingCaretRef.current;
      if (pos === null) return;
      pendingCaretRef.current = null;
      const el = textAreaRef.current;
      if (!el) return;
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(pos, pos);
      });
    }, [answerText]);

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 2, md: 3 },
          maxWidth: "100%",
        }}
      >
        <Box
          sx={{
            width: { xs: "100%", md: "min(360px, 34vw)" },
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            order: { xs: 1, md: 0 },
          }}
        >
          <QuizQuestionList
            questions={questions}
            currentQuestionId={currentQuestion.id}
            onQuestionClick={onQuestionClick}
            listTitle={t("quiz.writtenListTitle")}
            listSubtitle={t("quiz.writtenListSubtitle")}
            variant="subjective"
          />
        </Box>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            order: { xs: 0, md: 1 },
          }}
        >
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              p: { xs: 2, sm: 3, md: 4 },
              backgroundColor: "#ffffff",
              borderRadius: 2,
              border: "1px solid #e5e7eb",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "center" },
                justifyContent: "space-between",
                gap: 1.5,
                mb: 2,
              }}
            >
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "#6366f1",
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    mb: 0.25,
                  }}
                >
                  Written response
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#6b7280", fontWeight: 500 }}
                >
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </Typography>
              </Box>
              <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                {currentQuestion.max_marks != null && (
                  <Chip
                    size="small"
                    label={`Max ${currentQuestion.max_marks} marks`}
                    sx={{
                      height: 28,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      backgroundColor: "#f0fdf4",
                      color: "#166534",
                      border: "1px solid #bbf7d0",
                    }}
                  />
                )}
                {currentQuestion.question_type ? (
                  <Chip
                    size="small"
                    label={formatQuestionTypeLabel(currentQuestion.question_type)}
                    variant="outlined"
                    sx={{
                      height: 28,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      borderColor: "#e5e7eb",
                      color: "#374151",
                    }}
                  />
                ) : null}
                <Chip
                  size="small"
                  label={`${answeredCount} / ${totalQuestions} with text`}
                  sx={{
                    height: 28,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    backgroundColor: "#f9fafb",
                    color: "#4b5563",
                    border: "1px solid #e5e7eb",
                  }}
                />
              </Stack>
            </Box>

            <QuestionTitle question={currentQuestion.question_text} />

            <Typography
              component="label"
              htmlFor={`subjective-answer-${currentQuestion.id}`}
              variant="subtitle2"
              sx={{
                display: "block",
                mt: 1,
                mb: 1,
                fontWeight: 600,
                color: "#111827",
                fontSize: "0.875rem",
              }}
            >
              Your answer
            </Typography>
            {hasDraft ? (
              <Typography variant="caption" sx={{ display: "block", mb: 1, color: "#6b7280" }}>
                Draft saved automatically with your attempt.
              </Typography>
            ) : (
              <Typography variant="caption" sx={{ display: "block", mb: 1, color: "#9ca3af" }}>
                Start typing — your work is saved as you go.
              </Typography>
            )}

            <TextField
              id={`subjective-answer-${currentQuestion.id}`}
              multiline
              minRows={10}
              maxRows={26}
              fullWidth
              value={answerText}
              onChange={(e) => onAnswerChange(e.target.value)}
              inputRef={textAreaRef}
              placeholder="Write a clear, structured answer. Use paragraphs where it helps readability."
              variant="outlined"
              inputProps={{
                "aria-describedby": `subjective-answer-stats-${currentQuestion.id}`,
                style: {
                  userSelect: "text",
                  WebkitUserSelect: "text",
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#ffffff",
                  borderRadius: 2,
                  fontSize: "0.9375rem",
                  lineHeight: 1.65,
                  fontFamily: "var(--font-family-primary)",
                  "& fieldset": {
                    borderColor: "#e5e7eb",
                  },
                  "&:hover fieldset": {
                    borderColor: "#d1d5db",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#6366f1",
                    borderWidth: "1px",
                  },
                },
                "& .MuiInputBase-input": {
                  userSelect: "text",
                  WebkitUserSelect: "text",
                  py: 1.5,
                },
                "& .MuiInputBase-input::placeholder": {
                  color: "#9ca3af",
                  opacity: 1,
                },
              }}
            />

            <Box sx={{ mt: 1.5 }}>
              <MathSymbolToolbar onInsert={insertAtCaret} />
            </Box>

            <Box
              id={`subjective-answer-stats-${currentQuestion.id}`}
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                mt: 1.5,
              }}
            >
              <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 500 }}>
                {charCount.toLocaleString()} characters · {wordCount.toLocaleString()} words
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconWrapper icon="mdi:cloud-check-outline" size={16} color="#10b981" />
                <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 500 }}>
                  Autosaved
                </Typography>
              </Box>
            </Box>

            <Box
              component="section"
              aria-labelledby="subjective-writing-tips-heading"
              sx={{
                mt: 3,
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid #c7d2fe",
                backgroundColor: "#f8fafc",
                boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
              }}
            >
              <ButtonBase
                component="button"
                type="button"
                id="subjective-writing-tips-heading"
                aria-expanded={writingTipsOpen}
                aria-controls="subjective-writing-tips-panel"
                onClick={toggleWritingTips}
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                  textAlign: "left",
                  gap: 1.5,
                  p: 2,
                  pr: 1.5,
                  borderRadius: 0,
                  transition: "background-color 0.15s ease",
                  backgroundColor: writingTipsOpen ? "#eef2ff" : "#f1f5f9",
                  borderBottom: writingTipsOpen ? "1px solid #c7d2fe" : "none",
                  "&:hover": {
                    backgroundColor: "#e0e7ff",
                  },
                  "&.Mui-focusVisible": {
                    outline: "2px solid #6366f1",
                    outlineOffset: -2,
                    zIndex: 1,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#ffffff",
                    border: "1px solid #c7d2fe",
                    boxShadow: "0 1px 2px rgba(79, 70, 229, 0.08)",
                  }}
                >
                  <IconWrapper icon="mdi:lightbulb-on-outline" size={24} color="#4f46e5" />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0, py: 0.25 }}>
                  <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" sx={{ mb: 0.25 }}>
                    <Typography
                      component="span"
                      variant="subtitle2"
                      sx={{
                        fontWeight: 800,
                        color: "#312e81",
                        fontSize: "0.9375rem",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Writing tips
                    </Typography>
                    <Box
                      component="span"
                      sx={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "#4f46e5",
                        bgcolor: "rgba(99, 102, 241, 0.12)",
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 1,
                      }}
                    >
                      Quick guide
                    </Box>
                  </Stack>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block", lineHeight: 1.5 }}>
                    {writingTipsOpen
                      ? "Tap the header again anytime to hide this panel and focus on your answer."
                      : `${WRITING_TIP_ITEMS.length} short ideas — expand when you want a refresher.`}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flexShrink: 0,
                    width: 36,
                    height: 36,
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#4f46e5",
                    mt: 0.25,
                  }}
                  aria-hidden
                >
                  <IconWrapper
                    icon={writingTipsOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
                    size={28}
                    color="#4f46e5"
                  />
                </Box>
              </ButtonBase>

              <Collapse in={writingTipsOpen} timeout="auto">
                <Stack
                  id="subjective-writing-tips-panel"
                  spacing={1.25}
                  sx={{
                    p: 2,
                    pt: 1.75,
                    bgcolor: "#ffffff",
                  }}
                >
                  {WRITING_TIP_ITEMS.map((item, index) => (
                    <Box
                      key={item.title}
                      sx={{
                        display: "flex",
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 2,
                        border: "1px solid #e2e8f0",
                        backgroundColor: "#fafbff",
                        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                        "&:hover": {
                          borderColor: "#c7d2fe",
                          boxShadow: "0 2px 8px rgba(79, 70, 229, 0.06)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 44,
                          minWidth: 44,
                          height: 44,
                          borderRadius: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          backgroundColor: "#eef2ff",
                          border: "1px solid #e0e7ff",
                        }}
                        aria-hidden
                      >
                        <IconWrapper icon={item.icon} size={22} color="#4f46e5" />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          component="h3"
                          variant="subtitle2"
                          sx={{
                            fontWeight: 700,
                            color: "#1e1b4b",
                            fontSize: "0.8125rem",
                            lineHeight: 1.35,
                            mb: 0.5,
                          }}
                        >
                          <Box component="span" sx={{ color: "#6366f1", fontWeight: 800, mr: 0.75 }}>
                            {index + 1}.
                          </Box>
                          {item.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#475569",
                            fontSize: "0.8125rem",
                            lineHeight: 1.6,
                          }}
                        >
                          {item.description}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Collapse>
            </Box>
            <Box
              sx={{
                mt: 4,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "stretch", sm: "center" },
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: { xs: "block", sm: "none" },
                  textAlign: "center",
                  mb: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "#6b7280",
                    fontWeight: 500,
                  }}
                >
                  {answeredCount} of {totalQuestions} answered
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                  width: { xs: "100%", sm: "auto" },
                  alignItems: { xs: "stretch", sm: "center" },
                  justifyContent: "space-between",
                }}
              >
                <Button
                  variant="outlined"
                  onClick={onPreviousQuestion}
                  disabled={isFirstQuestion}
                  startIcon={<IconWrapper icon="mdi:chevron-left" size={20} />}
                  sx={{
                    borderColor: "#6366f1",
                    color: "#6366f1",
                    px: { xs: 2, sm: 3 },
                    py: 1.5,
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: "none",
                    flex: { xs: 1, sm: "none" },
                    minWidth: { xs: "auto", sm: "120px" },
                    "&:hover": {
                      borderColor: "#4f46e5",
                      backgroundColor: "#6366f115",
                    },
                    "&:disabled": {
                      borderColor: "#d1d5db",
                      color: "#9ca3af",
                    },
                  }}
                >
                  Previous
                </Button>

                <Box
                  sx={{
                    display: { xs: "none", sm: "flex" },
                    alignItems: "center",
                    minWidth: "150px",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#6b7280",
                      fontWeight: 500,
                    }}
                  >
                    {answeredCount} of {totalQuestions} answered
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  onClick={onNextQuestion}
                  disabled={isLastQuestion}
                  endIcon={<IconWrapper icon="mdi:chevron-right" size={20} />}
                  sx={{
                    backgroundColor: "#6366f1",
                    color: "#ffffff",
                    px: { xs: 2, sm: 4 },
                    py: 1.5,
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: "none",
                    flex: { xs: 1, sm: "none" },
                    minWidth: { xs: "auto", sm: "140px" },
                    "&:hover": {
                      backgroundColor: "#4f46e5",
                    },
                    "&:disabled": {
                      backgroundColor: "#d1d5db",
                      color: "#9ca3af",
                    },
                  }}
                >
                  Next
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.currentQuestionIndex !== nextProps.currentQuestionIndex) return false;
    if (prevProps.currentQuestion.id !== nextProps.currentQuestion.id) return false;
    if (prevProps.answerText !== nextProps.answerText) return false;
    if (prevProps.totalQuestions !== nextProps.totalQuestions) return false;
    if (prevProps.questions.length !== nextProps.questions.length) return false;

    const qId = nextProps.currentQuestion.id;
    const prevA = prevProps.questions.find((q) => q.id === qId)?.answered;
    const nextA = nextProps.questions.find((q) => q.id === qId)?.answered;
    if (prevA !== nextA) return false;

    const prevAnswered = prevProps.questions.filter((q) => q.answered).length;
    const nextAnswered = nextProps.questions.filter((q) => q.answered).length;
    if (prevAnswered !== nextAnswered) return false;

    return true;
  }
);
