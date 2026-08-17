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
          fontSize: "0.76rem",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.62)",
          mb: 2,
        }}
      >
        Today&apos;s plan
      </Typography>

      {plan.length === 0 ? (
        <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.62)", lineHeight: 1.55 }}>
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
                      style={{ color: "#a855f7" }}
                    />
                  ) : active ? (
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        border: "2px solid #a855f7",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: "#a855f7",
                        }}
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.3)",
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
                        ? "rgba(255,255,255,0.5)"
                        : active
                          ? "#ffffff"
                          : "rgba(255,255,255,0.78)",
                      lineHeight: 1.35,
                    }}
                  >
                    {section.title}
                  </Typography>
                  {active && section.detail ? (
                    <Typography
                      sx={{
                        fontSize: "0.87rem",
                        color: "rgba(255,255,255,0.6)",
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
        <Box sx={{ pt: 2, borderTop: "1px solid rgba(255,255,255,0.12)", mt: 2 }}>
          <Typography sx={{ fontSize: "0.87rem", color: "rgba(255,255,255,0.6)" }}>
            {conceptsCovered} {conceptsCovered === 1 ? "thing" : "things"} on the canvas
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}
