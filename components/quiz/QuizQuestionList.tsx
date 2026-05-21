"use client";

import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  Chip,
  Stack,
  Tooltip,
  Button,
  LinearProgress,
  alpha,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  memo,
  useMemo,
  useRef,
  useCallback,
  useLayoutEffect,
  type MouseEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

function hasHtml(str: unknown): str is string {
  return typeof str === "string" && /<[a-z][\s\S]*>/i.test(str);
}

function stripLeadingBracketTag(text: string): string {
  return text.replace(/^\[[^\]\n]{1,48}\]\s*/, "").trim();
}

function plainTextFromQuestion(htmlOrText: string): string {
  if (hasHtml(htmlOrText)) {
    return stripLeadingBracketTag(
      htmlOrText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    );
  }
  return stripLeadingBracketTag(htmlOrText);
}

function findNextUnansweredQuestionId(
  questions: QuizQuestion[],
  currentQuestionId: string | number,
): string | number | null {
  const cur = questions.findIndex((q) => q.id === currentQuestionId);
  const start = cur >= 0 ? cur + 1 : 0;
  for (let i = start; i < questions.length; i++) {
    if (!questions[i]?.answered) return questions[i]!.id;
  }
  for (let i = 0; i < (cur >= 0 ? cur : questions.length); i++) {
    if (!questions[i]?.answered) return questions[i]!.id;
  }
  return null;
}

interface QuizQuestion {
  id: string | number;
  question: string;
  answered?: boolean;
}

interface QuizQuestionListProps {
  questions: QuizQuestion[];
  currentQuestionId: string | number;
  onQuestionClick?: (questionId: string | number) => void;
  listTitle?: string;
  listSubtitle?: string;
  variant?: "quiz" | "subjective";
}

const VARIANT_STYLES = {
  quiz: {
    currentBg: "var(--surface-indigo-light)",
    currentHover: "var(--surface-blue-light)",
    accent: "var(--accent-indigo)",
    answered: "var(--success-500)",
    muted: "var(--font-secondary)",
    currentText: "var(--accent-indigo-dark)",
  },
  subjective: {
    currentBg: "var(--assessment-subjective-surface-active)",
    currentHover: "var(--assessment-subjective-surface-hover)",
    accent: "var(--assessment-subjective-accent)",
    answered: "var(--assessment-subjective-answered)",
    muted: "var(--assessment-subjective-muted)",
    currentText: "var(--assessment-subjective-fg-strong)",
  },
} as const;

const QuizQuestionListComponent = memo(function QuizQuestionList({
  questions,
  currentQuestionId,
  onQuestionClick,
  listTitle,
  listSubtitle,
  variant = "quiz",
}: QuizQuestionListProps) {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const isCoarsePointer = useMediaQuery("(pointer: coarse)");
  const c = VARIANT_STYLES[variant];

  const resolvedTitle = listTitle ?? t("quiz.questionListTitle");
  const itemElRefs = useRef<Map<string, HTMLElement>>(new Map());
  const isNarrow = useMediaQuery(theme.breakpoints.down("sm"));

  const answeredCount = useMemo(
    () => questions.filter((q) => q.answered).length,
    [questions],
  );

  const pendingCount = questions.length - answeredCount;
  const progressPct =
    questions.length > 0
      ? Math.round((answeredCount / questions.length) * 100)
      : 0;

  const nextUnansweredId = useMemo(
    () => findNextUnansweredQuestionId(questions, currentQuestionId),
    [questions, currentQuestionId],
  );

  const setItemButtonRef = useCallback((id: string | number) => (el: HTMLElement | null) => {
    const key = String(id);
    if (el) itemElRefs.current.set(key, el);
    else itemElRefs.current.delete(key);
  }, []);

  useLayoutEffect(() => {
    const el = itemElRefs.current.get(String(currentQuestionId));
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentQuestionId, questions.length]);

  const handleJumpNextUnanswered = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const id = findNextUnansweredQuestionId(questions, currentQuestionId);
      if (id != null) onQuestionClick?.(id);
    },
    [questions, currentQuestionId, onQuestionClick],
  );

  const rowMinHeight = isCoarsePointer ? 52 : 46;

  return (
    <Paper
      component="nav"
      aria-label={resolvedTitle}
      elevation={0}
      sx={{
        backgroundColor: "var(--card-bg)",
        borderRadius: 2,
        border: "1px solid var(--border-default)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        flex: { md: 1 },
        minHeight: { md: 0 },
        width: "100%",
        boxShadow:
          variant === "subjective"
            ? "0 2px 12px color-mix(in srgb, var(--assessment-subjective-shadow) 35%, transparent)"
            : "0 2px 12px color-mix(in srgb, var(--font-primary-dark) 6%, transparent)",
      }}
    >
      <Box
        sx={{
          px: 2,
          pt: 1.5,
          pb: 1.25,
          borderBottom: "1px solid var(--border-default)",
          backgroundColor:
            variant === "subjective"
              ? "var(--assessment-subjective-header-strip-bg)"
              : alpha(theme.palette.primary.main, 0.03),
        }}
      >
        <Stack direction="row" alignItems="center" flexWrap="wrap" gap={0.75}>
          <Chip
            size="small"
            label={t("quiz.answeredOf", {
              answered: answeredCount,
              total: questions.length,
            })}
            sx={{
              height: 26,
              fontWeight: 600,
              fontSize: "0.72rem",
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: "primary.main",
              border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
            }}
          />
          {pendingCount === 0 ? (
            <Chip
              size="small"
              icon={<IconWrapper icon="mdi:check-all" size={16} color="inherit" />}
              label={t("quiz.navAllDone")}
              sx={{
                height: 26,
                fontWeight: 600,
                fontSize: "0.72rem",
                bgcolor: alpha(theme.palette.success.main, 0.12),
                color: "success.dark",
                border: `1px solid ${alpha(theme.palette.success.main, 0.28)}`,
                "& .MuiChip-icon": { ml: 0.5 },
              }}
            />
          ) : (
            <Chip
              size="small"
              label={t("quiz.navRemaining", { count: pendingCount })}
              sx={{
                height: 26,
                fontWeight: 600,
                fontSize: "0.72rem",
                bgcolor: alpha(theme.palette.warning.main, 0.12),
                color: "warning.dark",
                border: `1px solid ${alpha(theme.palette.warning.main, 0.28)}`,
              }}
            />
          )}
        </Stack>
        {listSubtitle ? (
          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 1,
              color:
                variant === "subjective"
                  ? "var(--assessment-subjective-muted)"
                  : "var(--font-secondary)",
              fontSize: "0.75rem",
              lineHeight: 1.45,
            }}
          >
            {listSubtitle}
          </Typography>
        ) : null}
      </Box>

      <Box
        sx={{
          px: 2,
          pt: 1.25,
          pb: 1.25,
          bgcolor:
            variant === "subjective"
              ? "color-mix(in srgb, var(--assessment-subjective-surface-active) 8%, var(--card-bg))"
              : "color-mix(in srgb, var(--font-primary-dark) 3.5%, var(--card-bg))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 0.75 }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, letterSpacing: 0.02 }}
          >
            {t("quiz.navProgressLabel")}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            {answeredCount}/{questions.length}
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progressPct}
          sx={{
            height: 6,
            borderRadius: 99,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            "& .MuiLinearProgress-bar": {
              borderRadius: 99,
              bgcolor:
                pendingCount === 0 ? theme.palette.success.main : theme.palette.primary.main,
            },
          }}
        />
        {nextUnansweredId != null && onQuestionClick && (
          <Button
            fullWidth
            size="small"
            variant="outlined"
            color="warning"
            onClick={handleJumpNextUnanswered}
            startIcon={<IconWrapper icon="mdi:arrow-right-bold-circle-outline" size={18} />}
            sx={{
              mt: 1.25,
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 1.5,
              py: 0.75,
            }}
          >
            {isNarrow
              ? t("quiz.jumpToNextUnansweredShort")
              : t("quiz.jumpToNextUnanswered")}
          </Button>
        )}
      </Box>

      <Box
        sx={{
          flex: { md: 1 },
          minHeight: { md: 0 },
          display: "flex",
          flexDirection: "column",
        }}
      >
        <List
          dense
          sx={{
            py: 0.75,
            flex: { md: 1 },
            minHeight: { md: 0 },
            maxHeight: { xs: "min(50vh, 340px)", md: "none" },
            overflowY: "auto",
            scrollBehavior: "smooth",
            scrollPaddingBlock: "12px",
            "&::-webkit-scrollbar": { width: "8px" },
            "&::-webkit-scrollbar-track": { background: "var(--surface)" },
            "&::-webkit-scrollbar-thumb": {
              background: "var(--border-light)",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "var(--font-tertiary)",
            },
          }}
        >
          {questions.map((question, index) => {
            const isCurrent = question.id === currentQuestionId;
            const isAnswered = Boolean(question.answered);
            const preview = hasHtml(question.question)
              ? plainTextFromQuestion(question.question)
              : plainTextFromQuestion(question.question || "");
            const displayLine =
              preview ||
              t("quiz.questionOf", {
                current: index + 1,
                total: questions.length,
              });
            const truncated =
              displayLine.length > 72
                ? `${displayLine.slice(0, 69)}…`
                : displayLine;

            const statusLabel = isCurrent
              ? t("quiz.questionStatusCurrent")
              : isAnswered
                ? t("quiz.questionStatusAnswered")
                : t("quiz.questionStatusPending");

            return (
              <ListItem
                key={question.id}
                disablePadding
                sx={{ px: 0.75, py: 0.35 }}
              >
                <ListItemButton
                  ref={setItemButtonRef(question.id)}
                  onClick={() => onQuestionClick?.(question.id)}
                  aria-current={isCurrent ? "true" : undefined}
                  aria-label={`${t("quiz.questionNumber", { n: index + 1 })}. ${statusLabel}. ${displayLine}`}
                  sx={{
                    minHeight: rowMinHeight,
                    py: 1,
                    px: 1.25,
                    borderRadius: 2,
                    mx: 0.25,
                    borderLeft: isCurrent ? `4px solid ${c.accent}` : "4px solid transparent",
                    backgroundColor: isCurrent ? c.currentBg : "transparent",
                    boxShadow: isCurrent
                      ? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.14)}, 0 2px 10px ${alpha(theme.palette.common.black, 0.07)}`
                      : "none",
                    transition:
                      "background-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease",
                    "&:hover": {
                      backgroundColor: isCurrent ? c.currentHover : "var(--surface)",
                      transform: "translateY(-1px)",
                    },
                    "&:active": {
                      transform: "translateY(0)",
                    },
                    "&:focus-visible": {
                      outline: `2px solid ${alpha(theme.palette.primary.main, 0.45)}`,
                      outlineOffset: 2,
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.25}
                    sx={{ width: "100%", minWidth: 0 }}
                  >
                    <Box
                      sx={{
                        flexShrink: 0,
                        width: 30,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      {isAnswered ? (
                        <IconWrapper
                          icon="mdi:check-decagram"
                          size={24}
                          color={isCurrent ? c.accent : c.answered}
                        />
                      ) : (
                        <IconWrapper
                          icon="mdi:circle-outline"
                          size={24}
                          color={isCurrent ? c.accent : "var(--border-light)"}
                        />
                      )}
                    </Box>

                    <Chip
                      label={t("quiz.questionNumber", { n: index + 1 })}
                      size="small"
                      sx={{
                        height: 26,
                        minWidth: 44,
                        fontWeight: 800,
                        flexShrink: 0,
                        fontSize: "0.72rem",
                        bgcolor: isCurrent
                          ? alpha(theme.palette.primary.main, 0.22)
                          : alpha(theme.palette.grey[500], 0.1),
                        color: isCurrent ? c.currentText : "var(--font-secondary)",
                        border: `1px solid ${
                          isCurrent
                            ? alpha(theme.palette.primary.main, 0.4)
                            : "var(--border-default)"
                        }`,
                      }}
                    />

                    <Tooltip
                      title={displayLine}
                      placement="left"
                      enterDelay={350}
                      slotProps={{
                        tooltip: { sx: { maxWidth: 360 } },
                        popper: { modifiers: [{ name: "offset", options: { offset: [0, -6] } }] },
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        {hasHtml(question.question) ? (
                          <Box
                            component="span"
                            sx={{
                              fontWeight: isCurrent ? 700 : 500,
                              color: isCurrent ? c.currentText : c.muted,
                              fontSize: "0.8125rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              display: "block",
                              lineHeight: 1.5,
                              "& p": { margin: 0, display: "inline" },
                              "& br": { display: "none" },
                            }}
                            dangerouslySetInnerHTML={{
                              __html: question.question || "",
                            }}
                          />
                        ) : (
                          <Typography
                            component="span"
                            sx={{
                              fontWeight: isCurrent ? 700 : 500,
                              color: isCurrent ? c.currentText : c.muted,
                              fontSize: "0.8125rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              display: "block",
                              lineHeight: 1.5,
                            }}
                          >
                            {truncated}
                          </Typography>
                        )}
                      </Box>
                    </Tooltip>

                    {isCurrent && (
                      <Box
                        aria-hidden
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: c.accent,
                          flexShrink: 0,
                          boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.22)}`,
                        }}
                      />
                    )}
                  </Stack>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Paper>
  );
}, (prevProps, nextProps) => {
  if (prevProps.currentQuestionId !== nextProps.currentQuestionId) return false;
  if (prevProps.listTitle !== nextProps.listTitle) return false;
  if (prevProps.listSubtitle !== nextProps.listSubtitle) return false;
  if (prevProps.variant !== nextProps.variant) return false;
  if (prevProps.questions.length !== nextProps.questions.length) return false;

  const prevCurrent = prevProps.questions.find(
    (q) => q.id === prevProps.currentQuestionId,
  );
  const nextCurrent = nextProps.questions.find(
    (q) => q.id === nextProps.currentQuestionId,
  );
  if (prevCurrent?.answered !== nextCurrent?.answered) return false;

  for (let i = 0; i < prevProps.questions.length; i++) {
    if (prevProps.questions[i]?.answered !== nextProps.questions[i]?.answered) {
      return false;
    }
    if (prevProps.questions[i]?.question !== nextProps.questions[i]?.question) {
      return false;
    }
  }

  return true;
});

export { QuizQuestionListComponent as QuizQuestionList };
