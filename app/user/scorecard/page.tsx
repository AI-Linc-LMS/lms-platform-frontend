"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

import { MainLayout } from "@/components/layout/MainLayout";
import {
  ScorecardThemeProvider,
  SkeletonShimmer,
  EmptyState,
} from "@/components/scorecard/primitives";
import {
  HeroBand,
  OverviewStatsRow,
  ActivityHeatmapSection,
  LearningConsumptionGrid,
  StickyTabNav,
  SkillRadarChart,
  InterviewReadinessGauge,
  RecommendationCard,
} from "@/components/scorecard/sections";
import { scorecardService } from "@/lib/services/scorecard.service";
import type { ScorecardData } from "@/lib/types/scorecard.types";
import { fadeIn, staggerContainer } from "@/lib/motion/scorecard-presets";

const ALL_TABS = [
  { id: "overview", label: "Overview" },
  { id: "skills", label: "Skills" },
  { id: "career", label: "Career" },
  { id: "activity", label: "Activity" },
  { id: "learning", label: "Learning" },
] as const;

export default function ScorecardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ScorecardData | null>(null);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await scorecardService.getScorecardData();
      setData(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs = useMemo(() => {
    const enabled = data?.scorecardConfig?.enabledModules ?? [];
    const sectionsPresent = {
      overview: Boolean(data?.overview),
      skills: Boolean(data?.skillProficiency),
      career: Boolean(data?.interviewReadiness) || Boolean(data?.aiRecommendations?.length),
      activity: Boolean(data?.activityHeatmap),
      learning: Boolean(data?.learningConsumption),
    };
    const allOn = enabled.length === 0;
    return ALL_TABS.filter((t) => {
      switch (t.id) {
        case "overview":
          return (allOn || enabled.includes("overview")) && sectionsPresent.overview;
        case "skills":
          return (allOn || enabled.includes("skill_proficiency")) && sectionsPresent.skills;
        case "career":
          return (
            (allOn || enabled.includes("interview_readiness") || enabled.includes("ai_recommendations"))
            && sectionsPresent.career
          );
        case "activity":
          return (allOn || enabled.includes("activity_heatmap")) && sectionsPresent.activity;
        case "learning":
          return (allOn || enabled.includes("learning_consumption")) && sectionsPresent.learning;
        default:
          return false;
      }
    });
  }, [
    data?.scorecardConfig?.enabledModules,
    data?.overview,
    data?.skillProficiency,
    data?.interviewReadiness,
    data?.aiRecommendations,
    data?.activityHeatmap,
    data?.learningConsumption,
  ]);

  if (loading) {
    return (
      <MainLayout>
        <ScorecardThemeProvider>
          <PageShell>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <SkeletonShimmer height={156} radius={24} />
              <SkeletonShimmer height={88} radius={12} />
              <SkeletonShimmer height={48} radius={999} />
              <SkeletonShimmer height={240} radius={16} />
              <SkeletonShimmer height={320} radius={16} />
            </div>
          </PageShell>
        </ScorecardThemeProvider>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <ScorecardThemeProvider>
          <PageShell>
            <EmptyState
              icon={<AlertTriangle size={24} />}
              title="Could not load your scorecard"
              description="Something went wrong fetching your learning summary. Try again in a moment."
            />
          </PageShell>
        </ScorecardThemeProvider>
      </MainLayout>
    );
  }

  const heatmap = data.activityHeatmap;
  const currentStreak = heatmap?.summary.currentStreak ?? data.overview.activeDaysStreak;
  const longestStreak = heatmap?.summary.longestStreak;

  const sections: Record<string, React.ReactNode> = {
    overview: (
      <section key="overview" data-sc-section="overview" style={{ scrollMarginTop: 96 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <OverviewStatsRow overview={data.overview} currentStreak={currentStreak} />
        </div>
      </section>
    ),
    skills: (
      <section key="skills" data-sc-section="skills" style={{ scrollMarginTop: 96 }}>
        <SkillRadarChart data={data.skillProficiency} />
      </section>
    ),
    career: (
      <section key="career" data-sc-section="career" style={{ scrollMarginTop: 96, display: "flex", flexDirection: "column", gap: 16 }}>
        {data.interviewReadiness ? <InterviewReadinessGauge data={data.interviewReadiness} /> : null}
        {data.aiRecommendations ? <RecommendationCard initialRecommendations={data.aiRecommendations} /> : null}
      </section>
    ),
    activity: (
      <section key="activity" data-sc-section="activity" style={{ scrollMarginTop: 96 }}>
        <ActivityHeatmapSection data={heatmap} />
      </section>
    ),
    learning: (
      <section key="learning" data-sc-section="learning" style={{ scrollMarginTop: 96 }}>
        <LearningConsumptionGrid data={data.learningConsumption} />
      </section>
    ),
  };

  const visibleIds = tabs.map((t) => t.id);

  return (
    <MainLayout>
      <ScorecardThemeProvider>
        <PageShell>
          <HeroBand
            overview={data.overview}
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            onBack={() => router.push("/dashboard")}
          />
          {tabs.length > 1 ? <StickyTabNav tabs={tabs} /> : null}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            style={{ display: "flex", flexDirection: "column", gap: 24 }}
          >
            {visibleIds.map((id) => (
              <motion.div key={id} variants={fadeIn}>
                {sections[id]}
              </motion.div>
            ))}
          </motion.div>
        </PageShell>
      </ScorecardThemeProvider>
    </MainLayout>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "var(--sc-bg-canvas)",
        color: "var(--sc-text-primary)",
        padding: "32px clamp(16px, 4vw, 48px) 48px",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {children}
      </div>
    </div>
  );
}
