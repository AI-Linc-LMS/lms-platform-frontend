"use client";

import { Box, LinearProgress, Tooltip, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AnimatedRing, CountUp, Reveal, gridStagger } from "@/components/scorecard/shared";
import type { BenchmarkComparison, ComparativeInsights } from "@/lib/types/scorecard.types";
import { proficiencyBandColor } from "@/lib/utils/scorecard-visual";

interface ComparativeInsightsSectionProps {
  data: ComparativeInsights;
}

function formatValue(value: number | null, unit: string): string {
  if (value == null) return "—";
  if (unit === "hours") return `${value.toFixed(1)}h`;
  return `${value.toFixed(0)}%`;
}

function ComparisonRow({ row }: { row: BenchmarkComparison }) {
  const studentAccent =
    row.unit === "percent" ? proficiencyBandColor(row.studentValue) : "var(--accent-indigo)";

  const aboveBatch =
    row.batchAverage != null && row.studentValue > row.batchAverage;
  const trendIcon = aboveBatch
    ? "mdi:trending-up"
    : row.batchAverage != null && row.studentValue < row.batchAverage
    ? "mdi:trending-down"
    : "mdi:trending-neutral";
  const trendColor = aboveBatch
    ? "#10b981"
    : row.batchAverage != null && row.studentValue < row.batchAverage
    ? "#ef4444"
    : "var(--font-secondary)";

  // For the bar visualization, use the top10 as 100% reference when available;
  // otherwise scale to the larger of studentValue / batchAverage.
  const scaleMax = Math.max(
    row.studentValue,
    row.batchAverage ?? 0,
    row.top10Percent ?? 0,
    row.unit === "percent" ? 100 : 1,
  ) || 100;
  const pct = (v: number | null) => (v == null ? 0 : Math.max(0, Math.min(100, (v / scaleMax) * 100)));

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
      }}
    >
      <Box
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderRadius: 2.5,
          border:
            "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
          bgcolor: "var(--card-bg)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
            mb: 1.25,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
            <Box sx={{ color: trendColor }}>
              <IconWrapper icon={trendIcon} size={16} />
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)" }}>
              {row.label}
            </Typography>
          </Box>
          <Tooltip title={`You scored higher than ${row.percentile.toFixed(0)}% of the cohort on this metric.`} arrow>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                color: studentAccent,
                fontVariantNumeric: "tabular-nums",
                fontSize: "0.72rem",
                bgcolor: `color-mix(in srgb, ${studentAccent} 14%, transparent)`,
                px: 0.75,
                py: 0.25,
                borderRadius: 999,
              }}
            >
              {row.percentile.toFixed(0)}p
            </Typography>
          </Tooltip>
        </Box>

        {/* Three-bar comparison: you, batch, top 10% */}
        <Box sx={{ display: "grid", gap: 0.75 }}>
          {[
            {
              label: "You",
              value: row.studentValue,
              color: studentAccent,
              weight: 800,
              colorOverride: studentAccent,
            },
            {
              label: "Batch avg",
              value: row.batchAverage,
              color: "var(--accent-indigo)",
              weight: 600,
            },
            {
              label: "Top 10%",
              value: row.top10Percent,
              color: "#10b981",
              weight: 600,
            },
          ].map((b) => (
            <Box key={b.label}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 0.25,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: b.weight,
                    color: "var(--font-secondary)",
                    fontSize: "0.7rem",
                  }}
                >
                  {b.label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: "var(--font-primary)",
                    fontVariantNumeric: "tabular-nums",
                    fontSize: "0.7rem",
                  }}
                >
                  {formatValue(b.value, row.unit)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={pct(b.value)}
                sx={{
                  height: 5,
                  borderRadius: 3,
                  bgcolor: "color-mix(in srgb, var(--border-default) 45%, transparent)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 3,
                    backgroundColor: b.color,
                  },
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </motion.div>
  );
}

export function ComparativeInsightsSection({ data }: ComparativeInsightsSectionProps) {
  const isEmpty = data.comparisons.length === 0;

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
              "radial-gradient(55% 70% at 100% 0%, color-mix(in srgb, var(--accent-indigo) 16%, transparent), transparent 60%)",
              "radial-gradient(45% 60% at 0% 100%, color-mix(in srgb, #10b981 12%, transparent), transparent 60%)",
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
                  background: "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-indigo-dark) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    "0 12px 24px -12px color-mix(in srgb, var(--accent-indigo) 60%, transparent)",
                  flexShrink: 0,
                }}
              >
                <IconWrapper icon="mdi:account-group-outline" size={22} color="#fff" />
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
                  Comparative Insights
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem", mt: 0.25 }}>
                  Where you stand vs your batch — across {data.cohortSize - 1} peers in your cohort.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <AnimatedRing
                value={data.percentileRank}
                size={72}
                strokeWidth={8}
                color={proficiencyBandColor(data.percentileRank)}
                caption="Percentile"
                valueFontSize={18}
              />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {[
                  { label: "Better", value: data.vsBatchAverage.better, color: "#10b981", icon: "mdi:trending-up" },
                  { label: "Equal", value: data.vsBatchAverage.equal, color: "var(--font-secondary)", icon: "mdi:approximately-equal" },
                  { label: "Worse", value: data.vsBatchAverage.worse, color: "#ef4444", icon: "mdi:trending-down" },
                ].map((s) => (
                  <Box
                    key={s.label}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      color: s.color,
                    }}
                  >
                    <IconWrapper icon={s.icon} size={14} />
                    <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", fontVariantNumeric: "tabular-nums" }}>
                      <CountUp value={s.value} duration={0.6} />
                    </Typography>
                    <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontSize: "0.7rem" }}>
                      {s.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          {isEmpty ? (
            <Box
              sx={{
                py: { xs: 4, sm: 6 },
                textAlign: "center",
                borderRadius: 2,
                border: "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
                color: "var(--font-secondary)",
              }}
            >
              <IconWrapper icon="mdi:chart-box-outline" size={40} color="var(--font-secondary)" />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                Not enough activity yet to compare with peers. Complete a few more sessions to populate.
              </Typography>
            </Box>
          ) : (
            <motion.div
              variants={gridStagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "1fr",
              }}
            >
              {data.comparisons.map((row) => (
                <ComparisonRow key={row.metric} row={row} />
              ))}
            </motion.div>
          )}
        </Box>
      </Box>
    </Reveal>
  );
}
