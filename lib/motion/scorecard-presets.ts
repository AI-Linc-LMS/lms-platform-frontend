/**
 * Shared Framer Motion presets for the scorecard surface.
 *
 * Always import from here instead of inlining variants — keeps timings
 * consistent across sections so transitions feel coherent rather than
 * "every component has its own ease curve".
 *
 * Honour `prefers-reduced-motion`: components compose presets with the
 * `reduceMotion()` helper to flatten transitions for those users.
 */
import type { Transition, Variants } from "framer-motion";

export const springSoft: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 24,
  mass: 0.8,
};

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 360,
  damping: 22,
};

export const easeOut: Transition = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1],
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: easeOut },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: easeOut },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1, transition: springSoft },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.16 } },
};

export const pop: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: springSnappy },
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

export const celebrationBurst: Variants = {
  initial: { scale: 0.5, opacity: 0, rotate: -12 },
  animate: {
    scale: [0.5, 1.15, 1],
    opacity: [0, 1, 1],
    rotate: [-12, 6, 0],
    transition: { duration: 0.7, ease: [0.34, 1.56, 0.64, 1] },
  },
};

export const flameMorph: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.25, 0.95, 1.08, 1],
    transition: { duration: 0.9, ease: "easeInOut" },
  },
};

export function reduceMotion<T extends Variants>(variants: T, reduced: boolean): T {
  if (!reduced) return variants;
  const flat: Variants = {};
  for (const key of Object.keys(variants)) {
    const variant = (variants as Variants)[key] as Record<string, unknown> | undefined;
    const opacity = typeof variant?.opacity === "number" ? variant.opacity : 1;
    flat[key] = { opacity, transition: { duration: 0 } };
  }
  return flat as T;
}
