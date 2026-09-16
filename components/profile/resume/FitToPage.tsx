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
function inkHeight(root: HTMLElement, viewScale: number): number {
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
    // Divide out the on-screen scale: see viewScale() for why this is the whole bug.
    bottom = Math.max(bottom, (r.bottom - top) / viewScale);
  }
  return Math.round(bottom);
}

/**
 * How much the page is being SHRUNK ON SCREEN, which is not the same thing as the scale this
 * component applies and must never be confused with it.
 *
 * This was the bug that survived two rounds of fixes. The preview shrinks the whole A4 box so
 * it fits the screen (0.4 on a phone up to 0.95 on a wide desktop), and getBoundingClientRect
 * reports SCREEN pixels, so every reading came back multiplied by that factor. Measured across
 * 432 runs, the reading equalled the true height times the screen scale to within 0.2%. A page
 * of 1404px therefore read as 1123 and looked exactly full.
 *
 * The consequences ran both ways and both were reported as bugs. Over-long resumes were not
 * shrunk, or not shrunk enough, and the page box clips - 159 lines of the learner's own resume
 * were hidden at 1000px wide. Full pages were GROWN, up to the 1.25 cap, which pushed even more
 * off the bottom. It looked template-specific because it is a percentage: the templates whose
 * text nearly fills the page lose text, and LuxSleek, the sparsest of the twelve, never did -
 * which is exactly the "except luxsleek" in the report.
 *
 * The computed width is the LAYOUT width and ignores transforms, so their ratio is the screen
 * scale, whatever the preview decides to do and however many ancestors are scaled.
 *
 * It has to be the COMPUTED width and not offsetWidth, which is rounded to a whole pixel. On a
 * page 701.44px wide that rounding claimed a screen scale of 1.0006 on an unscaled page, which
 * moved the measured ink by 2px, which moved the scale, which re-rendered and measured again:
 * Western looped between 1.1625 and 1.1637 until React gave up with "maximum update depth
 * exceeded" and the preview was replaced by an error page.
 *
 * Guarded, because a hidden or detached box reports 0 and must not divide.
 */
function viewScale(el: HTMLElement): number {
  const layoutWidth = parseFloat(getComputedStyle(el).width);
  const screenWidth = el.getBoundingClientRect().width;
  if (!layoutWidth || !screenWidth || !Number.isFinite(layoutWidth)) return 1;
  return screenWidth / layoutWidth;
}

export function FitToPage({ children }: { children: React.ReactNode }) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  /** The k the compensated width is derived from. Held separately from the applied scale so
   *  the box never reflows in response to its own scaling. */
  const widthScaleRef = useRef(1);
  /** The applied scale, readable inside measure() without making it a dependency. */
  const scaleRef = useRef(1);

  const measure = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    // Measure at the page's OWN width, never at the compensated width, or the reading feeds
    // back into the value that produced it.
    const previousWidth = el.style.width;
    const previousTransform = el.style.transform;
    el.style.transform = "";

    // With this element's own transform cleared, what remains is the preview's screen shrink.
    const view = viewScale(el);

    // Pass 1: how far the ink reaches at the page's own width.
    el.style.width = "100%";
    const first = computeFitScale(inkHeight(el, view));

    let next = first;
    if (first > 1) {
      // Growing widens the layout box by 1/k, which makes it NARROWER in layout terms, so
      // text reflows into more lines and ends up taller than pass 1 predicted. Left alone
      // that overshoot pushed three templates off the bottom of the page. So measure again
      // at the width we are actually going to use.
      el.style.width = `${100 / first}%`;
      const reflowed = inkHeight(el, view);
      // Scale from the SECOND reading but keep the width from the first: a width derived from
      // a different k would reflow again and never settle. The page then renders very slightly
      // narrower than 210mm, which is invisible, and never wider - which would clip.
      next = reflowed > 0 ? Math.min(first, PAGE_HEIGHT_PX / reflowed) : first;
    }

    el.style.width = previousWidth;
    el.style.transform = previousTransform;

    // A dead zone, because this effect runs on every render and sets the state that causes the
    // next one. Any measurement that wobbles by a fraction of a pixel - a font landing, a
    // sub-pixel width, a rounded reading - would otherwise be chased forever, and React kills a
    // component that updates itself 50 times in a row. A thousandth of a page is 1px: invisible
    // to a reader, and the difference between settling and not settling.
    if (Math.abs(next - scaleRef.current) < 0.002) return;
    scaleRef.current = next;
    widthScaleRef.current = first;
    setScale(next);
  }, []);

  useLayoutEffect(() => { measure(); });

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const cleanups: Array<() => void> = [];

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => measure());
      ro.observe(el);
      cleanups.push(() => ro.disconnect());
    }

    // The ResizeObserver above has a blind spot: every template fixes its own root at one page,
    // so content can grow inside a box whose SIZE never changes and no callback fires. Watching
    // the subtree covers that. Deliberately not attributes: measure() writes inline styles on
    // this very element, and observing those would call it in a loop.
    if (typeof MutationObserver !== "undefined") {
      const mo = new MutationObserver(() => measure());
      mo.observe(el, { childList: true, characterData: true, subtree: true });
      cleanups.push(() => mo.disconnect());
    }

    // A web font that lands after the first measurement changes how many lines the text takes,
    // and nothing re-measured: a page measured in the fallback font kept a scale that no longer
    // matched the text on it.
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts) {
      const onFonts = () => measure();
      fonts.addEventListener?.("loadingdone", onFonts);
      fonts.ready?.then(onFonts).catch(() => {});
      cleanups.push(() => fonts.removeEventListener?.("loadingdone", onFonts));
    }

    return () => cleanups.forEach((fn) => fn());
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
