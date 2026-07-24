"use client";

import type { ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { fadeRise, fadeRiseStatic } from "./motion";
import { useStaticRender } from "./StaticRenderContext";

interface RevealProps {
  children: ReactNode;
  variants?: Variants;
  delay?: number;
  /** Re-trigger every time the element enters the viewport (default: once). */
  repeat?: boolean;
  /** Element type to render the motion wrapper as. */
  as?: "div" | "section" | "li" | "span";
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Strip CSS properties that break Chromium's print/PDF pipeline. Specifically,
 * `filter: blur(0px)` (left behind on the resting `visible` state of variants
 * like fadeRise) causes Chromium to skip painting elements past the initial
 * viewport when generating a PDF - sections later in the document end up as
 * blank pages. We drop the filter entirely for static (PDF) renders.
 */
function stripPrintHostileProps(variants: Variants): Variants {
  const out: Variants = {};
  for (const [key, value] of Object.entries(variants)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { filter: _f, ...rest } = value as Record<string, unknown>;
      out[key] = rest as Variants[string];
    } else {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Scroll-triggered reveal wrapper using framer-motion's viewport API.
 * Defaults to a soft blur-and-rise entrance for an editorial feel.
 */
export function Reveal({
  children,
  variants = fadeRise,
  delay,
  repeat = false,
  as = "div",
  className,
  style,
}: RevealProps) {
  const MotionTag = motion[as] as typeof motion.div;
  const staticRender = useStaticRender();
  // If the caller relied on the default `fadeRise`, prefer the print-safe
  // sibling. Otherwise sanitize whatever they passed.
  const effectiveVariants = staticRender
    ? variants === fadeRise
      ? fadeRiseStatic
      : stripPrintHostileProps(variants)
    : variants;
  return (
    <MotionTag
      className={className}
      style={style}
      initial={staticRender ? "visible" : "hidden"}
      animate={staticRender ? "visible" : undefined}
      whileInView={staticRender ? undefined : "visible"}
      viewport={staticRender ? undefined : { once: !repeat, margin: "0px 0px -10% 0px" }}
      variants={effectiveVariants}
      transition={delay != null ? { delay } : undefined}
    >
      {children}
    </MotionTag>
  );
}
