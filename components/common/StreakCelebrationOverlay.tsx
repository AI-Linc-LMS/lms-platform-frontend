"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Box, Typography } from "@mui/material";
import {
  commitNavBump,
  dismissCelebration,
  useStreakCelebration,
} from "@/lib/streak/streakCelebration";

const COLORS = ["#f59e0b", "#f97316", "#ef4444", "#fbbf24", "#fb7185", "#a855f7", "#34d399"];
const BURST_MS = 4200; // long enough to read the count + message; tap to skip early

type Phase = "idle" | "burst" | "fly";

export function StreakCelebrationOverlay() {
  const { celebrating, celebrateCount } = useStreakCelebration();
  const [phase, setPhase] = useState<Phase>("idle");
  const [flyTo, setFlyTo] = useState<{ x: number; y: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flyingRef = useRef(false);

  // Confetti pieces - regenerated each celebration.
  const confetti = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 40 + Math.random() * 0.4;
        const dist = 160 + Math.random() * 260;
        return {
          id: i,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist - 60,
          color: COLORS[i % COLORS.length],
          size: 7 + Math.random() * 9,
          rotate: Math.random() * 720 - 360,
          delay: Math.random() * 0.15,
          rounded: Math.random() > 0.5,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [celebrating, celebrateCount],
  );

  // Start the flame's flight to the nav (idempotent - also used by tap-to-skip).
  const startFly = useCallback(() => {
    if (flyingRef.current) return;
    flyingRef.current = true;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    const el = typeof document !== "undefined" ? document.getElementById("nav-streak-flame") : null;
    if (el) {
      const r = el.getBoundingClientRect();
      setFlyTo({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      setPhase("fly");
    } else {
      // No nav target (e.g. hidden on small screens) - just commit + close.
      commitNavBump();
      dismissCelebration();
    }
  }, []);

  useEffect(() => {
    if (!celebrating) { setPhase("idle"); setFlyTo(null); flyingRef.current = false; return; }
    flyingRef.current = false;
    setPhase("burst");
    timerRef.current = setTimeout(startFly, BURST_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [celebrating, startFly]);

  if (!celebrating) return null;

  const cx = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
  const cy = typeof window !== "undefined" ? window.innerHeight / 2 : 0;

  const onFlyComplete = () => {
    commitNavBump();
    setTimeout(() => dismissCelebration(), 200);
  };

  return (
    <Box
      onClick={phase === "burst" ? startFly : undefined}
      sx={{ position: "fixed", inset: 0, zIndex: 2200, pointerEvents: phase === "burst" ? "auto" : "none", cursor: phase === "burst" ? "pointer" : "default", overflow: "hidden" }}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "fly" ? 0 : 1 }}
        transition={{ duration: phase === "fly" ? 0.5 : 0.35 }}
        style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 50% 42%, rgba(120,53,15,0.55) 0%, rgba(15,23,42,0.82) 70%)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Center burst: confetti + flame + count */}
      <AnimatePresence>
        {phase === "burst" && (
          <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
            {/* Confetti */}
            {confetti.map((c) => (
              <motion.div
                key={c.id}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                animate={{ x: c.dx, y: c.dy, opacity: 0, rotate: c.rotate, scale: 0.6 }}
                transition={{ duration: 1.5, delay: c.delay, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  width: c.size, height: c.size,
                  background: c.color,
                  borderRadius: c.rounded ? "50%" : 2,
                }}
              />
            ))}

            <motion.div
              initial={{ scale: 0, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: "spring", stiffness: 220, damping: 16 }}
              style={{ textAlign: "center", position: "relative", zIndex: 2 }}
            >
              {/* Glowing flame disc */}
              <motion.div
                animate={{ boxShadow: [
                  "0 0 40px 8px rgba(245,158,11,0.5)",
                  "0 0 70px 18px rgba(249,115,22,0.7)",
                  "0 0 40px 8px rgba(245,158,11,0.5)",
                ] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: 132, height: 132, borderRadius: "50%", margin: "0 auto 20px",
                  display: "grid", placeItems: "center",
                  background: "radial-gradient(circle at 50% 35%, #fde68a 0%, #f59e0b 45%, #ea580c 100%)",
                  border: "4px solid rgba(255,255,255,0.9)",
                }}
              >
                <motion.span
                  animate={{ rotate: [0, 10, -10, 8, 0], scale: [1, 1.15, 1.05, 1.12, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  style={{ fontSize: 64, lineHeight: 1 }}
                >
                  🔥
                </motion.span>
              </motion.div>

              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 14 }}
              >
                <Typography sx={{ fontWeight: 900, fontSize: { xs: "3rem", sm: "4rem" }, color: "#fff", lineHeight: 1, textShadow: "0 4px 24px rgba(0,0,0,0.35)" }}>
                  {celebrateCount}
                </Typography>
              </motion.div>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.1rem", sm: "1.35rem" }, color: "#fde68a", mt: 0.5 }}>
                day streak{celebrateCount === 1 ? " started!" : "!"}
              </Typography>
              <Typography sx={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.82)", mt: 0.75 }}>
                You&apos;re on fire - keep it going 🚀
              </Typography>
            </motion.div>
          </Box>
        )}
      </AnimatePresence>

      {/* Tap-to-continue hint (the burst lingers ~4s; let the impatient skip ahead) */}
      {phase === "burst" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          style={{ position: "absolute", bottom: 44, left: 0, right: 0, textAlign: "center" }}
        >
          <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
            Tap anywhere to continue
          </Typography>
        </motion.div>
      )}

      {/* Flame flies to the nav streak chip, then the nav ticks +1 */}
      {phase === "fly" && flyTo && (
        <motion.div
          initial={{ x: cx, y: cy, scale: 2.2, opacity: 1 }}
          animate={{ x: flyTo.x, y: flyTo.y, scale: 0.45, opacity: 0.95 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          onAnimationComplete={onFlyComplete}
          style={{ position: "fixed", top: 0, left: 0, marginLeft: -28, marginTop: -28, fontSize: 56, zIndex: 3, filter: "drop-shadow(0 6px 16px rgba(249,115,22,0.6))" }}
        >
          🔥
        </motion.div>
      )}
    </Box>
  );
}
