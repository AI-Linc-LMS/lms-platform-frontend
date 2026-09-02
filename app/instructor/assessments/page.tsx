"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { Reveal } from "@/components/scorecard/shared";
import { instructorService, type InstructorAssessment } from "@/lib/services/instructor.service";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";

export default function InstructorGradebookPage() {
  const router = useRouter();
  const [items, setItems] = useState<InstructorAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await instructorService.getAssessments();
        if (!cancelled) setItems(list);
      } catch (e) {
        if (!cancelled) setError(getAxiosErrorDetail(e, "Couldn't load your assessments."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalPending = items.reduce((n, a) => n + a.pending_grading, 0);

  return (
    <PageShell>
      <ModulePageHeader
        eyebrow="Teach"
        title="Gradebook"
        description="Assessments and course quizzes across your batches. Track who has finished what, and what's pending your review."
        accent="amber"
        icon="mdi:clipboard-check-outline"
      />

      {totalPending > 0 && (
        <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, display: "inline-flex", alignItems: "center", gap: 1,
          bgcolor: "color-mix(in srgb, #f59e0b 12%, transparent)", color: "#b45309", fontWeight: 700 }}>
          <Icon icon="mdi:alert-circle-outline" width={18} />
          {totalPending} submission{totalPending === 1 ? "" : "s"} pending your grading
        </Box>
      )}

      {error && <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>{error}</Typography>}
      {!error && !loading && items.length === 0 && (
        <Box sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px dashed var(--border-default)" }}>
          <Typography sx={{ color: "text.secondary" }}>Nothing to grade yet. Assessments mapped to your batches, and course quizzes your students have finished, show up here.</Typography>
        </Box>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
        {items.map((a, i) => {
          const isQuiz = a.kind === "adaptive_quiz";
          // Course, then duration — whichever the row actually has. An adaptive quiz is untimed,
          // and printing "null min" for it is how this line used to read.
          const meta = [a.course_title, a.duration_minutes ? `${a.duration_minutes} min` : null]
            .filter(Boolean)
            .join(" · ");
          // An adaptive quiz has no Assessment row behind it (its id is `quiz-<n>`), so there is
          // no paper to open - only real assessments become clickable.
          const openable = !isQuiz && typeof a.id === "number";
          return (
            <Reveal key={a.id} delay={Math.min(i, 8) * 0.05}>
              <Box
                onClick={openable ? () => router.push(`/instructor/assessments/${a.id}`) : undefined}
                role={openable ? "button" : undefined}
                tabIndex={openable ? 0 : undefined}
                onKeyDown={
                  openable
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(`/instructor/assessments/${a.id}`);
                        }
                      }
                    : undefined
                }
                sx={{ p: 2.25, borderRadius: 3, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)",
                  cursor: openable ? "pointer" : "default", transition: "border-color .15s, transform .15s",
                  "&:hover": openable ? { borderColor: "#f59e0b", transform: "translateY(-2px)" } : undefined }}
              >
                <Stack direction="row" alignItems="flex-start" spacing={1.25}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2.5, flexShrink: 0, display: "grid", placeItems: "center",
                    color: "#fff", background: isQuiz ? "linear-gradient(135deg,#6366f1,#06b6d4)" : "linear-gradient(135deg,#f59e0b,#ec4899)" }}>
                    <Icon icon={isQuiz ? "mdi:head-question-outline" : "mdi:clipboard-text-outline"} width={20} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "1rem" }} noWrap>{a.title}</Typography>
                    {meta && <Typography sx={{ color: "text.secondary", fontSize: "0.82rem" }} noWrap>{meta}</Typography>}
                  </Box>
                  {isQuiz && <Chip size="small" label="course quiz" sx={{ fontWeight: 700 }} />}
                  {a.is_draft && <Chip size="small" label="draft" sx={{ fontWeight: 700 }} />}
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap", gap: 1 }}>
                  <Chip size="small" icon={<Icon icon={isQuiz ? "mdi:account-check-outline" : "mdi:file-document-outline"} width={14} />}
                    label={isQuiz
                      ? `${a.submissions} completed`
                      : `${a.submissions} submission${a.submissions === 1 ? "" : "s"}`} />
                  {isQuiz ? (
                    // An adaptive quiz marks itself, so "to grade" would always read zero. Its
                    // useful number is how the batch actually did.
                    a.avg_accuracy != null && (
                      <Chip size="small" icon={<Icon icon="mdi:target" width={14} />}
                        label={`${a.avg_accuracy}% avg accuracy`}
                        sx={{ fontWeight: 700, color: "#4338ca",
                          bgcolor: "color-mix(in srgb, #6366f1 14%, transparent)" }} />
                    )
                  ) : (
                    <Chip size="small"
                      icon={<Icon icon={a.pending_grading ? "mdi:clock-alert-outline" : "mdi:check-circle-outline"} width={14} />}
                      label={a.pending_grading ? `${a.pending_grading} to grade` : "up to date"}
                      sx={{ fontWeight: 700, color: a.pending_grading ? "#b45309" : "#059669",
                        bgcolor: `color-mix(in srgb, ${a.pending_grading ? "#f59e0b" : "#10b981"} 14%, transparent)` }} />
                  )}
                </Stack>
                {openable && (
                  <Stack direction="row" spacing={0.5} alignItems="center"
                    sx={{ mt: 1.25, color: "text.secondary", fontSize: "0.78rem", fontWeight: 700 }}>
                    <Icon icon="mdi:file-eye-outline" width={14} />
                    View questions and answers
                  </Stack>
                )}
              </Box>
            </Reveal>
          );
        })}
      </Box>
    </PageShell>
  );
}
