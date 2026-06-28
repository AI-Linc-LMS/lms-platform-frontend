"use client";

import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";

export interface RewardBurst {
  id: number;
  points: number;
  base: number;
}

const BURST_MS = 1300;  // a touch past the float-up animation, then unmount so it never lingers

/**
 * "+N pts" reward that pops on a points-earning answer and floats up as it fades. Keyed by an
 * ever-incrementing reward id so each submit re-fires. Only fires for a positive reward — a
 * wrong answer (0 pts) or a practice quiz stays silent (correctness feedback lives elsewhere).
 *
 * Self-dismisses: the parent's `reward` state is never reset (it pins the last submit), so the pill
 * would otherwise sit on screen at the end of its animation and overlap the NEXT question. We mirror
 * `reward` into local state, animate it to a full fade-out, and drop it on a timer.
 */
export function PointsRewardBurst({ reward }: { reward: RewardBurst | null }) {
  // Track which reward id has elapsed; derive visibility during render (no sync setState in effect).
  const [dismissedId, setDismissedId] = useState<number | null>(null);

  useEffect(() => {
    if (!reward || reward.points <= 0) return;
    const t = setTimeout(() => setDismissedId(reward.id), BURST_MS);
    return () => clearTimeout(t);
  }, [reward]);

  const active = reward && reward.points > 0 && reward.id !== dismissedId ? reward : null;

  return (
    <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none", zIndex: 5, overflow: "visible" }}>
      <AnimatePresence>
        {active && active.points > 0 && (
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 16, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], y: [16, -30, -52, -78], scale: [0.6, 1.06, 1, 0.92] }}
            exit={{ opacity: 0, y: -96, scale: 0.9 }}
            transition={{ duration: 1.2, ease: "easeOut", times: [0, 0.2, 0.7, 1] }}
          >
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, px: 2, py: 1, borderRadius: 999, color: "white", fontWeight: 900, fontSize: "1.5rem", background: "linear-gradient(135deg, #10b981 0%, #22c55e 100%)", boxShadow: "0 16px 36px -14px rgba(16,185,129,0.7)" }}>
              <Icon icon="mdi:star-four-points" width={22} />
              +{active.points}
              <Typography component="span" sx={{ fontSize: "0.85rem", fontWeight: 800, opacity: 0.9 }}>pts</Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
