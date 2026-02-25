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

const STAT_CARDS = [
  { key: "total" as const, label: "Total interviews", icon: "mdi:clipboard-list-outline" },
  { key: "completed" as const, label: "Completed", icon: "mdi:check-circle-outline" },
  { key: "avgScore" as const, label: "Avg score", icon: "mdi:chart-line" },
  { key: "completion" as const, label: "Completion", icon: "mdi:percent-outline" },
] as const;

const DIFFICULTY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Easy: { bg: "rgba(34, 197, 94, 0.12)", border: "#22c55e", text: "#166534" },
  Medium: { bg: "rgba(245, 158, 11, 0.12)", border: "#f59e0b", text: "#92400e" },
  Hard: { bg: "rgba(239, 68, 68, 0.12)", border: "#ef4444", text: "#991b1b" },
};

export default function AdminMockInterviewStudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StudentDetailResponse | null>(null);

  const studentId = parseInt(params.studentId as string, 10);

  const load = useCallback(async () => {
    if (isNaN(studentId)) {
      showToast("Invalid student ID", "error");
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
      showToast("Failed to load student report", "error");
      router.push("/admin/admin-mock-interview");
    } finally {
      setLoading(false);
    }
  }, [studentId, router, showToast]);

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
          <CircularProgress sx={{ color: "#6366f1" }} />
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
    if (score >= 70) return "#16a34a";
    if (score >= 50) return "#d97706";
    return "#dc2626";
  };

  return (
    <MainLayout>
      <Box
        sx={{
          minHeight: "100%",
          background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 24rem, #fff 24rem)",
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: "auto" }}>
          <Button
            startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
            onClick={handleBack}
            sx={{
              mb: 2,
              color: "#64748b",
              "&:hover": { bgcolor: "rgba(99, 102, 241, 0.08)", color: "#6366f1" },
            }}
          >
            Back to Mock Interview Admin
          </Button>

          {/* Profile card */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
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
                background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
              }}
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
              <Avatar
                src={student.profile_pic_url}
                alt={student.name}
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: "#6366f1",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                }}
              >
                {student.name?.charAt(0)?.toUpperCase() ?? "?"}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a" }}>
                  {student.name}
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mt: 0.25 }}>
                  {student.email}
                </Typography>
                {student.phone_number && (
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
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
                  border: "1px solid #e2e8f0",
                  bgcolor: "#fff",
                }}
              >
                <Box sx={{ mb: 0.5, display: "flex", justifyContent: "center" }}>
                  <IconWrapper icon={icon} size={24} color="#6366f1" />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: key === "avgScore" ? getScoreColor(summary.average_score ?? 0) : "#0f172a" }}>
                  {getStatValue(key)}
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
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
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#0f172a" }}>
                Score trend
              </Typography>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
                    formatter={(value: number | undefined) => [`${value ?? 0}%`, "Score"]}
                  />
                  <Bar dataKey="score" name="Score" fill="#6366f1" radius={[6, 6, 0, 0]} />
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
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#0f172a" }}>
                Topic performance
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {topic_performance.map((t: TopicPerformanceItem, index: number) => (
                  <Box
                    key={`topic-${index}`}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: "1px solid #e2e8f0",
                      bgcolor: "#f8fafc",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                      "&:hover": {
                        borderColor: "#c7d2fe",
                        boxShadow: "0 2px 8px rgba(99, 102, 241, 0.08)",
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: "#0f172a" }}>
                        {t.topic}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                        <Chip
                          label={`Avg ${t.average_score?.toFixed(1) ?? 0}%`}
                          size="small"
                          sx={{ fontWeight: 600, bgcolor: "#e0e7ff", color: "#4338ca" }}
                        />
                        <Typography variant="body2" sx={{ color: "#64748b" }}>
                          Best: {t.highest_score ?? 0}%
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={t.total_interviews ? (t.completed / t.total_interviews) * 100 : 0}
                        sx={{
                          flex: 1,
                          height: 6,
                          borderRadius: 3,
                          bgcolor: "#e2e8f0",
                          "& .MuiLinearProgress-bar": { borderRadius: 3, bgcolor: "#6366f1" },
                        }}
                      />
                      <Typography variant="caption" sx={{ color: "#64748b", minWidth: 72 }}>
                        {t.completed}/{t.total_interviews} completed
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
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#0f172a" }}>
                Difficulty performance
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                  gap: 2,
                }}
              >
                {Object.entries(difficulty_performance).map(([diff, stats]) => {
                  const theme = DIFFICULTY_COLORS[diff] ?? { bg: "#f1f5f9", border: "#94a3b8", text: "#475569" };
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
                      <Typography variant="body2" sx={{ color: "#64748b" }}>
                        {stats.completed}/{stats.total} completed
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#64748b" }}>
                        Avg: {stats.average_score?.toFixed(1) ?? 0}%
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
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#0f172a" }}>
                Recent interviews
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f8fafc" }}>
                      <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Title</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Topic</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Difficulty</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Score</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#475569" }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#475569" }} align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {interviews.slice(0, 10).map((i) => (
                      <TableRow
                        key={i.id}
                        sx={{
                          "&:hover": { bgcolor: "#f8fafc" },
                        }}
                      >
                        <TableCell sx={{ color: "#0f172a" }}>{i.title}</TableCell>
                        <TableCell sx={{ color: "#64748b" }}>{i.topic}</TableCell>
                        <TableCell sx={{ color: "#64748b" }}>{i.difficulty}</TableCell>
                        <TableCell>
                          <Chip
                            label={i.status.replace("_", " ")}
                            size="small"
                            sx={{
                              fontWeight: 500,
                              ...(i.status === "completed" && { bgcolor: "#d1fae5", color: "#065f46" }),
                              ...(i.status === "in_progress" && { bgcolor: "#dbeafe", color: "#1e40af" }),
                              ...(i.status === "scheduled" && { bgcolor: "#fef3c7", color: "#92400e" }),
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: "#64748b" }}>
                          {i.overall_score != null ? `${i.overall_score}%` : "—"}
                        </TableCell>
                        <TableCell sx={{ color: "#64748b" }}>{formatDate(i.created_at)}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => handleViewInterview(i.id)}
                            sx={{
                              color: "#6366f1",
                              fontWeight: 600,
                              "&:hover": { bgcolor: "rgba(99, 102, 241, 0.08)" },
                            }}
                          >
                            View
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
