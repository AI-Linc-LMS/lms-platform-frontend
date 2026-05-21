"use client";

import type { CSSProperties, ReactNode } from "react";
import { Lock } from "lucide-react";

export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

interface BadgeChipProps {
  tier: BadgeTier;
  label: string;
  icon?: ReactNode;
  earned?: boolean;
  progress?: number;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const TIER_COLOR: Record<BadgeTier, string> = {
  bronze: "var(--sc-accent-bronze)",
  silver: "var(--sc-accent-silver)",
  gold: "var(--sc-accent-gold)",
  platinum: "var(--sc-accent-platinum)",
};

const TIER_GLOW: Record<BadgeTier, string> = {
  bronze: "rgba(180, 83, 9, 0.45)",
  silver: "rgba(148, 163, 184, 0.45)",
  gold: "var(--sc-accent-gold-glow)",
  platinum: "rgba(14, 165, 233, 0.45)",
};

const SIZE_MAP = {
  sm: { padX: 8, padY: 4, font: 11, iconBox: 16 },
  md: { padX: 12, padY: 6, font: 12, iconBox: 20 },
  lg: { padX: 16, padY: 8, font: 14, iconBox: 24 },
};

export function BadgeChip({ tier, label, icon, earned = true, progress, size = "md", onClick }: BadgeChipProps) {
  const dims = SIZE_MAP[size];
  const tierColor = TIER_COLOR[tier];
  const glow = earned ? TIER_GLOW[tier] : "transparent";

  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: `${dims.padY}px ${dims.padX}px`,
    borderRadius: 999,
    fontSize: dims.font,
    fontWeight: 600,
    letterSpacing: "0.01em",
    border: `1px solid ${earned ? tierColor : "var(--sc-border-subtle)"}`,
    background: earned
      ? `color-mix(in oklab, ${tierColor} 12%, var(--sc-bg-elevated))`
      : "var(--sc-bg-elevated)",
    color: earned ? "var(--sc-text-primary)" : "var(--sc-text-muted)",
    boxShadow: earned ? `0 0 0 4px ${glow}` : "none",
    cursor: onClick ? "pointer" : "default",
    opacity: earned ? 1 : 0.7,
    transition: "transform 180ms ease, box-shadow 200ms ease",
    position: "relative",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={style}
      aria-pressed={earned}
      aria-label={`${label} badge${earned ? " (earned)" : ` (${Math.round((progress ?? 0) * 100)}% progress)`}`}
    >
      <span
        aria-hidden
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: dims.iconBox,
          height: dims.iconBox,
          borderRadius: 6,
          color: earned ? tierColor : "var(--sc-text-muted)",
        }}
      >
        {earned ? icon : <Lock size={dims.iconBox * 0.7} />}
      </span>
      <span>{label}</span>
      {!earned && typeof progress === "number" ? (
        <span style={{ color: "var(--sc-text-muted)", fontVariantNumeric: "tabular-nums" }}>
          {Math.round(progress * 100)}%
        </span>
      ) : null}
    </button>
  );
}
