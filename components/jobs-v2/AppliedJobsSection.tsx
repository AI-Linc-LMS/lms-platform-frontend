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
  applying: {
    bg: "color-mix(in srgb, var(--accent-indigo) 16%, transparent)",
    color: "var(--accent-indigo)",
  },
  applied: {
    bg: "color-mix(in srgb, var(--accent-indigo) 14%, transparent)",
    color: "var(--accent-indigo)",
  },
  shortlisted: {
    bg: "color-mix(in srgb, var(--success-500) 14%, transparent)",
    color: "var(--success-500)",
  },
  interview_stage: {
    bg: "color-mix(in srgb, var(--warning-500) 14%, transparent)",
    color: "var(--warning-500)",
  },
  rejected: {
    bg: "color-mix(in srgb, var(--error-500) 14%, transparent)",
    color: "var(--error-500)",
  },
  selected: {
    bg: "color-mix(in srgb, var(--success-500) 24%, transparent)",
    color: "var(--success-500)",
  },
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
        <CircularProgress size={40} sx={{ color: "var(--accent-indigo)" }} />
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
          borderColor: "color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
          borderRadius: 3,
          backgroundColor:
            "color-mix(in srgb, var(--accent-indigo) 4%, transparent)",
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          <Briefcase size={40} style={{ color: "var(--accent-indigo)" }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--font-primary)", mb: 0.5 }}>
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
            backgroundColor: "var(--accent-indigo)",
            "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
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
            borderColor: "var(--success-500)",
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--success-500) 10%, transparent) 0%, color-mix(in srgb, var(--success-500) 4%, transparent) 100%)",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background:
                "linear-gradient(90deg, var(--success-500), color-mix(in srgb, var(--success-500) 85%, var(--accent-indigo-dark)))",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                backgroundColor:
                  "color-mix(in srgb, var(--success-500) 18%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Award size={28} style={{ color: "var(--success-500)" }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--success-500)" }}>
                Final Placement
              </Typography>
              <Typography variant="caption" sx={{ color: "var(--success-500)", fontWeight: 500 }}>
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
                  backgroundColor: "color-mix(in srgb, var(--font-light) 60%, transparent)",
                  border: "1px solid",
                  borderColor:
                    "color-mix(in srgb, var(--success-500) 25%, transparent)",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "color-mix(in srgb, var(--font-light) 90%, transparent)",
                    borderColor: "var(--success-500)",
                    boxShadow:
                      "0 2px 8px color-mix(in srgb, var(--success-500) 20%, transparent)",
                  },
                }}
              >
                <CheckCircle2 size={24} style={{ color: "var(--success-500)", flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
                    {app.job_title} at {app.company_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Selected
                  </Typography>
                </Box>
                <ArrowRight size={18} style={{ color: "var(--font-tertiary)", flexShrink: 0 }} />
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
                  borderColor: count > 0 ? `${style.color}30` : "color-mix(in srgb, var(--font-primary) 8%, transparent)",
                  backgroundColor: count > 0 ? `${style.bg}` : "var(--surface)",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Box sx={{ color: style.color, display: "flex", alignItems: "center" }}>
                  <StatusIcon status={status} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: count > 0 ? style.color : "var(--font-tertiary)", lineHeight: 1.2 }}>
                    {count}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontSize: "0.7rem" }}>
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
            <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
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
                borderColor: "color-mix(in srgb, var(--font-primary) 15%, transparent)",
                backgroundColor: "var(--card-bg)",
              }}
            >
              <TrendingUp size={14} style={{ color: "var(--font-secondary)" }} />
              <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
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
                  color: "var(--font-primary)",
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
              <Filter size={16} style={{ color: "var(--font-secondary)" }} />
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
                          ? style?.bg ??
                            "color-mix(in srgb, var(--accent-indigo) 16%, transparent)"
                          : "transparent",
                        color: isActive ? style?.color ?? "var(--accent-indigo)" : "var(--font-secondary)",
                        border: "1px solid",
                        borderColor: isActive ? (style?.color ?? "var(--accent-indigo)") : "color-mix(in srgb, var(--font-primary) 15%, transparent)",
                        "&:hover": {
                          backgroundColor: isActive
                            ? style?.bg ??
                              "color-mix(in srgb, var(--accent-indigo) 16%, transparent)"
                            : "color-mix(in srgb, var(--font-primary) 6%, transparent)",
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
              backgroundColor: "var(--surface)",
            }}
          >
            <Filter size={32} style={{ color: "var(--font-tertiary)", marginBottom: 8 }} />
            <Typography variant="body2" color="text.secondary">
              No applications with status &quot;{STATUS_LABELS[statusFilter] ?? statusFilter}&quot;
            </Typography>
            <Button
              size="small"
              onClick={() => setStatusFilter("all")}
              sx={{ mt: 1.5, textTransform: "none", color: "var(--accent-indigo)" }}
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
                    borderColor: "color-mix(in srgb, var(--font-primary) 10%, transparent)",
                    backgroundColor: "var(--card-bg)",
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
                      borderColor: "color-mix(in srgb, var(--accent-indigo) 45%, transparent)",
                      boxShadow: "0 4px 16px color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
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
                          sx={{ fontWeight: 600, color: "var(--font-primary)", mb: 0.25 }}
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
                            <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
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
                          style={{ color: "var(--font-tertiary)", opacity: 0.6, flexShrink: 0 }}
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
            borderColor: "color-mix(in srgb, var(--accent-indigo) 45%, transparent)",
            color: "var(--accent-indigo)",
            "&:hover": { borderColor: "var(--accent-indigo)", backgroundColor: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)" },
          }}
        >
          Browse more jobs
        </Button>
      </Box>
    </Box>
  );
}
