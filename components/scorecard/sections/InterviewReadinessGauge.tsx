"use client";

import { useState } from "react";
import { Briefcase, Brain, Code2, Mic, ShieldCheck, ChevronRight, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard, RingMeter, SectionHeader, EmptyState } from "@/components/scorecard/primitives";
import { fadeInUp } from "@/lib/motion/scorecard-presets";
import type { InterviewReadiness, ReadinessLevel } from "@/lib/types/scorecard.types";

interface InterviewReadinessGaugeProps {
  data?: InterviewReadiness;
}

const LEVEL_LABEL: Record<ReadinessLevel, { label: string; color: string }> = {
  interview_ready: { label: "Interview Ready", color: "var(--sc-accent-gold)" },
  advanced: { label: "Advanced", color: "var(--sc-accent-platinum)" },
  intermediate: { label: "Intermediate", color: "var(--sc-accent-primary)" },
  foundation: { label: "Building Foundation", color: "var(--sc-text-muted)" },
};

export function InterviewReadinessGauge({ data }: InterviewReadinessGaugeProps) {
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null);

  if (!data) {
    return (
      <EmptyState
        icon={<Briefcase size={20} />}
        title="Career readiness coming soon"
        description="Once you've attempted at least one mock interview or assessment, we'll grade how prepared you are for common roles."
      />
    );
  }

  const level = LEVEL_LABEL[data.level];
  const activeRole = data.roles.find((r) => r.id === activeRoleId) ?? data.roles[0];
  const ringGradient: "primary" | "gold" = data.level === "interview_ready" || data.level === "advanced" ? "gold" : "primary";

  return (
    <motion.div variants={fadeInUp} initial="initial" animate="animate">
      <GlassCard padding="lg" radius="lg" glow={data.level === "interview_ready" ? "gold" : "none"}>
        <SectionHeader
          eyebrow="Career"
          title="Interview readiness"
          subtitle="Composite of mocks, coding, assessments, and your overall skill profile."
          size="md"
        />
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, alignItems: "center" }}>
          {/* Hero score + level pill */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <RingMeter
              value={data.score}
              max={100}
              size={148}
              strokeWidth={12}
              gradient={ringGradient}
              showValue
            />
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 999,
                background: "color-mix(in oklab, " + level.color + " 14%, transparent)",
                color: level.color,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              <ShieldCheck size={14} /> {level.label}
            </span>
          </div>

          {/* Components + role roster */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
              <Component icon={<Mic size={14} />} label="Mocks" value={data.components.mockInterviewAvg} />
              <Component icon={<Code2 size={14} />} label="Coding" value={data.components.codingCompletionPct} />
              <Component icon={<Brain size={14} />} label="Assessments" value={data.components.assessmentAvg} />
              <Component icon={<ShieldCheck size={14} />} label="Skill avg" value={data.components.skillAvg} />
            </div>

            {data.roles.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--sc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Match against roles
                </span>
                <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
                  {data.roles.map((r) => {
                    const selected = r.id === activeRole?.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setActiveRoleId(r.id)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 999,
                          border: "1px solid",
                          borderColor: selected ? "var(--sc-accent-primary)" : "var(--sc-border-subtle)",
                          background: selected ? "color-mix(in oklab, var(--sc-accent-primary) 14%, transparent)" : "var(--sc-bg-elevated)",
                          color: selected ? "var(--sc-accent-primary)" : "var(--sc-text-secondary)",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {r.name} · {Math.round(r.readinessPct)}%
                      </button>
                    );
                  })}
                </div>
                {activeRole ? <RolePanel role={activeRole} /> : null}
              </div>
            ) : null}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function Component({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: "var(--sc-radius-md)",
        border: "1px solid var(--sc-border-subtle)",
        background: "var(--sc-bg-overlay)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--sc-text-muted)", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
        {icon}
        {label}
      </span>
      <span style={{ fontSize: 18, fontWeight: 700, color: "var(--sc-text-primary)", fontFamily: '"SF Mono", ui-monospace, Menlo, monospace' }}>
        {Math.round(value)}%
      </span>
    </div>
  );
}

function RolePanel({ role }: { role: { name: string; readinessPct: number; minScore: number; missingSkills: string[] } }) {
  const eligible = role.readinessPct >= role.minScore;
  return (
    <div
      style={{
        padding: 12,
        borderRadius: "var(--sc-radius-md)",
        background: eligible
          ? "color-mix(in oklab, var(--sc-accent-success) 8%, var(--sc-bg-elevated))"
          : "var(--sc-bg-overlay)",
        border: "1px solid var(--sc-border-subtle)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--sc-text-primary)" }}>{role.name}</span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
            fontWeight: 600,
            color: eligible ? "var(--sc-accent-success)" : "var(--sc-text-muted)",
          }}
        >
          {eligible ? <ChevronRight size={14} /> : <Lock size={12} />}
          {eligible ? "Eligible" : `Threshold ${role.minScore}%`}
        </span>
      </div>
      {role.missingSkills.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, color: "var(--sc-text-muted)", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
            Strengthen
          </span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {role.missingSkills.map((s) => (
              <span
                key={s}
                style={{
                  display: "inline-block",
                  padding: "3px 9px",
                  borderRadius: 999,
                  background: "color-mix(in oklab, var(--sc-accent-warning) 14%, transparent)",
                  color: "var(--sc-accent-warning)",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
