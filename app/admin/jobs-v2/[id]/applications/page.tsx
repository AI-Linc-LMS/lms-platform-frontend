"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Avatar,
  Chip,
  Skeleton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { adminJobsV2Service } from "@/lib/services/admin/admin-jobs-v2.service";
import type { JobApplicationV2, JobV2 } from "@/lib/services/jobs-v2.service";
import { config } from "@/lib/config";
import { ApplicationsIllustration } from "@/components/jobs-v2/illustrations";
import { IconWrapper } from "@/components/common/IconWrapper";
import { FileDown, Users } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "applying", label: "Applying" },
  { value: "applied", label: "Applied" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Rejected" },
  { value: "selected", label: "Selected" },
] as const;

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  applying: { bg: "rgba(99, 102, 241, 0.12)", color: "#6366f1" },
  applied: { bg: "rgba(59, 130, 246, 0.12)", color: "#2563eb" },
  shortlisted: { bg: "rgba(34, 197, 94, 0.12)", color: "#16a34a" },
  rejected: { bg: "rgba(239, 68, 68, 0.12)", color: "#dc2626" },
  selected: { bg: "rgba(34, 197, 94, 0.2)", color: "#15803d" },
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

export default function JobApplicationsPage() {
  const params = useParams();
  const { showToast } = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const jobId = Number(params?.id);
  const [job, setJob] = useState<JobV2 | null>(null);
  const [applications, setApplications] = useState<JobApplicationV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadJob = useCallback(async () => {
    if (!jobId || isNaN(jobId)) return;
    try {
      const data = await adminJobsV2Service.getJob(jobId, config.clientId);
      setJob(data);
    } catch {
      setJob(null);
    }
  }, [jobId]);

  const loadApplications = useCallback(async () => {
    if (!jobId || isNaN(jobId)) return;
    try {
      setLoading(true);
      const data = await adminJobsV2Service.getJobApplications(jobId, config.clientId);
      setApplications(data.results ?? []);
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to load applications", "error");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [jobId, showToast]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleStatusChange = useCallback(
    async (appId: number, status: string) => {
      try {
        setUpdating(true);
        await adminJobsV2Service.updateApplicationStatus(
          appId,
          status as "applying" | "applied" | "shortlisted" | "rejected" | "selected",
          config.clientId
        );
        showToast("Status updated", "success");
        loadApplications();
      } catch (err) {
        showToast((err as Error)?.message ?? "Failed to update", "error");
      } finally {
        setUpdating(false);
      }
    },
    [loadApplications, showToast]
  );

  const handleBulkUpdate = useCallback(async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    try {
      setUpdating(true);
        await adminJobsV2Service.bulkUpdateApplicationStatus(
          Array.from(selectedIds),
          bulkStatus as "applying" | "applied" | "shortlisted" | "rejected" | "selected",
        config.clientId
      );
      showToast(`Updated ${selectedIds.size} application(s)`, "success");
      setSelectedIds(new Set());
      setBulkStatus("");
      loadApplications();
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to bulk update", "error");
    } finally {
      setUpdating(false);
    }
  }, [bulkStatus, selectedIds, loadApplications, showToast]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportCsv = useCallback(async () => {
    try {
      setExporting(true);
      await adminJobsV2Service.downloadExportReport({ job_id: jobId });
      showToast("CSV exported successfully", "success");
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to export CSV", "error");
    } finally {
      setExporting(false);
    }
  }, [jobId, showToast]);

  const toggleSelectAll = () => {
    if (selectedIds.size === applications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(applications.map((a) => a.id)));
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return d;
    }
  };

  const jobTitle = job?.job_title ?? applications[0]?.job_title ?? "Job";
  const companyName = job?.company_name ?? applications[0]?.company_name ?? "";

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Button
          component={Link}
          href="/admin/jobs-v2"
          startIcon={<IconWrapper icon="mdi:arrow-left" size={18} />}
          sx={{
            mb: 2,
            textTransform: "none",
            color: "text.secondary",
            fontWeight: 500,
            "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.04)", color: "#6366f1" },
          }}
        >
          Back to Jobs
        </Button>

        {/* Hero header */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            gap: { xs: 2, md: 3 },
            p: { xs: 2, md: 3 },
            mb: 3,
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              width: { xs: "100%", md: 140 },
              height: { xs: 100, md: 110 },
            }}
          >
            <ApplicationsIllustration width={100} height={80} primaryColor="#6366f1" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: "#0f172a" }}>
              Applications
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
              {companyName ? `${jobTitle} — ${companyName}` : jobTitle}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1.5,
                  backgroundColor: "#fff",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Users size={18} style={{ color: "#6366f1" }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {loading ? "—" : `${applications.length} applicant${applications.length !== 1 ? "s" : ""}`}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={handleExportCsv}
                disabled={exporting}
                startIcon={<FileDown size={16} />}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "rgba(99, 102, 241, 0.5)",
                  color: "#6366f1",
                  "&:hover": {
                    borderColor: "#6366f1",
                    backgroundColor: "rgba(99, 102, 241, 0.04)",
                  },
                }}
              >
                {exporting ? "Exporting..." : "Export CSV"}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Bulk actions bar */}
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
              border: "1px solid",
              borderColor: "rgba(99, 102, 241, 0.3)",
              backgroundColor: "rgba(99, 102, 241, 0.04)",
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#6366f1" }}>
              {selectedIds.size} selected
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", width: { xs: "100%", sm: "auto" } }}>
              <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 160 }, flex: { xs: 1, sm: "none" } }}>
                <InputLabel>Update Status</InputLabel>
                <Select
                  value={bulkStatus}
                  label="Update Status"
                  onChange={(e) => setBulkStatus(e.target.value)}
                  sx={{
                    backgroundColor: "#fff",
                    borderRadius: 1.5,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(99, 102, 241, 0.3)" },
                  }}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={handleBulkUpdate}
                disabled={!bulkStatus || updating}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  backgroundColor: "#6366f1",
                  px: 2.5,
                  borderRadius: 2,
                  "&:hover": { backgroundColor: "#4f46e5" },
                }}
              >
                {updating ? "Updating..." : "Apply"}
              </Button>
            </Box>
          </Paper>
        )}

        <Paper
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
            backgroundColor: "#fff",
          }}
        >
          {loading ? (
            <Box sx={{ p: 4 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="40%" height={24} />
                      <Skeleton variant="text" width="60%" height={20} />
                    </Box>
                    <Skeleton variant="rounded" width={100} height={32} />
                  </Box>
                ))}
              </Box>
            </Box>
          ) : applications.length === 0 ? (
            <Box
              sx={{
                p: 8,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                backgroundColor: "#fafafa",
              }}
            >
              <ApplicationsIllustration width={140} height={110} primaryColor="#cbd5e1" />
              <Typography variant="h6" sx={{ mt: 2, fontWeight: 600, color: "#0f172a" }}>
                No applications yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 320 }}>
                Applications will appear here when students apply for this job
              </Typography>
              <Button
                component={Link}
                href="/admin/jobs-v2"
                variant="outlined"
                size="small"
                sx={{ mt: 2, textTransform: "none", borderRadius: 2 }}
              >
                Back to Jobs
              </Button>
            </Box>
          ) : isMobile ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                p: 2,
                maxHeight: "calc(100vh - 380px)",
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Checkbox
                  checked={selectedIds.size === applications.length && applications.length > 0}
                  indeterminate={
                    selectedIds.size > 0 && selectedIds.size < applications.length
                  }
                  onChange={toggleSelectAll}
                  sx={{ color: "#64748b", "&.Mui-checked": { color: "#6366f1" } }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Select all
                </Typography>
              </Box>
              {applications.map((app) => {
                const statusStyle = STATUS_COLORS[app.status] ?? STATUS_COLORS.applied;
                return (
                  <Paper
                    key={app.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      backgroundColor: "#fff",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <Checkbox
                        checked={selectedIds.has(app.id)}
                        onChange={() => toggleSelect(app.id)}
                        sx={{ color: "#64748b", "&.Mui-checked": { color: "#6366f1" }, p: 0, mt: 0.5 }}
                      />
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          backgroundColor: "rgba(99, 102, 241, 0.15)",
                          color: "#6366f1",
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(app.student_name ?? "")}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
                          {app.student_name ?? "-"}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#64748b",
                            fontFamily: "monospace",
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {app.student_email ?? "-"}
                        </Typography>
                        {app.student_college && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                            {app.student_college}
                          </Typography>
                        )}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1, flexWrap: "wrap" }}>
                          <FormControl size="small" sx={{ minWidth: 110 }}>
                            <Select
                              value={app.status}
                              onChange={(e) =>
                                handleStatusChange(app.id, e.target.value)
                              }
                              disabled={updating}
                              sx={{
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                height: 28,
                                backgroundColor: statusStyle.bg,
                                color: statusStyle.color,
                                borderRadius: 1.5,
                                "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
                              }}
                            >
                              {STATUS_OPTIONS.map((o) => (
                                <MenuItem key={o.value} value={o.value}>
                                  {o.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(app.applied_at)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                    <TableCell padding="checkbox" sx={{ borderColor: "divider" }}>
                      <Checkbox
                        checked={selectedIds.size === applications.length && applications.length > 0}
                        indeterminate={
                          selectedIds.size > 0 && selectedIds.size < applications.length
                        }
                        onChange={toggleSelectAll}
                        sx={{ color: "#64748b", "&.Mui-checked": { color: "#6366f1" } }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#0f172a", borderColor: "divider" }}>
                      Applicant
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#0f172a", borderColor: "divider" }}>
                      Email
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#0f172a", borderColor: "divider" }}>
                      College
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#0f172a", borderColor: "divider" }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#0f172a", borderColor: "divider" }}>
                      Applied At
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applications.map((app) => {
                    const statusStyle = STATUS_COLORS[app.status] ?? STATUS_COLORS.applied;
                    return (
                      <TableRow
                        key={app.id}
                        hover
                        sx={{
                          "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.02)" },
                          borderColor: "divider",
                        }}
                      >
                        <TableCell padding="checkbox" sx={{ borderColor: "divider" }}>
                          <Checkbox
                            checked={selectedIds.has(app.id)}
                            onChange={() => toggleSelect(app.id)}
                            sx={{ color: "#64748b", "&.Mui-checked": { color: "#6366f1" } }}
                          />
                        </TableCell>
                        <TableCell sx={{ borderColor: "divider" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                backgroundColor: "rgba(99, 102, 241, 0.15)",
                                color: "#6366f1",
                              }}
                            >
                              {getInitials(app.student_name ?? "")}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {app.student_name ?? "-"}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ borderColor: "divider" }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#64748b",
                              fontFamily: "monospace",
                              fontSize: "0.8rem",
                            }}
                          >
                            {app.student_email ?? "-"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ borderColor: "divider" }}>
                          <Typography variant="body2" color="text.secondary">
                            {app.student_college ?? "-"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ borderColor: "divider" }}>
                          <FormControl size="small" sx={{ minWidth: 130 }}>
                            <Select
                              value={app.status}
                              onChange={(e) =>
                                handleStatusChange(app.id, e.target.value)
                              }
                              disabled={updating}
                              sx={{
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                height: 32,
                                backgroundColor: statusStyle.bg,
                                color: statusStyle.color,
                                borderRadius: 1.5,
                                "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: statusStyle.color,
                                },
                              }}
                            >
                              {STATUS_OPTIONS.map((o) => (
                                <MenuItem key={o.value} value={o.value}>
                                  {o.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell sx={{ borderColor: "divider" }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                            {formatDate(app.applied_at)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </MainLayout>
  );
}
