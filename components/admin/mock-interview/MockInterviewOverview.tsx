"use client";

import { Box, Typography, Paper, Skeleton } from "@mui/material";
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
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { DashboardMetricCard } from "@/components/admin/dashboard/DashboardMetricCard";
import type {
  DashboardResponse,
  DailyTrendItem,
  TopPerformer,
} from "@/lib/services/admin/admin-mock-interview.service";

interface MockInterviewOverviewProps {
  data: DashboardResponse | null;
  loading: boolean;
  days: number;
}

export function MockInterviewOverview({
  data,
  loading,
  days,
}: MockInterviewOverviewProps) {
  const { t } = useTranslation("common");
  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: 2 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
        <Skeleton variant="rounded" height={320} sx={{ borderRadius: 2 }} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          <Skeleton variant="rounded" height={180} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" height={180} sx={{ borderRadius: 2 }} />
        </Box>
      </Box>
    );
  }

  if (!data) {
    return (
      <Paper
        sx={{
          p: 6,
          textAlign: "center",
          borderRadius: 2,
          border: "1px dashed #e5e7eb",
          backgroundColor: "#f9fafb",
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: "#eef2ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          <IconWrapper icon="mdi:chart-box-outline" size={32} color="#6366f1" />
        </Box>
        <Typography variant="body1" sx={{ fontWeight: 500, color: "#374151", mb: 0.5 }}>
          {t("adminMockInterview.noDashboardData")}
        </Typography>
        <Typography variant="body2" sx={{ color: "#6b7280" }}>
          {t("adminMockInterview.dataWillAppear")}
        </Typography>
      </Paper>
    );
  }

  const { overview, score_statistics, time_statistics, difficulty_distribution, daily_trend, top_performers } = data;

  const chartData: Array<{ date: string; created: number; completed: number; label?: string }> = (daily_trend || []).map(
    (d: DailyTrendItem) => {
      const date = new Date(d.date);
      return {
        ...d,
        label: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      };
    }
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* KPI Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
        }}
      >
        <DashboardMetricCard
          title={t("adminMockInterview.totalInterviews")}
          value={overview.total_interviews}
          icon="mdi:clipboard-list-outline"
          iconColor="#6366f1"
        />
        <DashboardMetricCard
          title={t("adminMockInterview.uniqueStudents")}
          value={overview.total_unique_students}
          icon="mdi:account-group"
          iconColor="#8b5cf6"
        />
        <DashboardMetricCard
          title={t("adminMockInterview.completionRate")}
          value={`${overview.completion_rate?.toFixed(1) ?? 0}%`}
          icon="mdi:check-circle"
          iconColor="#22c55e"
        />
        <DashboardMetricCard
          title={t("adminMockInterview.averageScore")}
          value={score_statistics.average_score?.toFixed(1) ?? "-"}
          icon="mdi:chart-line"
          iconColor="#f59e0b"
        />
      </Box>

      {/* Score & Time Stats */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
        }}
      >
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            border: "1px solid #e5e7eb",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#111827" }}>
            {t("adminMockInterview.scoreStatistics")}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                {t("adminMockInterview.highest")}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#16a34a" }}>
                {score_statistics.highest_score ?? "-"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                {t("adminMockInterview.lowest")}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#dc2626" }}>
                {score_statistics.lowest_score ?? "-"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                {t("adminMockInterview.median")}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {score_statistics.median_score ?? "-"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                {t("adminMockInterview.scoredInterviews")}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {score_statistics.total_scored_interviews ?? 0}
              </Typography>
            </Box>
          </Box>
        </Paper>
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#111827" }}>
            {t("adminMockInterview.timeStatistics")}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                {t("adminMockInterview.avgTimeMin")}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {time_statistics.average_time_minutes?.toFixed(1) ?? "-"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                {t("adminMockInterview.totalTimeMin")}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {time_statistics.total_time_spent_minutes?.toFixed(0) ?? "-"}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Daily Trend Chart */}
      {chartData.length > 0 && (
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            border: "1px solid #e5e7eb",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#111827" }}>
            {t("adminMockInterview.dailyTrend", { days })}
          </Typography>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="created" name={t("adminMockInterview.createdLegend")} fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name={t("adminMockInterview.completedLegend")} fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Difficulty Distribution */}
      {difficulty_distribution && Object.keys(difficulty_distribution).length > 0 && (
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            border: "1px solid #e5e7eb",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#111827" }}>
            {t("adminMockInterview.difficultyDistribution")}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 2,
            }}
          >
            {Object.entries(difficulty_distribution).map(([diff, stats]) => (
              <Box
                key={diff}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#f9fafb",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151" }}>
                  {diff}
                </Typography>
                <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.5 }}>
                  {t("adminMockInterview.completedCount", { completed: stats.completed, total: stats.total })}
                </Typography>
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  {t("adminMockInterview.avg")}: {stats.average_score?.toFixed(1) ?? "-"}%
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Top Performers */}
      {top_performers && top_performers.length > 0 && (
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            border: "1px solid #e5e7eb",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <IconWrapper icon="mdi:trophy" size={24} color="#f59e0b" />
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827" }}>
              {t("adminMockInterview.topPerformers")}
            </Typography>
          </Box>
          <Box
            component="ul"
            sx={{
              m: 0,
              p: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {top_performers.slice(0, 5).map((p: TopPerformer, idx: number) => (
              <Box
                key={p.student_id}
                component="li"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.5,
                  borderRadius: 1,
                  backgroundColor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      backgroundColor: idx === 0 ? "#fef3c7" : "#f3f4f6",
                      color: idx === 0 ? "#d97706" : "#6b7280",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                    }}
                  >
                    {idx + 1}
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {p.student_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#6b7280" }}>
                      {t("adminMockInterview.interviewsCount", { count: p.interviews_completed })}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#16a34a" }}>
                    {p.average_score?.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#6b7280" }}>
                    {t("adminMockInterview.best")}: {p.highest_score}%
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
