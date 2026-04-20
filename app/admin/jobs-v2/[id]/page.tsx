"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Typography,
  Paper,
  Button,
  Avatar,
  Chip,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { adminJobsV2Service } from "@/lib/services/admin/admin-jobs-v2.service";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { formatJobPassoutYear, jobsV2Service } from "@/lib/services/jobs-v2.service";
import { config } from "@/lib/config";
import {
  getAdminJobsV2ListBackHref,
  getAdminJobsV2ListQuerySuffix,
} from "@/lib/utils/jobs-v2-navigation";
import {
  isExternalJsonFeedJob,
  isLikelyExternalJsonSyntheticId,
} from "@/lib/jobs/external-json-jobs-store";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { MapPin, Briefcase, Tag, Calendar, Clock, ExternalLink, Users, FileText, Heart, GraduationCap } from "lucide-react";
const JOB_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  active: { bg: "rgba(34, 197, 94, 0.12)", color: "#16a34a" },
  inactive: { bg: "rgba(99, 102, 241, 0.12)", color: "#6366f1" },
  closed: { bg: "rgba(100, 116, 139, 0.12)", color: "#64748b" },
  completed: { bg: "rgba(34, 197, 94, 0.08)", color: "#15803d" },
  on_hold: { bg: "rgba(245, 158, 11, 0.12)", color: "#d97706" },
};

const formatDate = (d?: string) => {
  if (!d) return "—";
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

const SectionCard = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: 2.5,
      border: "1px solid",
      borderColor: "rgba(0,0,0,0.06)",
      backgroundColor: "#fff",
      mb: 2,
      overflow: "hidden",
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: "rgba(99, 102, 241, 0.25)",
        boxShadow: "0 8px 24px rgba(99, 102, 241, 0.06)",
      },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5, pb: 1.5, borderBottom: "1px solid", borderColor: "rgba(0,0,0,0.04)" }}>
      {icon && (
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            backgroundColor: "rgba(99, 102, 241, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon={icon} size={20} style={{ color: "#6366f1" }} />
        </Box>
      )}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
        {title}
      </Typography>
    </Box>
    {children}
  </Paper>
);

const InfoPill = ({
  icon,
  label,
  value,
  multiline = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  /** Full-width row with wrapped text (e.g. long addresses). */
  multiline?: boolean;
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-start",
      gap: 1.25,
      px: 2,
      py: 1.5,
      borderRadius: 2,
      backgroundColor: "#fff",
      border: "1px solid",
      borderColor: multiline ? "rgba(99, 102, 241, 0.18)" : "rgba(0,0,0,0.06)",
      flex: multiline ? "1 1 100%" : "1 1 160px",
      minWidth: multiline ? "100%" : 0,
      maxWidth: multiline ? "100%" : undefined,
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: "rgba(99, 102, 241, 0.2)",
        backgroundColor: "rgba(99, 102, 241, 0.02)",
      },
    }}
  >
    <Box sx={{ color: "#6366f1", flexShrink: 0, mt: 0.25 }}>{icon}</Box>
    <Box sx={{ minWidth: 0, flex: multiline ? 1 : undefined }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: "block",
          lineHeight: 1.3,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          fontSize: "0.7rem",
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          color: "#0f172a",
          mt: 0.25,
          ...(multiline
            ? {
                whiteSpace: "normal",
                wordBreak: "break-word",
                overflowWrap: "anywhere",
                lineHeight: 1.55,
              }
            : {
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }),
        }}
      >
        {value}
      </Typography>
    </Box>
  </Box>
);

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const jobId = Number(params?.id);
  const [job, setJob] = useState<JobV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [updating, setUpdating] = useState(false);

  const adminJobsListBackHref = useMemo(
    () => getAdminJobsV2ListBackHref(searchParams),
    [searchParams]
  );
  const listQuerySuffix = useMemo(
    () => getAdminJobsV2ListQuerySuffix(searchParams),
    [searchParams]
  );

  const JOB_STATUS_OPTIONS = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "closed", label: "Closed" },
    { value: "completed", label: "Completed" },
    { value: "on_hold", label: "On Hold" },
  ] as const;

  const loadJob = useCallback(async () => {
    if (!jobId || isNaN(jobId)) return;
    try {
      setLoading(true);
      if (isLikelyExternalJsonSyntheticId(jobId)) {
        const data = await jobsV2Service.getJobById(jobId);
        setJob(data);
        if (!data) {
          showToast("This feed listing could not be loaded.", "error");
        }
      } else {
        const data = await adminJobsV2Service.getJob(jobId, config.clientId);
        setJob(data);
      }
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to load job", "error");
      router.push(adminJobsListBackHref);
    } finally {
      setLoading(false);
    }
  }, [jobId, showToast, router, adminJobsListBackHref]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const handleDelete = async () => {
    if (!job || isExternalJsonFeedJob(job)) return;
    try {
      await adminJobsV2Service.deleteJob(job.id, config.clientId);
      showToast("Job deleted successfully", "success");
      setDeleteConfirm(false);
      router.push(adminJobsListBackHref);
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to delete", "error");
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!job || isExternalJsonFeedJob(job)) return;
    try {
      setUpdating(true);
      await adminJobsV2Service.updateJob(job.id, { status: status as JobV2["status"] }, config.clientId);
      showToast("Status updated", "success");
      loadJob();
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to update status", "error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <Skeleton variant="rounded" width={120} height={36} sx={{ borderRadius: 2 }} />
            <Skeleton variant="text" width={24} height={24} />
            <Skeleton variant="rounded" width={180} height={24} sx={{ borderRadius: 1 }} />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Skeleton variant="rounded" width="100%" height={220} sx={{ borderRadius: 2.5 }} />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              <Skeleton variant="rounded" width="100%" height={180} sx={{ borderRadius: 2.5 }} />
              <Skeleton variant="rounded" width="100%" height={180} sx={{ borderRadius: 2.5 }} />
            </Box>
          </Box>
        </Box>
      </MainLayout>
    );
  }

  if (!job) {
    return (
      <MainLayout>
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
          <Button
            component={Link}
            href={adminJobsListBackHref}
            startIcon={<IconWrapper icon="mdi:arrow-left" size={18} />}
            sx={{ mb: 2, textTransform: "none", color: "#64748b" }}
          >
            Jobs
          </Button>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Job not found
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            This job may have been removed, or the feed data is not available.
          </Typography>
          <Button component={Link} variant="contained" href={adminJobsListBackHref} sx={{ textTransform: "none" }}>
            Back to job list
          </Button>
        </Box>
      </MainLayout>
    );
  }

  const isFeedListing = isExternalJsonFeedJob(job);
  const importAsPlatformHref = (() => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("seedId", String(job.id));
    return `/admin/jobs-v2/new?${p.toString()}`;
  })();

  const skills = [...(job.mandatory_skills ?? []), ...(job.key_skills ?? [])].filter(Boolean);
  const courses = job.courses ?? [];
  const collegeMappings = job.college_mappings ?? [];
  const passoutYearDisplay = formatJobPassoutYear(job.applicable_passout_year);

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
        {/* Breadcrumb */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3, flexWrap: "wrap" }}>
          <Button
            component={Link}
            href={adminJobsListBackHref}
            startIcon={<IconWrapper icon="mdi:arrow-left" size={18} />}
            sx={{
              textTransform: "none",
              color: "#64748b",
              fontWeight: 500,
              fontSize: "0.875rem",
              "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.06)", color: "#6366f1" },
            }}
          >
            Jobs
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>/</Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: "#0f172a",
              flex: 1,
              minWidth: 0,
              lineHeight: 1.35,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {job.job_title}
          </Typography>
        </Box>

        {isFeedListing && (
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            This is a student feed listing (not stored as a platform job). Import it as a platform job to
            edit status, track applications, or delete it from the server.
          </Alert>
        )}

        {/* Hero header */}
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "flex-start" },
            gap: { xs: 2, md: 3 },
            p: { xs: 2.5, md: 3.5 },
            mb: 3,
            borderRadius: 2.5,
            border: "1px solid",
            borderColor: "rgba(0,0,0,0.06)",
            background: "linear-gradient(160deg, #fafbff 0%, #f1f5f9 50%, #e8eef6 100%)",
            overflow: "hidden",
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "stretch", sm: "flex-start" }, gap: 2, flexWrap: "wrap" }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flex: 1, minWidth: 0 }}>
                <Avatar
                  src={job.company_logo}
                  alt={job.company_name}
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    backgroundColor: "#6366f1",
                    border: "3px solid #fff",
                    boxShadow: "0 4px 14px rgba(99, 102, 241, 0.25)",
                    fontSize: "1.4rem",
                    flexShrink: 0,
                  }}
                >
                  {job.company_name?.[0]?.toUpperCase() || "C"}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: "#0f172a", lineHeight: 1.3, letterSpacing: "-0.02em" }}>
                    {job.job_title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, fontSize: "1rem" }}>
                    {job.company_name}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1.5, alignItems: "center" }}>
                    <Chip
                      label={job.job_type ?? "Job"}
                      size="small"
                      sx={{ backgroundColor: "rgba(99, 102, 241, 0.12)", color: "#6366f1", fontWeight: 600, height: 26 }}
                    />
                    <Chip
                      label={job.is_published ? "Published" : "Draft"}
                      size="small"
                      sx={{
                        backgroundColor: job.is_published ? "rgba(34,197,94,0.12)" : "rgba(100,116,139,0.12)",
                        color: job.is_published ? "#16a34a" : "#64748b",
                        fontWeight: 600,
                        height: 26,
                      }}
                    />
                    {job.employment_type && (
                      <Chip
                        label={job.employment_type}
                        size="small"
                        sx={{
                          backgroundColor: "rgba(255,255,255,0.9)",
                          color: "#6366f1",
                          border: "1px solid rgba(99, 102, 241, 0.3)",
                          fontWeight: 500,
                          height: 26,
                        }}
                        variant="outlined"
                      />
                    )}
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <InputLabel sx={{ fontWeight: 600 }}>Job Status</InputLabel>
                      <Select
                        value={job.status ?? "active"}
                        label="Job Status"
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={updating || isFeedListing}
                        sx={{
                          fontWeight: 600,
                          height: 36,
                          borderRadius: 2,
                          minWidth: 140,
                          backgroundColor: (JOB_STATUS_STYLES[job.status ?? "active"] ?? JOB_STATUS_STYLES.active).bg,
                          color: (JOB_STATUS_STYLES[job.status ?? "active"] ?? JOB_STATUS_STYLES.active).color,
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(99, 102, 241, 0.3)",
                            borderWidth: 1.5,
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#6366f1" },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#6366f1",
                            borderWidth: 2,
                          },
                        }}
                      >
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
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", width: { xs: "100%", sm: "auto" } }}>
                {job.jd_file_url && (
                  <Button
                    component="a"
                    href={job.jd_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    startIcon={<FileText size={18} />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderColor: "rgba(99, 102, 241, 0.5)",
                      color: "#6366f1",
                      borderRadius: 2,
                      "&:hover": { borderColor: "#6366f1", backgroundColor: "rgba(99, 102, 241, 0.06)" },
                    }}
                  >
                    View JD
                  </Button>
                )}
                {!isFeedListing && (
                  <Button
                    component={Link}
                    href={`/admin/jobs-v2/${job.id}/applications${listQuerySuffix}`}
                    variant="contained"
                    startIcon={<Users size={18} />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      backgroundColor: "#6366f1",
                      px: 2.5,
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(99, 102, 241, 0.35)",
                      "&:hover": { backgroundColor: "#4f46e5", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)" },
                    }}
                  >
                    Applications
                  </Button>
                )}
                {isFeedListing ? (
                  <Button
                    component={Link}
                    href={importAsPlatformHref}
                    variant="contained"
                    startIcon={<IconWrapper icon="mdi:database-import" size={18} />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      backgroundColor: "#6366f1",
                      px: 2.5,
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(99, 102, 241, 0.35)",
                      "&:hover": { backgroundColor: "#4f46e5", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)" },
                    }}
                  >
                    Import as platform job
                  </Button>
                ) : (
                  <Button
                    component={Link}
                    href={`/admin/jobs-v2/${job.id}/edit${listQuerySuffix}`}
                    variant="outlined"
                    startIcon={<IconWrapper icon="mdi:pencil" size={18} />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderColor: "rgba(99, 102, 241, 0.5)",
                      color: "#6366f1",
                      borderRadius: 2,
                      "&:hover": { borderColor: "#6366f1", backgroundColor: "rgba(99, 102, 241, 0.06)" },
                    }}
                  >
                    Edit
                  </Button>
                )}
                {!isFeedListing && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setDeleteConfirm(true)}
                    startIcon={<IconWrapper icon="mdi:delete-outline" size={18} />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                      "&:hover": { backgroundColor: "rgba(220, 38, 38, 0.04)" },
                    }}
                  >
                    Delete
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Quick info: location on its own full-width row so long addresses are readable */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 3 }}>
          {job.location && (
            <InfoPill
              multiline
              icon={<MapPin size={18} />}
              label="Location"
              value={job.location}
            />
          )}
          {job.years_of_experience && (
            <InfoPill icon={<Briefcase size={18} />} label="Experience" value={job.years_of_experience} />
          )}
          {job.salary && (
            <InfoPill icon={<Tag size={18} />} label="Salary" value={job.salary} />
          )}
          {passoutYearDisplay && (
            <InfoPill icon={<GraduationCap size={18} />} label="Passout year" value={passoutYearDisplay} />
          )}
          {job.number_of_openings != null && (
            <InfoPill icon={<Users size={18} />} label="Openings" value={String(job.number_of_openings)} />
          )}
          <InfoPill
            icon={<Heart size={18} style={{ color: "#6366f1" }} />}
            label="Favourites"
            value={String(job.favorites_count ?? 0)}
          />
          <InfoPill icon={<Calendar size={18} />} label="Created" value={formatDate(job.created_at)} />
          {job.application_deadline && (
            <InfoPill icon={<Clock size={18} />} label="Closing Date" value={formatDate(job.application_deadline)} />
          )}
        </Box>

        {/* Content */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.2fr 1fr" }, gap: 3, alignItems: "start" }}>
          <Box>
            {job.job_description && (
              <SectionCard title="Job Description" icon="mdi:text-box-outline">
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8, color: "#475569", fontSize: "0.9375rem" }}>
                  {job.job_description}
                </Typography>
              </SectionCard>
            )}

            {job.role_process && (
              <SectionCard title="Role Process" icon="mdi:format-list-checks">
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8, color: "#475569", fontSize: "0.9375rem" }}>
                  {job.role_process}
                </Typography>
              </SectionCard>
            )}

            {job.company_info && (
              <SectionCard title="About Company" icon="mdi:information-outline">
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8, color: "#475569", fontSize: "0.9375rem" }}>
                  {job.company_info}
                </Typography>
              </SectionCard>
            )}
          </Box>

          <Box>
            {job.jd_file_url && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  mb: 2,
                  borderRadius: 2.5,
                  border: "1px solid",
                  borderColor: "rgba(99, 102, 241, 0.25)",
                  backgroundColor: "rgba(99, 102, 241, 0.04)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "rgba(99, 102, 241, 0.4)",
                    backgroundColor: "rgba(99, 102, 241, 0.06)",
                  },
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", mb: 1 }}>
                  Attached JD
                </Typography>
                <Box
                  component="a"
                  href={job.jd_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    color: "#6366f1",
                    fontWeight: 600,
                    textDecoration: "none",
                    wordBreak: "break-all",
                    fontSize: "0.9375rem",
                    "&:hover": { textDecoration: "underline", color: "#4f46e5" },
                  }}
                >
                  <FileText size={18} />
                  View Job Description (PDF)
                </Box>
              </Paper>
            )}
            {job.apply_link && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  mb: 2,
                  borderRadius: 2.5,
                  border: "1px solid",
                  borderColor: "rgba(99, 102, 241, 0.25)",
                  backgroundColor: "rgba(99, 102, 241, 0.04)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "rgba(99, 102, 241, 0.4)",
                    backgroundColor: "rgba(99, 102, 241, 0.06)",
                  },
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", mb: 1 }}>
                  External Apply
                </Typography>
                <Box
                  component="a"
                  href={job.apply_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    color: "#6366f1",
                    fontWeight: 600,
                    textDecoration: "none",
                    wordBreak: "break-all",
                    fontSize: "0.9375rem",
                    "&:hover": { textDecoration: "underline", color: "#4f46e5" },
                  }}
                >
                  <ExternalLink size={18} />
                  {job.apply_link}
                </Box>
              </Paper>
            )}

            {skills.length > 0 && (
              <SectionCard title="Key Skills" icon="mdi:tag-multiple-outline">
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {skills.map((s, i) => (
                    <Chip
                      key={i}
                      label={s}
                      size="small"
                      sx={{
                        borderColor: "rgba(99, 102, 241, 0.4)",
                        color: "#6366f1",
                        fontWeight: 500,
                        backgroundColor: "rgba(99, 102, 241, 0.06)",
                        "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.1)" },
                      }}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </SectionCard>
            )}

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              {job.industry_type && (
                <SectionCard title="Industry" icon="mdi:factory">
                  <Typography variant="body2" sx={{ color: "#475569", fontWeight: 500 }}>{job.industry_type}</Typography>
                </SectionCard>
              )}
              {job.department && (
                <SectionCard title="Department" icon="mdi:domain">
                  <Typography variant="body2" sx={{ color: "#475569", fontWeight: 500 }}>{job.department}</Typography>
                </SectionCard>
              )}
              {job.education && (
                <SectionCard title="Education" icon="mdi:school-outline">
                  <Typography variant="body2" sx={{ color: "#475569", fontWeight: 500 }}>{job.education}</Typography>
                </SectionCard>
              )}
              {passoutYearDisplay && (
                <SectionCard title="Applicable passout year" icon="mdi:calendar-outline">
                  <Typography variant="body2" sx={{ color: "#475569", fontWeight: 500 }}>{passoutYearDisplay}</Typography>
                </SectionCard>
              )}
              {job.role_category && (
                <SectionCard title="Role Category" icon="mdi:briefcase-outline">
                  <Typography variant="body2" sx={{ color: "#475569", fontWeight: 500 }}>{job.role_category}</Typography>
                </SectionCard>
              )}
            </Box>

            {(job.ug_requirements || job.pg_requirements) && (
              <SectionCard title="Requirements" icon="mdi:certificate-outline">
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {job.ug_requirements && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>UG</Typography>
                      <Typography variant="body2" sx={{ color: "#475569", display: "block", mt: 0.25 }}>{job.ug_requirements}</Typography>
                    </Box>
                  )}
                  {job.pg_requirements && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>PG</Typography>
                      <Typography variant="body2" sx={{ color: "#475569", display: "block", mt: 0.25 }}>{job.pg_requirements}</Typography>
                    </Box>
                  )}
                </Box>
              </SectionCard>
            )}

            {courses.length > 0 && (
              <SectionCard title="Mapped Courses" icon="mdi:book-open-page-variant-outline">
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {courses.map((c) => (
                    <Chip
                      key={c.id}
                      label={c.title}
                      size="small"
                      sx={{ backgroundColor: "rgba(99, 102, 241, 0.1)", color: "#6366f1", fontWeight: 500 }}
                    />
                  ))}
                </Box>
              </SectionCard>
            )}

            {collegeMappings.length > 0 && (
              <SectionCard title="Targeted Colleges" icon="mdi:domain">
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {collegeMappings.map((m, i) => (
                    <Chip key={i} label={m.college_name} size="small" variant="outlined" sx={{ borderColor: "rgba(0,0,0,0.12)" }} />
                  ))}
                </Box>
              </SectionCard>
            )}
          </Box>
        </Box>
      </Box>

      <ConfirmDialog
        open={deleteConfirm}
        title="Delete Job"
        message={`Are you sure you want to delete "${job.job_title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(false)}
      />
    </MainLayout>
  );
}
