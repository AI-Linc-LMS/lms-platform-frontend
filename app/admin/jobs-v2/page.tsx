"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { adminJobsV2Service } from "@/lib/services/admin/admin-jobs-v2.service";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { config } from "@/lib/config";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyJobsIllustration } from "@/components/jobs-v2/illustrations";
import { Users, CheckSquare, X } from "lucide-react";

const JOB_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  active: { bg: "rgba(34, 197, 94, 0.12)", color: "#16a34a" },
  inactive: { bg: "rgba(99, 102, 241, 0.12)", color: "#6366f1" },
  closed: { bg: "rgba(100, 116, 139, 0.12)", color: "#64748b" },
  completed: { bg: "rgba(34, 197, 94, 0.08)", color: "#15803d" },
  on_hold: { bg: "rgba(245, 158, 11, 0.12)", color: "#d97706" },
};

export default function AdminJobsV2Page() {
  const router = useRouter();
  const { showToast } = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [jobs, setJobs] = useState<JobV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<
    "active" | "inactive" | "closed" | "completed" | "on_hold" | ""
  >("");
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; job: JobV2 } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<JobV2 | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [bulkVisibility, setBulkVisibility] = useState<string>(""); // "" | "published" | "draft"
  const [updating, setUpdating] = useState(false);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminJobsV2Service.getJobs(config.clientId, {
        status: statusFilter || undefined,
      });
      setJobs(data.results ?? []);
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to load jobs", "error");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [showToast, statusFilter]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleRowClick = useCallback(
    (job: JobV2) => {
      router.push(`/admin/jobs-v2/${job.id}`);
    },
    [router]
  );

  const handleMenuOpen = (e: React.MouseEvent, job: JobV2) => {
    e.stopPropagation();
    setMenuAnchor({ el: e.currentTarget as HTMLElement, job });
  };

  const handleMenuClose = () => setMenuAnchor(null);

  const handleMenuEdit = () => {
    if (menuAnchor) {
      router.push(`/admin/jobs-v2/${menuAnchor.job.id}/edit`);
    }
    handleMenuClose();
  };

  const handleMenuApplications = () => {
    if (menuAnchor) {
      router.push(`/admin/jobs-v2/${menuAnchor.job.id}/applications`);
    }
    handleMenuClose();
  };

  const handleMenuDelete = () => {
    if (menuAnchor) setDeleteConfirm(menuAnchor.job);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      await adminJobsV2Service.deleteJob(deleteConfirm.id, config.clientId);
      showToast("Job deleted successfully", "success");
      setDeleteConfirm(null);
      loadJobs();
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to delete job", "error");
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allSelected = jobs.length > 0 && jobs.every((j) => selectedIds.has(j.id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(jobs.map((j) => j.id)));
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.size === 0) return;
    if (!bulkStatus && !bulkVisibility) return;
    try {
      setUpdating(true);
      const ids = Array.from(selectedIds);
      if (bulkStatus) {
        await adminJobsV2Service.bulkUpdateJobStatus(
          ids,
          bulkStatus as "active" | "inactive" | "closed" | "completed" | "on_hold",
          config.clientId
        );
      }
      if (bulkVisibility) {
        await adminJobsV2Service.bulkUpdateJobVisibility(
          ids,
          bulkVisibility === "published",
          config.clientId
        );
      }
      showToast(`Updated ${ids.length} job(s)`, "success");
      setSelectedIds(new Set());
      setBulkStatus("");
      setBulkVisibility("");
      loadJobs();
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to bulk update", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = async (job: JobV2, status: string) => {
    try {
      setUpdating(true);
      await adminJobsV2Service.updateJob(job.id, { status: status as JobV2["status"] }, config.clientId);
      showToast("Status updated", "success");
      loadJobs();
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to update status", "error");
    } finally {
      setUpdating(false);
    }
  };

  const JOB_STATUS_OPTIONS = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "closed", label: "Closed" },
    { value: "completed", label: "Completed" },
    { value: "on_hold", label: "On Hold" },
  ] as const;

  const formatDate = (d?: string) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  const formatCourses = (job: JobV2) => {
    const list = job.courses ?? [];
    if (list.length === 0) return "—";
    if (list.length <= 2) return list.map((c) => c.title).join(", ");
    return `${list[0].title} +${list.length - 1} more`;
  };

  const daysUntilDeadline = (d?: string) => {
    if (!d) return null;
    try {
      const now = new Date();
      const deadline = new Date(d);
      const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff;
    } catch {
      return null;
    }
  };

  return (
    <MainLayout>
      <Box
        sx={{
          minHeight: "100%",
          background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
          p: { xs: 2, md: 3 },
        }}
      >
        {/* Page header - clean, icon-free */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "flex-end" },
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
            pb: 2,
            borderBottom: "1px solid",
            borderColor: "rgba(0,0,0,0.06)",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, flexWrap: "wrap" }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1.5rem", sm: "1.75rem" },
                  letterSpacing: "-0.025em",
                  color: "#0f172a",
                  lineHeight: 1.2,
                }}
              >
                Jobs
              </Typography>
              {!loading && jobs.length > 0 && (
                <Chip
                  label={`${jobs.length} ${jobs.length === 1 ? "job" : "jobs"}`}
                  size="small"
                  sx={{
                    height: 24,
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    backgroundColor: "rgba(99, 102, 241, 0.1)",
                    color: "#6366f1",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                  }}
                />
              )}
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: "#64748b",
                mt: 0.5,
                fontSize: "0.9375rem",
              }}
            >
              Manage job postings and applications
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
            <FormControl
              size="small"
              sx={{
                minWidth: 140,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#fff",
                  borderRadius: 2,
                  fontSize: "0.875rem",
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(99, 102, 241, 0.5)" },
                },
              }}
            >
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={statusFilter}
                label="Filter by Status"
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "active" | "inactive" | "closed" | "completed" | "on_hold" | ""
                  )
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="on_hold">On Hold</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              component={Link}
              href="/admin/jobs-v2/reports"
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                borderColor: "rgba(99, 102, 241, 0.4)",
                color: "#6366f1",
                "&:hover": { borderColor: "#6366f1", backgroundColor: "rgba(99, 102, 241, 0.06)" },
              }}
            >
              Reports
            </Button>
            <Button
              variant="contained"
              component={Link}
              href="/admin/jobs-v2/new"
              startIcon={<IconWrapper icon="mdi:plus" size={20} />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                backgroundColor: "#6366f1",
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
                "&:hover": { backgroundColor: "#4f46e5", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)" },
              }}
            >
              Create Job
            </Button>
          </Box>
        </Box>

        {selectedIds.size > 0 && (
          <Paper
            elevation={0}
            sx={{
              mb: 2,
              p: 2,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "center" },
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
              border: "2px solid",
              borderColor: "rgba(99, 102, 241, 0.4)",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(99, 102, 241, 0.02) 100%)",
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.08)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  backgroundColor: "rgba(99, 102, 241, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckSquare size={20} style={{ color: "#6366f1" }} />
              </Box>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 700, color: "#0f172a" }}>
                  {selectedIds.size} job{selectedIds.size !== 1 ? "s" : ""} selected
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Change status and/or visibility for selected jobs
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => { setSelectedIds(new Set()); setBulkStatus(""); setBulkVisibility(""); }}
                startIcon={<X size={16} />}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  color: "text.secondary",
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.04)", color: "text.primary" },
                }}
              >
                Clear
              </Button>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", width: { xs: "100%", sm: "auto" } }}>
              <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 160 }, flex: { xs: 1, sm: "none" } }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={bulkStatus}
                  label="Status"
                  onChange={(e) => setBulkStatus(e.target.value)}
                  sx={{
                    backgroundColor: "#fff",
                    borderRadius: 2,
                    fontWeight: 600,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(99, 102, 241, 0.4)" },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#6366f1" },
                  }}
                >
                  <MenuItem value="">—</MenuItem>
                  {JOB_STATUS_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: (JOB_STATUS_STYLES[o.value] ?? JOB_STATUS_STYLES.active).color,
                          }}
                        />
                        {o.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 140 }, flex: { xs: 1, sm: "none" } }}>
                <InputLabel>Visibility</InputLabel>
                <Select
                  value={bulkVisibility}
                  label="Visibility"
                  onChange={(e) => setBulkVisibility(e.target.value)}
                  sx={{
                    backgroundColor: "#fff",
                    borderRadius: 2,
                    fontWeight: 600,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(99, 102, 241, 0.4)" },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#6366f1" },
                  }}
                >
                  <MenuItem value="">—</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={handleBulkUpdate}
                disabled={(!bulkStatus && !bulkVisibility) || updating}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  backgroundColor: "#6366f1",
                  px: 3,
                  py: 1.25,
                  borderRadius: 2,
                  boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
                  "&:hover": { backgroundColor: "#4f46e5", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)" },
                  "&:disabled": { backgroundColor: "rgba(99, 102, 241, 0.5)" },
                }}
              >
                {updating ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={16} sx={{ color: "#fff" }} />
                    Updating...
                  </Box>
                ) : (
                  "Apply to Selected"
                )}
              </Button>
            </Box>
          </Paper>
        )}

        <Paper
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "rgba(0,0,0,0.06)",
            borderRadius: 2,
            overflow: "hidden",
            backgroundColor: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          {loading ? (
            <Box
              sx={{
                p: 8,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                backgroundColor: "#fff",
              }}
            >
              <CircularProgress sx={{ color: "#6366f1" }} size={44} thickness={3} />
              <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>
                Loading jobs...
              </Typography>
            </Box>
          ) : jobs.length === 0 ? (
            <Box
              sx={{
                p: 8,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                backgroundColor: "#fff",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  backgroundColor: "rgba(99, 102, 241, 0.04)",
                  display: "inline-flex",
                }}
              >
                <EmptyJobsIllustration width={120} height={100} />
              </Box>
              <Typography variant="h6" sx={{ mt: 3, fontWeight: 700, color: "#0f172a" }}>
                No jobs yet
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: "#64748b", maxWidth: 320 }}>
                Create your first job to start receiving applications from students.
              </Typography>
              <Button
                variant="contained"
                component={Link}
                href="/admin/jobs-v2/new"
                startIcon={<IconWrapper icon="mdi:plus" size={20} />}
                sx={{
                  mt: 3,
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  backgroundColor: "#6366f1",
                  "&:hover": { backgroundColor: "#4f46e5" },
                }}
              >
                Create Job
              </Button>
            </Box>
          ) : isMobile ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                p: 2,
                maxHeight: { xs: "calc(100vh - 200px)", sm: 800 },
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: "rgba(99, 102, 241, 0.05)",
                  border: "1px solid rgba(99, 102, 241, 0.12)",
                }}
              >
                <Checkbox
                  checked={jobs.length > 0 && jobs.every((j) => selectedIds.has(j.id))}
                  indeterminate={selectedIds.size > 0 && selectedIds.size < jobs.length}
                  onChange={toggleSelectAll}
                  sx={{ color: "#64748b", "&.Mui-checked": { color: "#6366f1" } }}
                />
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }}>
                  Select all
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  {jobs.length} jobs
                </Typography>
              </Box>
              {jobs.map((job) => {
                const days = daysUntilDeadline(job.application_deadline);
                const isUrgent = days !== null && days >= 0 && days <= 7;
                return (
                  <Paper
                    key={job.id}
                    elevation={0}
                    onClick={() => handleRowClick(job)}
                    sx={{
                      p: 2.5,
                      cursor: "pointer",
                      border: "1px solid",
                      borderColor: "rgba(0,0,0,0.06)",
                      borderRadius: 2,
                      transition: "all 0.2s ease",
                      backgroundColor: "#fff",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      "&:hover": {
                        borderColor: "rgba(99, 102, 241, 0.35)",
                        backgroundColor: "rgba(99, 102, 241, 0.02)",
                        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.1)",
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                      <Checkbox
                        checked={selectedIds.has(job.id)}
                        onChange={(e) => { e.stopPropagation(); toggleSelect(job.id); }}
                        sx={{ color: "#64748b", "&.Mui-checked": { color: "#6366f1" }, p: 0, mt: 0.5 }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Avatar
                        src={job.company_logo}
                        alt={job.company_name}
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1.5,
                          backgroundColor: "#eef2ff",
                          color: "#6366f1",
                          fontSize: "1rem",
                          fontWeight: 600,
                          flexShrink: 0,
                          border: "1px solid rgba(99, 102, 241, 0.12)",
                        }}
                      >
                        {job.company_name?.[0]?.toUpperCase() || "C"}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: "#0f172a", mb: 0.25, lineHeight: 1.3 }}>
                          {job.job_title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#64748b", display: "block", mb: 1.5 }}>
                          {job.company_name}
                          {job.location && ` • ${job.location}`}
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
                          <FormControl size="small" sx={{ minWidth: 110 }} onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={job.status ?? "active"}
                              onChange={(e) => handleStatusChange(job, e.target.value)}
                              disabled={updating}
                              sx={{
                                fontSize: "0.75rem",
                                height: 28,
                                fontWeight: 600,
                                borderRadius: 1.5,
                                backgroundColor: (JOB_STATUS_STYLES[job.status ?? "active"] ?? JOB_STATUS_STYLES.active).bg,
                                color: (JOB_STATUS_STYLES[job.status ?? "active"] ?? JOB_STATUS_STYLES.active).color,
                                "& .MuiSelect-select": { py: 0.25 },
                                "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
                                "&:hover": { opacity: 0.9 },
                              }}
                            >
                              {JOB_STATUS_OPTIONS.map((o) => (
                                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Chip
                            label={job.is_published ? "Published" : "Draft"}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 26,
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              borderColor: job.is_published ? "rgba(34, 197, 94, 0.5)" : "rgba(100, 116, 139, 0.5)",
                              color: job.is_published ? "#16a34a" : "#64748b",
                              backgroundColor: job.is_published ? "rgba(34, 197, 94, 0.08)" : "rgba(100, 116, 139, 0.08)",
                            }}
                          />
                          <Box
                            component={Link}
                            href={`/admin/jobs-v2/${job.id}/applications`}
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.5,
                              px: 1.25,
                              py: 0.5,
                              borderRadius: 1.5,
                              backgroundColor: "rgba(99, 102, 241, 0.08)",
                              color: "#6366f1",
                              textDecoration: "none",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.15)" },
                            }}
                          >
                            <Users size={14} />
                            {job.applications_count ?? 0}
                          </Box>
                        </Box>
                        <Box sx={{ display: "flex", gap: 2, mt: 1.5, flexWrap: "wrap" }}>
                          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                            Created {formatDate(job.created_at)}
                          </Typography>
                          {job.application_deadline && (
                            <Typography variant="caption" sx={{ color: isUrgent ? "#d97706" : "#94a3b8", fontWeight: isUrgent ? 600 : 400 }}>
                              Closes {formatDate(job.application_deadline)}
                              {isUrgent && days !== null && ` • ${days === 0 ? "Today" : days === 1 ? "1 day" : `${days} days`} left`}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, job);
                        }}
                        sx={{ color: "#94a3b8", flexShrink: 0, "&:hover": { color: "#64748b" } }}
                        aria-label="Actions"
                      >
                        <IconWrapper icon="mdi:dots-vertical" size={20} />
                      </IconButton>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 880 }}>
              <Table
                stickyHeader
                size="small"
                sx={{
                  "& .MuiTableCell-root": { py: 1.75, px: 2, borderBottom: "1px solid rgba(0,0,0,0.05)" },
                  "& .MuiTableRow-root:last-child td": { borderBottom: 0 },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell
                      padding="checkbox"
                      sx={{
                        fontWeight: 600,
                        backgroundColor: "#f1f5f9",
                        width: 48,
                        borderBottom: "1px solid rgba(0,0,0,0.08)",
                        py: 2,
                      }}
                    >
                      <Checkbox
                        checked={jobs.length > 0 && jobs.every((j) => selectedIds.has(j.id))}
                        indeterminate={selectedIds.size > 0 && selectedIds.size < jobs.length}
                        onChange={toggleSelectAll}
                        sx={{ color: "#64748b", "&.Mui-checked": { color: "#6366f1" } }}
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        backgroundColor: "#f1f5f9",
                        minWidth: 200,
                        borderBottom: "1px solid rgba(0,0,0,0.08)",
                        color: "#334155",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                        py: 2,
                      }}
                    >
                      Job
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        backgroundColor: "#f1f5f9",
                        minWidth: 120,
                        borderBottom: "1px solid rgba(0,0,0,0.08)",
                        color: "#334155",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                        py: 2,
                      }}
                    >
                      Company
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        backgroundColor: "#f1f5f9",
                        minWidth: 100,
                        borderBottom: "1px solid rgba(0,0,0,0.08)",
                        color: "#334155",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                        py: 2,
                      }}
                      align="center"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        backgroundColor: "#f1f5f9",
                        width: 100,
                        minWidth: 100,
                        borderBottom: "1px solid rgba(0,0,0,0.08)",
                        color: "#334155",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                        py: 2,
                      }}
                      align="center"
                    >
                      Visibility
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        backgroundColor: "#f1f5f9",
                        minWidth: 140,
                        borderBottom: "1px solid rgba(0,0,0,0.08)",
                        color: "#334155",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                        py: 2,
                      }}
                    >
                      Courses
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        backgroundColor: "#f1f5f9",
                        width: 100,
                        minWidth: 90,
                        borderBottom: "1px solid rgba(0,0,0,0.08)",
                        color: "#334155",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                        py: 2,
                      }}
                      align="center"
                    >
                      Applicants
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        backgroundColor: "#f1f5f9",
                        minWidth: 95,
                        borderBottom: "1px solid rgba(0,0,0,0.08)",
                        color: "#334155",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                        py: 2,
                      }}
                    >
                      Created
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        backgroundColor: "#f1f5f9",
                        minWidth: 110,
                        borderBottom: "1px solid rgba(0,0,0,0.08)",
                        color: "#334155",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                        py: 2,
                      }}
                    >
                      Closing Date
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        backgroundColor: "#f1f5f9",
                        width: 80,
                        minWidth: 80,
                        borderBottom: "1px solid rgba(0,0,0,0.08)",
                        color: "#334155",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                        py: 2,
                      }}
                      align="right"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow
                      key={job.id}
                      hover
                      onClick={() => handleRowClick(job)}
                      sx={{
                        cursor: "pointer",
                        "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.04)" },
                      }}
                    >
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(job.id)}
                          onChange={() => toggleSelect(job.id)}
                          sx={{ color: "#64748b", "&.Mui-checked": { color: "#6366f1" } }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar
                            src={job.company_logo}
                            alt={job.company_name}
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 1.5,
                              backgroundColor: "#eef2ff",
                              color: "#6366f1",
                              fontSize: "0.9375rem",
                              fontWeight: 600,
                              border: "1px solid rgba(99, 102, 241, 0.12)",
                            }}
                          >
                            {job.company_name?.[0]?.toUpperCase() || "C"}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a", lineHeight: 1.3 }}>
                              {job.job_title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                              {job.company_name}
                              {job.location && ` • ${job.location}`}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 160 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: "#334155" }}>
                          {job.company_name}
                        </Typography>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <FormControl size="small" sx={{ minWidth: 110 }}>
                          <Select
                            value={job.status ?? "active"}
                            onChange={(e) => handleStatusChange(job, e.target.value)}
                            disabled={updating}
                            sx={{
                              fontSize: "0.75rem",
                              height: 30,
                              fontWeight: 600,
                              borderRadius: 1.5,
                              backgroundColor: (JOB_STATUS_STYLES[job.status ?? "active"] ?? JOB_STATUS_STYLES.active).bg,
                              color: (JOB_STATUS_STYLES[job.status ?? "active"] ?? JOB_STATUS_STYLES.active).color,
                              "& .MuiSelect-select": { py: 0.35 },
                              "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
                              "&:hover": { opacity: 0.9 },
                            }}
                          >
                            {JOB_STATUS_OPTIONS.map((o) => (
                              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={job.is_published ? "Published" : "Draft"}
                          size="small"
                          variant="outlined"
                          sx={{
                            height: 24,
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            borderColor: job.is_published ? "rgba(34, 197, 94, 0.5)" : "rgba(100, 116, 139, 0.5)",
                            color: job.is_published ? "#16a34a" : "#64748b",
                            backgroundColor: job.is_published ? "rgba(34, 197, 94, 0.08)" : "rgba(100, 116, 139, 0.08)",
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Tooltip title={(job.courses ?? []).map((c) => c.title).join(", ") || "—"} arrow>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#64748b",
                              fontSize: "0.8125rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 180,
                            }}
                          >
                            {formatCourses(job)}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View applicants" arrow>
                          <Box
                            component={Link}
                            href={`/admin/jobs-v2/${job.id}/applications`}
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.5,
                              px: 1.25,
                              py: 0.5,
                              borderRadius: 1.5,
                              backgroundColor: "rgba(99, 102, 241, 0.08)",
                              color: "#6366f1",
                              textDecoration: "none",
                              fontWeight: 600,
                              fontSize: "0.8rem",
                              transition: "all 0.2s",
                              "&:hover": {
                                backgroundColor: "rgba(99, 102, 241, 0.15)",
                                color: "#4f46e5",
                              },
                            }}
                          >
                            <Users size={16} />
                            {job.applications_count ?? 0}
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8125rem" }}>
                          {formatDate(job.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {job.application_deadline ? (
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                            <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8125rem" }}>
                              {formatDate(job.application_deadline)}
                            </Typography>
                            {(() => {
                              const days = daysUntilDeadline(job.application_deadline);
                              if (days !== null && days >= 0 && days <= 7) {
                                return (
                                  <Typography variant="caption" sx={{ color: "#d97706", fontWeight: 600 }}>
                                    {days === 0 ? "Today" : days === 1 ? "1 day left" : `${days} days left`}
                                  </Typography>
                                );
                              }
                              return null;
                            })()}
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: "#94a3b8" }}>—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Actions" arrow>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, job)}
                            sx={{ color: "text.secondary" }}
                            aria-label="Actions"
                          >
                            <IconWrapper icon="mdi:dots-vertical" size={20} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Menu
          anchorEl={menuAnchor?.el ?? null}
          open={!!menuAnchor}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: {
              sx: {
                minWidth: 180,
                borderRadius: 2,
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                mt: 1.5,
              },
            },
          }}
        >
          <MenuItem onClick={handleMenuEdit}>
            <ListItemIcon>
              <IconWrapper icon="mdi:pencil" size={18} />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuApplications}>
            <ListItemIcon>
              <IconWrapper icon="mdi:account-group" size={18} />
            </ListItemIcon>
            <ListItemText>Applications</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuDelete} sx={{ color: "error.main" }}>
            <ListItemIcon>
              <IconWrapper icon="mdi:delete-outline" size={18} />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        <ConfirmDialog
          open={!!deleteConfirm}
          title="Delete Job"
          message={
            deleteConfirm
              ? `Are you sure you want to delete "${deleteConfirm.job_title}"? This action cannot be undone.`
              : ""
          }
          confirmText="Delete"
          cancelText="Cancel"
          confirmColor="error"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />

      </Box>
    </MainLayout>
  );
}
