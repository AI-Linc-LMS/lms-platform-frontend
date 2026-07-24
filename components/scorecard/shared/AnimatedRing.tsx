"use client";

import { useId, useRef } from "react";
import { Box, Typography } from "@mui/material";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { CountUp } from "./CountUp";
import { useStaticRender } from "./StaticRenderContext";

interface AnimatedRingProps {
  /** 0–100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** Primary stroke color (used for gradient start). */
  color: string;
  /** Secondary stroke color (gradient end). Defaults to color. */
  colorEnd?: string;
  /** Track color. */
  trackColor?: string;
  /** Large numeric label inside the ring. */
  showValue?: boolean;
  /** Caption shown under the number. */
  caption?: string;
  /** Font size for the inner number. */
  valueFontSize?: number;
  /** Adds an outer glow halo behind the ring. */
  glow?: boolean;
  /** Render as percentage (default) or raw number. */
  asPercent?: boolean;
}

/**
 * Premium ring chart - gradient stroke, optional outer glow, scroll-triggered draw-in,
 * and a count-up number inside. Inherits typography color from MUI text.primary so it
 * stays legible across themes.
 */
export function AnimatedRing({
  value,
  size = 220,
  strokeWidth = 12,
  color,
  colorEnd,
  trackColor = "color-mix(in srgb, currentColor 10%, transparent)",
  showValue = true,
  caption,
  valueFontSize,
  glow = true,
  asPercent = true,
}: AnimatedRingProps) {
  const id = useId();
  const gradId = `ring-grad-${id}`;
  const glowId = `ring-glow-${id}`;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;
  const end = colorEnd ?? color;
  const ref = useRef<SVGSVGElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const shouldReduce = useReducedMotion();
  const staticRender = useStaticRender();
  const skipAnimation = shouldReduce || staticRender;

  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: color,
      }}
    >
      {glow && (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: -size * 0.18,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${color}33 0%, transparent 65%)`,
            filter: "blur(18px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)", position: "relative", zIndex: 1 }}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={end} />
          </linearGradient>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          filter={glow ? `url(#${glowId})` : undefined}
          initial={{ strokeDashoffset: skipAnimation ? offset : circumference }}
          animate={{
            strokeDashoffset: skipAnimation
              ? offset
              : inView
                ? offset
                : circumference,
          }}
          transition={{ duration: skipAnimation ? 0 : 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        />
      </svg>
      {showValue && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          <Typography
            component="div"
            sx={{
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              color: "text.primary",
              fontSize: valueFontSize ?? size * 0.28,
            }}
          >
            <CountUp value={clamped} duration={1.4} suffix={asPercent ? "%" : ""} />
          </Typography>
          {caption && (
            <Typography
              variant="caption"
              sx={{
                mt: 0.75,
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "text.secondary",
              }}
            >
              {caption}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
