"use client";

import { motion } from "framer-motion";
import { Video, FileText, Code2, Mic, Brain, BookOpen } from "lucide-react";
import { GlassCard, RingMeter, SectionHeader } from "@/components/scorecard/primitives";
import { fadeInUp, staggerContainer } from "@/lib/motion/scorecard-presets";
import type { LearningConsumption } from "@/lib/types/scorecard.types";

interface LearningConsumptionGridProps {
  data: LearningConsumption;
}

interface CardInput {
  key: string;
  label: string;
  icon: React.ReactNode;
  total: number;
  done: number;
  primaryStat?: string;
  secondaryStat?: string;
}

function pct(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

export function LearningConsumptionGrid({ data }: LearningConsumptionGridProps) {
  const cards: CardInput[] = [
    {
      key: "videos",
      label: "Videos",
      icon: <Video size={18} />,
      total: data.videos.totalAssigned,
      done: data.videos.completed,
      primaryStat: `${Math.round(data.videos.averageWatchPercentage)}% avg watch`,
      secondaryStat: data.videos.rewatchCount > 0 ? `${data.videos.rewatchCount} rewatches` : undefined,
    },
    {
      key: "articles",
      label: "Articles",
      icon: <FileText size={18} />,
      total: data.articles.totalAssigned,
      done: data.articles.read,
      primaryStat: `${Math.round(data.articles.averageReadingTime)}m avg read`,
    },
    {
      key: "coding",
      label: "Coding problems",
      icon: <Code2 size={18} />,
      total: data.codingProblems.totalAssigned,
      done: data.codingProblems.completed,
      primaryStat: `${data.codingProblems.submissionCount} submissions`,
    },
    {
      key: "mocks",
      label: "Mock interviews",
      icon: <Mic size={18} />,
      total: data.mockInterviews.totalAssigned,
      done: data.mockInterviews.completed,
      primaryStat:
        typeof data.mockInterviews.averageScore === "number"
          ? `${Math.round(data.mockInterviews.averageScore)} avg score`
          : `${data.mockInterviews.pendingCount} pending`,
    },
    {
      key: "mcqs",
      label: "MCQs",
      icon: <Brain size={18} />,
      total: data.practice.mcqsTotal,
      done: data.practice.mcqsAttempted,
      primaryStat: `${data.practice.subjectiveSubmitted} subjective done`,
      secondaryStat: data.practice.subjectivePending > 0 ? `${data.practice.subjectivePending} pending` : undefined,
    },
    {
      key: "assessments",
      label: "Assessments",
      icon: <BookOpen size={18} />,
      total: data.practice.totalAssessmentsPresent ?? data.practice.assessmentsAttempted + data.practice.assessmentsMissed,
      done: data.practice.assessmentsAttempted,
      primaryStat:
        typeof data.practice.assessmentsEngagementPercentage === "number"
          ? `${Math.round(data.practice.assessmentsEngagementPercentage)}% engagement`
          : data.practice.assessmentsMissed > 0
            ? `${data.practice.assessmentsMissed} missed`
            : undefined,
    },
  ];

  return (
    <div>
      <SectionHeader
        eyebrow="Learning"
        title="Content consumption"
        subtitle="How you're moving through each content type"
        size="md"
      />
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {cards.map((c) => (
          <motion.div key={c.key} variants={fadeInUp}>
            <ConsumptionCard {...c} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function ConsumptionCard({ label, icon, total, done, primaryStat, secondaryStat }: CardInput) {
  const completion = pct(done, total);
  return (
    <GlassCard padding="md" radius="md">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <RingMeter value={completion} max={100} size={64} strokeWidth={6} gradient="primary" showValue={false} centerSlot={
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--sc-text-primary)", fontFamily: '"SF Mono", ui-monospace, Menlo, monospace' }}>
            {completion}%
          </span>
        } />
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--sc-text-primary)" }}>
            <span aria-hidden style={{ color: "var(--sc-accent-primary)", display: "inline-flex" }}>{icon}</span>
            {label}
          </span>
          <span style={{ fontSize: 13, color: "var(--sc-text-secondary)", fontFamily: '"SF Mono", ui-monospace, Menlo, monospace' }}>
            {done} <span style={{ color: "var(--sc-text-muted)" }}>/ {total || "—"}</span>
          </span>
          {primaryStat ? (
            <span style={{ fontSize: 11, color: "var(--sc-text-muted)" }}>{primaryStat}</span>
          ) : null}
          {secondaryStat ? (
            <span style={{ fontSize: 11, color: "var(--sc-text-muted)" }}>{secondaryStat}</span>
          ) : null}
        </div>
      </div>
    </GlassCard>
  );
}
