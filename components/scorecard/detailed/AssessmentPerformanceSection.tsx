"use client";

import { useMemo, useState } from "react";
import { Box, Typography, Paper, Grid, LinearProgress, Button } from "@mui/material";
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
import { AssessmentResultModal } from "@/components/assessment/result/AssessmentResultModal";

interface AssessmentPerformanceSectionProps {
  assessments: AssessmentPerformance[];
  /** Total assessments available (from learning consumption). When set, shows "Attempted / Available". */
  totalAssessmentsAvailable?: number;
}

export function AssessmentPerformanceSection({
  assessments,
  totalAssessmentsAvailable,
}: AssessmentPerformanceSectionProps) {
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultModalSlug, setResultModalSlug] = useState("");
  const [resultModalName, setResultModalName] = useState("");

  const openResultModal = (slug: string, name: string) => {
    setResultModalSlug(slug);
    setResultModalName(name);
    setResultModalOpen(true);
  };

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
    if (totalAssessments === 0) {
      return {
        totalAssessments: 0,
        avgAccuracy: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        totalSkipped: 0,
        bestAssessment: null as AssessmentPerformance | null,
      };
    }
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
      current.accuracy > best.accuracy ? current : best
    );

    return {
      totalAssessments,
      avgAccuracy,
      totalCorrect,
      totalIncorrect,
      totalSkipped,
      bestAssessment,
    };
  }, [assessments]);

  // Prepare chart data (ensure numeric values for correct chart rendering)
  const scoreChartData = assessments.map((a) => ({
    name: a.assessmentName.length > 15 ? a.assessmentName.substring(0, 15) + "..." : a.assessmentName,
    fullName: a.assessmentName,
    score: Number(a.score) || 0,
    accuracy: Number(a.accuracy) || 0,
  }));

  const questionDistributionData = [
    { name: "Correct", value: summaryStats.totalCorrect, color: "#10b981" },
    { name: "Incorrect", value: summaryStats.totalIncorrect, color: "#ef4444" },
    { name: "Skipped", value: summaryStats.totalSkipped, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  const totalQuestions =
    summaryStats.totalCorrect + summaryStats.totalIncorrect + summaryStats.totalSkipped;

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
          <Grid size={{ xs: 6, sm: 4 }}>
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
                {totalAssessmentsAvailable != null && totalAssessmentsAvailable > 0
                  ? `${summaryStats.totalAssessments} / ${totalAssessmentsAvailable}`
                  : summaryStats.totalAssessments}
              </Typography>
              <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                {totalAssessmentsAvailable != null && totalAssessmentsAvailable > 0
                  ? "Attempted / Available"
                  : "Assessments Attempted"}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
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
          <Grid size={{ xs: 6, sm: 4 }}>
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
                {summaryStats.bestAssessment?.accuracy ?? 0}%
              </Typography>
              <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                Best Accuracy
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Empty state when no assessments */}
      {assessments.length === 0 && (
        <Box
          sx={{
            py: 6,
            px: 3,
            textAlign: "center",
            borderRadius: 2,
            backgroundColor: "#f9fafb",
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <Box sx={{ mb: 2 }}>
            <IconWrapper icon="mdi:clipboard-check-outline" size={48} color="#9ca3af" />
          </Box>
          <Typography variant="h6" sx={{ color: "#374151", fontWeight: 600, mb: 1 }}>
            No assessments attempted yet
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            Complete assessments to see your performance here.
          </Typography>
        </Box>
      )}

      {/* Charts Section */}
      {assessments.length > 0 && (
      <>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
              overflow: "hidden",
              transition: "box-shadow 0.3s ease",
              "&:hover": {
                boxShadow: "0 16px 48px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 2.5,
                pb: 2,
                borderBottom: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #0a66c2 0%, #004182 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconWrapper icon="mdi:chart-line" size={22} color="#ffffff" />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: "#111827",
                    fontSize: "1.125rem",
                  }}
                >
                  Score & Accuracy Trends
                </Typography>
                <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.75rem" }}>
                  Performance across assessments
                </Typography>
              </Box>
            </Box>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={scoreChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="scoreBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0a66c2" />
                    <stop offset="100%" stopColor="#004182" />
                  </linearGradient>
                  <linearGradient id="accuracyBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  fontSize={12}
                  tick={{ fill: "#374151", fontWeight: 500 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tick={{ fill: "#374151", fontWeight: 500 }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 1,
                    padding: 0,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    maxWidth: 360,
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                  }}
                  wrapperStyle={{ outline: "none" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0]?.payload as { fullName?: string; score?: number; accuracy?: number };
                    const displayName = data?.fullName ?? label ?? "";
                    return (
                      <Box
                        sx={{
                          p: 1.5,
                          minWidth: 0,
                          maxWidth: 360,
                          backgroundColor: "#ffffff",
                          borderRadius: 1,
                          border: "1px solid rgba(0,0,0,0.08)",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: "#111827",
                            mb: 1,
                            wordBreak: "break-word",
                            whiteSpace: "normal",
                          }}
                        >
                          {displayName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#6b7280" }}>
                          Score: {data?.score ?? 0}%
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#6b7280" }}>
                          Accuracy: {data?.accuracy ?? 0}%
                        </Typography>
                      </Box>
                    );
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 16 }}
                  formatter={(value) => (
                    <span style={{ color: "#374151", fontWeight: 600, fontSize: "0.8125rem" }}>
                      {value}
                    </span>
                  )}
                />
                <Bar
                  dataKey="score"
                  name="Score"
                  fill="url(#scoreBarGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
                <Bar
                  dataKey="accuracy"
                  name="Accuracy"
                  fill="url(#accuracyBarGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
              overflow: "hidden",
              transition: "box-shadow 0.3s ease",
              "&:hover": {
                boxShadow: "0 16px 48px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 2.5,
                pb: 2,
                borderBottom: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconWrapper icon="mdi:chart-pie" size={22} color="#ffffff" />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: "#111827",
                    fontSize: "1.125rem",
                  }}
                >
                  Question Distribution
                </Typography>
                <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.75rem" }}>
                  Correct, incorrect & skipped
                </Typography>
              </Box>
            </Box>
            {questionDistributionData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <defs>
                      {questionDistributionData.map((entry, i) => (
                        <linearGradient
                          key={i}
                          id={`pieGradient-${i}`}
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                          <stop offset="100%" stopColor={entry.color} stopOpacity={0.8} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={questionDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {questionDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#pieGradient-${index})`} strokeWidth={2} stroke="#fff" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid rgba(0,0,0,0.08)",
                        borderRadius: 1,
                        padding: 0,
                        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                      }}
                      wrapperStyle={{ outline: "none" }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const entry = payload[0];
                        const v = (entry?.value as number) ?? 0;
                        const pct = totalQuestions > 0 ? ((v / totalQuestions) * 100).toFixed(1) : "0";
                        const name = entry?.name ?? "";
                        const color = (entry?.payload as { color?: string })?.color ?? "#6b7280";
                        return (
                          <Box
                            sx={{
                              p: 1.5,
                              backgroundColor: "#ffffff",
                              borderRadius: 1,
                              border: "1px solid rgba(0,0,0,0.08)",
                              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                color: color,
                              }}
                            >
                              {name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.5 }}>
                              {v} ({pct}%)
                            </Typography>
                          </Box>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    px: 1,
                    pt: 0.5,
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  {[
                    { name: "Correct", value: summaryStats.totalCorrect, color: "#10b981", icon: "mdi:check-circle" },
                    { name: "Incorrect", value: summaryStats.totalIncorrect, color: "#ef4444", icon: "mdi:close-circle" },
                    { name: "Skipped", value: summaryStats.totalSkipped, color: "#f59e0b", icon: "mdi:skip-next" },
                  ].map((item) => (
                    <Box
                      key={item.name}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                        backgroundColor: `${item.color}12`,
                        border: `1px solid ${item.color}30`,
                      }}
                    >
                      <IconWrapper icon={item.icon} size={18} color={item.color} />
                      <Box>
                        <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.65rem", display: "block" }}>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: item.color, fontSize: "0.9375rem" }}>
                          {item.value}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  py: 6,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                <IconWrapper icon="mdi:chart-pie-outline" size={48} color="#9ca3af" />
                <Typography variant="body2" sx={{ mt: 1.5, color: "#6b7280" }}>
                  No question data yet
                </Typography>
                <Typography variant="caption" sx={{ color: "#9ca3af", mt: 0.5 }}>
                  Complete assessments to see distribution
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Assessment Cards */}
      <Grid container spacing={3}>
        {assessments.map((assessment) => {
          const scoreColor = getScoreColor(assessment.score);

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
            <Grid size={{ xs: 12, md: 6 }} key={assessment.assessmentId}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.25s ease",
                  "&:hover": {
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                    borderColor: `${scoreColor}40`,
                  },
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: getScoreGradient(assessment.score),
                  },
                }}
              >
                {/* Header: Score ring + Title + Actions */}
                <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", mb: 2 }}>
                  <Box sx={{ flexShrink: 0 }}>
                    <ProgressRingChart
                      value={assessment.score}
                      size={72}
                      fontSize={16}
                      color={scoreColor}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "#111827",
                        fontSize: "1.1rem",
                        lineHeight: 1.3,
                        mb: 0.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {assessment.assessmentName}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mb: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <IconWrapper icon="mdi:calendar" size={14} color="#6b7280" />
                        <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.7rem" }}>
                          {new Date(assessment.dateAttempted).toLocaleDateString()}
                        </Typography>
                      </Box>
                      {assessment.rank && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <IconWrapper icon="mdi:trophy" size={14} color="#f59e0b" />
                          <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.7rem" }}>
                            Rank #{assessment.rank}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    {assessment.assessmentId && (
                      <Button
                        onClick={() =>
                          openResultModal(assessment.assessmentId, assessment.assessmentName)
                        }
                        size="small"
                        variant="text"
                        sx={{
                          fontSize: "0.7rem",
                          textTransform: "none",
                          color: scoreColor,
                          fontWeight: 600,
                          px: 0,
                          minWidth: 0,
                          "&:hover": {
                            backgroundColor: `${scoreColor}15`,
                          },
                        }}
                      >
                        View full result
                      </Button>
                    )}
                  </Box>
                </Box>

                {/* Inline stats row */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    flexWrap: "wrap",
                    mb: 2,
                    py: 1.5,
                    px: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: "#f9fafb",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <IconWrapper icon="mdi:target" size={16} color="#0a66c2" />
                    <Box>
                      <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.65rem", display: "block" }}>
                        Accuracy
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#0a66c2", fontSize: "0.9rem" }}>
                        {assessment.accuracy}%
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <IconWrapper icon="mdi:clock-outline" size={16} color="#f59e0b" />
                    <Box>
                      <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.65rem", display: "block" }}>
                        Time
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#f59e0b", fontSize: "0.9rem" }}>
                        {assessment.timeTaken}/{assessment.timeAllowed || 0} min
                      </Typography>
                    </Box>
                  </Box>
                  {assessment.percentile != null && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <IconWrapper icon="mdi:chart-line" size={16} color="#6366f1" />
                      <Box>
                        <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.65rem", display: "block" }}>
                          Percentile
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "#6366f1", fontSize: "0.9rem" }}>
                          {assessment.percentile}%
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Difficulty Breakdown */}
                <Box
                  sx={{
                    mb: 2,
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: "#f9fafb",
                    border: "1px solid rgba(0,0,0,0.04)",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#374151",
                      fontSize: "0.75rem",
                      mb: 1.25,
                      fontWeight: 600,
                      display: "block",
                    }}
                  >
                    Difficulty Breakdown
                  </Typography>
                  {difficultyData.map((diff) => {
                    const percentage = diff.total > 0 ? Math.round((diff.correct / diff.total) * 100) : 0;
                    const percentageLabel = diff.total > 0 ? `${percentage}%` : "—";
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
                            {diff.correct} / {diff.total} ({percentageLabel})
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
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.04)",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#374151",
                      fontSize: "0.75rem",
                      mb: 1.25,
                      fontWeight: 600,
                      display: "block",
                    }}
                  >
                    Question Analytics
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 1.25 }}>
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 60,
                        py: 1,
                        px: 1.25,
                        borderRadius: 1,
                        backgroundColor: "#f0fdf4",
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#10b981", fontSize: "1rem" }}>
                        {assessment.questionAnalytics.correct}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.65rem" }}>
                        Correct
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 60,
                        py: 1,
                        px: 1.25,
                        borderRadius: 1,
                        backgroundColor: "#fef2f2",
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#ef4444", fontSize: "1rem" }}>
                        {assessment.questionAnalytics.incorrect}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.65rem" }}>
                        Incorrect
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 60,
                        py: 1,
                        px: 1.25,
                        borderRadius: 1,
                        backgroundColor: "#fffbeb",
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#f59e0b", fontSize: "1rem" }}>
                        {assessment.questionAnalytics.skipped}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.65rem" }}>
                        Skipped
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 0.5, pt: 1, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.7rem" }}>
                      Avg Time/Question
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#111827" }}>
                      {Number.isFinite(assessment.questionAnalytics.averageTimePerQuestion)
                        ? `${Math.round(assessment.questionAnalytics.averageTimePerQuestion)}s`
                        : "—"}
                    </Typography>
                  </Box>
                  {assessment.questionAnalytics.negativeMarkImpact > 0 && (
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
                      <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.7rem" }}>
                        Negative Mark Impact
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: "#ef4444" }}>
                        -{assessment.questionAnalytics.negativeMarkImpact}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>
      </>
      )}

      <AssessmentResultModal
        open={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        assessmentSlug={resultModalSlug}
        assessmentName={resultModalName}
      />
    </Paper>
  );
}
