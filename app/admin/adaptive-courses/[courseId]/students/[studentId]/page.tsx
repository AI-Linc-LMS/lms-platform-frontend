"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, Box, ButtonBase, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
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
import { useVizPalette } from "@/components/admin/adaptive-course/analytics/vizPalette";

const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";

const RISK_CHIP: Record<StudentAnalytics["kpis"]["risk_level"], { label: string; icon: string }> = {
  ok: { label: "On track", icon: "mdi:check-circle-outline" },
  watch: { label: "Watch", icon: "mdi:eye-outline" },
  at_risk: { label: "At risk", icon: "mdi:alert-octagon-outline" },
};

export default function StudentPerformancePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = Number(params.courseId);
  const studentId = Number(params.studentId);
  const { showToast } = useToast();
  const p = useVizPalette();

  const [data, setData] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading || !data) {
    return (
      <MainLayout fullWidthContent>
        <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
          {loading ? <CircularProgress /> : <Typography color="text.secondary">Report unavailable.</Typography>}
        </Box>
      </MainLayout>
    );
  }

  const risk = RISK_CHIP[data.kpis.risk_level];
  const riskColor =
    data.kpis.risk_level === "at_risk" ? p.status.critical
      : data.kpis.risk_level === "watch" ? p.status.warning
      : p.status.good;

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1320, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
        <ButtonBase
          onClick={() => router.push(`/admin/adaptive-courses/${courseId}`)}
          sx={{ mb: 2, color: "#6366f1", fontWeight: 700, gap: 0.5, fontSize: "0.9rem" }}
        >
          <Icon icon="mdi:arrow-left" width={18} /> Back to {data.course.title}
        </ButtonBase>

        {/* Identity */}
        <Stack direction="row" spacing={1.75} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
          <Avatar sx={{ width: 52, height: 52, fontWeight: 700, background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
            {initials(data.student.name)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography sx={{ fontWeight: 900, fontSize: "1.35rem", color: "var(--font-primary)" }}>
                {data.student.name}
              </Typography>
              {/* Status color never alone: icon + label. */}
              <Chip
                size="small"
                icon={<Icon icon={risk.icon} width={14} style={{ color: riskColor }} />}
                label={risk.label}
                sx={{ height: 22, fontWeight: 700, fontSize: "0.7rem", color: riskColor, bgcolor: `${riskColor}1a`, "& .MuiChip-icon": { ml: "6px" } }}
              />
            </Stack>
            <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
              {data.student.email}
              {data.student.last_active
                ? ` · last active ${new Date(data.student.last_active).toLocaleDateString()}`
                : " · never active"}
            </Typography>
          </Box>
        </Stack>

        <Typography sx={{ color: "var(--font-tertiary,#8b8b98)", fontSize: "0.8rem", mb: 2.5 }}>
          Everything this student has done on <strong>{data.course.title}</strong>.
        </Typography>

        {/* Risk first — it's the reason an admin opened this page. */}
        <Box sx={{ mb: 2.5 }}>
          <RiskPanel signals={data.risk_signals} />
        </Box>

        <Box sx={{ mb: 2.5 }}>
          <KpiRail k={data.kpis} />
        </Box>

        {/* The headline contrast, full width. */}
        <Box sx={{ mb: 2 }}>
          <MasteryVsCompletion d={data.mastery_vs_completion} />
        </Box>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, mb: 2 }}>
          <ProgressOverTime rows={data.progress_over_time} />
          <CohortComparison c={data.cohort} completion={data.kpis.completion_pct} points={data.kpis.points} />
        </Box>

        <Box sx={{ mb: 2 }}>
          <ActivityHeatmap cells={data.activity_heatmap} />
        </Box>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, mb: 2 }}>
          <SkillMastery rows={data.skill_mastery} />
          <EffortVsOutcome points={data.effort_vs_outcome} total={data.effort_vs_outcome_total} />
        </Box>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, mb: 2 }}>
          <DifficultyMix rows={data.difficulty} />
          <ConfidenceCalibration rows={data.quiz.confidence_calibration} />
        </Box>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, mb: 2 }}>
          <CodingInsights c={data.coding} />
          <Box sx={{ display: "grid", gap: 2, gridTemplateRows: "auto auto" }}>
            <StruggleItems rows={data.struggle_items} />
            <StudyPattern pattern={data.study_pattern} />
          </Box>
        </Box>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" } }}>
          <MockInterviewTrend rows={data.mock_interviews} />
          <ActivityTimeline rows={data.timeline} />
        </Box>
      </Box>
    </MainLayout>
  );
}
