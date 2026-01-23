"use client";

import { Box, Typography, Paper, Grid, Chip, LinearProgress } from "@mui/material";
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

interface LearningConsumptionSectionProps {
  data: LearningConsumption;
}

export function LearningConsumptionSection({ data }: LearningConsumptionSectionProps) {
  // Calculate completion percentages
  const videoCompletion = Math.round((data.videos.completed / data.videos.totalAssigned) * 100);
  const articleCompletion = Math.round((data.articles.read / data.articles.totalAssigned) * 100);
  const mcqCompletion = Math.round((data.practice.mcqsAttempted / data.practice.mcqsTotal) * 100);
  const overallCompletion = Math.round(
    ((data.videos.completed + data.articles.read + data.practice.mcqsAttempted) /
      (data.videos.totalAssigned + data.articles.totalAssigned + data.practice.mcqsTotal)) *
      100
  );

  // Calculate engagement scores
  const videoEngagement = Math.round(
    (data.videos.averageWatchPercentage * 0.7 + (videoCompletion * 0.3))
  );
  const articleEngagement = Math.round(
    ((data.articles.averageReadingTime / data.articles.expectedReadingTime) * 100 * 0.6) +
    (articleCompletion * 0.4)
  );
  const practiceEngagement = Math.round(
    (mcqCompletion * 0.5) +
    ((data.practice.subjectiveSubmitted / (data.practice.subjectiveSubmitted + data.practice.subjectivePending)) * 100 * 0.3) +
    ((data.practice.assessmentsAttempted / (data.practice.assessmentsAttempted + data.practice.assessmentsMissed)) * 100 * 0.2)
  );

  // Calculate efficiency metrics
  const readingEfficiency = Math.round(
    (data.articles.expectedReadingTime / data.articles.averageReadingTime) * 100
  );
  const skippedVideosCount = data.videos.skippedVideos.length;
  const skippedPercentage = Math.round((skippedVideosCount / data.videos.totalAssigned) * 100);

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

  const pieData = [
    { name: "Videos", value: data.videos.completed, color: "#0a66c2" },
    { name: "Articles", value: data.articles.read, color: "#10b981" },
    { name: "MCQs", value: data.practice.mcqsAttempted, color: "#f59e0b" },
    { name: "Subjective", value: data.practice.subjectiveSubmitted, color: "#6366f1" },
  ];

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return "#10b981";
    if (percentage >= 60) return "#0a66c2";
    if (percentage >= 40) return "#f59e0b";
    return "#ef4444";
  };

  const getEngagementColor = (score: number) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#0a66c2";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        borderRadius: 3,
        border: "1px solid rgba(0,0,0,0.08)",
        backgroundColor: "#ffffff",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          pb: 3,
          borderBottom: "2px solid rgba(0,0,0,0.08)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0a66c2 0%, #004182 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(10, 102, 194, 0.3)",
            }}
          >
            <IconWrapper icon="mdi:chart-line" size={28} color="#ffffff" />
          </Box>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#000000",
                fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                lineHeight: 1.2,
              }}
            >
              Learning Consumption Metrics
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#666666",
                fontSize: "0.875rem",
                mt: 0.5,
              }}
            >
              Track your learning progress and engagement across all content types
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Overall Metrics Summary */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              backgroundColor: "#f9fafb",
              border: "2px solid rgba(10, 102, 194, 0.2)",
              textAlign: "center",
            }}
          >
            <ProgressRingChart value={overallCompletion} size={80} fontSize={20} />
            <Typography
              variant="body2"
              sx={{
                color: "#666666",
                fontSize: "0.875rem",
                mt: 1.5,
                fontWeight: 500,
              }}
            >
              Overall Completion
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              backgroundColor: "#f9fafb",
              border: "2px solid rgba(16, 185, 129, 0.2)",
              textAlign: "center",
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#000000",
                fontSize: "2rem",
                mb: 0.5,
              }}
            >
              {data.videos.completed + data.articles.read + data.practice.mcqsAttempted}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#666666",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              Total Completed
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              backgroundColor: "#f9fafb",
              border: "2px solid rgba(245, 158, 11, 0.2)",
              textAlign: "center",
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#000000",
                fontSize: "2rem",
                mb: 0.5,
              }}
            >
              {data.videos.rewatchCount + data.articles.markedAsHelpful}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#666666",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              Engagement Actions
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              backgroundColor: "#f9fafb",
              border: "2px solid rgba(99, 102, 241, 0.2)",
              textAlign: "center",
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#000000",
                fontSize: "2rem",
                mb: 0.5,
              }}
            >
              {data.practice.assessmentsAttempted}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#666666",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              Assessments Taken
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Detailed Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Videos Card */}
        <Grid item xs={12} md={4}>
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: "#ffffff",
              border: "2px solid rgba(10, 102, 194, 0.2)",
              background: "linear-gradient(135deg, rgba(10, 102, 194, 0.05) 0%, rgba(10, 102, 194, 0.02) 100%)",
              transition: "all 0.2s ease",
              "&:hover": {
                boxShadow: "0 8px 24px rgba(10, 102, 194, 0.15)",
                transform: "translateY(-4px)",
                borderColor: "rgba(10, 102, 194, 0.4)",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #0a66c2 0%, #004182 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(10, 102, 194, 0.3)",
                }}
              >
                <IconWrapper icon="mdi:play-circle" size={28} color="#ffffff" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: "#000000",
                    fontSize: "1.25rem",
                  }}
                >
                  Videos
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#666666",
                    fontSize: "0.75rem",
                  }}
                >
                  Video Learning Progress
                </Typography>
              </Box>
            </Box>

            {/* Completion Progress */}
            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" sx={{ color: "#666666", fontWeight: 500 }}>
                  Completion
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: getCompletionColor(videoCompletion),
                  }}
                >
                  {videoCompletion}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={videoCompletion}
                sx={{
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: "#e5e7eb",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: getCompletionColor(videoCompletion),
                    borderRadius: 2,
                  },
                }}
              />
              <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem", mt: 0.5, display: "block" }}>
                {data.videos.completed} of {data.videos.totalAssigned} videos completed
              </Typography>
            </Box>

            {/* Metrics Grid */}
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.7rem", display: "block", mb: 0.5 }}>
                    Avg Watch
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#000000", fontSize: "1.125rem" }}>
                    {data.videos.averageWatchPercentage}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.7rem", display: "block", mb: 0.5 }}>
                    Rewatches
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#000000", fontSize: "1.125rem" }}>
                    {data.videos.rewatchCount}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.7rem", display: "block", mb: 0.5 }}>
                    Engagement
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: getEngagementColor(videoEngagement),
                      fontSize: "1.125rem",
                    }}
                  >
                    {videoEngagement}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.7rem", display: "block", mb: 0.5 }}>
                    Skipped
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#ef4444", fontSize: "1.125rem" }}>
                    {skippedVideosCount}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Articles Card */}
        <Grid item xs={12} md={4}>
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: "#ffffff",
              border: "2px solid rgba(16, 185, 129, 0.2)",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)",
              transition: "all 0.2s ease",
              "&:hover": {
                boxShadow: "0 8px 24px rgba(16, 185, 129, 0.15)",
                transform: "translateY(-4px)",
                borderColor: "rgba(16, 185, 129, 0.4)",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                }}
              >
                <IconWrapper icon="mdi:book-open" size={28} color="#ffffff" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: "#000000",
                    fontSize: "1.25rem",
                  }}
                >
                  Articles
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#666666",
                    fontSize: "0.75rem",
                  }}
                >
                  Reading Progress
                </Typography>
              </Box>
            </Box>

            {/* Completion Progress */}
            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" sx={{ color: "#666666", fontWeight: 500 }}>
                  Completion
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: getCompletionColor(articleCompletion),
                  }}
                >
                  {articleCompletion}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={articleCompletion}
                sx={{
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: "#e5e7eb",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: getCompletionColor(articleCompletion),
                    borderRadius: 2,
                  },
                }}
              />
              <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem", mt: 0.5, display: "block" }}>
                {data.articles.read} of {data.articles.totalAssigned} articles read
              </Typography>
            </Box>

            {/* Metrics Grid */}
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.7rem", display: "block", mb: 0.5 }}>
                    Avg Time
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#000000", fontSize: "1.125rem" }}>
                    {data.articles.averageReadingTime}m
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.7rem", display: "block", mb: 0.5 }}>
                    Expected
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#000000", fontSize: "1.125rem" }}>
                    {data.articles.expectedReadingTime}m
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.7rem", display: "block", mb: 0.5 }}>
                    Efficiency
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: readingEfficiency > 100 ? "#10b981" : "#f59e0b",
                      fontSize: "1.125rem",
                    }}
                  >
                    {readingEfficiency}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.7rem", display: "block", mb: 0.5 }}>
                    Helpful
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#10b981", fontSize: "1.125rem" }}>
                    {data.articles.markedAsHelpful}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Practice Card */}
        <Grid item xs={12} md={4}>
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: "#ffffff",
              border: "2px solid rgba(245, 158, 11, 0.2)",
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)",
              transition: "all 0.2s ease",
              "&:hover": {
                boxShadow: "0 8px 24px rgba(245, 158, 11, 0.15)",
                transform: "translateY(-4px)",
                borderColor: "rgba(245, 158, 11, 0.4)",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                }}
              >
                <IconWrapper icon="mdi:clipboard-check" size={28} color="#ffffff" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: "#000000",
                    fontSize: "1.25rem",
                  }}
                >
                  Practice
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#666666",
                    fontSize: "0.75rem",
                  }}
                >
                  Practice & Assessments
                </Typography>
              </Box>
            </Box>

            {/* Completion Progress */}
            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" sx={{ color: "#666666", fontWeight: 500 }}>
                  MCQ Completion
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: getCompletionColor(mcqCompletion),
                  }}
                >
                  {mcqCompletion}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={mcqCompletion}
                sx={{
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: "#e5e7eb",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: getCompletionColor(mcqCompletion),
                    borderRadius: 2,
                  },
                }}
              />
              <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem", mt: 0.5, display: "block" }}>
                {data.practice.mcqsAttempted} of {data.practice.mcqsTotal} MCQs attempted
              </Typography>
            </Box>

            {/* Metrics Grid */}
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.7rem", display: "block", mb: 0.5 }}>
                    Subjective
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#000000", fontSize: "1.125rem" }}>
                    {data.practice.subjectiveSubmitted}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.65rem" }}>
                    {data.practice.subjectivePending} pending
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.7rem", display: "block", mb: 0.5 }}>
                    Assessments
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#000000", fontSize: "1.125rem" }}>
                    {data.practice.assessmentsAttempted}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#ef4444", fontSize: "0.65rem" }}>
                    {data.practice.assessmentsMissed} missed
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.7rem", display: "block", mb: 0.5 }}>
                    Engagement
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: getEngagementColor(practiceEngagement),
                      fontSize: "1.125rem",
                    }}
                  >
                    {practiceEngagement}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.7rem", display: "block", mb: 0.5 }}>
                    Total Items
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#000000", fontSize: "1.125rem" }}>
                    {data.practice.mcqsTotal + data.practice.subjectiveSubmitted + data.practice.subjectivePending}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Stacked Bar Chart */}
        <Grid item xs={12}>
          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: "#ffffff",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "#000000",
                fontSize: "1rem",
                mb: 2,
              }}
            >
              Content Completion Overview
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="category"
                  stroke="#666666"
                  fontSize={12}
                  tick={{ fill: "#666666" }}
                />
                <YAxis stroke="#666666" fontSize={12} tick={{ fill: "#666666" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                  }}
                />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" stackId="a" fill="#e5e7eb" name="Pending" radius={[0, 0, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
