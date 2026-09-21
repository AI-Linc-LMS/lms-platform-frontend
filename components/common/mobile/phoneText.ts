/* ==========================================================================
 * A floor for type that was sized for a desktop card.
 *
 * The dense surfaces in this product are written in small rem literals - `fontSize: "0.62rem"`
 * is 9.9px, `"0.66rem"` is 10.6px. On a 27in monitor at arm's length that reads as a caption.
 * On a phone held at 30cm it is not type, it is texture: the iPhone audit counted 271 text nodes
 * below 12px on /user/scorecard and 98 on /profile.
 *
 * iOS Human Interface Guidelines and WCAG both put the practical floor at 11-12px; below that a
 * reader with ordinary eyesight stops reading and starts guessing. This raises the phone value to
 * that floor and leaves every wider breakpoint exactly as it was authored, so a desktop layout is
 * unchanged to the pixel.
 *
 *   fontSize: phoneText(0.62)   // { xs: "0.75rem", sm: "0.62rem" }
 *
 * Using one helper rather than hand-written breakpoints at each site is deliberate: the value is
 * then a decision made once, and a source scan can prove no small literal slipped back in.
 * ======================================================================== */

/** 12px at the default 16px root. Nothing a learner has to read goes below this on a phone. */
export const PHONE_MIN_REM = 0.75;

/**
 * The authored size on `sm` and up, raised to the phone floor on `xs`.
 *
 * @param rem  the size the surface was designed with, in rem.
 * @param floor override the floor for a label that must stay smaller than its neighbours.
 */
export function phoneText(rem: number, floor: number = PHONE_MIN_REM): { xs: string; sm: string } {
  return { xs: `${Math.max(rem, floor)}rem`, sm: `${rem}rem` };
}
