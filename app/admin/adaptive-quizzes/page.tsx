"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, ButtonBase, Container, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useToast } from "@/components/common/Toast";
import { KpiRail, Reveal } from "@/components/scorecard/shared";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";
import {
  adminAdaptiveQuizService,
  type AdminAdaptiveQuiz,
} from "@/lib/services/admin/admin-adaptive-quiz.service";
import { AdminQuizCard } from "@/components/admin/adaptive-quiz/AdminQuizCard";

export default function AdminAdaptiveQuizzesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [items, setItems] = useState<AdminAdaptiveQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminAdaptiveQuiz | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await adminAdaptiveQuizService.list();
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load adaptive quizzes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const active = items.filter((i) => i.is_active).length;
    const skillSet = new Set<string>();
    let totalMcqs = 0;
    for (const it of items) {
      for (const s of it.target_skills) if (s) skillSet.add(s);
      totalMcqs += it.mcq_count;
    }
    return {
      total: items.length,
      active,
      inactive: items.length - active,
      skills: skillSet.size,
      mcqs: totalMcqs,
    };
  }, [items]);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await adminAdaptiveQuizService.deleteQuiz(pendingDelete.config_id);
      // Drop the row from the list immediately - the backend soft-deletes
      // (is_deleted=true) so the row would also vanish on next reload, but
      // the optimistic removal here makes the action feel instant.
      setItems((prev) =>
        prev.filter((q) => q.config_id !== pendingDelete.config_id),
      );
      showToast(`"${pendingDelete.title}" deleted.`, "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't delete.", "error");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  return (
    <MainLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <AdaptiveSectionShell>
          <AdaptiveSectionHero
            chapter="Manage · Adaptive Engine"
            title="Adaptive Quizzes"
            subtitle="Spin up adaptive quizzes from scratch - pick a topic + sub-skills, the engine generates the MCQ bank, you review and publish. Existing quizzes can be edited inline, toggled live, or retired with one click."
            icon="mdi:brain"
            accent="indigo"
            rightSlot={
              <ButtonBase
                onClick={() => router.push("/admin/adaptive-quizzes/create")}
                sx={{
                  px: 3,
                  py: 1.4,
                  borderRadius: 999,
                  fontWeight: 800,
                  color: "white",
                  background: "linear-gradient(135deg, #6366f1 0%, #a855f7 60%, #ec4899 100%)",
                  boxShadow: "0 18px 36px -16px rgba(168, 85, 247, 0.55)",
                  fontSize: "0.92rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  "&:hover": { transform: "translateY(-1px)" },
                  transition: "transform 120ms ease",
                }}
              >
                <Icon icon="mdi:auto-fix" width={16} />
                Create new (AI)
              </ButtonBase>
            }
          />

          {items.length > 0 && (
            <KpiRail
              items={[
                { value: stats.total, label: "Total quizzes", accent: "#6366f1" },
                { value: stats.active, label: "Active", accent: "#10b981" },
                { value: stats.inactive, label: "Inactive", accent: "#94a3b8" },
                { value: stats.skills, label: "Skills covered", accent: "#a855f7" },
                { value: stats.mcqs, label: "Total MCQs", accent: "#ec4899" },
              ]}
            />
          )}

          {loading && (
            <Typography sx={{ color: "text.secondary", textAlign: "center", py: 6 }}>
              Loading…
            </Typography>
          )}

          {error && (
            <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>
              {error}
            </Typography>
          )}

          {!loading && !error && items.length === 0 && (
            <Box
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: 4,
                textAlign: "center",
                bgcolor: "color-mix(in srgb, var(--card-bg) 60%, transparent)",
                border: "1px dashed color-mix(in srgb, var(--border-default) 90%, transparent)",
              }}
            >
              <Icon icon="mdi:robot-confused-outline" width={48} style={{ color: "#a855f7" }} />
              <Typography sx={{ fontWeight: 800, mt: 1.5, fontSize: "1.1rem" }}>
                No adaptive quizzes yet.
              </Typography>
              <Typography sx={{ color: "text.secondary", mt: 0.75, maxWidth: 520, mx: "auto", lineHeight: 1.5 }}>
                Click <strong>+ Create new (AI)</strong> to start a wizard - pick a topic, sub-skills, and a difficulty mix; the engine generates the MCQ bank, you review and publish.
              </Typography>
            </Box>
          )}

          {!loading && !error && items.length > 0 && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                gap: 2,
                alignItems: "stretch",
              }}
            >
              {items.map((q, idx) => (
                <Reveal key={q.config_id} delay={Math.min(idx, 8) * 0.05}>
                  <AdminQuizCard
                    quiz={q}
                    onAfterToggle={(next) =>
                      setItems((prev) =>
                        prev.map((x) => (x.config_id === next.config_id ? next : x)),
                      )
                    }
                    onRequestDelete={(quiz) => setPendingDelete(quiz)}
                  />
                </Reveal>
              ))}
            </Box>
          )}
        </AdaptiveSectionShell>
      </Container>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete adaptive quiz"
        message={
          pendingDelete
            ? `"${pendingDelete.title}" will be removed from the library for everyone. Past learner attempts and per-question history stay intact - only the quiz itself goes away.`
            : ""
        }
        confirmText={deleting ? "Deleting…" : "Delete"}
        cancelText="Cancel"
        confirmColor="error"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </MainLayout>
  );
}
