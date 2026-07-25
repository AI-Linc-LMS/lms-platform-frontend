"use client";

import type { MotionProps } from "framer-motion";
import { useStaticRender } from "./StaticRenderContext";

/**
 * Returns motion props that trigger a "hidden → visible" entrance when the
 * element scrolls into view - or skips straight to the visible state when
 * we're inside a static render context (e.g. PDF capture).
 *
 * Pair with a `variants` prop containing `hidden` and `visible` keys.
 */
export function useViewportEntrance(
  options: { once?: boolean; margin?: string } = {},
): MotionProps {
  const { once = true, margin = "0px 0px -10% 0px" } = options;
  const staticRender = useStaticRender();
  if (staticRender) {
    return { initial: "visible", animate: "visible" };
  }
  return {
    initial: "hidden",
    whileInView: "visible",
    viewport: { once, margin },
  };
}
