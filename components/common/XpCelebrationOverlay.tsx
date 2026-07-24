"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import ElectricBorder from "@/components/common/ElectricBorder";
import { useXpCelebration } from "@/lib/xp/xpCelebration";
import { playXpSound } from "@/lib/xp/xpSound";

const HOLD_MS = 2600;
const CHIP_LAND = 0.5; // s - when the +delta chip merges into the total (synced to the sound's arpeggio peak)
const COUNT_DURATION = 0.95; // s - the total ticks old -> new
const SPARKS = Array.from({ length: 14 }, (_, i) => (i * 360) / 14);
const MONO = '"JetBrains Mono","SFMono-Regular",ui-monospace,monospace';

/**
 * The hero total that counts oldTotal -> newTotal the moment the +delta chip lands.
 * Keyed by `token` so each celebration restarts cleanly. Snaps to newTotal for
 * reduced-motion or when there is nothing to count.
 */
function useTotalCountUp(oldTotal: number, newTotal: number, token: number, reduce: boolean | null) {
  const [display, setDisplay] = useState<number>(oldTotal);
  useEffect(() => {
    setDisplay(oldTotal);
    if (reduce || newTotal <= oldTotal) {
      setDisplay(newTotal);
      return;
    }
    const controls = animate(oldTotal, newTotal, {
      duration: COUNT_DURATION,
      delay: CHIP_LAND,
      ease: [0.22, 1, 0.36, 1], // easeOutExpo - fast then settle, Duolingo-style
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  return display;
}

/**
 * "Level-Up Total" card: the learner's running TOTAL is the hero and it counts
 * old -> new; the +delta flies in as a gold chip, lands, and visibly (and audibly)
 * feeds the tally with a charge-underline flash + spark burst. Wrapped in the SVG
 * ElectricBorder for a clean lightning edge (no canvas/rAF, no scribbles).
 */
function LevelUpTotalCard({
  oldTotal,
  newTotal,
  amount,
  token,
}: {
  oldTotal: number;
  newTotal: number;
  amount: number;
  token: number;
}) {
  const reduce = useReducedMotion();
  const display = useTotalCountUp(oldTotal, newTotal, token, reduce);
  const formatted = useMemo(() => display.toLocaleString(), [display]);

  return (
    <motion.div
      initial={{ scale: 0.4, y: 22, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 18 }}
      style={{ position: "relative" }}
    >
      <ElectricBorder color="#fde047" speed={1.3} chaos={9} borderRadius={30} style={{ borderRadius: 30 }}>
        <Box
          sx={{
            position: "relative",
            borderRadius: "30px",
            overflow: "visible", // let the spark burst bleed past the card edge
            px: { xs: 4, sm: 6 },
            py: { xs: 3.5, sm: 4.5 },
            textAlign: "center",
            minWidth: { xs: 244, sm: 312 },
            background: "radial-gradient(130% 120% at 50% 0%, #2a1150 0%, #14061f 55%, #0f0518 100%)",
            boxShadow: "inset 0 0 34px rgba(124,58,237,0.24)",
          }}
        >
          {/* CREST: gold medallion with a crown peeking above + a lightning bolt */}
          <motion.div
            initial={{ scale: 0, y: -6, rotate: -12 }}
            animate={{ scale: reduce ? 1 : [0, 1.18, 1], y: 0, rotate: reduce ? 0 : [-12, 6, 0] }}
            transition={{ type: "spring", stiffness: 360, damping: 15, delay: 0.06 }}
            style={{ display: "inline-flex", marginBottom: 8 }}
          >
            <Box
              sx={{
                position: "relative",
                width: 66,
                height: 66,
                borderRadius: "24%",
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(135deg,#fde047,#f59e0b)",
                boxShadow: "0 14px 38px -10px rgba(245,158,11,0.9), inset 0 2px 6px rgba(255,255,255,0.55)",
              }}
            >
              <Icon
                icon="mdi:crown"
                width={22}
                color="#fff"
                style={{ position: "absolute", top: -14, filter: "drop-shadow(0 2px 4px rgba(245,158,11,0.85))" }}
              />
              <Icon icon="mdi:lightning-bolt" width={38} color="#fff" />
            </Box>
          </motion.div>

          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "0.72rem",
              letterSpacing: "0.26em",
              color: "rgba(168,85,247,0.9)",
              mb: 0.75,
            }}
          >
            TOTAL POINTS
          </Typography>

          {/* HERO TOTAL (counts old -> new) + the +delta chip + charge flash + sparks */}
          <Box sx={{ position: "relative", display: "inline-block" }}>
            <motion.div
              animate={{ scale: reduce ? 1 : [1, 1, 1.12, 1] }}
              transition={{ duration: 0.5, delay: CHIP_LAND, times: [0, 0.35, 0.6, 1], ease: "easeOut" }}
              style={{ display: "inline-block" }}
            >
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontWeight: 800,
                  lineHeight: 1,
                  fontSize: { xs: "3.1rem", sm: "3.8rem" },
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.02em",
                  minWidth: "5ch",
                  background: "linear-gradient(180deg,#fffdf5 0%,#fde047 55%,#f59e0b 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 3px 22px rgba(250,204,21,0.55))",
                }}
              >
                {formatted}
              </Typography>
            </motion.div>

            {/* charge-underline flash: the +delta "discharging" into the total at land */}
            {!reduce && (
              <motion.div
                initial={{ opacity: 0, scaleX: 0.2 }}
                animate={{ opacity: [0, 1, 0], scaleX: [0.2, 1, 1] }}
                transition={{ duration: 0.5, delay: CHIP_LAND, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  left: "8%",
                  right: "8%",
                  bottom: -6,
                  height: 3,
                  borderRadius: 2,
                  background: "linear-gradient(90deg, transparent, #fde047, #fff, #f59e0b, transparent)",
                  boxShadow: "0 0 18px rgba(250,204,21,0.9)",
                }}
              />
            )}

            {/* +delta chip: enters below-right, arcs up, flies INTO the total */}
            {!reduce && (
              <motion.div
                initial={{ opacity: 0, x: 54, y: 44, scale: 0.6 }}
                animate={{ opacity: [0, 1, 1, 0], x: [54, 40, 0, 0], y: [44, 30, -6, -18], scale: [0.6, 1, 1, 0.42] }}
                transition={{ duration: CHIP_LAND, times: [0, 0.35, 0.8, 1], ease: "easeInOut" }}
                style={{ position: "absolute", left: "50%", top: "50%", marginLeft: "-1.4rem", zIndex: 3 }}
              >
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.4,
                    px: 1.3,
                    py: 0.5,
                    borderRadius: 999,
                    background: "linear-gradient(135deg,#fde047,#f59e0b)",
                    boxShadow: "0 8px 24px -6px rgba(245,158,11,0.9)",
                    color: "#3b1d00",
                    fontWeight: 900,
                    fontSize: "0.95rem",
                  }}
                >
                  <Icon icon="mdi:lightning-bolt" width={15} />
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>+{amount}</span>
                </Box>
              </motion.div>
            )}

            {/* SPARK BURST at land */}
            {!reduce &&
              SPARKS.map((deg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.6, 1, 0.9] }}
                  transition={{ duration: 0.55, delay: CHIP_LAND + (i % 5) * 0.015, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: 3,
                    height: 40,
                    borderRadius: 2,
                    background: "linear-gradient(#fef9c3,#f59e0b)",
                    transform: `translate(-50%,-50%) rotate(${deg}deg) translateY(-92px)`,
                    transformOrigin: "center",
                  }}
                />
              ))}
          </Box>

          {/* PROGRESS SHIMMER (level-up "toward next tier" cue) */}
          <Box
            sx={{
              position: "relative",
              mt: 1.75,
              mx: "auto",
              width: 168,
              height: 6,
              borderRadius: 999,
              overflow: "hidden",
              background: "rgba(168,85,247,0.22)",
            }}
          >
            <motion.div
              initial={{ width: "42%" }}
              animate={{ width: "68%" }}
              transition={{ duration: COUNT_DURATION, delay: CHIP_LAND, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                borderRadius: 999,
                background: "linear-gradient(90deg,#a855f7,#fde047)",
              }}
            />
            {!reduce && (
              <motion.div
                initial={{ x: "-120%" }}
                animate={{ x: "120%" }}
                transition={{ duration: 1.1, delay: CHIP_LAND, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(90deg, transparent, rgba(253,224,71,0.95), transparent)",
                }}
              />
            )}
          </Box>
        </Box>
      </ElectricBorder>
    </motion.div>
  );
}

/**
 * Global Duolingo-style level-up celebration: the learner's TOTAL points count up
 * old -> new as the +delta feeds it, wrapped in a clean SVG ElectricBorder, with a
 * layered "accomplishment" chime. Store-driven (celebrateXp), mounted once in
 * app/layout, non-blocking (pointerEvents:none), self-dismissing.
 */
export function XpCelebrationOverlay() {
  const { amount, oldTotal, newTotal, token } = useXpCelebration();
  const [shown, setShown] = useState<{ amount: number; oldTotal: number; newTotal: number; token: number } | null>(
    null,
  );

  useEffect(() => {
    if (token === 0 || amount <= 0) return;
    setShown({ amount, oldTotal, newTotal, token });
    playXpSound();
    const t = setTimeout(() => setShown(null), HOLD_MS);
    return () => clearTimeout(t);
  }, [token, amount, oldTotal, newTotal]);

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          key={shown.token}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2300,
            pointerEvents: "none",
            display: "grid",
            placeItems: "center",
          }}
          aria-hidden
        >
          {/* soft backdrop dim to make the card pop */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 50% 45%, rgba(20,6,31,0.5), rgba(10,4,20,0.16) 55%, transparent 72%)",
            }}
          />

          {/* one ambient glow pulse */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0.8 }}
            animate={{ scale: [0.3, 1.8, 1.5], opacity: [0.8, 0.4, 0] }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              marginLeft: -190,
              marginTop: -190,
              width: 380,
              height: 380,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(250,204,21,0.5) 0%, rgba(168,85,247,0.28) 45%, transparent 70%)",
            }}
          />

          <LevelUpTotalCard
            oldTotal={shown.oldTotal}
            newTotal={shown.newTotal}
            amount={shown.amount}
            token={shown.token}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
