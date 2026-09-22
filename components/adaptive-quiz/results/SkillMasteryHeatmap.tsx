"use client";

import { Box, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { CountUp } from "@/components/scorecard/shared/CountUp";
import { prettySkill } from "@/lib/utils/skill-label.utils";
import type { AdaptiveAINarration } from "@/lib/types/adaptive-quiz";
import { PHONE } from "@/components/common/mobile/phone";

type SkillRow = AdaptiveAINarration["skill_mastery"][number];

interface SkillMasteryHeatmapProps {
  skills: AdaptiveAINarration["skill_mastery"];
}

/** "This attempt: 100% (5/5)", or null for a row cached before the backend sent the counts. */
export function attemptLine(row: SkillRow): string | null {
  const total = row.attempt_total;
  if (typeof total !== "number" || total <= 0) return null;
  const correct = Math.max(0, Math.min(total, row.attempt_correct ?? 0));
  return `This attempt: ${Math.round((correct / total) * 100)}% (${correct}/${total})`;
}

/**
 * Why the mastery number can sit below this attempt's score. Mastery is an estimate that starts at
 * 50% and firms up with every answer, so a perfect 1/1 reads 73% and a perfect 5/5 about 92%. The
 * old "confidence early" said the same thing in words nobody could act on; this says what moves it.
 * Rows without an evidence count (cached before the field existed) keep the old wording.
 */
export function evidenceLine(row: SkillRow): string {
  const n = row.evidence_count;
  if (typeof n !== "number" || n <= 0) {
    return `confidence ${row.se < 0.5 ? "high" : row.se < 0.9 ? "building" : "early"}`;
  }
  if (row.se < 0.5) return `Based on ${n} question${n === 1 ? "" : "s"}`;
  return `Mastery grows with more questions: ${n} so far`;
}

function isPerfectBelowFull(row: SkillRow): boolean {
  const total = row.attempt_total ?? 0;
  return total > 0 && row.attempt_correct === total && row.mastery_pct < 100;
}

const BAND_LABEL: Record<string, string> = {
  emerging: "Needs work",
  developing: "Developing",
  proficient: "Proficient",
  mastered: "Mastered",
};

const BAND_COLOR: Record<string, string> = {
  emerging: "#ef4444",
  developing: "#f59e0b",
  proficient: "#6366f1",
  mastered: "#10b981",
};


function BandPill({ band }: { band: string }) {
  const color = BAND_COLOR[band] ?? "#6366f1";
  return (
    <Box
      sx={{
        px: 0.9, py: 0.25, borderRadius: 999, fontSize: "0.6rem", [PHONE]: { fontSize: "0.75rem" }, fontWeight: 800,
        letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap",
        color, bgcolor: `color-mix(in srgb, ${color} 13%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
      }}
    >
      {BAND_LABEL[band] ?? band}
    </Box>
  );
}

export function SkillMasteryHeatmap({ skills }: SkillMasteryHeatmapProps) {
  if (!skills.length) return null;
  return (
    <Box
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 4,
        bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 65%, transparent)",
        border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 60%, transparent)",
        backdropFilter: "blur(18px) saturate(140%)",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box sx={{ width: 34, height: 34, borderRadius: 2.5, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, var(--module-tile-from, #6366f1), var(--module-tile-to, #a855f7))", boxShadow: "0 8px 18px -10px rgba(124,58,237,0.6)" }}>
            <Icon icon="mdi:chart-line-variant" width={19} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.01em", lineHeight: 1.15 }}>Skill mastery</Typography>
            <Typography sx={{ fontSize: "0.74rem", [PHONE]: { fontSize: "0.75rem" }, color: "text.secondary" }}>Estimated mastery per sub-skill, next to this attempt&apos;s result</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "text.secondary" }}>
          <Box sx={{ width: 14, borderTop: "2px dashed currentColor" }} />
          <Typography sx={{ fontSize: "0.68rem", [PHONE]: { fontSize: "0.75rem" }, fontWeight: 600 }}>= last attempt</Typography>
        </Stack>
      </Stack>

      {/* Responsive auto-fit grid: many skills pack into 2–3 columns (compact, no tall single
          column); 1–2 skills stretch to fill the width instead of leaving a lonely short card. */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 1.25 }}>
        {skills.map((row) => {
          const color = BAND_COLOR[row.band] ?? "#6366f1";
          const hasBaseline = row.delta_pct !== null && row.delta_pct !== undefined;
          const delta = row.delta_pct as number;
          const attempt = attemptLine(row);
          const previousMastery =
            typeof row.previous_mastery_pct === "number"
              ? Math.max(0, Math.min(100, row.previous_mastery_pct))
              : null;
          return (
            <Box
              key={row.skill}
              sx={{
                p: 1.5, borderRadius: 3,
                border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 55%, transparent)",
                bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 45%, transparent)",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 0.85 }}>
                <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {prettySkill(row.skill)}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
                  <BandPill band={row.band} />
                  {hasBaseline && delta !== 0 ? (
                    <Stack direction="row" spacing={0.2} alignItems="center" sx={{ color: delta > 0 ? "#15803d" : "#b91c1c" }}>
                      <Icon icon={delta > 0 ? "mdi:arrow-up" : "mdi:arrow-down"} width={13} />
                      <Typography sx={{ fontSize: "0.72rem", [PHONE]: { fontSize: "0.75rem" }, fontWeight: 800 }}>{Math.abs(delta)}</Typography>
                    </Stack>
                  ) : !hasBaseline ? (
                    <Box sx={{ px: 0.7, py: 0.15, borderRadius: 999, fontSize: "0.58rem", [PHONE]: { fontSize: "0.75rem" }, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#a855f7", bgcolor: "color-mix(in srgb, #a855f7 12%, transparent)", border: "1px solid color-mix(in srgb, #a855f7 25%, transparent)" }}>
                      New
                    </Box>
                  ) : null}
                  <Typography sx={{ fontSize: "1.05rem", fontWeight: 900, color, fontVariantNumeric: "tabular-nums", minWidth: 44, textAlign: "right" }}>
                    <CountUp value={row.mastery_pct} duration={1.2} suffix="%" />
                  </Typography>
                </Stack>
              </Stack>

              <Box sx={{ position: "relative", height: 10, borderRadius: 999, color, bgcolor: "color-mix(in srgb, currentColor 10%, transparent)", overflow: "hidden" }}>
                <Box
                  component={motion.div}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${row.mastery_pct}%` }}
                  viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  sx={{ position: "absolute", inset: 0, borderRadius: 999, background: `linear-gradient(90deg, color-mix(in srgb, ${color} 55%, transparent) 0%, ${color} 100%)` }}
                />
                {previousMastery !== null && previousMastery !== row.mastery_pct && (
                  <Box aria-hidden title={`Last attempt: ${previousMastery}%`} sx={{ position: "absolute", top: -1, bottom: -1, left: `${previousMastery}%`, borderLeft: "2px dashed color-mix(in srgb, #0f172a 45%, transparent)", zIndex: 1 }} />
                )}
              </Box>

              {attempt && (
                <Typography
                  data-testid="skill-attempt"
                  sx={{ fontSize: "0.72rem", [PHONE]: { fontSize: "0.8rem" }, fontWeight: 700, color: "text.primary", mt: 0.75, fontVariantNumeric: "tabular-nums" }}
                >
                  {attempt}
                </Typography>
              )}
              <Typography sx={{ fontSize: "0.62rem", [PHONE]: { fontSize: "0.75rem" }, color: "text.secondary", mt: attempt ? 0.25 : 0.6 }}>
                {previousMastery !== null ? `Was ${previousMastery}%` : "First attempt"}
                <Box component="span" data-testid="skill-evidence" sx={{ opacity: 0.75 }}> · {evidenceLine(row)}</Box>
              </Typography>
            </Box>
          );
        })}
      </Box>
      {skills.some(isPerfectBelowFull) && (
        <Typography data-testid="skill-mastery-explainer" sx={{ fontSize: "0.72rem", [PHONE]: { fontSize: "0.8rem" }, color: "text.secondary", lineHeight: 1.5 }}>
          A perfect attempt can still read below 100%. Mastery is an estimate built from every
          question on a skill and only reaches the top after many correct answers, so one short
          quiz cannot claim full mastery on its own.
        </Typography>
      )}
    </Box>
  );
}
