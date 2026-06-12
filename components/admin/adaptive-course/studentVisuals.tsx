"use client";

import { Box } from "@mui/material";

/** Shared visual helpers for the adaptive-course Students surfaces. */

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
  "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
  "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
  "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)",
  "linear-gradient(135deg, #ec4899 0%, #6366f1 100%)",
];

/** Brand progress-bar fill (matches the course-builder gradient). */
export const PROGRESS_GRADIENT = "linear-gradient(90deg, #6366f1 0%, #a855f7 60%, #ec4899 100%)";

/** Per-content-type accent colors — same palette as the builder's ModuleSummary. */
export const TYPE_COLOR = {
  quiz: "#6366f1",
  coding: "#ec4899",
  video: "#0ea5e9",
  article: "#a855f7",
} as const;

export function initials(name: string, email: string): string {
  const src = (name || "").trim() || (email || "").trim();
  if (!src) return "?";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function gradientFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

export function StudentAvatar({
  name,
  email,
  size = 40,
  dim = false,
}: {
  name: string;
  email: string;
  size?: number;
  dim?: boolean;
}) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        color: "white",
        fontWeight: 800,
        fontSize: size * 0.36,
        letterSpacing: "0.02em",
        background: gradientFor(email || name),
        boxShadow: "0 8px 18px -10px rgba(99,102,241,0.55)",
        opacity: dim ? 0.5 : 1,
        userSelect: "none",
      }}
    >
      {initials(name, email)}
    </Box>
  );
}

/** A gradient-filled progress bar (rounded). `value` is 0–100. */
export function GradientBar({ value, height = 8 }: { value: number; height?: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: 999,
        bgcolor: "color-mix(in srgb, #6366f1 12%, transparent)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          width: `${v}%`,
          borderRadius: 999,
          background: PROGRESS_GRADIENT,
          transition: "width 240ms ease",
        }}
      />
    </Box>
  );
}
