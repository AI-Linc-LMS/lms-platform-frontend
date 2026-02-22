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
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import adminMockInterviewService, {
  type StudentDetailResponse,
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

export default function AdminStudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StudentDetailResponse | null>(null);

  const studentId = parseInt(params.id as string, 10);

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
          <CircularProgress />
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

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Button
          startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Mock Interview Admin
        </Button>

        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              src={student.profile_pic_url}
              alt={student.name}
              sx={{ width: 64, height: 64 }}
            />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {student.name}
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                {student.email}
              </Typography>
              {student.phone_number && (
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  {student.phone_number}
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
              <Typography variant="caption" color="textSecondary">
                Total
              </Typography>
              <Typography variant="h6">{summary.total_interviews}</Typography>
              <Typography variant="caption">interviews</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
              <Typography variant="caption" color="textSecondary">
                Completed
              </Typography>
              <Typography variant="h6">{summary.completed_interviews}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
              <Typography variant="caption" color="textSecondary">
                Avg Score
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color:
                    summary.average_score >= 70
                      ? "#16a34a"
                      : summary.average_score >= 50
                      ? "#d97706"
                      : "#dc2626",
                }}
              >
                {summary.average_score?.toFixed(1)}%
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
              <Typography variant="caption" color="textSecondary">
                Completion
              </Typography>
              <Typography variant="h6">{summary.completion_rate?.toFixed(0)}%</Typography>
            </Paper>
          </Grid>
        </Grid>

        {chartData.length > 0 && (
          <Paper
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 2,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Score Trend
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="score" name="Score" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        )}

        {topic_performance && topic_performance.length > 0 && (
          <Paper
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 2,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Topic Performance
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {topic_performance.map((t) => (
                <Box
                  key={t.topic}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {t.topic}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#6b7280" }}>
                      {t.completed}/{t.total_interviews} completed
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Chip
                      label={`Avg ${t.average_score?.toFixed(1)}%`}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                    <Typography variant="body2" sx={{ color: "#6b7280" }}>
                      Best: {t.highest_score}%
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        )}

        {difficulty_performance && Object.keys(difficulty_performance).length > 0 && (
          <Paper
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 2,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Difficulty Performance
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                gap: 2,
              }}
            >
              {Object.entries(difficulty_performance).map(([diff, stats]) => (
                <Box
                  key={diff}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {diff}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#6b7280" }}>
                    {stats.completed}/{stats.total} completed
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#6b7280" }}>
                    Avg: {stats.average_score?.toFixed(1)}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        )}

        {interviews && interviews.length > 0 && (
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Recent Interviews
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Topic</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Difficulty</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Score</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {interviews.slice(0, 10).map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>{i.title}</TableCell>
                      <TableCell>{i.topic}</TableCell>
                      <TableCell>{i.difficulty}</TableCell>
                      <TableCell>
                        <Chip
                          label={i.status}
                          size="small"
                          color={
                            i.status === "completed"
                              ? "success"
                              : i.status === "in_progress"
                              ? "primary"
                              : "default"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {i.overall_score != null ? `${i.overall_score}%` : "-"}
                      </TableCell>
                      <TableCell>{formatDate(i.created_at)}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => handleViewInterview(i.id)}
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
    </MainLayout>
  );
}
