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
  active: { bg: "color-mix(in srgb, var(--success-500) 12%, transparent)", color: "var(--success-500)" },
  inactive: { bg: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)", color: "var(--accent-indigo)" },
  closed: { bg: "color-mix(in srgb, var(--font-secondary) 12%, transparent)", color: "var(--font-secondary)" },
  completed: { bg: "color-mix(in srgb, var(--success-500) 8%, transparent)", color: "var(--primary-700)" },
  on_hold: { bg: "color-mix(in srgb, var(--warning-500) 12%, transparent)", color: "var(--warning-500)" },
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
      borderColor: "color-mix(in srgb, var(--font-primary) 6%, transparent)",
      backgroundColor: "var(--card-bg)",
      mb: 2,
      overflow: "hidden",
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: "color-mix(in srgb, var(--accent-indigo) 25%, transparent)",
        boxShadow: "0 8px 24px color-mix(in srgb, var(--accent-indigo) 6%, transparent)",
      },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5, pb: 1.5, borderBottom: "1px solid", borderColor: "color-mix(in srgb, var(--font-primary) 4%, transparent)" }}>
      {icon && (
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            backgroundColor: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon={icon} size={20} style={{ color: "var(--accent-indigo)" }} />
        </Box>
      )}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--font-primary-dark)", letterSpacing: "-0.01em" }}>
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
      backgroundColor: "var(--card-bg)",
      border: "1px solid",
      borderColor: multiline ? "color-mix(in srgb, var(--accent-indigo) 18%, transparent)" : "color-mix(in srgb, var(--font-primary) 6%, transparent)",
      flex: multiline ? "1 1 100%" : "1 1 160px",
      minWidth: multiline ? "100%" : 0,
      maxWidth: multiline ? "100%" : undefined,
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: "color-mix(in srgb, var(--accent-indigo) 20%, transparent)",
        backgroundColor: "color-mix(in srgb, var(--accent-indigo) 2%, transparent)",
      },
    }}
  >
    <Box sx={{ color: "var(--accent-indigo)", flexShrink: 0, mt: 0.25 }}>{icon}</Box>
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
          color: "var(--font-primary-dark)",
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
            sx={{ mb: 2, textTransform: "none", color: "var(--font-secondary)" }}
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
              color: "var(--font-secondary)",
              fontWeight: 500,
              fontSize: "0.875rem",
              "&:hover": { backgroundColor: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)", color: "var(--accent-indigo)" },
            }}
          >
            Jobs
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>/</Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: "var(--font-primary-dark)",
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
            borderColor: "color-mix(in srgb, var(--font-primary) 6%, transparent)",
            background: "linear-gradient(160deg, var(--surface) 0%, color-mix(in srgb, var(--surface) 88%, var(--border-default) 12%) 50%, color-mix(in srgb, var(--surface) 75%, var(--border-default) 25%) 100%)",
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
                    backgroundColor: "var(--accent-indigo)",
                    border: "3px solid var(--card-bg)",
                    boxShadow: "0 4px 14px color-mix(in srgb, var(--accent-indigo) 25%, transparent)",
                    fontSize: "1.4rem",
                    flexShrink: 0,
                  }}
                >
                  {job.company_name?.[0]?.toUpperCase() || "C"}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: "var(--font-primary-dark)", lineHeight: 1.3, letterSpacing: "-0.02em" }}>
                    {job.job_title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, fontSize: "1rem" }}>
                    {job.company_name}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1.5, alignItems: "center" }}>
                    <Chip
                      label={job.job_type ?? "Job"}
                      size="small"
                      sx={{ backgroundColor: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)", color: "var(--accent-indigo)", fontWeight: 600, height: 26 }}
                    />
                    <Chip
                      label={job.is_published ? "Published" : "Draft"}
                      size="small"
                      sx={{
                        backgroundColor: job.is_published ? "color-mix(in srgb, var(--success-500) 12%, transparent)" : "color-mix(in srgb, var(--font-secondary) 12%, transparent)",
                        color: job.is_published ? "var(--success-500)" : "var(--font-secondary)",
                        fontWeight: 600,
                        height: 26,
                      }}
                    />
                    {job.employment_type && (
                      <Chip
                        label={job.employment_type}
                        size="small"
                        sx={{
                          backgroundColor: "color-mix(in srgb, var(--card-bg) 90%, transparent)",
                          color: "var(--accent-indigo)",
                          border: "1px solid color-mix(in srgb, var(--accent-indigo) 30%, transparent)",
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
                            borderColor: "color-mix(in srgb, var(--accent-indigo) 30%, transparent)",
                            borderWidth: 1.5,
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--accent-indigo)" },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--accent-indigo)",
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
                      borderColor: "color-mix(in srgb, var(--accent-indigo) 50%, transparent)",
                      color: "var(--accent-indigo)",
                      borderRadius: 2,
                      "&:hover": { borderColor: "var(--accent-indigo)", backgroundColor: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)" },
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
                      backgroundColor: "var(--accent-indigo)",
                      px: 2.5,
                      borderRadius: 2,
                      boxShadow: "0 2px 8px color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
                      "&:hover": { backgroundColor: "var(--accent-indigo-dark)", boxShadow: "0 4px 12px color-mix(in srgb, var(--accent-indigo) 40%, transparent)" },
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
                      backgroundColor: "var(--accent-indigo)",
                      px: 2.5,
                      borderRadius: 2,
                      boxShadow: "0 2px 8px color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
                      "&:hover": { backgroundColor: "var(--accent-indigo-dark)", boxShadow: "0 4px 12px color-mix(in srgb, var(--accent-indigo) 40%, transparent)" },
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
                      borderColor: "color-mix(in srgb, var(--accent-indigo) 50%, transparent)",
                      color: "var(--accent-indigo)",
                      borderRadius: 2,
                      "&:hover": { borderColor: "var(--accent-indigo)", backgroundColor: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)" },
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
                      "&:hover": { backgroundColor: "color-mix(in srgb, var(--error-500) 4%, transparent)" },
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
            icon={<Heart size={18} style={{ color: "var(--accent-indigo)" }} />}
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
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8, color: "var(--font-muted)", fontSize: "0.9375rem" }}>
                  {job.job_description}
                </Typography>
              </SectionCard>
            )}

            {job.role_process && (
              <SectionCard title="Role Process" icon="mdi:format-list-checks">
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8, color: "var(--font-muted)", fontSize: "0.9375rem" }}>
                  {job.role_process}
                </Typography>
              </SectionCard>
            )}

            {job.company_info && (
              <SectionCard title="About Company" icon="mdi:information-outline">
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8, color: "var(--font-muted)", fontSize: "0.9375rem" }}>
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
                  borderColor: "color-mix(in srgb, var(--accent-indigo) 25%, transparent)",
                  backgroundColor: "color-mix(in srgb, var(--accent-indigo) 4%, transparent)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "color-mix(in srgb, var(--accent-indigo) 40%, transparent)",
                    backgroundColor: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)",
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
                    color: "var(--accent-indigo)",
                    fontWeight: 600,
                    textDecoration: "none",
                    wordBreak: "break-all",
                    fontSize: "0.9375rem",
                    "&:hover": { textDecoration: "underline", color: "var(--accent-indigo-dark)" },
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
                  borderColor: "color-mix(in srgb, var(--accent-indigo) 25%, transparent)",
                  backgroundColor: "color-mix(in srgb, var(--accent-indigo) 4%, transparent)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "color-mix(in srgb, var(--accent-indigo) 40%, transparent)",
                    backgroundColor: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)",
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
                    color: "var(--accent-indigo)",
                    fontWeight: 600,
                    textDecoration: "none",
                    wordBreak: "break-all",
                    fontSize: "0.9375rem",
                    "&:hover": { textDecoration: "underline", color: "var(--accent-indigo-dark)" },
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
                        borderColor: "color-mix(in srgb, var(--accent-indigo) 40%, transparent)",
                        color: "var(--accent-indigo)",
                        fontWeight: 500,
                        backgroundColor: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)",
                        "&:hover": { backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)" },
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
                  <Typography variant="body2" sx={{ color: "var(--font-muted)", fontWeight: 500 }}>{job.industry_type}</Typography>
                </SectionCard>
              )}
              {job.department && (
                <SectionCard title="Department" icon="mdi:domain">
                  <Typography variant="body2" sx={{ color: "var(--font-muted)", fontWeight: 500 }}>{job.department}</Typography>
                </SectionCard>
              )}
              {job.education && (
                <SectionCard title="Education" icon="mdi:school-outline">
                  <Typography variant="body2" sx={{ color: "var(--font-muted)", fontWeight: 500 }}>{job.education}</Typography>
                </SectionCard>
              )}
              {passoutYearDisplay && (
                <SectionCard title="Applicable passout year" icon="mdi:calendar-outline">
                  <Typography variant="body2" sx={{ color: "var(--font-muted)", fontWeight: 500 }}>{passoutYearDisplay}</Typography>
                </SectionCard>
              )}
              {job.role_category && (
                <SectionCard title="Role Category" icon="mdi:briefcase-outline">
                  <Typography variant="body2" sx={{ color: "var(--font-muted)", fontWeight: 500 }}>{job.role_category}</Typography>
                </SectionCard>
              )}
            </Box>

            {(job.ug_requirements || job.pg_requirements) && (
              <SectionCard title="Requirements" icon="mdi:certificate-outline">
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {job.ug_requirements && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>UG</Typography>
                      <Typography variant="body2" sx={{ color: "var(--font-muted)", display: "block", mt: 0.25 }}>{job.ug_requirements}</Typography>
                    </Box>
                  )}
                  {job.pg_requirements && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>PG</Typography>
                      <Typography variant="body2" sx={{ color: "var(--font-muted)", display: "block", mt: 0.25 }}>{job.pg_requirements}</Typography>
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
                      sx={{ backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)", color: "var(--accent-indigo)", fontWeight: 500 }}
                    />
                  ))}
                </Box>
              </SectionCard>
            )}

            {collegeMappings.length > 0 && (
              <SectionCard title="Targeted Colleges" icon="mdi:domain">
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {collegeMappings.map((m, i) => (
                    <Chip key={i} label={m.college_name} size="small" variant="outlined" sx={{ borderColor: "color-mix(in srgb, var(--font-primary) 12%, transparent)" }} />
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
