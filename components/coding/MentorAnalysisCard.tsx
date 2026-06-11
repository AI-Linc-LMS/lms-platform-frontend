"use client";

import { Box, Button, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { AIBeacon } from "@/components/adaptive-quiz/shared/AIBeacon";
import { AIPill } from "@/components/adaptive-quiz/shared/AIPill";
import type {
  HintResult,
  MasteryDelta,
  MentorDiagnosis,
  OptimizationChallenge,
} from "@/lib/services/adaptive-coding.service";

/**
 * The mentor's left-panel analysis surface. Two outcomes, never just "pass/fail":
 * a failure becomes a line-level diagnosis (What's wrong + conceptual-gap chips +
 * scaffolded hint ladder); a clean pass becomes a challenge to go further.
 *
 * Reuses the shared AI primitives (AIPill, AIBeacon) so the coding surface reads
 * consistently with the adaptive quiz and article.
 */

export interface MentorAnalysisCardProps {
  /** Diagnosis from a failing Run/Submit (null when there's nothing to diagnose). */
  diagnosis?: MentorDiagnosis | null;
  /** Stretch goal offered on a clean pass. */
  optimization?: OptimizationChallenge | null;
  failedCount: number;
  totalCount: number;
  /** Per-skill mastery movement from the last graded Submit (up on pass, down on fail). */
  masteryDelta?: MasteryDelta | null;
  /** Hint ladder state. */
  hintLayers: number;
  hintsRevealed: number;
  revealedHints: HintResult[];
  hintLoading?: boolean;
  onRevealHint?: () => void;
}

const BAND_COLOR: Record<string, string> = {
  emerging: "#ef4444",
  developing: "#f59e0b",
  proficient: "#6366f1",
  mastered: "#10b981",
};

const GAP_LABELS: Record<string, string> = {
  aggregation_logic: "Aggregation logic",
  off_by_one: "Off-by-one",
  edge_empty_input: "Edge-case blindness",
  mutation_vs_return: "Mutation vs. return",
  stub_not_implemented: "Unimplemented stub",
  io_parsing: "Input parsing",
  type_coercion: "Type coercion",
  wrong_comparison: "Wrong comparison",
  missing_base_case: "Missing base case",
};

function gapLabel(id: string): string {
  return GAP_LABELS[id] ?? id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function MentorAnalysisCard({
  diagnosis,
  optimization,
  failedCount,
  totalCount,
  masteryDelta,
  hintLayers,
  hintsRevealed,
  revealedHints,
  hintLoading,
  onRevealHint,
}: MentorAnalysisCardProps) {
  const cleanPass = totalCount > 0 && failedCount === 0;

  if (cleanPass && optimization) {
    return <ChallengePanel optimization={optimization} totalCount={totalCount} masteryDelta={masteryDelta} />;
  }
  if (!diagnosis) return null;

  return (
    <Box
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        border: "1.5px solid color-mix(in srgb, #ef4444 28%, transparent)",
        background: "var(--card-bg, #fff)",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          px: 2,
          py: 1.5,
          background: "linear-gradient(135deg, color-mix(in srgb,#ef4444 14%,transparent), color-mix(in srgb,#ec4899 8%,transparent))",
        }}
      >
        <Box
          sx={{
            width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
            display: "grid", placeItems: "center", color: "white",
            background: "linear-gradient(135deg,#ef4444,#ec4899)",
          }}
        >
          <Icon icon="mdi:close" width={18} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", lineHeight: 1.2 }}>
            {failedCount} of {totalCount} test cases failed
          </Typography>
          <Typography sx={{ fontSize: "0.74rem", color: "text.secondary" }}>
            AI Mentor read your code · line-level diagnosis below
          </Typography>
        </Box>
        <AIPill variant="solid" icon={<Icon icon="mdi:robot-happy-outline" width={12} />}>
          AI Mentor
        </AIPill>
      </Box>

      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* What's wrong */}
        <Section label="What's wrong">
          <Box
            sx={{
              p: 1.5, borderRadius: 2,
              background: "color-mix(in srgb, var(--card-bg) 50%, transparent)",
              border: "1px solid color-mix(in srgb, var(--border-default) 60%, transparent)",
            }}
          >
            <Typography sx={{ fontSize: "0.86rem", lineHeight: 1.5 }}>{diagnosis.whats_wrong}</Typography>
            {diagnosis.root_cause_line != null && (
              <Typography sx={{ mt: 0.75, fontSize: "0.74rem", color: "text.secondary", fontFamily: "monospace" }}>
                ↳ line {diagnosis.root_cause_line}
                {diagnosis.root_cause_excerpt ? `:  ${diagnosis.root_cause_excerpt}` : ""}
              </Typography>
            )}
          </Box>
        </Section>

        {/* Conceptual gap + strengths */}
        {(diagnosis.conceptual_gap && diagnosis.conceptual_gap !== "none") || diagnosis.strengths.length > 0 ? (
          <Section label="Conceptual gap detected">
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
              {diagnosis.conceptual_gap && diagnosis.conceptual_gap !== "none" && (
                <ChipCard
                  tone="warn"
                  title={gapLabel(diagnosis.conceptual_gap)}
                  body="The gap to close — we'll re-test this soon."
                />
              )}
              {diagnosis.strengths.length > 0 && (
                <ChipCard
                  tone="good"
                  title="You're strong on"
                  body={diagnosis.strengths.join(" · ")}
                />
              )}
            </Box>
          </Section>
        ) : null}

        <MasteryDeltaSection delta={masteryDelta} />

        {/* Scaffolded hints */}
        <Section label={`Scaffolded hints · ${hintsRevealed}/${hintLayers} revealed`}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {revealedHints.map((h) => (
              <HintRung key={h.layer} hint={h} />
            ))}
            {hintsRevealed < hintLayers && (
              <Button
                onClick={onRevealHint}
                disabled={hintLoading}
                startIcon={<Icon icon={hintLoading ? "mdi:loading" : "mdi:lightbulb-on-outline"} width={16} className={hintLoading ? "spin" : undefined} />}
                sx={{
                  alignSelf: "flex-start", textTransform: "none", fontWeight: 800, fontSize: "0.8rem",
                  px: 1.75, py: 0.6, borderRadius: 999, color: "white",
                  background: "linear-gradient(135deg,#6366f1,#a855f7)",
                  "&:hover": { background: "linear-gradient(135deg,#5558e0,#9a4ee6)" },
                }}
              >
                {hintsRevealed === 0 ? "Reveal a hint — it guides, never solves" : `Reveal hint ${hintsRevealed + 1}`}
              </Button>
            )}
            <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", mt: 0.25 }}>
              Each rung reveals strictly more · the last stops at a skeleton you complete yourself.
            </Typography>
          </Box>
        </Section>
      </Box>
    </Box>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography
        sx={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary", mb: 0.75 }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
}

function ChipCard({ tone, title, body }: { tone: "warn" | "good"; title: string; body: string }) {
  const accent = tone === "warn" ? "#f59e0b" : "#10b981";
  return (
    <Box
      sx={{
        p: 1.25, borderRadius: 2,
        background: `color-mix(in srgb, ${accent} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${accent} 30%, transparent)`,
      }}
    >
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: accent, display: "flex", alignItems: "center", gap: 0.5 }}>
        <Icon icon={tone === "warn" ? "mdi:alert-circle-outline" : "mdi:check-circle-outline"} width={14} />
        {title}
      </Typography>
      <Typography sx={{ fontSize: "0.76rem", color: "text.secondary", mt: 0.25 }}>{body}</Typography>
    </Box>
  );
}

function HintRung({ hint }: { hint: HintResult }) {
  const isSkeleton = hint.reveals_code;
  return (
    <Box
      sx={{
        p: 1.25, borderRadius: 2,
        border: `1px solid color-mix(in srgb, ${isSkeleton ? "#a855f7" : "#10b981"} 35%, transparent)`,
        background: `color-mix(in srgb, ${isSkeleton ? "#a855f7" : "#10b981"} 7%, transparent)`,
      }}
    >
      <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: "text.secondary" }}>
        Hint {hint.layer} {isSkeleton ? "· skeleton" : ""}
      </Typography>
      <Typography sx={{ fontSize: "0.86rem", fontWeight: 700, mt: 0.25 }}>{hint.title}</Typography>
      {isSkeleton ? (
        <Box
          component="pre"
          sx={{
            mt: 0.75, p: 1, borderRadius: 1.5, overflowX: "auto", fontSize: "0.78rem",
            fontFamily: "monospace", background: "#0f1117", color: "#e6e6e6", whiteSpace: "pre-wrap",
          }}
        >
          {hint.body.replace(/^```\w*\n?|```$/g, "")}
        </Box>
      ) : (
        <Typography sx={{ fontSize: "0.84rem", mt: 0.25, lineHeight: 1.5 }}>{hint.body}</Typography>
      )}
    </Box>
  );
}

function MasteryDeltaSection({ delta }: { delta?: MasteryDelta | null }) {
  if (!delta) return null;
  const rows = Object.entries(delta);
  if (rows.length === 0) return null;
  return (
    <Section label="Coding mastery">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6 }}>
        {rows.map(([skill, d]) => {
          const up = d.after >= d.before;
          const color = BAND_COLOR[d.band] ?? "#6366f1";
          return (
            <Box key={skill} sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, flex: 1, minWidth: 90 }}>{skill}</Typography>
              <Typography sx={{ fontSize: "0.8rem", fontFamily: "monospace", color: "text.secondary" }}>
                {d.before}% → {d.after}%
              </Typography>
              <Box
                sx={{
                  display: "inline-flex", alignItems: "center", gap: 0.25, px: 0.75, py: 0.2, borderRadius: 999,
                  fontSize: "0.7rem", fontWeight: 800, color: up ? "#10b981" : "#ef4444",
                  background: `color-mix(in srgb, ${up ? "#10b981" : "#ef4444"} 12%, transparent)`,
                }}
              >
                <Icon icon={up ? "mdi:arrow-up-bold" : "mdi:arrow-down-bold"} width={11} />
                {Math.abs(d.after - d.before)}
              </Box>
              <Box
                sx={{
                  px: 0.75, py: 0.2, borderRadius: 999, fontSize: "0.66rem", fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.04em", color, background: `color-mix(in srgb, ${color} 12%, transparent)`,
                }}
              >
                {d.band}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Section>
  );
}

function ChallengePanel({
  optimization,
  totalCount,
  masteryDelta,
}: {
  optimization: OptimizationChallenge;
  totalCount: number;
  masteryDelta?: MasteryDelta | null;
}) {
  return (
    <Box
      sx={{
        borderRadius: 3, overflow: "hidden",
        border: "1.5px solid color-mix(in srgb, #10b981 32%, transparent)",
        background: "var(--card-bg, #fff)",
      }}
    >
      <Box
        sx={{
          display: "flex", alignItems: "center", gap: 1.25, px: 2, py: 1.5,
          background: "linear-gradient(135deg, color-mix(in srgb,#10b981 14%,transparent), color-mix(in srgb,#6366f1 8%,transparent))",
        }}
      >
        <AIBeacon size={28} />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", lineHeight: 1.2 }}>
            All {totalCount} passed — clean &amp; correct
          </Typography>
          <Typography sx={{ fontSize: "0.74rem", color: "text.secondary" }}>Now let&apos;s push you further</Typography>
        </Box>
        <AIPill variant="solid" icon={<Icon icon="mdi:rocket-launch-outline" width={12} />}>Challenge</AIPill>
      </Box>
      <Box sx={{ p: 2 }}>
        {optimization.offer ? (
          <>
            <Section label={optimization.focus_skill ? `Level up · ${optimization.focus_skill}` : "Level up"}>
              <Box
                sx={{
                  p: 1.5, borderRadius: 2,
                  background: "color-mix(in srgb,#6366f1 8%,transparent)",
                  border: "1px solid color-mix(in srgb,#6366f1 28%,transparent)",
                }}
              >
                <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, lineHeight: 1.5 }}>
                  {optimization.challenge}
                </Typography>
              </Box>
            </Section>
          </>
        ) : (
          <Typography sx={{ fontSize: "0.88rem", lineHeight: 1.5 }}>
            {optimization.challenge || "Clean, optimal solution — nicely done."}
          </Typography>
        )}
        <Box sx={{ mt: 1.5 }}>
          <MasteryDeltaSection delta={masteryDelta} />
        </Box>
      </Box>
    </Box>
  );
}

export default MentorAnalysisCard;
