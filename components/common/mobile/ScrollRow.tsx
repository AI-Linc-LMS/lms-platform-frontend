"use client";

import type { ReactNode } from "react";
import { Box, type SxProps, type Theme } from "@mui/material";

/* ==========================================================================
 * A row that scrolls sideways ON PURPOSE, and looks like it.
 *
 * Filter chips and tab rows already overflow on a phone - the audit found chips reaching 664px on
 * /assessments and 598px on /jobs-v2. They sit in a plain overflow:auto box, so the row simply
 * ends at the screen edge with no sign that more exists, and on iOS the scrollbar is invisible
 * until you drag.
 *
 * This adds the two things that make such a row readable: momentum scrolling with snap points, and
 * a fade at whichever edge still has content. The gutters are negative-margined so the first chip
 * lines up with the page text while the row itself bleeds to the screen edge, which is what tells
 * a thumb it can drag.
 * ======================================================================== */

export interface ScrollRowProps {
  children: ReactNode;
  /** Page gutter to bleed into, matching the page's own padding. */
  gutter?: number;
  gap?: number;
  ariaLabel?: string;
  sx?: SxProps<Theme>;
}

export function ScrollRow({ children, gutter = 2, gap = 1, ariaLabel, sx }: ScrollRowProps) {
  return (
    <Box
      role={ariaLabel ? "group" : undefined}
      aria-label={ariaLabel}
      sx={{
        display: "flex",
        gap,
        overflowX: "auto",
        overflowY: "hidden",
        scrollSnapType: "x proximity",
        WebkitOverflowScrolling: "touch",
        // The row bleeds to the screen edge; its first and last child keep the page's gutter.
        mx: { xs: -gutter, sm: 0 },
        px: { xs: gutter, sm: 0 },
        pb: 0.5,
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
        "& > *": { scrollSnapAlign: "start", flexShrink: 0 },
        // A soft edge instead of a hard cut, so it reads as "there is more this way".
        maskImage: {
          xs: "linear-gradient(to right, transparent 0, #000 12px, #000 calc(100% - 12px), transparent 100%)",
          sm: "none",
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
