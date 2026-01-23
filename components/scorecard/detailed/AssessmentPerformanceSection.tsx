"use client";

import { useMemo } from "react";
import { Box, Typography, Paper, Grid, Chip, LinearProgress } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AssessmentPerformance } from "@/lib/types/scorecard.types";
import { ProgressRingChart } from "../charts/ProgressRingChart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

interface AssessmentPerformanceSectionProps {
  assessments: AssessmentPerformance[];
}

export function AssessmentPerformanceSection({
  assessments,
}: AssessmentPerformanceSectionProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#0a66c2";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "linear-gradient(135deg, #10b981 0%, #059669 100%)";
    if (score >= 60) return "linear-gradient(135deg, #0a66c2 0%, #004182 100%)";
    if (score >= 40) return "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
    return "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalAssessments = assessments.length;
    const avgScore = Math.round(
      assessments.reduce((sum, a) => sum + a.score, 0) / totalAssessments
    );
    const avgAccuracy = Math.round(
      assessments.reduce((sum, a) => sum + a.accuracy, 0) / totalAssessments
    );
    const totalCorrect = assessments.reduce(
      (sum, a) => sum + a.questionAnalytics.correct,
      0
    );
    const totalIncorrect = assessments.reduce(
      (sum, a) => sum + a.questionAnalytics.incorrect,
      0
    );
    const totalSkipped = assessments.reduce(
      (sum, a) => sum + a.questionAnalytics.skipped,
      0
    );
    const bestAssessment = assessments.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    return {
      totalAssessments,
      avgScore,
      avgAccuracy,
      totalCorrect,
      totalIncorrect,
      totalSkipped,
      bestAssessment,
    };
  }, [assessments]);

  // Prepare chart data
  const scoreChartData = assessments.map((a) => ({
    name: a.assessmentName.length > 15 ? a.assessmentName.substring(0, 15) + "..." : a.assessmentName,
    score: a.score,
    accuracy: a.accuracy,
  }));

  const questionDistributionData = [
    { name: "Correct", value: summaryStats.totalCorrect, color: "#10b981" },
    { name: "Incorrect", value: summaryStats.totalIncorrect, color: "#ef4444" },
    { name: "Skipped", value: summaryStats.totalSkipped, color: "#f59e0b" },
  ];

  const calculateTimeEfficiency = (assessment: AssessmentPerformance) => {
    const timeUsed = (assessment.timeTaken / assessment.timeAllowed) * 100;
    return Math.round(timeUsed);
  };

  const getDifficultyColor = (difficulty: "easy" | "medium" | "hard") => {
    switch (difficulty) {
      case "easy":
        return "#10b981";
      case "medium":
        return "#0a66c2";
      case "hard":
        return "#ef4444";
    }
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
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
              Assessment & Test Performance
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#666666",
                fontSize: "0.875rem",
                mt: 0.5,
              }}
            >
              Detailed analysis of your assessment performance and progress
            </Typography>
          </Box>
        </Box>

        {/* Summary Stats */}
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "#f9fafb",
                border: "1px solid rgba(0,0,0,0.08)",
                textAlign: "center",
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: "#000000",
                  fontSize: "1.75rem",
                  mb: 0.5,
                }}
              >
                {summaryStats.totalAssessments}
              </Typography>
              <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                Total Assessments
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "#f9fafb",
                border: "1px solid rgba(0,0,0,0.08)",
                textAlign: "center",
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: getScoreColor(summaryStats.avgScore),
                  fontSize: "1.75rem",
                  mb: 0.5,
                }}
              >
                {summaryStats.avgScore}%
              </Typography>
              <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                Average Score
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "#f9fafb",
                border: "1px solid rgba(0,0,0,0.08)",
                textAlign: "center",
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: "#0a66c2",
                  fontSize: "1.75rem",
                  mb: 0.5,
                }}
              >
                {summaryStats.avgAccuracy}%
              </Typography>
              <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                Avg Accuracy
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "#f0fdf4",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                textAlign: "center",
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: "#10b981",
                  fontSize: "1.75rem",
                  mb: 0.5,
                }}
              >
                {summaryStats.bestAssessment.score}%
              </Typography>
              <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                Best Score
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
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
              Score & Accuracy Trends
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={scoreChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  stroke="#666666"
                  fontSize={11}
                  tick={{ fill: "#666666" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#666666" fontSize={12} tick={{ fill: "#666666" }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                  }}
                />
                <Legend />
                <Bar dataKey="score" name="Score" fill="#0a66c2" radius={[4, 4, 0, 0]} />
                <Bar dataKey="accuracy" name="Accuracy" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
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
              Question Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={questionDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {questionDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
      </Grid>

      {/* Assessment Cards */}
      <Grid container spacing={3}>
        {assessments.map((assessment) => {
          const scoreColor = getScoreColor(assessment.score);
          const timeEfficiency = calculateTimeEfficiency(assessment);
          const totalQuestions =
            assessment.questionAnalytics.correct +
            assessment.questionAnalytics.incorrect +
            assessment.questionAnalytics.skipped;

          const difficultyData = [
            {
              name: "Easy",
              correct: assessment.difficultyBreakdown.easy.correct,
              total: assessment.difficultyBreakdown.easy.total,
              color: "#10b981",
            },
            {
              name: "Medium",
              correct: assessment.difficultyBreakdown.medium.correct,
              total: assessment.difficultyBreakdown.medium.total,
              color: "#0a66c2",
            },
            {
              name: "Hard",
              correct: assessment.difficultyBreakdown.hard.correct,
              total: assessment.difficultyBreakdown.hard.total,
              color: "#ef4444",
            },
          ];

          return (
            <Grid item xs={12} md={6} key={assessment.assessmentId}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: "#ffffff",
                  border: `2px solid ${scoreColor}30`,
                  background: `linear-gradient(135deg, ${scoreColor}08 0%, ${scoreColor}02 100%)`,
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: `0 12px 32px ${scoreColor}30`,
                    transform: "translateY(-6px)",
                    borderColor: `${scoreColor}60`,
                  },
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "4px",
                    background: getScoreGradient(assessment.score),
                  },
                }}
              >
                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 3 }}>
                  <Box sx={{ flex: 1, minWidth: 0, pr: 2 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: "#000000",
                        fontSize: "1.25rem",
                        mb: 0.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {assessment.assessmentName}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <IconWrapper icon="mdi:calendar" size={16} color="#666666" />
                        <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                          {new Date(assessment.dateAttempted).toLocaleDateString()}
                        </Typography>
                      </Box>
                      {assessment.rank && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <IconWrapper icon="mdi:trophy" size={16} color="#f59e0b" />
                          <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                            Rank #{assessment.rank}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      width: 90,
                      height: 90,
                      flexShrink: 0,
                    }}
                  >
                    <ProgressRingChart
                      value={assessment.score}
                      size={90}
                      fontSize={20}
                      color={scoreColor}
                    />
                  </Box>
                </Box>

                {/* Key Metrics */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: "#ffffff",
                        border: "1px solid rgba(0,0,0,0.08)",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                        <IconWrapper icon="mdi:target" size={16} color="#0a66c2" />
                        <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.7rem", fontWeight: 500 }}>
                          Accuracy
                        </Typography>
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: "#0a66c2",
                          fontSize: "1.125rem",
                        }}
                      >
                        {assessment.accuracy}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: "#ffffff",
                        border: "1px solid rgba(0,0,0,0.08)",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                        <IconWrapper icon="mdi:clock-outline" size={16} color="#f59e0b" />
                        <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.7rem", fontWeight: 500 }}>
                          Time Used
                        </Typography>
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: "#f59e0b",
                          fontSize: "1.125rem",
                        }}
                      >
                        {timeEfficiency}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.65rem" }}>
                        {assessment.timeTaken}/{assessment.timeAllowed} min
                      </Typography>
                    </Box>
                  </Grid>
                  {assessment.percentile && (
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: "#ffffff",
                          border: "1px solid rgba(0,0,0,0.08)",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                          <IconWrapper icon="mdi:chart-line" size={16} color="#6366f1" />
                          <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.7rem", fontWeight: 500 }}>
                            Percentile Rank
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: "#6366f1",
                              fontSize: "1.125rem",
                            }}
                          >
                            {assessment.percentile}%
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                            Better than {assessment.percentile}% of students
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>

                {/* Difficulty Breakdown */}
                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: "#f9fafb",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#000000",
                      fontSize: "0.875rem",
                      mb: 1.5,
                      fontWeight: 600,
                    }}
                  >
                    Difficulty Breakdown
                  </Typography>
                  {difficultyData.map((diff) => {
                    const percentage = Math.round((diff.correct / diff.total) * 100);
                    return (
                      <Box key={diff.name} sx={{ mb: 1.5 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor: diff.color,
                              }}
                            />
                            <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem", fontWeight: 500 }}>
                              {diff.name}
                            </Typography>
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: diff.color,
                              fontSize: "0.75rem",
                            }}
                          >
                            {diff.correct} / {diff.total} ({percentage}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            height: 6,
                            borderRadius: 1,
                            backgroundColor: "#e5e7eb",
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: diff.color,
                              borderRadius: 1,
                            },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>

                {/* Question Analytics */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#000000",
                      fontSize: "0.875rem",
                      mb: 1.5,
                      fontWeight: 600,
                    }}
                  >
                    Question Analytics
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={4}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 1.5,
                          backgroundColor: "#f0fdf4",
                          border: "1px solid rgba(16, 185, 129, 0.2)",
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: "#10b981",
                            fontSize: "1.25rem",
                            mb: 0.25,
                          }}
                        >
                          {assessment.questionAnalytics.correct}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.7rem" }}>
                          Correct
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 1.5,
                          backgroundColor: "#fef2f2",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: "#ef4444",
                            fontSize: "1.25rem",
                            mb: 0.25,
                          }}
                        >
                          {assessment.questionAnalytics.incorrect}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.7rem" }}>
                          Incorrect
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 1.5,
                          backgroundColor: "#fffbeb",
                          border: "1px solid rgba(245, 158, 11, 0.2)",
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: "#f59e0b",
                            fontSize: "1.25rem",
                            mb: 0.25,
                          }}
                        >
                          {assessment.questionAnalytics.skipped}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.7rem" }}>
                          Skipped
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                        Avg Time/Question
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#000000" }}>
                        {assessment.questionAnalytics.averageTimePerQuestion}s
                      </Typography>
                    </Box>
                    {assessment.questionAnalytics.negativeMarkImpact > 0 && (
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                          Negative Mark Impact
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "#ef4444" }}>
                          -{assessment.questionAnalytics.negativeMarkImpact}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
}
