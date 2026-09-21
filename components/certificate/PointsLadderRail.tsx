"use client";

import { useMemo } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ScrollRow } from "@/components/common/mobile/ScrollRow";
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

/**
 * Where the learner sits on the track, as a percentage of its width.
 *
 * Node i is centred at ((i + 0.5) / n), so the marker advances a whole slot per rung cleared
 * and part of one in between, landing exactly on a node's centre the moment it is achieved.
 * Before the FIRST rung the track runs from the left edge (0 points) to that node's centre.
 */
export function railMarkerPercent(achievedCount: number, fraction: number, count: number): number {
  if (count <= 0) return 0;
  const f = Math.min(1, Math.max(0, fraction));
  const slot = achievedCount <= 0 ? 0.5 * f : achievedCount - 0.5 + f;
  return Math.max(0, Math.min(100, (slot / count) * 100));
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

  const fraction = position.progressToNext / 100;
  /**
   * Node i sits at ((i + 0.5) / n) of the width, so the marker advances a whole
   * slot for each rung cleared and a fraction of a slot in between. Written this
   * way the marker lands exactly on a node's centre the moment that node is
   * achieved, which is what makes crossing a threshold feel like an arrival
   * rather than a jump to an arbitrary point.
   */
  const markerPercent = railMarkerPercent(position.achievedCount, fraction, count);

  const summary = position.next
    ? t(
        "certificatesUpload.ladderNext",
        "You have {{total}} points - {{points}} more to {{tier}}",
        {
          total: formatPoints(pointsTotal, numberLocale),
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

      {/* Seven rungs need 812px and a phone has 358: the track always scrolled, it
          just ended at the screen edge with nothing to say so. ScrollRow adds the
          two things that make that readable - snap with momentum, and a fade at
          whichever edge still has track - and bleeds to the card edge on a phone so
          a thumb can see there is more. Above `sm` the gutters are the ones it had. */}
      <ScrollRow
        gap={0}
        ariaLabel={t("certificatesUpload.railAria", "Points milestones") as string}
        sx={{
          mt: 2.5,
          mx: { xs: -2, sm: -0.5 },
          px: { xs: 2, sm: 0.5 },
          // ScrollRow hides the scrollbar and snaps everywhere. A mouse needs the
          // scrollbar this rail always had, so both are phone-only here.
          scrollSnapType: { xs: "x proximity", sm: "none" },
          scrollbarWidth: { xs: "none", sm: "auto" },
          "&::-webkit-scrollbar": { display: { xs: "none", sm: "initial" } },
        }}
      >
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
              // From the left edge, which is 0 points, so the stretch before the first rung
              // is part of the track too.
              left: 0,
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
              // From 0 points to the marker. It used to start at the first rung, which
              // left a learner who had not reached it yet - most learners - with an empty
              // track and nothing showing where they stood.
              left: 0,
              width: `${markerPercent}%`,
              height: 3,
              borderRadius: 999,
              backgroundImage: CERT_BAR_GRADIENT,
              transition: "width .5s cubic-bezier(.4,0,.2,1)",
            }}
          />
          {position.next && (
            <Box
              data-testid="ladder-you"
              role="img"
              aria-label={t("certificatesUpload.railYou", "You: {{points}} points", {
                points: formatPoints(pointsTotal, numberLocale),
              }) as string}
              title={t("certificatesUpload.railYou", "You: {{points}} points", {
                points: formatPoints(pointsTotal, numberLocale),
              }) as string}
              sx={{
                position: "absolute",
                top: 22.5,
                left: `${markerPercent}%`,
                transform: "translate(-50%, -50%)",
                width: 13,
                height: 13,
                borderRadius: "50%",
                bgcolor: "#fff",
                border: "3px solid #7c3aed",
                boxShadow: "0 0 0 4px rgba(124,58,237,0.18)",
                zIndex: 2,
                transition: "left .5s cubic-bezier(.4,0,.2,1)",
              }}
            />
          )}

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
                    // 11.2px and 10.6px. The rail scrolls, so a phone can afford the
                    // extra width these need; it cannot afford unreadable rung names.
                    fontSize: { xs: "0.78rem", sm: "0.7rem" },
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
                    fontSize: { xs: "0.75rem", sm: "0.66rem" },
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
              // The snap points are the rungs, not the track that holds them: a
              // flick on a phone settles with a milestone under the thumb.
              scrollSnapAlign: { xs: "start", sm: "none" },
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
      </ScrollRow>
    </PanelCard>
  );
}
