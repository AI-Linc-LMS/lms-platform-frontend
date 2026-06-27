"use client";

import { Box, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { RequizOutcome } from "@/lib/types/adaptive-quiz";

function prettySkill(s: string): string {
  if (!s) return "this skill";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const VERDICT: Record<string, { icon: string; accent: string; bg: string; border: string; title: (s: string) => string; sub: string }> = {
  closed: {
    icon: "mdi:check-circle",
    accent: "#15803d",
    bg: "color-mix(in srgb, #10b981 12%, transparent)",
    border: "color-mix(in srgb, #10b981 35%, transparent)",
    title: (s) => `Gap closed — you've got ${s} now.`,
    sub: "Your follow-up quiz shows real improvement. Nice work.",
  },
  narrowed: {
    icon: "mdi:trending-up",
    accent: "#b45309",
    bg: "color-mix(in srgb, #f59e0b 14%, transparent)",
    border: "color-mix(in srgb, #f59e0b 38%, transparent)",
    title: (s) => `Closing in on ${s}.`,
    sub: "You improved — one more pass should lock it in.",
  },
  still_weak: {
    icon: "mdi:alert-circle-outline",
    accent: "#b91c1c",
    bg: "color-mix(in srgb, #ef4444 12%, transparent)",
    border: "color-mix(in srgb, #ef4444 35%, transparent)",
    title: (s) => `${s} still needs another pass.`,
    sub: "No jump yet — revisit the step above, then retry.",
  },
};

/** Closes the loop on a re-quiz: how it compares to the original attempt on the targeted skill. */
export function RequizOutcomeBanner({ outcome }: { outcome: RequizOutcome }) {
  if (!outcome.has_source || !outcome.verdict || !outcome.original || !outcome.requiz) return null;
  const v = VERDICT[outcome.verdict] ?? VERDICT.narrowed;
  const skill = prettySkill(outcome.skill || "");
  const oPct = Math.round(outcome.original.accuracy * 100);
  const rPct = Math.round(outcome.requiz.accuracy * 100);

  return (
    <Box
      sx={{
        p: { xs: 2, md: 2.5 }, borderRadius: 4, mb: 2.5,
        bgcolor: v.bg, border: `1px solid ${v.border}`,
        display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap",
      }}
    >
      <Box sx={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", color: "white", background: v.accent }}>
        <Icon icon={v.icon} width={26} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: v.accent }}>
          Follow-up result
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "text.primary", lineHeight: 1.3 }}>
          {v.title(skill)}
        </Typography>
        <Typography sx={{ fontSize: "0.84rem", color: "text.secondary", mt: 0.25 }}>{v.sub}</Typography>
      </Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
        <Pill label="First attempt" value={`${oPct}%`} color="#94a3b8" />
        <Icon icon="mdi:arrow-right" width={18} color={v.accent} />
        <Pill label="Re-quiz" value={`${rPct}%`} color={v.accent} />
      </Stack>
    </Box>
  );
}

function Pill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Box sx={{ px: 1.5, py: 0.75, borderRadius: 2.5, bgcolor: "color-mix(in srgb, white 65%, transparent)", textAlign: "center", minWidth: 76 }}>
      <Typography sx={{ fontWeight: 900, fontSize: "1.15rem", color, lineHeight: 1 }}>{value}</Typography>
      <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "text.secondary", mt: 0.4 }}>{label}</Typography>
    </Box>
  );
}
