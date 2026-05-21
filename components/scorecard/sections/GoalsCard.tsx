"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Clock, BookOpen, Pencil, X, Check } from "lucide-react";
import { GlassCard, RingMeter, SectionHeader, EmptyState } from "@/components/scorecard/primitives";
import { fadeInUp } from "@/lib/motion/scorecard-presets";
import { scorecardService } from "@/lib/services/scorecard.service";
import type { Goals } from "@/lib/types/scorecard.types";

interface GoalsCardProps {
  initial?: Goals;
}

export function GoalsCard({ initial }: GoalsCardProps) {
  const [goals, setGoals] = useState<Goals | undefined>(initial);
  const [editing, setEditing] = useState(false);

  const handleSave = useCallback(async (input: { targetMinutes: number; targetContentCount: number }) => {
    try {
      const updated = await scorecardService.setGoals(input);
      setGoals(updated);
      setEditing(false);
    } catch {
      /* swallow — UI keeps the editor open so the user can retry */
    }
  }, []);

  if (!goals) {
    return (
      <EmptyState
        icon={<Target size={20} />}
        title="Set this week's goal"
        description="Pick a weekly target for minutes learned and content completed. We'll track it as you go."
      />
    );
  }

  const week = goals.currentWeek;
  const hasTargets = week.targetMinutes > 0 || week.targetContentCount > 0;

  return (
    <motion.div variants={fadeInUp} initial="initial" animate="animate">
      <GlassCard padding="lg" radius="lg">
        <SectionHeader
          eyebrow="Goals"
          title="This week"
          subtitle={`Week starting ${week.weekStart}`}
          size="md"
          cta={
            <button
              type="button"
              onClick={() => setEditing(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid var(--sc-border-subtle)",
                background: "var(--sc-bg-elevated)",
                color: "var(--sc-text-secondary)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Pencil size={12} />
              {hasTargets ? "Edit" : "Set goal"}
            </button>
          }
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <GoalTile
            icon={<Clock size={16} />}
            label="Time"
            achieved={week.achievedMinutes}
            target={week.targetMinutes}
            unit="min"
            progress={week.minutesProgressPct}
          />
          <GoalTile
            icon={<BookOpen size={16} />}
            label="Content"
            achieved={week.achievedContentCount}
            target={week.targetContentCount}
            unit="items"
            progress={week.contentProgressPct}
          />
        </div>

        <AnimatePresence>
          {editing ? <EditModal week={week} onCancel={() => setEditing(false)} onSave={handleSave} /> : null}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}

function GoalTile({ icon, label, achieved, target, unit, progress }: { icon: React.ReactNode; label: string; achieved: number; target: number; unit: string; progress: number }) {
  const done = target > 0 && achieved >= target;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: "var(--sc-radius-md)",
        background: "var(--sc-bg-overlay)",
        border: "1px solid var(--sc-border-subtle)",
      }}
    >
      <RingMeter
        value={progress}
        max={100}
        size={72}
        strokeWidth={6}
        gradient={done ? "gold" : "primary"}
        showValue={false}
        centerSlot={
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--sc-text-primary)", fontFamily: '"SF Mono", ui-monospace, Menlo, monospace' }}>
            {progress}%
          </span>
        }
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--sc-text-muted)", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
          {icon}
          {label}
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--sc-text-primary)", fontFamily: '"SF Mono", ui-monospace, Menlo, monospace' }}>
          {achieved}
          <span style={{ color: "var(--sc-text-muted)", fontWeight: 500 }}>
            {" "}/ {target > 0 ? target : "—"} {unit}
          </span>
        </span>
        {done ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--sc-accent-success)", fontWeight: 700 }}>
            <Check size={12} /> Done
          </span>
        ) : null}
      </div>
    </div>
  );
}

function EditModal({ week, onCancel, onSave }: { week: { targetMinutes: number; targetContentCount: number }; onCancel: () => void; onSave: (input: { targetMinutes: number; targetContentCount: number }) => void }) {
  const [minutes, setMinutes] = useState(week.targetMinutes);
  const [count, setCount] = useState(week.targetContentCount);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
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
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--sc-text-primary)" }}>Set this week&apos;s goal</h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            style={{
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
        </header>

        <Slider label="Time (minutes)" min={0} max={1200} step={15} value={minutes} onChange={setMinutes} />
        <Slider label="Content items" min={0} max={50} step={1} value={count} onChange={setCount} />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "1px solid var(--sc-border-subtle)",
              background: "transparent",
              color: "var(--sc-text-secondary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave({ targetMinutes: minutes, targetContentCount: count })}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "1px solid var(--sc-accent-primary)",
              background: "var(--sc-accent-primary)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Save goal
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Slider({ label, min, max, step, value, onChange }: { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--sc-text-secondary)" }}>
        <span>{label}</span>
        <strong style={{ color: "var(--sc-text-primary)", fontFamily: '"SF Mono", ui-monospace, Menlo, monospace' }}>{value}</strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "var(--sc-accent-primary)" }}
      />
    </label>
  );
}
