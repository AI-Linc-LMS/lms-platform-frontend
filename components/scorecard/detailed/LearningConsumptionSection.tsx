"use client";

import type { ReactNode } from "react";
import { useId } from "react";
import {
  Box,
  Typography,
  Tooltip as MuiTooltip,
  IconButton,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { LearningConsumption } from "@/lib/types/scorecard.types";
import { proficiencyBandColor } from "@/lib/utils/scorecard-visual";
import {
  AnimatedRing,
  CountUp,
  Reveal,
  gridStagger,
  fadeRise,
  useViewportEntrance,
  useStaticRender,
} from "@/components/scorecard/shared";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
  },
};

interface LearningConsumptionSectionProps {
  data: LearningConsumption;
}

const KPI_TOOLTIPS: Record<string, string> = {
  totalContent:
    "Totals include course items (videos, articles, quizzes, coding) plus mock interview sessions and quiz MCQ count.",
  totalCompleted:
    "Includes videos, articles, coding problems passed, quiz MCQs from passed quizzes, and completed mock interviews.",
  assessmentsTaken: "Number of assessments the student has attempted or submitted.",
  assessmentsAvailable:
    "Total number of assessments available to the student (from their enrolled courses or assigned to them).",
  engagementActions: "Video rewatch events across enrolled courses.",
};

function ChartTooltipContent(props: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number; color?: string }>;
  label?: string;
}) {
  const { active, payload, label } = props;
  if (!active || !payload?.length || !label) return null;
  const completed = payload.find((p) => p.dataKey === "completed")?.value ?? 0;
  const pending = payload.find((p) => p.dataKey === "pending")?.value ?? 0;
  return (
    <Box
      sx={{
        px: 2,
        py: 1.25,
        borderRadius: 2,
        backgroundColor: "var(--card-bg)",
        backdropFilter: "blur(12px)",
        border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
        boxShadow: "0 20px 50px -20px rgba(15, 23, 42, 0.35)",
        minWidth: 180,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: "var(--font-secondary)",
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          display: "block",
          mb: 0.75,
        }}
      >
        {label}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
          <Typography variant="body2" sx={{ color: "var(--font-primary)", fontWeight: 600 }}>
            Completed · {Number(completed)}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "var(--border-default)" }} />
          <Typography variant="body2" sx={{ color: "var(--font-secondary)", fontWeight: 500 }}>
            Pending · {Number(pending)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export function LearningConsumptionSection({ data }: LearningConsumptionSectionProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const mockInterviewAccent = theme.palette.secondary.main;
  const gradientCompletedId = useId();
  const entrance = useViewportEntrance();

  // Prefer API-canonical byType counts when available, fall back to raw fields.
  // (Avoids drift when the API computes totals differently than naive sums.)
  const byType = data.contentCompletionOverview?.byType;
  const videoTotal = byType?.videos?.total ?? data.videos.totalAssigned;
  const videoDone = byType?.videos?.completed ?? data.videos.completed;
  const articleTotal = byType?.articles?.total ?? data.articles.totalAssigned;
  const articleDone = byType?.articles?.completed ?? data.articles.read;
  const codingTotal = byType?.codingProblems?.total ?? data.codingProblems.totalAssigned;
  const codingDone = byType?.codingProblems?.completed ?? data.codingProblems.completed;
  const mockTotal = byType?.mockInterviews?.total ?? data.mockInterviews.totalAssigned;
  const mockDone = byType?.mockInterviews?.completed ?? data.mockInterviews.completed;

  const totalContent =
    data.totalContent ??
    videoTotal +
      articleTotal +
      codingTotal +
      mockTotal +
      (data.practice.totalQuizContents ?? 0);
  const totalContentDisplay = data.totalContent ?? totalContent;
  const totalCompleted =
    data.contentCompletionOverview?.totalCompleted ??
    videoDone + articleDone + codingDone + mockDone + data.practice.mcqsAttempted;

  const videoCompletion =
    videoTotal > 0 ? Math.round((videoDone / videoTotal) * 100) : 0;
  const articleCompletion =
    articleTotal > 0 ? Math.round((articleDone / articleTotal) * 100) : 0;
  const mcqCompletion =
    data.practice.mcqsTotal > 0
      ? Math.round((data.practice.mcqsAttempted / data.practice.mcqsTotal) * 100)
      : 0;
  const codingCompletion =
    codingTotal > 0 ? Math.round((codingDone / codingTotal) * 100) : 0;
  const overallCompletion =
    (totalContent || 0) > 0 ? Math.round((totalCompleted / (totalContent || 1)) * 100) : 0;

  const videoEngagement = data.videos.engagementCount;
  const skippedVideosCount = data.videos.skippedCount ?? data.videos.skippedVideos?.length ?? 0;
  const totalAssessmentsPresent = data.practice.totalAssessmentsPresent ?? 0;

  const quizSectionsTotal =
    data.contentCompletionOverview?.byType?.quizzes?.total ?? data.practice.totalQuizContents ?? 0;
  const quizSectionsCompleted = data.contentCompletionOverview?.byType?.quizzes?.completed ?? 0;
  const mcqsPending = Math.max(0, data.practice.mcqsTotal - data.practice.mcqsAttempted);

  const assessmentCompletionPct =
    totalAssessmentsPresent > 0
      ? Math.round((data.practice.assessmentsAttempted / totalAssessmentsPresent) * 100)
      : 0;
  const assessmentChipPct =
    data.practice.assessmentsEngagementPercentage != null
      ? data.practice.assessmentsEngagementPercentage
      : assessmentCompletionPct;

  const articlesPending = Math.max(0, articleTotal - articleDone);
  const codingPending = Math.max(0, codingTotal - codingDone);
  const mockInterviewPending = data.mockInterviews.pendingCount;

  const chartData = [
    {
      category: "Videos",
      assigned: videoTotal,
      completed: videoDone,
      pending: Math.max(0, videoTotal - videoDone),
    },
    {
      category: "Articles",
      assigned: articleTotal,
      completed: articleDone,
      pending: articlesPending,
    },
    {
      category: "Quizzes",
      assigned: data.practice.mcqsTotal,
      completed: data.practice.mcqsAttempted,
      pending: mcqsPending,
    },
    {
      category: "Coding",
      assigned: codingTotal,
      completed: codingDone,
      pending: codingPending,
    },
    {
      category: "Mock",
      assigned: mockTotal,
      completed: mockDone,
      pending: mockInterviewPending,
    },
  ];

  const kpiItems = [
    { value: totalContentDisplay, label: "Total Content", tip: KPI_TOOLTIPS.totalContent, accent: "#0a66c2" },
    { value: totalCompleted, label: "Completed", tip: KPI_TOOLTIPS.totalCompleted, accent: "#10b981" },
    {
      value: data.practice.assessmentsAttempted,
      label: "Assessments Taken",
      tip: KPI_TOOLTIPS.assessmentsTaken,
      accent: "#8b5cf6",
    },
    {
      value: totalAssessmentsPresent,
      label: "Assessments Available",
      tip: KPI_TOOLTIPS.assessmentsAvailable,
      accent: "#06b6d4",
    },
    {
      value: data.videos.rewatchCount,
      label: "Video Rewatches",
      tip: KPI_TOOLTIPS.engagementActions,
      accent: "#f59e0b",
    },
  ];

  return (
    <Reveal as="section">
      <Box
        sx={{
          position: "relative",
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
          backgroundColor: "var(--card-bg)",
          boxShadow:
            "0 1px 0 color-mix(in srgb, var(--border-default) 60%, transparent), 0 30px 60px -30px rgba(15, 23, 42, 0.18)",
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            opacity: isDark ? 0.6 : 0.45,
            backgroundImage: [
              "radial-gradient(50% 50% at 0% 0%, color-mix(in srgb, var(--accent-cyan) 12%, transparent), transparent 60%)",
              "radial-gradient(45% 55% at 100% 0%, color-mix(in srgb, var(--accent-purple) 10%, transparent), transparent 60%)",
            ].join(", "),
            pointerEvents: "none",
          }}
        />

        <Box sx={{ position: "relative", p: { xs: 2.5, sm: 3.5, md: 5 } }}>
          {/* Header */}
          <Box
            component={motion.div}
            variants={fadeRise}
            {...entrance}
            sx={{
              display: "flex",
              alignItems: { xs: "flex-start", sm: "center" },
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              mb: { xs: 4, md: 5 },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  width: 4,
                  height: 48,
                  borderRadius: 2,
                  background:
                    "linear-gradient(180deg, var(--accent-indigo) 0%, var(--accent-purple) 100%)",
                }}
              />
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "var(--font-secondary)",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  Chapter 02
                </Typography>
                <Typography
                  component="h2"
                  sx={{
                    fontWeight: 800,
                    color: "var(--font-primary)",
                    fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.75rem" },
                    lineHeight: 1.05,
                    letterSpacing: "-0.035em",
                    mt: 0.25,
                  }}
                >
                  Learning Consumption
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--font-secondary)",
                    fontSize: "0.95rem",
                    mt: 1,
                    maxWidth: 640,
                  }}
                >
                  Progress and engagement across videos, articles, course quizzes,
                  coding problems, mock interviews, and assessments.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Editorial KPI rail - 5 oversized numbers separated by hairlines */}
          <Box
            component={motion.div}
            variants={gridStagger}
            {...entrance}
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: "repeat(5, 1fr)",
              },
              borderTop: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
              borderBottom: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
              mb: { xs: 4, md: 5 },
            }}
          >
            {kpiItems.map((kpi, idx) => (
              <Box
                key={kpi.label}
                component={motion.div}
                variants={ITEM_VARIANTS}
                sx={{
                  position: "relative",
                  py: { xs: 2.5, md: 3 },
                  px: { xs: 1.5, sm: 2 },
                  borderRight: {
                    xs: idx % 2 === 0 ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)" : "none",
                    sm: (idx + 1) % 3 === 0 ? "none" : "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                    md: idx === kpiItems.length - 1 ? "none" : "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                  },
                  borderBottom: {
                    xs: idx < kpiItems.length - 2 ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)" : "none",
                    sm: idx < kpiItems.length - 3 ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)" : "none",
                    md: "none",
                  },
                  transition: "background-color 0.25s ease",
                  "&:hover": {
                    backgroundColor: `color-mix(in srgb, ${kpi.accent} 6%, transparent)`,
                  },
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: 24,
                    height: 2,
                    background: kpi.accent,
                  },
                }}
              >
                <Typography
                  component="div"
                  sx={{
                    fontWeight: 800,
                    color: "var(--font-primary)",
                    fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <CountUp value={kpi.value} duration={1.4} />
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--font-secondary)",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    {kpi.label}
                  </Typography>
                  <MuiTooltip title={kpi.tip} placement="top" arrow>
                    <IconButton size="small" sx={{ p: 0.25, color: "var(--font-secondary)" }}>
                      <IconWrapper icon="mdi:information-outline" size={13} color="currentColor" />
                    </IconButton>
                  </MuiTooltip>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Hero panel: completion ring + chart side-by-side */}
          <Box
            component={motion.div}
            variants={fadeRise}
            {...entrance}
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "minmax(0, 320px) minmax(0, 1fr)" },
              gap: { xs: 3, md: 4 },
              alignItems: "stretch",
              mb: { xs: 4, md: 5 },
            }}
          >
            <Box
              sx={{
                position: "relative",
                p: { xs: 3, md: 4 },
                borderRadius: 3,
                background:
                  "linear-gradient(160deg, color-mix(in srgb, var(--accent-indigo) 12%, transparent) 0%, color-mix(in srgb, var(--accent-cyan) 6%, transparent) 100%)",
                border: "1px solid color-mix(in srgb, var(--accent-indigo) 22%, transparent)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                minHeight: 280,
              }}
            >
              <AnimatedRing
                value={overallCompletion}
                size={200}
                strokeWidth={12}
                color="var(--accent-indigo)"
                colorEnd="var(--accent-cyan)"
                caption="Overall Completion"
                valueFontSize={48}
              />
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  sx={{
                    color: "var(--font-primary)",
                    fontWeight: 700,
                    fontSize: "1rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  <CountUp value={totalCompleted} /> of <CountUp value={totalContentDisplay} /> items
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "var(--font-secondary)",
                    fontSize: "0.8rem",
                    display: "block",
                    mt: 0.25,
                  }}
                >
                  Across every content type below
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                p: { xs: 2, md: 3 },
                borderRadius: 3,
                border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--card-bg) 96%, transparent)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "var(--font-secondary)",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  Content Completion Overview
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <LegendDot label="Completed" color="#10b981" />
                  <LegendDot label="Pending" color="var(--border-light)" />
                </Box>
              </Box>
              <Box sx={{ flex: 1, minHeight: 240 }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                  <BarChart data={chartData} margin={{ top: 12, right: 12, bottom: 0, left: -12 }}>
                    <defs>
                      <linearGradient id={gradientCompletedId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 6"
                      stroke={alpha(theme.palette.divider, 0.6)}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="category"
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fontSize: 11,
                        fill: theme.palette.text.secondary,
                        fontWeight: 600,
                      }}
                      dy={6}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fontSize: 11,
                        fill: theme.palette.text.secondary,
                      }}
                      width={36}
                    />
                    <Tooltip
                      content={<ChartTooltipContent />}
                      cursor={{ fill: alpha(theme.palette.primary.main, 0.06) }}
                    />
                    <Legend wrapperStyle={{ display: "none" }} />
                    <Bar
                      dataKey="completed"
                      stackId="a"
                      fill={`url(#${gradientCompletedId})`}
                      name="Completed"
                      radius={[6, 6, 0, 0]}
                      animationDuration={1100}
                      animationEasing="ease-out"
                    />
                    <Bar
                      dataKey="pending"
                      stackId="a"
                      fill={alpha(theme.palette.text.secondary, isDark ? 0.18 : 0.12)}
                      name="Pending"
                      radius={[0, 0, 6, 6]}
                      animationDuration={1100}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </Box>

          {/* Bento grid - 6 content type cards, with Videos and Mock Interviews spanning two columns on lg */}
          <Box
            component={motion.div}
            variants={gridStagger}
            {...entrance}
            sx={{
              display: "grid",
              gap: { xs: 2, md: 2.5 },
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(6, 1fr)",
              },
            }}
          >
            <Box sx={{ gridColumn: { lg: "span 4" } }}>
              <BentoCard
                accent={theme.palette.primary.main}
                icon="mdi:play-circle"
                eyebrow="Video Lessons"
                title="Videos"
                subtitle={`${data.videos.completed} of ${data.videos.totalAssigned} completed`}
                completionPct={videoCompletion}
                large
                stats={[
                  { label: "Avg watch", value: `${data.videos.averageWatchPercentage}%` },
                  { label: "Rewatches", value: data.videos.rewatchCount },
                  ...(videoEngagement != null
                    ? [{ label: "Engagement", value: videoEngagement }]
                    : []),
                  { label: "Skipped", value: skippedVideosCount, danger: true },
                ]}
              />
            </Box>

            <Box sx={{ gridColumn: { lg: "span 2" } }}>
              <BentoCard
                accent={theme.palette.success.main}
                icon="mdi:book-open"
                eyebrow="Reading"
                title="Articles"
                subtitle={`${data.articles.read} of ${data.articles.totalAssigned} read`}
                completionPct={articleCompletion}
                stats={[
                  { label: "Pending", value: articlesPending },
                  { label: "Assigned", value: data.articles.totalAssigned },
                  {
                    label: "Est. read",
                    value:
                      data.articles.totalAssigned > 0
                        ? `${data.articles.typicalReadTimePerArticle}m`
                        : "-",
                    hintTip: "Average lesson estimate across all assigned articles.",
                  },
                  {
                    label: "Your read",
                    value:
                      data.articles.read === 0 ? "-" : `${data.articles.averageReadingTime}m`,
                    hintTip: "Your average when read time is saved (e.g. Mark as read).",
                  },
                ]}
              />
            </Box>

            <Box sx={{ gridColumn: { lg: "span 2" } }}>
              <BentoCard
                accent={theme.palette.warning.main}
                icon="mdi:help-circle-outline"
                eyebrow="Practice"
                title="Course quizzes"
                subtitle={`${data.practice.mcqsAttempted} of ${data.practice.mcqsTotal} MCQs`}
                completionPct={mcqCompletion}
                stats={[
                  {
                    label: "Quiz sections",
                    value: `${quizSectionsCompleted}/${quizSectionsTotal}`,
                  },
                  { label: "Pending MCQs", value: mcqsPending },
                ]}
              />
            </Box>

            <Box sx={{ gridColumn: { lg: "span 2" } }}>
              <BentoCard
                accent={theme.palette.info.main}
                icon="mdi:code-braces"
                eyebrow="Coding"
                title="Coding problems"
                subtitle={`${data.codingProblems.completed} of ${data.codingProblems.totalAssigned} solved`}
                completionPct={codingCompletion}
                stats={[
                  { label: "Pending", value: codingPending },
                  { label: "Submissions", value: data.codingProblems.submissionCount },
                ]}
              />
            </Box>

            <Box sx={{ gridColumn: { lg: "span 4" } }}>
              <BentoCard
                accent={mockInterviewAccent}
                icon="mdi:account-voice"
                eyebrow="Interview Prep"
                title="Mock interviews"
                subtitle={`${data.mockInterviews.completed} of ${data.mockInterviews.totalAssigned} completed`}
                completionPct={data.mockInterviews.completionPercentage}
                large
                stats={[
                  { label: "Pending", value: mockInterviewPending },
                  {
                    label: "Active total",
                    value: data.mockInterviews.totalAssigned,
                    hintTip:
                      "Scheduled, in progress, or completed (excludes cancelled sessions).",
                  },
                  {
                    label: "Completion",
                    value: `${data.mockInterviews.completionPercentage}%`,
                    valueColor: proficiencyBandColor(data.mockInterviews.completionPercentage),
                  },
                  {
                    label: "Avg score",
                    value:
                      data.mockInterviews.averageScore == null
                        ? "-"
                        : `${data.mockInterviews.averageScore}%`,
                    hintTip:
                      "Average of per-interview scores from evaluation. Interviews without a numeric score are omitted.",
                  },
                ]}
              />
            </Box>

            <Box sx={{ gridColumn: { lg: "span 6" } }}>
              <BentoCard
                accent={theme.palette.secondary.main}
                icon="mdi:clipboard-text-outline"
                eyebrow="Assessments"
                title="Assessments"
                subtitle={
                  totalAssessmentsPresent > 0
                    ? `${data.practice.assessmentsAttempted} of ${totalAssessmentsPresent} attempted`
                    : "No assessments assigned"
                }
                completionPct={assessmentChipPct}
                stats={[
                  { label: "Available", value: totalAssessmentsPresent },
                  {
                    label: "Missed",
                    value: data.practice.assessmentsMissed,
                    danger: true,
                  },
                  {
                    label: "Completion",
                    value: `${assessmentCompletionPct}%`,
                    valueColor: proficiencyBandColor(assessmentCompletionPct),
                  },
                ]}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Reveal>
  );
}

function LegendDot({ label, color }: { label: string; color: string }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      <Typography
        variant="caption"
        sx={{
          color: "var(--font-secondary)",
          fontSize: "0.7rem",
          fontWeight: 600,
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

interface BentoStat {
  label: string;
  value: ReactNode;
  danger?: boolean;
  valueColor?: string;
  hintTip?: string;
}

interface BentoCardProps {
  accent: string;
  icon: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  completionPct: number;
  large?: boolean;
  stats: BentoStat[];
}

function BentoCard({
  accent,
  icon,
  eyebrow,
  title,
  subtitle,
  completionPct,
  large,
  stats,
}: BentoCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const barId = useId();
  const staticRender = useStaticRender();
  const clampedPct = Math.max(0, Math.min(100, completionPct));
  const hairline = alpha(accent, isDark ? 0.22 : 0.16);
  const statColumns = Math.min(stats.length, 4);

  return (
    <Box
      component={motion.div}
      variants={ITEM_VARIANTS}
      sx={{
        position: "relative",
        height: "100%",
        minHeight: large ? 320 : 280,
        p: { xs: 2.5, sm: 3, md: 3.5 },
        borderRadius: 4,
        overflow: "hidden",
        backgroundColor: "var(--card-bg)",
        border: "1px solid",
        borderColor: alpha(accent, isDark ? 0.3 : 0.18),
        backgroundImage: `linear-gradient(155deg, ${alpha(accent, isDark ? 0.16 : 0.06)} 0%, transparent 55%)`,
      }}
    >
      {/* Decorative corner glyph - large transparent icon as background */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: { xs: -32, md: -40 },
          right: { xs: -32, md: -40 },
          opacity: isDark ? 0.16 : 0.1,
          color: accent,
          pointerEvents: "none",
        }}
      >
        <IconWrapper icon={icon} size={large ? 220 : 180} color="currentColor" />
      </Box>

      {/* Subtle radial glow accent */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(accent, 0.28)} 0%, transparent 65%)`,
          filter: "blur(28px)",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          gap: { xs: 2.5, md: 3 },
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              flexShrink: 0,
              background: `linear-gradient(135deg, ${accent} 0%, ${alpha(accent, 0.65)} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 12px 24px -10px ${alpha(accent, 0.6)}`,
            }}
          >
            <IconWrapper icon={icon} size={20} color="#ffffff" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                color: accent,
                fontSize: "0.65rem",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                display: "block",
                lineHeight: 1.2,
              }}
            >
              {eyebrow}
            </Typography>
            <Typography
              sx={{
                fontWeight: 700,
                color: "var(--font-primary)",
                fontSize: "1.15rem",
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </Typography>
          </Box>
        </Box>

        {/* Hero metric - oversized completion % anchored next to the subtitle */}
        <Box
          sx={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Typography
            component="div"
            sx={{
              fontWeight: 800,
              color: "var(--font-primary)",
              lineHeight: 0.92,
              letterSpacing: "-0.05em",
              fontSize: large
                ? { xs: "4.5rem", md: "5.25rem" }
                : { xs: "3.75rem", md: "4.25rem" },
              fontVariantNumeric: "tabular-nums",
              display: "inline-flex",
              alignItems: "baseline",
            }}
          >
            <CountUp value={clampedPct} duration={1.3} />
            <Box
              component="span"
              sx={{
                fontSize: "0.32em",
                fontWeight: 800,
                ml: 0.5,
                color: accent,
                letterSpacing: 0,
              }}
            >
              %
            </Box>
          </Typography>
          <Typography
            sx={{
              color: "var(--font-secondary)",
              fontSize: "0.85rem",
              fontWeight: 600,
              textAlign: "right",
              maxWidth: 180,
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </Typography>
        </Box>

        {/* Slim neon progress track */}
        <Box sx={{ position: "relative" }}>
          <Box
            sx={{
              height: 4,
              borderRadius: 999,
              backgroundColor: alpha(accent, isDark ? 0.18 : 0.12),
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Box
              component={motion.div}
              initial={{ width: staticRender ? `${clampedPct}%` : 0 }}
              animate={staticRender ? { width: `${clampedPct}%` } : undefined}
              whileInView={staticRender ? undefined : { width: `${clampedPct}%` }}
              viewport={staticRender ? undefined : { once: true, margin: "0px 0px -10% 0px" }}
              transition={{ duration: staticRender ? 0 : 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              sx={{
                height: "100%",
                borderRadius: 999,
                background: `linear-gradient(90deg, ${accent} 0%, ${alpha(accent, 0.7)} 100%)`,
                boxShadow: `0 0 14px ${alpha(accent, 0.6)}`,
              }}
              id={barId}
            />
          </Box>
        </Box>

        {/* Editorial stats strip - hairline-separated cells, no tinted boxes */}
        <Box
          sx={{
            mt: "auto",
            pt: { xs: 2, md: 2.5 },
            borderTop: `1px solid ${hairline}`,
            display: "grid",
            gridTemplateColumns: {
              xs: stats.length >= 4 ? "repeat(2, 1fr)" : `repeat(${stats.length}, 1fr)`,
              sm: `repeat(${statColumns}, 1fr)`,
            },
            rowGap: { xs: 2, sm: 0 },
            position: "relative",
          }}
        >
          {stats.map((stat) => {
            const cell = (
              <Box
                key={stat.label}
                sx={{
                  position: "relative",
                  px: { xs: 0, sm: 1.5 },
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  // Vertical dividers between cells in the same row
                  "&:not(:first-of-type)": {
                    pl: { sm: 1.75 },
                    borderLeft: { sm: `1px solid ${hairline}` },
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: accent,
                      flexShrink: 0,
                      boxShadow: `0 0 0 2px ${alpha(accent, 0.15)}`,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--font-secondary)",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={stat.label}
                  >
                    {stat.label}
                  </Typography>
                  {stat.hintTip && (
                    <MuiTooltip title={stat.hintTip} placement="top" arrow>
                      <IconButton
                        size="small"
                        sx={{ p: 0.15, color: "var(--font-secondary)", ml: -0.25 }}
                      >
                        <IconWrapper icon="mdi:information-outline" size={12} color="currentColor" />
                      </IconButton>
                    </MuiTooltip>
                  )}
                </Box>
                <Typography
                  sx={{
                    fontWeight: 800,
                    color: stat.danger
                      ? theme.palette.error.main
                      : stat.valueColor ?? "var(--font-primary)",
                    fontSize: { xs: "1.35rem", md: "1.5rem" },
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {stat.value}
                </Typography>
              </Box>
            );
            return cell;
          })}
        </Box>
      </Box>
    </Box>
  );
}
