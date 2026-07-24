"use client";

import { useEffect, useState } from "react";
import { Box, LinearProgress, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

// The AI mapping is a single (multi-second) call we can't get sub-progress from,
// so we narrate the work in stages. The stages advance on a timer and the last
// one stays active until the response lands - so the wait reads as "working",
// never frozen.
const STAGES: Array<{ icon: string; label: string }> = [
  { icon: "mdi:file-table-outline", label: "Reading your rows" },
  { icon: "mdi:table-column", label: "Identifying week, topic & description columns" },
  { icon: "mdi:calendar-week-begin", label: "Grouping topics into weekly modules" },
  { icon: "mdi:lightbulb-on-outline", label: "Deriving the skills each topic teaches" },
  { icon: "mdi:check-decagram-outline", label: "Finalizing your course plan" },
];

const STEP_MS = 2200;

export function CsvAnalyzingProgress({
  rowCount,
  columnCount,
}: {
  rowCount: number;
  columnCount: number;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // Hold on the final stage - it completes only when the plan arrives (unmount).
      setActive((i) => Math.min(i + 1, STAGES.length - 1));
    }, STEP_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <Box
      sx={{
        borderRadius: 4,
        p: 2.5,
        bgcolor: "color-mix(in srgb, #6366f1 7%, var(--card-bg))",
        border: "1px solid color-mix(in srgb, #6366f1 30%, transparent)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <Icon icon="mdi:sparkles" width={20} style={{ color: "#a855f7" }} />
        <Typography sx={{ fontWeight: 800 }}>Analyzing with AI…</Typography>
      </Box>
      <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mb: 1.5 }}>
        Reading {rowCount} {rowCount === 1 ? "row" : "rows"} across {columnCount}{" "}
        {columnCount === 1 ? "column" : "columns"} - this usually takes a few seconds.
      </Typography>

      <LinearProgress
        sx={{
          height: 6,
          borderRadius: 999,
          mb: 2,
          bgcolor: "color-mix(in srgb, #6366f1 18%, transparent)",
          "& .MuiLinearProgress-bar": {
            background: "linear-gradient(90deg, #6366f1 0%, #a855f7 60%, #ec4899 100%)",
          },
        }}
      />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {STAGES.map((stage, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <Box key={stage.label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 20, height: 20, display: "grid", placeItems: "center", flexShrink: 0 }}>
                {done ? (
                  <Icon icon="mdi:check-circle" width={18} style={{ color: "#10b981" }} />
                ) : current ? (
                  <Box
                    sx={{
                      display: "inline-flex",
                      animation: "csv-analyze-spin 0.9s linear infinite",
                      "@keyframes csv-analyze-spin": { to: { transform: "rotate(360deg)" } },
                    }}
                  >
                    <Icon icon="mdi:loading" width={18} style={{ color: "#6366f1" }} />
                  </Box>
                ) : (
                  <Icon icon={stage.icon} width={16} style={{ color: "var(--border-default)" }} />
                )}
              </Box>
              <Typography
                sx={{
                  fontSize: "0.84rem",
                  fontWeight: done || current ? 700 : 500,
                  color: done ? "text.secondary" : current ? "text.primary" : "text.disabled",
                  transition: "color 200ms ease",
                }}
              >
                {stage.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
