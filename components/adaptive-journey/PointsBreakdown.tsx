"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress, LinearProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import {
  adaptiveCourseService,
  type PointsBreakdownItem,
  type PointsKind,
  type SubmodulePointsBreakdown,
} from "@/lib/services/adaptive-course.service";

const KIND: Record<PointsKind, { icon: string; color: string; bg: string; label: string }> = {
  quiz: { icon: "mdi:tune-vertical", color: "#6366f1", bg: "#eef2ff", label: "Quiz" },
  coding: { icon: "mdi:code-tags", color: "#ec4899", bg: "#fdf2f8", label: "Coding" },
  article: { icon: "mdi:book-open-page-variant", color: "#a855f7", bg: "#f5f3ff", label: "Article" },
  video: { icon: "mdi:play-circle", color: "#0ea5e9", bg: "#e0f2fe", label: "Video" },
};

// The "accuracy"-style factor only means something for graded/timed content. Articles
// are flat (read = full credit), so we never show a "% correct" for them.
const CORRECTNESS_LABEL: Partial<Record<PointsKind, string>> = {
  quiz: "correct",
  coding: "tests passed",
  video: "watched",
};

export function PointsBreakdown({ courseId, submoduleId }: { courseId: number; submoduleId: number }) {
  const [data, setData] = useState<SubmodulePointsBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    adaptiveCourseService
      .getSubmodulePoints(courseId, submoduleId)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [courseId, submoduleId]);

  if (loading) {
    return (
      <Box sx={{ p: 3, display: "grid", placeItems: "center", borderRadius: 4, border: "1px solid #eef2f7", bgcolor: "#fff" }}>
        <CircularProgress size={20} sx={{ color: "#f59e0b" }} />
      </Box>
    );
  }
  if (!data || data.items.length === 0) return null;

  const { earned, on_offer } = data.topic;
  const pct = on_offer ? Math.min(100, Math.round((earned / on_offer) * 100)) : 0;

  return (
    <Box sx={{ p: 2, borderRadius: 4, border: "1px solid #eef2f7", bgcolor: "#fff" }}>
      {/* Header — matches the course side-panel section headers */}
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
        <Box sx={{ width: 30, height: 30, borderRadius: 2, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
          <Icon icon="mdi:trophy" width={17} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.92rem" }}>Points breakdown</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "#64748b" }}>Where this topic&apos;s points come from</Typography>
        </Box>
      </Stack>

      {/* Total — mirrors the "Overall completion" highlight, in points gold */}
      <Box sx={{ p: 1.5, borderRadius: 3, color: "white", background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>Points earned</Typography>
          <Typography sx={{ fontWeight: 900, fontSize: "1.5rem", lineHeight: 1 }}>
            {earned}<Box component="span" sx={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.85)" }}> / {on_offer}</Box>
          </Typography>
        </Stack>
        <LinearProgress variant="determinate" value={pct} sx={{ mt: 0.75, height: 7, borderRadius: 4, bgcolor: "rgba(255,255,255,0.25)", "& .MuiLinearProgress-bar": { bgcolor: "white" } }} />
      </Box>

      {/* Per-content rows */}
      <Stack spacing={1} sx={{ mt: 1.5 }}>
        {data.items.map((it) => <Row key={it.content_key} item={it} />)}
      </Stack>

      <Stack direction="row" spacing={0.6} alignItems="flex-start" sx={{ mt: 1.25, p: 1, borderRadius: 2, bgcolor: "#fffbeb" }}>
        <Icon icon="mdi:star-four-points" width={13} color="#b45309" style={{ flexShrink: 0, marginTop: 3 }} />
        <Typography sx={{ fontSize: "0.72rem", color: "#92400e", fontWeight: 600, lineHeight: 1.45 }}>
          Quiz &amp; coding ease down the longer you take; articles &amp; videos are flat. Practice earns no points.
        </Typography>
      </Stack>
    </Box>
  );
}

function Factor({ text, tone = "muted" }: { text: string; tone?: "muted" | "warn" | "good" }) {
  const styles =
    tone === "good"
      ? { color: "#15803d", bgcolor: "#dcfce7" }
      : tone === "warn"
      ? { color: "#b45309", bgcolor: "#fef3c7" }
      : { color: "#475569", bgcolor: "#f1f5f9" };
  return (
    <Box component="span" sx={{ px: 0.75, py: 0.2, borderRadius: 999, fontSize: "0.64rem", fontWeight: 700, ...styles }}>
      {text}
    </Box>
  );
}

function Row({ item }: { item: PointsBreakdownItem }) {
  const k = KIND[item.kind];
  const done = item.status === "earned";
  const b = item.breakdown;

  const factors: { text: string; tone?: "muted" | "warn" | "good" }[] = [];
  if (b) {
    factors.push({ text: `${b.base} base` });
    if (b.after_decay < b.base) factors.push({ text: `time −${b.base - b.after_decay}`, tone: "warn" });
    const accLabel = CORRECTNESS_LABEL[item.kind];
    if (accLabel) factors.push({ text: `${Math.round(b.correctness_factor * 100)}% ${accLabel}` });
    if (b.late_penalty_mult < 1) factors.push({ text: `late −${Math.round((1 - b.late_penalty_mult) * 100)}%`, tone: "warn" });
    if (b.weight > 1) factors.push({ text: `×${b.weight} weight` });
  }

  return (
    <Box sx={{ p: 1.25, borderRadius: 2.5, border: "1px solid #eef2f7", borderLeft: "3px solid", borderLeftColor: k.color, bgcolor: done ? "#fffdf5" : "#fff" }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ width: 32, height: 32, borderRadius: 2, flexShrink: 0, display: "grid", placeItems: "center", color: k.color, bgcolor: k.bg }}>
          <Icon icon={k.icon} width={17} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.84rem", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</Typography>
          <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>{k.label} · {item.detail}</Typography>
        </Box>
        <Box sx={{ textAlign: "right", flexShrink: 0 }}>
          {done ? (
            <>
              <Typography sx={{ fontWeight: 900, fontSize: "0.95rem", color: "#15803d", lineHeight: 1 }}>+{item.earned}</Typography>
              <Typography sx={{ fontSize: "0.58rem", color: "#94a3b8", fontWeight: 700 }}>of {item.on_offer}</Typography>
            </>
          ) : (
            <>
              <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#475569", lineHeight: 1 }}>{item.on_offer}</Typography>
              <Typography sx={{ fontSize: "0.58rem", color: "#94a3b8", fontWeight: 700 }}>on offer</Typography>
            </>
          )}
        </Box>
      </Stack>
      {done && factors.length > 0 && (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap alignItems="center" sx={{ mt: 0.85, pl: 5 }}>
          {factors.map((f, i) => (
            <Box key={i} component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.4 }}>
              {i > 0 && <Icon icon="mdi:chevron-right" width={11} color="#cbd5e1" />}
              <Factor text={f.text} tone={f.tone} />
            </Box>
          ))}
          <Icon icon="mdi:equal" width={11} color="#cbd5e1" style={{ marginLeft: 1 }} />
          <Factor text={`${item.earned} pts`} tone="good" />
        </Stack>
      )}
    </Box>
  );
}
