"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, ButtonBase, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import {
  adaptiveCourseService,
  type PracticeDifficulty,
  type PracticeItem,
  type PracticeKind,
  type PracticeState,
} from "@/lib/services/adaptive-course.service";

const KIND_CARDS: { kind: PracticeKind; icon: string; title: string; sub: string }[] = [
  { kind: "article", icon: "mdi:file-document-outline", title: "Article", sub: "Explainer at your level" },
  { kind: "quiz", icon: "mdi:help-circle-outline", title: "Quiz", sub: "Adaptive MCQs" },
  { kind: "coding", icon: "mdi:laptop", title: "Coding", sub: "Hands-on problems" },
];

const DIFFS: { value: PracticeDifficulty; label: string; color: string }[] = [
  { value: "Easy", label: "Easy", color: "#16a34a" },
  { value: "Medium", label: "Medium", color: "#d97706" },
  { value: "Hard", label: "Hard", color: "#dc2626" },
  { value: "match", label: "✦ Match me", color: "#7c3aed" },
];

const COUNTS = [3, 5, 10];

const KIND_META: Record<PracticeKind, { icon: string; color: string; bg: string; unit: string }> = {
  article: { icon: "mdi:file-document-outline", color: "#a855f7", bg: "#f5f3ff", unit: "explainer" },
  quiz: { icon: "mdi:help-circle", color: "#6366f1", bg: "#eef2ff", unit: "questions" },
  coding: { icon: "mdi:laptop", color: "#ec4899", bg: "#fdf2f8", unit: "problems" },
};

export function AdditionalPractice({ courseId, submoduleId }: { courseId: number; submoduleId: number }) {
  const router = useRouter();
  const [state, setState] = useState<PracticeState | null>(null);
  const [open, setOpen] = useState(true);
  const [kind, setKind] = useState<PracticeKind>("quiz");
  const [difficulty, setDifficulty] = useState<PracticeDifficulty>("match");
  const [count, setCount] = useState(5);
  const [custom, setCustom] = useState(false);
  const [focus, setFocus] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adaptiveCourseService
      .getSubmodulePractice(courseId, submoduleId)
      .then((s) => { if (!cancelled) setState(s); })
      .catch(() => { if (!cancelled) setState({ usage: { used: 0, limit: 20, left: 20, by_kind: { quiz: 0, coding: 0, article: 0 } }, items: [] }); });
    return () => { cancelled = true; };
  }, [courseId, submoduleId]);

  const usage = state?.usage;
  const used = usage?.used ?? 0;
  const limit = usage?.limit ?? 20;
  const left = usage?.left ?? 0;
  const pct = limit ? Math.min(100, (used / limit) * 100) : 0;
  const items = state?.items ?? [];

  const need = kind === "article" ? 1 : count;
  const canGenerate = !generating && left > 0 && need <= left;
  const btnUnit = kind === "article" ? "explainer" : `${count} ${KIND_META[kind].unit}`;

  const openItem = (it: PracticeItem) => {
    if (it.kind === "quiz" && it.config_id) router.push(`/adaptive-quizzes/start?configId=${it.config_id}`);
    else if (it.kind === "coding" && it.problem_id) router.push(`/adaptive-courses/${courseId}/submodule/${submoduleId}/coding/${it.problem_id}?configId=${it.config_id}`);
    else if (it.kind === "article" && it.article_id) router.push(`/adaptive-courses/${courseId}/submodule/${submoduleId}/article/${it.article_id}`);
  };

  const generate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await adaptiveCourseService.generatePractice(courseId, submoduleId, {
        kind, difficulty, count, focus: focus.trim(),
      });
      setState({ usage: res.usage, items: res.items });
      setFocus("");
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail || "Couldn't generate practice right now. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const exhausted = left <= 0;

  return (
    <Box sx={{ mt: 3, borderRadius: 4, border: "1.5px solid #ddd6fe", overflow: "hidden", bgcolor: "#fff" }}>
      {/* Header band */}
      <Box sx={{ p: { xs: 2, md: 2.5 }, background: "linear-gradient(180deg, #faf5ff 0%, #f5f3ff 100%)", borderBottom: open ? "1px solid #ede9fe" : "none" }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          <Box sx={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)", boxShadow: "0 8px 20px -8px rgba(124,58,237,0.6)" }}>
            <Icon icon="mdi:auto-fix" width={24} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", color: "#1e1b4b" }}>Additional Practice</Typography>
              <Stack direction="row" spacing={0.3} alignItems="center" sx={{ px: 1, py: 0.3, borderRadius: 999, color: "white", background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" }}>
                <Icon icon="mdi:plus" width={12} />
                <Typography sx={{ fontSize: "0.66rem", fontWeight: 800 }}>Generate</Typography>
              </Stack>
            </Stack>
            <Typography sx={{ fontSize: "0.84rem", color: "#475569", mt: 0.25 }}>
              Want more reps on this topic? Generate extra content tuned to your level.{" "}
              <Box component="span" sx={{ fontWeight: 800, color: "#1e293b" }}>Practice only — these don&apos;t earn points.</Box>
            </Typography>
          </Box>
          {/* Quota meter */}
          <Box sx={{ minWidth: 150, textAlign: "right", flexShrink: 0, display: { xs: "none", sm: "block" } }}>
            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#1e1b4b" }}>
              <Box component="span" sx={{ color: "#7c3aed", fontWeight: 900 }}>{used}</Box> / {limit} generated
            </Typography>
            <Box sx={{ height: 6, borderRadius: 999, bgcolor: "#ede9fe", mt: 0.5, overflow: "hidden" }}>
              <Box sx={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: "linear-gradient(90deg, #7c3aed 0%, #ec4899 100%)", transition: "width .3s" }} />
            </Box>
            <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8", mt: 0.4 }}>{left} left for this topic</Typography>
          </Box>
          <ButtonBase onClick={() => setOpen((o) => !o)} sx={{ width: 30, height: 30, borderRadius: 2, border: "1px solid #ddd6fe", color: "#7c3aed", flexShrink: 0 }}>
            <Icon icon={open ? "mdi:chevron-up" : "mdi:chevron-down"} width={20} />
          </ButtonBase>
        </Stack>
      </Box>

      {open && (
        <Box sx={{ p: { xs: 2, md: 2.5 } }}>
          {/* Step 1 — what to generate */}
          <StepLabel n={1} text="WHAT DO YOU WANT TO GENERATE?" />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.5, mb: 2.5 }}>
            {KIND_CARDS.map((c) => {
              const active = kind === c.kind;
              const m = KIND_META[c.kind];
              return (
                <ButtonBase key={c.kind} onClick={() => setKind(c.kind)} sx={{
                  p: 2, borderRadius: 3, border: "1.5px solid", textAlign: "center", flexDirection: "column", gap: 0.5,
                  borderColor: active ? m.color : "#e5e7eb", bgcolor: active ? m.bg : "#fff",
                  transition: "border-color .15s, background .15s", position: "relative",
                }}>
                  {active && <Icon icon="mdi:check" width={16} color={m.color} style={{ position: "absolute", top: 8, right: 8 }} />}
                  <Box sx={{ color: active ? m.color : "#94a3b8" }}><Icon icon={c.icon} width={28} /></Box>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: active ? m.color : "#334155" }}>{c.title}</Typography>
                  <Typography sx={{ fontSize: "0.74rem", color: "#94a3b8" }}>{c.sub}</Typography>
                </ButtonBase>
              );
            })}
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 2, md: 3 }, mb: 2 }}>
            {/* Step 2 — difficulty */}
            <Box>
              <StepLabel n={2} text="DIFFICULTY" />
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {DIFFS.map((d) => {
                  const active = difficulty === d.value;
                  return (
                    <ButtonBase key={d.value} onClick={() => setDifficulty(d.value)} sx={{
                      px: 1.75, py: 0.85, borderRadius: 999, fontWeight: 700, fontSize: "0.84rem", border: "1.5px solid",
                      borderColor: active ? d.color : "#e5e7eb",
                      bgcolor: active ? d.color : "#fff", color: active ? "#fff" : "#475569",
                      transition: "all .15s",
                    }}>
                      {d.label}
                    </ButtonBase>
                  );
                })}
              </Stack>
            </Box>

            {/* Step 3 — how many (hidden for article) */}
            {kind !== "article" && (
              <Box>
                <StepLabel n={3} text={`HOW MANY`} hint={`MAX ${left} LEFT`} />
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                  {COUNTS.map((c) => {
                    const active = !custom && count === c;
                    const disabled = c > left;
                    return (
                      <ButtonBase key={c} disabled={disabled} onClick={() => { setCustom(false); setCount(c); }} sx={{
                        minWidth: 48, px: 1.5, py: 0.85, borderRadius: 2, fontWeight: 800, fontSize: "0.9rem", border: "1.5px solid",
                        borderColor: active ? "#7c3aed" : "#e5e7eb", color: active ? "#7c3aed" : disabled ? "#cbd5e1" : "#475569",
                        bgcolor: active ? "#f5f3ff" : "#fff", opacity: disabled ? 0.5 : 1,
                      }}>
                        {c}
                      </ButtonBase>
                    );
                  })}
                  <ButtonBase onClick={() => setCustom(true)} sx={{
                    px: 1.5, py: 0.85, borderRadius: 2, fontWeight: 700, fontSize: "0.84rem", border: "1.5px solid",
                    borderColor: custom ? "#7c3aed" : "#e5e7eb", color: custom ? "#7c3aed" : "#475569", bgcolor: custom ? "#f5f3ff" : "#fff",
                  }}>
                    Custom…
                  </ButtonBase>
                  {custom && (
                    <TextField
                      type="number" size="small" value={count}
                      onChange={(e) => setCount(Math.max(1, Math.min(Number(e.target.value) || 1, Math.min(10, left || 10))))}
                      inputProps={{ min: 1, max: Math.min(10, left || 10), style: { width: 56, padding: "8px" } }}
                    />
                  )}
                </Stack>
              </Box>
            )}
          </Box>

          {/* Focus + generate */}
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "stretch" }} sx={{ mb: 1.5 }}>
            <TextField
              fullWidth size="small" value={focus} onChange={(e) => setFocus(e.target.value)}
              placeholder={'Optional: focus on… e.g. "string slicing & f-strings"'}
              InputProps={{ startAdornment: <Icon icon="mdi:target" width={16} style={{ marginRight: 8, color: "#a855f7", flexShrink: 0 }} /> }}
            />
            <ButtonBase onClick={generate} disabled={!canGenerate} sx={{
              flexShrink: 0, px: 3, py: 1.2, borderRadius: 2, fontWeight: 800, fontSize: "0.9rem", color: "white", gap: 0.75, whiteSpace: "nowrap",
              background: canGenerate ? "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)" : "#cbd5e1",
              boxShadow: canGenerate ? "0 12px 28px -14px rgba(124,58,237,0.7)" : "none",
            }}>
              {generating ? <CircularProgress size={16} sx={{ color: "white" }} /> : <Icon icon="mdi:auto-fix" width={18} />}
              {generating ? "Generating…" : exhausted ? "Topic limit reached" : `Generate ${btnUnit}`}
            </ButtonBase>
          </Stack>

          {error && <Typography sx={{ fontSize: "0.8rem", color: "#dc2626", mb: 1, fontWeight: 600 }}>{error}</Typography>}

          <Stack direction="row" spacing={0.6} alignItems="flex-start">
            <Icon icon="mdi:information-outline" width={14} style={{ color: "#94a3b8", marginTop: 2, flexShrink: 0 }} />
            <Typography sx={{ fontSize: "0.74rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Generated practice is unlimited to retry but capped at{" "}
              <Box component="span" sx={{ fontWeight: 800, color: "#475569" }}>{limit} new items per topic</Box>{" "}
              to keep your path focused. Resets if the topic is re-published.
            </Typography>
          </Stack>

          {/* Your generated practice */}
          {items.length > 0 && (
            <Box sx={{ mt: 2.5, pt: 2.5, borderTop: "1px solid #f1f5f9" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: 0.6, color: "#64748b" }}>
                  YOUR GENERATED PRACTICE ({items.length})
                </Typography>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ px: 1, py: 0.3, borderRadius: 999, bgcolor: "#f1f5f9", fontSize: "0.66rem", fontWeight: 800, color: "#475569" }}>Practice · no points</Box>
                  <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8", display: { xs: "none", sm: "block" } }}>doesn&apos;t affect score or rank</Typography>
                </Stack>
              </Stack>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.25 }}>
                {items.map((it) => {
                  const m = KIND_META[it.kind];
                  return (
                    <Stack key={it.id} direction="row" alignItems="center" spacing={1.25} sx={{ p: 1.5, borderRadius: 2.5, border: "1px solid #eef2f7" }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: 2, flexShrink: 0, display: "grid", placeItems: "center", color: m.color, bgcolor: m.bg }}>
                        <Icon icon={m.icon} width={19} />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</Typography>
                        <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "capitalize" }}>
                          {it.kind} · {it.item_count} {it.kind === "article" ? "explainer" : it.kind === "coding" ? "problem" + (it.item_count > 1 ? "s" : "") : "MCQ" + (it.item_count > 1 ? "s" : "")}
                        </Typography>
                      </Box>
                      <ButtonBase onClick={() => openItem(it)} sx={{ flexShrink: 0, px: 1.75, py: 0.7, borderRadius: 999, fontWeight: 800, fontSize: "0.8rem", color: m.color, border: `1px solid ${m.color}`, gap: 0.4 }}>
                        Open <Icon icon="mdi:arrow-right" width={14} />
                      </ButtonBase>
                    </Stack>
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

function StepLabel({ n, text, hint }: { n: number; text: string; hint?: string }) {
  return (
    <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: 0.6, color: "#64748b", mb: 1 }}>
      {n} · {text}{hint ? <Box component="span" sx={{ color: "#cbd5e1", ml: 0.75 }}>({hint})</Box> : null}
    </Typography>
  );
}
