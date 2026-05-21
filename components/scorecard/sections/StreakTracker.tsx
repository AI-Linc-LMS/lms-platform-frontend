"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Snowflake, Flame, AlertCircle } from "lucide-react";
import { GlassCard, SectionHeader, StreakFlame, EmptyState } from "@/components/scorecard/primitives";
import { fadeInUp } from "@/lib/motion/scorecard-presets";
import { scorecardService } from "@/lib/services/scorecard.service";
import type { StreakSnapshot } from "@/lib/types/scorecard.types";

interface StreakTrackerProps {
  initial?: StreakSnapshot;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildLast14Days(streak: StreakSnapshot): { date: string; active: boolean }[] {
  const out: { date: string; active: boolean }[] = [];
  const lastActive = streak.lastActiveDate;
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    // Heuristic: if lastActiveDate is today and streak is N, the last N days are active.
    let active = false;
    if (lastActive && streak.currentStreak > 0) {
      const last = new Date(lastActive + "T00:00:00");
      const diff = Math.floor((last.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      active = diff >= 0 && diff < streak.currentStreak;
    }
    out.push({ date: iso, active });
  }
  return out;
}

export function StreakTracker({ initial }: StreakTrackerProps) {
  const [streak, setStreak] = useState<StreakSnapshot | undefined>(initial);
  const [error, setError] = useState<string | null>(null);
  const [freezing, setFreezing] = useState(false);

  const handleFreeze = useCallback(async () => {
    if (!streak || streak.freezeCount <= 0) return;
    setFreezing(true);
    setError(null);
    try {
      const updated = await scorecardService.useStreakFreeze();
      setStreak(updated);
    } catch (e) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? "Couldn't apply freeze.");
    } finally {
      setFreezing(false);
    }
  }, [streak]);

  if (!streak) {
    return (
      <EmptyState
        icon={<Flame size={20} />}
        title="Build your first streak"
        description="Learn one day in a row and your streak will start showing here."
      />
    );
  }

  const days = buildLast14Days(streak);

  return (
    <motion.div variants={fadeInUp} initial="initial" animate="animate">
      <GlassCard padding="lg" radius="lg" glow={streak.currentStreak >= 7 ? "streak" : "none"}>
        <SectionHeader
          eyebrow="Habit"
          title="Your streak"
          subtitle="Active days in a row. Missed days consume a freeze charge automatically."
          size="md"
        />
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 20, alignItems: "center" }}>
          <StreakFlame days={streak.currentStreak} longest={streak.longestStreak} frozenToday={streak.frozenToday} size="lg" />

          <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--sc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Last 14 days
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(14, 1fr)", gap: 4 }}>
              {days.map((d) => {
                const isToday = d.date === todayKey();
                return (
                  <div
                    key={d.date}
                    title={`${d.date}${d.active ? " · active" : ""}`}
                    style={{
                      aspectRatio: "1 / 1",
                      borderRadius: 6,
                      background: d.active
                        ? "var(--sc-gradient-streak)"
                        : "var(--sc-bg-overlay)",
                      border: isToday ? "2px solid var(--sc-accent-primary)" : "1px solid var(--sc-border-subtle)",
                      transition: "transform 150ms ease",
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch", minWidth: 160 }}>
            <FreezeCounter count={streak.freezeCount} />
            <button
              type="button"
              onClick={handleFreeze}
              disabled={streak.freezeCount <= 0 || freezing}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid var(--sc-accent-platinum)",
                background: streak.freezeCount > 0
                  ? "color-mix(in oklab, var(--sc-accent-platinum) 14%, transparent)"
                  : "var(--sc-bg-overlay)",
                color: streak.freezeCount > 0 ? "var(--sc-accent-platinum)" : "var(--sc-text-muted)",
                fontSize: 12,
                fontWeight: 700,
                cursor: streak.freezeCount > 0 && !freezing ? "pointer" : "not-allowed",
                opacity: streak.freezeCount > 0 ? 1 : 0.6,
              }}
            >
              <Snowflake size={14} />
              Use freeze
            </button>
          </div>
        </div>
        {error ? (
          <div role="alert" style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, color: "var(--sc-accent-danger)", fontSize: 12 }}>
            <AlertCircle size={14} />
            {error}
          </div>
        ) : null}
      </GlassCard>
    </motion.div>
  );
}

function FreezeCounter({ count }: { count: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        borderRadius: "var(--sc-radius-sm)",
        border: "1px solid var(--sc-border-subtle)",
        background: "var(--sc-bg-overlay)",
      }}
    >
      <span style={{ fontSize: 11, color: "var(--sc-text-muted)", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
        Freezes left
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14, fontWeight: 700, color: "var(--sc-text-primary)" }}>
        <Snowflake size={14} color="var(--sc-accent-platinum)" />
        {count}
      </span>
    </div>
  );
}
