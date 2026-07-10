"use client";

import { useEffect, useRef, useState, RefObject } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { StudentAvatar } from "@/components/admin/adaptive-course/studentVisuals";
import type { StudentAnalytics } from "@/lib/services/admin/admin-adaptive-course.service";
import { useVizPalette } from "./vizPalette";
import { Insight, NextAction, Verdict, VerdictTone } from "./studentInsights";

/* ------------------------------------------------------------------ VerdictPlate */

const TONE_ICON: Record<VerdictTone, string> = {
  ok: "mdi:check-circle-outline",
  watch: "mdi:eye-outline",
  at_risk: "mdi:alert-octagon-outline",
  not_started: "mdi:timer-sand-empty",
};

/**
 * The answer to "is this student in trouble, and why" — the reason the admin opened the page.
 *
 * `not_started` deliberately drops the status color entirely: a student who has never begun is
 * not "On track" (a lying green pill), they're simply unassessed.
 */
export function VerdictPlate({ verdict }: { verdict: Verdict }) {
  const p = useVizPalette();
  const neutral = verdict.tone === "not_started";
  const color = neutral
    ? "var(--font-secondary, #52514e)"
    : verdict.tone === "at_risk"
      ? p.status.critical
      : verdict.tone === "watch"
        ? p.status.warning
        : p.status.good;

  const chips: [number, string, string][] = [
    [verdict.counts.critical, "critical", p.status.critical],
    [verdict.counts.serious, "serious", p.status.serious],
    [verdict.counts.warning, "warning", p.status.warning],
  ];
  const shown = chips.filter(([n]) => n > 0);

  return (
    <Box
      sx={{
        p: 2.25,
        borderRadius: 3,
        bgcolor: neutral
          ? "color-mix(in srgb, var(--border-default) 22%, var(--card-bg))"
          : `color-mix(in srgb, ${color} 8%, var(--card-bg))`,
        border: `1px solid ${neutral ? "color-mix(in srgb, var(--border-default) 80%, transparent)" : `color-mix(in srgb, ${color} 35%, transparent)`}`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.75 }}>
        {/* Status never carries meaning alone — icon + word, always. */}
        <Icon icon={TONE_ICON[verdict.tone]} width={30} style={{ color }} />
        <Box>
          <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.18em", color: "var(--font-secondary)" }}>
            VERDICT
          </Typography>
          <Typography sx={{ fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, color }}>
            {verdict.call}
          </Typography>
        </Box>
      </Box>

      <Typography sx={{ fontSize: "0.88rem", fontWeight: 500, lineHeight: 1.5, color: "var(--font-primary)" }}>
        {verdict.sentence}
      </Typography>

      {shown.length > 0 && (
        <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
          {shown.map(([n, label, c]) => (
            <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: c }} />
              <Typography sx={{ fontSize: "0.72rem", color: "var(--font-secondary)", fontVariantNumeric: "tabular-nums" }}>
                {n} {label}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

/* ------------------------------------------------------------------ NextActions */

/** The "so what do I do" strip. Chips scroll to the evidence that justifies them. */
export function NextActions({ actions, onJump }: { actions: NextAction[]; onJump: (target: string) => void }) {
  if (!actions.length) return null;
  return (
    <Box>
      <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", color: "var(--font-secondary)", mb: 0.9 }}>
        DO NEXT
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {actions.map((a) => {
          const clickable = Boolean(a.target);
          return (
            <ButtonBase
              key={a.id}
              disabled={!clickable}
              onClick={() => a.target && onJump(a.target)}
              sx={{
                display: "flex", alignItems: "center", gap: 0.75,
                px: 1.5, py: 0.9, borderRadius: 999,
                bgcolor: "var(--card-bg,#fff)",
                border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                fontSize: "0.8rem", fontWeight: 600, color: "var(--font-primary)",
                transition: "background-color 140ms ease, border-color 140ms ease",
                cursor: clickable ? "pointer" : "default",
                "&:hover": clickable ? { bgcolor: "color-mix(in srgb, #6366f1 6%, var(--card-bg))", borderColor: "color-mix(in srgb, #6366f1 40%, transparent)" } : undefined,
                "&:focus-visible": { outline: "2px solid color-mix(in srgb, #6366f1 60%, transparent)", outlineOffset: 2 },
              }}
            >
              <Icon icon={a.icon} width={16} style={{ color: "#6366f1" }} />
              {a.label}
              {clickable && <Icon icon="mdi:arrow-down" width={14} style={{ color: "var(--font-tertiary,#8b8b98)" }} />}
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ InsightLine */

/** Turns a chart into a sentence. Never rendered when the data can't support a claim. */
export function InsightLine({ insight, accent }: { insight: Insight | null; accent: string }) {
  if (!insight) return null;
  const parts = insight.emphasis ? insight.text.split(insight.emphasis) : [insight.text];
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.9, mb: 1, px: 0.25 }}>
      <Icon icon={insight.icon} width={16} style={{ color: accent, flexShrink: 0 }} />
      <Typography sx={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--font-secondary)", lineHeight: 1.4 }}>
        {parts.length === 2 ? (
          <>
            {parts[0]}
            <Box component="span" sx={{ fontWeight: 800, color: accent }}>{insight.emphasis}</Box>
            {parts[1]}
          </>
        ) : (
          insight.text
        )}
      </Typography>
    </Box>
  );
}

/* ------------------------------------------------------------- StickySummaryBar */

/** Keeps the verdict on screen once the hero scrolls away. */
export function useHeroOffscreen(sentinel: RefObject<HTMLElement | null>) {
  const [off, setOff] = useState(false);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOff(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [sentinel]);
  return off;
}

export function StickySummaryBar({
  visible,
  student,
  verdict,
  kpis,
}: {
  visible: boolean;
  student: StudentAnalytics["student"];
  verdict: Verdict;
  kpis: StudentAnalytics["kpis"];
}) {
  const p = useVizPalette();
  const color =
    verdict.tone === "not_started" ? "var(--font-secondary)"
      : verdict.tone === "at_risk" ? p.status.critical
        : verdict.tone === "watch" ? p.status.warning
          : p.status.good;

  const mini: [string, string][] = [
    ["Completion", `${Math.round(kpis.completion_pct)}%`],
    ["Mastery", `${Math.round(kpis.mastery_pct)}%`],
    ["Streak", `${kpis.streak_current}d`],
  ];

  return (
    <Box
      sx={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 20,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-8px)",
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 200ms ease, transform 200ms ease",
        bgcolor: "color-mix(in srgb, var(--card-bg) 85%, transparent)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
      }}
    >
      <Box sx={{ maxWidth: 1600, mx: "auto", px: { xs: 2, md: 3 }, height: 56, display: "flex", alignItems: "center", gap: 1.5 }}>
        <StudentAvatar name={student.name} email={student.email} size={28} />
        <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--font-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
          {student.name}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1, py: 0.35, borderRadius: 999, bgcolor: `color-mix(in srgb, ${color} 12%, transparent)` }}>
          <Icon icon={TONE_ICON[verdict.tone]} width={14} style={{ color }} />
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color }}>{verdict.call}</Typography>
        </Box>

        <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 2.5, ml: 1 }}>
          {mini.map(([label, value]) => (
            <Box key={label} sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
              <Typography sx={{ fontSize: "0.68rem", color: "var(--font-tertiary,#8b8b98)" }}>{label}</Typography>
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--font-primary)", fontVariantNumeric: "tabular-nums" }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/** Scrolls an evidence section into view when a NextActions chip is clicked. */
export function useJumpTo() {
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const register = (key: string) => (el: HTMLElement | null) => { refs.current[key] = el; };
  const jump = (key: string) => {
    refs.current[key]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  return { register, jump };
}
