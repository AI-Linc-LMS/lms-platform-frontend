/**
 * The level ladder's palette.
 *
 * The cards are DARK on a light page, matching the platform's own chrome - the course tab bar is
 * deep violet, and a ladder drawn in pale lilac read as a different product sitting under it.
 *
 * Every value here was checked as a ratio before it was written, against the LIGHTER stop of
 * each gradient rather than the base, because that stop is the worst case and the one a quick
 * eyeball misses. The lowest ratio in the set is 6.30:1.
 *
 * Muted text is rgba WHITE over a dark card, which composites toward white and therefore RAISES
 * contrast. That is the opposite of the career-station bug, where `opacity` on a dark card over
 * a white PAGE composited toward white and destroyed the hue. The distinction is what sits
 * behind the thing being made translucent: here it is the card, there it was the page.
 */

export const T = {
  /** Card body, dark. The second stop is the one to test text against. */
  bodyFrom: "#1b1038",
  bodyTo: "#2b1a5e",
  /** Header band. Brighter once a learner has started the topic, so progress is visible at a glance. */
  headFrom: "#2e1d63",
  headTo: "#4a2aa8",
  headFromActive: "#4527a0",
  headToActive: "#6d3ae0",

  title: "#ffffff",
  /** 9.52:1 on the body's light stop. */
  body: "rgba(255,255,255,0.78)",
  /** 6.50:1. Used for counts and the solved caption. */
  dim: "rgba(255,255,255,0.62)",
  /** 11.81:1. Bucket names, which are the card's real content. */
  strong: "rgba(255,255,255,0.88)",

  hairline: "rgba(255,255,255,0.14)",
  tile: "rgba(255,255,255,0.08)",
  /** 8.53:1 on the body. */
  good: "#4ade80",
  goodEdge: "rgba(74,222,128,0.55)",

  /** The rail and the level pill live on the PAGE, not on a card, so they stay light. */
  rail: "#d8d5e4",
  pillBg: "#ffffff",
  pillInk: "#1b1038",
} as const;

/** A faint diagonal weave, so a large dark panel is not a flat slab. */
export const WEAVE =
  "repeating-linear-gradient(135deg, rgba(255,255,255,0.040) 0px, rgba(255,255,255,0.040) 1px, transparent 1px, transparent 11px)";
