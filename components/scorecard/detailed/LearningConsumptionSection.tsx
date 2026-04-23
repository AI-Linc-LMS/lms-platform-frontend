"use client";

import type { ReactNode } from "react";
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Tooltip as MuiTooltip,
  IconButton,
  Chip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { LearningConsumption } from "@/lib/types/scorecard.types";
import { proficiencyBandColor } from "@/lib/utils/scorecard-visual";
import { ProgressRingChart } from "@/components/charts";
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

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" as const },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" as const },
};

interface LearningConsumptionSectionProps {
  data: LearningConsumption;
}

/** Accent for mock interview card (distinct from info/secondary). */
const MOCK_INTERVIEW_ACCENT = "#8b5cf6";

const SECTION_PAPER = {
  p: { xs: 2, sm: 3, md: 3.5 },
  borderRadius: 3,
  border: "1px solid",
  borderColor: "divider",
  backgroundColor: "background.paper",
  boxShadow: "none",
};

const STAT_CARD = {
  p: 2,
  borderRadius: 2,
  bgcolor: "action.hover",
  border: "1px solid",
  borderColor: "divider",
  textAlign: "center" as const,
  minHeight: 88,
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
};

const CONTENT_CARD = {
  p: 2.5,
  borderRadius: 2,
  width: "100%",
  height: "100%",
  minHeight: 0,
  display: "flex",
  flexDirection: "column" as const,
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
  transition: "box-shadow 0.25s ease, border-color 0.25s ease",
  "&:hover": {
    boxShadow: 1,
    borderColor: "primary.main",
  },
};

function contentTypeMiniStatSx(accent: string, mode: "light" | "dark") {
  return {
    p: 1.5,
    borderRadius: 2,
    width: "100%",
    minHeight: 72,
    minWidth: 0,
    boxSizing: "border-box" as const,
    bgcolor: alpha(accent, mode === "dark" ? 0.14 : 0.06),
    border: "1px solid",
    borderColor: alpha(accent, mode === "dark" ? 0.3 : 0.2),
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  };
}

interface ContentTypeBreakdownCardProps {
  accentColor: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  completionPct: number;
  children: ReactNode;
}

function ContentTypeBreakdownCard({
  accentColor,
  icon,
  title,
  subtitle,
  completionPct,
  children,
}: ContentTypeBreakdownCardProps) {
  const theme = useTheme();
  const mode = theme.palette.mode;
  return (
    <Box
      component={motion.div}
      variants={staggerItem}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      sx={{
        ...CONTENT_CARD,
        position: "relative",
        overflow: "hidden",
        borderTopWidth: 3,
        borderTopStyle: "solid",
        borderTopColor: accentColor,
        bgcolor: alpha(accentColor, mode === "dark" ? 0.1 : 0.025),
        "&:hover": {
          boxShadow: 2,
          borderColor: alpha(accentColor, mode === "dark" ? 0.55 : 0.4),
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1.5,
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: accentColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: `0 6px 20px ${alpha(accentColor, 0.28)}`,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {subtitle}
            </Typography>
          </Box>
        </Box>
        <Chip
          label={`${completionPct}%`}
          size="small"
          sx={{
            height: 28,
            fontWeight: 700,
            flexShrink: 0,
            bgcolor: alpha(accentColor, mode === "dark" ? 0.22 : 0.12),
            color: accentColor,
            border: "1px solid",
            borderColor: alpha(accentColor, 0.38),
            "& .MuiChip-label": { px: 1.25 },
          }}
        />
      </Box>
      <LinearProgress
        variant="determinate"
        value={completionPct}
        sx={{
          height: 10,
          borderRadius: 5,
          mb: 2,
          bgcolor: alpha(accentColor, 0.12),
          "& .MuiLinearProgress-bar": {
            borderRadius: 5,
            bgcolor: proficiencyBandColor(completionPct),
          },
        }}
      />
      {children}
    </Box>
  );
}

/** Custom tooltip for Content Completion Overview bar chart */
function ChartTooltipContent(props: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number }>;
  label?: string;
}) {
  const { active, payload, label } = props;
  if (!active || !payload?.length || !label) return null;
  const completed = payload.find((p) => p.dataKey === "completed")?.value ?? 0;
  const pending = payload.find((p) => p.dataKey === "pending")?.value ?? 0;
  return (
    <Paper
      elevation={8}
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        minWidth: 180,
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Typography variant="body2" sx={{ color: "#0f766e", fontWeight: 600 }}>
          Completed: {Number(completed)}
        </Typography>
        <Typography variant="body2" sx={{ color: "#6b7280", fontWeight: 500 }}>
          Pending: {Number(pending)}
        </Typography>
      </Box>
    </Paper>
  );
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

export function LearningConsumptionSection({ data }: LearningConsumptionSectionProps) {
  const theme = useTheme();
  const miniStat = (accent: string) => contentTypeMiniStatSx(accent, theme.palette.mode);

  const totalContent =
    data.totalContent ??
    data.videos.totalAssigned +
      data.articles.totalAssigned +
      data.codingProblems.totalAssigned +
      data.mockInterviews.totalAssigned +
      (data.practice.totalQuizContents ?? 0);
  const totalContentDisplay = data.totalContent ?? totalContent;
  const totalCompleted =
    data.contentCompletionOverview?.totalCompleted ??
    data.videos.completed +
      data.articles.read +
      data.codingProblems.completed +
      data.mockInterviews.completed +
      data.practice.mcqsAttempted;

  const videoCompletion =
    data.videos.totalAssigned > 0
      ? Math.round((data.videos.completed / data.videos.totalAssigned) * 100)
      : 0;
  const articleCompletion =
    data.articles.totalAssigned > 0
      ? Math.round((data.articles.read / data.articles.totalAssigned) * 100)
      : 0;
  const mcqCompletion =
    data.practice.mcqsTotal > 0
      ? Math.round((data.practice.mcqsAttempted / data.practice.mcqsTotal) * 100)
      : 0;
  const codingCompletion =
    data.codingProblems.totalAssigned > 0
      ? Math.round((data.codingProblems.completed / data.codingProblems.totalAssigned) * 100)
      : 0;
  const overallCompletion =
    (totalContent || 0) > 0 ? Math.round((totalCompleted / (totalContent || 1)) * 100) : 0;

  const videoEngagement =
    data.videos.engagementCount != null
      ? data.videos.engagementCount
      : Math.round(data.videos.averageWatchPercentage * 0.7 + videoCompletion * 0.3);
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

  const articlesPending = Math.max(0, data.articles.totalAssigned - data.articles.read);
  const codingPending = Math.max(0, data.codingProblems.totalAssigned - data.codingProblems.completed);
  const mockInterviewPending = data.mockInterviews.pendingCount;

  const chartData = [
    {
      category: "Videos",
      assigned: data.videos.totalAssigned,
      completed: data.videos.completed,
      pending: data.videos.totalAssigned - data.videos.completed,
    },
    {
      category: "Articles",
      assigned: data.articles.totalAssigned,
      completed: data.articles.read,
      pending: data.articles.totalAssigned - data.articles.read,
    },
    {
      category: "Course quizzes",
      assigned: data.practice.mcqsTotal,
      completed: data.practice.mcqsAttempted,
      pending: mcqsPending,
    },
    {
      category: "Coding",
      assigned: data.codingProblems.totalAssigned,
      completed: data.codingProblems.completed,
      pending: codingPending,
    },
    {
      category: "Mock",
      assigned: data.mockInterviews.totalAssigned,
      completed: data.mockInterviews.completed,
      pending: mockInterviewPending,
    },
  ];

  const kpiItems = [
    { value: totalContentDisplay, label: "Total Content", tip: KPI_TOOLTIPS.totalContent },
    { value: totalCompleted, label: "Total Completed", tip: KPI_TOOLTIPS.totalCompleted },
    { value: data.practice.assessmentsAttempted, label: "Assessments Taken", tip: KPI_TOOLTIPS.assessmentsTaken },
    { value: totalAssessmentsPresent, label: "Assessments Available", tip: KPI_TOOLTIPS.assessmentsAvailable },
    {
      value: data.videos.rewatchCount,
      label: "Engagement Actions",
      tip: KPI_TOOLTIPS.engagementActions,
    },
  ];

  return (
    <Paper elevation={0} sx={SECTION_PAPER}>
      {/* Header */}
      <Box
        component={motion.div}
        initial={fadeInUp.initial}
        animate={fadeInUp.animate}
        transition={fadeInUp.transition}
        sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:chart-line" size={24} color="#ffffff" />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            Learning Consumption
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Progress and engagement across videos, articles, course quizzes, coding problems, mock interviews, and assessments
          </Typography>
        </Box>
      </Box>

      {/* Hero: Completion overview + ring */}
      <Box
        component={motion.div}
        initial={fadeInUp.initial}
        animate={fadeInUp.animate}
        transition={{ ...fadeInUp.transition, delay: 0.08 }}
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { md: "center" },
          gap: 3,
          mb: 4,
          p: 3,
          borderRadius: 2,
          bgcolor: "action.hover",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          sx={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}
        >
          <ProgressRingChart value={overallCompletion} size={100} fontSize={24} />
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Overall completion
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {totalCompleted} of {totalContentDisplay} items completed
            </Typography>
          </Box>
        </Box>
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          sx={{ flex: 1, minHeight: 240 }}
        >
          <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
            Content Completion Overview
          </Typography>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              />
              <YAxis tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend
                wrapperStyle={{
                  paddingTop: 8,
                  color: theme.palette.text.primary,
                }}
                formatter={(value) => (
                  <span style={{ color: theme.palette.text.primary, fontWeight: 500 }}>{value}</span>
                )}
              />
              <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" stackId="a" fill="#e5e7eb" name="Pending" radius={[0, 0, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* KPI strip — full width row, 5 equal cards */}
      <Box
        component={motion.div}
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        sx={{
          mb: 4,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          width: "100%",
        }}
      >
        {kpiItems.map((kpi, i) => (
          <Box
            key={kpi.label}
            component={motion.div}
            variants={staggerItem}
            sx={{ ...STAT_CARD, flex: "1 1 0", minWidth: { xs: "100%", sm: 140 } }}
          >
            <Typography variant="h4" fontWeight={700} color="text.primary">
              {kpi.value}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.25, mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {kpi.label}
              </Typography>
              <MuiTooltip title={kpi.tip} placement="top" arrow>
                <IconButton size="small" sx={{ p: 0.25, color: "text.secondary" }}>
                  <IconWrapper icon="mdi:information-outline" size={16} color="currentColor" />
                </IconButton>
              </MuiTooltip>
            </Box>
          </Box>
        ))}
      </Box>

      {/* By content type — accent cards + tinted stat tiles */}
      <Box
        component={motion.div}
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        sx={{
          mb: 0,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          p: { xs: 2, sm: 2.5, md: 3 },
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.06 : 0.02),
        }}
      >
        <Box
          component={motion.div}
          variants={staggerItem}
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            mb: 2.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                border: "1px solid",
                borderColor: alpha(theme.palette.primary.main, 0.25),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <IconWrapper icon="mdi:view-grid-outline" size={22} color={theme.palette.primary.main} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                By content type
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, maxWidth: 560 }}>
                Completion and detail metrics for videos, articles, course quizzes, coding problems, mock interviews, and assessments—aligned with the overview chart above.
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
            gap: 3,
            alignItems: "stretch",
          }}
        >
          <Box sx={{ display: "flex", minWidth: 0 }}>
            <ContentTypeBreakdownCard
              accentColor={theme.palette.primary.main}
              icon={<IconWrapper icon="mdi:play-circle" size={24} color="#ffffff" />}
              title="Videos"
              subtitle={`${data.videos.completed} of ${data.videos.totalAssigned} completed`}
              completionPct={videoCompletion}
            >
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5 }}>
                  <Box>
                    <Box sx={miniStat(theme.palette.primary.main)}>
                      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                        Avg watch
                      </Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.25 }}>
                        {data.videos.averageWatchPercentage}%
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Box sx={miniStat(theme.palette.primary.main)}>
                      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                        Rewatches
                      </Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.25 }}>
                        {data.videos.rewatchCount}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Box sx={miniStat(theme.palette.primary.main)}>
                      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                        Engagement
                      </Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.25 }}>
                        {data.videos.engagementCount != null ? videoEngagement : `${videoEngagement}%`}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Box sx={miniStat(theme.palette.primary.main)}>
                      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                        Skipped
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="error.main" sx={{ mt: 0.25 }}>
                        {skippedVideosCount}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </ContentTypeBreakdownCard>
          </Box>

          <Box sx={{ display: "flex", minWidth: 0 }}>
            <ContentTypeBreakdownCard
              accentColor={theme.palette.success.main}
              icon={<IconWrapper icon="mdi:book-open" size={24} color="#ffffff" />}
              title="Articles"
              subtitle={`${data.articles.read} of ${data.articles.totalAssigned} read`}
              completionPct={articleCompletion}
            >
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5 }}>
                  <Box>
                    <Box sx={miniStat(theme.palette.success.main)}>
                      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                        Pending
                      </Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.25 }}>
                        {articlesPending}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Box sx={miniStat(theme.palette.success.main)}>
                      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                        Assigned
                      </Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.25 }}>
                        {data.articles.totalAssigned}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Box sx={miniStat(theme.palette.success.main)}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexWrap: "wrap" }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Estimated read
                        </Typography>
                        <MuiTooltip title="Average lesson estimate across all assigned articles." placement="top" arrow>
                          <IconButton size="small" sx={{ p: 0.25, color: "text.secondary" }}>
                            <IconWrapper icon="mdi:information-outline" size={14} color="currentColor" />
                          </IconButton>
                        </MuiTooltip>
                      </Box>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.25 }}>
                        {data.articles.totalAssigned > 0 ? `${data.articles.typicalReadTimePerArticle}m` : "—"}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Box sx={miniStat(theme.palette.success.main)}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexWrap: "wrap" }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Your read time
                        </Typography>
                        <MuiTooltip title="Your average when read time is saved (e.g. Mark as read)." placement="top" arrow>
                          <IconButton size="small" sx={{ p: 0.25, color: "text.secondary" }}>
                            <IconWrapper icon="mdi:information-outline" size={14} color="currentColor" />
                          </IconButton>
                        </MuiTooltip>
                      </Box>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.25 }}>
                        {data.articles.read === 0 ? "—" : `${data.articles.averageReadingTime}m`}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </ContentTypeBreakdownCard>
          </Box>

          <Box sx={{ display: "flex", minWidth: 0 }}>
            <ContentTypeBreakdownCard
              accentColor={theme.palette.warning.main}
              icon={<IconWrapper icon="mdi:help-circle-outline" size={24} color="#ffffff" />}
              title="Course quizzes"
              subtitle={`${data.practice.mcqsAttempted} of ${data.practice.mcqsTotal} MCQs`}
              completionPct={mcqCompletion}
            >
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5 }}>
                  <Box>
                    <Box sx={miniStat(theme.palette.warning.main)}>
                      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                        Quiz sections
                      </Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.25 }}>
                        {quizSectionsCompleted} / {quizSectionsTotal}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Box sx={miniStat(theme.palette.warning.main)}>
                      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                        Pending MCQs
                      </Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.25 }}>
                        {mcqsPending}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </ContentTypeBreakdownCard>
          </Box>

          <Box sx={{ display: "flex", minWidth: 0 }}>
            <ContentTypeBreakdownCard
              accentColor={theme.palette.info.main}
              icon={<IconWrapper icon="mdi:code-braces" size={24} color="#ffffff" />}
              title="Coding problems"
              subtitle={`${data.codingProblems.completed} of ${data.codingProblems.totalAssigned} solved`}
              completionPct={codingCompletion}
            >
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5 }}>
                  <Box>
                    <Box sx={miniStat(theme.palette.info.main)}>
                      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                        Pending
                      </Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.25 }}>
                        {codingPending}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Box sx={miniStat(theme.palette.info.main)}>
                      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                        Assigned
                      </Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.25 }}>
                        {data.codingProblems.totalAssigned}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ gridColumn: "1 / -1" }}>
                    <Box sx={miniStat(theme.palette.info.main)}>
                      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                        Submissions
                      </Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.25 }}>
                        {data.codingProblems.submissionCount}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </ContentTypeBreakdownCard>
          </Box>

          <Box sx={{ display: "flex", minWidth: 0 }}>
            <ContentTypeBreakdownCard
              accentColor={MOCK_INTERVIEW_ACCENT}
              icon={<IconWrapper icon="mdi:account-voice" size={24} color="#ffffff" />}
              title="Mock interviews"
              subtitle={`${data.mockInterviews.completed} of ${data.mockInterviews.totalAssigned} completed`}
              completionPct={data.mockInterviews.completionPercentage}
            >
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5 }}>
                  <Box>
                    <Box sx={miniStat(MOCK_INTERVIEW_ACCENT)}>
                      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                        Pending
                      </Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.25 }}>
                        {mockInterviewPending}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Box sx={miniStat(MOCK_INTERVIEW_ACCENT)}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexWrap: "wrap" }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Active total
                        </Typography>
                        <MuiTooltip
                          title="Scheduled, in progress, or completed (excludes cancelled sessions)."
                          placement="top"
                          arrow
                        >
                          <IconButton size="small" sx={{ p: 0.25, color: "text.secondary" }}>
                            <IconWrapper icon="mdi:information-outline" size={14} color="currentColor" />
                          </IconButton>
                        </MuiTooltip>
                      </Box>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.25 }}>
                        {data.mockInterviews.totalAssigned}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Box sx={miniStat(MOCK_INTERVIEW_ACCENT)}>
                      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                        Completion
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight={700}
                        sx={{ mt: 0.25, color: proficiencyBandColor(data.mockInterviews.completionPercentage) }}
                      >
                        {data.mockInterviews.completionPercentage}%
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Box sx={miniStat(MOCK_INTERVIEW_ACCENT)}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexWrap: "wrap" }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Avg score
                        </Typography>
                        <MuiTooltip
                          title="Average of per-interview scores from evaluation (e.g. overall_percentage). Interviews without a numeric score are omitted."
                          placement="top"
                          arrow
                        >
                          <IconButton size="small" sx={{ p: 0.25, color: "text.secondary" }}>
                            <IconWrapper icon="mdi:information-outline" size={14} color="currentColor" />
                          </IconButton>
                        </MuiTooltip>
                      </Box>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.25 }}>
                        {data.mockInterviews.averageScore == null ? "—" : `${data.mockInterviews.averageScore}%`}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </ContentTypeBreakdownCard>
          </Box>

          <Box sx={{ display: "flex", minWidth: 0 }}>
            <ContentTypeBreakdownCard
              accentColor={theme.palette.secondary.main}
              icon={<IconWrapper icon="mdi:clipboard-text-outline" size={24} color="#ffffff" />}
              title="Assessments"
              subtitle={
                totalAssessmentsPresent > 0
                  ? `${data.practice.assessmentsAttempted} of ${totalAssessmentsPresent} attempted`
                  : "No assessments assigned"
              }
              completionPct={assessmentChipPct}
            >
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5 }}>
                  <Box>
                    <Box sx={miniStat(theme.palette.secondary.main)}>
                      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                        Available
                      </Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.25 }}>
                        {totalAssessmentsPresent}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Box sx={miniStat(theme.palette.secondary.main)}>
                      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                        Missed
                      </Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.25 }} color="error.main">
                        {data.practice.assessmentsMissed}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ gridColumn: "1 / -1" }}>
                    <Box sx={miniStat(theme.palette.secondary.main)}>
                      <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                        Completion
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight={700}
                        sx={{ mt: 0.25, color: proficiencyBandColor(assessmentCompletionPct) }}
                      >
                        {assessmentCompletionPct}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </ContentTypeBreakdownCard>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
