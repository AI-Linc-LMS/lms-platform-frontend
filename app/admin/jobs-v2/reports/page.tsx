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
      backgroundColor: "#fff",
      transition: "box-shadow 0.2s, border-color 0.2s",
      "&:hover": {
        borderColor: "rgba(99, 102, 241, 0.3)",
        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.08)",
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
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon={icon} size={20} style={{ color: "#6366f1" }} />
        </Box>
      )}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0f172a" }}>
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
            gap: { xs: 2, md: 4 },
            p: { xs: 2.5, md: 4 },
            mb: 3,
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 40%, #e2e8f0 100%)",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "rgba(99, 102, 241, 0.08)",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.04)",
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
            <ReportsIllustration width={160} height={125} primaryColor="#6366f1" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.75, color: "#0f172a", letterSpacing: "-0.02em" }}>
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
                  backgroundColor: "#fff",
                  border: "1px solid",
                  borderColor: "rgba(99, 102, 241, 0.2)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <FileSpreadsheet size={20} style={{ color: "#6366f1" }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }}>
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
                  backgroundColor: "rgba(99, 102, 241, 0.06)",
                  border: "1px solid",
                  borderColor: "rgba(99, 102, 241, 0.15)",
                }}
              >
                <Briefcase size={18} style={{ color: "#6366f1" }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#6366f1" }}>
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
                      backgroundColor: "#fafafa",
                      "&:hover": { backgroundColor: "#f8fafc" },
                      "&.Mui-focused": { backgroundColor: "#fff" },
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
                      backgroundColor: "#fafafa",
                      "&:hover": { backgroundColor: "#f8fafc" },
                      "&.Mui-focused": { backgroundColor: "#fff" },
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
                    backgroundColor: "#6366f1",
                    alignSelf: "flex-start",
                    px: 2.5,
                    py: 1.25,
                    borderRadius: 2,
                    boxShadow: "0 2px 8px rgba(99, 102, 241, 0.25)",
                    "&:hover": {
                      backgroundColor: "#4f46e5",
                      boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
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
                  backgroundColor: "#f8fafc",
                  border: "1px dashed",
                  borderColor: "rgba(99, 102, 241, 0.2)",
                }}
              >
                <Briefcase size={40} style={{ color: "#cbd5e1", marginBottom: 12 }} />
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
                    borderColor: "#6366f1",
                    color: "#6366f1",
                    "&:hover": { borderColor: "#4f46e5", backgroundColor: "rgba(99, 102, 241, 0.04)" },
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
                    backgroundColor: "rgba(99, 102, 241, 0.2)",
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
                      backgroundColor: "#fafafa",
                      border: "1px solid",
                      borderColor: "transparent",
                      "&:hover": {
                        backgroundColor: "rgba(99, 102, 241, 0.06)",
                        borderColor: "rgba(99, 102, 241, 0.2)",
                        color: "#6366f1",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1.5,
                        backgroundColor: "rgba(99, 102, 241, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        mr: 1.5,
                      }}
                    >
                      <Briefcase size={18} style={{ color: "#6366f1" }} />
                    </Box>
                    <Box sx={{ textAlign: "left", minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {job.job_title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                        {job.company_name}
                      </Typography>
                    </Box>
                    <ChevronRight size={20} style={{ color: "#94a3b8", flexShrink: 0 }} />
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
