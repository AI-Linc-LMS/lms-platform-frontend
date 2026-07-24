"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useXpCelebration } from "@/lib/xp/xpCelebration";

const HOLD_MS = 1500;
// Radial spark spokes (fixed angles => deterministic, SSR-safe).
const SPARKS = Array.from({ length: 12 }, (_, i) => (i * 360) / 12);

/**
 * Global Duolingo-style "+N XP" lightning burst. Store-driven (celebrateXp),
 * mounted once in app/layout so any earn can fire it from anywhere. Non-blocking
 * (pointer-events: none) and self-dismissing.
 */
export function XpCelebrationOverlay() {
  const { amount, token } = useXpCelebration();
  const [shown, setShown] = useState<{ amount: number; token: number } | null>(null);

  useEffect(() => {
    if (token === 0 || amount <= 0) return;
    setShown({ amount, token });
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
          transition={{ duration: 0.2 }}
          style={{ position: "fixed", inset: 0, zIndex: 2300, pointerEvents: "none" }}
          aria-hidden
        >
          {/* ambient glow */}
          <motion.div
            initial={{ scale: 0.2, opacity: 0.85 }}
            animate={{ scale: [0.2, 1.7, 1.4], opacity: [0.85, 0.45, 0] }}
            transition={{ duration: 0.95, ease: "easeOut" }}
            style={{
              position: "absolute", left: "50%", top: "50%", marginLeft: -150, marginTop: -150,
              width: 300, height: 300, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(250,204,21,0.55) 0%, rgba(168,85,247,0.28) 45%, transparent 70%)",
            }}
          />
          {/* white flash */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0.75 }}
            animate={{ scale: 1.3, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{
              position: "absolute", left: "50%", top: "50%", marginLeft: -95, marginTop: -95,
              width: 190, height: 190, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.9), transparent 60%)",
            }}
          />
          {/* radial sparks (opacity-only anim so the static radial transform holds) */}
          {SPARKS.map((deg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.55, delay: 0.05 + (i % 4) * 0.03, ease: "easeOut" }}
              style={{
                position: "absolute", left: "50%", top: "50%",
                width: 3, height: 44, borderRadius: 2,
                background: "linear-gradient(#fef08a, #f59e0b)",
                transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-66px)`,
                transformOrigin: "center",
              }}
            />
          ))}
          {/* bolt + XP (centered via framer x/y -50% so scale/rotate compose cleanly) */}
          <motion.div
            initial={{ scale: 0, rotate: -22, opacity: 0 }}
            animate={{ scale: [0, 1.25, 1], rotate: [-22, 8, 0], opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 15 }}
            style={{
              position: "absolute", left: "50%", top: "50%", x: "-50%", y: "-50%",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            }}
          >
            <Box
              sx={{
                width: 96, height: 96, borderRadius: "30%", display: "grid", placeItems: "center",
                background: "linear-gradient(135deg, #fde047 0%, #f59e0b 100%)",
                boxShadow: "0 14px 34px -8px rgba(245,158,11,0.75), 0 0 0 7px rgba(250,204,21,0.16)",
              }}
            >
              <Icon icon="mdi:lightning-bolt" width={56} color="#fff" />
            </Box>
            <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.12 }}>
              <Typography
                sx={{
                  fontWeight: 900, fontSize: "1.85rem", color: "#fff", letterSpacing: "-0.02em",
                  textShadow: "0 2px 12px rgba(245,158,11,0.85)",
                }}
              >
                +{shown.amount} XP
              </Typography>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
