"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Typography,
  Button,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { ArrowLeft, ExternalLink, MapPin, Briefcase, Calendar, Heart, Banknote, FileText, Building2, Users, GraduationCap } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { jobsV2Service, JobV2, formatJobPassoutYear } from "@/lib/services/jobs-v2.service";
import { useToast } from "@/components/common/Toast";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useAdminMode } from "@/lib/contexts/AdminModeContext";
import { JobSearchIllustration, JobDetailIllustration } from "@/components/jobs-v2/illustrations";
import { formatDistanceToNow } from "@/lib/utils/date-utils";
import {
  formatJobDescriptionBody,
  formatApplicationDeadlineLabel,
  humanizeJobFieldLabel,
  formatJobSourceLabel,
} from "@/lib/utils/format-job-description";

const getPostedLabel = (d?: string) => {
  if (!d) return "—";
  try {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return "—";
    return formatDistanceToNow(date);
  } catch {
    return "—";
  }
};

export default function JobDetailPage() {
  const params = useParams();
  const detailSearchParams = useSearchParams();
  const { showToast } = useToast();
  const { isAdminMode } = useAdminMode();
  const id = Number(params?.id);

  const jobsListBackHref = useMemo(() => {
    const p = new URLSearchParams();
    const pg = detailSearchParams.get("page");
    if (pg) p.set("page", pg);
    const ps = detailSearchParams.get("page_size");
    if (ps) p.set("page_size", ps);
    const q = p.toString();
    return q ? `/jobs-v2?${q}` : "/jobs-v2";
  }, [detailSearchParams]);

  const jobsListQueryString = useMemo(() => {
    const p = new URLSearchParams();
    const pg = detailSearchParams.get("page");
    if (pg) p.set("page", pg);
    const ps = detailSearchParams.get("page_size");
    if (ps) p.set("page_size", ps);
    return p.toString();
  }, [detailSearchParams]);
  const [job, setJob] = useState<JobV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [showConfirmAppliedDialog, setShowConfirmAppliedDialog] = useState(false);
  const [pendingApplicationId, setPendingApplicationId] = useState<number | null>(null);

  const fetchJob = useCallback(async () => {
    if (!id || isNaN(id)) return;
    try {
      setLoading(true);
      const data = await jobsV2Service.getJobById(id);
      setJob(data);
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to load job", "error");
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleApply = useCallback(async () => {
    if (!job) return;
    if (job.apply_link) {
      if (job.eligible_to_apply === false) {
        showToast("You are not eligible to apply for this job based on college targeting.", "error");
        return;
      }
      try {
        setApplying(true);
        const res = await jobsV2Service.applyForJob(job.id, { external: true });
        window.open(job.apply_link!, "_blank");
        if (res.status === "applying" && res.id > 0) {
          setPendingApplicationId(res.id);
          setShowConfirmAppliedDialog(true);
        }
      } catch (err) {
        showToast((err as Error)?.message ?? "Failed to apply", "error");
      } finally {
        setApplying(false);
      }
      return;
    }
    if (job.eligible_to_apply === false) {
      showToast("You are not eligible to apply for this job based on college targeting.", "error");
      return;
    }
    // Internal apply: navigate to apply page (handled by Link)
  }, [job, showToast]);

  const handleConfirmAppliedYes = useCallback(async () => {
    if (pendingApplicationId == null) {
      setShowConfirmAppliedDialog(false);
      setPendingApplicationId(null);
      return;
    }
    try {
      await jobsV2Service.confirmApplied(pendingApplicationId);
      showToast("Application confirmed", "success");
      fetchJob();
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to confirm", "error");
    } finally {
      setShowConfirmAppliedDialog(false);
      setPendingApplicationId(null);
    }
  }, [pendingApplicationId, showToast, fetchJob]);

  const handleConfirmAppliedNo = useCallback(() => {
    setShowConfirmAppliedDialog(false);
    setPendingApplicationId(null);
  }, []);

  const handleFavorite = useCallback(async () => {
    if (!job || favoriteLoading) return;
    setFavoriteLoading(true);
    const prev = job.is_favourited ?? false;
    setJob((j) => (j ? { ...j, is_favourited: !prev } : j));
    try {
      const res = await jobsV2Service.toggleFavorite(job.id);
      setJob((j) => (j ? { ...j, is_favourited: res.favorited } : j));
      if (res.message) {
        showToast(res.message, "info");
      }
    } catch (err) {
      setJob((j) => (j ? { ...j, is_favourited: prev } : j));
      showToast((err as Error)?.message ?? "Failed to update favorite", "error");
    } finally {
      setFavoriteLoading(false);
    }
  }, [job, favoriteLoading, showToast]);

  const normalizedDescription = useMemo(
    () => formatJobDescriptionBody(job?.job_description),
    [job?.job_description]
  );
  const normalizedRequirements = useMemo(
    () => formatJobDescriptionBody(job?.scraper_requirements),
    [job?.scraper_requirements]
  );
  const normalizedBenefits = useMemo(
    () => formatJobDescriptionBody(job?.scraper_job_benefits),
    [job?.scraper_job_benefits]
  );
  const closingDateLabel = useMemo(
    () => formatApplicationDeadlineLabel(job?.application_deadline),
    [job?.application_deadline]
  );

  if (loading || !job) {
    return (
      <MainLayout>
        <Box sx={{ minHeight: "calc(100vh - 64px)", backgroundColor: "#f8fafc" }}>
          <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: "auto" }}>
            <Button
              component={Link}
              href={jobsListBackHref}
              startIcon={<ArrowLeft size={18} />}
                sx={{
                  mb: 2,
                textTransform: "none",
                color: "#6366f1",
                fontWeight: 500,
                "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.08)" },
              }}
            >
              Back to Jobs
            </Button>
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  py: 8,
                  gap: 2,
                }}
              >
                <JobSearchIllustration width={140} height={112} primaryColor="#94a3b8" />
                <Typography color="text.secondary">Loading job details...</Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <JobDetailIllustration width={140} height={115} primaryColor="#94a3b8" />
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 600, color: "#1e293b" }}>
                  Job not found
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                  This job may have been removed or the link is invalid.
                </Typography>
                <Button
                  component={Link}
                  href={jobsListBackHref}
                  startIcon={<ArrowLeft size={18} />}
                  sx={{
                    textTransform: "none",
                    backgroundColor: "#6366f1",
                    "&:hover": { backgroundColor: "#4f46e5" },
                  }}
                >
                  Back to Jobs
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </MainLayout>
    );
  }

  const canApply = job.status === "active" && job.eligible_to_apply !== false;
  const hasExternalLink = Boolean(job.apply_link?.trim());
  const hasApplied = Boolean(job.has_applied);

  const getApplyDisabledLabel = () => {
    if (hasApplied) return "Applied";
    if (job.eligible_to_apply === false) return "Not eligible to apply";
    if (job.status === "inactive") return "Applications closed (Inactive)";
    if (job.status === "closed") return "Applications closed";
    if (job.status === "completed") return "Applications completed";
    return "Applications closed";
  };

  const skills = [
    ...(job.mandatory_skills ?? []),
    ...(job.key_skills ?? []),
  ].filter(Boolean);

  const passoutYearDisplay = formatJobPassoutYear(job.applicable_passout_year);

  return (
    <MainLayout>
      <Box sx={{ minHeight: "calc(100vh - 64px)", backgroundColor: "#f8fafc" }}>
        {/* Hero header - matches admin reports / jobs list style */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            gap: { xs: 2, md: 3 },
            p: { xs: 2, md: 3 },
            mb: 0,
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)",
            borderBottom: "1px solid",
            borderColor: "divider",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: -40,
              right: -40,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "rgba(99, 102, 241, 0.06)",
            },
          }}
        >
          <Box sx={{ maxWidth: 1100, mx: "auto", width: "100%", position: "relative", zIndex: 1 }}>
            <Button
              component={Link}
              href={jobsListBackHref}
              startIcon={<ArrowLeft size={18} />}
              sx={{
                mb: 2,
                textTransform: "none",
                color: "#6366f1",
                fontWeight: 500,
                "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.08)" },
              }}
            >
              Back to Jobs
            </Button>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: { xs: "stretch", md: "flex-start" },
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flex: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    display: { xs: "none", md: "flex" },
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    width: 120,
                    height: 100,
                  }}
                >
                  <JobDetailIllustration width={100} height={84} primaryColor="#6366f1" />
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    width: { xs: 72, md: 88 },
                    height: { xs: 72, md: 88 },
                    borderRadius: 2,
                    backgroundColor: "#fff",
                    border: "1px solid",
                    borderColor: "divider",
                    overflow: "hidden",
                  }}
                >
                  <Avatar
                    src={job.company_logo}
                    alt={job.company_name}
                    sx={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "#6366f1",
                      color: "#fff",
                      fontSize: "1.75rem",
                    }}
                  >
                    {job.company_name?.[0]?.toUpperCase() || "C"}
                  </Avatar>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: "#0f172a", letterSpacing: "-0.02em" }}>
                    {job.job_title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
                    {job.company_name}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 1, md: 1.5 }, mb: 1.5, alignItems: "center" }}>
                    {job.job_type && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Job type:
                        </Typography>
                        <Chip
                          label={humanizeJobFieldLabel(job.job_type) ?? job.job_type}
                          size="small"
                          sx={{
                            backgroundColor: "rgba(99, 102, 241, 0.1)",
                            color: "#6366f1",
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                    )}
                    {job.employment_type && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Employment type:
                        </Typography>
                        <Chip
                          label={humanizeJobFieldLabel(job.employment_type) ?? job.employment_type}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: "#6366f1", color: "#6366f1", fontWeight: 500 }}
                        />
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 1.5, md: 2 }, color: "text.secondary" }}>
                    {job.location && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <MapPin size={16} />
                        <Typography variant="body2">{job.location}</Typography>
                      </Box>
                    )}
                    {job.years_of_experience && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Briefcase size={16} />
                        <Typography variant="body2">{job.years_of_experience}</Typography>
                      </Box>
                    )}
                    {passoutYearDisplay && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <GraduationCap size={16} />
                        <Typography variant="body2">Passout {passoutYearDisplay}</Typography>
                      </Box>
                    )}
                    {job.salary && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Banknote size={16} />
                        <Typography variant="body2">{job.salary}</Typography>
                      </Box>
                    )}
                    {job.created_at && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Calendar size={16} />
                        <Typography variant="body2">Posted {getPostedLabel(job.created_at)}</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexShrink: 0,
                  flexDirection: { xs: "row", md: "row" },
                  width: { xs: "100%", md: "auto" },
                  justifyContent: { xs: "flex-end", md: "flex-end" },
                }}
              >
                {!isAdminMode && (
                  <Tooltip title={job.is_favourited ? "Remove from favourites" : "Add to favourites"} arrow>
                    <IconButton
                      onClick={handleFavorite}
                      disabled={favoriteLoading}
                      sx={{
                        color: job.is_favourited ? "#6366f1" : "text.secondary",
                        border: "1px solid",
                        borderColor: "divider",
                        backgroundColor: "#fff",
                        "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.08)" },
                      }}
                    >
                      <Heart size={20} fill={job.is_favourited ? "#6366f1" : "none"} />
                    </IconButton>
                  </Tooltip>
                )}
                {hasExternalLink ? (
                  <Button
                    variant="contained"
                    onClick={handleApply}
                    disabled={hasApplied || applying || !canApply}
                    startIcon={hasApplied ? undefined : <ExternalLink size={18} />}
                    sx={{
                      borderRadius: 2,
                      backgroundColor: hasApplied ? "#22c55e" : "#6366f1",
                      color: "#fff",
                      textTransform: "none",
                      fontWeight: 600,
                      px: { xs: 2, md: 3 },
                      py: 1.25,
                      fontSize: { xs: "0.875rem", md: "1rem" },
                      whiteSpace: "nowrap",
                      "&:hover": hasApplied ? { backgroundColor: "#22c55e" } : { backgroundColor: "#4f46e5" },
                      "&.Mui-disabled": hasApplied
                        ? { backgroundColor: "#22c55e", color: "#fff", opacity: 1 }
                        : undefined,
                    }}
                  >
                    {hasApplied ? "Applied" : applying ? "Applying..." : "Apply"}
                  </Button>
                ) : hasApplied || !canApply ? (
                  <Button
                    variant="contained"
                    disabled
                    startIcon={hasApplied ? undefined : <ExternalLink size={18} />}
                    sx={{
                      borderRadius: 2,
                      backgroundColor: hasApplied ? "#22c55e" : "#6366f1",
                      color: "#fff",
                      textTransform: "none",
                      fontWeight: 600,
                      px: { xs: 2, md: 3 },
                      py: 1.25,
                      fontSize: { xs: "0.875rem", md: "1rem" },
                      whiteSpace: "nowrap",
                      "&.Mui-disabled": hasApplied
                        ? { backgroundColor: "#22c55e", color: "#fff", opacity: 1 }
                        : undefined,
                    }}
                  >
                    {getApplyDisabledLabel()}
                  </Button>
                ) : (
                  <Button
                    component={Link}
                    href={
                      jobsListQueryString
                        ? `/jobs-v2/${job.id}/apply?${jobsListQueryString}`
                        : `/jobs-v2/${job.id}/apply`
                    }
                    variant="contained"
                    startIcon={<ExternalLink size={18} />}
                    sx={{
                      borderRadius: 2,
                      backgroundColor: "#6366f1",
                      color: "#fff",
                      textTransform: "none",
                      fontWeight: 600,
                      px: { xs: 2, md: 3 },
                      py: 1.25,
                      fontSize: { xs: "0.875rem", md: "1rem" },
                      whiteSpace: "nowrap",
                      "&:hover": { backgroundColor: "#4f46e5" },
                    }}
                  >
                    Apply
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Two-panel content */}
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr 340px" },
              gap: 3,
              alignItems: "start",
            }}
          >
            {/* Left panel - main content */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Job Description section - combined JD file + text */}
              <Paper
                elevation={0}
                sx={{
                  overflow: "hidden",
                  borderRadius: 2.5,
                  border: "1px solid",
                  borderColor: "divider",
                  backgroundColor: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                {/* Section header */}
                <Box
                  sx={{
                    px: 2.5,
                    py: 2,
                    borderBottom: normalizedDescription ? "1px solid" : "none",
                    borderColor: "divider",
                    background: "linear-gradient(180deg, rgba(99, 102, 241, 0.04) 0%, transparent 100%)",
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
                    Job Description
                  </Typography>
                </Box>

                {/* Text description */}
                {normalizedDescription && (
                  <Box sx={{ px: 2.5, py: 2.5 }}>
                    <Typography
                      variant="body1"
                      component="div"
                      sx={{
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.8,
                        color: "#334155",
                        fontSize: "0.9375rem",
                        "& p": { mb: 1.5 },
                        "& ul, & ol": { pl: 2.5, mb: 1.5 },
                        "& li": { mb: 0.5 },
                      }}
                    >
                      {normalizedDescription}
                    </Typography>
                  </Box>
                )}

                {!normalizedDescription && !job.jd_file_url && (
                  <Box sx={{ px: 2.5, py: 3, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      No job description available
                    </Typography>
                  </Box>
                )}
              </Paper>

              {job.scraper_key_points && job.scraper_key_points.length > 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    backgroundColor: "#fff",
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: "#0f172a" }}>
                    Highlights
                  </Typography>
                  <Box
                    component="ul"
                    sx={{
                      m: 0,
                      pl: 2.25,
                      color: "#475569",
                      "& li": { mb: 1, lineHeight: 1.65 },
                    }}
                  >
                    {job.scraper_key_points.map((pt, i) => (
                      <Typography key={i} component="li" variant="body2">
                        {pt}
                      </Typography>
                    ))}
                  </Box>
                </Paper>
              )}

              {normalizedRequirements && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    backgroundColor: "#fff",
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: "#0f172a" }}>
                    Requirements
                  </Typography>
                  <Typography
                    variant="body2"
                    component="div"
                    sx={{ whiteSpace: "pre-wrap", lineHeight: 1.75, color: "#475569" }}
                  >
                    {normalizedRequirements}
                  </Typography>
                </Paper>
              )}

              {normalizedBenefits && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    backgroundColor: "#fff",
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: "#0f172a" }}>
                    Benefits
                  </Typography>
                  <Typography
                    variant="body2"
                    component="div"
                    sx={{ whiteSpace: "pre-wrap", lineHeight: 1.75, color: "#475569" }}
                  >
                    {normalizedBenefits}
                  </Typography>
                </Paper>
              )}

              {job.role_process && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    backgroundColor: "#fff",
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: "#0f172a" }}>
                    Role Process
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: "pre-wrap", lineHeight: 1.75, color: "#475569" }}
                  >
                    {job.role_process}
                  </Typography>
                </Paper>
              )}

              {skills.length > 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    backgroundColor: "#fff",
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: "#0f172a" }}>
                    Key Skills
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                    {skills.map((s, i) => (
                      <Chip
                        key={i}
                        label={s}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: "rgba(99, 102, 241, 0.4)",
                          color: "#6366f1",
                          backgroundColor: "rgba(99, 102, 241, 0.04)",
                          fontWeight: 500,
                        }}
                      />
                    ))}
                  </Box>
                </Paper>
              )}

              {job.company_info && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    backgroundColor: "#fff",
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: "#0f172a" }}>
                    About Company
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: "pre-wrap", lineHeight: 1.75, color: "#475569" }}
                  >
                    {job.company_info}
                  </Typography>
                </Paper>
              )}
            </Box>

            {/* Right panel - job details + apply */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Paper
              elevation={0}
              sx={{
                overflow: "hidden",
                borderRadius: 2.5,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "#fff",
                position: { lg: "sticky" },
                top: { lg: 24 },
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <Box
                sx={{
                  px: 2.5,
                  py: 2,
                  background: "linear-gradient(180deg, rgba(99, 102, 241, 0.06) 0%, transparent 100%)",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
                  Job Details
                </Typography>
              </Box>
              <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 0 }}>
                {job.scraper_source && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      py: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "rgba(0,0,0,0.06)",
                    }}
                  >
                    <Box sx={{ color: "#6366f1", flexShrink: 0, mt: 0.25 }}>
                      <FileText size={18} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, display: "block" }}>
                        Source
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 500 }}>
                        {formatJobSourceLabel(job.scraper_source)}
                      </Typography>
                    </Box>
                  </Box>
                )}
                {job.industry_type && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      py: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "rgba(0,0,0,0.06)",
                    }}
                  >
                    <Box sx={{ color: "#6366f1", flexShrink: 0, mt: 0.25 }}>
                      <Briefcase size={18} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, display: "block" }}>Industry</Typography>
                      <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 500 }}>
                        {humanizeJobFieldLabel(job.industry_type) ?? job.industry_type}
                      </Typography>
                    </Box>
                  </Box>
                )}
                {job.department && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      py: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "rgba(0,0,0,0.06)",
                    }}
                  >
                    <Box sx={{ color: "#6366f1", flexShrink: 0, mt: 0.25 }}>
                      <Building2 size={18} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, display: "block" }}>Department</Typography>
                      <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 500 }}>
                        {humanizeJobFieldLabel(job.department) ?? job.department}
                      </Typography>
                    </Box>
                  </Box>
                )}
                {job.employment_type && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      py: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "rgba(0,0,0,0.06)",
                    }}
                  >
                    <Box sx={{ color: "#6366f1", flexShrink: 0, mt: 0.25 }}>
                      <Briefcase size={18} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, display: "block" }}>Employment Type</Typography>
                      <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 500 }}>
                        {humanizeJobFieldLabel(job.employment_type) ?? job.employment_type}
                      </Typography>
                    </Box>
                  </Box>
                )}
                {job.role_category && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      py: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "rgba(0,0,0,0.06)",
                    }}
                  >
                    <Box sx={{ color: "#6366f1", flexShrink: 0, mt: 0.25 }}>
                      <Briefcase size={18} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, display: "block" }}>Role Category</Typography>
                      <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 500 }}>
                        {humanizeJobFieldLabel(job.role_category) ?? job.role_category}
                      </Typography>
                    </Box>
                  </Box>
                )}
                {job.education && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      py: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "rgba(0,0,0,0.06)",
                    }}
                  >
                    <Box sx={{ color: "#6366f1", flexShrink: 0, mt: 0.25 }}>
                      <GraduationCap size={18} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, display: "block" }}>Education</Typography>
                      <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 500 }}>{job.education}</Typography>
                    </Box>
                  </Box>
                )}
                {passoutYearDisplay && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      py: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "rgba(0,0,0,0.06)",
                    }}
                  >
                    <Box sx={{ color: "#6366f1", flexShrink: 0, mt: 0.25 }}>
                      <GraduationCap size={18} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, display: "block" }}>
                        Applicable passout year
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 500 }}>{passoutYearDisplay}</Typography>
                    </Box>
                  </Box>
                )}
                {job.ug_requirements && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      py: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "rgba(0,0,0,0.06)",
                    }}
                  >
                    <Box sx={{ color: "#6366f1", flexShrink: 0, mt: 0.25 }}>
                      <GraduationCap size={18} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, display: "block" }}>UG Requirements</Typography>
                      <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 500 }}>{job.ug_requirements}</Typography>
                    </Box>
                  </Box>
                )}
                {job.pg_requirements && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      py: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "rgba(0,0,0,0.06)",
                    }}
                  >
                    <Box sx={{ color: "#6366f1", flexShrink: 0, mt: 0.25 }}>
                      <GraduationCap size={18} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, display: "block" }}>PG Requirements</Typography>
                      <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 500 }}>{job.pg_requirements}</Typography>
                    </Box>
                  </Box>
                )}
                {closingDateLabel && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      py: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "rgba(0,0,0,0.06)",
                    }}
                  >
                    <Box sx={{ color: "#6366f1", flexShrink: 0, mt: 0.25 }}>
                      <Calendar size={18} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, display: "block" }}>Closing Date</Typography>
                      <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 500 }}>
                        {closingDateLabel}
                      </Typography>
                    </Box>
                  </Box>
                )}
                {job.number_of_openings != null && job.number_of_openings > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      py: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "rgba(0,0,0,0.06)",
                    }}
                  >
                    <Box sx={{ color: "#6366f1", flexShrink: 0, mt: 0.25 }}>
                      <Users size={18} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, display: "block" }}>Openings</Typography>
                      <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 500 }}>{job.number_of_openings}</Typography>
                    </Box>
                  </Box>
                )}
                {!job.scraper_source && !job.industry_type && !job.department && !job.employment_type && !job.role_category && !job.education && !passoutYearDisplay && !job.ug_requirements && !job.pg_requirements && !closingDateLabel && (job.number_of_openings == null || job.number_of_openings === 0) && (
                  <Box sx={{ py: 2, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">No additional details</Typography>
                  </Box>
                )}
              </Box>
            </Paper>

            {hasExternalLink && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  backgroundColor: "#fff",
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: "#0f172a" }}>
                  Apply for this position
                </Typography>
                <Button
                  component="a"
                  href={job.apply_link!}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  fullWidth
                  startIcon={<ExternalLink size={18} />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: "#6366f1",
                    color: "#6366f1",
                    "&:hover": { borderColor: "#4f46e5", backgroundColor: "rgba(99, 102, 241, 0.08)" },
                  }}
                >
                  Apply
                </Button>
              </Paper>
            )}

            {/* Attached JD (PDF) - at end of right panel */}
            {job.jd_file_url && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "rgba(99, 102, 241, 0.2)",
                  backgroundColor: "rgba(99, 102, 241, 0.06)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "rgba(99, 102, 241, 0.08)",
                    borderColor: "rgba(99, 102, 241, 0.3)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 48,
                      borderRadius: 1.5,
                      backgroundColor: "#dc2626",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={20} color="#fff" />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>
                      Attached JD (PDF)
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      Full job description document
                    </Typography>
                  </Box>
                </Box>
                <Button
                  component="a"
                  href={job.jd_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  fullWidth
                  size="small"
                  startIcon={<FileText size={16} />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 1.5,
                    backgroundColor: "#6366f1",
                    "&:hover": { backgroundColor: "#4f46e5" },
                  }}
                >
                  View JD (PDF)
                </Button>
              </Paper>
            )}
            </Box>
          </Box>
        </Box>

        {/* Sticky Apply button - mobile */}
        <Box
          sx={{
            display: { xs: "block", md: "none" },
            position: "sticky",
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            pb: { xs: "max(16px, env(safe-area-inset-bottom))", md: 2 },
            backgroundColor: "#fff",
            borderTop: "1px solid",
            borderColor: "divider",
            boxShadow: "0 -4px 12px rgba(0,0,0,0.08)",
          }}
        >
          {hasExternalLink ? (
            <Button
              variant="contained"
              fullWidth
              onClick={handleApply}
              disabled={hasApplied || applying || !canApply}
              startIcon={hasApplied ? undefined : <ExternalLink size={18} />}
              sx={{
                borderRadius: 2,
                backgroundColor: hasApplied ? "#22c55e" : "#6366f1",
                py: 1.5,
                textTransform: "none",
                fontWeight: 600,
                "&:hover": { backgroundColor: hasApplied ? "#22c55e" : "#4f46e5" },
                "&.Mui-disabled": hasApplied
                  ? { backgroundColor: "#22c55e", color: "#fff", opacity: 1 }
                  : undefined,
              }}
            >
              {hasApplied ? "Applied" : applying ? "Applying..." : "Apply"}
            </Button>
          ) : hasApplied || !canApply ? (
            <Button
              variant="contained"
              fullWidth
              disabled
              startIcon={hasApplied ? undefined : <ExternalLink size={18} />}
              sx={{
                borderRadius: 2,
                backgroundColor: hasApplied ? "#22c55e" : "#6366f1",
                py: 1.5,
                textTransform: "none",
                fontWeight: 600,
                "&.Mui-disabled": hasApplied
                  ? { backgroundColor: "#22c55e", color: "#fff", opacity: 1 }
                  : undefined,
              }}
            >
              {getApplyDisabledLabel()}
            </Button>
          ) : (
            <Button
              component={Link}
              href={
                      jobsListQueryString
                        ? `/jobs-v2/${job.id}/apply?${jobsListQueryString}`
                        : `/jobs-v2/${job.id}/apply`
                    }
              variant="contained"
              fullWidth
              startIcon={<ExternalLink size={18} />}
              sx={{
                borderRadius: 2,
                backgroundColor: "#6366f1",
                py: 1.5,
                textTransform: "none",
                fontWeight: 600,
                "&:hover": { backgroundColor: "#4f46e5" },
              }}
            >
              Apply
            </Button>
          )}
        </Box>

        <ConfirmDialog
          open={showConfirmAppliedDialog}
          title="Did you apply?"
          message={
            job
              ? `Did you apply for ${job.job_title} at ${job.company_name}?`
              : "Did you apply for this position?"
          }
          confirmText="Yes"
          cancelText="No"
          confirmColor="success"
          onConfirm={handleConfirmAppliedYes}
          onCancel={handleConfirmAppliedNo}
        />
      </Box>
    </MainLayout>
  );
}
