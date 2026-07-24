"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { Box, type SxProps, type Theme } from "@mui/material";
import ElectricBorder from "@/components/common/ElectricBorder";

/**
 * A points number that, whenever it INCREASES, tweens up from the previous value
 * to the new one (Duolingo-style count-up) and wraps itself in an animated
 * ElectricBorder for the duration of the count - then drops the border (it runs a
 * canvas loop, so it's only mounted during the transient increase, never idle).
 *
 * - `value`: current points total.
 * - `initialFrom`: optional baseline to count up FROM on first mount (e.g. the
 *   last-seen total) so a dashboard visit animates old -> new.
 */
export function AnimatedPointsCounter({
  value,
  initialFrom,
  duration = 0.75,
  sx,
  electricColor = "#fde047",
  boltSize: _boltSize,
}: {
  value: number;
  initialFrom?: number;
  duration?: number;
  sx?: SxProps<Theme>;
  electricColor?: string;
  /** deprecated; kept for call-site compatibility */
  boltSize?: number;
}) {
  const reduce = useReducedMotion();
  const startRef = useRef<number>(initialFrom ?? value);
  const [display, setDisplay] = useState<number>(Math.round(value)); // SSR-safe: = value
  const [electric, setElectric] = useState(false);

  useEffect(() => {
    const from = startRef.current;
    startRef.current = value;
    if (value === from) {
      setDisplay(Math.round(value));
      return;
    }
    if (reduce) {
      setDisplay(Math.round(value));
      return;
    }
    const increased = value > from;
    const controls = animate(from, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    if (!increased) {
      return () => controls.stop();
    }
    setElectric(true);
    const t = setTimeout(() => setElectric(false), Math.max(1100, duration * 1000 + 350));
    return () => {
      controls.stop();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const number = (
    <Box component="span" sx={{ fontVariantNumeric: "tabular-nums", ...sx }}>
      {display}
    </Box>
  );

  if (!electric) return number;

  return (
    <ElectricBorder
      color={electricColor}
      speed={2}
      chaos={0.2}
      borderRadius={12}
      className="inline-block align-middle"
      style={{ borderRadius: 12 }}
    >
      <Box component="span" sx={{ display: "inline-block", px: 0.5 }}>
        {number}
      </Box>
    </ElectricBorder>
  );
}
