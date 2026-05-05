"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import adminMockInterviewService, {
  type StudentDetailResponse,
  type TopicPerformanceItem,
} from "@/lib/services/admin/admin-mock-interview.service";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const getStatCards = (t: (key: string) => string) =>
  [
    { key: "total" as const, label: t("adminMockInterview.totalInterviewsStat"), icon: "mdi:clipboard-list-outline" },
    { key: "completed" as const, label: t("adminMockInterview.completedStat"), icon: "mdi:check-circle-outline" },
    { key: "avgScore" as const, label: t("adminMockInterview.avgScoreStat"), icon: "mdi:chart-line" },
    { key: "completion" as const, label: t("adminMockInterview.completionStat"), icon: "mdi:percent-outline" },
  ] as const;

const DIFFICULTY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Easy: {
    bg: "color-mix(in srgb, var(--success-500) 12%, transparent)",
    border: "var(--success-500)",
    text: "var(--success-500)",
  },
  Medium: {
    bg: "color-mix(in srgb, var(--warning-500) 12%, transparent)",
    border: "var(--warning-500)",
    text: "var(--warning-500)",
  },
  Hard: {
    bg: "color-mix(in srgb, var(--error-500) 12%, transparent)",
    border: "var(--error-500)",
    text: "var(--error-500)",
  },
};

export default function AdminMockInterviewStudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StudentDetailResponse | null>(null);

  const studentId = parseInt(params.studentId as string, 10);
  const STAT_CARDS = getStatCards(t);

  const load = useCallback(async () => {
    if (isNaN(studentId)) {
      showToast(t("adminMockInterview.invalidStudentId"), "error");
      router.push("/admin/admin-mock-interview");
      return;
    }
    try {
      setLoading(true);
      const result = await adminMockInterviewService.getStudentDetail(
        studentId,
        true
      );
      setData(result);
    } catch {
      showToast(t("adminMockInterview.failedToLoadStudentReport"), "error");
      router.push("/admin/admin-mock-interview");
    } finally {
      setLoading(false);
    }
  }, [studentId, router, showToast, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBack = () => router.push("/admin/admin-mock-interview");
  const handleViewInterview = (interviewId: number) => {
    router.push(`/admin/admin-mock-interview/interviews/${interviewId}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
          }}
        >
          <CircularProgress sx={{ color: "var(--accent-indigo)" }} />
        </Box>
      </MainLayout>
    );
  }

  if (!data) return null;

  const { student, summary, score_trend, topic_performance, difficulty_performance, interviews } = data;
  const chartData = (score_trend || []).map((t) => ({
    ...t,
    label: formatDate(t.date),
  }));

  const getStatValue = (key: (typeof STAT_CARDS)[number]["key"]) => {
    switch (key) {
      case "total":
        return String(summary.total_interviews);
      case "completed":
        return String(summary.completed_interviews);
      case "avgScore":
        return summary.average_score != null ? `${summary.average_score.toFixed(1)}%` : "—";
      case "completion":
        return `${summary.completion_rate?.toFixed(0) ?? 0}%`;
      default:
        return "—";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "var(--success-500)";
    if (score >= 50) return "var(--warning-500)";
    return "var(--error-500)";
  };

  return (
    <MainLayout>
      <Box
        sx={{
          minHeight: "100%",
          background:
            "linear-gradient(180deg, var(--background) 0%, color-mix(in srgb, var(--surface) 60%, var(--background) 40%) 24rem, var(--background) 24rem)",
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: "auto" }}>
          <Button
            startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
            onClick={handleBack}
            sx={{
              mb: 2,
              color: "var(--font-secondary)",
              "&:hover": {
                bgcolor:
                  "color-mix(in srgb, var(--accent-indigo) 8%, var(--surface) 92%)",
                color: "var(--accent-indigo)",
              },
            }}
          >
            {t("adminMockInterview.backToMockInterviewAdmin")}
          </Button>

          {/* Profile card */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              border: "1px solid var(--border-default)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background:
                  "linear-gradient(90deg, var(--accent-indigo), var(--accent-purple))",
              }}
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
              <Avatar
                src={student.profile_pic_url}
                alt={student.name}
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: "var(--accent-indigo)",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                }}
              >
                {student.name?.charAt(0)?.toUpperCase() ?? "?"}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
                  {student.name}
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--font-secondary)", mt: 0.25 }}>
                  {student.email}
                </Typography>
                {student.phone_number && (
                  <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                    {student.phone_number}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>

          {/* Stats grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 2,
              mb: 3,
            }}
          >
            {STAT_CARDS.map(({ key, label, icon }) => (
              <Paper
                key={key}
                elevation={0}
                sx={{
                  p: 2,
                  textAlign: "center",
                  borderRadius: 2,
                  border: "1px solid var(--border-default)",
                  bgcolor: "var(--card-bg)",
                }}
              >
                <Box sx={{ mb: 0.5, display: "flex", justifyContent: "center" }}>
                  <IconWrapper icon={icon} size={24} color="var(--accent-indigo)" />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: key === "avgScore" ? getScoreColor(summary.average_score ?? 0) : "var(--font-primary)" }}>
                  {getStatValue(key)}
                </Typography>
                <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                  {label}
                </Typography>
              </Paper>
            ))}
          </Box>

          {/* Score trend */}
          {chartData.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                border: "1px solid var(--border-default)",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "var(--font-primary)" }}>
                {t("adminMockInterview.scoreTrend")}
              </Typography>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--font-secondary)" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--font-secondary)" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--border-default)",
                      background: "var(--card-bg)",
                      color: "var(--font-primary)",
                    }}
                    formatter={(value: number | undefined) => [`${value ?? 0}%`, "Score"]}
                  />
                  <Bar dataKey="score" name="Score" fill="var(--accent-indigo)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          )}

          {/* Topic performance — unique key by index to avoid duplicate "javascript" keys */}
          {topic_performance && topic_performance.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                border: "1px solid var(--border-default)",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "var(--font-primary)" }}>
                {t("adminMockInterview.topicPerformance")}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {topic_performance.map((topicItem: TopicPerformanceItem, index: number) => (
                  <Box
                    key={`topic-${index}`}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: "1px solid var(--border-default)",
                      bgcolor: "var(--surface)",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                      "&:hover": {
                        borderColor:
                          "color-mix(in srgb, var(--accent-indigo) 35%, var(--border-default) 65%)",
                        boxShadow:
                          "0 2px 8px color-mix(in srgb, var(--accent-indigo) 16%, transparent)",
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
                        {topicItem.topic}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                        <Chip
                          label={`${t("adminMockInterview.avg")} ${topicItem.average_score?.toFixed(1) ?? 0}%`}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            bgcolor:
                              "color-mix(in srgb, var(--accent-indigo) 16%, transparent)",
                            color: "var(--accent-indigo)",
                          }}
                        />
                        <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                          {t("adminMockInterview.best")}: {topicItem.highest_score ?? 0}%
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={topicItem.total_interviews ? (topicItem.completed / topicItem.total_interviews) * 100 : 0}
                        sx={{
                          flex: 1,
                          height: 6,
                          borderRadius: 3,
                          bgcolor: "color-mix(in srgb, var(--font-secondary) 16%, transparent)",
                          "& .MuiLinearProgress-bar": { borderRadius: 3, bgcolor: "var(--accent-indigo)" },
                        }}
                      />
                      <Typography variant="caption" sx={{ color: "var(--font-secondary)", minWidth: 72 }}>
                        {t("adminMockInterview.completedCount", { completed: topicItem.completed, total: topicItem.total_interviews })}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Difficulty performance */}
          {difficulty_performance && Object.keys(difficulty_performance).length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                border: "1px solid var(--border-default)",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "var(--font-primary)" }}>
                {t("adminMockInterview.difficultyPerformance")}
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                  gap: 2,
                }}
              >
                {Object.entries(difficulty_performance).map(([diff, stats]) => {
                  const theme = DIFFICULTY_COLORS[diff] ?? {
                    bg: "color-mix(in srgb, var(--font-secondary) 12%, var(--surface) 88%)",
                    border: "var(--border-default)",
                    text: "var(--font-secondary)",
                  };
                  return (
                    <Box
                      key={diff}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: `1px solid ${theme.border}`,
                        backgroundColor: theme.bg,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.text }}>
                        {diff}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                        {t("adminMockInterview.completedCount", { completed: stats.completed, total: stats.total })}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                        {t("adminMockInterview.avg")}: {stats.average_score?.toFixed(1) ?? 0}%
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          )}

          {/* Recent interviews */}
          {interviews && interviews.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid var(--border-default)",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "var(--font-primary)" }}>
                {t("adminMockInterview.recentInterviews")}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "var(--surface)" }}>
                      <TableCell sx={{ fontWeight: 600, color: "var(--font-secondary)" }}>{t("adminMockInterview.titleColumn")}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "var(--font-secondary)" }}>{t("adminMockInterview.topic")}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "var(--font-secondary)" }}>{t("adminMockInterview.difficulty")}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "var(--font-secondary)" }}>{t("adminMockInterview.status")}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "var(--font-secondary)" }}>{t("adminMockInterview.score")}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "var(--font-secondary)" }}>{t("adminMockInterview.date")}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "var(--font-secondary)" }} align="right">{t("adminMockInterview.action")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {interviews.slice(0, 10).map((i) => (
                      <TableRow
                        key={i.id}
                        sx={{
                          "&:hover": { bgcolor: "var(--surface)" },
                        }}
                      >
                        <TableCell sx={{ color: "var(--font-primary)" }}>{i.title}</TableCell>
                        <TableCell sx={{ color: "var(--font-secondary)" }}>{i.topic}</TableCell>
                        <TableCell sx={{ color: "var(--font-secondary)" }}>{i.difficulty}</TableCell>
                        <TableCell>
                          <Chip
                            label={i.status.replace("_", " ")}
                            size="small"
                            sx={{
                              fontWeight: 500,
                              ...(i.status === "completed" && {
                                bgcolor:
                                  "color-mix(in srgb, var(--success-500) 16%, transparent)",
                                color: "var(--success-500)",
                              }),
                              ...(i.status === "in_progress" && {
                                bgcolor:
                                  "color-mix(in srgb, var(--accent-indigo) 16%, transparent)",
                                color: "var(--accent-indigo)",
                              }),
                              ...(i.status === "scheduled" && {
                                bgcolor:
                                  "color-mix(in srgb, var(--warning-500) 16%, transparent)",
                                color: "var(--warning-500)",
                              }),
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: "var(--font-secondary)" }}>
                          {i.overall_score != null ? `${i.overall_score}%` : "—"}
                        </TableCell>
                        <TableCell sx={{ color: "var(--font-secondary)" }}>{formatDate(i.created_at)}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => handleViewInterview(i.id)}
                            sx={{
                              color: "var(--accent-indigo)",
                              fontWeight: 600,
                              "&:hover": {
                                bgcolor:
                                  "color-mix(in srgb, var(--accent-indigo) 10%, var(--surface) 90%)",
                              },
                            }}
                          >
                            {t("adminMockInterview.view")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      </Box>
    </MainLayout>
  );
}
