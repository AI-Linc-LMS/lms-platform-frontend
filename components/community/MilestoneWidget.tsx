"use client";

import { Box, Typography, LinearProgress, Tooltip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { UserXP } from "@/lib/services/community.service";

const TIER_COLORS = {
  bronze:   "#cd7f32",
  silver:   "#94a3b8",
  gold:     "#fbbf24",
  platinum: "#a78bfa",
} as const;

const TIER_ICON = {
  bronze:   "mdi:shield-outline",
  silver:   "mdi:shield-half-full",
  gold:     "mdi:trophy",
  platinum: "mdi:crown",
} as const;

const TIER_LABEL = {
  bronze:   "Bronze",
  silver:   "Silver",
  gold:     "Gold",
  platinum: "Platinum",
} as const;

const TIER_ORDER = ["bronze", "silver", "gold", "platinum"] as const;
type Tier = keyof typeof TIER_COLORS;

interface MilestoneWidgetProps {
  xp: UserXP;
}

/**
 * Clean MUI-only milestone card. Stack:
 *   1. Header label
 *   2. Current-tier hero row: icon tile + tier name + IP balance
 *   3. Linear progress bar to next tier
 *   4. Compact "X IP to <Tier>" caption
 *   5. Tier badge row (visited tiers filled, others muted)
 */
export function MilestoneWidget({ xp }: MilestoneWidgetProps) {
  const tier = (xp.tier as Tier) || "bronze";
  const color = TIER_COLORS[tier];
  const icon = TIER_ICON[tier];
  const tierIdx = TIER_ORDER.indexOf(tier);
  const nextTier = tierIdx < TIER_ORDER.length - 1 ? TIER_ORDER[tierIdx + 1] : null;
  const pointsToNext = xp.next_tier_threshold != null
    ? Math.max(0, xp.next_tier_threshold - xp.balance)
    : null;
  const pct = nextTier ? Math.min(100, Math.max(0, xp.progress_pct)) : 100;

  const [tierName, tierRole] = xp.tier_display.includes("•")
    ? xp.tier_display.split(" • ")
    : [xp.tier_display, ""];

  return (
    <Box
      sx={{
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--border-default)",
        borderRadius: "14px",
        overflow: "hidden",
        width: "100%",
      }}
    >
      {/* Tier-tinted top strip */}
      <Box sx={{ height: 3, backgroundColor: color }} />

      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Typography
          sx={{
            fontSize: "0.62rem",
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--font-secondary)",
            mb: 1.75,
          }}
        >
          Your Progress
        </Typography>

        {/* Hero row: icon tile + tier name + balance */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              flexShrink: 0,
              borderRadius: "12px",
              backgroundColor: `${color}1a`,
              border: `1.5px solid ${color}55`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon={icon} size={26} color={color} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "var(--font-primary)",
                lineHeight: 1.2,
              }}
            >
              {tierName}
            </Typography>
            {tierRole && (
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: "var(--font-secondary)",
                  mt: 0.1,
                }}
              >
                {tierRole}
              </Typography>
            )}
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.4, mt: 0.4 }}>
              <Typography
                sx={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color,
                  lineHeight: 1,
                  letterSpacing: "-0.01em",
                }}
              >
                {xp.balance.toLocaleString()}
              </Typography>
              <Typography
                sx={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--font-secondary)" }}
              >
                IP
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Progress to next tier */}
        {nextTier ? (
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.6,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconWrapper icon={TIER_ICON[nextTier]} size={12} color={TIER_COLORS[nextTier]} />
                <Typography
                  sx={{ fontSize: "0.72rem", fontWeight: 700, color: TIER_COLORS[nextTier] }}
                >
                  Next: {TIER_LABEL[nextTier]}
                </Typography>
              </Box>
              <Typography
                sx={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--font-secondary)" }}
              >
                {pct}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: "var(--surface)",
                "& .MuiLinearProgress-bar": {
                  backgroundColor: TIER_COLORS[nextTier],
                  borderRadius: 4,
                },
              }}
            />
            {pointsToNext != null && pointsToNext > 0 && (
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  color: "var(--font-tertiary)",
                  mt: 0.7,
                }}
              >
                <Box component="span" sx={{ fontWeight: 700, color: "var(--font-secondary)" }}>
                  {pointsToNext.toLocaleString()}
                </Box>{" "}
                IP to go
              </Typography>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.6,
              p: 1.25,
              borderRadius: "8px",
              backgroundColor: `${color}12`,
              border: `1px solid ${color}40`,
              mb: 2,
            }}
          >
            <IconWrapper icon="mdi:crown" size={15} color={color} />
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color }}>
              Maximum tier reached
            </Typography>
          </Box>
        )}

        {/* Tier journey row — simple linear stack, no SVG, no overlap */}
        <Box
          sx={{
            pt: 1.5,
            borderTop: "1px solid var(--border-default)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "stretch",
            gap: 0.75,
          }}
        >
          {TIER_ORDER.map((t, i) => {
            const tColor = TIER_COLORS[t];
            const reached = i <= tierIdx;
            const isCurrent = i === tierIdx;
            return (
              <Tooltip key={t} title={TIER_LABEL[t]} arrow>
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.5,
                    py: 0.5,
                    borderRadius: "8px",
                    border: isCurrent ? `1.5px solid ${tColor}` : "1.5px solid transparent",
                    backgroundColor: isCurrent ? `${tColor}10` : "transparent",
                    transition: "all 0.18s",
                  }}
                >
                  <IconWrapper
                    icon={TIER_ICON[t]}
                    size={18}
                    color={reached ? tColor : "var(--font-tertiary)"}
                  />
                  <Typography
                    sx={{
                      fontSize: "0.62rem",
                      fontWeight: isCurrent ? 800 : 600,
                      color: reached ? tColor : "var(--font-tertiary)",
                      letterSpacing: "0.02em",
                      lineHeight: 1,
                    }}
                  >
                    {TIER_LABEL[t]}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
