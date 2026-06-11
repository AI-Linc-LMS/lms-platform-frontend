"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { adminAdaptiveQuizService, type AdminMcq } from "@/lib/services/admin/admin-adaptive-quiz.service";
import {
  totalQuestions,
  type AdaptiveQuizDraft,
  type Difficulty,
} from "@/lib/stores/adaptive-quiz-draft";
import { AIBeacon } from "@/components/adaptive-quiz/shared/AIBeacon";
import { AIPill } from "@/components/adaptive-quiz/shared/AIPill";
import { CellTypewriter } from "@/components/admin/adaptive-quiz/CellTypewriter";

interface Step2GenerateProps {
  draft: AdaptiveQuizDraft;
  setDraft: (next: AdaptiveQuizDraft) => void;
  onComplete: () => void;
}

/**
 * Cell lifecycle:
 *   pending  → queued, waiting for a worker slot
 *   generating → HTTP request in flight (AI is generating)
 *   revealing → response landed; inline typewriter streams each question text
 *               char-by-char. MCQs join the draft as each finishes typing.
 *   done     → all MCQs revealed; cell collapses back to a compact "Done" chip
 *   failed   → network/AI failure with retry-on-next-generate
 */
type CellStatus = "pending" | "generating" | "revealing" | "done" | "failed";

interface CellState {
  sub_skill: string;
  difficulty: Difficulty;
  count: number;
  status: CellStatus;
  mcq_count: number;
  /** Set when status === "revealing" — MCQs being typed out by the typewriter. */
  streamingMcqs?: AdminMcq[];
  error?: string;
  generation_ms?: number;
}

function prettySkill(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function cellKey(sub_skill: string, difficulty: Difficulty): string {
  return `${sub_skill}__${difficulty}`;
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Easy: "#10b981",
  Medium: "#6366f1",
  Hard: "#ef4444",
};

/** Cells that hit OpenAI in parallel — matches the backend's ThreadPoolExecutor
 *  worker count so we don't queue requests behind each other in the browser. */
const CONCURRENCY = 4;

export function Step2Generate({ draft, setDraft, onComplete }: Step2GenerateProps) {
  const initialCells = useMemo<CellState[]>(() => {
    const out: CellState[] = [];
    for (const skill of draft.sub_skills) {
      const cell = draft.matrix[skill];
      if (!cell) continue;
      for (const d of ["Easy", "Medium", "Hard"] as Difficulty[]) {
        const count = cell[d] || 0;
        if (count > 0) out.push({ sub_skill: skill, difficulty: d, count, status: "pending", mcq_count: 0 });
      }
    }
    return out;
  }, [draft.sub_skills, draft.matrix]);

  const [cells, setCells] = useState<CellState[]>(initialCells);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const total = totalQuestions(draft.matrix);
  const completedCount = cells.filter((c) => c.status === "done").length;
  const revealingCount = cells.filter((c) => c.status === "revealing").length;
  const generatingCount = cells.filter((c) => c.status === "generating").length;
  const failedCount = cells.filter((c) => c.status === "failed").length;
  const bankNow = draft.mcqs.length;
  const progress = total > 0 ? Math.min(1, bankNow / total) : 0;

  const allDone =
    cells.length > 0 &&
    cells.every((c) => c.status === "done" || c.status === "failed") &&
    !generating;
  const someSucceeded = cells.some((c) => c.status === "done");

  // Live wall-clock ticker while generation is in flight OR cells are still
  // revealing (so the visible "elapsed" matches what the student perceives).
  const anyInFlight = generating || cells.some((c) => c.status === "generating" || c.status === "revealing");
  const startedAtRef = useRef<number | null>(null);
  useEffect(() => {
    if (!anyInFlight) return;
    if (startedAtRef.current === null) startedAtRef.current = Date.now();
    const handle = window.setInterval(() => {
      if (startedAtRef.current !== null) setElapsedMs(Date.now() - startedAtRef.current);
    }, 200);
    return () => window.clearInterval(handle);
  }, [anyInFlight]);

  const updateCell = useCallback(
    (sub_skill: string, difficulty: Difficulty, patch: Partial<CellState>): void => {
      setCells((prev) =>
        prev.map((c) =>
          c.sub_skill === sub_skill && c.difficulty === difficulty ? { ...c, ...patch } : c,
        ),
      );
    },
    [],
  );

  const liveMcqsRef = useRef<AdminMcq[]>(draft.mcqs);
  useEffect(() => {
    liveMcqsRef.current = draft.mcqs;
  }, [draft.mcqs]);

  const appendOneMcq = useCallback(
    (mcq: AdminMcq) => {
      liveMcqsRef.current = [...liveMcqsRef.current, mcq];
      setDraft({ ...draft, mcqs: liveMcqsRef.current });
    },
    [draft, setDraft],
  );

  async function runCell(cell: CellState): Promise<void> {
    updateCell(cell.sub_skill, cell.difficulty, { status: "generating" });
    try {
      const result = await adminAdaptiveQuizService.generateDraftCell({
        topic: draft.topic.trim(),
        sub_skill: cell.sub_skill,
        difficulty: cell.difficulty,
        count: cell.count,
      });
      if (result.error || result.mcqs.length === 0) {
        updateCell(cell.sub_skill, cell.difficulty, {
          status: "failed",
          error: result.error ?? "AI returned no usable questions.",
          generation_ms: result.generation_ms,
        });
        return;
      }
      updateCell(cell.sub_skill, cell.difficulty, {
        status: "revealing",
        streamingMcqs: result.mcqs,
        mcq_count: 0,
        generation_ms: result.generation_ms,
      });
    } catch (e) {
      updateCell(cell.sub_skill, cell.difficulty, {
        status: "failed",
        error: e instanceof Error ? e.message : "Request failed.",
      });
    }
  }

  async function runWithConcurrency<T>(items: T[], worker: (item: T) => Promise<void>): Promise<void> {
    const queue = [...items];
    function spawn(): Promise<void> {
      const next = queue.shift();
      if (next === undefined) return Promise.resolve();
      return worker(next).then(spawn);
    }
    const slots: Array<Promise<void>> = [];
    for (let i = 0; i < Math.min(CONCURRENCY, items.length); i++) {
      slots.push(spawn());
    }
    await Promise.all(slots);
  }

  async function handleGenerate() {
    if (generating) return;
    setError(null);
    setCells((prev) =>
      prev.map((c) =>
        c.status === "failed" || c.status === "pending"
          ? { ...c, status: "pending", error: undefined, streamingMcqs: undefined }
          : c,
      ),
    );
    setGenerating(true);
    startedAtRef.current = Date.now();

    const toRun = cells.filter((c) => c.status !== "done");
    try {
      await runWithConcurrency(toRun, (cell) => runCell(cell));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation hit an unexpected error.");
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    if (allDone && failedCount === 0 && someSucceeded) {
      const t = window.setTimeout(onComplete, 800);
      return () => window.clearTimeout(t);
    }
  }, [allDone, failedCount, someSucceeded, onComplete]);

  // Idle = no generation has started yet, or fully done with no in-flight.
  const idle = !anyInFlight;
  const ctaLabel = anyInFlight
    ? `Streaming live · ${Math.round(elapsedMs / 1000)}s`
    : draft.mcqs.length > 0 && failedCount === 0
      ? "Regenerate all"
      : failedCount > 0
        ? `Retry ${failedCount} failed`
        : "Start generation";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* ---------- Control-panel hero ---------- */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          p: { xs: 2.5, md: 3 },
          borderRadius: 4,
          background:
            "linear-gradient(135deg, color-mix(in srgb, #6366f1 9%, transparent) 0%, color-mix(in srgb, #a855f7 9%, transparent) 60%, color-mix(in srgb, #ec4899 7%, transparent) 100%)",
          border: "1px solid color-mix(in srgb, #a855f7 25%, transparent)",
          backdropFilter: "blur(22px) saturate(140%)",
        }}
      >
        {/* Ambient glow blob, pulsing while generation is in flight */}
        <Box
          component={motion.div}
          aria-hidden
          animate={
            anyInFlight
              ? { opacity: [0.18, 0.35, 0.18], scale: [1, 1.08, 1] }
              : { opacity: 0.18, scale: 1 }
          }
          transition={{ duration: 2.4, repeat: anyInFlight ? Infinity : 0, ease: "easeInOut" }}
          sx={{
            position: "absolute",
            top: -110,
            right: -100,
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: "radial-gradient(circle, #a855f7 0%, transparent 70%)",
            filter: "blur(30px)",
            pointerEvents: "none",
          }}
        />

        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { md: "center" }, gap: 2.5 }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flex: 1, minWidth: 0 }}>
            <AIBeacon size={56} bpm={anyInFlight ? 60 : 24} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <AIPill icon={<Icon icon="mdi:auto-fix" width={12} />}>
                {anyInFlight ? "Streaming live" : "AI generation"}
              </AIPill>
              <Typography
                sx={{
                  mt: 0.75,
                  fontSize: { xs: "1.4rem", md: "1.7rem" },
                  fontWeight: 900,
                  lineHeight: 1.15,
                  letterSpacing: "-0.025em",
                }}
              >
                {idle
                  ? `Generate ${total} questions`
                  : allDone
                    ? `Generated ${bankNow} questions`
                    : `Generating · ${bankNow} / ${total} so far`}
              </Typography>
              <Typography sx={{ fontSize: "0.84rem", color: "text.secondary", mt: 0.5, lineHeight: 1.5 }}>
                {anyInFlight
                  ? "Each cell streams in live — questions appear in the bank as the AI writes them."
                  : "Run AI generation across every (sub-skill × difficulty) cell. Cells run in parallel."}
              </Typography>
            </Box>
          </Box>
          <ButtonBase
            onClick={() => void handleGenerate()}
            disabled={generating || cells.length === 0}
            sx={{
              px: 3,
              py: 1.4,
              borderRadius: 999,
              fontWeight: 800,
              color: "white",
              background:
                generating || (anyInFlight && !allDone)
                  ? "color-mix(in srgb, #6366f1 35%, transparent)"
                  : "linear-gradient(135deg, #6366f1 0%, #a855f7 60%, #ec4899 100%)",
              boxShadow: anyInFlight ? "none" : "0 18px 36px -16px rgba(168, 85, 247, 0.55)",
              fontSize: "0.92rem",
              minWidth: 200,
              transition: "transform 120ms ease",
              "&:hover": { transform: anyInFlight ? "none" : "translateY(-1px)" },
              "&:disabled": { cursor: "not-allowed", opacity: 0.85 },
            }}
          >
            {ctaLabel}
          </ButtonBase>
        </Box>

        {/* KPI tiles */}
        <Box
          sx={{
            mt: 2.5,
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: 1.25,
          }}
        >
          <KpiTile
            icon="mdi:database-arrow-up"
            label="Bank now"
            value={`${bankNow} / ${total}`}
            accent="#6366f1"
            highlight={bankNow > 0}
          />
          <KpiTile
            icon="mdi:check-circle-outline"
            label="Cells done"
            value={`${completedCount} / ${cells.length}`}
            accent="#10b981"
          />
          <KpiTile
            icon="mdi:fountain-pen-tip"
            label="Streaming"
            value={String(revealingCount + generatingCount)}
            accent="#a855f7"
            highlight={revealingCount + generatingCount > 0}
          />
          <KpiTile
            icon="mdi:timer-outline"
            label="Elapsed"
            value={anyInFlight || elapsedMs > 0 ? `${(elapsedMs / 1000).toFixed(1)}s` : "—"}
            accent="#ec4899"
          />
        </Box>

        {/* Animated progress bar */}
        <Box sx={{ mt: 2, position: "relative", height: 8, borderRadius: 999, overflow: "hidden", bgcolor: "color-mix(in srgb, currentColor 7%, transparent)" }}>
          <Box
            component={motion.div}
            initial={false}
            animate={{ width: `${Math.round(progress * 100)}%` }}
            transition={{ type: "spring", stiffness: 90, damping: 22 }}
            sx={{
              position: "absolute",
              inset: 0,
              borderRadius: 999,
              background:
                "linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
              boxShadow: anyInFlight
                ? "0 0 18px color-mix(in srgb, #a855f7 60%, transparent)"
                : "none",
            }}
          />
          {/* Shimmer overlay while in flight */}
          {anyInFlight && (
            <Box
              component={motion.div}
              aria-hidden
              animate={{ x: ["-20%", "120%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: "30%",
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)",
                mixBlendMode: "screen",
                pointerEvents: "none",
              }}
            />
          )}
        </Box>
      </Box>

      {error && (
        <Typography sx={{ color: "#ef4444", fontWeight: 700 }}>{error}</Typography>
      )}

      {/* ---------- Cell grid ---------- */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 1.5,
          alignItems: "start",
        }}
      >
        {cells.map((c) => (
          <CellChip
            key={cellKey(c.sub_skill, c.difficulty)}
            cell={c}
            onMcqTyped={(mcq) => {
              appendOneMcq(mcq);
              updateCell(c.sub_skill, c.difficulty, { mcq_count: (c.mcq_count ?? 0) + 1 });
            }}
            onAllTyped={() => {
              updateCell(c.sub_skill, c.difficulty, {
                status: "done",
                streamingMcqs: undefined,
              });
            }}
          />
        ))}
      </Box>

      {/* Summary banner */}
      {allDone && (
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          sx={{
            p: 2,
            borderRadius: 3,
            bgcolor:
              failedCount > 0
                ? "color-mix(in srgb, #f59e0b 8%, transparent)"
                : "color-mix(in srgb, #10b981 8%, transparent)",
            border: `1px solid color-mix(in srgb, ${failedCount > 0 ? "#f59e0b" : "#10b981"} 25%, transparent)`,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Icon
            icon={failedCount > 0 ? "mdi:alert-circle-outline" : "mdi:check-circle-outline"}
            width={22}
            style={{ color: failedCount > 0 ? "#f59e0b" : "#10b981" }}
          />
          <Typography sx={{ flex: 1, fontWeight: 700 }}>
            {failedCount > 0
              ? `${draft.mcqs.length} generated · ${failedCount} cell${failedCount === 1 ? "" : "s"} failed — retry to fill in.`
              : `Generated ${draft.mcqs.length} questions in ${Math.round(elapsedMs / 1000)}s. Review them next.`}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KpiTile({
  icon,
  label,
  value,
  accent,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: string;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <Box
      component={motion.div}
      animate={highlight ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={{ duration: 1.6, repeat: highlight ? Infinity : 0, ease: "easeInOut" }}
      sx={{
        px: 1.5,
        py: 1.25,
        borderRadius: 3,
        bgcolor: `color-mix(in srgb, ${accent} 8%, transparent)`,
        border: `1px solid color-mix(in srgb, ${accent} 25%, transparent)`,
        display: "flex",
        alignItems: "center",
        gap: 1,
        position: "relative",
        overflow: "hidden",
        ...(highlight && {
          boxShadow: `0 0 16px color-mix(in srgb, ${accent} 30%, transparent)`,
        }),
      }}
    >
      <Icon icon={icon} width={20} style={{ color: accent, flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: "0.6rem",
            fontWeight: 800,
            letterSpacing: "0.13em",
            textTransform: "uppercase",
            color: "text.secondary",
            lineHeight: 1,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: "1.15rem",
            fontWeight: 900,
            color: accent,
            lineHeight: 1.1,
            mt: 0.35,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

interface CellChipProps {
  cell: CellState;
  onMcqTyped: (mcq: AdminMcq) => void;
  onAllTyped: () => void;
}

function CellChip({ cell, onMcqTyped, onAllTyped }: CellChipProps) {
  const color = DIFFICULTY_COLORS[cell.difficulty];
  const isRevealing = cell.status === "revealing";
  const isGenerating = cell.status === "generating";
  const isDone = cell.status === "done";
  const isFailed = cell.status === "failed";

  const statusUi: Record<CellStatus, { icon: string; label: string; color: string }> = {
    pending: { icon: "mdi:clock-outline", label: "Queued", color: "var(--text-secondary, #6b7280)" },
    generating: { icon: "mdi:loading", label: "Asking AI…", color: "#6366f1" },
    revealing: { icon: "mdi:fountain-pen-tip", label: "Writing live…", color: "#a855f7" },
    done: {
      icon: "mdi:check-circle",
      label: `Done · ${cell.mcq_count} MCQ${cell.mcq_count === 1 ? "" : "s"}`,
      color: "#10b981",
    },
    failed: { icon: "mdi:close-circle", label: "Failed", color: "#ef4444" },
  };
  const s = statusUi[cell.status];

  // Tinted background per state for a clearer at-a-glance read.
  const bgTint =
    isDone
      ? "color-mix(in srgb, #10b981 5%, transparent)"
      : isFailed
        ? "color-mix(in srgb, #ef4444 5%, transparent)"
        : isRevealing
          ? "color-mix(in srgb, #a855f7 6%, transparent)"
          : "color-mix(in srgb, var(--card-bg, #ffffff) 60%, transparent)";

  return (
    <Box
      component={motion.div}
      layout
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      sx={{
        position: "relative",
        overflow: "hidden",
        p: 1.5,
        pt: 2,
        borderRadius: 3,
        bgcolor: bgTint,
        border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 50%, transparent)",
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
        transition: "border-color 220ms ease, background 220ms ease, box-shadow 220ms ease",
        ...(isDone && {
          borderColor: "color-mix(in srgb, #10b981 38%, transparent)",
        }),
        ...(isFailed && {
          borderColor: "color-mix(in srgb, #ef4444 38%, transparent)",
        }),
        ...(isRevealing && {
          borderColor: "color-mix(in srgb, #a855f7 48%, transparent)",
          boxShadow: "0 12px 28px -16px color-mix(in srgb, #a855f7 60%, transparent)",
        }),
      }}
    >
      {/* Top accent strip — colored by difficulty */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${color} 0%, color-mix(in srgb, ${color} 60%, #a855f7) 100%)`,
          opacity: isFailed ? 0.4 : 1,
        }}
      />

      {/* Faint pulse ring while AI is "thinking" — pre-typewriter */}
      {isGenerating && (
        <Box
          component={motion.div}
          aria-hidden
          animate={{ opacity: [0.18, 0.45, 0.18] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: 3,
            background: "radial-gradient(circle at 80% 0%, #6366f1 0%, transparent 60%)",
            opacity: 0.25,
            pointerEvents: "none",
          }}
        />
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, position: "relative" }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 8px color-mix(in srgb, ${color} 60%, transparent)`,
          }}
        />
        <Typography
          sx={{
            fontSize: "0.66rem",
            fontWeight: 800,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color,
          }}
        >
          {cell.difficulty}
        </Typography>
        <Typography sx={{ ml: "auto", fontSize: "0.7rem", color: "text.secondary", fontWeight: 700 }}>
          ×{cell.count}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, lineHeight: 1.3, position: "relative" }}>
        {prettySkill(cell.sub_skill)}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, position: "relative" }}>
        <Icon
          icon={s.icon}
          width={14}
          style={{
            color: s.color,
            animation: isGenerating ? "cellchip-spin 1s linear infinite" : undefined,
          }}
        />
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: s.color }}>
          {s.label}
        </Typography>
        {cell.generation_ms !== undefined && isDone && (
          <Typography sx={{ fontSize: "0.66rem", color: "text.secondary", ml: "auto" }}>
            {(cell.generation_ms / 1000).toFixed(1)}s
          </Typography>
        )}
      </Box>

      {isRevealing && cell.streamingMcqs && cell.streamingMcqs.length > 0 && (
        <CellTypewriter
          mcqs={cell.streamingMcqs}
          onMcqComplete={onMcqTyped}
          onAllComplete={onAllTyped}
        />
      )}

      {isFailed && cell.error && (
        <Typography sx={{ fontSize: "0.66rem", color: "#ef4444", fontStyle: "italic", position: "relative" }}>
          {cell.error.slice(0, 80)}
        </Typography>
      )}
      <style jsx global>{`
        @keyframes cellchip-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
}
