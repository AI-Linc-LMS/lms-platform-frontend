"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X, Award, ChevronRight } from "lucide-react";
import { GlassCard, SectionHeader, BadgeChip, EmptyState, LevelUpToast } from "@/components/scorecard/primitives";
import type { BadgeTier } from "@/components/scorecard/primitives";
import { fadeInUp, staggerContainer, celebrationBurst } from "@/lib/motion/scorecard-presets";
import { scorecardService } from "@/lib/services/scorecard.service";
import type { Badges, BadgeEntry } from "@/lib/types/scorecard.types";

interface BadgeTrophyCaseProps {
  initial?: Badges;
}

const LAST_SEEN_KEY = "sc:last-seen-badge-codes";

function getLastSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(LAST_SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function storeLastSeen(codes: Set<string>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_SEEN_KEY, JSON.stringify([...codes]));
}

export function BadgeTrophyCase({ initial }: BadgeTrophyCaseProps) {
  const badges = initial;
  const [activeBadge, setActiveBadge] = useState<BadgeEntry | null>(null);
  const [dismissedUnlockCodes, setDismissedUnlockCodes] = useState<Set<string>>(() => new Set());

  const unlockToast = useMemo<BadgeEntry | null>(() => {
    if (!badges) return null;
    const lastSeen = getLastSeen();
    return badges.earned.find((b) => !lastSeen.has(b.code) && !dismissedUnlockCodes.has(b.code)) ?? null;
  }, [badges, dismissedUnlockCodes]);

  // Persist the seen-set whenever badges change. Idempotent write.
  useEffect(() => {
    if (!badges) return;
    storeLastSeen(new Set(badges.earned.map((b) => b.code)));
  }, [badges]);

  const handleSeen = useCallback(async () => {
    if (!unlockToast) return;
    const code = unlockToast.code;
    setDismissedUnlockCodes((prev) => {
      const next = new Set(prev);
      next.add(code);
      return next;
    });
    if (!unlockToast.awardId) return;
    try {
      await scorecardService.markBadgeSeen(unlockToast.awardId);
    } catch {
      /* swallow */
    }
  }, [unlockToast]);

  const grid = useMemo(() => badges?.all ?? [], [badges]);

  if (!badges || grid.length === 0) {
    return (
      <EmptyState
        icon={<Trophy size={20} />}
        title="Badges await"
        description="Take quizzes, learn daily, and complete content to start unlocking badges."
      />
    );
  }

  return (
    <>
      <LevelUpToast
        open={Boolean(unlockToast)}
        title={unlockToast ? `New badge unlocked: ${unlockToast.name}` : ""}
        description={unlockToast?.description}
        onDismiss={handleSeen}
      />
      <motion.div variants={fadeInUp} initial="initial" animate="animate">
        <GlassCard padding="lg" radius="lg">
          <SectionHeader
            eyebrow="Trophy case"
            title={`${badges.totalEarned} of ${badges.totalActive} unlocked`}
            subtitle="Tap a locked badge to see what unlocks it."
            size="md"
            cta={
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: "var(--sc-gradient-gold)",
                  color: "var(--sc-text-inverted)",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <Award size={14} />
                {badges.totalEarned}
              </span>
            }
          />
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 12,
            }}
          >
            {grid.map((b) => (
              <motion.div key={b.code} variants={fadeInUp}>
                <BadgeTile badge={b} onClick={() => setActiveBadge(b)} />
              </motion.div>
            ))}
          </motion.div>
        </GlassCard>
      </motion.div>

      <AnimatePresence>
        {activeBadge ? (
          <BadgeModal badge={activeBadge} onClose={() => setActiveBadge(null)} />
        ) : null}
      </AnimatePresence>
    </>
  );
}

function BadgeTile({ badge, onClick }: { badge: BadgeEntry; onClick: () => void }) {
  const tier = badge.tier as BadgeTier;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "relative",
        all: "unset",
        cursor: "pointer",
        padding: 14,
        borderRadius: "var(--sc-radius-md)",
        background: badge.earned ? "var(--sc-bg-elevated)" : "var(--sc-bg-overlay)",
        border: `1px solid ${badge.earned ? "var(--sc-border-strong)" : "var(--sc-border-subtle)"}`,
        boxShadow: badge.earned ? "var(--sc-shadow-soft)" : "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        textAlign: "center",
        transition: "transform 150ms ease, border-color 150ms ease",
        opacity: badge.earned ? 1 : 0.85,
      }}
      aria-label={`${badge.name} — ${badge.earned ? "earned" : "locked"}`}
    >
      <motion.div
        variants={badge.earned ? celebrationBurst : undefined}
        initial={badge.earned ? "initial" : false}
        animate={badge.earned ? "animate" : undefined}
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: badge.earned ? "var(--sc-gradient-gold)" : "var(--sc-bg-elevated)",
          filter: badge.earned ? "none" : "grayscale(1)",
          color: badge.earned ? "var(--sc-text-inverted)" : "var(--sc-text-muted)",
        }}
      >
        <Trophy size={24} />
      </motion.div>
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--sc-text-primary)", lineHeight: 1.25 }}>{badge.name}</span>
      <BadgeChip tier={tier} label={badge.tier.toUpperCase()} earned={badge.earned} progress={badge.earned ? undefined : badge.progress} size="sm" />
    </button>
  );
}

function BadgeModal({ badge, onClose }: { badge: BadgeEntry; onClose: () => void }) {
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        zIndex: 1200,
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 22 } }}
        exit={{ scale: 0.96, opacity: 0, transition: { duration: 0.18 } }}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 420,
          width: "100%",
          padding: 28,
          borderRadius: "var(--sc-radius-xl)",
          background: "var(--sc-bg-elevated)",
          border: "1px solid var(--sc-border-strong)",
          boxShadow: "var(--sc-shadow-elevated)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            alignSelf: "flex-end",
            width: 28,
            height: 28,
            borderRadius: 999,
            border: "1px solid var(--sc-border-subtle)",
            background: "transparent",
            color: "var(--sc-text-muted)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={14} />
        </button>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: badge.earned ? "var(--sc-gradient-gold)" : "var(--sc-bg-overlay)",
              color: badge.earned ? "var(--sc-text-inverted)" : "var(--sc-text-muted)",
              filter: badge.earned ? "none" : "grayscale(1)",
            }}
          >
            <Trophy size={40} />
          </div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--sc-text-primary)" }}>{badge.name}</h3>
          <span style={{ fontSize: 12, color: "var(--sc-text-muted)", textAlign: "center" }}>{badge.description}</span>
          <BadgeChip tier={badge.tier as BadgeTier} label={badge.tier.toUpperCase()} earned={badge.earned} size="md" />
          {badge.earned ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--sc-accent-success)", fontSize: 12, fontWeight: 700 }}>
              <ChevronRight size={14} /> Unlocked
            </span>
          ) : (
            <span style={{ fontSize: 12, color: "var(--sc-text-secondary)", textAlign: "center" }}>
              Progress · <strong style={{ color: "var(--sc-text-primary)" }}>{Math.round(badge.progress * 100)}%</strong>
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
