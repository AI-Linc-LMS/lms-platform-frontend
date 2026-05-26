"use client";

import { Box, LinearProgress, Tooltip, Typography } from "@mui/material";
import { proficiencyBandColor } from "@/lib/utils/scorecard-visual";

export interface SkillAccuracyBarsRow {
  skillName: string;
  accuracy: number;
  attemptCount: number;
  confidenceScore: number;
}

export interface SkillAccuracyBarsProps {
  data: SkillAccuracyBarsRow[];
  title?: string;
  /** Cap on number of rows rendered before showing a "+N more" line. */
  maxRows?: number;
  /** When the dataset is sparse, hint at what's needed to populate the chart. */
  emptyHint?: string;
}

/**
 * Skill-wise accuracy chart for the Performance Trends section.
 *
 * Linear progress bars rather than a recharts bar chart so dense skill lists
 * stay readable and the value labels (accuracy %, attempts, confidence)
 * can sit inline. Color follows proficiencyBandColor so it matches the
 * existing overview score palette.
 */
export function SkillAccuracyBars({
  data,
  title,
  maxRows = 8,
  emptyHint,
}: SkillAccuracyBarsProps) {
  const rows = (data ?? []).slice(0, maxRows);
  const overflow = (data?.length ?? 0) - rows.length;

  return (
    <Box>
      {title && (
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            color: "var(--font-primary)",
            mb: 1.5,
            letterSpacing: 0.2,
          }}
        >
          {title}
        </Typography>
      )}
      {rows.length === 0 ? (
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            border:
              "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
            textAlign: "center",
            color: "var(--font-secondary)",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {emptyHint ??
              "Tag content with skills (admin) and complete quizzes to populate the per-skill accuracy chart."}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "grid", gap: 1.25 }}>
          {rows.map((row) => {
            const accent = proficiencyBandColor(row.accuracy);
            return (
              <Box key={row.skillName}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "var(--font-primary)",
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={row.skillName}
                  >
                    {row.skillName}
                  </Typography>
                  <Tooltip
                    title={`${row.attemptCount} attempt${row.attemptCount === 1 ? "" : "s"} · confidence ${row.confidenceScore}%`}
                    arrow
                    placement="top"
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 700,
                        color: accent,
                      }}
                    >
                      {row.accuracy.toFixed(0)}%
                    </Typography>
                  </Tooltip>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.max(0, Math.min(100, row.accuracy))}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor:
                      "color-mix(in srgb, var(--border-default) 50%, transparent)",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 4,
                      backgroundColor: accent,
                    },
                  }}
                />
              </Box>
            );
          })}
          {overflow > 0 && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              + {overflow} more skill{overflow === 1 ? "" : "s"} not shown
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
