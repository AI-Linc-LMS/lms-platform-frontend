"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, ButtonBase, CircularProgress, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { StudentAvatar } from "@/components/admin/adaptive-course/studentVisuals";
import { useToast } from "@/components/common/Toast";
import {
  adminAdaptiveCourseService,
  StudentAnalytics,
} from "@/lib/services/admin/admin-adaptive-course.service";
import {
  ActivityHeatmap,
  ActivityTimeline,
  CodingInsights,
  CohortComparison,
  ConfidenceCalibration,
  DifficultyMix,
  EffortVsOutcome,
  KpiRail,
  MasteryVsCompletion,
  MockInterviewTrend,
  ProgressOverTime,
  RiskPanel,
  SkillMastery,
  StruggleItems,
  StudyPattern,
} from "@/components/admin/adaptive-course/analytics/charts";
import {
  InsightLine,
  NextActions,
  StickySummaryBar,
  VerdictPlate,
  useHeroOffscreen,
  useJumpTo,
} from "@/components/admin/adaptive-course/analytics/hero";
import {
  buildInsight,
  buildNextActions,
  buildVerdict,
  isNeverActive,
} from "@/components/admin/adaptive-course/analytics/studentInsights";
import { useVizPalette } from "@/components/admin/adaptive-course/analytics/vizPalette";

const SEVERITY_RANK: Record<string, number> = { critical: 0, serious: 1, warning: 2 };

const grid2 = { display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } } as const;
const gridWide = { display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" } } as const;

/**
 * A question-shaped divider. The headings are the questions an admin is asking, not nouns —
 * that's what makes the page scannable. Deliberately NOT numbered: these are areas of evidence
 * you jump between, not steps in a sequence, so an index would encode an order that isn't real.
 */
function SectionDivider({ question }: { question: string }) {
  return (
    <Box sx={{ mt: { xs: 4, md: 5 }, mb: { xs: 2, md: 2.5 }, display: "flex", alignItems: "baseline", gap: 2 }}>
      <Typography sx={{ fontSize: { xs: "1.3rem", md: "1.5rem" }, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, color: "var(--font-primary)", flexShrink: 0 }}>
        {question}
      </Typography>
      <Box sx={{ flex: 1, height: "1px", bgcolor: "color-mix(in srgb, var(--border-default) 80%, transparent)" }} />
    </Box>
  );
}

export default function StudentPerformancePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = Number(params.courseId);
  const studentId = Number(params.studentId);
  const { showToast } = useToast();
  const p = useVizPalette();

  const [data, setData] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const sentinel = useRef<HTMLDivElement | null>(null);
  const heroGone = useHeroOffscreen(sentinel);
  const { register, jump } = useJumpTo();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setData(await adminAdaptiveCourseService.getStudentAnalytics(courseId, studentId));
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't load this student's report.", "error");
    } finally {
      setLoading(false);
    }
  }, [courseId, studentId, showToast]);

  useEffect(() => {
    if (Number.isFinite(courseId) && Number.isFinite(studentId)) load();
  }, [courseId, studentId, load]);

  const verdict = useMemo(() => (data ? buildVerdict(data) : null), [data]);
  const actions = useMemo(() => (data ? buildNextActions(data) : []), [data]);
  const signals = useMemo(
    () => (data ? [...data.risk_signals].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]) : []),
    [data],
  );

  if (loading || !data || !verdict) {
    return (
      <MainLayout fullWidthContent>
        <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
          {loading ? <CircularProgress /> : <Typography color="text.secondary">Report unavailable.</Typography>}
        </Box>
      </MainLayout>
    );
  }

  const neverActive = isNeverActive(data);

  return (
    <MainLayout fullWidthContent>
      <StickySummaryBar visible={heroGone} student={data.student} verdict={verdict} kpis={data.kpis} />

      {/* Evidence cards are white; they need a plane to lift off, so the page runs on --surface. */}
      <Box sx={{ bgcolor: "var(--surface, #f9fafb)", minHeight: "100%" }}>
        <Box sx={{ maxWidth: 1600, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 5 } }}>

          {/* ---------------------------------------------------------------- HERO */}
          <AdaptiveSectionShell>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                <ButtonBase
                  onClick={() => router.push(`/admin/adaptive-courses/${courseId}`)}
                  sx={{
                    display: "flex", alignItems: "center", gap: 0.5,
                    px: 1.5, py: 0.75, borderRadius: 999,
                    fontSize: "0.82rem", fontWeight: 700, color: "#6366f1",
                    border: "1px solid color-mix(in srgb, #6366f1 30%, transparent)",
                    "&:hover": { bgcolor: "color-mix(in srgb, #6366f1 8%, transparent)" },
                    "&:focus-visible": { outline: "2px solid color-mix(in srgb,#6366f1 60%,transparent)", outlineOffset: 2 },
                  }}
                >
                  <Icon icon="mdi:arrow-left" width={17} /> Back to {data.course.title}
                </ButtonBase>
              </Box>

              {/* Identity + the verdict, side by side: who, and are they in trouble. */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr minmax(300px, 0.72fr)" }, gap: 2.5, alignItems: { md: "center" } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
                  <StudentAvatar name={data.student.name} email={data.student.email} size={64} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: { xs: "1.3rem", md: "1.5rem" }, fontWeight: 900, letterSpacing: "-0.02em", color: "var(--font-primary)" }}>
                      {data.student.name}
                    </Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: "var(--font-secondary)", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {data.student.email}
                      {data.student.last_active
                        ? ` · last active ${new Date(data.student.last_active).toLocaleDateString()}`
                        : " · never active"}
                    </Typography>
                  </Box>
                </Box>
                <VerdictPlate verdict={verdict} />
              </Box>

              {/* The WHY — first-class objects, sorted worst-first. */}
              {neverActive && signals.length === 0 ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.75, borderRadius: 2.5, border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)", bgcolor: "var(--card-bg,#fff)" }}>
                  <Icon icon="mdi:information-outline" width={18} style={{ color: "var(--font-secondary)" }} />
                  <Typography sx={{ fontSize: "0.85rem", color: "var(--font-secondary)" }}>
                    Nothing to assess until they begin.
                  </Typography>
                </Box>
              ) : (
                <RiskPanel signals={signals} />
              )}

              <NextActions actions={actions} onJump={jump} />

              <KpiRail k={data.kpis} />
            </Box>
          </AdaptiveSectionShell>
          <Box ref={sentinel} />

          {/* ------------------------------------------------------------ EVIDENCE */}
          <SectionDivider question="Are they actually learning?" />
          <Box sx={{ mb: 2 }}>
            <MasteryVsCompletion d={data.mastery_vs_completion} featured />
          </Box>
          <Box sx={gridWide}>
            <Box sx={{ minWidth: 0 }}>
              <InsightLine insight={buildInsight("progress", data)} accent={p.series.quiz} />
              <ProgressOverTime rows={data.progress_over_time} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <InsightLine insight={buildInsight("cohort", data)} accent={p.series.coding} />
              <CohortComparison c={data.cohort} completion={data.kpis.completion_pct} points={data.kpis.points} />
            </Box>
          </Box>

          <SectionDivider question="Are they showing up?" />
          <Box sx={{ mb: 2 }}>
            <ActivityHeatmap cells={data.activity_heatmap} featured />
          </Box>
          <Box sx={grid2}>
            <StudyPattern pattern={data.study_pattern} />
            <EffortVsOutcome points={data.effort_vs_outcome} total={data.effort_vs_outcome_total} />
          </Box>

          <SectionDivider question="What do they actually know?" />
          <Box sx={{ ...grid2, mb: 2 }}>
            <Box sx={{ minWidth: 0 }} ref={register("skills")}>
              <InsightLine insight={buildInsight("skills", data)} accent={p.series.video} />
              <SkillMastery rows={data.skill_mastery} />
            </Box>
            <Box sx={{ minWidth: 0 }} ref={register("calibration")}>
              <ConfidenceCalibration rows={data.quiz.confidence_calibration} />
            </Box>
          </Box>
          <Box sx={grid2}>
            <Box sx={{ minWidth: 0 }} ref={register("difficulty")}>
              <InsightLine insight={buildInsight("difficulty", data)} accent={p.ordinal[2]} />
              <DifficultyMix rows={data.difficulty} />
            </Box>
            <Box sx={{ minWidth: 0 }} ref={register("struggle")}>
              <StruggleItems rows={data.struggle_items} />
            </Box>
          </Box>

          <SectionDivider question="How is their practice going?" />
          <Box sx={grid2}>
            <Box sx={{ minWidth: 0 }} ref={register("coding")}>
              <InsightLine insight={buildInsight("coding", data)} accent={p.series.coding} />
              <CodingInsights c={data.coding} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <InsightLine insight={buildInsight("mock", data)} accent={p.series.article} />
              <MockInterviewTrend rows={data.mock_interviews} />
            </Box>
          </Box>

          <SectionDivider question="What have they been doing?" />
          <ActivityTimeline rows={data.timeline} />
        </Box>
      </Box>
    </MainLayout>
  );
}
