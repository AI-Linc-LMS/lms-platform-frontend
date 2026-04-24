"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Fade,
  Collapse,
  Skeleton,
  LinearProgress,
  Stack,
  Divider,
  Alert,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import {
  ContentDetail,
  SubModuleContentItem,
  coursesService,
  SubjectiveSubmitResult,
  SubjectiveQuestionDetails,
} from "@/lib/services/courses.service";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";

const ACCENT = "#0d9488";
const ACCENT_DARK = "#0f766e";

interface SubjectiveQuestionContentProps {
  content: ContentDetail;
  courseId: number;
  currentItem?: SubModuleContentItem;
  pastSubmissions: any[];
  loadingSubmissions: boolean;
  onComplete?: (obtainedMarks?: number) => void;
}

function formatQuestionTypeLabel(type: string) {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function parseMarks(value: unknown): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(value);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

function formatRelativeOrAbsolute(iso: string, locale: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diffSec = Math.round((now - d.getTime()) / 1000);
    const lang = locale.split("-")[0] || "en";
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
    const abs = (s: number, u: Intl.RelativeTimeFormatUnit) => rtf.format(-Math.round(s), u);
    if (Math.abs(diffSec) < 45) return abs(0, "second");
    if (Math.abs(diffSec) < 3600) return abs(diffSec / 60, "minute");
    if (Math.abs(diffSec) < 86400) return abs(diffSec / 3600, "hour");
    if (Math.abs(diffSec) < 86400 * 7) return abs(diffSec / 86400, "day");
    return d.toLocaleString(locale);
  } catch {
    return new Date(iso).toLocaleString(locale);
  }
}

export function SubjectiveQuestionContent({
  content,
  courseId,
  currentItem,
  pastSubmissions,
  loadingSubmissions,
  onComplete,
}: SubjectiveQuestionContentProps) {
  const { t, i18n } = useTranslation("common");
  const theme = useTheme();
  const { showToast } = useToast();
  const details = content.details as SubjectiveQuestionDetails | undefined;
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<SubjectiveSubmitResult | null>(
    null
  );
  const [resultVisible, setResultVisible] = useState(false);
  const submitInFlightRef = useRef(false);
  const answerHydratedRef = useRef(false);

  const pastSorted = useMemo(() => {
    return [...pastSubmissions].sort((a, b) => {
      const ta = new Date(a.created_at || a.submitted_at || 0).getTime();
      const tb = new Date(b.created_at || b.submitted_at || 0).getTime();
      return tb - ta;
    });
  }, [pastSubmissions]);

  const hasPriorSubmission = useMemo(() => {
    if (pastSubmissions.length > 0) return true;
    if (content.status === "complete") return true;
    if (currentItem?.status === "complete") return true;
    const subs = currentItem?.submissions;
    if (typeof subs === "number" && subs > 0) return true;
    return false;
  }, [
    pastSubmissions.length,
    content.status,
    currentItem?.status,
    currentItem?.submissions,
  ]);

  /** One submission only: prior activity on server, or just graded in this session. */
  const submissionLocked = hasPriorSubmission || lastResult !== null;

  useEffect(() => {
    setLastResult(null);
    setAnswer("");
    answerHydratedRef.current = false;
    submitInFlightRef.current = false;
  }, [content.id]);

  useEffect(() => {
    if (!submissionLocked || answerHydratedRef.current) return;
    const first = pastSorted[0]?.custom_dimension?.answer;
    if (typeof first === "string" && first.length > 0) {
      setAnswer(first);
      answerHydratedRef.current = true;
    }
  }, [submissionLocked, pastSorted]);

  const maxFromQuestion =
    typeof details?.max_marks === "number" ? details.max_marks : null;
  const maxFromContent =
    typeof content.marks === "number" && content.marks > 0
      ? content.marks
      : null;
  const displayMax = maxFromContent ?? maxFromQuestion ?? undefined;

  useEffect(() => {
    if (lastResult) {
      setResultVisible(false);
      const id = requestAnimationFrame(() => setResultVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setResultVisible(false);
  }, [lastResult]);

  const handleSubmit = useCallback(async () => {
    if (submissionLocked || submitInFlightRef.current) return;
    submitInFlightRef.current = true;
    try {
      setSubmitting(true);
      const result = await coursesService.submitSubjectiveAnswer(
        courseId,
        content.id,
        answer
      );
      setLastResult(result);
      showToast(
        t("courses.subjectiveSubmitSuccess", {
          score: result.awarded_marks,
          max: result.maximum_marks,
        }),
        "success"
      );
      onComplete?.(result.awarded_marks);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string; message?: string } } })
          ?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        t("courses.subjectiveSubmitError");
      showToast(message, "error");
    } finally {
      setSubmitting(false);
      submitInFlightRef.current = false;
    }
  }, [
    answer,
    content.id,
    courseId,
    onComplete,
    showToast,
    submissionLocked,
    t,
  ]);

  const charCount = answer.length;
  const scorePercent =
    lastResult && lastResult.maximum_marks > 0
      ? Math.min(
          100,
          (lastResult.awarded_marks / lastResult.maximum_marks) * 100
        )
      : 0;

  return (
    <Stack spacing={2.5} sx={{ pb: 1 }}>
      {/* Question */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(ACCENT, 0.25)}`,
          background: `linear-gradient(135deg, ${alpha(ACCENT, 0.06)} 0%, #ffffff 48%, #ffffff 100%)`,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 2,
            p: { xs: 2, sm: 2.5 },
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              backgroundColor: alpha(ACCENT, 0.15),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconWrapper icon="mdi:text-box-search-outline" size={26} color={ACCENT_DARK} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap={1}
              flexWrap="wrap"
              sx={{ mb: 1 }}
            >
              <Typography
                variant="overline"
                sx={{
                  letterSpacing: "0.08em",
                  fontWeight: 700,
                  color: ACCENT_DARK,
                  fontSize: "0.7rem",
                }}
              >
                {t("courses.subjectiveSectionQuestion")}
              </Typography>
              {details?.question_type ? (
                <Chip
                  size="small"
                  label={formatQuestionTypeLabel(details.question_type)}
                  sx={{
                    height: 24,
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    backgroundColor: alpha(ACCENT, 0.12),
                    color: ACCENT_DARK,
                    border: `1px solid ${alpha(ACCENT, 0.2)}`,
                  }}
                />
              ) : null}
              {displayMax !== undefined ? (
                <Chip
                  size="small"
                  variant="outlined"
                  icon={<IconWrapper icon="mdi:star-four-points-outline" size={14} color={ACCENT_DARK} />}
                  label={t("courses.subjectiveMaxMarks", { max: displayMax })}
                  sx={{
                    height: 24,
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    borderColor: alpha(ACCENT, 0.35),
                    color: ACCENT_DARK,
                  }}
                />
              ) : null}
            </Stack>
            <Typography
              component="div"
              variant="body1"
              sx={{
                color: "#1e293b",
                lineHeight: 1.75,
                whiteSpace: "pre-wrap",
                fontSize: { xs: "0.9375rem", sm: "1rem" },
              }}
            >
              {details?.question_text || "—"}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Answer */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
        }}
      >
        <Collapse in={submitting && !submissionLocked}>
          <LinearProgress
            sx={{
              height: 3,
              borderRadius: "3px 3px 0 0",
              "& .MuiLinearProgress-bar": {
                background: `linear-gradient(90deg, ${ACCENT}, #6366f1)`,
              },
            }}
          />
        </Collapse>
        <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <IconWrapper icon="mdi:pencil-outline" size={20} color="#64748b" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1a1f2e" }}>
              {t("courses.subjectiveSectionAnswer")}
            </Typography>
          </Stack>
          {submissionLocked ? (
            <Alert
              severity="info"
              icon={<IconWrapper icon="mdi:lock-check-outline" size={22} color="inherit" />}
              sx={{
                mb: 2,
                borderRadius: 2,
                alignItems: "center",
                "& .MuiAlert-message": { width: "100%" },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
                {t("courses.subjectiveSingleSubmitTitle")}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.55 }}>
                {t("courses.subjectiveSingleSubmitBody")}
              </Typography>
            </Alert>
          ) : (
            <Typography variant="body2" sx={{ color: "#64748b", mb: 2, lineHeight: 1.6 }}>
              {t("courses.subjectiveGradingHint")}
            </Typography>
          )}
          <TextField
            fullWidth
            multiline
            minRows={9}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={t("courses.subjectiveAnswerPlaceholder")}
            disabled={submitting || submissionLocked}
            InputProps={{ readOnly: submissionLocked }}
            inputProps={{
              "aria-label": t("courses.subjectiveYourAnswer"),
              maxLength: 32000,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#f8fafc",
                borderRadius: 2,
                transition: theme.transitions.create(["box-shadow", "border-color"], {
                  duration: theme.transitions.duration.shorter,
                }),
                "&:hover": {
                  backgroundColor: "#f1f5f9",
                },
                "&.Mui-focused": {
                  backgroundColor: "#ffffff",
                  boxShadow: `0 0 0 3px ${alpha(ACCENT, 0.2)}`,
                },
              },
            }}
          />
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            spacing={1.5}
            sx={{ mt: 2 }}
          >
            {!submissionLocked ? (
              <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 500 }}>
                {t("courses.subjectiveCharCount", { count: charCount })}
              </Typography>
            ) : (
              <Box />
            )}
            <Button
              variant="contained"
              size="large"
              onClick={() => void handleSubmit()}
              disabled={submitting || submissionLocked}
              startIcon={
                submitting ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <IconWrapper icon="mdi:send-check-outline" size={20} color="#ffffff" />
                )
              }
              sx={{
                minWidth: { xs: "100%", sm: 200 },
                py: 1.25,
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)`,
                boxShadow: `0 4px 14px ${alpha(ACCENT, 0.35)}`,
                "&:hover": {
                  background: `linear-gradient(135deg, ${ACCENT_DARK} 0%, #115e59 100%)`,
                  boxShadow: `0 6px 20px ${alpha(ACCENT, 0.45)}`,
                },
                "&:disabled": {
                  background: "#cbd5e1",
                  boxShadow: "none",
                },
              }}
            >
              {submissionLocked
                ? t("courses.subjectiveSubmittedShort")
                : submitting
                  ? t("courses.subjectiveGrading")
                  : t("courses.subjectiveSubmit")}
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Latest result */}
      <Fade in={resultVisible && !!lastResult} timeout={400}>
        <Box sx={{ display: resultVisible && lastResult ? "block" : "none" }}>
          {lastResult ? (
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha("#6366f1", 0.35)}`,
                background: `linear-gradient(145deg, ${alpha("#6366f1", 0.06)} 0%, #ffffff 55%)`,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { sm: "stretch" },
                  gap: 0,
                }}
              >
                <Box
                  sx={{
                    px: 3,
                    py: 2.5,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: { sm: 160 },
                    background: `linear-gradient(180deg, ${alpha("#6366f1", 0.12)} 0%, ${alpha("#6366f1", 0.04)} 100%)`,
                    borderRight: { sm: `1px solid ${alpha("#6366f1", 0.15)}` },
                    borderBottom: { xs: `1px solid ${alpha("#6366f1", 0.15)}`, sm: "none" },
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, mb: 0.5 }}>
                    {t("courses.subjectiveScoreSummary")}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      color: "#312e81",
                      lineHeight: 1.1,
                      fontSize: { xs: "2rem", sm: "2.35rem" },
                    }}
                  >
                    {lastResult.awarded_marks}
                    <Typography component="span" variant="h6" sx={{ color: "#64748b", fontWeight: 600 }}>
                      {" "}
                      / {lastResult.maximum_marks}
                    </Typography>
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={scorePercent}
                    sx={{
                      width: "100%",
                      maxWidth: 140,
                      mt: 1.5,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: alpha("#6366f1", 0.12),
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 3,
                        background: `linear-gradient(90deg, #6366f1, ${ACCENT})`,
                      },
                    }}
                  />
                  <Chip
                    size="small"
                    label={t("courses.subjectiveStatusGraded")}
                    sx={{ mt: 1.5, fontWeight: 700, backgroundColor: "#e0e7ff", color: "#3730a3" }}
                  />
                </Box>
                <Box sx={{ flex: 1, p: { xs: 2, sm: 2.5 }, minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b", mb: 1 }}>
                    {t("courses.subjectiveLastResult")}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 1.5 }}>
                    {t("courses.subjectiveScoreCaps", {
                      qMax: lastResult.max_marks_question,
                      cap: lastResult.maximum_marks,
                    })}
                  </Typography>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#475569", display: "block", mb: 0.75 }}>
                    {t("courses.subjectiveFeedback")}
                  </Typography>
                  <Box
                    sx={{
                      pl: 2,
                      borderInlineStart: `3px solid ${ACCENT}`,
                      backgroundColor: alpha(ACCENT, 0.04),
                      borderRadius: "0 8px 8px 0",
                      py: 1.25,
                      px: 1.5,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: "#334155", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                      {lastResult.feedback}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          ) : null}
        </Box>
      </Fade>

      {/* Past attempts */}
      {loadingSubmissions ? (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: "1px solid #e2e8f0",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Skeleton variant="circular" width={22} height={22} />
            <Skeleton variant="text" width="40%" height={28} />
          </Stack>
          <Skeleton variant="rounded" height={56} sx={{ mb: 1, borderRadius: 2 }} />
          <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2 }} />
        </Paper>
      ) : pastSorted.length > 0 ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
          }}
        >
          <Box
            sx={{
              px: 2.5,
              py: 2,
              background: "linear-gradient(90deg, #f8fafc 0%, #ffffff 100%)",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: 1.25,
            }}
          >
            <IconWrapper icon="mdi:history" size={22} color="#64748b" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1a1f2e" }}>
              {t("courses.subjectivePastAttempts", { count: pastSorted.length })}
            </Typography>
          </Box>
          {pastSorted.map((sub, index) => {
            const dim = sub.custom_dimension || {};
            const score =
              typeof dim.awarded_marks === "number"
                ? dim.awarded_marks
                : parseMarks(sub.obtained_marks ?? sub.marks);
            const maxM =
              typeof dim.maximum_marks === "number"
                ? dim.maximum_marks
                : typeof dim.max_marks_question === "number"
                  ? dim.max_marks_question
                  : parseMarks(sub.maximum_marks);
            const when = sub.created_at || sub.submitted_at || "";
            const isLatest = index === 0;
            return (
              <Accordion
                key={sub.id}
                disableGutters
                elevation={0}
                TransitionProps={{ unmountOnExit: false }}
                sx={{
                  "&:before": { display: "none" },
                  borderBottom: "1px solid #e2e8f0",
                  "&:last-of-type": { borderBottom: "none" },
                  "&.Mui-expanded": {
                    margin: 0,
                    backgroundColor: alpha("#6366f1", 0.02),
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={
                    <Box sx={{ color: "#64748b", display: "flex" }}>
                      <IconWrapper icon="mdi:chevron-down" size={22} />
                    </Box>
                  }
                  sx={{
                    px: 2,
                    minHeight: 56,
                    "& .MuiAccordionSummary-content": { my: 1, alignItems: "center" },
                    "&:hover": { backgroundColor: alpha("#0f172a", 0.02) },
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{ width: "100%", pr: 1, flexWrap: "wrap" }}
                  >
                    <IconWrapper icon="mdi:calendar-clock-outline" size={18} color="#94a3b8" />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ color: "#1e293b", fontWeight: 600 }}>
                        {when ? formatRelativeOrAbsolute(when, i18n.language) : "—"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#94a3b8", display: { xs: "none", sm: "block" } }}>
                        {when ? new Date(when).toLocaleString(i18n.language) : ""}
                      </Typography>
                    </Box>
                    {isLatest ? (
                      <Chip
                        size="small"
                        label={t("courses.subjectiveLatestBadge")}
                        sx={{
                          height: 22,
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          backgroundColor: alpha(ACCENT, 0.15),
                          color: ACCENT_DARK,
                        }}
                      />
                    ) : null}
                    <Chip
                      size="small"
                      label={t("courses.subjectiveScoreChip", {
                        score,
                        max: maxM || "—",
                      })}
                      sx={{
                        fontWeight: 700,
                        backgroundColor: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                      }}
                    />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    px: 2,
                    pb: 2.5,
                    pt: 0,
                    backgroundColor: "#fafafa",
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", display: "block", mb: 0.75 }}>
                    {t("courses.subjectiveYourAnswer")}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: "pre-wrap",
                      mb: 2,
                      color: "#334155",
                      lineHeight: 1.65,
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {dim.answer ?? "—"}
                  </Typography>
                  {dim.feedback ? (
                    <>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b", display: "block", mb: 0.75 }}>
                        {t("courses.subjectiveFeedback")}
                      </Typography>
                      <Box
                        sx={{
                          pl: 1.5,
                          borderInlineStart: `3px solid ${ACCENT}`,
                          py: 1,
                          pr: 1,
                        }}
                      >
                        <Typography variant="body2" sx={{ color: "#475569", whiteSpace: "pre-wrap", lineHeight: 1.65 }}>
                          {dim.feedback}
                        </Typography>
                      </Box>
                    </>
                  ) : null}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Paper>
      ) : !loadingSubmissions && pastSorted.length === 0 && !lastResult && !submissionLocked ? (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: "1px dashed #cbd5e1",
            backgroundColor: "#f8fafc",
            textAlign: "center",
          }}
        >
          <IconWrapper icon="mdi:clipboard-text-clock-outline" size={40} color="#94a3b8" />
          <Typography variant="body2" sx={{ color: "#64748b", mt: 1.5, maxWidth: 420, mx: "auto", lineHeight: 1.65 }}>
            {t("courses.subjectiveNoHistory")}
          </Typography>
        </Paper>
      ) : null}
    </Stack>
  );
}
