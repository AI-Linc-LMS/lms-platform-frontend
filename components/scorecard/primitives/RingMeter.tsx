"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface RingMeterProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  gradient?: "primary" | "gold" | "streak";
  label?: string;
  sublabel?: string;
  centerSlot?: ReactNode;
  showValue?: boolean;
}

const GRAD_STOPS: Record<NonNullable<RingMeterProps["gradient"]>, [string, string]> = {
  primary: ["var(--sc-accent-primary)", "var(--sc-accent-platinum)"],
  gold: ["var(--sc-accent-gold)", "var(--sc-accent-bronze)"],
  streak: ["var(--sc-accent-streak)", "var(--sc-accent-danger)"],
};

/**
 * Animated SVG progress ring. The value tweens on mount and whenever `value`
 * changes — used everywhere we display a hero score so the number feels alive
 * instead of snapping.
 */
export function RingMeter({
  value,
  max = 100,
  size = 160,
  strokeWidth = 12,
  gradient = "primary",
  label,
  sublabel,
  centerSlot,
  showValue = true,
}: RingMeterProps) {
  const safeValue = Math.max(0, Math.min(max, value));
  const pct = max > 0 ? safeValue / max : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const display = useMotionValue(0);
  const rounded = useTransform(display, (v) => Math.round(v));
  const valueRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(display, safeValue, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [safeValue, display]);

  useEffect(() => {
    const unsub = rounded.on("change", (latest) => {
      if (valueRef.current) valueRef.current.textContent = String(latest);
    });
    return unsub;
  }, [rounded]);

  const [from, to] = GRAD_STOPS[gradient];
  const gradientId = `sc-ring-grad-${gradient}`;

  const centerStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    pointerEvents: "none",
  };

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--sc-border-subtle)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div style={centerStyle}>
        {centerSlot ?? (
          <>
            {showValue ? (
              <span
                style={{
                  fontFamily: '"SF Mono", ui-monospace, Menlo, monospace',
                  fontSize: size * 0.32,
                  lineHeight: 1,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "var(--sc-text-primary)",
                }}
              >
                <span ref={valueRef}>0</span>
              </span>
            ) : null}
            {label ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--sc-text-muted)",
                }}
              >
                {label}
              </span>
            ) : null}
            {sublabel ? (
              <span style={{ fontSize: 11, color: "var(--sc-text-muted)" }}>{sublabel}</span>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
