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

/**
 * Never grow past this. A resume with three lines on it should look sparse, not like a
 * poster: past about a quarter again, the type stops reading as a document.
 */
export const MAX_SCALE = 1.25;

/**
 * Only grow a page with real dead space on it. Nudging a nearly-full page a few percent
 * buys nothing and risks pushing it over.
 */
export const GROW_BELOW = 0.92;

/** How much overflow to ignore. Sub-pixel rounding should not trigger a scale. */
const SLACK_PX = 2;

/**
 * Fit the resume to one A4 page - shrinking an over-long one so it is not cut off, and
 * growing a short one so it uses the page instead of trailing off into white space.
 *
 * SHRINK is a safety net. The page box sets overflow:hidden, so anything taller than 297mm
 * was silently CLIPPED - the learner lost the bottom of their own resume, and the PDF export
 * captures the same box, so it was missing from the download too. Measured against the
 * sample data, Technical ran 168px past the page.
 *
 * GROW is the other half of the same complaint. Measured ink coverage on a sparse resume ran
 * from 29% (LuxSleek) to 60% (Technical): most of the page was empty. Every template is a
 * fixed 297mm box, so short content simply trails off.
 */
export function computeFitScale(contentHeight: number, pageHeight = PAGE_HEIGHT_PX): number {
  if (!contentHeight) return 1;
  if (contentHeight > pageHeight + SLACK_PX) {
    return Math.max(MIN_SCALE, pageHeight / contentHeight);
  }
  if (contentHeight < pageHeight * GROW_BELOW) {
    return Math.min(MAX_SCALE, pageHeight / contentHeight);
  }
  return 1;
}

/**
 * How far down the page the resume actually reaches.
 *
 * scrollHeight cannot answer this. Every template sets height: 297mm on its own root, so the
 * BOX is always a full page whatever is in it - a resume whose text stops a third of the way
 * down still reports 1123px, which is why measuring the box could only ever detect overflow
 * and never dead space.
 *
 * So this measures ink: the lowest edge of anything that actually renders. Text nodes and
 * images count. A background COLOUR does not, deliberately - several templates carry a
 * full-height coloured sidebar, and treating that as content would report every one of them
 * as full and defeat the whole measurement.
 */
function inkHeight(root: HTMLElement): number {
  const top = root.getBoundingClientRect().top;
  let bottom = 0;
  for (const node of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    const cs = getComputedStyle(node);
    if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") continue;
    const hasText = Array.from(node.childNodes).some(
      (c) => c.nodeType === 3 && (c.textContent || "").trim().length > 0,
    );
    if (!hasText && node.tagName !== "IMG" && node.tagName !== "SVG") continue;
    const r = node.getBoundingClientRect();
    if (!r.height || !r.width) continue;
    bottom = Math.max(bottom, r.bottom - top);
  }
  return Math.round(bottom);
}

export function FitToPage({ children }: { children: React.ReactNode }) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  /** The k the compensated width is derived from. Held separately from the applied scale so
   *  the box never reflows in response to its own scaling. */
  const widthScaleRef = useRef(1);

  const measure = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    // Measure at the page's OWN width, never at the compensated width, or the reading feeds
    // back into the value that produced it.
    const previousWidth = el.style.width;
    const previousTransform = el.style.transform;
    el.style.transform = "";

    // Pass 1: how far the ink reaches at the page's own width.
    el.style.width = "100%";
    const first = computeFitScale(inkHeight(el));

    let next = first;
    if (first > 1) {
      // Growing widens the layout box by 1/k, which makes it NARROWER in layout terms, so
      // text reflows into more lines and ends up taller than pass 1 predicted. Left alone
      // that overshoot pushed three templates off the bottom of the page. So measure again
      // at the width we are actually going to use.
      el.style.width = `${100 / first}%`;
      const reflowed = inkHeight(el);
      // Scale from the SECOND reading but keep the width from the first: a width derived from
      // a different k would reflow again and never settle. The page then renders very slightly
      // narrower than 210mm, which is invisible, and never wider - which would clip.
      next = reflowed > 0 ? Math.min(first, PAGE_HEIGHT_PX / reflowed) : first;
    }

    el.style.width = previousWidth;
    el.style.transform = previousTransform;
    widthScaleRef.current = first;
    setScale(next);
  }, []);

  useLayoutEffect(() => { measure(); });

  useEffect(() => {
    const el = innerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  // Growing has to widen the layout box by the same factor it scales, or the page would be
  // scaled past 210mm and clipped down its sides - trading a vertical bug for a horizontal
  // one. Shrinking deliberately does NOT compensate: a narrower box reflows text into more
  // lines, which makes it taller, which asks for more shrink.
  const width = scale > 1 ? `${100 / widthScaleRef.current}%` : "100%";

  return (
    <Box data-resume-fit sx={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <Box
        ref={innerRef}
        style={{
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          width,
          // Growing scales a width-compensated box, so it must anchor at the left edge: from
          // the centre it would spill equally past BOTH sides and be clipped down the left.
          // Shrinking is not compensated, so centring keeps the smaller page in the middle
          // rather than stranding it in a corner.
          transformOrigin: scale > 1 ? "top left" : "top center",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
