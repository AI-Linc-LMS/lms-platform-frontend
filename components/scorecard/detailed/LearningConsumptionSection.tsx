"use client";

import { Box, Typography, Paper, Grid, LinearProgress, Tooltip as MuiTooltip, IconButton } from "@mui/material";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { LearningConsumption } from "@/lib/types/scorecard.types";
import { ProgressRingChart } from "../charts/ProgressRingChart";
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

const MINI_STAT = {
  p: 1.25,
  borderRadius: 1.5,
  width: "100%",
  height: 64,
  minHeight: 64,
  minWidth: 0,
  boxSizing: "border-box" as const,
  bgcolor: "action.selected",
  border: "1px solid",
  borderColor: "divider",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
};

function getCompletionColor(percentage: number) {
  if (percentage >= 80) return "#10b981";
  if (percentage >= 60) return "#0a66c2";
  if (percentage >= 40) return "#f59e0b";
  return "#ef4444";
}

function getEngagementColor(score: number) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#0a66c2";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
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
    "Total content across all courses the student is enrolled in: articles, quizzes, and videos.",
  totalCompleted:
    "Total number of items (videos, articles, and MCQs) the student has completed across all enrolled courses.",
  assessmentsTaken: "Number of assessments the student has attempted or submitted.",
  assessmentsAvailable:
    "Total number of assessments available to the student (from their enrolled courses or assigned to them).",
  engagementActions: "Rewatches on videos plus articles marked as helpful.",
};

export function LearningConsumptionSection({ data }: LearningConsumptionSectionProps) {
  const totalContent =
    data.totalContent ??
    data.videos.totalAssigned +
      data.articles.totalAssigned +
      (data.practice.totalQuizContents ?? 0);
  const totalContentDisplay = data.totalContent ?? totalContent;
  const totalCompleted =
    data.contentCompletionOverview?.totalCompleted ??
    data.videos.completed + data.articles.read + data.practice.mcqsAttempted;

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
  const overallCompletion =
    (totalContent || 0) > 0 ? Math.round((totalCompleted / (totalContent || 1)) * 100) : 0;

  const videoEngagement =
    data.videos.engagementCount != null
      ? data.videos.engagementCount
      : Math.round(data.videos.averageWatchPercentage * 0.7 + videoCompletion * 0.3);
  const articleEngagement =
    data.articles.expectedReadingTime > 0
      ? Math.round(
          (data.articles.averageReadingTime / data.articles.expectedReadingTime) * 100 * 0.6 +
            articleCompletion * 0.4
        )
      : articleCompletion;
  const subTotal = data.practice.subjectiveSubmitted + data.practice.subjectivePending;
  const assessTotal = data.practice.assessmentsAttempted + data.practice.assessmentsMissed;
  const practiceEngagement =
    data.practice.assessmentsEngagementPercentage != null
      ? data.practice.assessmentsEngagementPercentage
      : Math.round(
          mcqCompletion * 0.5 +
            (subTotal > 0 ? (data.practice.subjectiveSubmitted / subTotal) * 100 * 0.3 : 0) +
            (assessTotal > 0 ? (data.practice.assessmentsAttempted / assessTotal) * 100 * 0.2 : 0)
        );

  const readingEfficiency =
    data.articles.efficiencyPercentage ??
    (data.articles.averageReadingTime > 0 && data.articles.expectedReadingTime > 0
      ? Math.round((data.articles.expectedReadingTime / data.articles.averageReadingTime) * 100)
      : 0);
  const skippedVideosCount = data.videos.skippedCount ?? data.videos.skippedVideos?.length ?? 0;
  const totalAssessmentsPresent = data.practice.totalAssessmentsPresent ?? 0;
  const practiceTotalItems =
    data.practice.totalItems ??
    (data.practice.totalQuizContents != null
      ? data.practice.totalQuizContents + totalAssessmentsPresent
      : data.practice.mcqsTotal + data.practice.subjectiveSubmitted + data.practice.subjectivePending);

  const quizzesInCourseTotal = data.practice.totalQuizContents ?? data.practice.mcqsTotal;
  const quizzesPending = Math.max(0, quizzesInCourseTotal - data.practice.mcqsAttempted);
  const practiceDone = data.practice.mcqsAttempted + data.practice.assessmentsAttempted;

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
      category: "MCQs",
      assigned: data.practice.mcqsTotal,
      completed: data.practice.mcqsAttempted,
      pending: data.practice.mcqsTotal - data.practice.mcqsAttempted,
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
            Progress and engagement across videos, articles, and practice
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
          sx={{ flex: 1, minHeight: 220 }}
        >
          <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
            Content Completion Overview
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend />
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
        <Box component={motion.div} variants={staggerItem} sx={{ ...STAT_CARD, flex: "1 1 0", minWidth: { xs: "100%", sm: 140 } }}>
              <Typography variant="h4" fontWeight={700} color="text.primary">
                {totalContentDisplay}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.25, mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Total Content
                </Typography>
                <MuiTooltip title={KPI_TOOLTIPS.totalContent} placement="top" arrow>
                  <IconButton size="small" sx={{ p: 0.25, color: "text.secondary" }}>
                    <IconWrapper icon="mdi:information-outline" size={16} color="currentColor" />
                  </IconButton>
                </MuiTooltip>
              </Box>
            </Box>
        <Box component={motion.div} variants={staggerItem} sx={{ ...STAT_CARD, flex: "1 1 0", minWidth: { xs: "100%", sm: 140 } }}>
              <Typography variant="h4" fontWeight={700} color="text.primary">
                {totalCompleted}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.25, mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Total Completed
                </Typography>
                <MuiTooltip title={KPI_TOOLTIPS.totalCompleted} placement="top" arrow>
                  <IconButton size="small" sx={{ p: 0.25, color: "text.secondary" }}>
                    <IconWrapper icon="mdi:information-outline" size={16} color="currentColor" />
                  </IconButton>
                </MuiTooltip>
              </Box>
            </Box>
        <Box component={motion.div} variants={staggerItem} sx={{ ...STAT_CARD, flex: "1 1 0", minWidth: { xs: "100%", sm: 140 } }}>
              <Typography variant="h4" fontWeight={700} color="text.primary">
                {data.practice.assessmentsAttempted}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.25, mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Assessments Taken
                </Typography>
                <MuiTooltip title={KPI_TOOLTIPS.assessmentsTaken} placement="top" arrow>
                  <IconButton size="small" sx={{ p: 0.25, color: "text.secondary" }}>
                    <IconWrapper icon="mdi:information-outline" size={16} color="currentColor" />
                  </IconButton>
                </MuiTooltip>
              </Box>
            </Box>
        <Box component={motion.div} variants={staggerItem} sx={{ ...STAT_CARD, flex: "1 1 0", minWidth: { xs: "100%", sm: 140 } }}>
              <Typography variant="h4" fontWeight={700} color="text.primary">
                {totalAssessmentsPresent}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.25, mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Assessments Available
                </Typography>
                <MuiTooltip title={KPI_TOOLTIPS.assessmentsAvailable} placement="top" arrow>
                  <IconButton size="small" sx={{ p: 0.25, color: "text.secondary" }}>
                    <IconWrapper icon="mdi:information-outline" size={16} color="currentColor" />
                  </IconButton>
                </MuiTooltip>
              </Box>
            </Box>
        <Box component={motion.div} variants={staggerItem} sx={{ ...STAT_CARD, flex: "1 1 0", minWidth: { xs: "100%", sm: 140 } }}>
              <Typography variant="h4" fontWeight={700} color="text.primary">
                {data.videos.rewatchCount + data.articles.markedAsHelpful}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.25, mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Engagement Actions
                </Typography>
                <MuiTooltip title={KPI_TOOLTIPS.engagementActions} placement="top" arrow>
                  <IconButton size="small" sx={{ p: 0.25, color: "text.secondary" }}>
                    <IconWrapper icon="mdi:information-outline" size={16} color="currentColor" />
                  </IconButton>
                </MuiTooltip>
              </Box>
            </Box>
      </Box>

      {/* Content type cards: Videos, Articles, Practice */}
      <Box
        component={motion.div}
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        sx={{ mb: 0 }}
      >
        <Box
          component={motion.div}
          variants={staggerItem}
          sx={{ mb: 2 }}
        >
          <Typography variant="subtitle1" fontWeight={600} color="text.primary">
            By content type
          </Typography>
        </Box>
        <Grid container spacing={3} sx={{ alignItems: "stretch" }}>
          {/* Videos */}
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex" }}>
            <Box
              component={motion.div}
              variants={staggerItem}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              sx={CONTENT_CARD}
            >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  bgcolor: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconWrapper icon="mdi:play-circle" size={22} color="#ffffff" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Videos
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {data.videos.completed} of {data.videos.totalAssigned} completed
                </Typography>
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={videoCompletion}
              sx={{
                height: 8,
                borderRadius: 1,
                mb: 2,
                flexShrink: 0,
                "& .MuiLinearProgress-bar": { borderRadius: 1, bgcolor: getCompletionColor(videoCompletion) },
              }}
            />
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <Grid container spacing={1}>
                <Grid size={6}>
                  <Box sx={MINI_STAT}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Avg Watch
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {data.videos.averageWatchPercentage}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={6}>
                  <Box sx={MINI_STAT}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Rewatches
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {data.videos.rewatchCount}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={6}>
                  <Box sx={MINI_STAT}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Engagement
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {data.videos.engagementCount != null ? videoEngagement : `${videoEngagement}%`}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={6}>
                  <Box sx={MINI_STAT}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Skipped
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="error.main">
                      {skippedVideosCount}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Grid>

        {/* Articles */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex" }}>
          <Box
            component={motion.div}
            variants={staggerItem}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            sx={CONTENT_CARD}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  bgcolor: "success.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconWrapper icon="mdi:book-open" size={22} color="#ffffff" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Articles
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {data.articles.read} of {data.articles.totalAssigned} read
                </Typography>
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={articleCompletion}
              sx={{
                height: 8,
                borderRadius: 1,
                mb: 2,
                flexShrink: 0,
                "& .MuiLinearProgress-bar": { borderRadius: 1, bgcolor: getCompletionColor(articleCompletion) },
              }}
            />
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <Grid container spacing={1}>
                <Grid size={6}>
                  <Box sx={MINI_STAT}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexWrap: "wrap" }}>
                      <Typography variant="caption" color="text.secondary">
                        Avg Time
                      </Typography>
                      <MuiTooltip
                        title="Average time you actually spent reading each article (from when you opened it until you clicked Mark as read)."
                        placement="top"
                        arrow
                      >
                        <IconButton size="small" sx={{ p: 0.25, color: "text.secondary" }}>
                          <IconWrapper icon="mdi:information-outline" size={14} color="currentColor" />
                        </IconButton>
                      </MuiTooltip>
                    </Box>
                    <Typography variant="body2" fontWeight={700}>
                      {data.articles.averageReadingTime}m
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={6}>
                  <Box sx={MINI_STAT}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexWrap: "wrap" }}>
                      <Typography variant="caption" color="text.secondary">
                        Expected
                      </Typography>
                      <MuiTooltip
                        title="Mean of the estimated reading time (in minutes) across all assigned articles."
                        placement="top"
                        arrow
                      >
                        <IconButton size="small" sx={{ p: 0.25, color: "text.secondary" }}>
                          <IconWrapper icon="mdi:information-outline" size={14} color="currentColor" />
                        </IconButton>
                      </MuiTooltip>
                    </Box>
                    <Typography variant="body2" fontWeight={700}>
                      {data.articles.expectedReadingTime}m
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={6}>
                  <Box sx={MINI_STAT}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Efficiency
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color={readingEfficiency > 100 ? "success.main" : "warning.main"}
                    >
                      {readingEfficiency}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={6}>
                  <Box sx={MINI_STAT}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Helpful
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="success.main">
                      {data.articles.markedAsHelpful}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Grid>

        {/* Practice */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex" }}>
          <Box
            component={motion.div}
            variants={staggerItem}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            sx={CONTENT_CARD}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  bgcolor: "warning.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconWrapper icon="mdi:clipboard-check" size={22} color="#ffffff" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Practice & Assessments
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {data.practice.mcqsAttempted} of {data.practice.mcqsTotal} MCQs
                </Typography>
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={mcqCompletion}
              sx={{
                height: 8,
                borderRadius: 1,
                mb: 2,
                flexShrink: 0,
                "& .MuiLinearProgress-bar": { borderRadius: 1, bgcolor: getCompletionColor(mcqCompletion) },
              }}
            />
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <Grid container spacing={1}>
                <Grid size={6}>
                  <Box sx={MINI_STAT}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Quizzes in course
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {quizzesInCourseTotal}
                      <Box component="span" sx={{ fontWeight: 300, ml: 1 }}>
                        ({quizzesPending} pending)
                      </Box>
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={6}>
                  <Box sx={MINI_STAT}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Assessments
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {data.practice.assessmentsAttempted}
                      <Box component="span" sx={{ color: "error.main", fontWeight: 300, ml: 1 }}>
                        ({data.practice.assessmentsMissed} missed)
                      </Box>
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={6}>
                  <Box sx={MINI_STAT}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Engagement
                    </Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: getEngagementColor(practiceEngagement) }}>
                      {practiceEngagement}%
                      <Box component="span" sx={{ fontWeight: 300, ml: 1 }}>
                        ({practiceDone} of {practiceTotalItems})
                      </Box>
                    </Typography>
                  </Box>
                </Grid>
              <Grid size={6}>
                <Box sx={MINI_STAT}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Total Items
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {practiceTotalItems}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            </Box>
          </Box>
        </Grid>
      </Grid>
      </Box>
    </Paper>
  );
}
