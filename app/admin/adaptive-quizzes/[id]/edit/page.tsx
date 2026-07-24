"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  ButtonBase,
  Container,
  Slider,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import {
  adminAdaptiveQuizService,
  type AdminAdaptiveQuizDetail,
  type AdminMcq,
} from "@/lib/services/admin/admin-adaptive-quiz.service";
import { MCQReviewTable } from "@/components/admin/adaptive-quiz/MCQReviewTable";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";

type LocalMcq = AdminMcq;

export default function EditAdaptiveQuizPage() {
  const params = useParams<{ id: string }>();
  const configId = Number(params.id);
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminAdaptiveQuizDetail | null>(null);

  // Local editable state.
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [minQ, setMinQ] = useState(8);
  const [maxQ, setMaxQ] = useState(20);
  const [seThreshold, setSeThreshold] = useState(0.35);
  const [hintTokens, setHintTokens] = useState(2);
  const [confidencePrompt, setConfidencePrompt] = useState(true);
  const [mcqs, setMcqs] = useState<LocalMcq[]>([]);
  const [initialIds, setInitialIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await adminAdaptiveQuizService.getDetail(configId);
      setDetail(d);
      setTitle(d.title);
      setInstructions(d.instructions);
      setMinQ(d.min_questions);
      setMaxQ(d.max_questions);
      setSeThreshold(d.se_threshold);
      setHintTokens(d.hint_tokens);
      setConfidencePrompt(d.confidence_prompt_enabled);
      setMcqs(d.mcqs.map((m) => ({ ...m })));
      setInitialIds(new Set(d.mcqs.map((m) => m.id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load quiz.");
    } finally {
      setLoading(false);
    }
  }, [configId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Build the diff payload - only send what's actually changed so the backend's
  // dirty-checks have an easy time.
  const diff = useMemo(() => {
    if (!detail) return null;
    const currentIds = new Set(mcqs.filter((m) => m.id !== undefined).map((m) => m.id as number));
    const deletedIds: number[] = [];
    initialIds.forEach((id) => {
      if (!currentIds.has(id)) deletedIds.push(id);
    });
    return {
      config_fields: {
        target_skills: detail.target_skills, // unchanged for now - tweak below if you add a UI for it
        min_questions: minQ,
        max_questions: maxQ,
        se_threshold: seThreshold,
        hint_tokens: hintTokens,
        confidence_prompt_enabled: confidencePrompt,
      },
      quiz_title: title,
      quiz_instructions: instructions,
      mcqs_upsert: mcqs,
      mcqs_delete: deletedIds,
    };
  }, [detail, mcqs, initialIds, title, instructions, minQ, maxQ, seThreshold, hintTokens, confidencePrompt]);

  async function handleSave() {
    if (!detail || !diff || saving) return;
    setSaving(true);
    try {
      const next = await adminAdaptiveQuizService.update(configId, diff);
      showToast("Saved.", "success");
      // Refresh local state from server so MCQ ids of newly-created rows land.
      setDetail(next);
      setMcqs(next.mcqs.map((m) => ({ ...m })));
      setInitialIds(new Set(next.mcqs.map((m) => m.id)));
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't save.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <Container sx={{ py: 8 }}>
          <Typography sx={{ textAlign: "center", color: "text.secondary" }}>Loading…</Typography>
        </Container>
      </MainLayout>
    );
  }

  if (error || !detail) {
    return (
      <MainLayout>
        <Container sx={{ py: 8 }}>
          <Typography sx={{ textAlign: "center", color: "#ef4444", fontWeight: 700 }}>
            {error ?? "Quiz not found."}
          </Typography>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <AdaptiveSectionShell>
          <AdaptiveSectionHero
            chapter="Edit · Adaptive Engine"
            title={detail.title}
            subtitle="Tweak the engine tunables and the MCQ bank. Use AI regenerate on any row to swap in a fresh question; changes save together."
            icon="mdi:pencil-circle"
            accent="emerald"
            rightSlot={
              <Box sx={{ display: "flex", gap: 1 }}>
                <ButtonBase
                  onClick={() => router.push("/admin/adaptive-quizzes")}
                  sx={{
                    px: 2.25,
                    py: 1,
                    borderRadius: 999,
                    fontWeight: 700,
                    color: "text.secondary",
                    border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                    fontSize: "0.82rem",
                  }}
                >
                  Back to list
                </ButtonBase>
                <ButtonBase
                  onClick={() => void handleSave()}
                  disabled={saving}
                  sx={{
                    px: 3,
                    py: 1.1,
                    borderRadius: 999,
                    fontWeight: 800,
                    color: "white",
                    background: saving
                      ? "color-mix(in srgb, #10b981 40%, transparent)"
                      : "linear-gradient(135deg, #10b981 0%, #6366f1 100%)",
                    fontSize: "0.88rem",
                    "&:disabled": { cursor: "not-allowed" },
                  }}
                >
                  {saving ? "Saving…" : "Save changes"}
                </ButtonBase>
              </Box>
            }
          />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

          {/* Config panel */}
          <Box
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 4,
              bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 65%, transparent)",
              border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 60%, transparent)",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", letterSpacing: "-0.01em" }}>
              Configuration
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
              <TextField
                label="Instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                fullWidth
              />
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
              <Box>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>
                  Session length · {minQ}–{maxQ}
                </Typography>
                <Slider
                  value={[minQ, maxQ]}
                  onChange={(_, next) => {
                    if (!Array.isArray(next)) return;
                    const [a, b] = next;
                    setMinQ(Math.min(a, b));
                    setMaxQ(Math.max(a, b));
                  }}
                  min={3}
                  max={Math.max(maxQ, 25)}
                  valueLabelDisplay="auto"
                />
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>
                  Stop threshold · SE ≤ {seThreshold.toFixed(2)}
                </Typography>
                <Slider
                  value={seThreshold}
                  onChange={(_, next) => setSeThreshold(next as number)}
                  min={0.2}
                  max={0.6}
                  step={0.05}
                  valueLabelDisplay="auto"
                />
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>Hint tokens · {hintTokens}</Typography>
                <Slider
                  value={hintTokens}
                  onChange={(_, next) => setHintTokens(next as number)}
                  min={0}
                  max={5}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Switch
                  checked={confidencePrompt}
                  onChange={(_, v) => setConfidencePrompt(v)}
                />
                <Box>
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 700 }}>Pre-submit confidence prompt</Typography>
                  <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                    Asks students how sure they are before each submit.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Question bank */}
          <Box
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 4,
              bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 65%, transparent)",
              border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 60%, transparent)",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", letterSpacing: "-0.01em" }}>
                Question bank ({mcqs.length})
              </Typography>
              <Typography sx={{ fontSize: "0.74rem", color: "text.secondary" }}>
                Click a question to edit · use Regenerate to swap one with AI
              </Typography>
            </Box>
            <MCQReviewTable
              mcqs={mcqs}
              topic={detail.title}
              onChange={setMcqs}
              enableRegenerate
            />
          </Box>
          </Box>
        </AdaptiveSectionShell>
      </Container>
    </MainLayout>
  );
}
