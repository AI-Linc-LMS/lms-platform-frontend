"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import { Box, type SxProps, type Theme } from "@mui/material";
import { Icon } from "@iconify/react";

/**
 * A points number that, whenever it INCREASES, tweens up from the previous value
 * to the new one (Duolingo-style count-up) and flashes a small lightning bolt.
 *
 * - `value`: the current points total.
 * - `initialFrom`: optional baseline to count up FROM on first mount (e.g. the
 *   last-seen total from storage) so a dashboard visit animates old -> new.
 */
export function AnimatedPointsCounter({
  value,
  initialFrom,
  duration = 0.75,
  sx,
  boltSize = 18,
}: {
  value: number;
  initialFrom?: number;
  duration?: number;
  sx?: SxProps<Theme>;
  boltSize?: number;
}) {
  const reduce = useReducedMotion();
  // startRef seeds the FROM of the count-up. Seeding it with `initialFrom` makes
  // the first mount animate initialFrom -> value (e.g. last-seen -> new total).
  const startRef = useRef<number>(initialFrom ?? value);
  // display inits to `value` (NOT initialFrom) so SSR/first paint matches and there's
  // no hydration mismatch; the mount effect then tweens down-and-up from initialFrom.
  const [display, setDisplay] = useState<number>(Math.round(value));
  const [zap, setZap] = useState(0);

  useEffect(() => {
    const from = startRef.current;
    startRef.current = value;
    if (value === from) return;
    if (value > from) setZap((z) => z + 1); // lightning only on an increase
    if (reduce) {
      setDisplay(Math.round(value));
      return;
    }
    const controls = animate(from, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Box component="span" sx={{ position: "relative", display: "inline-flex", alignItems: "center", ...sx }}>
      <AnimatePresence>
        {zap > 0 && (
          <motion.span
            key={zap}
            initial={{ scale: 0.3, opacity: 0, rotate: -22 }}
            animate={{ scale: [0.3, 1.35, 1], opacity: [0, 1, 0], rotate: [-22, 8, 0] }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: -(boltSize + 2),
              top: "50%",
              marginTop: -boltSize / 2,
              color: "#f59e0b",
              display: "inline-flex",
              filter: "drop-shadow(0 0 6px rgba(245,158,11,0.7))",
              pointerEvents: "none",
            }}
          >
            <Icon icon="mdi:lightning-bolt" width={boltSize} />
          </motion.span>
        )}
      </AnimatePresence>
      <Box component="span" sx={{ fontVariantNumeric: "tabular-nums" }}>
        {display}
      </Box>
    </Box>
  );
}
