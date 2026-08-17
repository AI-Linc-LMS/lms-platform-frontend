"use client";

import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

/**
 * Surface primitives for the AI Tutor module.
 *
 * Same doctrine as `components/roadmaps/surfaces.tsx`, and for the same reasons: depth from
 * the surface ladder and 1px hairlines rather than drop shadows, hover moves the border
 * instead of lifting, weights 400/500/600 only.
 *
 * The one thing this module has to resist harder than most: DESIGN.md allows three accents
 * per page, and on a voice-tutor screen the blob, the canvas and the quiz all want to be
 * the accent. Only the blob gets it. Everything here stays on the neutral ladder so that
 * one violet reads as the live thing on the page.
 *
 * `TutorTintSurface` is the deliberate exception, and it exists because the dashboard read as
 * white-on-white: a violet header followed by a long column of neutral cards, with nothing
 * carrying the module's colour past the first 200 pixels. It tints toward the SAME violet the
 * header uses rather than introducing a second hue, so the page reads as one surface family.
 * Use it for the right rail and for a page's single call to action, never for a list of items:
 * six tinted cards in a row is not colour, it is noise.
 */

export function TutorSurface({
  children,
  padded = true,
  interactive = false,
  sx,
  ...rest
}: {
  children: ReactNode;
  padded?: boolean;
  /**
   * Renders as a real `<button>`, which is what makes prefetch-on-hover work properly: it
   * gets focus and keyboard activation for free, so `onFocus` fires for keyboard users and
   * the route warms for them too, not only for people with a mouse.
   */
  interactive?: boolean;
  sx?: object;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onFocus?: () => void;
  [key: `data-${string}`]: string | undefined;
}) {
  return (
    <Box
      component={interactive ? "button" : "div"}
      type={interactive ? "button" : undefined}
      {...rest}
      sx={{
        ...(interactive
          ? {
              display: "block",
              width: "100%",
              textAlign: "left",
              fontFamily: "inherit",
              font: "inherit",
              color: "inherit",
            }
          : null),
        borderRadius: "var(--radius-card)",
        border: "1px solid var(--border-default)",
        bgcolor: "var(--card-bg)",
        p: padded ? { xs: 2, md: 2.5 } : 0,
        ...(interactive
          ? {
              cursor: "pointer",
              transition: "border-color 160ms ease",
              "&:hover": { borderColor: "var(--ai-violet)" },
              "&:focus-visible": {
                outline: "none",
                boxShadow: "0 0 0 2px var(--canvas), 0 0 0 4px var(--ai-violet)",
              },
            }
          : null),
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

/** How strongly a tinted surface leans on the accent. */
export type TutorTint = "violet" | "indigo" | "deep";

const TINTS: Record<TutorTint, { bg: string; border: string }> = {
  // A wash. Reads as coloured paper, and text on it keeps full contrast.
  violet: {
    bg: "linear-gradient(150deg, color-mix(in srgb, #a855f7 9%, var(--card-bg)) 0%, var(--card-bg) 78%)",
    border: "color-mix(in srgb, #a855f7 28%, var(--border-default))",
  },
  indigo: {
    bg: "linear-gradient(150deg, color-mix(in srgb, #6366f1 9%, var(--card-bg)) 0%, var(--card-bg) 78%)",
    border: "color-mix(in srgb, #6366f1 26%, var(--border-default))",
  },
  // The header's own gradient. Text on this must be white, so it is opt-in per panel.
  deep: {
    bg: "linear-gradient(150deg, #2b1a63 0%, #1c1145 55%, #150d33 100%)",
    border: "rgba(255,255,255,0.14)",
  },
};

/**
 * A card that carries the module's colour.
 *
 * Same geometry as `TutorSurface` (8px-family radius, 1px hairline, no drop shadow) so a
 * tinted panel and a neutral one sit on the same grid without one appearing to float.
 */
export function TutorTintSurface({
  children,
  tint = "violet",
  padded = true,
  sx,
  ...rest
}: {
  children: ReactNode;
  tint?: TutorTint;
  padded?: boolean;
  sx?: object;
  [key: `data-${string}`]: string | undefined;
}) {
  const scheme = TINTS[tint];
  return (
    <Box
      {...rest}
      sx={{
        borderRadius: "var(--radius-card)",
        border: `1px solid ${scheme.border}`,
        background: scheme.bg,
        color: tint === "deep" ? "#fff" : "var(--font-primary)",
        p: padded ? { xs: 2, md: 2.5 } : 0,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

/** A heading that sits on the canvas, not inside a card. */
export function TutorSectionHeading({
  icon,
  title,
  meta,
  action,
}: {
  icon?: string;
  title: string;
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        mb: 1.5,
        mt: 0.5,
      }}
    >
      {icon ? (
        <Icon
          icon={icon}
          width={18}
          height={18}
          style={{ color: "var(--font-secondary)", flexShrink: 0 }}
        />
      ) : null}
      <Typography
        component="h2"
        sx={{
          fontSize: "0.88rem",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--font-secondary)",
        }}
      >
        {title}
      </Typography>
      {meta ? (
        <Typography sx={{ fontSize: "0.88rem", color: "var(--font-secondary)" }}>
          {meta}
        </Typography>
      ) : null}
      <Box sx={{ flex: 1 }} />
      {action}
    </Box>
  );
}

/** A small labelled statistic. Used in the dashboard's stat strip. */
export function TutorStat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <TutorSurface sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: "10px",
          display: "grid",
          placeItems: "center",
          bgcolor: "color-mix(in srgb, var(--ai-violet) 8%, transparent)",
          flexShrink: 0,
        }}
      >
        <Icon icon={icon} width={19} height={19} style={{ color: "var(--ai-violet)" }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: "1.3rem",
            fontWeight: 600,
            lineHeight: 1.1,
            color: "var(--font-primary)",
          }}
        >
          {value}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.88rem",
            color: "var(--font-secondary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </Typography>
      </Box>
    </TutorSurface>
  );
}

/** The level / duration selector chips. Pills are reserved for toggles, which this is. */
export function ChipToggle({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Box
            key={option.value}
            component="button"
            type="button"
            onClick={() => onChange(option.value)}
            sx={{
              px: 1.75,
              py: 0.75,
              borderRadius: 9999,
              fontSize: "0.87rem",
              fontWeight: 500,
              fontFamily: "inherit",
              cursor: "pointer",
              transition: "border-color 160ms ease, background-color 160ms ease",
              border: "1px solid",
              borderColor: active ? "var(--ai-violet)" : "var(--border-default)",
              bgcolor: active
                ? "color-mix(in srgb, var(--ai-violet) 8%, transparent)"
                : "var(--card-bg)",
              color: active ? "var(--ai-violet)" : "var(--font-secondary)",
              "&:focus-visible": {
                outline: "none",
                boxShadow: "0 0 0 2px var(--canvas), 0 0 0 4px var(--ai-violet)",
              },
            }}
          >
            {option.label}
          </Box>
        );
      })}
    </Box>
  );
}
