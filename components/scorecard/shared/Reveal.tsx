"use client";

import type { ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { fadeRise } from "./motion";
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
  return (
    <MotionTag
      className={className}
      style={style}
      initial={staticRender ? "visible" : "hidden"}
      animate={staticRender ? "visible" : undefined}
      whileInView={staticRender ? undefined : "visible"}
      viewport={staticRender ? undefined : { once: !repeat, margin: "0px 0px -10% 0px" }}
      variants={variants}
      transition={delay != null ? { delay } : undefined}
    >
      {children}
    </MotionTag>
  );
}
