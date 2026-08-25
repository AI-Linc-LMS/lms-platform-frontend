"use client";

import { useMemo } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { PanelCard, SectionHeader } from "@/components/dashboard/v2/parts";
import { formatPoints } from "@/lib/certificates/format";
import {
  CERT_BADGE_GRADIENT,
  CERT_BAR_GRADIENT,
  CERT_FOCUS_RING,
} from "@/lib/certificates/ui-tokens";
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
 *
 * It is a PanelCard with a SectionHeader so it has the same anatomy as every
 * other panel a student sees, and it wears the violet certificate identity from
 * components/dashboard/v2/CertificatePanel rather than an accent of its own.
 *
 * The points TOTAL is deliberately not repeated here. It sits in the StatBox row
 * directly above this card on /certificates, and printing the same number twice
 * within one screen height reads as a layout that was assembled rather than
 * designed. What this card owns is the position: the header carries "N points to
 * <tier>" and the track shows where that lands.
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
    <PanelCard sx={{ p: { xs: 2, sm: 2.5 }, mb: 0 }}>
      <SectionHeader
        icon="mdi:stairs-up"
        title={t("certificatesUpload.railTitle", "Where you stand")}
        subtitle={summary}
        gradient={CERT_BADGE_GRADIENT}
      />

      <Box sx={{ mt: 2.5, overflowX: "auto", overflowY: "hidden", pb: 0.5, mx: -0.5, px: 0.5 }}>
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
              bgcolor: "#eef2f7",
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
              backgroundImage: CERT_BAR_GRADIENT,
              transition: "width .5s cubic-bezier(.4,0,.2,1)",
            }}
          />

          {ordered.map((tier) => {
            const isActive = activeSlug != null && tier.slug === activeSlug;
            const isNext = position.next?.slug === tier.slug;
            // `unlocked` (crossed the threshold), which is the state the rail
            // is drawing. `issued` - holding the document - is a different
            // thing, and the two were collapsed into one non-existent key.
            const achieved = tier.unlocked;

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
                          color: "#fff",
                          backgroundImage: CERT_BADGE_GRADIENT,
                          boxShadow: "0 6px 18px -6px rgba(124,58,237,0.8)",
                          border: "2px solid #fff",
                        }
                      : {
                          color: isNext ? "#0f172a" : "#94a3b8",
                          bgcolor: "#fff",
                          border: isNext
                            ? "2px solid #7c3aed"
                            : "2px dashed #cbd5e1",
                        }),
                    ...(isActive && {
                      boxShadow: "0 0 0 4px rgba(124,58,237,0.28)",
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
                    color: achieved ? "#0f172a" : "#64748b",
                    px: 0.5,
                  }}
                >
                  {tier.short_name || tier.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.66rem",
                    fontWeight: 700,
                    color: "#94a3b8",
                    mt: 0.15,
                  }}
                >
                  {formatPoints(tier.points_threshold, numberLocale)}
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
                  borderRadius: 2.5,
                  py: 0.5,
                  "&:hover .MuiBox-root:first-of-type": { transform: "translateY(-2px)" },
                  "&:focus-visible": {
                    outline: "none",
                    boxShadow: CERT_FOCUS_RING,
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
    </PanelCard>
  );
}
