"use client";

import type { ReactNode } from "react";
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { J } from "@/components/jobs-v2/ui/jobsTokens";

/**
 * ONE visual language for every jobs illustration.
 *
 * Rules, and they are the whole point of this file:
 *   - **2px stroke**, and structure is `currentColor` so a single `color` on the root recolours
 *     the whole drawing.
 *   - **One accent stop**, taken from the brand badge gradient (`--j-azure` to `--j-cyan`).
 *   - **Paper fills are `J.surface`, never `var(--font-light)`** — that is a *text* token that
 *     happens to be white today, and using it as a surface is what makes these drawings invert
 *     under a dark scope.
 *   - `tone` defaults to `"muted"`, so the same asset never reads as two different things on
 *     two screens. `JobSearchIllustration` is indigo on the board and grey on the detail page
 *     today; after this it is one thing with an explicit opt-in to the accent.
 *   - Everything is `aria-hidden`: the adjacent copy always says what the empty state means.
 */

export type IllustrationTone = "accent" | "muted";

export interface IllustrationProps {
  width?: number;
  height?: number;
  tone?: IllustrationTone;
  /**
   * @deprecated Use `tone`. Retained only so the untouched legacy `/jobs` route and the
   * not-yet-migrated jobs-v2 screens keep compiling; remove once Groups 2-5 have landed.
   */
  primaryColor?: string;
  sx?: SxProps<Theme>;
}

export function structureColor(tone: IllustrationTone, primaryColor?: string): string {
  if (primaryColor) return primaryColor;
  return tone === "accent" ? J.azure : J.ink4;
}

/** The shared SVG shell: sizing, the accent gradient definition, and the a11y contract. */
export function IllustrationRoot({
  viewBox,
  width,
  height,
  tone = "muted",
  primaryColor,
  gradientId,
  children,
  sx,
}: {
  viewBox: string;
  gradientId: string;
  children: ReactNode;
} & IllustrationProps) {
  return (
    <Box
      component="svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={width}
      height={height}
      aria-hidden
      focusable="false"
      role="presentation"
      sx={[
        {
          flexShrink: 0,
          color: structureColor(tone, primaryColor),
          maxWidth: "100%",
          height: "auto",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <defs>
        {/* The single accent stop, and the only colour in the drawing that is not currentColor. */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={J.azure} />
          <stop offset="100%" stopColor={J.cyan} />
        </linearGradient>
      </defs>
      {children}
    </Box>
  );
}

/** The paper fill every "document" shape in these drawings uses. */
export const PAPER = J.surface;

/** The one stroke width. */
export const STROKE = 2;
