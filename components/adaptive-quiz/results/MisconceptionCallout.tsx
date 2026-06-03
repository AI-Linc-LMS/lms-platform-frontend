"use client";

import { useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";
import type { AdaptiveAINarration, AdaptiveResponseRow } from "@/lib/types/adaptive-quiz";

interface MisconceptionCalloutProps {
  misconceptions: AdaptiveAINarration["misconceptions"];
  responses: AdaptiveResponseRow[];
}

type PointKind = "wrong" | "right";

interface EvidencePoint {
  qIdx: number;
  kind: PointKind;
}

const ROW_HEIGHT = 56;
const ROW_GAP = 8;
const PAD_X = 32;
const PAD_TOP = 14;
const PAD_BOTTOM = 26;
const POINT_RADIUS = 7;

const POINT_COLOR: Record<PointKind, string> = {
  wrong: "#f43f5e",
  right: "#f59e0b",
};

/**
 * Misconception detection as a connected dot plot. Each misconception is a
 * horizontal track running across the question timeline; evidence points
 * sit at the question indices that fed the pattern, connected by a
 * gradient line so the pattern "shape" is legible at a glance.
 *
 * Reads like a chart, not a matrix — closer to the AI/ML telemetry vibe the
 * user asked for than the original grid of cells.
 */
export function MisconceptionCallout({ misconceptions, responses }: MisconceptionCalloutProps) {
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState(0);

  const totalQs = responses.length;

  const tracks = useMemo(() => {
    const correctness = new Map<number, boolean>();
    for (const r of responses) correctness.set(r.order_index, r.is_correct);

    return misconceptions.map((m) => {
      const points: EvidencePoint[] = (m.evidence_question_indices ?? [])
        .filter((q) => q >= 0 && q < totalQs)
        .sort((a, b) => a - b)
        .map((q) => ({ qIdx: q, kind: correctness.get(q) ? "right" : "wrong" }));
      const intensity = totalQs > 0 ? points.length / totalQs : 0;
      return { ...m, points, intensity };
    });
  }, [misconceptions, responses, totalQs]);

  if (!misconceptions.length) return null;

  // SVG geometry — virtual width is 1000, height auto-scales so the plot
  // stays crisp at any container width via preserveAspectRatio.
  const VB_WIDTH = 1000;
  const TRACK_TOP = PAD_TOP;
  const plotWidth = VB_WIDTH - PAD_X * 2;
  const VB_HEIGHT = TRACK_TOP + tracks.length * (ROW_HEIGHT + ROW_GAP) - ROW_GAP + PAD_BOTTOM;

  const xFor = (qIdx: number) => {
    if (totalQs <= 1) return PAD_X + plotWidth / 2;
    return PAD_X + (qIdx / (totalQs - 1)) * plotWidth;
  };
  const yForTrack = (rowIdx: number) => TRACK_TOP + rowIdx * (ROW_HEIGHT + ROW_GAP) + ROW_HEIGHT / 2;

  const focus = tracks[selected] ?? tracks[0];

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        p: { xs: 2.5, md: 3.25 },
        borderRadius: 5,
        bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 70%, transparent)",
        border: "1px solid color-mix(in srgb, #f43f5e 22%, transparent)",
        backdropFilter: "blur(22px) saturate(150%)",
        boxShadow:
          "0 1px 0 0 color-mix(in srgb, white 22%, transparent) inset, 0 28px 60px -36px color-mix(in srgb, #f43f5e 50%, transparent)",
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
      }}
    >
      {/* Ambient gradient wash */}
      <Box
        aria-hidden
        component={motion.div}
        animate={reduce ? undefined : { backgroundPositionX: ["0%", "100%", "0%"] }}
        transition={reduce ? undefined : { duration: 14, repeat: Infinity, ease: "linear" }}
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(120deg, color-mix(in srgb, #f43f5e 6%, transparent) 0%, color-mix(in srgb, #a855f7 5%, transparent) 50%, color-mix(in srgb, #6366f1 6%, transparent) 100%)",
          backgroundSize: "240% 100%",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <Box sx={{ position: "relative", display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2.5,
            background: "linear-gradient(135deg, #f43f5e 0%, #a855f7 100%)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 12px 28px -10px color-mix(in srgb, #f43f5e 60%, transparent)",
          }}
        >
          <Icon icon="mdi:chart-bell-curve-cumulative" width={22} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.62rem",
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#f43f5e",
              lineHeight: 1,
            }}
          >
            Pattern detection
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.05rem", md: "1.2rem" }, letterSpacing: "-0.015em", mt: 0.4 }}>
            Misconception trail
          </Typography>
        </Box>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            px: 1.25,
            py: 0.5,
            borderRadius: 999,
            bgcolor: "color-mix(in srgb, #f43f5e 10%, transparent)",
            border: "1px solid color-mix(in srgb, #f43f5e 28%, transparent)",
            color: "#f43f5e",
            fontWeight: 800,
            fontSize: "0.72rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {misconceptions.length} pattern{misconceptions.length === 1 ? "" : "s"}
        </Box>
      </Box>

      <Typography sx={{ position: "relative", fontSize: "0.84rem", color: "text.secondary", mt: -1, lineHeight: 1.5 }}>
        Each track is a pattern the AI spotted. Dots mark the questions that fed the pattern, joined
        by a line so you can read its shape across your attempt.
      </Typography>

      {/* Plot surface */}
      <Box
        sx={{
          position: "relative",
          p: { xs: 1.5, md: 2 },
          borderRadius: 4,
          bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 50%, transparent)",
          border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 60%, transparent)",
          boxShadow: "0 1px 0 0 color-mix(in srgb, white 12%, transparent) inset",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(160px, 220px) 1fr" },
          gap: { xs: 1, md: 2 },
        }}
      >
        {/* Track labels rail (sits left of the SVG so they don't fight for space inside the plot) */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${ROW_GAP}px`, pt: `${PAD_TOP - 6}px` }}>
          {tracks.map((t, rIdx) => {
            const isFocus = rIdx === selected;
            return (
              <Box
                key={rIdx}
                onClick={() => setSelected(rIdx)}
                sx={{
                  height: ROW_HEIGHT,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1,
                  borderRadius: 2,
                  cursor: "pointer",
                  transition: "background 160ms ease",
                  background: isFocus
                    ? "linear-gradient(90deg, color-mix(in srgb, #f43f5e 14%, transparent) 0%, color-mix(in srgb, #a855f7 6%, transparent) 100%)"
                    : "transparent",
                  "&:hover": {
                    background: isFocus
                      ? "linear-gradient(90deg, color-mix(in srgb, #f43f5e 16%, transparent) 0%, color-mix(in srgb, #a855f7 8%, transparent) 100%)"
                      : "color-mix(in srgb, #f43f5e 5%, transparent)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 3,
                    height: 28,
                    borderRadius: 1,
                    background: isFocus
                      ? "linear-gradient(180deg, #f43f5e 0%, #a855f7 100%)"
                      : "color-mix(in srgb, #f43f5e 28%, transparent)",
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: "0.78rem",
                      fontWeight: isFocus ? 800 : 700,
                      color: isFocus ? "text.primary" : "text.secondary",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      lineHeight: 1.2,
                    }}
                  >
                    {t.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.66rem",
                      fontWeight: 700,
                      color: "text.secondary",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontVariantNumeric: "tabular-nums",
                      mt: 0.2,
                    }}
                  >
                    {t.points.length} hit{t.points.length === 1 ? "" : "s"} ·{" "}
                    {Math.round(t.intensity * 100)}%
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* The actual chart */}
        <Box sx={{ position: "relative", minWidth: 0 }}>
          <Box
            component="svg"
            viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
            preserveAspectRatio="none"
            sx={{ width: "100%", height: VB_HEIGHT, display: "block", overflow: "visible" }}
          >
            <defs>
              {/* Line gradient — rose → purple */}
              <linearGradient id="mc-line" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0.9} />
              </linearGradient>
              {/* Dot glow filter */}
              <filter id="mc-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Vertical grid lines + question-number tick labels */}
            {Array.from({ length: totalQs }, (_, i) => {
              const x = xFor(i);
              const everyN = totalQs > 18 ? 5 : totalQs > 10 ? 2 : 1;
              const showLabel = i === 0 || i === totalQs - 1 || (i + 1) % everyN === 0;
              return (
                <g key={i}>
                  <line
                    x1={x}
                    x2={x}
                    y1={TRACK_TOP - 4}
                    y2={VB_HEIGHT - PAD_BOTTOM + 4}
                    stroke="color-mix(in srgb, #6366f1 8%, transparent)"
                    strokeWidth={1}
                    strokeDasharray={showLabel ? undefined : "2 3"}
                  />
                  {showLabel && (
                    <text
                      x={x}
                      y={VB_HEIGHT - 6}
                      textAnchor="middle"
                      fontSize={14}
                      fontWeight={800}
                      fill="color-mix(in srgb, currentColor 55%, transparent)"
                      style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}
                    >
                      Q{i + 1}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Tracks */}
            {tracks.map((track, rIdx) => {
              const y = yForTrack(rIdx);
              const isFocus = rIdx === selected;
              const trackOpacity = isFocus ? 1 : 0.55;

              // Connecting polyline
              const polylinePoints = track.points
                .map((p) => `${xFor(p.qIdx).toFixed(2)},${y.toFixed(2)}`)
                .join(" ");

              return (
                <g key={rIdx} style={{ cursor: "pointer" }} onClick={() => setSelected(rIdx)}>
                  {/* Track baseline */}
                  <line
                    x1={PAD_X}
                    x2={VB_WIDTH - PAD_X}
                    y1={y}
                    y2={y}
                    stroke={
                      isFocus
                        ? "color-mix(in srgb, #f43f5e 35%, transparent)"
                        : "color-mix(in srgb, currentColor 14%, transparent)"
                    }
                    strokeWidth={isFocus ? 1.5 : 1}
                    strokeDasharray={isFocus ? undefined : "3 4"}
                  />

                  {/* Connecting line through evidence points */}
                  {track.points.length > 1 && (
                    <motion.polyline
                      points={polylinePoints}
                      fill="none"
                      stroke="url(#mc-line)"
                      strokeWidth={isFocus ? 3 : 2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={trackOpacity}
                      initial={reduce ? false : { pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{
                        duration: 0.8,
                        delay: reduce ? 0 : 0.2 + rIdx * 0.12,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    />
                  )}

                  {/* Evidence dots */}
                  {track.points.map((p, pIdx) => {
                    const x = xFor(p.qIdx);
                    const color = POINT_COLOR[p.kind];
                    const r = isFocus ? POINT_RADIUS : POINT_RADIUS - 1;
                    return (
                      <g key={pIdx}>
                        {/* Outer halo on focus */}
                        {isFocus && (
                          <motion.circle
                            cx={x}
                            cy={y}
                            r={r + 4}
                            fill={color}
                            opacity={0.18}
                            initial={reduce ? false : { scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              duration: 0.4,
                              delay: reduce ? 0 : 0.4 + pIdx * 0.05,
                              ease: [0.16, 1, 0.3, 1],
                            }}
                            style={{ transformOrigin: `${x}px ${y}px` }}
                          />
                        )}
                        <motion.circle
                          cx={x}
                          cy={y}
                          r={r}
                          fill={color}
                          stroke="rgba(255,255,255,0.65)"
                          strokeWidth={1.5}
                          opacity={trackOpacity}
                          filter={isFocus ? "url(#mc-glow)" : undefined}
                          initial={reduce ? false : { scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            duration: 0.35,
                            delay: reduce ? 0 : 0.25 + rIdx * 0.12 + pIdx * 0.05,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          style={{ transformOrigin: `${x}px ${y}px` }}
                        >
                          <title>
                            Q{p.qIdx + 1} —{" "}
                            {p.kind === "wrong"
                              ? `got it wrong · evidence for "${track.title}"`
                              : `correct but flagged for "${track.title}"`}
                          </title>
                        </motion.circle>
                      </g>
                    );
                  })}

                  {/* Empty-state hint when a misconception has no in-range evidence */}
                  {track.points.length === 0 && (
                    <text
                      x={PAD_X + plotWidth / 2}
                      y={y + 4}
                      textAnchor="middle"
                      fontSize={13}
                      fontWeight={700}
                      fill="color-mix(in srgb, currentColor 45%, transparent)"
                    >
                      No evidence points in range
                    </text>
                  )}
                </g>
              );
            })}
          </Box>

          {/* Legend */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
              alignItems: "center",
              mt: 1,
              pt: 1.25,
              borderTop: "1px dashed color-mix(in srgb, var(--border-default, #e5e7eb) 70%, transparent)",
            }}
          >
            <LegendDot kind="wrong" label="Got it wrong" />
            <LegendDot kind="right" label="Correct but flagged" />
            <LegendLine label="Pattern trail" />
          </Box>
        </Box>
      </Box>

      {/* Focused misconception detail */}
      <AnimatePresence mode="wait" initial={false}>
        {focus && (
          <motion.div
            key={focus.title + selected}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: "relative" }}
          >
            <Box
              sx={{
                position: "relative",
                p: 2.25,
                pl: 2.75,
                borderRadius: 4,
                bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 70%, transparent)",
                border: "1px solid color-mix(in srgb, #f43f5e 24%, transparent)",
                boxShadow:
                  "0 1px 0 0 color-mix(in srgb, white 16%, transparent) inset, 0 16px 40px -28px color-mix(in srgb, #f43f5e 45%, transparent)",
                display: "flex",
                flexDirection: "column",
                gap: 1.25,
                overflow: "hidden",
              }}
            >
              {/* Left accent stripe */}
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: 4,
                  background: "linear-gradient(180deg, #f43f5e 0%, #a855f7 100%)",
                }}
              />

              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#f43f5e",
                  }}
                >
                  Diagnosis
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "text.primary", letterSpacing: "-0.01em" }}>
                  {focus.title}
                </Typography>
                {focus.evidence_question_indices.length > 0 && (
                  <Typography
                    sx={{
                      ml: "auto",
                      fontSize: "0.66rem",
                      fontWeight: 800,
                      color: "text.secondary",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    seen in Q{focus.evidence_question_indices.map((i) => i + 1).join(", Q")}
                  </Typography>
                )}
              </Box>
              <Typography sx={{ fontSize: "0.86rem", color: "text.primary", lineHeight: 1.6 }}>
                {focus.explanation}
              </Typography>
              {focus.fix && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    background:
                      "linear-gradient(135deg, color-mix(in srgb, #10b981 10%, transparent) 0%, color-mix(in srgb, #34d399 6%, transparent) 100%)",
                    border: "1px solid color-mix(in srgb, #10b981 28%, transparent)",
                    display: "flex",
                    gap: 1.25,
                    alignItems: "flex-start",
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 1.5,
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 6px 16px -6px color-mix(in srgb, #10b981 50%, transparent)",
                    }}
                  >
                    <Icon icon="mdi:lightbulb-on-outline" width={16} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: "0.6rem",
                        fontWeight: 800,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "#059669",
                        lineHeight: 1,
                        mb: 0.5,
                      }}
                    >
                      Fix
                    </Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: "text.primary", lineHeight: 1.55 }}>
                      {focus.fix}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

function LegendDot({ kind, label }: { kind: PointKind; label: string }) {
  const color = POINT_COLOR[kind];
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.65 }}>
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          bgcolor: color,
          boxShadow: `0 0 0 1.5px rgba(255,255,255,0.6), 0 4px 12px -3px color-mix(in srgb, ${color} 55%, transparent)`,
        }}
      />
      <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", fontWeight: 600 }}>
        {label}
      </Typography>
    </Box>
  );
}

function LegendLine({ label }: { label: string }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.65 }}>
      <Box
        sx={{
          width: 22,
          height: 3,
          borderRadius: 999,
          background: "linear-gradient(90deg, #f43f5e 0%, #a855f7 100%)",
        }}
      />
      <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", fontWeight: 600 }}>
        {label}
      </Typography>
    </Box>
  );
}
