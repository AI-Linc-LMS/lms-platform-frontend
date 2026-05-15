"use client";

import { Box, Typography, LinearProgress } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { UserXP } from "@/lib/services/community.service";

const TIER_COLORS = {
  bronze:   "#cd7f32",
  silver:   "#94a3b8",
  gold:     "#fbbf24",
  platinum: "#a78bfa",
} as const;

const TIER_BG = {
  bronze:   "rgba(205,127,50,0.10)",
  silver:   "rgba(148,163,184,0.10)",
  gold:     "rgba(251,191,36,0.10)",
  platinum: "rgba(167,139,250,0.10)",
} as const;

const TIER_ICON = {
  bronze:   "mdi:shield-outline",
  silver:   "mdi:shield-half-full",
  gold:     "mdi:trophy",
  platinum: "mdi:crown",
} as const;

const TIER_ORDER = ["bronze", "silver", "gold", "platinum"] as const;
type Tier = keyof typeof TIER_COLORS;

interface MilestoneWidgetProps {
  xp: UserXP;
}

export function MilestoneWidget({ xp }: MilestoneWidgetProps) {
  const tier = (xp.tier as Tier) || "bronze";
  const color  = TIER_COLORS[tier];
  const bgTint = TIER_BG[tier];
  const icon   = TIER_ICON[tier];
  const tierIdx = TIER_ORDER.indexOf(tier);

  const pointsToNext  = xp.next_tier_threshold != null ? xp.next_tier_threshold - xp.balance : null;
  const nextTierLabel =
    tier === "bronze"   ? "Contributor (Silver)"
    : tier === "silver" ? "Mentor (Gold)"
    : tier === "gold"   ? "Expert (Platinum)"
    : null;

  const [tierName, tierRole] = xp.tier_display.includes("•")
    ? xp.tier_display.split(" • ")
    : [xp.tier_display, ""];

  return (
    <Box
      sx={{
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--border-default)",
        borderRadius: "16px",
        overflow: "hidden",
        width: "100%",
      }}
    >
      <Box sx={{ height: 3, background: `linear-gradient(90deg, ${color}, ${color}55)` }} />

      <Box sx={{ p: 2 }}>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.75 }}>
          <IconWrapper icon="mdi:chart-timeline-variant-shimmer" size={13} color={color} />
          <Typography
            sx={{
              fontSize: "0.63rem", fontWeight: 800,
              letterSpacing: "0.07em", textTransform: "uppercase",
              color: "var(--font-primary)",
            }}
          >
            Your Milestones
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex", alignItems: "center", gap: 1.5,
            p: 1.5, borderRadius: "12px",
            backgroundColor: bgTint,
            border: `1px solid ${color}30`,
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: 46, height: 46, flexShrink: 0,
              borderRadius: "11px",
              background: `linear-gradient(145deg, ${color}30, ${color}12)`,
              border: `1.5px solid ${color}45`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <IconWrapper icon={icon} size={25} color={color} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
              <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--font-primary)", lineHeight: 1.25 }}>
                {tierName}
              </Typography>
              {tierRole && (
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color, lineHeight: 1.25 }}>
                  • {tierRole}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.3, mt: 0.25 }}>
              <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color, lineHeight: 1 }}>
                {xp.balance.toLocaleString()}
              </Typography>
              <Typography sx={{ fontSize: "0.7rem", fontWeight: 500, color: "var(--font-secondary)" }}>
                IP
              </Typography>
            </Box>
          </Box>
        </Box>

        {nextTierLabel && (
          <Box sx={{ mb: 1.75 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.6 }}>
              <Typography sx={{ fontSize: "0.68rem", color: "var(--font-secondary)" }}>
                Next: <span style={{ fontWeight: 600 }}>{nextTierLabel}</span>
              </Typography>
              <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color }}>
                {xp.progress_pct}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={xp.progress_pct}
              sx={{
                height: 7, borderRadius: 4,
                backgroundColor: `${color}18`,
                "& .MuiLinearProgress-bar": {
                  background: `linear-gradient(90deg, ${color}bb, ${color})`,
                  borderRadius: 4,
                },
              }}
            />
            {pointsToNext != null && (
              <Typography sx={{ fontSize: "0.67rem", color: "var(--font-tertiary)", mt: 0.6 }}>
                {pointsToNext.toLocaleString()} points to go
              </Typography>
            )}
          </Box>
        )}

        {tier === "platinum" && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1.75 }}>
            <IconWrapper icon="mdi:crown" size={13} color={color} />
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color }}>
              Maximum tier reached!
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            pt: 1.5,
            borderTop: "1px solid var(--border-default)",
            display: "flex",
            alignItems: "flex-start",
            position: "relative",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: "calc(1.5rem + 5px)",
              left: "calc(12.5%)",
              right: "calc(12.5%)",
              height: 2,
              backgroundColor: "var(--border-default)",
              zIndex: 0,
            }}
          />
          {tierIdx > 0 && (
            <Box
              sx={{
                position: "absolute",
                top: "calc(1.5rem + 5px)",
                left: "calc(12.5%)",
                width: `calc(${(tierIdx / 3) * 75}%)`,
                height: 2,
                background: `linear-gradient(90deg, ${TIER_COLORS.bronze}, ${color})`,
                zIndex: 0,
              }}
            />
          )}
          {TIER_ORDER.map((t, i) => {
            const tColor  = TIER_COLORS[t as Tier];
            const isReached  = i <= tierIdx;
            const isCurrent  = i === tierIdx;
            return (
              <Box
                key={t}
                sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, zIndex: 1 }}
              >
                <Box
                  sx={{
                    width: 11, height: 11, borderRadius: "50%",
                    backgroundColor: isReached ? tColor : "var(--border-default)",
                    border: isCurrent ? `2.5px solid ${tColor}` : `1.5px solid ${isReached ? tColor : "var(--border-default)"}`,
                    outline: isCurrent ? `3px solid ${tColor}28` : "none",
                    outlineOffset: 1,
                    transition: "all 0.2s",
                  }}
                />
                <Typography
                  sx={{
                    fontSize: "0.58rem",
                    fontWeight: isCurrent ? 700 : 400,
                    color: isReached ? tColor : "var(--font-tertiary)",
                    lineHeight: 1,
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Typography>
              </Box>
            );
          })}
        </Box>

      </Box>
    </Box>
  );
}
