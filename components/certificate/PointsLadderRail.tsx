"use client";

import { useMemo } from "react";
import { Box, ButtonBase, Stack, Typography, alpha, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { formatPoints } from "@/lib/certificates/format";
import type { LearnerTierStatus } from "@/lib/certificates/types";
import { ladderPosition } from "./useLearnerCertificates";

/**
 * The milestone track across the top of /certificates: every rung of the points
 * ladder on one line, with a marker showing exactly where the learner stands.
 *
 * The whole reason this is a TRACK and not a list of rows: the ladder's job is
 * to make the next rung feel close. A vertical list of seven thresholds reads as
 * a price sheet, where a track with a marker two-thirds of the way to the next
 * node reads as "nearly there". The marker sits at a real interpolated position
 * between the rung just cleared and the next one, not at a percentage of the
 * final rung - see ladderPosition() for why that distinction matters.
 */

export interface PointsLadderRailProps {
  tiers: LearnerTierStatus[];
  pointsTotal: number;
  /** Highlights one rung, e.g. the card the learner just opened. */
  activeSlug?: string | null;
  /** Nodes become buttons when this is passed; otherwise the rail is inert. */
  onSelectTier?: (tier: LearnerTierStatus) => void;
  numberLocale?: string;
}

/** Enough room for a two-word tier name under a 44px disc without wrapping to
 *  three lines. Below this the rail scrolls sideways rather than crushing. */
const NODE_MIN_WIDTH = 116;

export function PointsLadderRail({
  tiers,
  pointsTotal,
  activeSlug,
  onSelectTier,
  numberLocale = "en-US",
}: PointsLadderRailProps) {
  const theme = useTheme();
  const { t } = useTranslation("common");

  const ordered = useMemo(
    () => [...(tiers ?? [])].sort((a, b) => a.rank - b.rank),
    [tiers],
  );
  const position = useMemo(
    () => ladderPosition(ordered, pointsTotal),
    [ordered, pointsTotal],
  );

  const count = ordered.length;
  if (count === 0) return null;

  const reachedIndex = position.achievedCount - 1;
  const fraction = position.progressToNext / 100;
  /**
   * Node i sits at ((i + 0.5) / n) of the width, so the marker advances a whole
   * slot for each rung cleared and a fraction of a slot in between. Written this
   * way the marker lands exactly on a node's centre the moment that node is
   * achieved, which is what makes crossing a threshold feel like an arrival
   * rather than a jump to an arbitrary point.
   */
  const markerPercent = Math.max(
    0,
    Math.min(100, ((reachedIndex + 0.5 + fraction) / count) * 100),
  );

  const accent = theme.palette.warning.main;
  const accentDeep = theme.palette.warning.dark;
  const trackColor = alpha(theme.palette.text.primary, 0.1);

  const summary = position.next
    ? t(
        "certificatesUpload.ladderNext",
        "{{points}} points to {{tier}}",
        {
          points: formatPoints(position.pointsRemaining, numberLocale),
          tier: position.next.name,
        },
      )
    : t(
        "certificatesUpload.ladderComplete",
        "Every milestone on the ladder is yours",
      );

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 4,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
      }}
    >
      <Stack
        direction="row"
        alignItems="baseline"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
        sx={{ mb: 2.5 }}
      >
        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: "1.6rem",
              lineHeight: 1,
              letterSpacing: "-1px",
              color: theme.palette.text.primary,
            }}
          >
            {formatPoints(pointsTotal, numberLocale)}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: theme.palette.text.secondary,
              // Arabic joins cursively: tracking breaks the joins.
              '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
            }}
          >
            {t("certificatesUpload.ladderPoints", "points earned")}
          </Typography>
        </Stack>
        <Typography
          sx={{ fontSize: "0.8rem", fontWeight: 700, color: theme.palette.text.secondary }}
        >
          {summary}
        </Typography>
      </Stack>

      <Box sx={{ overflowX: "auto", overflowY: "hidden", pb: 0.5, mx: -0.5, px: 0.5 }}>
        <Box
          sx={{
            position: "relative",
            display: "flex",
            width: "100%",
            minWidth: count * NODE_MIN_WIDTH,
          }}
        >
          {/* The rail itself, behind the nodes. Top offset is half the 44px disc. */}
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: 21,
              left: `${50 / count}%`,
              right: `${50 / count}%`,
              height: 3,
              borderRadius: 999,
              bgcolor: trackColor,
            }}
          />
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: 21,
              left: `${50 / count}%`,
              // The fill runs from the first node's centre to the marker, so it
              // is clamped at the left edge for a learner who has cleared
              // nothing yet.
              width: `${Math.max(0, markerPercent - 50 / count)}%`,
              height: 3,
              borderRadius: 999,
              backgroundImage: `linear-gradient(90deg, ${accent}, ${accentDeep})`,
              transition: "width .5s cubic-bezier(.4,0,.2,1)",
            }}
          />

          {ordered.map((tier) => {
            const isActive = activeSlug != null && tier.slug === activeSlug;
            const isNext = position.next?.slug === tier.slug;
            const achieved = tier.achieved;

            const disc = (
              <>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    fontSize: "0.85rem",
                    letterSpacing: 0.5,
                    position: "relative",
                    zIndex: 1,
                    transition: "transform .15s, box-shadow .15s",
                    ...(achieved
                      ? {
                          color: theme.palette.warning.contrastText,
                          backgroundImage: `linear-gradient(135deg, ${accent}, ${accentDeep})`,
                          boxShadow: `0 6px 18px -6px ${alpha(accent, 0.8)}`,
                          border: `2px solid ${theme.palette.background.paper}`,
                        }
                      : {
                          color: isNext
                            ? theme.palette.text.primary
                            : theme.palette.text.disabled,
                          bgcolor: theme.palette.background.paper,
                          border: `2px ${isNext ? "solid" : "dashed"} ${
                            isNext ? accent : alpha(theme.palette.text.primary, 0.22)
                          }`,
                        }),
                    ...(isActive && {
                      boxShadow: `0 0 0 4px ${alpha(accent, 0.28)}`,
                    }),
                  }}
                >
                  {achieved ? (
                    <IconWrapper icon="mdi:check-bold" size={20} />
                  ) : (
                    tier.code || tier.rank
                  )}
                </Box>
                <Typography
                  sx={{
                    mt: 1,
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    lineHeight: 1.25,
                    textAlign: "center",
                    color: achieved
                      ? theme.palette.text.primary
                      : theme.palette.text.secondary,
                    px: 0.5,
                  }}
                >
                  {tier.short_name || tier.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.66rem",
                    fontWeight: 700,
                    color: theme.palette.text.disabled,
                    mt: 0.15,
                  }}
                >
                  {formatPoints(tier.points, numberLocale)}
                </Typography>
              </>
            );

            const nodeSx = {
              flex: `1 0 ${NODE_MIN_WIDTH}px`,
              display: "flex",
              flexDirection: "column" as const,
              alignItems: "center",
              minWidth: 0,
            };

            return onSelectTier ? (
              <ButtonBase
                key={tier.slug}
                onClick={() => onSelectTier(tier)}
                sx={{
                  ...nodeSx,
                  borderRadius: 3,
                  py: 0.5,
                  "&:hover .MuiBox-root:first-of-type": { transform: "translateY(-2px)" },
                  "&:focus-visible": {
                    outline: "none",
                    boxShadow: `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 4px ${accent}`,
                  },
                }}
              >
                {disc}
              </ButtonBase>
            ) : (
              <Box key={tier.slug} sx={{ ...nodeSx, py: 0.5 }}>
                {disc}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
