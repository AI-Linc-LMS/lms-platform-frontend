"use client";

import { useMemo, useState } from "react";
import {
  Box,
  ButtonBase,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import {
  adminAdaptiveQuizService,
  type AdminMcq,
} from "@/lib/services/admin/admin-adaptive-quiz.service";
import { CellTypewriter } from "@/components/admin/adaptive-quiz/CellTypewriter";

interface MCQReviewTableProps {
  mcqs: AdminMcq[];
  topic: string;
  onChange: (next: AdminMcq[]) => void;
  /** When true, per-row "Regenerate" is shown and wired to the AI endpoint. */
  enableRegenerate?: boolean;
}

const PAGE_SIZE = 5;
const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
const DIFFICULTY_COLORS: Record<(typeof DIFFICULTIES)[number], string> = {
  Easy: "#10b981",
  Medium: "#6366f1",
  Hard: "#ef4444",
};

function prettySkill(s: string): string {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Shared paginated MCQ review/edit table used by:
 *   • Create wizard, Step 3 (with regenerate)
 *   • Edit page (with regenerate)
 *
 * Every field is inline-editable. Changes propagate up via ``onChange`` so the
 * parent owns the canonical draft state.
 *
 * Regenerate flow runs through the same per-cell typewriter used in Step 2 of
 * the create wizard: the row goes ``asking → revealing → done`` and the new
 * question text streams in char-by-char before the row commits.
 */
export function MCQReviewTable({
  mcqs,
  topic,
  onChange,
  enableRegenerate = true,
}: MCQReviewTableProps) {
  const [page, setPage] = useState(0);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  // "asking" = AI call in flight; "revealing" = response landed, typewriter running.
  const [regenStage, setRegenStage] = useState<"idle" | "asking" | "revealing">("idle");
  const [regenIdx, setRegenIdx] = useState<number | null>(null);
  const [regenError, setRegenError] = useState<string | null>(null);
  // The AI-returned replacement, held until the typewriter finishes its reveal.
  const [pendingReplacement, setPendingReplacement] = useState<AdminMcq | null>(null);

  const totalPages = Math.max(1, Math.ceil(mcqs.length / PAGE_SIZE));
  const pageMcqs = mcqs.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  // Skill × difficulty pivot for the header.
  const pivot = useMemo(() => {
    const out: Record<string, Record<string, number>> = {};
    for (const m of mcqs) {
      const skill = m.skills || "general";
      out[skill] ??= { Easy: 0, Medium: 0, Hard: 0 };
      out[skill][m.difficulty_level] = (out[skill][m.difficulty_level] || 0) + 1;
    }
    return out;
  }, [mcqs]);

  function updateAt(absoluteIdx: number, patch: Partial<AdminMcq>) {
    onChange(mcqs.map((m, i) => (i === absoluteIdx ? { ...m, ...patch } : m)));
  }

  function deleteAt(absoluteIdx: number) {
    onChange(mcqs.filter((_, i) => i !== absoluteIdx));
    if (expandedIdx === absoluteIdx) setExpandedIdx(null);
  }

  async function regenerateAt(absoluteIdx: number) {
    if (regenStage !== "idle") return;
    const target = mcqs[absoluteIdx];
    if (!target) return;
    setRegenIdx(absoluteIdx);
    setRegenStage("asking");
    setRegenError(null);
    setPendingReplacement(null);
    try {
      const replacement = await adminAdaptiveQuizService.regenerateQuestion({
        topic: topic || target.topic || "general",
        sub_skill: target.skills || "general",
        difficulty: target.difficulty_level,
      });
      // Defer commit - the typewriter component will trigger the swap once the
      // new question text has finished streaming in for the magic-reveal feel.
      setPendingReplacement(replacement);
      setRegenStage("revealing");
    } catch (e) {
      setRegenError(e instanceof Error ? e.message : "Couldn't regenerate this one.");
      setRegenStage("idle");
      setRegenIdx(null);
    }
  }

  function handleRevealComplete(absoluteIdx: number, replacement: AdminMcq) {
    onChange(mcqs.map((m, i) => (i === absoluteIdx ? replacement : m)));
    setPendingReplacement(null);
    setRegenStage("idle");
    setRegenIdx(null);
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Pivot summary */}
      {Object.keys(pivot).length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            p: 1.25,
            borderRadius: 3,
            bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 50%, transparent)",
            border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 75%, transparent)",
          }}
        >
          <Typography sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "text.secondary", alignSelf: "center", mr: 1 }}>
            {mcqs.length} questions
          </Typography>
          {Object.entries(pivot).map(([skill, counts]) => (
            <Box
              key={skill}
              sx={{
                px: 1,
                py: 0.4,
                borderRadius: 999,
                bgcolor: "color-mix(in srgb, currentColor 6%, transparent)",
                border: "1px solid color-mix(in srgb, currentColor 18%, transparent)",
                fontSize: "0.74rem",
                display: "inline-flex",
                gap: 0.5,
              }}
            >
              <span style={{ fontWeight: 700 }}>{prettySkill(skill)}</span>
              {DIFFICULTIES.map((d) =>
                counts[d] > 0 ? (
                  <span key={d} style={{ color: DIFFICULTY_COLORS[d], fontWeight: 700 }}>
                    {" "}
                    · {d.charAt(0)}×{counts[d]}
                  </span>
                ) : null,
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Page rows */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {pageMcqs.map((mcq, pageIdx) => {
          const absoluteIdx = page * PAGE_SIZE + pageIdx;
          const isExpanded = expandedIdx === absoluteIdx;
          const color = DIFFICULTY_COLORS[mcq.difficulty_level as (typeof DIFFICULTIES)[number]] || "#6366f1";
          const isRegenTarget = regenIdx === absoluteIdx;
          const showAsking = isRegenTarget && regenStage === "asking";
          const showReveal = isRegenTarget && regenStage === "revealing" && pendingReplacement !== null;
          const rowBusy = isRegenTarget && regenStage !== "idle";

          return (
            <Box
              key={absoluteIdx}
              component={motion.div}
              layout
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              sx={{
                position: "relative",
                borderRadius: 3,
                bgcolor: showReveal
                  ? "color-mix(in srgb, #a855f7 6%, transparent)"
                  : "color-mix(in srgb, var(--card-bg, #ffffff) 60%, transparent)",
                border: showReveal
                  ? "1px solid color-mix(in srgb, #a855f7 45%, transparent)"
                  : showAsking
                    ? "1px solid color-mix(in srgb, #6366f1 35%, transparent)"
                    : "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 70%, transparent)",
                boxShadow: showReveal
                  ? "0 12px 28px -16px color-mix(in srgb, #a855f7 60%, transparent)"
                  : "none",
                overflow: "hidden",
                transition: "background 220ms ease, border-color 220ms ease, box-shadow 220ms ease",
              }}
            >
              {/* Header row */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 1.5,
                  cursor: rowBusy ? "wait" : "pointer",
                }}
                onClick={() => {
                  if (rowBusy) return;
                  setExpandedIdx(isExpanded ? null : absoluteIdx);
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: "text.secondary", minWidth: 24 }}>
                    Q{absoluteIdx + 1}
                  </Typography>
                  <Box
                    sx={{
                      px: 0.85,
                      py: 0.2,
                      borderRadius: 999,
                      bgcolor: `color-mix(in srgb, ${color} 14%, transparent)`,
                      color,
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    {mcq.difficulty_level}
                  </Box>
                  {mcq.skills && (
                    <Typography sx={{ fontSize: "0.66rem", fontWeight: 700, color: "text.secondary", letterSpacing: "0.08em" }}>
                      · {prettySkill(mcq.skills)}
                    </Typography>
                  )}
                  {rowBusy ? (
                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                      <Icon
                        icon={showAsking ? "mdi:loading" : "mdi:fountain-pen-tip"}
                        width={14}
                        style={{
                          color: showAsking ? "#6366f1" : "#a855f7",
                          animation: showAsking ? "mcq-row-spin 1s linear infinite" : undefined,
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          color: showAsking ? "#6366f1" : "#a855f7",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {showAsking ? "AI is thinking…" : "Writing new question…"}
                      </Typography>
                    </Box>
                  ) : isExpanded ? (
                    // When expanded, the body owns the question text in a
                    // multi-line TextField. Hide the header preview entirely
                    // to avoid the duplicate string morphing under
                    // framer-motion's layout animation.
                    <Box sx={{ flex: 1 }} />
                  ) : (
                    <Typography
                      sx={{
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {mcq.question_text || <em>Empty question</em>}
                    </Typography>
                  )}
                </Box>
                <IconButton size="small" aria-label="expand" disabled={rowBusy}>
                  <Icon icon={isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"} width={18} />
                </IconButton>
              </Box>

              {/* Asking state - show a thinking strip in place of the body */}
              {rowBusy && (
                <Box
                  sx={{
                    px: 1.75,
                    pb: 1.75,
                    pt: 0.5,
                    borderTop: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 50%, transparent)",
                  }}
                >
                  {showAsking && (
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: "color-mix(in srgb, #6366f1 6%, transparent)",
                        border: "1px solid color-mix(in srgb, #6366f1 22%, transparent)",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Icon
                        icon="mdi:loading"
                        width={18}
                        style={{ color: "#6366f1", animation: "mcq-row-spin 1s linear infinite" }}
                      />
                      <Typography sx={{ fontSize: "0.85rem", color: "text.primary", fontWeight: 700 }}>
                        Asking AI for a fresh question on{" "}
                        <Box component="span" sx={{ color: "#6366f1" }}>
                          {prettySkill(mcq.skills || "this skill")}
                        </Box>{" "}
                        · {mcq.difficulty_level} …
                      </Typography>
                    </Box>
                  )}
                  {showReveal && pendingReplacement && (
                    <CellTypewriter
                      mcqs={[pendingReplacement]}
                      onMcqComplete={() => {
                        /* per-MCQ callback - single regen has only one. */
                      }}
                      onAllComplete={() => handleRevealComplete(absoluteIdx, pendingReplacement)}
                    />
                  )}
                </Box>
              )}

              {/* Body - only when expanded AND not mid-regen */}
              {isExpanded && !rowBusy && (
                <Box sx={{ p: 1.75, pt: 0.5, display: "flex", flexDirection: "column", gap: 1.25, borderTop: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 60%, transparent)" }}>
                  <TextField
                    label="Question"
                    fullWidth
                    multiline
                    minRows={2}
                    value={mcq.question_text}
                    onChange={(e) => updateAt(absoluteIdx, { question_text: e.target.value })}
                  />
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1 }}>
                    {(["A", "B", "C", "D"] as const).map((letter) => {
                      const field = `option_${letter.toLowerCase()}` as
                        | "option_a"
                        | "option_b"
                        | "option_c"
                        | "option_d";
                      const isCorrect = mcq.correct_option === letter;
                      return (
                        <TextField
                          key={letter}
                          label={`Option ${letter}${isCorrect ? " · CORRECT" : ""}`}
                          value={mcq[field]}
                          onChange={(e) => updateAt(absoluteIdx, { [field]: e.target.value })}
                          fullWidth
                          sx={
                            isCorrect
                              ? {
                                  "& .MuiOutlinedInput-root fieldset": {
                                    borderColor: "#10b981",
                                    borderWidth: 1.5,
                                  },
                                }
                              : undefined
                          }
                        />
                      );
                    })}
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
                    <Select
                      size="small"
                      value={mcq.correct_option}
                      onChange={(e) => updateAt(absoluteIdx, { correct_option: e.target.value as "A" | "B" | "C" | "D" })}
                    >
                      {(["A", "B", "C", "D"] as const).map((l) => (
                        <MenuItem key={l} value={l}>
                          Correct: {l}
                        </MenuItem>
                      ))}
                    </Select>
                    <Select
                      size="small"
                      value={mcq.difficulty_level}
                      onChange={(e) => updateAt(absoluteIdx, { difficulty_level: e.target.value as "Easy" | "Medium" | "Hard" })}
                    >
                      {DIFFICULTIES.map((d) => (
                        <MenuItem key={d} value={d}>
                          {d}
                        </MenuItem>
                      ))}
                    </Select>
                    <TextField
                      size="small"
                      label="Skill tag"
                      value={mcq.skills || ""}
                      onChange={(e) => updateAt(absoluteIdx, { skills: e.target.value })}
                    />
                  </Box>
                  <TextField
                    label="Explanation"
                    fullWidth
                    multiline
                    minRows={2}
                    value={mcq.explanation || ""}
                    onChange={(e) => updateAt(absoluteIdx, { explanation: e.target.value })}
                  />
                  {regenError && regenIdx === absoluteIdx && (
                    <Typography sx={{ fontSize: "0.78rem", color: "#ef4444", fontWeight: 700 }}>
                      {regenError}
                    </Typography>
                  )}
                  <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                    {enableRegenerate && (
                      <ButtonBase
                        onClick={() => void regenerateAt(absoluteIdx)}
                        disabled={regenStage !== "idle"}
                        sx={{
                          px: 2,
                          py: 0.75,
                          borderRadius: 999,
                          fontWeight: 800,
                          fontSize: "0.78rem",
                          color: "white",
                          background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                          "&:disabled": { cursor: "not-allowed", opacity: 0.5 },
                        }}
                      >
                        <Icon icon="mdi:auto-fix" width={14} />
                        Regenerate with AI
                      </ButtonBase>
                    )}
                    <ButtonBase
                      onClick={() => deleteAt(absoluteIdx)}
                      sx={{
                        px: 2,
                        py: 0.75,
                        borderRadius: 999,
                        fontWeight: 800,
                        fontSize: "0.78rem",
                        color: "#ef4444",
                        border: "1px solid color-mix(in srgb, #ef4444 40%, transparent)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <Icon icon="mdi:trash-can-outline" width={14} />
                      Delete
                    </ButtonBase>
                  </Box>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Pager */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1 }}>
          <IconButton size="small" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            <Icon icon="mdi:chevron-left" width={18} />
          </IconButton>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700 }}>
            {page + 1} / {totalPages}
          </Typography>
          <IconButton size="small" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
            <Icon icon="mdi:chevron-right" width={18} />
          </IconButton>
        </Box>
      )}

      <style jsx global>{`
        @keyframes mcq-row-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
}
