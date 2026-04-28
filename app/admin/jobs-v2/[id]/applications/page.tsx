"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import NextLink from "next/link";
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
  TextField,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { adminJobsV2Service } from "@/lib/services/admin/admin-jobs-v2.service";
import type { JobApplicationV2, JobV2 } from "@/lib/services/jobs-v2.service";
import { config } from "@/lib/config";
import { ApplicationsIllustration } from "@/components/jobs-v2/illustrations";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ResumeUrlPreviewModal } from "@/components/admin/ResumeUrlPreviewModal";
import { FileDown, Users, FileText, Search, X, ChevronDown, ChevronUp, ExternalLink, Calendar, Save, CheckSquare } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "applying", label: "Applying" },
  { value: "applied", label: "Applied" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview_stage", label: "Interview Stage" },
  { value: "rejected", label: "Rejected" },
  { value: "selected", label: "Selected" },
] as const;

const INTERNAL_SHORTLISTING_OPTIONS = [
  { value: "", label: "—" },
  { value: "ops shortlisted", label: "Ops Shortlisted" },
  { value: "ops not shortlisted", label: "Ops Not Shortlisted" },
] as const;

const SHORTLISTED_BY_HR_OPTIONS = [
  { value: "", label: "—" },
  { value: "hr selected", label: "HR Selected" },
  { value: "hr rejected", label: "HR Rejected" },
  { value: "in process", label: "In Process" },
] as const;

const ROUND_1_OPTIONS = [
  { value: "", label: "—" },
  { value: "resume shortlisted", label: "Resume Shortlisted" },
  { value: "test select", label: "Test Select" },
  { value: "technical interview reject", label: "Technical Interview Reject" },
  { value: "test reject", label: "Test Reject" },
  { value: "resume not shortlisted", label: "Resume Not Shortlisted" },
  { value: "technical interview select", label: "Technical Interview Select" },
  { value: "candidate no show", label: "Candidate No Show" },
  { value: "screening round reject", label: "Screening Round Reject" },
  { value: "screening round select", label: "Screening Round Select" },
  { value: "gd round select", label: "GD Round Select" },
  { value: "gd round reject", label: "GD Round Reject" },
] as const;

const ROUND_2_3_4_OPTIONS = [
  { value: "", label: "—" },
  { value: "resume shortlisted", label: "Resume Shortlisted" },
  { value: "test select", label: "Test Select" },
  { value: "technical interview reject", label: "Technical Interview Reject" },
  { value: "test reject", label: "Test Reject" },
  { value: "resume not shortlisted", label: "Resume Not Shortlisted" },
  { value: "technical interview select", label: "Technical Interview Select" },
  { value: "candidate no show", label: "Candidate No Show" },
  { value: "screen reject", label: "Screen Reject" },
  { value: "hr interview select", label: "HR Interview Select" },
  { value: "hr interview reject", label: "HR Interview Reject" },
  { value: "manager round select", label: "Manager Round Select" },
  { value: "manager round reject", label: "Manager Round Reject" },
  { value: "offer accepted", label: "Offer Accepted" },
  { value: "offer rejected", label: "Offer Rejected" },
] as const;

const OFFERED_OPTIONS = [
  { value: "", label: "—" },
  { value: "offer accepted", label: "Offer Accepted" },
  { value: "offer rejected", label: "Offer Rejected" },
] as const;

type PipelineField =
  | "drive"
  | "internal_shortlisting"
  | "shortlisted_by_hr"
  | "round_1"
  | "round_2"
  | "round_3"
  | "round_4"
  | "offered";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  applying: { bg: "color-mix(in srgb, var(--accent-indigo) 16%, transparent)", color: "var(--accent-indigo)" },
  applied: { bg: "color-mix(in srgb, var(--accent-indigo) 16%, transparent)", color: "var(--accent-indigo)" },
  shortlisted: { bg: "color-mix(in srgb, var(--success-500) 16%, transparent)", color: "var(--success-500)" },
  interview_stage: { bg: "color-mix(in srgb, var(--warning-500) 16%, transparent)", color: "var(--warning-500)" },
  rejected: { bg: "color-mix(in srgb, var(--error-500) 16%, transparent)", color: "var(--error-500)" },
  selected: { bg: "color-mix(in srgb, var(--success-500) 25%, transparent)", color: "var(--success-500)" },
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "0.7rem" }}>{label}</Typography>
      <Typography variant="body2" sx={{ display: "block", fontWeight: 500, mt: 0.25, color: "var(--font-primary)" }}>{value !== undefined && value !== null && value !== "" ? String(value) : "—"}</Typography>
    </Box>
  );
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
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [resumePreviewUrl, setResumePreviewUrl] = useState<string | null>(null);
  const [detailApp, setDetailApp] = useState<JobApplicationV2 | null>(null);
  const [sortBy, setSortBy] = useState<"applied_at" | "name" | "status">("applied_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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
      const data = await adminJobsV2Service.getJobApplications(jobId, config.clientId, {
        status: statusFilter || undefined,
      });
      setApplications(data.results ?? []);
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to load applications", "error");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [jobId, statusFilter, showToast]);

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
          { status: status as "applying" | "applied" | "shortlisted" | "interview_stage" | "rejected" | "selected" },
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

  const handleSaveDetailModal = useCallback(
    async (app: JobApplicationV2) => {
      try {
        setUpdating(true);
        const payload = {
          status: app.status,
          drive: app.drive ?? "",
          internal_shortlisting: app.internal_shortlisting ?? "",
          reason_not_shortlisted: app.reason_not_shortlisted?.trim() || undefined,
          shortlisted_by_hr: app.shortlisted_by_hr ?? "",
          round_1: app.round_1 ?? "",
          round_2: app.round_2 ?? "",
          round_3: app.round_3 ?? "",
          round_4: app.round_4 ?? "",
          offered: app.offered ?? "",
        };
        await adminJobsV2Service.updateApplicationStatus(app.id, payload, config.clientId);
        showToast("Changes saved successfully", "success");
        loadApplications();
        setDetailApp(null);
      } catch (err) {
        showToast((err as Error)?.message ?? "Failed to save", "error");
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
          bulkStatus as "applying" | "applied" | "shortlisted" | "interview_stage" | "rejected" | "selected",
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
    const list = filteredAndSortedApplications;
    const allSelected = list.length > 0 && list.every((a) => selectedIds.has(a.id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(list.map((a) => a.id)));
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

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUS_OPTIONS.forEach((o) => { counts[o.value] = 0; });
    applications.forEach((a) => { counts[a.status] = (counts[a.status] ?? 0) + 1; });
    return counts;
  }, [applications]);

  const filteredAndSortedApplications = useMemo(() => {
    let list = applications;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          (a.student_name ?? "").toLowerCase().includes(q) ||
          (a.student_email ?? "").toLowerCase().includes(q) ||
          (a.student_college ?? "").toLowerCase().includes(q) ||
          (a.student_phone ?? "").includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "applied_at") {
        const da = new Date(a.applied_at).getTime();
        const db = new Date(b.applied_at).getTime();
        cmp = da - db;
      } else if (sortBy === "name") {
        cmp = (a.student_name ?? "").localeCompare(b.student_name ?? "");
      } else if (sortBy === "status") {
        cmp = (a.status ?? "").localeCompare(b.status ?? "");
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return list;
  }, [applications, searchQuery, sortBy, sortOrder]);

  const toggleSort = (field: "applied_at" | "name" | "status") => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder(field === "applied_at" ? "desc" : "asc");
    }
  };

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, flexWrap: "wrap" }}>
          <Button
            component={NextLink}
            href="/admin/jobs-v2"
            startIcon={<IconWrapper icon="mdi:arrow-left" size={18} />}
            sx={{
              textTransform: "none",
              color: "text.secondary",
              fontWeight: 500,
              "&:hover": { backgroundColor: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)", color: "var(--accent-indigo)" },
            }}
          >
            Back to Jobs
          </Button>
          <Typography variant="body2" color="text.secondary">/</Typography>
          <Button
            component={NextLink}
            href={`/admin/jobs-v2/${jobId}`}
            sx={{
              textTransform: "none",
              color: "text.secondary",
              fontWeight: 500,
              "&:hover": { backgroundColor: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)", color: "var(--accent-indigo)" },
            }}
          >
            {jobTitle}
          </Button>
          <Typography variant="body2" color="text.secondary">/</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>Applications</Typography>
        </Box>

        {/* Job header: title, company, location type, openings, salary | status, created on, view JD */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            mb: 3,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            backgroundColor: "var(--card-bg)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "stretch", md: "flex-start" },
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "var(--font-primary)", mb: 0.5 }}>
                {jobTitle}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                {companyName}
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
                {job?.employment_type && (
                  <Chip size="small" label={job.employment_type} sx={{ fontWeight: 500 }} />
                )}
                {job?.location && (
                  <Chip size="small" variant="outlined" label={job.location} sx={{ fontWeight: 500 }} />
                )}
                {job?.number_of_openings != null && (
                  <Chip size="small" variant="outlined" label={`${job.number_of_openings} opening${job.number_of_openings !== 1 ? "s" : ""}`} sx={{ fontWeight: 500 }} />
                )}
                {job?.salary && (
                  <Chip size="small" variant="outlined" label={job.salary} sx={{ fontWeight: 500 }} />
                )}
              </Box>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: { xs: "flex-start", md: "flex-end" }, gap: 1 }}>
              {job?.status && (
                <Chip
                  size="small"
                  label={job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  sx={{
                    fontWeight: 600,
                    backgroundColor: job.status === "active" ? "color-mix(in srgb, var(--success-500) 16%, transparent)" : "color-mix(in srgb, var(--font-tertiary) 25%, transparent)",
                    color: job.status === "active" ? "var(--success-500)" : "var(--font-secondary)",
                  }}
                />
              )}
              {job?.created_at && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Calendar size={14} color="var(--font-secondary)" />
                  <Typography variant="caption" color="text.secondary">
                    Created {formatDate(job.created_at)}
                  </Typography>
                </Box>
              )}
              {job?.jd_file_url && (
                <Button
                  component="a"
                  href={job.jd_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  startIcon={<ExternalLink size={14} />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    color: "var(--accent-indigo)",
                    "&:hover": { backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)" },
                  }}
                >
                  View JD
                </Button>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Applicants section: filters + grid */}
        <Box
          sx={{
            mb: 2,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1.5,
            p: 2,
            borderRadius: 2,
            backgroundColor: "var(--surface)",
            border: "1px solid",
            borderColor: "color-mix(in srgb, var(--accent-indigo) 16%, transparent)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 2,
              py: 1,
              borderRadius: 2,
              background: "linear-gradient(135deg, color-mix(in srgb, var(--accent-indigo) 16%, transparent) 0%, color-mix(in srgb, var(--accent-indigo) 8%, transparent) 100%)",
              border: "1px solid",
              borderColor: "color-mix(in srgb, var(--accent-indigo) 30%, var(--border-default))",
            }}
          >
            <Users size={20} style={{ color: "var(--accent-indigo)" }} />
            <Typography variant="body1" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
              {loading ? "—" : `${applications.length} applicant${applications.length !== 1 ? "s" : ""}`}
            </Typography>
          </Box>
          {STATUS_OPTIONS.map((o) => {
            const count = statusCounts[o.value] ?? 0;
            const style = STATUS_COLORS[o.value];
            const isActive = statusFilter === o.value;
            return (
              <Button
                key={o.value}
                size="small"
                onClick={() => setStatusFilter(isActive ? "" : o.value)}
                sx={{
                  textTransform: "none",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 1.5,
                  backgroundColor: isActive ? (style?.bg ?? "var(--surface)") : "var(--font-light)",
                  border: "1px solid",
                  borderColor: isActive ? (style?.color ?? "var(--accent-indigo)") : "divider",
                  color: isActive ? (style?.color ?? "var(--accent-indigo)") : "text.secondary",
                  "&:hover": {
                    backgroundColor: style?.bg ?? "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                    borderColor: style?.color ?? "var(--accent-indigo)",
                    color: style?.color ?? "var(--accent-indigo)",
                  },
                }}
              >
                {o.label}: {count}
              </Button>
            );
          })}
          <TextField
            size="small"
            placeholder="Search by name, email, college, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="var(--font-tertiary)" />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery("")} sx={{ p: 0.5 }}>
                    <X size={16} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              width: { xs: "100%", sm: 260 },
              "& .MuiOutlinedInput-root": { backgroundColor: "var(--card-bg)", borderRadius: 1.5, fontSize: "0.875rem" },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ backgroundColor: "var(--card-bg)", borderRadius: 1.5 }}
            >
              <MenuItem value="">All</MenuItem>
              {STATUS_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            onClick={handleExportCsv}
            disabled={exporting}
            startIcon={<FileDown size={16} />}
            sx={{ textTransform: "none", fontWeight: 600, borderColor: "color-mix(in srgb, var(--accent-indigo) 55%, transparent)", color: "var(--accent-indigo)", "&:hover": { borderColor: "var(--accent-indigo)", backgroundColor: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)" } }}
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
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
              border: "2px solid",
              borderColor: "color-mix(in srgb, var(--accent-indigo) 45%, transparent)",
              background: "linear-gradient(135deg, color-mix(in srgb, var(--accent-indigo) 8%, transparent) 0%, color-mix(in srgb, var(--accent-indigo) 4%, transparent) 100%)",
              borderRadius: 2,
              boxShadow: "0 2px 8px color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  backgroundColor: "color-mix(in srgb, var(--accent-indigo) 16%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckSquare size={20} style={{ color: "var(--accent-indigo)" }} />
              </Box>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
                  {selectedIds.size} application{selectedIds.size !== 1 ? "s" : ""} selected
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Update status for all selected applicants
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => { setSelectedIds(new Set()); setBulkStatus(""); }}
                startIcon={<X size={16} />}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  color: "text.secondary",
                  ml: 1,
                  "&:hover": { backgroundColor: "color-mix(in srgb, var(--font-primary) 6%, transparent)", color: "text.primary" },
                }}
              >
                Clear
              </Button>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", width: { xs: "100%", sm: "auto" } }}>
              <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 }, flex: { xs: 1, sm: "none" } }}>
                <InputLabel>New Status</InputLabel>
                <Select
                  value={bulkStatus}
                  label="New Status"
                  onChange={(e) => setBulkStatus(e.target.value)}
                  sx={{
                    backgroundColor: "var(--card-bg)",
                    borderRadius: 2,
                    fontWeight: 600,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "color-mix(in srgb, var(--accent-indigo) 45%, transparent)" },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--accent-indigo)" },
                  }}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: (STATUS_COLORS[o.value] ?? STATUS_COLORS.applied).color,
                          }}
                        />
                        {o.label}
                      </Box>
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
                  backgroundColor: "var(--accent-indigo)",
                  px: 3,
                  py: 1.25,
                  borderRadius: 2,
                  boxShadow: "0 2px 8px color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
                  "&:hover": { backgroundColor: "var(--accent-indigo-dark)", boxShadow: "0 4px 12px color-mix(in srgb, var(--accent-indigo) 45%, transparent)" },
                  "&:disabled": { backgroundColor: "color-mix(in srgb, var(--accent-indigo) 55%, transparent)" },
                }}
              >
                {updating ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={16} sx={{ color: "var(--font-light)" }} />
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
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
            backgroundColor: "var(--card-bg)",
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
                backgroundColor: "var(--surface)",
              }}
            >
              <ApplicationsIllustration width={140} height={110} primaryColor="var(--border-default)" />
              <Typography variant="h6" sx={{ mt: 2, fontWeight: 600, color: "var(--font-primary)" }}>
                No applications yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 320 }}>
                Applications will appear here when students apply for this job
              </Typography>
              <Button
                component={NextLink}
                href="/admin/jobs-v2"
                variant="outlined"
                size="small"
                sx={{ mt: 2, textTransform: "none", borderRadius: 2 }}
              >
                Back to Jobs
              </Button>
            </Box>
          ) : filteredAndSortedApplications.length === 0 ? (
            <Box
              sx={{
                p: 8,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                backgroundColor: "var(--surface)",
              }}
            >
              <Search size={48} color="var(--border-default)" style={{ marginBottom: 8 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
                No applications match your search
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 320 }}>
                Try adjusting your search or filter criteria
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => { setSearchQuery(""); setStatusFilter(""); }}
                sx={{ mt: 2, textTransform: "none", borderRadius: 2 }}
              >
                Clear filters
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
                  checked={
                    filteredAndSortedApplications.length > 0 &&
                    filteredAndSortedApplications.every((a) => selectedIds.has(a.id))
                  }
                  indeterminate={
                    selectedIds.size > 0 &&
                    selectedIds.size < filteredAndSortedApplications.length
                  }
                  onChange={toggleSelectAll}
                  sx={{ color: "var(--font-secondary)", "&.Mui-checked": { color: "var(--accent-indigo)" } }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Select all ({filteredAndSortedApplications.length} shown)
                </Typography>
              </Box>
              {filteredAndSortedApplications.map((app) => {
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
                      backgroundColor: "var(--card-bg)",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <Checkbox
                        checked={selectedIds.has(app.id)}
                        onChange={() => toggleSelect(app.id)}
                        sx={{ color: "var(--font-secondary)", "&.Mui-checked": { color: "var(--accent-indigo)" }, p: 0, mt: 0.5 }}
                      />
                      <Avatar
                        src={app.student_profile_pic_url ?? undefined}
                        sx={{
                          width: 40,
                          height: 40,
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          backgroundColor: "color-mix(in srgb, var(--accent-indigo) 20%, transparent)",
                          color: "var(--accent-indigo)",
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
                            color: "var(--font-secondary)",
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
                        <Box sx={{ display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
                          <Button
                            size="small"
                            onClick={() => setDetailApp(app)}
                            sx={{ textTransform: "none", fontSize: "0.7rem", minWidth: 0, p: 0.5 }}
                          >
                            View
                          </Button>
                          <Button
                            component={NextLink}
                            href={`/admin/profile/${app.student}`}
                            size="small"
                            sx={{ textTransform: "none", fontSize: "0.7rem", minWidth: 0, p: 0.5 }}
                          >
                            Profile
                          </Button>
                          {app.resume_url && (
                            <Button
                              size="small"
                              onClick={() => setResumePreviewUrl(app.resume_url ?? null)}
                              sx={{ textTransform: "none", fontSize: "0.7rem", minWidth: 0, p: 0.5 }}
                            >
                              Resume
                            </Button>
                          )}
                          {app.student_batch && (
                            <Typography variant="caption" color="text.secondary">
                              Batch: {app.student_batch}
                            </Typography>
                          )}
                        </Box>
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
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "var(--background)" }}>
                    <TableCell padding="checkbox" sx={{ borderColor: "divider", fontWeight: 600, color: "var(--font-primary)", minWidth: 48 }} />
                    <TableCell sx={{ fontWeight: 600, color: "var(--font-primary)", borderColor: "divider", minWidth: 48 }}>#</TableCell>
                    <TableCell
                      sx={{ fontWeight: 600, color: "var(--font-primary)", borderColor: "divider", minWidth: 200, cursor: "pointer" }}
                      onClick={() => toggleSort("name")}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        Name {sortBy === "name" && (sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 600, color: "var(--font-primary)", borderColor: "divider", minWidth: 120, cursor: "pointer" }}
                      onClick={() => toggleSort("status")}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        Status {sortBy === "status" && (sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 600, color: "var(--font-primary)", borderColor: "divider", minWidth: 120, cursor: "pointer" }}
                      onClick={() => toggleSort("applied_at")}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        Applied At {sortBy === "applied_at" && (sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "var(--font-primary)", borderColor: "divider", minWidth: 180 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedApplications.map((app, idx) => {
                    const statusStyle = STATUS_COLORS[app.status] ?? STATUS_COLORS.applied;
                    return (
                      <TableRow
                        key={app.id}
                        hover
                        sx={{ "&:hover": { backgroundColor: "color-mix(in srgb, var(--accent-indigo) 4%, transparent)" }, borderColor: "divider" }}
                      >
                        <TableCell padding="checkbox" sx={{ borderColor: "divider" }}>
                          <Checkbox
                            checked={selectedIds.has(app.id)}
                            onChange={() => toggleSelect(app.id)}
                            sx={{ color: "var(--font-secondary)", "&.Mui-checked": { color: "var(--accent-indigo)" } }}
                          />
                        </TableCell>
                        <TableCell sx={{ borderColor: "divider", color: "text.secondary", fontSize: "0.8rem" }}>
                          {idx + 1}
                        </TableCell>
                        <TableCell sx={{ borderColor: "divider" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                              src={app.student_profile_pic_url ?? undefined}
                              sx={{ width: 32, height: 32, fontSize: "0.75rem", fontWeight: 600, backgroundColor: "color-mix(in srgb, var(--accent-indigo) 20%, transparent)", color: "var(--accent-indigo)" }}
                            >
                              {getInitials(app.student_name ?? "")}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                                {app.student_name ?? "-"}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace", fontSize: "0.75rem" }}>
                                {app.student_email ?? "-"}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ borderColor: "divider" }}>
                          <Chip
                            size="small"
                            label={STATUS_OPTIONS.find((o) => o.value === app.status)?.label ?? app.status}
                            sx={{ fontSize: "0.7rem", height: 24, fontWeight: 600, backgroundColor: statusStyle.bg, color: statusStyle.color, border: "none" }}
                          />
                        </TableCell>
                        <TableCell sx={{ borderColor: "divider", fontSize: "0.8rem", color: "text.secondary" }}>
                          {formatDate(app.applied_at)}
                        </TableCell>
                        <TableCell sx={{ borderColor: "divider" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                            <Button size="small" onClick={() => setDetailApp(app)} sx={{ textTransform: "none", fontSize: "0.75rem", minWidth: 0, px: 1, color: "var(--accent-indigo)" }}>
                              View
                            </Button>
                            <Button component={NextLink} href={`/admin/profile/${app.student}`} size="small" sx={{ textTransform: "none", fontSize: "0.75rem", minWidth: 0, px: 1 }}>
                              Profile
                            </Button>
                            {app.resume_url && (
                              <IconButton size="small" onClick={() => setResumePreviewUrl(app.resume_url ?? null)} sx={{ p: 0.5 }}>
                                <FileText size={14} />
                              </IconButton>
                            )}
                          </Box>
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
      <ResumeUrlPreviewModal
        open={!!resumePreviewUrl}
        onClose={() => setResumePreviewUrl(null)}
        resumeUrl={resumePreviewUrl}
        resumeName="Resume"
      />

      <Dialog
        open={!!detailApp}
        onClose={() => setDetailApp(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 25px 50px -12px color-mix(in srgb, var(--font-primary) 30%, transparent)",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2.5,
            background: "linear-gradient(135deg, var(--surface) 0%, var(--surface) 100%)",
            borderBottom: "1px solid",
            borderColor: "color-mix(in srgb, var(--font-primary) 8%, transparent)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              src={detailApp?.student_profile_pic_url ?? undefined}
              sx={{
                width: 52,
                height: 52,
                fontSize: "1.1rem",
                fontWeight: 700,
                backgroundColor: "color-mix(in srgb, var(--accent-indigo) 20%, transparent)",
                color: "var(--accent-indigo)",
                border: "2px solid",
                borderColor: "color-mix(in srgb, var(--accent-indigo) 25%, transparent)",
              }}
            >
              {detailApp ? getInitials(detailApp.student_name ?? "") : ""}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3, color: "var(--font-primary)", letterSpacing: "-0.02em" }}>
                {detailApp?.student_name ?? "-"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: "0.8rem", mt: 0.25 }}>
                {detailApp?.student_email ?? "-"}
              </Typography>
              {detailApp && (
                <Chip
                  size="small"
                  label={STATUS_OPTIONS.find((o) => o.value === detailApp.status)?.label ?? detailApp.status}
                  sx={{
                    mt: 1,
                    height: 24,
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    backgroundColor: (STATUS_COLORS[detailApp.status] ?? {}).bg,
                    color: (STATUS_COLORS[detailApp.status] ?? {}).color,
                    border: "none",
                  }}
                />
              )}
            </Box>
          </Box>
          <IconButton
            onClick={() => setDetailApp(null)}
            size="small"
            sx={{
              "&:hover": { backgroundColor: "color-mix(in srgb, var(--font-primary) 8%, transparent)" },
              color: "var(--font-secondary)",
            }}
          >
            <X size={22} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, backgroundColor: "var(--surface)" }}>
          {detailApp && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <Box sx={{ p: 2.5, display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Button
                  component={NextLink}
                  href={`/admin/profile/${detailApp.student}`}
                  variant="contained"
                  size="small"
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                    backgroundColor: "var(--accent-indigo)",
                    boxShadow: "0 1px 3px color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
                    "&:hover": { backgroundColor: "var(--accent-indigo-dark)", boxShadow: "0 4px 12px color-mix(in srgb, var(--accent-indigo) 40%, transparent)" },
                  }}
                >
                  View Profile
                </Button>
                {detailApp.resume_url && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => { setResumePreviewUrl(detailApp.resume_url ?? null); setDetailApp(null); }}
                    startIcon={<FileText size={16} />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                      borderColor: "color-mix(in srgb, var(--accent-indigo) 55%, transparent)",
                      color: "var(--accent-indigo)",
                      "&:hover": { borderColor: "var(--accent-indigo)", backgroundColor: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)" },
                    }}
                  >
                    View Resume
                  </Button>
                )}
              </Box>

              <Paper elevation={0} sx={{ mx: 2.5, mb: 2, p: 2, borderRadius: 2, backgroundColor: "var(--card-bg)", border: "1px solid", borderColor: "color-mix(in srgb, var(--font-primary) 8%, transparent)" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 700, mb: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}>Application Status</Typography>
                <FormControl size="small" fullWidth sx={{ maxWidth: 220 }}>
                  <Select
                    value={detailApp.status}
                    onChange={(e) => setDetailApp((prev) => (prev ? { ...prev, status: e.target.value as JobApplicationV2["status"] } : null))}
                    disabled={updating}
                    sx={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      backgroundColor: "var(--card-bg)",
                      borderRadius: 2,
                      boxShadow: "0 1px 2px color-mix(in srgb, var(--font-primary) 7%, transparent)",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "color-mix(in srgb, var(--accent-indigo) 35%, transparent)" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--accent-indigo)", borderWidth: 2 },
                    }}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Paper>

              <Paper elevation={0} sx={{ mx: 2.5, mb: 2, p: 2, borderRadius: 2, backgroundColor: "var(--card-bg)", border: "1px solid", borderColor: "color-mix(in srgb, var(--font-primary) 8%, transparent)" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 700, mb: 1.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Candidate Info</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <DetailRow label="Phone" value={detailApp.student_phone} />
                  <DetailRow label="College" value={detailApp.student_college} />
                  <DetailRow label="Degree" value={detailApp.student_degree} />
                  <DetailRow label="Batch / YOP" value={detailApp.student_yop ?? detailApp.student_batch} />
                  <Box sx={{ gridColumn: "1 / -1" }}>
                    <DetailRow label="Location" value={detailApp.student_location} />
                  </Box>
                </Box>
              </Paper>

              {(detailApp.student_skills || detailApp.student_experience) && (
                <Paper elevation={0} sx={{ mx: 2.5, mb: 2, p: 2, borderRadius: 2, backgroundColor: "var(--card-bg)", border: "1px solid", borderColor: "color-mix(in srgb, var(--font-primary) 8%, transparent)" }}>
                  {detailApp.student_skills && (
                    <Box sx={{ mb: detailApp.student_experience ? 1.5 : 0 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 700, mb: 0.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Skills</Typography>
                      <Typography variant="body2" sx={{ fontSize: "0.875rem", color: "var(--font-secondary)", lineHeight: 1.6 }}>{detailApp.student_skills}</Typography>
                    </Box>
                  )}
                  {detailApp.student_experience && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 700, mb: 0.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Experience</Typography>
                      <Typography variant="body2" sx={{ fontSize: "0.875rem", color: "var(--font-secondary)", lineHeight: 1.6 }}>{detailApp.student_experience}</Typography>
                    </Box>
                  )}
                </Paper>
              )}

              <Paper elevation={0} sx={{ mx: 2.5, mb: 2, p: 2, borderRadius: 2, backgroundColor: "var(--card-bg)", border: "1px solid", borderColor: "color-mix(in srgb, var(--accent-indigo) 25%, transparent)" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 700, mb: 1.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--accent-indigo)" }}>Pipeline</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                  <Box sx={{ gridColumn: "1 / -1" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Drive</Typography>
                    <TextField
                      size="small"
                      placeholder="Enter drive name..."
                      value={(detailApp.drive as string) ?? ""}
                      onChange={(e) => setDetailApp((prev) => (prev ? { ...prev, drive: e.target.value } : null))}
                      disabled={updating}
                      fullWidth
                      sx={{ fontSize: "0.8rem", "& .MuiInputBase-input": { fontSize: "0.8rem" }, "& .MuiOutlinedInput-root": { backgroundColor: "var(--card-bg)", height: 36 } }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Internal Shortlisting</Typography>
                    <Select
                      size="small"
                      value={(detailApp.internal_shortlisting as string) ?? ""}
                      onChange={(e) => setDetailApp((prev) => (prev ? { ...prev, internal_shortlisting: e.target.value } : null))}
                      disabled={updating}
                      fullWidth
                      displayEmpty
                      sx={{ fontSize: "0.8rem", height: 36, backgroundColor: "var(--card-bg)" }}
                    >
                      {INTERNAL_SHORTLISTING_OPTIONS.map((o) => (
                        <MenuItem key={o.value || "empty"} value={o.value}>{o.label}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Shortlisted by HR</Typography>
                    <Select
                      size="small"
                      value={(detailApp.shortlisted_by_hr as string) ?? ""}
                      onChange={(e) => setDetailApp((prev) => (prev ? { ...prev, shortlisted_by_hr: e.target.value } : null))}
                      disabled={updating}
                      fullWidth
                      displayEmpty
                      sx={{ fontSize: "0.8rem", height: 36, backgroundColor: "var(--card-bg)" }}
                    >
                      {SHORTLISTED_BY_HR_OPTIONS.map((o) => (
                        <MenuItem key={o.value || "empty"} value={o.value}>{o.label}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Round 1</Typography>
                    <Select
                      size="small"
                      value={(detailApp.round_1 as string) ?? ""}
                      onChange={(e) => setDetailApp((prev) => (prev ? { ...prev, round_1: e.target.value } : null))}
                      disabled={updating}
                      fullWidth
                      displayEmpty
                      sx={{ fontSize: "0.8rem", height: 36, backgroundColor: "var(--card-bg)" }}
                    >
                      {ROUND_1_OPTIONS.map((o) => (
                        <MenuItem key={o.value || "empty"} value={o.value}>{o.label}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Round 2</Typography>
                    <Select
                      size="small"
                      value={(detailApp.round_2 as string) ?? ""}
                      onChange={(e) => setDetailApp((prev) => (prev ? { ...prev, round_2: e.target.value } : null))}
                      disabled={updating}
                      fullWidth
                      displayEmpty
                      sx={{ fontSize: "0.8rem", height: 36, backgroundColor: "var(--card-bg)" }}
                    >
                      {ROUND_2_3_4_OPTIONS.map((o) => (
                        <MenuItem key={o.value || "empty"} value={o.value}>{o.label}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Round 3</Typography>
                    <Select
                      size="small"
                      value={(detailApp.round_3 as string) ?? ""}
                      onChange={(e) => setDetailApp((prev) => (prev ? { ...prev, round_3: e.target.value } : null))}
                      disabled={updating}
                      fullWidth
                      displayEmpty
                      sx={{ fontSize: "0.8rem", height: 36, backgroundColor: "var(--card-bg)" }}
                    >
                      {ROUND_2_3_4_OPTIONS.map((o) => (
                        <MenuItem key={o.value || "empty"} value={o.value}>{o.label}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Round 4</Typography>
                    <Select
                      size="small"
                      value={(detailApp.round_4 as string) ?? ""}
                      onChange={(e) => setDetailApp((prev) => (prev ? { ...prev, round_4: e.target.value } : null))}
                      disabled={updating}
                      fullWidth
                      displayEmpty
                      sx={{ fontSize: "0.8rem", height: 36, backgroundColor: "var(--card-bg)" }}
                    >
                      {ROUND_2_3_4_OPTIONS.map((o) => (
                        <MenuItem key={o.value || "empty"} value={o.value}>{o.label}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Offered</Typography>
                    <Select
                      size="small"
                      value={(detailApp.offered as string) ?? ""}
                      onChange={(e) => setDetailApp((prev) => (prev ? { ...prev, offered: e.target.value } : null))}
                      disabled={updating}
                      fullWidth
                      displayEmpty
                      sx={{ fontSize: "0.8rem", height: 36, backgroundColor: "var(--card-bg)" }}
                    >
                      {OFFERED_OPTIONS.map((o) => (
                        <MenuItem key={o.value || "empty"} value={o.value}>{o.label}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ mx: 2.5, mb: 2, p: 2, borderRadius: 2, backgroundColor: "var(--card-bg)", border: "1px solid", borderColor: "color-mix(in srgb, var(--font-primary) 8%, transparent)" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 700, mb: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}>Reason Not Shortlisted</Typography>
                <TextField
                  size="small"
                  placeholder="Add reason if not shortlisted..."
                  value={detailApp.reason_not_shortlisted ?? ""}
                  onChange={(e) => setDetailApp((prev) => (prev ? { ...prev, reason_not_shortlisted: e.target.value } : null))}
                  disabled={updating}
                  fullWidth
                  multiline
                  rows={2}
                  sx={{ "& .MuiInputBase-input": { fontSize: "0.875rem" }, "& .MuiOutlinedInput-root": { backgroundColor: "var(--card-bg)" } }}
                />
              </Paper>

              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block", mx: 2.5, mb: 1 }}>
                Applied {formatDate(detailApp.applied_at)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1, borderTop: "1px solid", borderColor: "color-mix(in srgb, var(--font-primary) 8%, transparent)", backgroundColor: "var(--card-bg)" }}>
          <Button onClick={() => setDetailApp(null)} sx={{ textTransform: "none", fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => detailApp && handleSaveDetailModal(detailApp)}
            disabled={updating || !detailApp}
            startIcon={<Save size={16} />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "var(--accent-indigo)",
              px: 2.5,
              "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
            }}
          >
            {updating ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}
