"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Box } from "@mui/material";

/** A4 at 96dpi. The page box in ResumePreview is 210mm x 297mm. */
export const PAGE_HEIGHT_PX = 1123;

/**
 * Never shrink past this. Below roughly 70% the body text stops being comfortably
 * readable and a scaled-down page is worse than a slightly cramped one.
 */
export const MIN_SCALE = 0.7;

/** How much overflow to ignore. Sub-pixel rounding should not trigger a scale. */
const SLACK_PX = 2;

/**
 * Scale the resume down so it fits one A4 page instead of being cut off.
 *
 * The page box sets `overflow: hidden`, so anything taller than 297mm was silently
 * CLIPPED - the learner lost the bottom of their own resume with no indication. Measured
 * against the sample data, the Technical template ran 168px past the page and Executive
 * 4px; a longer resume pushes several others over too.
 *
 * Shrink only. Scaling a short resume UP would widen it past the 210mm page and clip the
 * sides instead, trading a vertical bug for a horizontal one.
 */
export function computeFitScale(contentHeight: number, pageHeight = PAGE_HEIGHT_PX): number {
  if (!contentHeight || contentHeight <= pageHeight + SLACK_PX) return 1;
  return Math.max(MIN_SCALE, pageHeight / contentHeight);
}

export function FitToPage({ children }: { children: React.ReactNode }) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  const measure = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    // scrollHeight is a layout value and is unaffected by the transform we apply, so
    // measuring here cannot feed back into itself.
    setScale(computeFitScale(el.scrollHeight));
  }, []);

  useLayoutEffect(() => { measure(); });

  useEffect(() => {
    const el = innerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <Box
      data-resume-fit
      sx={{ width: "100%", height: "100%", overflow: "hidden" }}
    >
      <Box
        ref={innerRef}
        style={{ transform: scale < 1 ? `scale(${scale})` : undefined }}
        sx={{ transformOrigin: "top center", width: "100%" }}
      >
        {children}
      </Box>
    </Box>
  );
}
