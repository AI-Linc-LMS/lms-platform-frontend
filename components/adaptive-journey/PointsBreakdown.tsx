"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
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
      <Box sx={{ mt: 3, p: 3, display: "grid", placeItems: "center" }}>
        <CircularProgress size={20} sx={{ color: "#f59e0b" }} />
      </Box>
    );
  }
  if (!data || data.items.length === 0) return null;

  const { earned, on_offer } = data.topic;
  const pct = on_offer ? Math.min(100, (earned / on_offer) * 100) : 0;

  return (
    <Box sx={{ mt: 3, borderRadius: 4, border: "1px solid #fde68a", overflow: "hidden", bgcolor: "#fff" }}>
      {/* Header + topic total */}
      <Box sx={{ p: { xs: 2, md: 2.5 }, background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", borderBottom: "1px solid #fde68a" }}>
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
          <Box sx={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)", boxShadow: "0 8px 20px -8px rgba(245,158,11,0.6)" }}>
            <Icon icon="mdi:trophy-variant" width={24} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 180 }}>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#78350f" }}>Points breakdown</Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "#92755b" }}>
              Where this topic&apos;s points come from — completed content earns, the rest is on offer.
            </Typography>
          </Box>
          <Box sx={{ minWidth: 170, flexShrink: 0 }}>
            <Typography sx={{ fontWeight: 900, fontSize: "1.3rem", color: "#78350f", textAlign: { sm: "right" } }}>
              {earned}<Box component="span" sx={{ color: "#b08968", fontWeight: 700, fontSize: "0.95rem" }}> / {on_offer} pts</Box>
            </Typography>
            <Box sx={{ height: 7, borderRadius: 999, bgcolor: "#fde68a", mt: 0.5, overflow: "hidden" }}>
              <Box sx={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: "linear-gradient(90deg, #f59e0b 0%, #f97316 100%)", transition: "width .3s" }} />
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* Per-content rows */}
      <Box sx={{ p: { xs: 1.5, md: 2 } }}>
        <Stack spacing={1}>
          {data.items.map((it) => <Row key={it.content_key} item={it} />)}
        </Stack>
        <Stack direction="row" spacing={0.6} alignItems="flex-start" sx={{ mt: 1.5 }}>
          <Icon icon="mdi:information-outline" width={14} style={{ color: "#cbd5e1", marginTop: 2, flexShrink: 0 }} />
          <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8", lineHeight: 1.5 }}>
            Quiz &amp; coding points start high and ease down the longer you take; articles &amp; videos are flat.
            Late submissions keep less. Additional Practice doesn&apos;t earn points.
          </Typography>
        </Stack>
      </Box>
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
    <Box component="span" sx={{ px: 0.85, py: 0.25, borderRadius: 999, fontSize: "0.68rem", fontWeight: 700, ...styles }}>
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
    if (b.after_decay < b.base) factors.push({ text: `${b.after_decay} after time`, tone: "warn" });
    factors.push({ text: `${Math.round(b.correctness_factor * 100)}% correct` });
    if (b.late_penalty_mult < 1) factors.push({ text: `late −${Math.round((1 - b.late_penalty_mult) * 100)}%`, tone: "warn" });
    if (b.weight > 1) factors.push({ text: `×${b.weight} weight` });
  }

  return (
    <Box sx={{ p: 1.5, borderRadius: 2.5, border: "1px solid #f1f5f9", bgcolor: done ? "#fefce8" : "#fff" }}>
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <Box sx={{ width: 36, height: 36, borderRadius: 2, flexShrink: 0, display: "grid", placeItems: "center", color: k.color, bgcolor: k.bg }}>
          <Icon icon={k.icon} width={19} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>{k.label} · {item.detail}</Typography>
        </Box>
        <Box sx={{ textAlign: "right", flexShrink: 0 }}>
          {done ? (
            <>
              <Typography sx={{ fontWeight: 900, fontSize: "1rem", color: "#15803d" }}>+{item.earned}</Typography>
              <Typography sx={{ fontSize: "0.62rem", color: "#94a3b8", fontWeight: 700 }}>of {item.on_offer} pts</Typography>
            </>
          ) : (
            <>
              <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#475569" }}>{item.on_offer}</Typography>
              <Typography sx={{ fontSize: "0.62rem", color: "#94a3b8", fontWeight: 700 }}>on offer</Typography>
            </>
          )}
        </Box>
      </Stack>
      {done && factors.length > 0 && (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap alignItems="center" sx={{ mt: 1, pl: { sm: 6 } }}>
          {factors.map((f, i) => (
            <Box key={i} component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
              {i > 0 && <Icon icon="mdi:chevron-right" width={12} color="#cbd5e1" />}
              <Factor text={f.text} tone={f.tone} />
            </Box>
          ))}
          <Icon icon="mdi:equal" width={12} color="#cbd5e1" style={{ marginLeft: 2 }} />
          <Factor text={`${item.earned} pts`} tone="good" />
        </Stack>
      )}
    </Box>
  );
}
