"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import ElectricBorder from "@/components/common/ElectricBorder";
import { useXpCelebration } from "@/lib/xp/xpCelebration";
import { playXpSound } from "@/lib/xp/xpSound";

const HOLD_MS = 2600; // bigger + lingers (was a small, fast pill)
const SPARKS = Array.from({ length: 16 }, (_, i) => (i * 360) / 16);

/**
 * Global Duolingo-style "+N points earned" celebration: a bold card wrapped in an
 * animated ElectricBorder, a lightning zap, radial sparks, and a short chime.
 * Store-driven (celebrateXp), mounted once in app/layout, non-blocking, self-dismissing.
 */
export function XpCelebrationOverlay() {
  const { amount, token } = useXpCelebration();
  const [shown, setShown] = useState<{ amount: number; token: number } | null>(null);

  useEffect(() => {
    if (token === 0 || amount <= 0) return;
    setShown({ amount, token });
    playXpSound();
    const t = setTimeout(() => setShown(null), HOLD_MS);
    return () => clearTimeout(t);
  }, [token, amount]);

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          key={shown.token}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ position: "fixed", inset: 0, zIndex: 2300, pointerEvents: "none", display: "grid", placeItems: "center" }}
          aria-hidden
        >
          {/* soft backdrop dim to make the card pop */}
          <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 45%, rgba(20,6,31,0.5), rgba(10,4,20,0.16) 55%, transparent 72%)" }} />

          {/* ambient glow */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0.8 }}
            animate={{ scale: [0.3, 1.8, 1.5], opacity: [0.8, 0.4, 0] }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            style={{
              position: "absolute", left: "50%", top: "50%", marginLeft: -190, marginTop: -190,
              width: 380, height: 380, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(250,204,21,0.5) 0%, rgba(168,85,247,0.28) 45%, transparent 70%)",
            }}
          />

          {/* radial sparks (opacity-only anim so the static radial transform holds) */}
          {SPARKS.map((deg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.7, delay: 0.06 + (i % 4) * 0.03, ease: "easeOut" }}
              style={{
                position: "absolute", left: "50%", top: "50%",
                width: 4, height: 60, borderRadius: 2,
                background: "linear-gradient(#fef08a, #f59e0b)",
                transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-128px)`,
                transformOrigin: "center",
              }}
            />
          ))}

          {/* the card */}
          <motion.div
            initial={{ scale: 0.4, y: 22, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 18 }}
            style={{ position: "relative" }}
          >
            <ElectricBorder color="#fde047" speed={1.6} chaos={0.16} borderRadius={28} style={{ borderRadius: 28 }}>
              <Box
                sx={{
                  borderRadius: "28px",
                  px: { xs: 4, sm: 6 },
                  py: { xs: 3.5, sm: 4.5 },
                  textAlign: "center",
                  minWidth: { xs: 236, sm: 300 },
                  background: "radial-gradient(130% 120% at 50% 0%, #2a1150 0%, #14061f 55%, #0f0518 100%)",
                }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: [0, 1.3, 1], rotate: [-20, 8, 0] }}
                  transition={{ type: "spring", stiffness: 380, damping: 14 }}
                  style={{ display: "inline-flex", marginBottom: 12 }}
                >
                  <Box
                    sx={{
                      width: 78, height: 78, borderRadius: "26%", display: "grid", placeItems: "center",
                      background: "linear-gradient(135deg, #fde047, #f59e0b)",
                      boxShadow: "0 16px 42px -10px rgba(245,158,11,0.85)",
                    }}
                  >
                    <Icon icon="mdi:lightning-bolt" width={46} color="#fff" />
                  </Box>
                </motion.div>

                <Typography sx={{ fontWeight: 900, fontSize: { xs: "3rem", sm: "3.6rem" }, lineHeight: 1, color: "#fff", letterSpacing: "-0.02em", textShadow: "0 2px 20px rgba(250,204,21,0.85)" }}>
                  +{shown.amount}
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.24em", color: "rgba(253,224,71,0.92)", mt: 1.25 }}>
                  POINTS EARNED
                </Typography>
              </Box>
            </ElectricBorder>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
