"use client";

import { useMemo, useState } from "react";
import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material";
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
  useViewportEntrance,
} from "@/components/scorecard/shared";
import type {
  AssessmentDifficultyBreakdown,
  AssessmentPerformance,
} from "@/lib/types/scorecard.types";
import { proficiencyBandColor } from "@/lib/utils/scorecard-visual";

interface AssessmentPerformanceSectionProps {
  data: AssessmentPerformance[];
}

const DIFFICULTY_COLORS: Record<keyof AssessmentDifficultyBreakdown, string> = {
  easy: "#10b981",
  medium: "#f59e0b",
  hard: "#ef4444",
};

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "-";
  }
}
function formatTime(minutes: number): string {
  if (!minutes || minutes < 1) return "<1 min";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
function formatSecondsPerQ(seconds: number): string {
  if (!seconds || seconds <= 0) return "-";
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

/** Hero "showcase" card - used for both BEST and LATEST split cards in the hero block. */
function ShowcaseCard({
  row,
  label,
  accent,
  icon,
}: {
  row: AssessmentPerformance;
  label: string;
  accent: string;
  icon: string;
}) {
  const score = row.score ?? 0;
  return (
    <Box
      sx={{
        position: "relative",
        p: { xs: 2.5, md: 3 },
        borderRadius: 3,
        background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 14%, transparent) 0%, color-mix(in srgb, ${accent} 4%, transparent) 100%)`,
        border: `1px solid color-mix(in srgb, ${accent} 22%, transparent)`,
        display: "grid",
        gridTemplateColumns: "auto minmax(0, 1fr)",
        gap: 2,
        alignItems: "center",
      }}
    >
      <AnimatedRing
        value={row.score != null ? score : 0}
        size={108}
        strokeWidth={10}
        color={accent}
        caption=""
        valueFontSize={26}
      />
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: accent }}>
          <IconWrapper icon={icon} size={14} />
          <Typography
            variant="caption"
            sx={{ fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", fontSize: "0.68rem" }}
          >
            {label}
          </Typography>
        </Box>
        <Typography
          sx={{
            fontWeight: 800,
            color: "var(--font-primary)",
            fontSize: { xs: "1.15rem", md: "1.35rem" },
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            mt: 0.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={row.assessmentName}
        >
          {row.assessmentName}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.78rem" }}>
          {formatDate(row.dateAttempted)}
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, mt: 1, flexWrap: "wrap" }}>
          {row.percentile != null && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "var(--font-secondary)", fontSize: "0.78rem" }}>
              <IconWrapper icon="mdi:chart-bell-curve" size={13} />
              {row.percentile.toFixed(0)}p
            </Box>
          )}
          {row.rank != null && row.cohortCount > 1 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "var(--font-secondary)", fontSize: "0.78rem" }}>
              <IconWrapper icon="mdi:trophy-outline" size={13} />#{row.rank} of {row.cohortCount}
            </Box>
          )}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "var(--font-secondary)", fontSize: "0.78rem" }}>
            <IconWrapper icon="mdi:timer-outline" size={13} />
            {formatTime(row.timeTaken)}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/** Pill-style chip used inside the row metadata strip (date / time / percentile / rank). */
function MetaPill({
  icon,
  children,
  tooltip,
  accent,
}: {
  icon: string;
  children: React.ReactNode;
  tooltip?: string;
  accent?: string;
}) {
  const tone = accent ?? "var(--font-secondary)";
  const node = (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 0.85,
        py: 0.35,
        borderRadius: 999,
        bgcolor: `color-mix(in srgb, ${tone} 9%, transparent)`,
        color: tone,
        fontSize: "0.72rem",
        fontWeight: 700,
        lineHeight: 1.2,
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap",
      }}
    >
      <IconWrapper icon={icon} size={13} />
      {children}
    </Box>
  );
  return tooltip ? <Tooltip title={tooltip} arrow>{node}</Tooltip> : node;
}

function PerformanceRow({
  row,
  expanded,
  onToggle,
  idx,
  prevScore,
  isBest,
  isLatest,
  isLast,
}: {
  row: AssessmentPerformance;
  expanded: boolean;
  onToggle: () => void;
  idx: number;
  prevScore: number | null;
  isBest: boolean;
  isLatest: boolean;
  isLast: boolean;
}) {
  const scoreLabel =
    row.score != null
      ? `${row.score.toFixed(0)}%`
      : row.reviewStatus === "pending_evaluation"
        ? "Pending"
        : "-";
  const accent = row.score != null ? proficiencyBandColor(row.score) : "var(--font-secondary)";
  const totalDifficultyQs =
    row.difficultyBreakdown.easy.total + row.difficultyBreakdown.medium.total + row.difficultyBreakdown.hard.total;

  const delta =
    row.score != null && prevScore != null ? Math.round(row.score - prevScore) : null;
  const deltaColor = delta == null ? "var(--font-secondary)" : delta > 0 ? "#10b981" : delta < 0 ? "#ef4444" : "var(--font-secondary)";
  const deltaIcon =
    delta == null ? "mdi:minus" : delta > 0 ? "mdi:trending-up" : delta < 0 ? "mdi:trending-down" : "mdi:trending-neutral";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "32px minmax(0, 1fr)", sm: "44px minmax(0, 1fr)" },
          columnGap: { xs: 1, sm: 1.5 },
        }}
      >
        {/* Left timeline gutter: pill + rail */}
        <Box
          sx={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            pt: { xs: 2, sm: 2.5 },
          }}
        >
          {/* Rail connecting to next row (hidden for last) */}
          {!isLast && (
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                top: { xs: 52, sm: 58 },
                bottom: -16,
                left: "50%",
                width: 2,
                transform: "translateX(-50%)",
                background: `linear-gradient(180deg, color-mix(in srgb, ${accent} 55%, transparent) 0%, color-mix(in srgb, var(--border-default) 70%, transparent) 100%)`,
                opacity: 0.7,
              }}
            />
          )}
          <Box
            sx={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: { xs: 28, sm: 32 },
              height: { xs: 28, sm: 32 },
              borderRadius: "50%",
              bgcolor: "var(--card-bg)",
              border: `2px solid color-mix(in srgb, ${accent} 60%, transparent)`,
              color: accent,
              fontWeight: 800,
              fontSize: "0.78rem",
              fontVariantNumeric: "tabular-nums",
              boxShadow: `0 0 0 4px color-mix(in srgb, ${accent} 8%, transparent)`,
              zIndex: 1,
            }}
          >
            {isBest ? <IconWrapper icon="mdi:trophy" size={14} /> : idx + 1}
          </Box>
        </Box>

        {/* Card */}
        <Box
          sx={{
            position: "relative",
            borderRadius: 3,
            overflow: "hidden",
            border: isBest
              ? `1px solid color-mix(in srgb, ${accent} 45%, transparent)`
              : "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
            bgcolor: "var(--card-bg)",
            transition: "border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease",
            "&:hover": {
              borderColor: `color-mix(in srgb, ${accent} 45%, transparent)`,
              transform: "translateY(-1px)",
              boxShadow: `0 18px 40px -24px color-mix(in srgb, ${accent} 35%, transparent)`,
            },
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              width: 4,
              background: row.score != null
                ? `linear-gradient(180deg, ${accent} 0%, color-mix(in srgb, ${accent} 70%, transparent) 100%)`
                : "color-mix(in srgb, var(--border-default) 90%, transparent)",
              opacity: 0.85,
            }}
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) auto" },
              gap: { xs: 2, sm: 2.5 },
              p: { xs: 2, sm: 2.5 },
              pl: { xs: 2.25, sm: 2.75 },
              alignItems: "center",
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75, flexWrap: "wrap" }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 800,
                    color: "var(--font-primary)",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={row.assessmentName}
                >
                  {row.assessmentName}
                </Typography>
                {isBest && (
                  <Chip
                    size="small"
                    icon={<IconWrapper icon="mdi:trophy" size={11} />}
                    label="Best"
                    sx={{
                      height: 20,
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      pl: 0.5,
                      "& .MuiChip-icon": { ml: 0.5, mr: -0.25, color: "#0e7c5a" },
                      bgcolor: "color-mix(in srgb, #10b981 16%, transparent)",
                      color: "#0e7c5a",
                    }}
                  />
                )}
                {isLatest && !isBest && (
                  <Chip
                    size="small"
                    icon={<IconWrapper icon="mdi:clock-fast" size={11} />}
                    label="Latest"
                    sx={{
                      height: 20,
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      pl: 0.5,
                      "& .MuiChip-icon": { ml: 0.5, mr: -0.25, color: "var(--accent-indigo-dark)" },
                      bgcolor: "color-mix(in srgb, var(--accent-indigo) 14%, transparent)",
                      color: "var(--accent-indigo-dark)",
                    }}
                  />
                )}
                {row.reviewStatus === "pending_evaluation" && (
                  <Chip
                    size="small"
                    label="Pending evaluation"
                    sx={{
                      height: 20,
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      bgcolor: "color-mix(in srgb, #f59e0b 14%, transparent)",
                      color: "#b45309",
                    }}
                  />
                )}
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.6, mb: 1.5 }}>
                <MetaPill icon="mdi:calendar-month-outline">{formatDate(row.dateAttempted)}</MetaPill>
                <MetaPill icon="mdi:timer-outline">
                  {formatTime(row.timeTaken)}
                  {row.timeAllowed > 0 && (
                    <Box component="span" sx={{ opacity: 0.65, fontWeight: 600, ml: 0.25 }}>
                      / {formatTime(row.timeAllowed)}
                    </Box>
                  )}
                </MetaPill>
                {row.percentile != null && (
                  <MetaPill
                    icon="mdi:chart-bell-curve"
                    tooltip={`You scored higher than ${row.percentile.toFixed(0)}% of ${row.cohortCount} peers.`}
                    accent={proficiencyBandColor(row.percentile)}
                  >
                    {row.percentile.toFixed(0)}p
                  </MetaPill>
                )}
                {row.rank != null && row.cohortCount > 1 && (
                  <MetaPill
                    icon="mdi:trophy-outline"
                    tooltip={`Your rank in this cohort of ${row.cohortCount}.`}
                    accent={row.rank <= 10 ? "#10b981" : row.rank <= Math.max(20, row.cohortCount * 0.25) ? "var(--accent-indigo-dark)" : undefined}
                  >
                    #{row.rank}
                  </MetaPill>
                )}
              </Box>

              {totalDifficultyQs > 0 && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
                  {(["easy", "medium", "hard"] as const).map((bucket) => {
                    const cell = row.difficultyBreakdown[bucket];
                    if (cell.total === 0) return null;
                    const pct = (cell.correct / Math.max(1, cell.total)) * 100;
                    const color = DIFFICULTY_COLORS[bucket];
                    return (
                      <Box key={bucket} sx={{ minWidth: 110, flex: 1 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.25 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: color }} />
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 800, textTransform: "capitalize", color: "var(--font-secondary)", fontSize: "0.7rem", letterSpacing: "0.04em" }}
                            >
                              {bucket}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                            <Typography variant="caption" sx={{ color: "var(--font-primary)", fontWeight: 800, fontVariantNumeric: "tabular-nums", fontSize: "0.7rem" }}>
                              {cell.correct}/{cell.total}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontWeight: 700, fontVariantNumeric: "tabular-nums", fontSize: "0.62rem" }}>
                              · {Math.round(pct)}%
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ height: 6, borderRadius: 999, bgcolor: "color-mix(in srgb, var(--border-default) 45%, transparent)", overflow: "hidden" }}>
                          <Box
                            sx={{
                              width: `${Math.max(0, Math.min(100, pct))}%`,
                              height: "100%",
                              background: `linear-gradient(90deg, ${color} 0%, color-mix(in srgb, ${color} 65%, transparent) 100%)`,
                              transition: "width 0.6s ease",
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {expanded && (
                <Box
                  sx={{
                    mt: 1.75,
                    pt: 1.75,
                    borderTop: "1px dashed color-mix(in srgb, var(--border-default) 70%, transparent)",
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, minmax(0, 1fr))" },
                    gap: 1.25,
                  }}
                >
                  {[
                    { label: "Correct", value: row.questionAnalytics.correct, color: "#10b981" },
                    { label: "Incorrect", value: row.questionAnalytics.incorrect, color: "#ef4444" },
                    { label: "Skipped", value: row.questionAnalytics.skipped, color: "var(--font-secondary)" },
                    { label: "Avg / Q", value: formatSecondsPerQ(row.questionAnalytics.averageTimePerQuestion), color: "var(--accent-indigo-dark)" },
                  ].map((stat) => (
                    <Box key={stat.label}>
                      <Typography variant="caption" sx={{ color: "var(--font-secondary)", textTransform: "uppercase", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.14em" }}>
                        {stat.label}
                      </Typography>
                      <Typography sx={{ fontWeight: 800, color: stat.color, fontSize: "1.05rem", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>
                        {stat.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "row", sm: "column" },
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                minWidth: { xs: "auto", sm: 110 },
              }}
            >
              {row.score != null ? (
                <AnimatedRing
                  value={row.score}
                  size={84}
                  strokeWidth={9}
                  color={accent}
                  caption={row.maximumMarks > 0 && row.rawScore != null ? `${row.rawScore} / ${row.maximumMarks}` : "Score"}
                  valueFontSize={20}
                />
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.5,
                    px: 2,
                    py: 1.25,
                    borderRadius: 2,
                    border: "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
                  }}
                >
                  <IconWrapper icon="mdi:hourglass-empty" size={20} color="var(--font-secondary)" />
                  <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontWeight: 700 }}>
                    {scoreLabel}
                  </Typography>
                </Box>
              )}
              {delta != null && (
                <Tooltip
                  title={
                    delta === 0
                      ? "Same as previous attempt"
                      : `${delta > 0 ? "Up" : "Down"} ${Math.abs(delta)} pts vs previous attempt`
                  }
                  arrow
                >
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.35,
                      px: 0.85,
                      py: 0.25,
                      borderRadius: 999,
                      bgcolor: `color-mix(in srgb, ${deltaColor} 14%, transparent)`,
                      color: deltaColor,
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    <IconWrapper icon={deltaIcon} size={12} />
                    {delta > 0 ? `+${delta}` : delta}
                  </Box>
                </Tooltip>
              )}
              <IconButton
                size="small"
                onClick={onToggle}
                sx={{
                  color: "var(--font-secondary)",
                  "&:hover": { color: "var(--accent-indigo-dark)", bgcolor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)" },
                }}
                aria-label={expanded ? "Hide question analytics" : "Show question analytics"}
              >
                <IconWrapper icon={expanded ? "mdi:chevron-up" : "mdi:chevron-down"} size={18} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}

export function AssessmentPerformanceSection({ data }: AssessmentPerformanceSectionProps) {
  const entrance = useViewportEntrance();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Timeline collapse: show the 10 most recent attempts by default. With a
  // heavy test cycle the section can otherwise hit 30+ rows and dwarf the
  // KPI rail above it. The full list is one click away.
  const TIMELINE_PREVIEW = 10;
  const [showAllAttempts, setShowAllAttempts] = useState(false);

  const summary = useMemo(() => {
    const scored = data.filter((d) => d.score != null) as (AssessmentPerformance & { score: number })[];
    const attempts = data.length;
    const avgScore = scored.length ? Math.round(scored.reduce((acc, d) => acc + d.score, 0) / scored.length) : 0;
    const best = scored.length ? scored.reduce((acc, d) => (d.score > acc.score ? d : acc), scored[0]) : null;
    // Resolve "latest" by dateAttempted instead of trusting API order.
    const withDate = scored.filter((d) => d.dateAttempted);
    const latest = withDate.length
      ? [...withDate].sort((a, b) => (b.dateAttempted ?? "").localeCompare(a.dateAttempted ?? ""))[0]
      : scored[0] ?? null;
    const pending = data.filter((d) => d.reviewStatus === "pending_evaluation").length;

    // Map each displayed row (by original index) → score of the chronologically previous attempt.
    // Trend is "vs the attempt before this one in time", regardless of display order.
    const prevScoreByIdx = new Map<number, number | null>();
    const datedWithIdx = data
      .map((d, originalIdx) => ({ d, originalIdx }))
      .filter((x) => x.d.dateAttempted && x.d.score != null)
      .sort((a, b) => (a.d.dateAttempted ?? "").localeCompare(b.d.dateAttempted ?? ""));
    for (let i = 0; i < datedWithIdx.length; i++) {
      const prev = i > 0 ? datedWithIdx[i - 1].d.score ?? null : null;
      prevScoreByIdx.set(datedWithIdx[i].originalIdx, prev);
    }

    return { attempts, avgScore, best, latest, pending, prevScoreByIdx };
  }, [data]);

  return (
    <Reveal as="section">
      <SectionShell
        radialMesh={[
          "radial-gradient(50% 60% at 100% 0%, color-mix(in srgb, var(--accent-cyan) 14%, transparent), transparent 60%)",
          "radial-gradient(45% 55% at 0% 0%, color-mix(in srgb, var(--accent-indigo) 14%, transparent), transparent 60%)",
        ]}
      >
        <SectionHero
          chapter="Chapter 06"
          title="Assessment & Test Performance"
          subtitle="Each attempt with score, percentile, difficulty breakdown, and timing."
          iconBadge={{
            icon: "mdi:clipboard-check-outline",
            gradient: "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-indigo-dark) 100%)",
          }}
        />

        {data.length === 0 ? (
          <Box
            sx={{
              py: { xs: 5, sm: 7 },
              textAlign: "center",
              borderRadius: 3,
              border: "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
              color: "var(--font-secondary)",
            }}
          >
            <IconWrapper icon="mdi:clipboard-text-outline" size={48} color="var(--font-secondary)" />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              No completed assessments yet. Take an assessment to populate this section.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Hero: Best + Latest split cards */}
            {(summary.best || summary.latest) && (
              <Box
                component={motion.div}
                variants={fadeRise}
                {...entrance}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 2,
                  mb: { xs: 3.5, md: 4.5 },
                }}
              >
                {summary.best && (
                  <ShowcaseCard row={summary.best} label="Best performance" accent="#10b981" icon="mdi:trophy" />
                )}
                {summary.latest && summary.latest !== summary.best && (
                  <ShowcaseCard row={summary.latest} label="Most recent" accent="var(--accent-indigo)" icon="mdi:clock-fast" />
                )}
                {summary.latest && summary.latest === summary.best && (
                  <Box
                    sx={{
                      p: { xs: 2.5, md: 3 },
                      borderRadius: 3,
                      bgcolor: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--accent-indigo) 22%, transparent)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: 1,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "var(--accent-indigo-dark)", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", fontSize: "0.68rem" }}>
                      🌟 Your latest IS your best
                    </Typography>
                    <Typography sx={{ color: "var(--font-primary)", fontWeight: 700, fontSize: "0.92rem", lineHeight: 1.5 }}>
                      You&apos;re trending up - keep this momentum on the next attempt.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* KPI rail */}
            <Box
              component={motion.div}
              variants={gridStagger}
              {...entrance}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                borderTop: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                borderBottom: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                mb: { xs: 3.5, md: 4.5 },
              }}
            >
              {[
                { label: "Attempts", value: summary.attempts, accent: "var(--accent-indigo-dark)" },
                { label: "Avg score", value: summary.avgScore, suffix: "%", accent: proficiencyBandColor(summary.avgScore) },
                { label: "Best", value: summary.best?.score ?? 0, suffix: "%", accent: proficiencyBandColor(summary.best?.score ?? 0) },
                { label: "Pending review", value: summary.pending, accent: summary.pending > 0 ? "#f59e0b" : "var(--font-secondary)" },
              ].map((kpi, idx) => (
                <Box
                  key={kpi.label}
                  component={motion.div}
                  variants={{
                    hidden: { opacity: 0, y: 18 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
                  }}
                  sx={{
                    position: "relative",
                    py: { xs: 2.25, md: 2.75 },
                    px: { xs: 1.5, sm: 2 },
                    borderRight: {
                      xs: idx % 2 !== 1 ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)" : "none",
                      md: idx !== 3 ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)" : "none",
                    },
                    borderBottom: { xs: idx < 2 ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)" : "none", md: "none" },
                    "&:hover": { backgroundColor: `color-mix(in srgb, ${kpi.accent} 6%, transparent)` },
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
                    sx={{
                      fontWeight: 800,
                      color: "var(--font-primary)",
                      fontSize: { xs: "1.7rem", sm: "2.1rem", md: "2.6rem" },
                      lineHeight: 1,
                      letterSpacing: "-0.04em",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    <CountUp value={Math.round(Number(kpi.value))} duration={1.4} />
                    {kpi.suffix}
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

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "var(--font-secondary)" }}>
                <IconWrapper icon="mdi:timeline-text-outline" size={14} />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  Timeline · most recent first
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  height: 1,
                  background:
                    "linear-gradient(90deg, color-mix(in srgb, var(--border-default) 75%, transparent) 0%, transparent 100%)",
                }}
              />
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1,
                  py: 0.35,
                  borderRadius: 999,
                  bgcolor: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
                  color: "var(--accent-indigo-dark)",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <IconWrapper icon="mdi:clipboard-check-outline" size={12} />
                {data.length} {data.length === 1 ? "attempt" : "attempts"}
              </Box>
            </Box>

            <motion.div
              variants={gridStagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.05 }}
              style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}
            >
              {(showAllAttempts ? data : data.slice(0, TIMELINE_PREVIEW)).map((row, idx) => {
                // Use the same key schema for React-key and expanded-state so two
                // attempts of the same assessment can be toggled independently.
                // Previously the expanded-state key dropped `dateAttempted`, so
                // any duplicate `assessmentId` caused the second row's toggle
                // to flip the first row's state.
                const rowKey = `${row.assessmentId}-${row.dateAttempted ?? idx}`;
                const visibleCount = showAllAttempts ? data.length : Math.min(TIMELINE_PREVIEW, data.length);
                return (
                  <PerformanceRow
                    key={rowKey}
                    row={row}
                    idx={idx}
                    prevScore={summary.prevScoreByIdx.get(idx) ?? null}
                    isBest={!!summary.best && row === summary.best}
                    isLatest={!!summary.latest && row === summary.latest && summary.latest !== summary.best}
                    isLast={idx === visibleCount - 1}
                    expanded={expandedId === rowKey}
                    onToggle={() =>
                      setExpandedId(expandedId === rowKey ? null : rowKey)
                    }
                  />
                );
              })}
            </motion.div>

            {/* "Show all" toggle for the timeline. Hides when the full list
                already fits in the preview window. */}
            {data.length > TIMELINE_PREVIEW && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2.5 }}>
                <Box
                  component="button"
                  onClick={() => setShowAllAttempts((v) => !v)}
                  sx={{
                    appearance: "none",
                    border: "1px solid color-mix(in srgb, var(--accent-indigo) 28%, transparent)",
                    backgroundColor: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)",
                    color: "var(--accent-indigo-dark)",
                    fontWeight: 800,
                    fontSize: "0.78rem",
                    letterSpacing: "0.04em",
                    px: 2.25,
                    py: 1,
                    borderRadius: 999,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    transition: "all 0.18s ease",
                    "&:hover": {
                      borderColor: "var(--accent-indigo)",
                      backgroundColor: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
                      transform: "translateY(-1px)",
                    },
                  }}
                  aria-expanded={showAllAttempts}
                  aria-label={showAllAttempts ? "Collapse the timeline" : `Show all ${data.length} attempts`}
                >
                  <IconWrapper icon={showAllAttempts ? "mdi:chevron-up" : "mdi:chevron-down"} size={16} />
                  {showAllAttempts
                    ? `Show recent ${TIMELINE_PREVIEW}`
                    : `Show all ${data.length} attempts`}
                </Box>
              </Box>
            )}
          </>
        )}
      </SectionShell>
    </Reveal>
  );
}
