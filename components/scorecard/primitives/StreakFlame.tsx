"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { Flame, Snowflake } from "lucide-react";
import { flameMorph } from "@/lib/motion/scorecard-presets";

interface StreakFlameProps {
  days: number;
  longest?: number;
  frozenToday?: boolean;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: { box: 36, icon: 18, font: 14 },
  md: { box: 56, icon: 28, font: 22 },
  lg: { box: 80, icon: 40, font: 30 },
};

export function StreakFlame({ days, longest, frozenToday = false, size = "md" }: StreakFlameProps) {
  const dims = SIZE_MAP[size];
  const prevDaysRef = useRef(days);
  const controls = useAnimationControls();

  useEffect(() => {
    if (days > prevDaysRef.current) {
      controls.start("animate").then(() => controls.set("initial"));
    }
    prevDaysRef.current = days;
  }, [days, controls]);

  const accent = frozenToday ? "var(--sc-accent-platinum)" : "var(--sc-accent-streak)";
  const glow = frozenToday ? "rgba(56, 189, 248, 0.45)" : "var(--sc-accent-streak-glow)";

  return (
    <div
      style={{ display: "inline-flex", alignItems: "center", gap: 10 }}
      aria-label={`${days}-day streak${frozenToday ? " (frozen)" : ""}`}
    >
      <motion.div
        variants={flameMorph}
        initial="initial"
        animate={controls}
        style={{
          width: dims.box,
          height: dims.box,
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: frozenToday
            ? "linear-gradient(180deg, rgba(56, 189, 248, 0.18), rgba(56, 189, 248, 0.05))"
            : "var(--sc-gradient-streak)",
          boxShadow: `0 0 0 1px ${accent}, 0 6px 20px ${glow}`,
          color: "#fff",
          flexShrink: 0,
        }}
      >
        <span className={!frozenToday && days > 0 ? "sc-flame-flicker" : undefined}>
          {frozenToday ? <Snowflake size={dims.icon} /> : <Flame size={dims.icon} />}
        </span>
      </motion.div>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
        <span
          style={{
            fontFamily: '"SF Mono", ui-monospace, Menlo, monospace',
            fontSize: dims.font,
            fontWeight: 700,
            color: "var(--sc-text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          {days}
        </span>
        <span style={{ fontSize: 11, color: "var(--sc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          day streak
          {typeof longest === "number" && longest > days ? ` · best ${longest}` : null}
        </span>
      </div>
    </div>
  );
}
