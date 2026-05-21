"use client";

import { useState, useEffect, use } from "react";
import { Trophy, Sparkles, Flame, ShieldCheck, Briefcase } from "lucide-react";

import {
  GlassCard,
  RingMeter,
  StreakFlame,
  BadgeChip,
  SkeletonShimmer,
  ScorecardThemeProvider,
} from "@/components/scorecard/primitives";
import type { BadgeTier } from "@/components/scorecard/primitives";
import { scorecardService } from "@/lib/services/scorecard.service";

interface SharePayload {
  name: string;
  program_name: string;
  overall_score: number;
  overall_grade: string;
  completion_percentage: number;
  interview_readiness: { score: number; level: string };
  streak: { current: number; longest: number };
  earned_badges: Array<{ code: string; name: string; tier: string; icon: string }>;
  top_skills: Array<{ name: string; proficiency: number }>;
}

const LEVEL_LABEL: Record<string, string> = {
  interview_ready: "Interview Ready",
  advanced: "Advanced",
  intermediate: "Intermediate",
  foundation: "Building Foundation",
};

export default function PublicScorecardSharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<SharePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    scorecardService
      .getPublicScorecard(slug)
      .then((d) => {
        if (cancelled) return;
        setData(d as unknown as SharePayload);
      })
      .catch(() => {
        if (!cancelled) setError("This share link is no longer available.");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <ScorecardThemeProvider>
      <div
        style={{
          minHeight: "100vh",
          background: "var(--sc-bg-canvas)",
          padding: "48px clamp(16px, 4vw, 64px)",
        }}
      >
        <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
          <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                background: "var(--sc-gradient-hero)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <Trophy size={18} />
            </div>
            <div>
              <span style={{ fontSize: 11, color: "var(--sc-accent-primary)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                AI Linc · Learning Scorecard
              </span>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--sc-text-primary)" }}>
                Public scorecard
              </h1>
            </div>
          </header>

          {error ? (
            <GlassCard padding="lg" radius="lg">
              <p style={{ margin: 0, color: "var(--sc-text-muted)" }}>{error}</p>
            </GlassCard>
          ) : !data ? (
            <GlassCard padding="lg" radius="lg">
              <SkeletonShimmer lines={4} height={16} radius={6} />
            </GlassCard>
          ) : (
            <ShareContent data={data} />
          )}

          <footer style={{ fontSize: 11, color: "var(--sc-text-muted)", textAlign: "center" }}>
            This is a public learner summary. Email, contact, and full activity stay private.
          </footer>
        </div>
      </div>
    </ScorecardThemeProvider>
  );
}

function ShareContent({ data }: { data: SharePayload }) {
  const isReady = data.interview_readiness.level === "interview_ready" || data.interview_readiness.level === "advanced";

  return (
    <>
      <GlassCard padding="lg" radius="xl" glow={isReady ? "gold" : "indigo"}>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 24, alignItems: "center" }}>
          <RingMeter
            value={data.overall_score}
            max={100}
            size={140}
            strokeWidth={11}
            gradient={isReady ? "gold" : "primary"}
            label={data.overall_grade}
            sublabel={`${data.completion_percentage}% complete`}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 11, color: "var(--sc-accent-primary)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {data.program_name || "Learner"}
            </span>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "var(--sc-text-primary)", letterSpacing: "-0.02em" }}>
              {data.name}
            </h2>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 999,
                background: "color-mix(in oklab, var(--sc-accent-primary) 14%, transparent)",
                color: "var(--sc-accent-primary)",
                fontSize: 12,
                fontWeight: 700,
                width: "fit-content",
              }}
            >
              <ShieldCheck size={12} />
              {LEVEL_LABEL[data.interview_readiness.level] ?? data.interview_readiness.level}
              <span style={{ color: "var(--sc-text-muted)", fontWeight: 500 }}> · {data.interview_readiness.score}/100</span>
            </span>
          </div>
          {data.streak.current > 0 ? <StreakFlame days={data.streak.current} longest={data.streak.longest} size="md" /> : null}
        </div>
      </GlassCard>

      {data.earned_badges.length > 0 ? (
        <GlassCard padding="lg" radius="lg">
          <span style={{ fontSize: 11, color: "var(--sc-text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={12} />
            {data.earned_badges.length} badges earned
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {data.earned_badges.map((b) => (
              <BadgeChip key={b.code} tier={(b.tier as BadgeTier) ?? "bronze"} label={b.name} earned size="md" />
            ))}
          </div>
        </GlassCard>
      ) : null}

      {data.top_skills.length > 0 ? (
        <GlassCard padding="lg" radius="lg">
          <span style={{ fontSize: 11, color: "var(--sc-text-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Briefcase size={12} />
            Top skills
          </span>
          <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "flex", flexDirection: "column", gap: 8 }}>
            {data.top_skills.map((s) => (
              <li key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, background: "var(--sc-bg-overlay)" }}>
                <span style={{ fontSize: 13, color: "var(--sc-text-primary)" }}>{s.name}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--sc-text-secondary)", fontFamily: '"SF Mono", ui-monospace, Menlo, monospace', fontSize: 12 }}>
                  <Flame size={12} color="var(--sc-accent-warning)" />
                  {Math.round(s.proficiency)}%
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      ) : null}
    </>
  );
}
