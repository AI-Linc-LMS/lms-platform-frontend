"use client";

import { useMemo } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus, Sparkles, Target } from "lucide-react";
import { GlassCard, SectionHeader, EmptyState } from "@/components/scorecard/primitives";
import type { SkillEntry, SkillProficiency } from "@/lib/types/scorecard.types";

interface SkillRadarChartProps {
  data?: SkillProficiency;
}

const MAX_AXES = 8;

function pickRadarSkills(skills: SkillEntry[]): SkillEntry[] {
  if (skills.length <= MAX_AXES) return skills;
  // Mix top and weak so the radar shape feels truthful (avoid all-high cherry-picking).
  const sorted = [...skills].sort((a, b) => b.proficiency - a.proficiency);
  const top = sorted.slice(0, Math.ceil(MAX_AXES / 2));
  const bottom = sorted.slice(-Math.floor(MAX_AXES / 2));
  return [...top, ...bottom];
}

function TrendIcon({ trend }: { trend: SkillEntry["trend"] }) {
  if (trend === "up") return <TrendingUp size={12} color="var(--sc-accent-success)" />;
  if (trend === "down") return <TrendingDown size={12} color="var(--sc-accent-danger)" />;
  return <Minus size={12} color="var(--sc-text-muted)" />;
}

export function SkillRadarChart({ data }: SkillRadarChartProps) {
  const radarSkills = useMemo(() => pickRadarSkills(data?.skills ?? []), [data]);
  const chartData = radarSkills.map((s) => ({ name: shortName(s.name), proficiency: s.proficiency }));

  if (!data || data.skills.length === 0) {
    return (
      <EmptyState
        icon={<Target size={20} />}
        title="Skills will appear once you start learning"
        description="As you complete content and attempt quizzes, we'll group your performance by module to show strengths and growth areas."
      />
    );
  }

  return (
    <GlassCard padding="lg" radius="lg">
      <SectionHeader
        eyebrow="Skills"
        title="Where you stand"
        subtitle="Proficiency by module. Weak areas are highlighted on the right."
        size="md"
      />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 1fr) minmax(220px, 320px)", gap: 16 }}>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} margin={{ top: 12, right: 24, bottom: 12, left: 24 }}>
              <defs>
                <linearGradient id="sc-radar-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--sc-accent-primary)" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="var(--sc-accent-platinum)" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <PolarGrid stroke="var(--sc-border-subtle)" />
              <PolarAngleAxis dataKey="name" tick={{ fill: "var(--sc-text-secondary)", fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                dataKey="proficiency"
                stroke="var(--sc-accent-primary)"
                fill="url(#sc-radar-grad)"
                fillOpacity={0.6}
                isAnimationActive
                animationDuration={900}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <SkillList title="Top strengths" icon={<Sparkles size={14} />} skills={data.top3} accent="var(--sc-accent-success)" />
          <SkillList title="Focus areas" icon={<Target size={14} />} skills={data.weak3} accent="var(--sc-accent-warning)" />
        </div>
      </div>
    </GlassCard>
  );
}

function SkillList({ title, icon, skills, accent }: { title: string; icon: React.ReactNode; skills: SkillEntry[]; accent: string }) {
  if (skills.length === 0) {
    return (
      <div
        style={{
          padding: 12,
          borderRadius: "var(--sc-radius-md)",
          background: "var(--sc-bg-overlay)",
          border: "1px solid var(--sc-border-subtle)",
          color: "var(--sc-text-muted)",
          fontSize: 12,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: accent, fontWeight: 700, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {icon}
          {title}
        </span>
        <div style={{ marginTop: 6 }}>Not enough data yet.</div>
      </div>
    );
  }
  return (
    <div
      style={{
        padding: 12,
        borderRadius: "var(--sc-radius-md)",
        background: "var(--sc-bg-overlay)",
        border: "1px solid var(--sc-border-subtle)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: accent, fontWeight: 700, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {icon}
        {title}
      </span>
      {skills.map((s) => (
        <div key={s.moduleId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--sc-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--sc-text-muted)", fontFamily: '"SF Mono", ui-monospace, Menlo, monospace' }}>
            <TrendIcon trend={s.trend} />
            {Math.round(s.proficiency)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function shortName(name: string): string {
  if (name.length <= 16) return name;
  return name.slice(0, 14) + "…";
}
