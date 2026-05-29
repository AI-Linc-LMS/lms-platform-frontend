"use client";

import { useMemo } from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  AnimatedRing,
  CountUp,
  Reveal,
  SectionHero,
  SectionShell,
  fadeRise,
  gridStagger,
  useStaticRender,
  useViewportEntrance,
} from "@/components/scorecard/shared";
import type {
  Achievements,
  BadgeEarned,
  BadgeMilestone,
} from "@/lib/types/scorecard.types";

interface AchievementsSectionProps {
  data: Achievements;
}

const GOLD = "#fbbf24";
const GOLD_DEEP = "#d97706";
const AMBER = "#f59e0b";
const SILVER = "#cbd5e1";
const BRONZE = "#b45309";
const STREAK = "#ef4444";
const ACCENT = "var(--accent-indigo)";
const ACCENT_DARK = "var(--accent-indigo-dark)";
const EMERALD = "#10b981";

function formatEarnedDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const ms = Date.now() - d.getTime();
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  } catch {
    return "—";
  }
}

function podiumStyleFor(rank: 1 | 2 | 3) {
  switch (rank) {
    case 1:
      return {
        ringSize: 130,
        ringStroke: 11,
        iconSize: 36,
        ringColor: GOLD,
        gradient: `linear-gradient(160deg, color-mix(in srgb, ${GOLD} 22%, transparent) 0%, color-mix(in srgb, ${GOLD_DEEP} 6%, transparent) 100%)`,
        border: `1px solid color-mix(in srgb, ${GOLD} 36%, transparent)`,
        label: "Showcase",
        labelColor: GOLD_DEEP,
        crown: "mdi:crown",
        order: { xs: 1, md: 2 },
      };
    case 2:
      return {
        ringSize: 110,
        ringStroke: 9,
        iconSize: 28,
        ringColor: SILVER,
        gradient: `linear-gradient(160deg, color-mix(in srgb, ${SILVER} 22%, transparent) 0%, color-mix(in srgb, ${SILVER} 5%, transparent) 100%)`,
        border: `1px solid color-mix(in srgb, ${SILVER} 36%, transparent)`,
        label: "Featured",
        labelColor: "#64748b",
        crown: "mdi:medal",
        order: { xs: 2, md: 1 },
      };
    case 3:
      return {
        ringSize: 110,
        ringStroke: 9,
        iconSize: 28,
        ringColor: BRONZE,
        gradient: `linear-gradient(160deg, color-mix(in srgb, ${BRONZE} 22%, transparent) 0%, color-mix(in srgb, ${BRONZE} 5%, transparent) 100%)`,
        border: `1px solid color-mix(in srgb, ${BRONZE} 36%, transparent)`,
        label: "Featured",
        labelColor: BRONZE,
        crown: "mdi:medal-outline",
        order: { xs: 3, md: 3 },
      };
  }
}

function PodiumCard({ badge, rank }: { badge: BadgeEarned; rank: 1 | 2 | 3 }) {
  const style = podiumStyleFor(rank);

  return (
    <Box
      component={motion.div}
      variants={{
        hidden: { opacity: 0, y: 16, scale: 0.96 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const, delay: rank * 0.05 },
        },
      }}
      sx={{
        position: "relative",
        order: style.order,
        p: { xs: 2.25, md: 2.75 },
        borderRadius: 3.5,
        background: style.gradient,
        border: style.border,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 1.5,
        overflow: "hidden",
        boxShadow:
          rank === 1
            ? `0 28px 60px -28px color-mix(in srgb, ${GOLD} 55%, transparent)`
            : "none",
        transition: "transform 0.25s ease",
        "&:hover": { transform: "translateY(-3px)" },
      }}
    >
      {/* Rank ribbon */}
      <Box
        sx={{
          position: "absolute",
          top: 12,
          left: 12,
          display: "inline-flex",
          alignItems: "center",
          gap: 0.4,
          px: 1,
          py: 0.4,
          borderRadius: 999,
          bgcolor: `color-mix(in srgb, ${style.ringColor} 90%, transparent)`,
          color: "#fff",
          boxShadow: `0 6px 14px -8px color-mix(in srgb, ${style.ringColor} 80%, transparent)`,
        }}
      >
        <IconWrapper icon={style.crown} size={12} color="#fff" />
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: "0.65rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#fff",
          }}
        >
          {style.label}
        </Typography>
      </Box>

      {/* Points pill, top-right */}
      <Box
        sx={{
          position: "absolute",
          top: 12,
          right: 12,
          display: "inline-flex",
          alignItems: "center",
          gap: 0.35,
          px: 0.85,
          py: 0.35,
          borderRadius: 999,
          bgcolor: "color-mix(in srgb, var(--card-bg) 80%, transparent)",
          border: `1px solid color-mix(in srgb, ${style.ringColor} 28%, transparent)`,
        }}
      >
        <IconWrapper icon="mdi:star-four-points" size={11} color={style.ringColor} />
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: "0.66rem",
            color: style.ringColor,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.04em",
          }}
        >
          {badge.points}
        </Typography>
      </Box>

      {/* Decorative star burst */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(circle at 50% 38%, color-mix(in srgb, ${style.ringColor} 18%, transparent) 0%, transparent 55%)`,
          pointerEvents: "none",
        }}
      />

      {/* Trophy/icon medallion */}
      <Box sx={{ position: "relative", mt: { xs: 2.5, md: 3 } }}>
        <Box
          sx={{
            width: style.ringSize,
            height: style.ringSize,
            borderRadius: "50%",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `radial-gradient(circle at 50% 30%, color-mix(in srgb, ${style.ringColor} 35%, transparent) 0%, color-mix(in srgb, ${style.ringColor} 5%, transparent) 80%)`,
            "&::before": {
              content: '""',
              position: "absolute",
              inset: -4,
              borderRadius: "50%",
              border: `2px dashed color-mix(in srgb, ${style.ringColor} 40%, transparent)`,
            },
          }}
        >
          <Box
            sx={{
              width: style.ringSize - 36,
              height: style.ringSize - 36,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${style.ringColor} 0%, color-mix(in srgb, ${style.ringColor} 60%, #fff) 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 14px 30px -12px color-mix(in srgb, ${style.ringColor} 75%, transparent), inset 0 -4px 12px color-mix(in srgb, ${style.ringColor} 40%, transparent)`,
              color: "#fff",
            }}
          >
            <IconWrapper
              icon={badge.iconSlug || "mdi:trophy"}
              size={style.iconSize}
              color="#fff"
            />
          </Box>
        </Box>
      </Box>

      <Typography
        sx={{
          fontWeight: 900,
          color: "var(--font-primary)",
          fontSize: { xs: "1.05rem", md: rank === 1 ? "1.2rem" : "1.05rem" },
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
          mt: 0.5,
        }}
      >
        {badge.name}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: "var(--font-secondary)",
          fontSize: "0.78rem",
          lineHeight: 1.45,
          maxWidth: 220,
        }}
      >
        {badge.description}
      </Typography>

      <Box
        sx={{
          mt: 0.5,
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          px: 1,
          py: 0.4,
          borderRadius: 999,
          bgcolor: "color-mix(in srgb, var(--card-bg) 80%, transparent)",
          border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
        }}
      >
        <IconWrapper icon="mdi:calendar-check" size={12} color="var(--font-secondary)" />
        <Typography
          variant="caption"
          sx={{
            color: "var(--font-secondary)",
            fontWeight: 700,
            fontSize: "0.66rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {timeAgo(badge.earnedDate)}
        </Typography>
      </Box>

      {badge.snapshotValue && (
        <Typography
          variant="caption"
          sx={{
            color: style.labelColor,
            fontWeight: 800,
            fontSize: "0.7rem",
            letterSpacing: "0.04em",
            mt: 0.25,
          }}
        >
          {badge.snapshotValue}
        </Typography>
      )}
    </Box>
  );
}

function EarnedBadgeChip({ badge, index }: { badge: BadgeEarned; index: number }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10, scale: 0.96 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const, delay: index * 0.03 },
        },
      }}
    >
      <Tooltip
        title={`${badge.description || badge.name}${badge.snapshotValue ? ` · ${badge.snapshotValue}` : ""}${badge.earnedDate ? ` · ${formatEarnedDate(badge.earnedDate)}` : ""}`}
        arrow
        placement="top"
      >
        <Box
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.75,
            p: 1.5,
            borderRadius: 2.5,
            border: `1px solid color-mix(in srgb, ${GOLD} 28%, transparent)`,
            background: `linear-gradient(135deg, color-mix(in srgb, ${GOLD} 12%, transparent) 0%, color-mix(in srgb, ${ACCENT} 8%, transparent) 100%)`,
            transition: "all 0.2s ease",
            cursor: "default",
            "&:hover": {
              transform: "translateY(-3px)",
              borderColor: `color-mix(in srgb, ${GOLD} 50%, transparent)`,
              boxShadow: `0 18px 30px -18px color-mix(in srgb, ${GOLD} 55%, transparent)`,
            },
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DEEP} 100%)`,
              color: "#fff",
              boxShadow: `0 12px 24px -12px color-mix(in srgb, ${GOLD_DEEP} 65%, transparent), inset 0 -3px 8px color-mix(in srgb, ${GOLD_DEEP} 40%, transparent)`,
            }}
          >
            <IconWrapper icon={badge.iconSlug || "mdi:trophy-outline"} size={24} color="#fff" />
          </Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              color: "var(--font-primary)",
              fontSize: "0.74rem",
              textAlign: "center",
              lineHeight: 1.3,
              maxWidth: 130,
            }}
          >
            {badge.name}
          </Typography>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.3,
              px: 0.75,
              py: 0.2,
              borderRadius: 999,
              bgcolor: `color-mix(in srgb, ${GOLD} 18%, transparent)`,
            }}
          >
            <IconWrapper icon="mdi:star-four-points" size={10} color={GOLD_DEEP} />
            <Typography
              sx={{
                fontWeight: 900,
                color: GOLD_DEEP,
                fontSize: "0.65rem",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {badge.points}
            </Typography>
          </Box>
        </Box>
      </Tooltip>
    </motion.div>
  );
}

/**
 * Eight vibrant gradient palettes — each milestone gets a unique one chosen
 * deterministically from its id, so the section reads as a colorful row
 * rather than a monotone list.
 */
const MILESTONE_PALETTES: Array<{ key: string; primary: string; secondary: string }> = [
  { key: "indigo", primary: "#6366f1", secondary: "#8b5cf6" },
  { key: "rose", primary: "#f43f5e", secondary: "#ec4899" },
  { key: "emerald", primary: "#10b981", secondary: "#14b8a6" },
  { key: "amber", primary: "#f59e0b", secondary: "#ef4444" },
  { key: "cyan", primary: "#06b6d4", secondary: "#3b82f6" },
  { key: "fuchsia", primary: "#d946ef", secondary: "#a855f7" },
  { key: "lime", primary: "#65a30d", secondary: "#22c55e" },
  { key: "sky", primary: "#0ea5e9", secondary: "#6366f1" },
];

function paletteFor(id: string): { primary: string; secondary: string; key: string } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i);
  return MILESTONE_PALETTES[Math.abs(h) % MILESTONE_PALETTES.length];
}

/**
 * Solid gradient icon disc wrapped by a thin progress ring. Disc + ring are
 * concentric (icon inside disc, ring outside disc) — never sharing space.
 */
function ProgressMedallion({
  pct,
  size,
  stroke,
  icon,
  primary,
  secondary,
  gradientKey,
}: {
  pct: number;
  size: number;
  stroke: number;
  icon: string;
  primary: string;
  secondary: string;
  gradientKey: string;
}) {
  const staticRender = useStaticRender();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);
  const discSize = size - stroke * 2 - 10;
  const ringId = `mring-${gradientKey}`;

  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        component="svg"
        viewBox={`0 0 ${size} ${size}`}
        sx={{
          position: "absolute",
          inset: 0,
          transform: "rotate(-90deg)",
          filter: `drop-shadow(0 0 10px color-mix(in srgb, ${primary} 35%, transparent))`,
        }}
      >
        <defs>
          <linearGradient id={ringId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primary} />
            <stop offset="100%" stopColor={secondary} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="color-mix(in srgb, var(--border-default) 35%, transparent)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${ringId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: staticRender ? dashOffset : circumference }}
          {...(staticRender
            ? { animate: { strokeDashoffset: dashOffset } }
            : { whileInView: { strokeDashoffset: dashOffset }, viewport: { once: true, amount: 0.3 } })}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] as const, delay: 0.15 }}
        />
      </Box>
      <Box
        sx={{
          width: discSize,
          height: discSize,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
          color: "#fff",
          boxShadow: `0 12px 24px -12px color-mix(in srgb, ${primary} 70%, transparent), inset 0 -4px 10px color-mix(in srgb, ${primary} 40%, transparent), inset 0 2px 3px color-mix(in srgb, #fff 40%, transparent)`,
          border: `2px solid color-mix(in srgb, #fff 75%, ${primary})`,
        }}
      >
        <IconWrapper icon={icon} size={Math.round(discSize * 0.46)} color="#fff" />
      </Box>
    </Box>
  );
}

function MilestoneCard({ milestone, index }: { milestone: BadgeMilestone; index: number }) {
  const staticRender = useStaticRender();
  const pct = Math.max(0, Math.min(99, milestone.progress));
  const isAlmost = pct >= 75;
  const palette = paletteFor(milestone.id || milestone.name);
  const { primary, secondary, key: paletteKey } = palette;
  const gradient = `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;

  const statusLabel = isAlmost ? "Almost there" : "Keep going";
  const statusIcon = isAlmost ? "mdi:fire" : "mdi:rocket-launch-outline";
  const remaining = 100 - pct;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 14 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const, delay: index * 0.05 },
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          p: { xs: 2, sm: 2.5, md: 2.75 },
          borderRadius: 3.5,
          border: `1px solid color-mix(in srgb, ${primary} ${isAlmost ? "32%" : "22%"}, transparent)`,
          background: `linear-gradient(135deg, color-mix(in srgb, ${primary} ${isAlmost ? "12%" : "8%"}, transparent) 0%, color-mix(in srgb, ${secondary} ${isAlmost ? "6%" : "3%"}, transparent) 100%)`,
          overflow: "hidden",
          transition: "all 0.3s ease",
          "&:hover": {
            borderColor: `color-mix(in srgb, ${primary} 55%, transparent)`,
            transform: "translateY(-3px)",
            boxShadow: `0 28px 50px -28px color-mix(in srgb, ${primary} 60%, transparent)`,
          },
        }}
      >
        {/* Decorative blobs */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            top: -80,
            right: -60,
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: `radial-gradient(circle, color-mix(in srgb, ${secondary} 14%, transparent) 0%, transparent 65%)`,
            pointerEvents: "none",
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            bottom: -70,
            left: -40,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: `radial-gradient(circle, color-mix(in srgb, ${primary} 10%, transparent) 0%, transparent 60%)`,
            pointerEvents: "none",
          }}
        />

        {/* Side gradient rail */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: 5,
            background: gradient,
            boxShadow: `0 0 14px color-mix(in srgb, ${primary} 55%, transparent)`,
          }}
        />

        {/* Flex row: medallion | content | percentage */}
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: { xs: 2, sm: 2.5, md: 3 },
            pl: 0.5,
          }}
        >
          {/* Medallion */}
          <Box sx={{ flexShrink: 0 }}>
            <ProgressMedallion
              pct={pct}
              size={88}
              stroke={6}
              icon={milestone.iconSlug || "mdi:flag-outline"}
              primary={primary}
              secondary={secondary}
              gradientKey={`${paletteKey}-${milestone.id}`}
            />
          </Box>

          {/* Content column — flexes to fill */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Status pill */}
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                px: 1,
                py: 0.35,
                borderRadius: 999,
                background: `linear-gradient(135deg, color-mix(in srgb, ${primary} 18%, transparent) 0%, color-mix(in srgb, ${secondary} 12%, transparent) 100%)`,
                border: `1px solid color-mix(in srgb, ${primary} 32%, transparent)`,
                mb: 0.85,
              }}
            >
              <IconWrapper icon={statusIcon} size={11} color={primary} />
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: "0.62rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  background: gradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {statusLabel}
              </Typography>
            </Box>

            <Typography
              sx={{
                fontWeight: 800,
                color: "var(--font-primary)",
                fontSize: { xs: "1.05rem", sm: "1.18rem" },
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              {milestone.name}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontSize: "0.82rem",
                display: "block",
                mt: 0.5,
                lineHeight: 1.5,
                maxWidth: 460,
              }}
            >
              {milestone.description}
            </Typography>

            {/* Progress bar — full width, gradient fill */}
            <Box sx={{ mt: 1.5 }}>
              <Box
                sx={{
                  position: "relative",
                  height: 8,
                  borderRadius: 999,
                  bgcolor: "color-mix(in srgb, var(--border-default) 40%, transparent)",
                  overflow: "hidden",
                }}
              >
                {/* Tick markers at 25/50/75 */}
                {[25, 50, 75].map((tick) => (
                  <Box
                    key={tick}
                    aria-hidden
                    sx={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: `${tick}%`,
                      width: 1,
                      bgcolor: "color-mix(in srgb, var(--card-bg) 70%, transparent)",
                      zIndex: 1,
                    }}
                  />
                ))}
                <Box
                  component={motion.div}
                  initial={{ width: staticRender ? `${pct}%` : 0 }}
                  {...(staticRender
                    ? { animate: { width: `${pct}%` } }
                    : { whileInView: { width: `${pct}%` }, viewport: { once: true, amount: 0.3 } })}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] as const, delay: 0.15 }}
                  sx={{
                    position: "relative",
                    height: "100%",
                    borderRadius: 999,
                    background: gradient,
                    boxShadow: `0 0 12px color-mix(in srgb, ${primary} 55%, transparent)`,
                    zIndex: 2,
                  }}
                />
              </Box>

              {/* Caption row below the bar */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  mt: 0.75,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "var(--font-secondary)",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontSize: "0.62rem",
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      background: gradient,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      fontWeight: 900,
                    }}
                  >
                    {remaining}%
                  </Box>{" "}
                  to unlock
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "var(--font-secondary)",
                    fontWeight: 700,
                    fontSize: "0.62rem",
                    fontVariantNumeric: "tabular-nums",
                    opacity: 0.7,
                  }}
                >
                  {pct} / 100
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Right column: gradient percentage display + label, perfectly aligned */}
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              flexShrink: 0,
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: 0.4,
              minWidth: 96,
              pr: 0.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.3, lineHeight: 1 }}>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontVariantNumeric: "tabular-nums",
                  fontSize: { sm: "2.4rem", md: "2.8rem" },
                  letterSpacing: "-0.045em",
                  lineHeight: 1,
                  background: gradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: `drop-shadow(0 6px 16px color-mix(in srgb, ${primary} 38%, transparent))`,
                }}
              >
                {pct}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "1rem",
                  letterSpacing: "-0.02em",
                  background: gradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  opacity: 0.85,
                }}
              >
                %
              </Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{
                color: "var(--font-secondary)",
                fontSize: "0.6rem",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              progress
            </Typography>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}

export function AchievementsSection({ data }: AchievementsSectionProps) {
  const entrance = useViewportEntrance();

  /**
   * Client-side fallback: if any milestone reads 100% but the backend didn't
   * award a UserBadge for it, synthesize a BadgeEarned record so it shows up
   * in the podium / trophy case. The "real" fix would happen server-side, but
   * this keeps the UI consistent regardless of when the post_save evaluator
   * last ran. Already-earned badges (matching by id) take precedence.
   */
  const earnedById = useMemo(() => {
    const m = new Map<string, BadgeEarned>();
    for (const b of data.badges) m.set(b.id, b);
    return m;
  }, [data.badges]);

  const synthesizedEarned = useMemo<BadgeEarned[]>(() => {
    const out: BadgeEarned[] = [];
    for (const m of data.milestones) {
      if (m.progress >= 100 && !earnedById.has(m.id)) {
        out.push({
          id: m.id,
          name: m.name,
          description: m.description,
          iconSlug: m.iconSlug || "mdi:trophy",
          earnedDate: new Date().toISOString(),
          points: 0,
          snapshotValue: "Earned",
        });
      }
    }
    return out;
  }, [data.milestones, earnedById]);

  const effectiveBadges = useMemo<BadgeEarned[]>(
    () => [...data.badges, ...synthesizedEarned],
    [data.badges, synthesizedEarned],
  );

  const effectiveMilestones = useMemo<BadgeMilestone[]>(
    () => data.milestones.filter((m) => m.progress < 100),
    [data.milestones],
  );

  const effectiveEarnedCount = effectiveBadges.length;
  const isEmpty = effectiveBadges.length === 0 && effectiveMilestones.length === 0;

  // Choose top 3 podium badges: latest earned, weighted by points.
  const sortedBadges = useMemo(
    () =>
      [...effectiveBadges].sort((a, b) => {
        const aDate = a.earnedDate ? new Date(a.earnedDate).getTime() : 0;
        const bDate = b.earnedDate ? new Date(b.earnedDate).getTime() : 0;
        if (bDate !== aDate) return bDate - aDate;
        return b.points - a.points;
      }),
    [effectiveBadges],
  );

  const podium = sortedBadges.slice(0, 3);
  const restBadges = sortedBadges.slice(3);

  const availableCount = Math.max(data.badgesAvailableCount, effectiveEarnedCount);
  const collectionProgress = availableCount > 0
    ? Math.round((effectiveEarnedCount / availableCount) * 100)
    : 0;

  const certsPct =
    data.certificatesProgress.total > 0
      ? Math.round((data.certificatesProgress.completed / data.certificatesProgress.total) * 100)
      : 0;

  return (
    <Reveal as="section">
      <SectionShell
        radialMesh={[
          `radial-gradient(60% 75% at 0% 0%, color-mix(in srgb, ${GOLD} 16%, transparent), transparent 60%)`,
          `radial-gradient(55% 70% at 100% 100%, color-mix(in srgb, ${ACCENT} 12%, transparent), transparent 60%)`,
          `radial-gradient(40% 60% at 50% 50%, color-mix(in srgb, ${GOLD} 6%, transparent), transparent 70%)`,
        ]}
      >
        <SectionHero
          chapter="Chapter 10"
          title="Achievements & Trophies"
          subtitle="Badges, streaks, and milestones — the trophy case for your learning journey."
          iconBadge={{
            icon: "mdi:trophy-award",
            gradient: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DEEP} 100%)`,
          }}
          rightSlot={
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1,
                borderRadius: 999,
                bgcolor: `color-mix(in srgb, ${GOLD} 12%, transparent)`,
                border: `1px solid color-mix(in srgb, ${GOLD} 28%, transparent)`,
              }}
            >
              <IconWrapper icon="mdi:star-four-points" size={18} color={GOLD_DEEP} />
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: GOLD_DEEP,
                    fontWeight: 800,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontSize: "0.62rem",
                    display: "block",
                    lineHeight: 1,
                  }}
                >
                  Total points
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 900,
                    color: GOLD_DEEP,
                    fontSize: "1.25rem",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <CountUp value={data.totalPoints} duration={1.2} />
                </Typography>
              </Box>
            </Box>
          }
        />

        {isEmpty ? (
          <Box
            sx={{
              py: { xs: 6, sm: 8 },
              textAlign: "center",
              borderRadius: 3,
              border: "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
              color: "var(--font-secondary)",
            }}
          >
            <IconWrapper icon="mdi:trophy-outline" size={56} color="var(--font-secondary)" />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 2, maxWidth: 420, mx: "auto" }}
            >
              No badges unlocked yet. Earn badges by hitting streaks, completing assessments, and
              raising skill proficiency.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Hero: Podium top-3 + Streak + Collection ring */}
            <Box
              component={motion.div}
              variants={fadeRise}
              {...entrance}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 320px)" },
                gap: { xs: 2.5, md: 3 },
                alignItems: "stretch",
                mb: { xs: 3.5, md: 4.5 },
              }}
            >
              {/* Podium */}
              {podium.length > 0 ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: podium.length === 1 ? "1fr" : "repeat(2, 1fr)",
                      md: `repeat(${podium.length}, 1fr)`,
                    },
                    gap: 1.5,
                    alignItems: "stretch",
                  }}
                >
                  {podium.map((b, i) => (
                    <PodiumCard key={b.id} badge={b} rank={(i + 1) as 1 | 2 | 3} />
                  ))}
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--font-secondary)",
                  }}
                >
                  <Typography variant="body2">No earned badges yet.</Typography>
                </Box>
              )}

              {/* Streak + Collection card */}
              <Box
                sx={{
                  p: { xs: 2.25, md: 2.75 },
                  borderRadius: 3,
                  background: `linear-gradient(160deg, color-mix(in srgb, ${STREAK} 13%, transparent) 0%, color-mix(in srgb, ${ACCENT} 6%, transparent) 100%)`,
                  border: `1px solid color-mix(in srgb, ${STREAK} 22%, transparent)`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {/* Flame icon decoration */}
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    top: -20,
                    right: -20,
                    fontSize: 140,
                    opacity: 0.08,
                    color: STREAK,
                    pointerEvents: "none",
                  }}
                >
                  <IconWrapper icon="mdi:fire" size={160} color={STREAK} />
                </Box>

                {/* Streak */}
                <Box sx={{ position: "relative", display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${STREAK} 0%, #f97316 100%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 14px 30px -14px color-mix(in srgb, ${STREAK} 60%, transparent)`,
                      flexShrink: 0,
                    }}
                  >
                    <IconWrapper icon="mdi:fire" size={28} color="#fff" />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: STREAK,
                        fontWeight: 800,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        fontSize: "0.66rem",
                        display: "block",
                      }}
                    >
                      Current streak
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 900,
                        color: "var(--font-primary)",
                        fontSize: "2rem",
                        lineHeight: 1,
                        letterSpacing: "-0.04em",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      <CountUp value={data.streakRewards.currentStreak} duration={1.1} />
                      <Box
                        component="span"
                        sx={{
                          fontSize: "0.5em",
                          ml: 0.5,
                          color: "var(--font-secondary)",
                          fontWeight: 700,
                        }}
                      >
                        days
                      </Box>
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "var(--font-secondary)", fontSize: "0.72rem" }}
                    >
                      Longest: {data.streakRewards.longestStreak}d
                    </Typography>
                  </Box>
                </Box>

                {/* Divider */}
                <Box
                  sx={{
                    height: 1,
                    bgcolor: "color-mix(in srgb, var(--border-default) 60%, transparent)",
                  }}
                />

                {/* Collection ring */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
                  <Box sx={{ flexShrink: 0 }}>
                    <AnimatedRing
                      value={collectionProgress}
                      size={72}
                      strokeWidth={8}
                      color={GOLD}
                      colorEnd={ACCENT}
                      caption=""
                      valueFontSize={16}
                    />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: GOLD_DEEP,
                        fontWeight: 800,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        fontSize: "0.66rem",
                        display: "block",
                      }}
                    >
                      Collection
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        color: "var(--font-primary)",
                        fontSize: "1rem",
                        letterSpacing: "-0.01em",
                        lineHeight: 1.2,
                      }}
                    >
                      <Box component="span" sx={{ color: GOLD_DEEP, fontWeight: 900 }}>
                        {effectiveEarnedCount}
                      </Box>{" "}
                      of {availableCount} badges
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "var(--font-secondary)", fontSize: "0.72rem" }}
                    >
                      {Math.max(0, availableCount - effectiveEarnedCount)} left to unlock
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* KPI rail */}
            <Box
              component={motion.div}
              variants={gridStagger}
              {...entrance}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                borderTop: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                borderBottom:
                  "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                mb: { xs: 3.5, md: 4.5 },
              }}
            >
              {[
                { label: "Badges earned", value: effectiveEarnedCount, accent: GOLD_DEEP },
                {
                  label: "Total points",
                  value: data.totalPoints,
                  accent: GOLD,
                },
                {
                  label: "Longest streak",
                  value: data.streakRewards.longestStreak,
                  suffix: "d",
                  accent: STREAK,
                },
                {
                  label: "Certificates",
                  value: `${data.certificatesProgress.completed}/${data.certificatesProgress.total}`,
                  accent: EMERALD,
                  numeric: false as const,
                },
              ].map((kpi, idx, arr) => (
                <Box
                  key={kpi.label}
                  component={motion.div}
                  variants={{
                    hidden: { opacity: 0, y: 18 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
                    },
                  }}
                  sx={{
                    position: "relative",
                    py: { xs: 2.25, md: 2.75 },
                    px: { xs: 1.5, sm: 2 },
                    borderRight: {
                      xs:
                        idx % 2 !== 1
                          ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)"
                          : "none",
                      md:
                        idx !== arr.length - 1
                          ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)"
                          : "none",
                    },
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: 28,
                      height: 2,
                      background: kpi.accent,
                    },
                  }}
                >
                  <Typography
                    component="div"
                    sx={{
                      fontWeight: 800,
                      color: "var(--font-primary)",
                      fontSize: { xs: "1.65rem", sm: "2.1rem", md: "2.55rem" },
                      lineHeight: 1,
                      letterSpacing: "-0.04em",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {kpi.numeric === false ? (
                      kpi.value
                    ) : (
                      <>
                        <CountUp value={Number(kpi.value)} duration={1.3} />
                        {("suffix" in kpi && kpi.suffix) ? (
                          <Box
                            component="span"
                            sx={{
                              fontSize: "0.55em",
                              ml: 0.25,
                              color: "var(--font-secondary)",
                              fontWeight: 700,
                            }}
                          >
                            {kpi.suffix}
                          </Box>
                        ) : null}
                      </>
                    )}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--font-secondary)",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      display: "block",
                      mt: 1,
                    }}
                  >
                    {kpi.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Rest of badges + Milestones, side by side (or single column when one is empty) */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md:
                    restBadges.length > 0 && effectiveMilestones.length > 0
                      ? "minmax(0, 1fr) minmax(0, 1fr)"
                      : "1fr",
                },
                gap: { xs: 3, md: 3 },
              }}
            >
              {/* Trophy case (rest) */}
              {restBadges.length > 0 && (
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1.5,
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "var(--font-secondary)",
                          fontWeight: 700,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          fontSize: "0.66rem",
                        }}
                      >
                        Trophy case
                      </Typography>
                      <Typography
                        component="h3"
                        sx={{
                          fontWeight: 800,
                          color: "var(--font-primary)",
                          fontSize: "1.2rem",
                          letterSpacing: "-0.02em",
                          mt: 0.25,
                        }}
                      >
                        {restBadges.length} more unlocked
                      </Typography>
                    </Box>
                  </Box>
                  <motion.div
                    variants={gridStagger}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    style={{
                      display: "grid",
                      gap: 12,
                      gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                    }}
                  >
                    {restBadges.map((b, i) => (
                      <EarnedBadgeChip key={b.id} badge={b} index={i} />
                    ))}
                  </motion.div>
                </Box>
              )}

              {/* Milestones */}
              {effectiveMilestones.length > 0 && (
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1.5,
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "var(--font-secondary)",
                          fontWeight: 700,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          fontSize: "0.66rem",
                        }}
                      >
                        On the horizon
                      </Typography>
                      <Typography
                        component="h3"
                        sx={{
                          fontWeight: 800,
                          color: "var(--font-primary)",
                          fontSize: "1.2rem",
                          letterSpacing: "-0.02em",
                          mt: 0.25,
                        }}
                      >
                        In progress
                      </Typography>
                    </Box>
                    {data.certificatesProgress.total > 0 && (
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.6,
                          px: 1,
                          py: 0.45,
                          borderRadius: 999,
                          bgcolor: `color-mix(in srgb, ${EMERALD} 12%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${EMERALD} 25%, transparent)`,
                          color: EMERALD,
                        }}
                      >
                        <IconWrapper icon="mdi:certificate-outline" size={14} />
                        <Typography
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.7rem",
                            color: EMERALD,
                            letterSpacing: "0.06em",
                          }}
                        >
                          Certificates {certsPct}%
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <motion.div
                    variants={gridStagger}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    style={{
                      display: "grid",
                      gap: 12,
                      gridTemplateColumns:
                        restBadges.length > 0
                          ? "1fr"
                          : "repeat(auto-fit, minmax(420px, 1fr))",
                    }}
                  >
                    {effectiveMilestones.map((m, i) => (
                      <MilestoneCard key={m.id} milestone={m} index={i} />
                    ))}
                  </motion.div>
                </Box>
              )}
            </Box>
          </>
        )}
      </SectionShell>
    </Reveal>
  );
}
