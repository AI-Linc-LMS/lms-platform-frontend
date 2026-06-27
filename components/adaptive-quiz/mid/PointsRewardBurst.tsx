"use client";

import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";

export interface RewardBurst {
  id: number;
  points: number;
  base: number;
}

/**
 * "+N pts" reward that pops on a points-earning answer and floats up as it fades. Keyed by an
 * ever-incrementing reward id so each submit re-fires. Only fires for a positive reward — a
 * wrong answer (0 pts) or a practice quiz stays silent (correctness feedback lives elsewhere).
 */
export function PointsRewardBurst({ reward }: { reward: RewardBurst | null }) {
  return (
    <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none", zIndex: 5, overflow: "visible" }}>
      <AnimatePresence>
        {reward && reward.points > 0 && (
          <motion.div
            key={reward.id}
            initial={{ opacity: 0, y: 16, scale: 0.6 }}
            animate={{ opacity: 1, y: -56, scale: 1.05 }}
            exit={{ opacity: 0, y: -96, scale: 0.9 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, px: 2, py: 1, borderRadius: 999, color: "white", fontWeight: 900, fontSize: "1.5rem", background: "linear-gradient(135deg, #10b981 0%, #22c55e 100%)", boxShadow: "0 16px 36px -14px rgba(16,185,129,0.7)" }}>
              <Icon icon="mdi:star-four-points" width={22} />
              +{reward.points}
              <Typography component="span" sx={{ fontSize: "0.85rem", fontWeight: 800, opacity: 0.9 }}>pts</Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
