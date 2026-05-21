/**
 * Scorecard design tokens. Surfaces twice:
 *   • As CSS variables under `.sc-scope` / `.sc-scope.sc-dark` in globals.css
 *   • As this TS object for use in JSX (sx props, motion configs, inline styles)
 *
 * Keep names in sync with the CSS-var block; tests assert the parity.
 */

export type ScorecardThemeMode = "light" | "dark";

interface Palette {
  bg: {
    canvas: string;
    elevated: string;
    glass: string;
    overlay: string;
  };
  border: {
    subtle: string;
    strong: string;
    glow: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverted: string;
  };
  accent: {
    primary: string;
    primaryGlow: string;
    success: string;
    warning: string;
    danger: string;
    streak: string;
    streakGlow: string;
    gold: string;
    goldGlow: string;
    silver: string;
    bronze: string;
    platinum: string;
  };
  gradient: {
    hero: string;
    ring: string;
    streak: string;
    gold: string;
  };
  shadow: {
    soft: string;
    elevated: string;
    glow: string;
  };
}

export const LIGHT_PALETTE: Palette = {
  bg: {
    canvas: "#f7f8fc",
    elevated: "#ffffff",
    glass: "rgba(255, 255, 255, 0.72)",
    overlay: "rgba(15, 23, 42, 0.04)",
  },
  border: {
    subtle: "rgba(15, 23, 42, 0.08)",
    strong: "rgba(15, 23, 42, 0.16)",
    glow: "rgba(99, 102, 241, 0.32)",
  },
  text: {
    primary: "#0f172a",
    secondary: "#334155",
    muted: "#64748b",
    inverted: "#ffffff",
  },
  accent: {
    primary: "#6366f1",
    primaryGlow: "rgba(99, 102, 241, 0.35)",
    success: "#16a34a",
    warning: "#f59e0b",
    danger: "#ef4444",
    streak: "#f97316",
    streakGlow: "rgba(249, 115, 22, 0.45)",
    gold: "#eab308",
    goldGlow: "rgba(234, 179, 8, 0.4)",
    silver: "#94a3b8",
    bronze: "#b45309",
    platinum: "#0ea5e9",
  },
  gradient: {
    hero: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
    ring: "conic-gradient(from 180deg, #6366f1 0deg, #8b5cf6 180deg, #ec4899 360deg)",
    streak: "linear-gradient(180deg, #fb923c 0%, #f97316 50%, #ea580c 100%)",
    gold: "linear-gradient(135deg, #fde68a 0%, #eab308 50%, #b45309 100%)",
  },
  shadow: {
    soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 6px rgba(15, 23, 42, 0.06)",
    elevated: "0 8px 24px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.04)",
    glow: "0 0 0 1px rgba(99, 102, 241, 0.18), 0 12px 32px rgba(99, 102, 241, 0.25)",
  },
};

export const DARK_PALETTE: Palette = {
  bg: {
    canvas: "#0b1020",
    elevated: "#121833",
    glass: "rgba(18, 24, 51, 0.68)",
    overlay: "rgba(255, 255, 255, 0.04)",
  },
  border: {
    subtle: "rgba(255, 255, 255, 0.08)",
    strong: "rgba(255, 255, 255, 0.16)",
    glow: "rgba(129, 140, 248, 0.45)",
  },
  text: {
    primary: "#f8fafc",
    secondary: "#cbd5e1",
    muted: "#94a3b8",
    inverted: "#0f172a",
  },
  accent: {
    primary: "#818cf8",
    primaryGlow: "rgba(129, 140, 248, 0.5)",
    success: "#22c55e",
    warning: "#fbbf24",
    danger: "#f87171",
    streak: "#fb923c",
    streakGlow: "rgba(251, 146, 60, 0.6)",
    gold: "#fde047",
    goldGlow: "rgba(253, 224, 71, 0.55)",
    silver: "#cbd5e1",
    bronze: "#d97706",
    platinum: "#38bdf8",
  },
  gradient: {
    hero: "linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #f472b6 100%)",
    ring: "conic-gradient(from 180deg, #818cf8 0deg, #a78bfa 180deg, #f472b6 360deg)",
    streak: "linear-gradient(180deg, #fdba74 0%, #fb923c 50%, #f97316 100%)",
    gold: "linear-gradient(135deg, #fef9c3 0%, #fde047 50%, #d97706 100%)",
  },
  shadow: {
    soft: "0 1px 2px rgba(0, 0, 0, 0.35), 0 1px 6px rgba(0, 0, 0, 0.3)",
    elevated: "0 8px 24px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.35)",
    glow: "0 0 0 1px rgba(129, 140, 248, 0.3), 0 12px 36px rgba(129, 140, 248, 0.35)",
  },
};

export const TYPOGRAPHY = {
  fontFamily:
    'var(--font-primary), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  numeric: '"SF Mono", ui-monospace, Menlo, monospace',
  scale: {
    "display-2xl": { size: 60, lineHeight: 1.05, weight: 700, tracking: "-0.02em" },
    "display-xl": { size: 44, lineHeight: 1.1, weight: 700, tracking: "-0.015em" },
    "title-lg": { size: 24, lineHeight: 1.25, weight: 600, tracking: "-0.005em" },
    "title-md": { size: 18, lineHeight: 1.4, weight: 600, tracking: "0" },
    body: { size: 14, lineHeight: 1.5, weight: 400, tracking: "0" },
    caption: { size: 12, lineHeight: 1.45, weight: 500, tracking: "0.01em" },
    "numeric-hero": { size: 72, lineHeight: 1, weight: 700, tracking: "-0.03em" },
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
  "4xl": 64,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export function getPalette(mode: ScorecardThemeMode): Palette {
  return mode === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
}

export type { Palette };
