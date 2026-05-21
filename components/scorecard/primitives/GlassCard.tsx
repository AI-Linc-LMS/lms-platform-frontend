"use client";

import { forwardRef } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Glow = "indigo" | "gold" | "streak" | "none";
type Padding = "none" | "sm" | "md" | "lg";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: Glow;
  padding?: Padding;
  radius?: "md" | "lg" | "xl";
  interactive?: boolean;
  children?: ReactNode;
}

const PADDING_PX: Record<Padding, string> = {
  none: "0",
  sm: "12px",
  md: "20px",
  lg: "28px",
};

const RADIUS_VAR: Record<NonNullable<GlassCardProps["radius"]>, string> = {
  md: "var(--sc-radius-md)",
  lg: "var(--sc-radius-lg)",
  xl: "var(--sc-radius-xl)",
};

function glowShadow(glow: Glow): string {
  switch (glow) {
    case "indigo":
      return "var(--sc-shadow-glow)";
    case "gold":
      return "0 0 0 1px var(--sc-accent-gold), 0 12px 32px var(--sc-accent-gold-glow)";
    case "streak":
      return "0 0 0 1px var(--sc-accent-streak), 0 12px 32px var(--sc-accent-streak-glow)";
    default:
      return "var(--sc-shadow-elevated)";
  }
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { glow = "none", padding = "md", radius = "lg", interactive = false, className, style, children, ...rest },
  ref
) {
  const inline: CSSProperties = {
    background: "var(--sc-bg-glass)",
    border: "1px solid var(--sc-border-subtle)",
    borderRadius: RADIUS_VAR[radius],
    padding: PADDING_PX[padding],
    boxShadow: glowShadow(glow),
    backdropFilter: "blur(12px) saturate(180%)",
    WebkitBackdropFilter: "blur(12px) saturate(180%)",
    transition: interactive
      ? "transform 180ms ease, box-shadow 200ms ease, border-color 200ms ease"
      : "box-shadow 200ms ease",
    ...style,
  };

  return (
    <div
      ref={ref}
      className={cn("sc-glass-card", interactive && "sc-glass-card--interactive", className)}
      style={inline}
      {...rest}
    >
      {children}
    </div>
  );
});
