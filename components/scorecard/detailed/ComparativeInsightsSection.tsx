"use client";

import { useMemo } from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  AnimatedRing,
  CountUp,
  Reveal,
  SectionHero,
  SectionShell,
  fadeRise,
  gridStagger,
  useStaticRender,
  useViewportEntrance,
} from "@/components/scorecard/shared";
import type { BenchmarkComparison, ComparativeInsights } from "@/lib/types/scorecard.types";
import { proficiencyBandColor } from "@/lib/utils/scorecard-visual";

interface ComparativeInsightsSectionProps {
  data: ComparativeInsights;
}

const ACCENT = "var(--accent-indigo)";
const ACCENT_DARK = "var(--accent-indigo-dark)";
const POSITIVE = "#10b981";
const NEGATIVE = "#ef4444";
const NEUTRAL = "#94a3b8";

function formatValue(value: number | null, unit: string): string {
  if (value == null) return "-";
  if (unit === "hours") return `${value.toFixed(1)}h`;
  return `${value.toFixed(0)}%`;
}

function ordinalize(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function ComparisonCard({ row, index }: { row: BenchmarkComparison; index: number }) {
  const staticRender = useStaticRender();
  const studentAccent =
    row.unit === "percent" ? proficiencyBandColor(row.studentValue) : ACCENT;
  const isAhead = row.batchAverage != null && row.studentValue > row.batchAverage;
  const isBehind = row.batchAverage != null && row.studentValue < row.batchAverage;

  const deltaVsBatch =
    row.batchAverage != null ? row.studentValue - row.batchAverage : null;
  const deltaVsTop =
    row.top10Percent != null ? row.studentValue - row.top10Percent : null;

  const scaleMax =
    Math.max(
      row.studentValue,
      row.batchAverage ?? 0,
      row.top10Percent ?? 0,
      row.unit === "percent" ? 100 : 1,
    ) || 100;
  const pct = (v: number | null) =>
    v == null ? 0 : Math.max(0, Math.min(100, (v / scaleMax) * 100));

  const verdict = isAhead ? "Ahead" : isBehind ? "Behind" : "On par";
  const verdictColor = isAhead ? POSITIVE : isBehind ? NEGATIVE : NEUTRAL;
  const verdictIcon = isAhead
    ? "mdi:trending-up"
    : isBehind
    ? "mdi:trending-down"
    : "mdi:approximately-equal";

  const rows: Array<{
    key: string;
    label: string;
    value: number | null;
    color: string;
    weight: number;
    pillBg: string;
  }> = [
    {
      key: "you",
      label: "You",
      value: row.studentValue,
      color: studentAccent,
      weight: 800,
      pillBg: `color-mix(in srgb, ${studentAccent} 14%, transparent)`,
    },
    {
      key: "batch",
      label: "Batch avg",
      value: row.batchAverage,
      color: ACCENT,
      weight: 700,
      pillBg: `color-mix(in srgb, ${ACCENT} 12%, transparent)`,
    },
    {
      key: "top10",
      label: "Top 10%",
      value: row.top10Percent,
      color: POSITIVE,
      weight: 700,
      pillBg: `color-mix(in srgb, ${POSITIVE} 12%, transparent)`,
    },
  ];

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 14 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const, delay: index * 0.04 },
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          p: { xs: 2, sm: 2.5 },
          borderRadius: 3,
          border:
            "1px solid color-mix(in srgb, var(--border-default) 72%, transparent)",
          bgcolor: "color-mix(in srgb, var(--card-bg) 96%, transparent)",
          overflow: "hidden",
          transition: "all 0.25s ease",
          "&:hover": {
            borderColor: `color-mix(in srgb, ${studentAccent} 35%, transparent)`,
            transform: "translateY(-2px)",
            boxShadow: `0 22px 40px -28px color-mix(in srgb, ${studentAccent} 55%, transparent)`,
          },
        }}
      >
        {/* Accent strip on top */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${studentAccent} 0%, color-mix(in srgb, ${studentAccent} 35%, transparent) 100%)`,
          }}
        />

        {/* Header: label + percentile pill + verdict chip */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 1,
            mb: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                color: "var(--font-secondary)",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                fontSize: "0.62rem",
                display: "block",
                mb: 0.25,
              }}
            >
              Metric · {row.unit === "hours" ? "hours" : "percent"}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                color: "var(--font-primary)",
                fontSize: "1rem",
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              {row.label}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
            <Tooltip
              title={`Higher than ${row.percentile.toFixed(0)}% of cohort on this metric`}
              arrow
            >
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "baseline",
                  gap: 0.5,
                  px: 1,
                  py: 0.5,
                  borderRadius: 999,
                  bgcolor: `color-mix(in srgb, ${studentAccent} 14%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${studentAccent} 28%, transparent)`,
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 900,
                    color: studentAccent,
                    fontVariantNumeric: "tabular-nums",
                    fontSize: "0.92rem",
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {row.percentile.toFixed(0)}
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 700,
                    color: studentAccent,
                    fontSize: "0.6rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  pctile
                </Typography>
              </Box>
            </Tooltip>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.4,
                px: 0.85,
                py: 0.45,
                borderRadius: 999,
                bgcolor: `color-mix(in srgb, ${verdictColor} 14%, transparent)`,
                color: verdictColor,
              }}
            >
              <IconWrapper icon={verdictIcon} size={12} />
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "0.62rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: verdictColor,
                }}
              >
                {verdict}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Three comparison bars */}
        <Box sx={{ display: "grid", gap: 1 }}>
          {rows.map((r) => (
            <Box key={r.key}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 0.4,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: r.weight,
                    color:
                      r.key === "you"
                        ? r.color
                        : "var(--font-secondary)",
                    fontSize: "0.7rem",
                    letterSpacing: "0.04em",
                    textTransform: r.key === "you" ? "uppercase" : "none",
                  }}
                >
                  {r.label}
                </Typography>
                <Box
                  sx={{
                    px: 0.75,
                    py: 0.2,
                    borderRadius: 999,
                    bgcolor: r.pillBg,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 800,
                      color: r.color,
                      fontVariantNumeric: "tabular-nums",
                      fontSize: "0.72rem",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {formatValue(r.value, row.unit)}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  position: "relative",
                  height: r.key === "you" ? 8 : 5,
                  borderRadius: 999,
                  bgcolor: "color-mix(in srgb, var(--border-default) 40%, transparent)",
                  overflow: "hidden",
                }}
              >
                <Box
                  component={motion.div}
                  initial={{ width: staticRender ? `${pct(r.value)}%` : 0 }}
                  {...(staticRender
                    ? { animate: { width: `${pct(r.value)}%` } }
                    : { whileInView: { width: `${pct(r.value)}%` }, viewport: { once: true, amount: 0.3 } })}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] as const, delay: 0.1 }}
                  sx={{
                    height: "100%",
                    borderRadius: 999,
                    background:
                      r.key === "you"
                        ? `linear-gradient(90deg, ${r.color} 0%, color-mix(in srgb, ${r.color} 65%, transparent) 100%)`
                        : r.color,
                    boxShadow:
                      r.key === "you"
                        ? `0 0 12px color-mix(in srgb, ${r.color} 45%, transparent)`
                        : "none",
                  }}
                />
              </Box>
            </Box>
          ))}
        </Box>

        {/* Footer deltas */}
        {(deltaVsBatch != null || deltaVsTop != null) && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
              mt: 1.75,
              pt: 1.25,
              borderTop:
                "1px dashed color-mix(in srgb, var(--border-default) 70%, transparent)",
              flexWrap: "wrap",
            }}
          >
            {deltaVsBatch != null && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography
                  sx={{
                    color: "var(--font-secondary)",
                    fontSize: "0.66rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  vs batch
                </Typography>
                <Typography
                  sx={{
                    color: deltaVsBatch >= 0 ? POSITIVE : NEGATIVE,
                    fontWeight: 800,
                    fontSize: "0.78rem",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {deltaVsBatch >= 0 ? "+" : ""}
                  {deltaVsBatch.toFixed(1)}
                  {row.unit === "hours" ? "h" : "%"}
                </Typography>
              </Box>
            )}
            {deltaVsTop != null && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography
                  sx={{
                    color: "var(--font-secondary)",
                    fontSize: "0.66rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  vs top 10%
                </Typography>
                <Typography
                  sx={{
                    color: deltaVsTop >= 0 ? POSITIVE : NEUTRAL,
                    fontWeight: 800,
                    fontSize: "0.78rem",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {deltaVsTop >= 0 ? "+" : ""}
                  {deltaVsTop.toFixed(1)}
                  {row.unit === "hours" ? "h" : "%"}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </motion.div>
  );
}

export function ComparativeInsightsSection({ data }: ComparativeInsightsSectionProps) {
  const entrance = useViewportEntrance();
  const isEmpty = data.comparisons.length === 0;

  const percentileColor = useMemo(
    () => proficiencyBandColor(data.percentileRank),
    [data.percentileRank],
  );

  const peers = Math.max(0, data.cohortSize - 1);
  const rankApprox = useMemo(() => {
    // Below 10 peers the percentile→rank conversion is too noisy to display
    // as a hard rank - show "-" instead so the user doesn't read a precise
    // "#7 of 9" off of what's really a coarse percentile bucket.
    if (data.cohortSize < 10) return null;
    const ahead = Math.max(0, Math.round(data.cohortSize * (1 - data.percentileRank / 100)));
    return Math.max(1, ahead + 1);
  }, [data.cohortSize, data.percentileRank]);

  // Stat pills around the ring
  const stats = [
    {
      key: "better",
      label: "Ahead on",
      value: data.vsBatchAverage.better,
      color: POSITIVE,
      icon: "mdi:trending-up",
    },
    {
      key: "equal",
      label: "On par",
      value: data.vsBatchAverage.equal,
      color: NEUTRAL,
      icon: "mdi:approximately-equal",
    },
    {
      key: "worse",
      label: "Behind on",
      value: data.vsBatchAverage.worse,
      color: NEGATIVE,
      icon: "mdi:trending-down",
    },
  ];

  return (
    <Reveal as="section">
      <SectionShell
        radialMesh={[
          `radial-gradient(60% 75% at 100% 0%, color-mix(in srgb, ${ACCENT} 16%, transparent), transparent 60%)`,
          `radial-gradient(50% 65% at 0% 100%, color-mix(in srgb, ${POSITIVE} 11%, transparent), transparent 60%)`,
          `radial-gradient(40% 60% at 50% 50%, color-mix(in srgb, ${ACCENT} 6%, transparent), transparent 70%)`,
        ]}
      >
        <SectionHero
          chapter="Chapter 09"
          title="Comparative Insights"
          subtitle="See where you stand against your batch - percentile rank, head-to-head deltas, and per-metric standings."
          iconBadge={{
            icon: "mdi:account-group-outline",
            gradient: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)`,
          }}
        />

        {isEmpty ? (
          <Box
            sx={{
              py: { xs: 6, sm: 8 },
              textAlign: "center",
              borderRadius: 3,
              border: "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
              bgcolor: "color-mix(in srgb, var(--card-bg) 60%, transparent)",
              color: "var(--font-secondary)",
            }}
          >
            <IconWrapper icon="mdi:chart-box-outline" size={48} color="var(--font-secondary)" />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 2, maxWidth: 380, mx: "auto" }}
            >
              Not enough cohort activity yet to compare with peers. Complete a few more sessions and
              this section will fill in.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Hero: cohort percentile ring + standings panel */}
            <Box
              component={motion.div}
              variants={fadeRise}
              {...entrance}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "minmax(0, 320px) minmax(0, 1fr)" },
                gap: { xs: 2.5, md: 3 },
                alignItems: "stretch",
                mb: { xs: 3.5, md: 4.5 },
              }}
            >
              {/* Percentile spotlight */}
              <Box
                sx={{
                  position: "relative",
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 3,
                  background: `linear-gradient(160deg, color-mix(in srgb, ${percentileColor} 16%, transparent) 0%, color-mix(in srgb, ${percentileColor} 4%, transparent) 100%)`,
                  border: `1px solid color-mix(in srgb, ${percentileColor} 24%, transparent)`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.25,
                  textAlign: "center",
                  overflow: "hidden",
                }}
              >
                {/* Decorative dots */}
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `radial-gradient(color-mix(in srgb, ${percentileColor} 14%, transparent) 1px, transparent 1px)`,
                    backgroundSize: "16px 16px",
                    opacity: 0.4,
                    pointerEvents: "none",
                  }}
                />
                <Box sx={{ position: "relative" }}>
                  <AnimatedRing
                    value={data.percentileRank}
                    size={170}
                    strokeWidth={13}
                    color={percentileColor}
                    colorEnd={`color-mix(in srgb, ${percentileColor} 75%, transparent)`}
                    caption=""
                    valueFontSize={38}
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: percentileColor,
                    fontWeight: 800,
                    letterSpacing: "0.2em",
                    fontSize: "0.65rem",
                    textTransform: "uppercase",
                  }}
                >
                  {ordinalize(Math.round(data.percentileRank))} percentile
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 700,
                    color: "var(--font-primary)",
                    fontSize: "0.9rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Ranked{" "}
                  {rankApprox != null ? (
                    <Tooltip
                      title="Approximate rank derived from percentile and cohort size."
                      arrow
                    >
                      <Box component="span" sx={{ fontWeight: 900, color: percentileColor, cursor: "help" }}>
                        ~#{rankApprox}
                      </Box>
                    </Tooltip>
                  ) : (
                    "-"
                  )}{" "}
                  of {data.cohortSize}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "var(--font-secondary)", fontSize: "0.72rem" }}
                >
                  among {peers} peers in your cohort
                </Typography>
              </Box>

              {/* Standings panel */}
              <Box
                sx={{
                  position: "relative",
                  p: { xs: 2.25, md: 2.75 },
                  borderRadius: 3,
                  border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                  bgcolor: "color-mix(in srgb, var(--card-bg) 96%, transparent)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.75,
                  overflow: "hidden",
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--font-secondary)",
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      fontSize: "0.66rem",
                    }}
                  >
                    Head-to-head against batch average
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      color: "var(--font-primary)",
                      fontSize: { xs: "1.1rem", sm: "1.25rem" },
                      letterSpacing: "-0.02em",
                      lineHeight: 1.25,
                      mt: 0.5,
                      maxWidth: 460,
                    }}
                  >
                    You&apos;re{" "}
                    <Box component="span" sx={{ color: POSITIVE }}>
                      ahead on {data.vsBatchAverage.better}
                    </Box>
                    , behind on {data.vsBatchAverage.worse}, even on {data.vsBatchAverage.equal}{" "}
                    metric{data.comparisons.length === 1 ? "" : "s"}.
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                    gap: 1.25,
                    flex: 1,
                  }}
                >
                  {stats.map((s) => (
                    <Box
                      key={s.key}
                      sx={{
                        position: "relative",
                        p: 1.5,
                        borderRadius: 2.5,
                        background: `linear-gradient(160deg, color-mix(in srgb, ${s.color} 14%, transparent) 0%, color-mix(in srgb, ${s.color} 3%, transparent) 100%)`,
                        border: `1px solid color-mix(in srgb, ${s.color} 24%, transparent)`,
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                        overflow: "hidden",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Box
                          sx={{
                            width: 26,
                            height: 26,
                            borderRadius: 1.25,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: `color-mix(in srgb, ${s.color} 20%, transparent)`,
                            color: s.color,
                          }}
                        >
                          <IconWrapper icon={s.icon} size={14} />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: s.color,
                            fontWeight: 800,
                            fontSize: "0.66rem",
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                          }}
                        >
                          {s.label}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontWeight: 900,
                          color: "var(--font-primary)",
                          fontSize: { xs: "1.7rem", md: "2rem" },
                          lineHeight: 1,
                          letterSpacing: "-0.04em",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        <CountUp value={s.value} duration={1.1} />
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "var(--font-secondary)", fontSize: "0.7rem" }}
                      >
                        metric{s.value === 1 ? "" : "s"}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>

            {/* KPI rail */}
            <Box
              component={motion.div}
              variants={gridStagger}
              {...entrance}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                borderTop: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                borderBottom:
                  "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                mb: { xs: 3.5, md: 4.5 },
              }}
            >
              {[
                {
                  label: "Cohort size",
                  value: data.cohortSize,
                  accent: ACCENT,
                  numeric: true as const,
                },
                {
                  label: "Percentile rank",
                  value: Math.round(data.percentileRank),
                  suffix: "p",
                  accent: percentileColor,
                  numeric: true as const,
                },
                {
                  label: "Metrics tracked",
                  value: data.comparisons.length,
                  accent: "var(--accent-purple, #8b5cf6)",
                  numeric: true as const,
                },
                (() => {
                  // Compute "strongest delta" as the largest *relative* lead
                  // above the cohort batch average (delta / batch_avg). Using
                  // a relative ratio means we can compare a +5%-completion
                  // delta to a +20h time delta on the same axis - the prior
                  // formula did a raw Math.max across mixed units, which
                  // made hours-based metrics always win.
                  const relativeLeads = data.comparisons
                    .filter((c) => c.batchAverage != null && c.batchAverage !== 0)
                    .map((c) => {
                      const lead = (c.studentValue - (c.batchAverage as number)) / Math.abs(c.batchAverage as number);
                      return { metric: c, lead };
                    });
                  const best = relativeLeads.length
                    ? relativeLeads.reduce((acc, x) => (x.lead > acc.lead ? x : acc))
                    : null;
                  return {
                    label: "Strongest lead",
                    value:
                      best == null || best.lead <= 0
                        ? "-"
                        : `${best.metric.label} +${Math.round(best.lead * 100)}%`,
                    accent: POSITIVE,
                    numeric: false as const,
                  };
                })(),
              ].map((kpi, idx, arr) => (
                <Box
                  key={`${kpi.label}-${idx}`}
                  component={motion.div}
                  variants={{
                    hidden: { opacity: 0, y: 18 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
                    },
                  }}
                  sx={{
                    position: "relative",
                    py: { xs: 2.25, md: 2.75 },
                    px: { xs: 1.5, sm: 2 },
                    borderRight: {
                      xs:
                        idx % 2 !== 1
                          ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)"
                          : "none",
                      md:
                        idx !== arr.length - 1
                          ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)"
                          : "none",
                    },
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: 28,
                      height: 2,
                      background: kpi.accent,
                    },
                  }}
                >
                  <Typography
                    component="div"
                    sx={{
                      fontWeight: 800,
                      color: "var(--font-primary)",
                      fontSize: { xs: "1.65rem", sm: "2.1rem", md: "2.55rem" },
                      lineHeight: 1,
                      letterSpacing: "-0.04em",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {kpi.numeric ? (
                      <>
                        <CountUp value={Number(kpi.value)} duration={1.3} />
                        {("suffix" in kpi && kpi.suffix) ? (
                          <Box
                            component="span"
                            sx={{
                              fontSize: "0.55em",
                              ml: 0.25,
                              color: "var(--font-secondary)",
                              fontWeight: 700,
                            }}
                          >
                            {kpi.suffix}
                          </Box>
                        ) : null}
                      </>
                    ) : (
                      kpi.value
                    )}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--font-secondary)",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      display: "block",
                      mt: 1,
                    }}
                  >
                    {kpi.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Per-metric comparison grid */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                  mb: 2,
                  flexWrap: "wrap",
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--font-secondary)",
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      fontSize: "0.66rem",
                    }}
                  >
                    Per-metric standings
                  </Typography>
                  <Typography
                    component="h3"
                    sx={{
                      fontWeight: 800,
                      color: "var(--font-primary)",
                      fontSize: { xs: "1.2rem", sm: "1.35rem" },
                      letterSpacing: "-0.02em",
                      mt: 0.5,
                    }}
                  >
                    You vs Batch avg vs Top 10%
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1.25,
                    px: 1.25,
                    py: 0.75,
                    borderRadius: 999,
                    border:
                      "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                    bgcolor: "color-mix(in srgb, var(--card-bg) 80%, transparent)",
                  }}
                >
                  {[
                    { color: "var(--font-primary)", label: "You" },
                    { color: ACCENT, label: "Batch" },
                    { color: POSITIVE, label: "Top 10%" },
                  ].map((l) => (
                    <Box key={l.label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: l.color,
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "var(--font-secondary)",
                          fontWeight: 700,
                          fontSize: "0.66rem",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                        }}
                      >
                        {l.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              <motion.div
                variants={gridStagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.05 }}
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                }}
              >
                {data.comparisons.map((row, i) => (
                  <ComparisonCard key={row.metric} row={row} index={i} />
                ))}
              </motion.div>
            </Box>
          </>
        )}
      </SectionShell>
    </Reveal>
  );
}
