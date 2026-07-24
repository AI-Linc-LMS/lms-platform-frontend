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
  const [flyFrom, setFlyFrom] = useState<{ x: number; y: number } | null>(null);
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

  // Rising embers around the flame - the "fire" feel.
  const embers = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 120,
        rise: 90 + Math.random() * 90,
        size: 4 + Math.random() * 5,
        delay: Math.random() * 1.1,
        duration: 1.1 + Math.random() * 0.8,
        drift: (Math.random() - 0.5) * 40,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [celebrating, celebrateCount],
  );

  // Start the flame's flight to the nav (idempotent - also used by tap-to-skip).
  const startFly = useCallback(() => {
    if (flyingRef.current) return;
    flyingRef.current = true;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    // Start the flight from the flame disc's ACTUAL on-screen position (it sits
    // above screen-centre, being the top of the disc + number + text column) so
    // the flame doesn't visibly jump down to centre before flying. Read it while
    // the burst is still mounted (before we switch phase).
    const disc = typeof document !== "undefined" ? document.getElementById("streak-burst-flame") : null;
    if (disc) {
      const dr = disc.getBoundingClientRect();
      setFlyFrom({ x: dr.left + dr.width / 2, y: dr.top + dr.height / 2 });
    }
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
    if (!celebrating) { setPhase("idle"); setFlyTo(null); setFlyFrom(null); flyingRef.current = false; return; }
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
          <motion.div
            key="burst"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}
          >
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

            {/* Rising embers behind the flame */}
            {embers.map((e) => (
              <motion.div
                key={`ember-${e.id}`}
                initial={{ x: e.x, y: 20, opacity: 0, scale: 1 }}
                animate={{ x: e.x + e.drift, y: -e.rise, opacity: [0, 1, 0], scale: 0.4 }}
                transition={{ duration: e.duration, delay: e.delay, repeat: Infinity, ease: "easeOut" }}
                style={{
                  position: "absolute", left: "50%", top: "55%", zIndex: 1,
                  width: e.size, height: e.size, borderRadius: "50%",
                  background: "radial-gradient(circle, #fde68a, #f97316)",
                  boxShadow: "0 0 8px 2px rgba(249,115,22,0.45)",
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
                id="streak-burst-flame"
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
          </motion.div>
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

      {/* Flame flies to the nav streak chip (from the disc's real spot, so no
          jump), shrinking + fading out as it lands; then the nav ticks +1. */}
      {phase === "fly" && flyTo && (
        <motion.div
          initial={{ x: (flyFrom ?? { x: cx, y: cy }).x, y: (flyFrom ?? { x: cx, y: cy }).y, scale: 1.8, opacity: 1 }}
          animate={{ x: flyTo.x, y: flyTo.y, scale: 0.4, opacity: [1, 1, 0.7, 0] }}
          transition={{
            duration: 0.95,
            ease: [0.22, 1, 0.36, 1],
            opacity: { times: [0, 0.5, 0.82, 1], ease: "easeIn" },
          }}
          onAnimationComplete={onFlyComplete}
          style={{ position: "fixed", top: 0, left: 0, marginLeft: -28, marginTop: -28, fontSize: 56, zIndex: 3, filter: "drop-shadow(0 6px 16px rgba(249,115,22,0.6))" }}
        >
          🔥
        </motion.div>
      )}
    </Box>
  );
}
