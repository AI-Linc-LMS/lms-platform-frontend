"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Typography,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { adminJobsV2Service } from "@/lib/services/admin/admin-jobs-v2.service";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { config } from "@/lib/config";
import { ReportsIllustration } from "@/components/jobs-v2/illustrations";
import { IconWrapper } from "@/components/common/IconWrapper";
import { FileDown, FileSpreadsheet, Briefcase, ChevronRight } from "lucide-react";

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
      borderRadius: 2,
      border: "1px solid",
      borderColor: "divider",
      backgroundColor: "var(--card-bg)",
      transition: "box-shadow 0.2s, border-color 0.2s",
      "&:hover": {
        borderColor: "color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
        boxShadow: "0 4px 12px color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
      },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
      {icon && (
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            backgroundColor: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon={icon} size={20} style={{ color: "var(--accent-indigo)" }} />
        </Box>
      )}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
        {title}
      </Typography>
    </Box>
    {children}
  </Paper>
);

export default function AdminJobsV2ReportsPage() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<JobV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    const jobId = searchParams.get("job_id");
    if (jobId) setSelectedJobId(jobId);
  }, [searchParams]);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminJobsV2Service.getJobs(config.clientId);
      setJobs(data.results ?? []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleExport = useCallback(async () => {
    try {
      setExporting(true);
      await adminJobsV2Service.downloadExportReport({
        job_id: selectedJobId ? Number(selectedJobId) : undefined,
        status: statusFilter || undefined,
      });
      showToast("CSV exported successfully", "success");
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to export CSV", "error");
    } finally {
      setExporting(false);
    }
  }, [selectedJobId, statusFilter, showToast]);

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
            "&:hover": { backgroundColor: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)", color: "var(--accent-indigo)" },
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
            gap: { xs: 2, md: 4 },
            p: { xs: 2.5, md: 4 },
            mb: 3,
            background:
              "linear-gradient(135deg, var(--background) 0%, var(--surface) 40%, var(--border-default) 100%)",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
            boxShadow: "0 4px 24px color-mix(in srgb, var(--font-primary) 6%, transparent)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              width: { xs: "100%", md: 180 },
              height: { xs: 100, md: 140 },
            }}
          >
            <ReportsIllustration width={160} height={125} primaryColor="var(--accent-indigo)" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.75, color: "var(--font-primary)", letterSpacing: "-0.02em" }}>
              Job Reports
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6, maxWidth: 480 }}>
              Export application data as CSV for analysis, reporting, or external tools
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  backgroundColor: "var(--card-bg)",
                  border: "1px solid",
                  borderColor: "color-mix(in srgb, var(--accent-indigo) 25%, transparent)",
                  boxShadow: "0 1px 3px color-mix(in srgb, var(--font-primary) 6%, transparent)",
                }}
              >
                <FileSpreadsheet size={20} style={{ color: "var(--accent-indigo)" }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
                  CSV format
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  backgroundColor: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
                  border: "1px solid",
                  borderColor: "color-mix(in srgb, var(--accent-indigo) 20%, transparent)",
                }}
              >
                <Briefcase size={18} style={{ color: "var(--accent-indigo)" }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--accent-indigo)" }}>
                  {loading ? "—" : `${jobs.length} job${jobs.length !== 1 ? "s" : ""}`}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 3 }}>
          {/* Export section */}
          <SectionCard title="Export applications" icon="mdi:file-download-outline">
            {loading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Skeleton variant="rounded" height={48} sx={{ borderRadius: 2 }} />
                <Skeleton variant="rounded" height={48} sx={{ borderRadius: 2 }} />
                <Skeleton variant="rounded" width={140} height={44} sx={{ borderRadius: 2 }} />
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Filter by job and status, then download as CSV
                </Typography>
                <FormControl
                  fullWidth
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "var(--surface)",
                      "&:hover": { backgroundColor: "var(--background)" },
                      "&.Mui-focused": { backgroundColor: "var(--card-bg)" },
                    },
                  }}
                >
                  <InputLabel>Job (optional)</InputLabel>
                  <Select
                    value={selectedJobId}
                    label="Job (optional)"
                    onChange={(e) => setSelectedJobId(e.target.value)}
                  >
                    <MenuItem value="">All Jobs</MenuItem>
                    {jobs.map((j) => (
                      <MenuItem key={j.id} value={String(j.id)}>
                        {j.job_title} — {j.company_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl
                  fullWidth
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "var(--surface)",
                      "&:hover": { backgroundColor: "var(--background)" },
                      "&.Mui-focused": { backgroundColor: "var(--card-bg)" },
                    },
                  }}
                >
                  <InputLabel>Status (optional)</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status (optional)"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">All statuses</MenuItem>
                    <MenuItem value="applying">Applying</MenuItem>
                    <MenuItem value="applied">Applied</MenuItem>
                    <MenuItem value="shortlisted">Shortlisted</MenuItem>
                    <MenuItem value="interview_stage">Interview Stage</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="selected">Selected</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleExport}
                  disabled={exporting}
                  startIcon={<FileDown size={18} />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    backgroundColor: "var(--accent-indigo)",
                    alignSelf: "flex-start",
                    px: 2.5,
                    py: 1.25,
                    borderRadius: 2,
                    boxShadow: "0 2px 8px color-mix(in srgb, var(--accent-indigo) 30%, var(--border-default))",
                    "&:hover": {
                      backgroundColor: "var(--accent-indigo-dark)",
                      boxShadow: "0 4px 12px color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
                    },
                  }}
                >
                  {exporting ? "Exporting..." : "Export CSV"}
                </Button>
              </Box>
            )}
          </SectionCard>

          {/* Quick links */}
          <SectionCard title="View applications by job" icon="mdi:account-group-outline">
            {loading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: 2 }} />
                ))}
              </Box>
            ) : jobs.length === 0 ? (
              <Box
                sx={{
                  py: 5,
                  px: 2,
                  textAlign: "center",
                  borderRadius: 2,
                  backgroundColor: "var(--background)",
                  border: "1px dashed",
                  borderColor: "color-mix(in srgb, var(--accent-indigo) 25%, transparent)",
                }}
              >
                <Briefcase size={40} style={{ color: "var(--border-default)", marginBottom: 12 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  No jobs yet. Create a job to see applications here.
                </Typography>
                <Button
                  component={Link}
                  href="/admin/jobs-v2"
                  variant="outlined"
                  size="small"
                  sx={{
                    mt: 1,
                    textTransform: "none",
                    borderRadius: 2,
                    borderColor: "var(--accent-indigo)",
                    color: "var(--accent-indigo)",
                    "&:hover": { borderColor: "var(--accent-indigo-dark)", backgroundColor: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)" },
                  }}
                >
                  Go to Jobs
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  maxHeight: 320,
                  overflowY: "auto",
                  "&::-webkit-scrollbar": { width: 6 },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "color-mix(in srgb, var(--accent-indigo) 25%, transparent)",
                    borderRadius: 3,
                  },
                }}
              >
                {jobs.slice(0, 12).map((job) => (
                  <Button
                    key={job.id}
                    component={Link}
                    href={`/admin/jobs-v2/${job.id}/applications`}
                    fullWidth
                    sx={{
                      justifyContent: "flex-start",
                      textTransform: "none",
                      py: 1.5,
                      px: 2,
                      borderRadius: 2,
                      color: "text.primary",
                      backgroundColor: "var(--surface)",
                      border: "1px solid",
                      borderColor: "transparent",
                      "&:hover": {
                        backgroundColor: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
                        borderColor: "color-mix(in srgb, var(--accent-indigo) 25%, transparent)",
                        color: "var(--accent-indigo)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1.5,
                        backgroundColor: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        mr: 1.5,
                      }}
                    >
                      <Briefcase size={18} style={{ color: "var(--accent-indigo)" }} />
                    </Box>
                    <Box sx={{ textAlign: "left", minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {job.job_title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                        {job.company_name}
                      </Typography>
                    </Box>
                    <ChevronRight size={20} style={{ color: "var(--font-tertiary)", flexShrink: 0 }} />
                  </Button>
                ))}
                {jobs.length > 12 && (
                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", py: 1.5 }}>
                    +{jobs.length - 12} more jobs
                  </Typography>
                )}
              </Box>
            )}
          </SectionCard>
        </Box>
      </Box>
    </MainLayout>
  );
}
