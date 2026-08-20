"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Box, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

export interface XPGainEntry {
  id: string;
  delta: number;
  icon: string;
  label?: string;
}

/**
 * The framer-motion half of XPGainProvider, split into its own module so the
 * animation library loads on the FIRST XP gain instead of with every page:
 * statically imported from the root provider it put ~43KB gz of framer-motion
 * into the shared baseline of all ~140 routes, including /login.
 */
export default function XPGainPopups({ gains }: { gains: XPGainEntry[] }) {
  return (
    <AnimatePresence>
      {gains.map((g) => (
        <motion.div
          key={g.id}
          // Snappy entrance from the right; bigger upward fade-out so the
          // pill physically floats up and away rather than just vanishing.
          initial={{ opacity: 0, x: 24, scale: 0.92 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{
            opacity: 0,
            y: -60,
            scale: 0.85,
            transition: { duration: 0.45, ease: [0.34, 0.07, 0.4, 1] },
          }}
          // Tight tween (90ms) - feels instantaneous, no spring overshoot lag.
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={{ pointerEvents: "auto", willChange: "transform, opacity" }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              py: 0.9,
              borderRadius: "999px",
              background:
                "linear-gradient(135deg, rgba(34,197,94,0.96), rgba(16,185,129,0.96))",
              color: "#fff",
              boxShadow:
                "0 10px 30px rgba(34,197,94,0.32), 0 2px 6px rgba(0,0,0,0.10)",
              backdropFilter: "blur(10px)",
              minWidth: 110,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconWrapper icon={g.icon} size={16} color="#fff" />
            </Box>
            <Typography
              sx={{ fontWeight: 800, fontSize: "0.88rem", letterSpacing: "0.02em" }}
            >
              +{g.delta} IP
            </Typography>
            {g.label && (
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  opacity: 0.85,
                  fontWeight: 600,
                  ml: 0.25,
                }}
              >
                · {g.label}
              </Typography>
            )}
          </Box>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
