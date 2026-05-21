"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Video, FileText, Code2, Mic, AlertTriangle } from "lucide-react";

import {
  GlassCard,
  RingMeter,
  StreakFlame,
  StatTile,
  SkeletonShimmer,
  ScorecardThemeProvider,
} from "@/components/scorecard/primitives";
import { fadeInUp, staggerContainer } from "@/lib/motion/scorecard-presets";
import { formatTimeSpent, scorecardService } from "@/lib/services/scorecard.service";
import type { LearningConsumption, PerformanceLevel } from "@/lib/types/scorecard.types";

interface DashboardSummary {
  overallScore: number;
  overallGrade: PerformanceLevel;
  totalTimeSpentSeconds: number;
  activeDaysStreak: number;
  completionPercentage: number;
  currentWeek: number;
  currentModule: string;
  learningConsumption: LearningConsumption;
  learningProgressPct: number;
}

const GRADE_TO_RING: Record<PerformanceLevel, "primary" | "gold"> = {
  "Interview-Ready": "gold",
  Advanced: "gold",
  Intermediate: "primary",
  Beginner: "primary",
};

const GRADE_TO_GLOW: Record<PerformanceLevel, "indigo" | "gold"> = {
  "Interview-Ready": "gold",
  Advanced: "gold",
  Intermediate: "indigo",
  Beginner: "indigo",
};

export function ScorecardWidget() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loadError, setLoadError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoadError(false);
    setLoading(true);
    try {
      const summary = await scorecardService.getDashboardSummary();
      setData(summary);
    } catch {
      setData(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <ScorecardThemeProvider>
        <div style={{ marginBottom: 24 }}>
          <GlassCard padding="lg" radius="xl">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <SkeletonShimmer height={28} width="40%" radius={8} />
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <SkeletonShimmer height={120} width={120} radius={999} />
                <div style={{ flex: 1 }}>
                  <SkeletonShimmer height={16} width="60%" radius={6} />
                  <div style={{ height: 8 }} />
                  <SkeletonShimmer height={12} radius={6} />
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </ScorecardThemeProvider>
    );
  }

  if (loadError || !data) {
    return (
      <ScorecardThemeProvider>
        <div style={{ marginBottom: 24 }}>
          <GlassCard padding="lg" radius="xl">
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--sc-text-muted)" }}>
              <AlertTriangle size={18} />
              <span style={{ fontSize: 13 }}>Couldn&apos;t load your scorecard right now.</span>
              <button
                type="button"
                onClick={fetchData}
                style={{
                  marginLeft: "auto",
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "1px solid var(--sc-border-subtle)",
                  background: "var(--sc-bg-elevated)",
                  color: "var(--sc-text-primary)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          </GlassCard>
        </div>
      </ScorecardThemeProvider>
    );
  }

  const ringGradient = GRADE_TO_RING[data.overallGrade] ?? "primary";
  const cardGlow = GRADE_TO_GLOW[data.overallGrade] ?? "indigo";
  const lc = data.learningConsumption;

  return (
    <ScorecardThemeProvider>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        style={{ marginBottom: 24 }}
      >
        <motion.div variants={fadeInUp}>
          <GlassCard padding="lg" radius="xl" glow={cardGlow}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: 24,
                alignItems: "center",
              }}
            >
              {/* Hero score ring */}
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <RingMeter
                  value={data.overallScore}
                  max={100}
                  size={132}
                  strokeWidth={11}
                  gradient={ringGradient}
                  label={data.overallGrade}
                  sublabel={`${data.completionPercentage}% complete`}
                />
                {data.activeDaysStreak > 0 ? (
                  <StreakFlame days={data.activeDaysStreak} size="sm" />
                ) : null}
              </div>

              {/* Stats + CTA */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sc-accent-primary)" }}>
                      Learning Scorecard
                    </span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "var(--sc-text-primary)", lineHeight: 1.25 }}>
                      {data.currentModule ? `Week ${data.currentWeek} · ${data.currentModule}` : "Keep going"}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--sc-text-muted)" }}>
                      {formatTimeSpent(data.totalTimeSpentSeconds)} learning · {data.learningProgressPct}% of content done
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/user/scorecard")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 14px",
                      borderRadius: 999,
                      border: "1px solid color-mix(in oklab, var(--sc-accent-primary) 35%, transparent)",
                      background: "color-mix(in oklab, var(--sc-accent-primary) 12%, transparent)",
                      color: "var(--sc-accent-primary)",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    View scorecard <ArrowRight size={14} />
                  </button>
                </div>

                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}
                >
                  <motion.div variants={fadeInUp}>
                    <StatTile icon={<Video size={14} />} label="Videos" value={`${lc.videos.completed}/${lc.videos.totalAssigned || 0}`} />
                  </motion.div>
                  <motion.div variants={fadeInUp}>
                    <StatTile icon={<FileText size={14} />} label="Articles" value={`${lc.articles.read}/${lc.articles.totalAssigned || 0}`} />
                  </motion.div>
                  <motion.div variants={fadeInUp}>
                    <StatTile icon={<Code2 size={14} />} label="Coding" value={`${lc.codingProblems.completed}/${lc.codingProblems.totalAssigned || 0}`} />
                  </motion.div>
                  <motion.div variants={fadeInUp}>
                    <StatTile icon={<Mic size={14} />} label="Mocks" value={`${lc.mockInterviews.completed}/${lc.mockInterviews.totalAssigned || 0}`} />
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </ScorecardThemeProvider>
  );
}
