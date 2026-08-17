"use client";

import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { TutorTintSurface } from "../shared/surfaces";
import type { TutorQuota } from "@/lib/services/ai-tutor.service";

/**
 * The learner's allowance, as the first thing in the right rail.
 *
 * This used to be a pill in the header, which was enough to state the number and not enough
 * to make it mean anything. A monthly minute budget is the one hard constraint on the feature,
 * so it gets a ring: "18 of 30" is arithmetic, a ring three-fifths full is a decision about
 * whether to start a long session now.
 *
 * The ring is an SVG rather than a component from the charting library, because it is one
 * circle and pulling in a chart bundle for the top of the rail would delay first paint on the
 * page whose whole point is to feel instant.
 */

const RING = 92;
const STROKE = 9;
const RADIUS = (RING - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function MinutesPanel({ quota }: { quota?: TutorQuota }) {
  /**
   * Nothing to report yet.
   *
   * Without this the panel defaulted every figure to zero and stated "0 of 0 minutes left" for
   * the whole first paint, which is not a slow number arriving late: it is a confident claim that
   * the learner has no allowance. Some of them would have closed the tab.
   */
  if (!quota) {
    return (
      <TutorTintSurface tint="deep">
        <Typography
          sx={{
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.6)",
            mb: 2,
            '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
          }}
        >
          This month
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2.25 }}>
          <Box
            sx={{
              width: RING,
              height: RING,
              borderRadius: 9999,
              flexShrink: 0,
              border: `${STROKE}px solid rgba(255,255,255,0.14)`,
            }}
          />
          <Box sx={{ flex: 1, display: "grid", gap: 1 }}>
            <Box sx={{ height: 13, width: "78%", borderRadius: 9999, bgcolor: "rgba(255,255,255,0.14)" }} />
            <Box sx={{ height: 11, width: "56%", borderRadius: 9999, bgcolor: "rgba(255,255,255,0.1)" }} />
          </Box>
        </Box>
      </TutorTintSurface>
    );
  }

  // Staff bypass the reservation, so their number never moves. Rendering "30 of 30 left" is
  // indistinguishable from a broken meter, which is exactly how it was first reported.
  if (quota.unmetered) {
    return (
      <TutorTintSurface tint="deep">
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: "12px",
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(255,255,255,0.12)",
              flexShrink: 0,
            }}
          >
            <Icon icon="solar:infinity-bold-duotone" width={24} style={{ color: "#fff" }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: "1.05rem", fontWeight: 600, lineHeight: 1.2 }}>
              Unlimited minutes
            </Typography>
            <Typography sx={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.66)" }}>
              Staff account, not metered
            </Typography>
          </Box>
        </Box>
      </TutorTintSurface>
    );
  }

  const limit = quota.minutes_limit ?? 0;
  const used = quota.minutes_used ?? 0;
  const remaining = quota.minutes_remaining ?? 0;
  const fraction = limit > 0 ? Math.min(1, Math.max(0, remaining / limit)) : 0;
  const low = limit > 0 && remaining <= 5;
  const out = limit > 0 && remaining < 2;

  return (
    <TutorTintSurface tint="deep">
      <Typography
        sx={{
          fontSize: "0.7rem",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.6)",
          mb: 2,
          '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
        }}
      >
        This month
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2.25 }}>
        <Box sx={{ position: "relative", width: RING, height: RING, flexShrink: 0 }}>
          <Box
            component="svg"
            viewBox={`0 0 ${RING} ${RING}`}
            sx={{ width: RING, height: RING, transform: "rotate(-90deg)" }}
          >
            <circle
              cx={RING / 2}
              cy={RING / 2}
              r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.14)"
              strokeWidth={STROKE}
            />
            <circle
              cx={RING / 2}
              cy={RING / 2}
              r={RADIUS}
              fill="none"
              stroke={low ? "#f472b6" : "#c4b5fd"}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
              style={{ transition: "stroke-dashoffset 420ms cubic-bezier(.175,.885,.32,1.1)" }}
            />
          </Box>
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
            }}
          >
            <Box>
              <Typography sx={{ fontSize: "1.4rem", fontWeight: 600, lineHeight: 1 }}>
                {remaining}
              </Typography>
              <Typography
                sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.6)", mt: 0.25 }}
              >
                left
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: "0.95rem", fontWeight: 500, lineHeight: 1.35 }}>
            {out
              ? "You are out of minutes"
              : low
                ? "Nearly out of minutes"
                : `${remaining} of ${limit} minutes left`}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.82rem",
              color: "rgba(255,255,255,0.66)",
              lineHeight: 1.5,
              mt: 0.5,
            }}
          >
            {used} used so far. Resets at the start of next month.
          </Typography>
          {quota.max_session_minutes ? (
            <Typography
              sx={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.52)", mt: 0.75 }}
            >
              Up to {quota.max_session_minutes} min per session
            </Typography>
          ) : null}
        </Box>
      </Box>
    </TutorTintSurface>
  );
}
