"use client";

import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

/**
 * The roadmap module's surface primitives.
 *
 * Two rules, both from DESIGN.md and both deliberate:
 *
 * 1. **Depth comes from the surface ladder and 1px hairlines, never from drop shadows.**
 *    canvas `--surface` -> card `--card-bg` -> hairline `--border-default`. There is no
 *    `boxShadow` in this file, and hover does not lift, blur or tint a backdrop; it moves the
 *    border and nothing else. A card that jumps and casts a shadow under the cursor is the
 *    single cheapest-looking thing on a page.
 * 2. **Weights 400/500/600 only.** Emphasis comes from size, spacing and colour. Bold-as-
 *    emphasis is what makes a screen look generic, so nothing here is 700+.
 *
 * Everything is expressed in CSS custom properties rather than hex literals so these inherit
 * tenant theming, the same way the assessment-management surfaces do.
 */

/** A bordered content surface. The only container this module uses. */
export function Surface({
  children,
  padded = true,
  sx,
  ...rest
}: {
  children: ReactNode;
  padded?: boolean;
  sx?: object;
  [key: `data-${string}`]: string | undefined;
}) {
  return (
    <Box
      {...rest}
      sx={{
        borderRadius: "var(--radius-card)",
        border: "1px solid var(--border-default)",
        bgcolor: "var(--card-bg)",
        p: padded ? { xs: 2, md: 2.5 } : 0,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

/**
 * A section heading that sits ON the canvas, not inside a card.
 *
 * The count is part of the heading rather than a separate chip: "Role based / 3 roadmaps" is
 * one thought, and a chip would spend one of the three accents available on the page.
 */
export function SectionHeading({
  icon,
  title,
  count,
  noun = "roadmap",
  action,
}: {
  icon: string;
  title: string;
  count?: number;
  noun?: string;
  action?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        mb: 1.75,
        mt: 0.5,
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 2,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          border: "1px solid var(--border-default)",
          bgcolor: "var(--surface)",
          color: "var(--font-secondary)",
        }}
      >
        <Icon icon={icon} width={17} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: "1rem",
            color: "var(--font-primary)",
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </Typography>
        {count != null && (
          <Typography sx={{ fontSize: "0.78rem", color: "var(--font-tertiary)" }}>
            {count} {count === 1 ? noun : `${noun}s`}
          </Typography>
        )}
      </Box>
      {action}
    </Box>
  );
}

/**
 * One metric. No coloured top strip: DESIGN.md lists that among the banned patterns, and four
 * of them in a row is a rainbow where the numbers should be the only thing you read.
 */
export function Metric({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  icon?: string;
}) {
  return (
    <Surface sx={{ p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        {icon && (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              border: "1px solid var(--border-default)",
              bgcolor: "var(--surface)",
              color: "var(--font-secondary)",
            }}
          >
            <Icon icon={icon} width={18} />
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: "1.5rem",
              lineHeight: 1.1,
              color: "var(--font-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            {value}
          </Typography>
          <Typography
            sx={{
              mt: 0.35,
              fontSize: "0.7rem",
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--font-tertiary)",
            }}
          >
            {label}
          </Typography>
          {sub && (
            <Typography sx={{ mt: 0.2, fontSize: "0.75rem", color: "var(--font-tertiary)" }}>
              {sub}
            </Typography>
          )}
        </Box>
      </Box>
    </Surface>
  );
}

/**
 * Interactive card chrome. Hover moves the BORDER and the background one rung up the surface
 * ladder. No transform, no shadow, no blurred backdrop.
 */
export const cardInteraction = {
  borderRadius: "var(--radius-card)",
  border: "1px solid var(--border-default)",
  bgcolor: "var(--card-bg)",
  transition: "border-color .15s ease, background-color .15s ease",
  "&:hover": {
    borderColor: "color-mix(in srgb, var(--accent-purple) 45%, var(--border-default))",
    bgcolor: "var(--surface)",
  },
  // Focus is a ring with a canvas-coloured buffer so it reads on any surface and causes no
  // layout shift (DESIGN.md focus spec).
  "&:focus-visible": {
    outline: "none",
    boxShadow: "0 0 0 2px var(--surface), 0 0 0 4px var(--accent-purple)",
  },
} as const;
