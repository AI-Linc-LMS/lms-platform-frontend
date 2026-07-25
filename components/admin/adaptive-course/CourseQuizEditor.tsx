"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useToast } from "@/components/common/Toast";
import {
  adminAdaptiveQuizService,
  type AdminMcq,
} from "@/lib/services/admin/admin-adaptive-quiz.service";
import { MCQReviewTable } from "@/components/admin/adaptive-quiz/MCQReviewTable";

interface CourseQuizEditorProps {
  configId: number;
  /** Submodule/quiz title - used as the regenerate topic context. */
  topic: string;
  /** Notifies the parent of the saved MCQ count so the course tree can refresh. */
  onSaved?: (configId: number, mcqCount: number) => void;
}

function isComplete(m: AdminMcq): boolean {
  return Boolean(
    m.question_text.trim() &&
      m.option_a.trim() &&
      m.option_b.trim() &&
      m.option_c.trim() &&
      m.option_d.trim(),
  );
}

/**
 * Inline question editor for one course quiz (an AdaptiveQuizConfig). Lazy-loads
 * the quiz's MCQs on mount, reuses the shared MCQReviewTable (view / inline edit
 * / per-row AI regenerate / delete), supports adding a blank question, and saves
 * the diff via the same admin endpoint the standalone quiz editor uses.
 */
export function CourseQuizEditor({ configId, topic, onSaved }: CourseQuizEditorProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mcqs, setMcqs] = useState<AdminMcq[]>([]);
  const [initialIds, setInitialIds] = useState<Set<number>>(new Set());
  const [targetSkills, setTargetSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await adminAdaptiveQuizService.getDetail(configId);
      setMcqs(d.mcqs.map((m) => ({ ...m })));
      setInitialIds(new Set(d.mcqs.map((m) => m.id)));
      setTargetSkills(d.target_skills || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load questions.");
    } finally {
      setLoading(false);
    }
  }, [configId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAddQuestion() {
    if (adding) return;
    setAdding(true);
    try {
      // Spread new questions across the quiz's skills so the bank stays balanced.
      const skill = targetSkills.length ? targetSkills[mcqs.length % targetSkills.length] : topic;
      const mcq = await adminAdaptiveQuizService.regenerateQuestion({
        topic,
        sub_skill: skill,
        difficulty: "Medium",
      });
      setMcqs((prev) => [...prev, mcq]);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't generate a question.", "error");
    } finally {
      setAdding(false);
    }
  }

  async function handleSave() {
    if (saving) return;
    const upserts = mcqs.filter(isComplete);
    const skipped = mcqs.length - upserts.length;
    const currentIds = new Set(mcqs.filter((m) => m.id !== undefined).map((m) => m.id as number));
    const deletedIds: number[] = [];
    initialIds.forEach((id) => {
      if (!currentIds.has(id)) deletedIds.push(id);
    });
    setSaving(true);
    try {
      const next = await adminAdaptiveQuizService.update(configId, {
        mcqs_upsert: upserts,
        mcqs_delete: deletedIds,
      });
      setMcqs(next.mcqs.map((m) => ({ ...m })));
      setInitialIds(new Set(next.mcqs.map((m) => m.id)));
      onSaved?.(configId, next.mcqs.length);
      showToast(
        skipped > 0 ? `Saved. ${skipped} incomplete question(s) skipped.` : "Saved.",
        skipped > 0 ? "info" : "success",
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't save.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Typography sx={{ color: "text.secondary", fontSize: "0.82rem", py: 2 }}>
        Loading questions…
      </Typography>
    );
  }
  if (error) {
    return (
      <Typography sx={{ color: "#ef4444", fontSize: "0.82rem", fontWeight: 700, py: 2 }}>
        {error}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
      <MCQReviewTable mcqs={mcqs} topic={topic} onChange={setMcqs} enableRegenerate />

      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <ButtonBase
          onClick={() => void handleAddQuestion()}
          disabled={adding}
          sx={{
            px: 2, py: 0.85, borderRadius: 999, fontWeight: 800, fontSize: "0.8rem",
            color: "#6366f1", border: "1px solid color-mix(in srgb, #6366f1 40%, transparent)",
            display: "inline-flex", alignItems: "center", gap: 0.5,
            "&:disabled": { opacity: 0.6, cursor: "not-allowed" },
          }}
        >
          <Icon icon={adding ? "mdi:loading" : "mdi:auto-fix"} width={15} className={adding ? "acb-spin" : ""} />
          {adding ? "Writing…" : "Add question (AI)"}
        </ButtonBase>
        <ButtonBase
          onClick={() => void handleSave()}
          disabled={saving}
          sx={{
            px: 2.5, py: 0.85, borderRadius: 999, fontWeight: 800, fontSize: "0.8rem", color: "white",
            gap: 0.5, display: "inline-flex", alignItems: "center",
            background: saving ? "color-mix(in srgb, #10b981 45%, transparent)" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            "&:disabled": { cursor: "not-allowed", opacity: 0.6 },
          }}
        >
          <Icon icon={saving ? "mdi:loading" : "mdi:content-save"} width={15} className={saving ? "acb-spin" : ""} />
          {saving ? "Saving…" : "Save questions"}
        </ButtonBase>
      </Box>
      <style jsx global>{`
        @keyframes acb-spin { to { transform: rotate(360deg); } }
        .acb-spin { animation: acb-spin 0.9s linear infinite; }
      `}</style>
    </Box>
  );
}
