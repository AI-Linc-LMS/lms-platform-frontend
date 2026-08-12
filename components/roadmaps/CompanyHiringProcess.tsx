"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";
import type {
  RoadmapHiringStage,
  RoadmapSyllabusRound,
} from "@/lib/services/roadmaps.service";
import { RM } from "./roadmapTokens";

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
    <Box
      sx={{
        border: RM.border,
        borderRadius: 3,
        bgcolor: "#fff",
        boxShadow: RM.shadow(3),
        p: { xs: 2, md: 3 },
      }}
    >
      <Typography
        sx={{
          fontSize: 11.5,
          fontWeight: 800,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: "#7c3aed",
          mb: 2,
        }}
      >
        The hiring process
      </Typography>

      <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, position: "relative" }}>
        {stages.map((step, i) => {
          const format = formatFor(step.stage);
          const isLast = i === stages.length - 1;
          return (
            <Box
              component="li"
              key={`${step.stage}-${i}`}
              sx={{ display: "flex", gap: 2, position: "relative", pb: isLast ? 0 : 3 }}
            >
              {/* The rail is drawn per item and stops at the last one, so it never overshoots
                  past the final badge the way a single absolutely-positioned line does. */}
              {!isLast && (
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    left: 15,
                    top: 32,
                    bottom: 0,
                    width: 2,
                    bgcolor: "#e9d5ff",
                  }}
                />
              )}
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  bgcolor: "#7c3aed",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
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
                  <Typography sx={{ fontWeight: 700, fontSize: 15.5, color: RM.ink }}>
                    {step.stage}
                  </Typography>
                  {format?.type === "Elimination" && (
                    <Chip
                      label="Elimination"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: 10.5,
                        fontWeight: 700,
                        bgcolor: "#fef2f2",
                        color: "#b91c1c",
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
                        fontWeight: 700,
                        bgcolor: "#ecfdf5",
                        color: "#047857",
                      }}
                    />
                  )}
                </Stack>
                {step.detail && (
                  <Typography sx={{ mt: 0.4, fontSize: 13.5, color: "#475569", lineHeight: 1.55 }}>
                    {step.detail}
                  </Typography>
                )}
                {format?.info && (
                  <Typography sx={{ mt: 0.4, fontSize: 12.5, color: "#7c3aed", fontWeight: 600 }}>
                    {format.info}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
