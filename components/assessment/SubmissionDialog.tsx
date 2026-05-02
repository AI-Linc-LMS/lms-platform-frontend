"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Stack,
  ButtonGroup,
  alpha,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  formatChecklistQuestionLabel,
  getResponseForQuestion,
  isAssessmentQuestionCompleted,
} from "@/lib/utils/assessmentQuestionCompletion";

export type SubmissionDialogSection = {
  id?: number;
  title?: string;
  order?: number;
  section_type?: string;
  questions?: Array<Record<string, unknown> & { id: number | string }>;
};

interface SubmissionDialogProps {
  open: boolean;
  sections: SubmissionDialogSection[];
  responses: Record<string, Record<string, unknown>>;
  totalQuestions: number;
  totalAnswered: number;
  onClose: () => void;
  onConfirm: () => void;
  submitting?: boolean;
  /** When true, show a short notice that section order was fixed (allow_movement off). */
  strictLinearSectionOrder?: boolean;
}

function sectionKey(section: SubmissionDialogSection, index: number): string {
  if (section.id != null) return `s-${section.id}`;
  return `s-idx-${section.order ?? index}`;
}

function sectionTypeLabel(
  t: (k: string) => string,
  sectionType: string | undefined,
): string {
  const st = sectionType || "quiz";
  if (st === "coding") return t("assessments.submitChecklist.typeCoding");
  if (st === "subjective") return t("assessments.submitChecklist.typeSubjective");
  return t("assessments.submitChecklist.typeQuiz");
}

export function SubmissionDialog({
  open,
  sections,
  responses,
  totalQuestions,
  totalAnswered,
  onClose,
  onConfirm,
  submitting = false,
  strictLinearSectionOrder = false,
}: SubmissionDialogProps) {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const [confirmed, setConfirmed] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const sortedSections = useMemo(
    () =>
      [...(sections || [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      ),
    [sections],
  );

  const checklist = useMemo(() => {
    return sortedSections.map((section, sIdx) => {
      const sectionType = section.section_type || "quiz";
      const questions = section.questions || [];
      const rows = questions.map((q, qIdx) => {
        const response = getResponseForQuestion(responses, sectionType, q.id);
        const completed = isAssessmentQuestionCompleted(
          sectionType,
          response,
          sectionType === "subjective"
            ? { answer_mode: (q as { answer_mode?: string }).answer_mode }
            : undefined,
        );
        return {
          id: q.id,
          label: formatChecklistQuestionLabel(sectionType, q, qIdx),
          completed,
        };
      });
      const answered = rows.filter((r) => r.completed).length;
      return {
        key: sectionKey(section, sIdx),
        title: section.title || sectionTypeLabel(t, sectionType),
        sectionType,
        rows,
        answered,
        total: rows.length,
      };
    });
  }, [sortedSections, responses, t]);

  useEffect(() => {
    if (!open) {
      setConfirmed(false);
      setExpanded(new Set());
      return;
    }
    setConfirmed(false);
    setExpanded(
      new Set(
        sortedSections.map((section, i) => sectionKey(section, i)),
      ),
    );
  }, [open, sortedSections]);

  const expandAll = useCallback(() => {
    setExpanded(new Set(checklist.map((c) => c.key)));
  }, [checklist]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set());
  }, []);

  const unansweredCount = Math.max(0, totalQuestions - totalAnswered);
  const allAnswered = totalQuestions > 0 && unansweredCount === 0;
  const progress =
    totalQuestions > 0
      ? Math.min(100, Math.round((totalAnswered / totalQuestions) * 100))
      : 0;

  const doneColor = theme.palette.success.main;
  const pendingColor = theme.palette.warning.main;

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
              flexShrink: 0,
            }}
          >
            <IconWrapper icon="mdi:clipboard-text-outline" size={26} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700} component="div">
              {t("assessments.submitChecklist.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t("assessments.submitChecklist.subtitle")}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          display: "flex",
          flexDirection: "column",
          px: 0,
          py: 0,
          minHeight: 0,
          maxHeight: "min(78vh, 640px)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            px: { xs: 2, sm: 3 },
            pt: 2,
            pb: 1,
          }}
        >
          {strictLinearSectionOrder && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {t("assessments.submitChecklist.strictOrderNotice")}
            </Alert>
          )}
          <Box
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={2}
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                {t("assessments.submitChecklist.summaryTitle")}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {t("assessments.submitChecklist.summaryLine", {
                  answered: totalAnswered,
                  total: totalQuestions,
                })}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 99,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                "& .MuiLinearProgress-bar": { borderRadius: 99 },
              }}
            />
          </Box>

          {allAnswered ? (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              {t("assessments.submitChecklist.allCompleteHint")}
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              {t("assessments.submitChecklist.pendingHint", {
                count: unansweredCount,
              })}
            </Alert>
          )}

          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1.5 }}>
            <ButtonGroup size="small" variant="outlined">
              <Button onClick={expandAll}>
                {t("assessments.submitChecklist.expandAll")}
              </Button>
              <Button onClick={collapseAll}>
                {t("assessments.submitChecklist.collapseAll")}
              </Button>
            </ButtonGroup>
          </Stack>

          <Stack spacing={1} sx={{ pb: 2 }}>
            {checklist.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                {t("assessments.submitChecklist.noSections")}
              </Typography>
            )}
            {checklist.map((block) => {
              const isExpanded = expanded.has(block.key);
              const sectionComplete =
                block.total === 0 || block.answered === block.total;
              return (
                <Accordion
                  key={block.key}
                  expanded={isExpanded}
                  onChange={(_, isExpandedNext) => {
                    setExpanded((prev) => {
                      const next = new Set(prev);
                      if (isExpandedNext) next.add(block.key);
                      else next.delete(block.key);
                      return next;
                    });
                  }}
                  disableGutters
                  elevation={0}
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: "12px !important",
                    overflow: "hidden",
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      px: 2,
                      minHeight: 56,
                      bgcolor: sectionComplete
                        ? alpha(doneColor, 0.06)
                        : alpha(pendingColor, 0.06),
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1.5}
                      sx={{ width: "100%", pr: 1 }}
                    >
                      <IconWrapper
                        icon={
                          sectionComplete
                            ? "mdi:check-decagram"
                            : "mdi:alert-decagram-outline"
                        }
                        size={22}
                        style={{
                          color: sectionComplete ? doneColor : pendingColor,
                          flexShrink: 0,
                        }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap>
                          {block.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t("assessments.submitChecklist.sectionMeta", {
                            answered: block.answered,
                            total: block.total,
                          })}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={sectionTypeLabel(t, block.sectionType)}
                        sx={{ fontWeight: 600, flexShrink: 0 }}
                      />
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0, pt: 0, pb: 1 }}>
                    <List dense disablePadding>
                      {block.rows.map((row, idx) => (
                        <ListItem
                          key={`${block.key}-q-${row.id}`}
                          sx={{
                            px: 2,
                            py: 0.75,
                            borderTop: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <IconWrapper
                              icon={
                                row.completed
                                  ? "mdi:check-circle"
                                  : "mdi:circle-outline"
                              }
                              size={22}
                              style={{
                                color: row.completed
                                  ? doneColor
                                  : theme.palette.text.disabled,
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primaryTypographyProps={{ component: "div" }}
                            secondaryTypographyProps={{ component: "div" }}
                            primary={
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Chip
                                  label={t("assessments.submitChecklist.questionNumber", {
                                    n: idx + 1,
                                  })}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 22, fontWeight: 600 }}
                                />
                                <Typography variant="body2" component="span">
                                  {row.label}
                                </Typography>
                              </Stack>
                            }
                            secondary={
                              <Chip
                                size="small"
                                sx={{
                                  mt: 0.75,
                                  height: 22,
                                  fontWeight: 600,
                                  bgcolor: row.completed
                                    ? alpha(doneColor, 0.12)
                                    : alpha(pendingColor, 0.12),
                                  color: row.completed ? doneColor : pendingColor,
                                }}
                                label={
                                  row.completed
                                    ? t("assessments.submitChecklist.statusDone")
                                    : t("assessments.submitChecklist.statusTodo")
                                }
                              />
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Stack>
        </Box>

        <Box
          sx={{
            flexShrink: 0,
            px: { xs: 2, sm: 3 },
            py: 1.5,
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
            boxShadow: `0 -6px 16px ${alpha(theme.palette.common.black, 0.06)}`,
          }}
        >
          <FormControlLabel
            sx={{ alignItems: "flex-start", ml: 0, mr: 0 }}
            control={
              <Checkbox
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                sx={{ pt: 0.25 }}
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
                {t("assessments.submitChecklist.confirmCheckbox")}
              </Typography>
            }
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={submitting} color="inherit">
          {t("assessments.submitChecklist.cancel")}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={!confirmed || submitting}
          startIcon={<IconWrapper icon="mdi:send-check" />}
        >
          {submitting
            ? t("assessments.submitChecklist.submitting")
            : t("assessments.submitChecklist.confirmSubmit")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
