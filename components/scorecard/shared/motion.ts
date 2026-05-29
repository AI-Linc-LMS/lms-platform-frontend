import type { Variants, Transition } from "framer-motion";

export const EASE_OUT_EXPO: Transition["ease"] = [0.16, 1, 0.3, 1];
export const EASE_OUT_QUART: Transition["ease"] = [0.22, 1, 0.36, 1];

export const fadeRise: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    // After the entrance settles, drop the filter entirely. A lingering
    // `filter: blur(0px)` on the resting element causes Chromium's print
    // pipeline to skip painting sections past the initial viewport, which
    // truncates the scorecard PDF after the first ~2 chapters. Setting
    // `transitionEnd.filter = "none"` clears the inline style once the
    // animation completes.
    transitionEnd: { filter: "none" },
    transition: { duration: 0.65, ease: EASE_OUT_EXPO },
  },
};

/**
 * A print-safe variant of `fadeRise` for static-render contexts (PDF capture)
 * where no animation runs — `transitionEnd` would never fire, leaving the
 * resting `filter: blur(0px)` style on the element. This one has no filter
 * at all so Chromium can paint it past the initial viewport.
 */
export const fadeRiseStatic: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EASE_OUT_EXPO },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: EASE_OUT_QUART } },
};

export const heroStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
};

export const gridStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: EASE_OUT_EXPO },
  },
};
