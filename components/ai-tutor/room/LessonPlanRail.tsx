"use client";

import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { LessonPlanSection } from "@/lib/services/ai-tutor.service";

/**
 * The agenda, with progress.
 *
 * This is generated before the session starts rather than improvised, which is why the
 * tutor can open by telling the learner what they are going to cover. It also gives the
 * room something concrete on first paint instead of an empty panel waiting for speech.
 */
export function LessonPlanRail({
  plan,
  currentIndex,
  conceptsCovered,
}: {
  plan: LessonPlanSection[];
  currentIndex: number;
  conceptsCovered: number;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography
        sx={{
          fontSize: "0.7rem",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--font-tertiary)",
          mb: 2,
        }}
      >
        Today&apos;s plan
      </Typography>

      {plan.length === 0 ? (
        <Typography sx={{ fontSize: "0.84rem", color: "var(--font-tertiary)" }}>
          Your tutor will build the plan as you talk.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
          {plan.map((section, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            return (
              <Box
                key={`${section.title}-${i}`}
                sx={{ display: "flex", gap: 1.25, alignItems: "flex-start", py: 0.85 }}
              >
                <Box sx={{ mt: "2px", flexShrink: 0 }}>
                  {done ? (
                    <Icon
                      icon="solar:check-circle-bold"
                      width={16}
                      height={16}
                      style={{ color: "var(--ai-violet)" }}
                    />
                  ) : active ? (
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        border: "2px solid var(--ai-violet)",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: "var(--ai-violet)",
                        }}
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        border: "1px solid var(--border-light)",
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: "0.86rem",
                      fontWeight: active ? 600 : 400,
                      color: done
                        ? "var(--font-tertiary)"
                        : active
                          ? "var(--font-primary)"
                          : "var(--font-secondary)",
                      lineHeight: 1.35,
                    }}
                  >
                    {section.title}
                  </Typography>
                  {active && section.detail ? (
                    <Typography
                      sx={{
                        fontSize: "0.76rem",
                        color: "var(--font-tertiary)",
                        mt: 0.25,
                        lineHeight: 1.4,
                      }}
                    >
                      {section.detail}
                    </Typography>
                  ) : null}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      <Box sx={{ flex: 1 }} />

      {conceptsCovered > 0 ? (
        <Box sx={{ pt: 2, borderTop: "1px solid var(--border-default)", mt: 2 }}>
          <Typography sx={{ fontSize: "0.76rem", color: "var(--font-tertiary)" }}>
            {conceptsCovered} {conceptsCovered === 1 ? "thing" : "things"} on the canvas
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}
