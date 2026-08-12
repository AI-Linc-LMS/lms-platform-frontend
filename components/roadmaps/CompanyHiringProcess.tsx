"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";
import { SectionHeading, Surface } from "./surfaces";
import type {
  RoadmapHiringStage,
  RoadmapSyllabusRound,
} from "@/lib/services/roadmaps.service";

/**
 * The hiring funnel: one numbered step per published stage.
 *
 * This is the editorial spine the roadmap's milestones were generated from, so the two must
 * stay legible as the same sequence. It reads top to bottom with a continuous rail because a
 * hiring process is genuinely linear, unlike the map below it, which is a graph.
 */
export function CompanyHiringProcess({
  stages,
  syllabus,
}: {
  stages: RoadmapHiringStage[];
  syllabus?: RoadmapSyllabusRound[];
}) {
  if (!stages?.length) return null;

  // Round format details are keyed by a loose name match: the two arrays are authored
  // separately per company and their labels agree only sometimes ("Coding Round" vs "Coding").
  // A miss simply means no format chip, never a wrong one attached to the wrong stage.
  const formatFor = (stage: string) => {
    const key = stage.toLowerCase();
    return (syllabus ?? []).find((s) => {
      const r = (s.round || "").toLowerCase();
      return r === key || r.includes(key) || key.includes(r);
    });
  };

  return (
    <Surface>
      <SectionHeading
        icon="solar:routing-2-linear"
        title="The hiring process"
        count={stages.length}
        noun="stage"
      />

      <Box
        component="ol"
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, minmax(0,1fr))",
            xl: "repeat(3, minmax(0,1fr))",
          },
        }}
      >
        {stages.map((step, i) => {
          const format = formatFor(step.stage);
          return (
            <Box
              component="li"
              key={`${step.stage}-${i}`}
              sx={{ display: "flex", gap: 1.5, minWidth: 0 }}
            >
              {/* The rail is drawn per item and stops at the last one, so it never overshoots
                  past the final badge the way a single absolutely-positioned line does. */}

              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  bgcolor: "var(--accent-purple)",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 600,
                  fontSize: 14,
                  flexShrink: 0,
                  zIndex: 1,
                }}
              >
                {i + 1}
              </Box>
              <Box sx={{ minWidth: 0, pt: 0.25 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ flexWrap: "wrap", rowGap: 0.5 }}
                >
                  <Typography sx={{ fontWeight: 600, fontSize: 15, color: "var(--font-primary)" }}>
                    {step.stage}
                  </Typography>
                  {format?.type === "Elimination" && (
                    <Chip
                      label="Elimination"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: 10.5,
                        fontWeight: 500,
                        bgcolor: "transparent",
                        border: "1px solid var(--border-default)",
                        color: "var(--font-tertiary)",
                      }}
                    />
                  )}
                  {format?.type === "Final" && (
                    <Chip
                      label="Final"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: 10.5,
                        fontWeight: 500,
                        bgcolor: "transparent",
                        border: "1px solid var(--border-default)",
                        color: "var(--font-tertiary)",
                      }}
                    />
                  )}
                </Stack>
                {step.detail && (
                  <Typography sx={{ mt: 0.4, fontSize: 13.5, color: "var(--font-secondary)", lineHeight: 1.55 }}>
                    {step.detail}
                  </Typography>
                )}
                {format?.info && (
                  <Typography sx={{ mt: 0.4, fontSize: 12.5, color: "var(--font-tertiary)", fontWeight: 500 }}>
                    {format.info}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Surface>
  );
}
