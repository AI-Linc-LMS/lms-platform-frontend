"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  Briefcase,
  CheckCircle2,
  Award,
  ArrowRight,
  Filter,
  Send,
  Users,
  Calendar,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { jobsV2Service, type JobApplicationV2 } from "@/lib/services/jobs-v2.service";
import { useToast } from "@/components/common/Toast";
import { formatDistanceToNow } from "@/lib/utils/date-utils";

const STATUS_LABELS: Record<string, string> = {
  applying: "Applying",
  applied: "Applied",
  shortlisted: "Shortlisted",
  interview_stage: "Interview Stage",
  rejected: "Rejected",
  selected: "Selected",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  applying: { bg: "rgba(99, 102, 241, 0.12)", color: "#6366f1" },
  applied: { bg: "rgba(59, 130, 246, 0.12)", color: "#2563eb" },
  shortlisted: { bg: "rgba(34, 197, 94, 0.12)", color: "#16a34a" },
  interview_stage: { bg: "rgba(245, 158, 11, 0.12)", color: "#d97706" },
  rejected: { bg: "rgba(239, 68, 68, 0.12)", color: "#dc2626" },
  selected: { bg: "rgba(34, 197, 94, 0.2)", color: "#15803d" },
};

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "shortlisted":
      return <Users size={14} />;
    case "interview_stage":
      return <Calendar size={14} />;
    case "rejected":
      return <XCircle size={14} />;
    case "selected":
      return <CheckCircle2 size={14} />;
    default:
      return <Send size={14} />;
  }
}

function getStatusStyle(status: string) {
  return STATUS_COLORS[status] ?? STATUS_COLORS.applied;
}

function formatDate(d?: string) {
  if (!d) return "—";
  try {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return "—";
    return formatDistanceToNow(date);
  } catch {
    return "—";
  }
}

type StatusFilter = "all" | JobApplicationV2["status"];
type SortOption = "newest" | "oldest" | "company";

interface AppliedJobsSectionProps {
  onBrowseJobs?: () => void;
}

export function AppliedJobsSection({ onBrowseJobs }: AppliedJobsSectionProps) {
  const { showToast } = useToast();
  const [applications, setApplications] = useState<JobApplicationV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await jobsV2Service.getMyApplications();
      setApplications(res.results ?? []);
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to load applications", "error");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const selectedApplications = applications.filter((a) => a.status === "selected");

  const filteredByStatus =
    statusFilter === "all"
      ? applications
      : applications.filter((a) => a.status === statusFilter);

  const filteredApplications = [...filteredByStatus].sort((a, b) => {
    if (sortBy === "newest")
      return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
    if (sortBy === "oldest")
      return new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
    return (a.company_name || "").localeCompare(b.company_name || "");
  });

  const statusCounts = applications.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 8,
          gap: 2,
        }}
      >
        <CircularProgress size={40} sx={{ color: "#6366f1" }} />
        <Typography variant="body2" color="text.secondary">
          Loading your applications...
        </Typography>
      </Box>
    );
  }

  if (applications.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 6,
          textAlign: "center",
          border: "1px dashed",
          borderColor: "rgba(99, 102, 241, 0.3)",
          borderRadius: 3,
          backgroundColor: "rgba(99, 102, 241, 0.02)",
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "rgba(99, 102, 241, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          <Briefcase size={40} style={{ color: "#6366f1" }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}>
          No applications yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mx: "auto", mb: 2 }}>
          Your applied jobs will appear here when you apply for positions. Start exploring opportunities now.
        </Typography>
        <Button
          component={onBrowseJobs ? "button" : Link}
          href={onBrowseJobs ? undefined : "/jobs-v2"}
          onClick={onBrowseJobs}
          variant="contained"
          size="medium"
          endIcon={<ArrowRight size={18} />}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            px: 3,
            backgroundColor: "#6366f1",
            "&:hover": { backgroundColor: "#4f46e5" },
          }}
        >
          Browse Jobs
        </Button>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Final Placement Highlight */}
      {selectedApplications.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: "2px solid",
            borderColor: "#16a34a",
            background: "linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.02) 100%)",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: "linear-gradient(90deg, #16a34a, #22c55e)",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                backgroundColor: "rgba(34, 197, 94, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Award size={28} style={{ color: "#16a34a" }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#15803d" }}>
                Final Placement
              </Typography>
              <Typography variant="caption" sx={{ color: "#16a34a", fontWeight: 500 }}>
                Congratulations on your selection!
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {selectedApplications.map((app) => (
              <Box
                key={app.id}
                component={Link}
                href={`/jobs-v2/${app.job}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  py: 1.5,
                  px: 2,
                  borderRadius: 2,
                  backgroundColor: "rgba(255,255,255,0.6)",
                  border: "1px solid",
                  borderColor: "rgba(34, 197, 94, 0.2)",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.9)",
                    borderColor: "#16a34a",
                    boxShadow: "0 2px 8px rgba(34, 197, 94, 0.15)",
                  },
                }}
              >
                <CheckCircle2 size={24} style={{ color: "#16a34a", flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "#0f172a" }}>
                    {app.job_title} at {app.company_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Selected
                  </Typography>
                </Box>
                <ArrowRight size={18} style={{ color: "#94a3b8", flexShrink: 0 }} />
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Stats Summary */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" },
          gap: 1.5,
        }}
      >
        {(["applied", "shortlisted", "interview_stage", "selected", "rejected"] as const).map(
          (status) => {
            const count = statusCounts[status] ?? 0;
            const style = getStatusStyle(status);
            return (
              <Paper
                key={status}
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: count > 0 ? `${style.color}30` : "rgba(0,0,0,0.06)",
                  backgroundColor: count > 0 ? `${style.bg}` : "#fafbfc",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Box sx={{ color: style.color, display: "flex", alignItems: "center" }}>
                  <StatusIcon status={status} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: count > 0 ? style.color : "#94a3b8", lineHeight: 1.2 }}>
                    {count}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem" }}>
                    {STATUS_LABELS[status]}
                  </Typography>
                </Box>
              </Paper>
            );
          }
        )}
      </Box>

      {/* Header & Filters */}
      <Box>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a" }}>
              Your Applications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {applications.length} total
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 0.5,
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: "rgba(0,0,0,0.12)",
                backgroundColor: "#fff",
              }}
            >
              <TrendingUp size={14} style={{ color: "#64748b" }} />
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                Sort:
              </Typography>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#0f172a",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="company">Company A–Z</option>
              </select>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                flexWrap: "wrap",
              }}
            >
              <Filter size={16} style={{ color: "#64748b" }} />
              {(["all", "applied", "shortlisted", "interview_stage", "selected", "rejected"] as const).map(
                (status) => {
                  const count = status === "all" ? applications.length : statusCounts[status] ?? 0;
                  const isActive = statusFilter === status;
                  const style = status === "all" ? null : getStatusStyle(status);
                  return (
                    <Chip
                      key={status}
                      label={status === "all" ? "All" : STATUS_LABELS[status]}
                      size="small"
                      onClick={() => setStatusFilter(status)}
                      sx={{
                        mr: 0.5,
                        mb: 0.5,
                        fontWeight: isActive ? 600 : 500,
                        backgroundColor: isActive
                          ? style?.bg ?? "rgba(99, 102, 241, 0.12)"
                          : "transparent",
                        color: isActive ? style?.color ?? "#6366f1" : "#64748b",
                        border: "1px solid",
                        borderColor: isActive ? (style?.color ?? "#6366f1") : "rgba(0,0,0,0.12)",
                        "&:hover": {
                          backgroundColor: isActive
                            ? style?.bg ?? "rgba(99, 102, 241, 0.12)"
                            : "rgba(0,0,0,0.04)",
                        },
                      }}
                    />
                  );
                }
              )}
          </Box>
        </Box>
        </Box>
        {/* Applied Jobs List */}
        {filteredApplications.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 2,
              border: "1px dashed",
              borderColor: "divider",
              backgroundColor: "#fafbfc",
            }}
          >
            <Filter size={32} style={{ color: "#94a3b8", marginBottom: 8 }} />
            <Typography variant="body2" color="text.secondary">
              No applications with status &quot;{STATUS_LABELS[statusFilter] ?? statusFilter}&quot;
            </Typography>
            <Button
              size="small"
              onClick={() => setStatusFilter("all")}
              sx={{ mt: 1.5, textTransform: "none", color: "#6366f1" }}
            >
              Show all ({applications.length})
            </Button>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {filteredApplications.map((app) => {
              const style = getStatusStyle(app.status);
              const updatedRecently =
                app.updated_at &&
                new Date(app.updated_at).getTime() - new Date(app.applied_at).getTime() > 60000;
              return (
                <Paper
                  key={app.id}
                  elevation={0}
                  component={Link}
                  href={`/jobs-v2/${app.job}`}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "rgba(0,0,0,0.08)",
                    backgroundColor: "#fff",
                    textDecoration: "none",
                    color: "inherit",
                    display: "block",
                    transition: "all 0.2s ease",
                    position: "relative",
                    overflow: "hidden",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      backgroundColor: style.color,
                      opacity: 0.6,
                    },
                    "&:hover": {
                      borderColor: "rgba(99, 102, 241, 0.4)",
                      boxShadow: "0 4px 16px rgba(99, 102, 241, 0.1)",
                      "&::before": { opacity: 1 },
                    },
                  }}
                >
                  <Box sx={{ pl: 1.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        flexWrap: "wrap",
                        gap: 2,
                        alignItems: { sm: "center" },
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, color: "#0f172a", mb: 0.25 }}
                        >
                          {app.job_title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {app.company_name}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                          <Typography variant="caption" color="text.secondary">
                            Applied {formatDate(app.applied_at)}
                          </Typography>
                          {updatedRecently && (
                            <Typography variant="caption" sx={{ color: "#64748b" }}>
                              · Updated {formatDate(app.updated_at)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          flexWrap: "wrap",
                        }}
                      >
                        <Chip
                          icon={<StatusIcon status={app.status} />}
                          label={STATUS_LABELS[app.status] ?? app.status}
                          size="small"
                          sx={{
                            backgroundColor: style.bg,
                            color: style.color,
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            "& .MuiChip-icon": {
                              color: "inherit",
                              marginLeft: "8px",
                              marginRight: "-4px",
                            },
                          }}
                        />
                        <ArrowRight
                          size={18}
                          style={{ color: "#94a3b8", opacity: 0.6, flexShrink: 0 }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Browse more CTA */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          pt: 1,
        }}
      >
        <Button
          component={onBrowseJobs ? "button" : Link}
          href={onBrowseJobs ? undefined : "/jobs-v2"}
          onClick={onBrowseJobs}
          variant="outlined"
          size="small"
          endIcon={<ArrowRight size={16} />}
          sx={{
            textTransform: "none",
            fontWeight: 500,
            borderRadius: 2,
            borderColor: "rgba(99, 102, 241, 0.4)",
            color: "#6366f1",
            "&:hover": { borderColor: "#6366f1", backgroundColor: "rgba(99, 102, 241, 0.06)" },
          }}
        >
          Browse more jobs
        </Button>
      </Box>
    </Box>
  );
}
