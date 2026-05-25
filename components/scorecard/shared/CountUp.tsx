"use client";

import { useEffect, useRef, useState } from "react";
import { Box, type SxProps, type Theme } from "@mui/material";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { useStaticRender } from "./StaticRenderContext";

interface CountUpProps {
  value: number;
  /** Decimals to keep (e.g. 0 → integers, 1 → one decimal). */
  decimals?: number;
  /** Optional suffix (%, +, …). */
  suffix?: string;
  /** Optional prefix. */
  prefix?: string;
  /** Animation duration in seconds. */
  duration?: number;
  /** Delay in seconds before the animation starts. */
  delay?: number;
  /** Component to render as. Defaults to span. */
  as?: React.ElementType;
  sx?: SxProps<Theme>;
  /** Format function. If provided, overrides default formatting. */
  format?: (current: number) => string;
}

function formatNumber(
  value: number,
  decimals: number,
  prefix: string,
  suffix: string,
  format?: (current: number) => string,
) {
  return format ? format(value) : `${prefix}${value.toFixed(decimals)}${suffix}`;
}

const NUMERIC_SX = {
  fontVariantNumeric: "tabular-nums",
  display: "inline-block",
} as const;

/**
 * Lightweight count-up animation that starts when the element enters the viewport.
 * Renders tabular-nums for stable width during the count. Skips animation entirely
 * for reduced-motion users or within a static render (PDF capture) context.
 */
export function CountUp({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  duration = 1.4,
  delay = 0,
  as = "span",
  sx,
  format,
}: CountUpProps) {
  const shouldReduce = useReducedMotion();
  const staticRender = useStaticRender();
  const skipAnimation = shouldReduce || staticRender;

  if (skipAnimation) {
    return (
      <Box component={as} sx={{ ...NUMERIC_SX, ...sx }}>
        {formatNumber(value, decimals, prefix, suffix, format)}
      </Box>
    );
  }
  return (
    <AnimatedCountUp
      value={value}
      decimals={decimals}
      prefix={prefix}
      suffix={suffix}
      duration={duration}
      delay={delay}
      as={as}
      sx={sx}
      format={format}
    />
  );
}

function AnimatedCountUp({
  value,
  decimals,
  prefix,
  suffix,
  duration,
  delay,
  as,
  sx,
  format,
}: Required<Pick<CountUpProps, "value" | "decimals" | "prefix" | "suffix" | "duration" | "delay" | "as">> & {
  sx?: SxProps<Theme>;
  format?: (current: number) => string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [inView, value, duration, delay]);

  return (
    <Box component={as} ref={ref} sx={{ ...NUMERIC_SX, ...sx }}>
      {formatNumber(display, decimals, prefix, suffix, format)}
    </Box>
  );
}
