"use client";

import { useMemo, useState } from "react";
import { Box, Chip, IconButton, LinearProgress, Tooltip, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AnimatedRing, Reveal, gridStagger } from "@/components/scorecard/shared";
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
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
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
  if (!seconds || seconds <= 0) return "—";
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

function PerformanceRow({ row, expanded, onToggle }: {
  row: AssessmentPerformance;
  expanded: boolean;
  onToggle: () => void;
}) {
  const scoreLabel =
    row.score != null
      ? `${row.score.toFixed(0)}%`
      : row.reviewStatus === "pending_evaluation"
        ? "Pending"
        : "—";
  const accent = row.score != null ? proficiencyBandColor(row.score) : "var(--font-secondary)";
  const totalDifficultyQs =
    row.difficultyBreakdown.easy.total +
    row.difficultyBreakdown.medium.total +
    row.difficultyBreakdown.hard.total;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
      }}
    >
      <Box
        sx={{
          position: "relative",
          borderRadius: 3,
          overflow: "hidden",
          border:
            "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
          bgcolor: "var(--card-bg)",
          transition: "border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease",
          "&:hover": {
            borderColor:
              "color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
            transform: "translateY(-1px)",
            boxShadow:
              "0 18px 40px -24px color-mix(in srgb, var(--accent-indigo) 30%, transparent)",
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
            pl: { xs: 2.5, sm: 3 },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  color: "var(--font-primary)",
                  letterSpacing: -0.1,
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
              {row.reviewStatus === "pending_evaluation" && (
                <Chip
                  size="small"
                  label="Pending evaluation"
                  sx={{
                    height: 20,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    bgcolor: "color-mix(in srgb, #f59e0b 14%, transparent)",
                    color: "#b45309",
                  }}
                />
              )}
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, color: "var(--font-secondary)", fontSize: "0.78rem", mb: 1.25 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconWrapper icon="mdi:calendar-month-outline" size={14} />
                {formatDate(row.dateAttempted)}
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconWrapper icon="mdi:timer-outline" size={14} />
                {formatTime(row.timeTaken)}
                {row.timeAllowed > 0 && (
                  <Box component="span" sx={{ color: "var(--font-secondary)", opacity: 0.7 }}>
                    {" "}
                    / {formatTime(row.timeAllowed)}
                  </Box>
                )}
              </Box>
              {row.percentile != null && (
                <Tooltip
                  title={`You scored higher than ${row.percentile.toFixed(0)}% of ${row.cohortCount} peers.`}
                  arrow
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconWrapper icon="mdi:chart-bell-curve" size={14} />
                    {row.percentile.toFixed(0)}p
                  </Box>
                </Tooltip>
              )}
              {row.rank != null && row.cohortCount > 1 && (
                <Tooltip title={`Your rank in this cohort of ${row.cohortCount}.`} arrow>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconWrapper icon="mdi:trophy-outline" size={14} />
                    #{row.rank}
                  </Box>
                </Tooltip>
              )}
            </Box>

            {/* Accuracy + difficulty mini-bars share one row */}
            <Box sx={{ display: "grid", gap: 0.75 }}>
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
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 700, textTransform: "capitalize", color: "var(--font-secondary)", fontSize: "0.7rem" }}
                          >
                            {bucket}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "var(--font-primary)", fontWeight: 700, fontVariantNumeric: "tabular-nums", fontSize: "0.7rem" }}>
                            {cell.correct}/{cell.total}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.max(0, Math.min(100, pct))}
                          sx={{
                            height: 5,
                            borderRadius: 3,
                            bgcolor: "color-mix(in srgb, var(--border-default) 45%, transparent)",
                            "& .MuiLinearProgress-bar": {
                              borderRadius: 3,
                              backgroundColor: color,
                            },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>

            {expanded && (
              <Box
                sx={{
                  mt: 1.75,
                  pt: 1.75,
                  borderTop:
                    "1px dashed color-mix(in srgb, var(--border-default) 70%, transparent)",
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, minmax(0, 1fr))" },
                  gap: 1.25,
                }}
              >
                {[
                  { label: "Correct", value: row.questionAnalytics.correct, color: "#10b981" },
                  { label: "Incorrect", value: row.questionAnalytics.incorrect, color: "#ef4444" },
                  { label: "Skipped", value: row.questionAnalytics.skipped, color: "var(--font-secondary)" },
                  {
                    label: "Avg / Q",
                    value: formatSecondsPerQ(row.questionAnalytics.averageTimePerQuestion),
                    color: "var(--accent-indigo-dark)",
                  },
                ].map((stat) => (
                  <Box key={stat.label}>
                    <Typography variant="caption" sx={{ color: "var(--font-secondary)", textTransform: "uppercase", fontSize: "0.65rem", fontWeight: 700, letterSpacing: 0.4 }}>
                      {stat.label}
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: stat.color, fontSize: "1rem", fontVariantNumeric: "tabular-nums" }}>
                      {stat.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Score ring + expand */}
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
                caption={row.maximumMarks > 0 && row.rawScore != null
                  ? `${row.rawScore} / ${row.maximumMarks}`
                  : "Score"}
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
                <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontWeight: 600 }}>
                  {scoreLabel}
                </Typography>
              </Box>
            )}
            <IconButton
              size="small"
              onClick={onToggle}
              sx={{
                color: "var(--font-secondary)",
                "&:hover": {
                  color: "var(--accent-indigo-dark)",
                  bgcolor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                },
              }}
              aria-label={expanded ? "Hide question analytics" : "Show question analytics"}
            >
              <IconWrapper icon={expanded ? "mdi:chevron-up" : "mdi:chevron-down"} size={18} />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}

export function AssessmentPerformanceSection({ data }: AssessmentPerformanceSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const summary = useMemo(() => {
    const scored = data.filter((d) => d.score != null) as (AssessmentPerformance & { score: number })[];
    const attempts = data.length;
    const avgScore = scored.length
      ? Math.round(scored.reduce((acc, d) => acc + d.score, 0) / scored.length)
      : 0;
    const best = scored.length
      ? Math.round(Math.max(...scored.map((d) => d.score)))
      : 0;
    const pending = data.filter((d) => d.reviewStatus === "pending_evaluation").length;
    return { attempts, avgScore, best, pending };
  }, [data]);

  return (
    <Reveal as="section">
      <Box
        sx={{
          position: "relative",
          borderRadius: 4,
          overflow: "hidden",
          border:
            "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
          backgroundColor: "var(--card-bg)",
          boxShadow:
            "0 1px 0 color-mix(in srgb, var(--border-default) 60%, transparent), 0 30px 60px -30px rgba(15, 23, 42, 0.18)",
          backdropFilter: "blur(6px)",
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.4,
            backgroundImage: [
              "radial-gradient(55% 70% at 100% 0%, color-mix(in srgb, var(--accent-cyan) 14%, transparent), transparent 60%)",
              "radial-gradient(45% 60% at 0% 0%, color-mix(in srgb, var(--accent-indigo) 14%, transparent), transparent 60%)",
            ].join(", "),
            pointerEvents: "none",
          }}
        />

        <Box sx={{ position: "relative", p: { xs: 2.5, sm: 3.5, md: 4.5 } }}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              pb: { xs: 2.5, md: 3 },
              mb: { xs: 2.5, md: 3 },
              borderBottom:
                "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  background:
                    "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-indigo-dark) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    "0 12px 24px -12px color-mix(in srgb, var(--accent-indigo) 60%, transparent)",
                  flexShrink: 0,
                }}
              >
                <IconWrapper icon="mdi:clipboard-check-outline" size={22} color="#fff" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: "var(--font-primary)",
                    fontSize: { xs: "1.05rem", sm: "1.2rem" },
                    lineHeight: 1.25,
                  }}
                >
                  Assessment & Test Performance
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem", mt: 0.25 }}>
                  Each attempt with score, percentile, difficulty breakdown, and timing.
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, auto)" },
                gap: { xs: 1, sm: 1.5 },
              }}
            >
              {[
                { label: "Attempts", value: summary.attempts, color: "var(--accent-indigo-dark)" },
                { label: "Avg", value: `${summary.avgScore}%`, color: proficiencyBandColor(summary.avgScore) },
                { label: "Best", value: `${summary.best}%`, color: proficiencyBandColor(summary.best) },
                { label: "Pending", value: summary.pending, color: summary.pending > 0 ? "#f59e0b" : "var(--font-secondary)" },
              ].map((stat) => (
                <Box
                  key={stat.label}
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 2,
                    bgcolor:
                      "color-mix(in srgb, var(--border-default) 30%, transparent)",
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 78,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase", fontSize: "0.65rem" }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      color: stat.color,
                      fontSize: "1.05rem",
                      lineHeight: 1.2,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {stat.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {data.length === 0 ? (
            <Box
              sx={{
                py: { xs: 4, sm: 6 },
                textAlign: "center",
                borderRadius: 2,
                border: "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
                color: "var(--font-secondary)",
              }}
            >
              <IconWrapper icon="mdi:clipboard-text-outline" size={40} color="var(--font-secondary)" />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                No completed assessments yet. Take an assessment to populate this section.
              </Typography>
            </Box>
          ) : (
            <motion.div
              variants={gridStagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}
            >
              {data.map((row, idx) => (
                <PerformanceRow
                  key={`${row.assessmentId}-${row.dateAttempted ?? idx}`}
                  row={row}
                  expanded={expandedId === `${row.assessmentId}-${idx}`}
                  onToggle={() =>
                    setExpandedId(expandedId === `${row.assessmentId}-${idx}` ? null : `${row.assessmentId}-${idx}`)
                  }
                />
              ))}
            </motion.div>
          )}
        </Box>
      </Box>
    </Reveal>
  );
}
