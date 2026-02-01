"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Tabs,
  Tab,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import {
  adminEmailJobsService,
  EmailJob,
} from "@/lib/services/admin/admin-email-jobs.service";
import {
  adminAssessmentEmailJobsService,
  AssessmentEmailJob,
} from "@/lib/services/admin/admin-assessment-email-jobs.service";
import { config } from "@/lib/config";

const isFailedStatus = (status: string) => {
  const s = (status || "").toLowerCase();
  return s === "failed" || s === "error";
};

function JobsTable({
  jobs,
  loading,
  filterName,
  filterStatus,
  setFilterName,
  setFilterStatus,
  page,
  limit,
  setPage,
  setLimit,
  retryingId,
  onView,
  onRetry,
  getStatusColor,
  formatDate,
  isAssessment = false,
}: {
  jobs: (EmailJob | AssessmentEmailJob)[];
  loading: boolean;
  filterName: string;
  filterStatus: string;
  setFilterName: (v: string) => void;
  setFilterStatus: (v: string) => void;
  page: number;
  limit: number;
  setPage: (v: number) => void;
  setLimit: (v: number) => void;
  retryingId: string | null;
  onView: (job: EmailJob | AssessmentEmailJob) => void;
  onRetry: (job: EmailJob | AssessmentEmailJob) => void;
  getStatusColor: (s: string) => string;
  formatDate: (s: string) => string;
  isAssessment?: boolean;
}) {
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const search = filterName.trim().toLowerCase();
      const matchName =
        !search ||
        (job.subject || "").toLowerCase().includes(search) ||
        (job.task_name || "").toLowerCase().includes(search) ||
        ((job as AssessmentEmailJob).assessment_title || "")
          .toLowerCase()
          .includes(search);
      const matchStatus =
        filterStatus === "all" ||
        (job.status || "").toLowerCase() === filterStatus.toLowerCase();
      return matchName && matchStatus;
    });
  }, [jobs, filterName, filterStatus]);

  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredJobs.slice(start, start + limit);
  }, [filteredJobs, page, limit]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / limit));

  useEffect(() => {
    setPage(1);
  }, [filterName, filterStatus, limit, setPage]);

  const displayName = (job: EmailJob | AssessmentEmailJob) =>
    (job as AssessmentEmailJob).assessment_title ||
    job.task_name ||
    job.subject ||
    "—";

  return (
    <Box>
      {!loading && jobs.length > 0 && (
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <TextField
            size="small"
            placeholder="Filter by name or subject..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="COMPLETED">COMPLETED</MenuItem>
              <MenuItem value="FAILED">FAILED</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="sent">Sent</MenuItem>
              <MenuItem value="queued">Queued</MenuItem>
              <MenuItem value="error">Error</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper
          sx={{
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          <TableContainer>
            <Table size="small" sx={{ minWidth: 500 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                  <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                    {isAssessment ? "Assessment / Subject" : "Task / Subject"}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        {jobs.length === 0
                          ? "No email jobs found"
                          : "No jobs match the filters"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedJobs.map((job) => (
                    <TableRow
                      key={job.task_id}
                      sx={{ "&:hover": { backgroundColor: "#f9fafb" } }}
                    >
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            maxWidth: 280,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={displayName(job)}
                        >
                          {displayName(job)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Chip
                          label={job.status || "—"}
                          size="small"
                          sx={{
                            bgcolor: `${getStatusColor(job.status)}20`,
                            color: getStatusColor(job.status),
                            fontWeight: 600,
                            fontSize: "0.75rem",
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(job.created_at || "")}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onView(job)}
                            sx={{ minWidth: 70 }}
                          >
                            View
                          </Button>
                          {isFailedStatus(job.status) && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="secondary"
                              onClick={() => onRetry(job)}
                              disabled={retryingId === job.task_id}
                              sx={{ minWidth: 70 }}
                            >
                              {retryingId === job.task_id ? (
                                <CircularProgress size={16} color="inherit" />
                              ) : (
                                "Retry"
                              )}
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {filteredJobs.length > 0 && (
            <Box
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexDirection: { xs: "column", sm: "row" },
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography
                  variant="body2"
                  sx={{ color: "#6b7280", fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                >
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(filteredJobs.length, page * limit)} of {filteredJobs.length}
                </Typography>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    <MenuItem value={10}>10 per page</MenuItem>
                    <MenuItem value={25}>25 per page</MenuItem>
                    <MenuItem value={50}>50 per page</MenuItem>
                    <MenuItem value={100}>100 per page</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                size="small"
                showFirstButton={false}
                showLastButton={false}
                boundaryCount={1}
                siblingCount={0}
                disabled={totalPages <= 1}
              />
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}

export default function AdminEmailsPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (searchParams?.get("tab") === "assessment") {
      setTabValue(1);
    }
  }, [searchParams]);

  const [allJobs, setAllJobs] = useState<EmailJob[]>([]);
  const [assessmentJobs, setAssessmentJobs] = useState<AssessmentEmailJob[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingAssessment, setLoadingAssessment] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const [filterNameAll, setFilterNameAll] = useState("");
  const [filterStatusAll, setFilterStatusAll] = useState("all");
  const [pageAll, setPageAll] = useState(1);
  const [limitAll, setLimitAll] = useState(10);

  const [filterNameAssess, setFilterNameAssess] = useState("");
  const [filterStatusAssess, setFilterStatusAssess] = useState("all");
  const [pageAssess, setPageAssess] = useState(1);
  const [limitAssess, setLimitAssess] = useState(10);

  const loadAllJobs = useCallback(async () => {
    try {
      setLoadingAll(true);
      const data = await adminEmailJobsService.getEmailJobs(config.clientId);
      setAllJobs(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      showToast((e as Error)?.message || "Failed to load email jobs", "error");
      setAllJobs([]);
    } finally {
      setLoadingAll(false);
    }
  }, [showToast]);

  const loadAssessmentJobs = useCallback(async () => {
    try {
      setLoadingAssessment(true);
      const data = await adminAssessmentEmailJobsService.getAssessmentEmailJobs(
        config.clientId
      );
      setAssessmentJobs(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      showToast(
        (e as Error)?.message || "Failed to load assessment email jobs",
        "error"
      );
      setAssessmentJobs([]);
    } finally {
      setLoadingAssessment(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (tabValue === 0) loadAllJobs();
    else loadAssessmentJobs();
  }, [tabValue, loadAllJobs, loadAssessmentJobs]);

  const handleViewAll = (job: EmailJob | AssessmentEmailJob) => {
    router.push(`/admin/emails/${encodeURIComponent(job.task_id)}`);
  };

  const handleViewAssessment = (job: EmailJob | AssessmentEmailJob) => {
    router.push(`/admin/emails/assessment/${encodeURIComponent(job.task_id)}`);
  };

  const handleRetryAll = async (job: EmailJob | AssessmentEmailJob) => {
    try {
      setRetryingId(job.task_id);
      await adminEmailJobsService.resendEmailJob(config.clientId, job.task_id);
      showToast("Email job queued for resending", "success");
      loadAllJobs();
    } catch (e: unknown) {
      showToast((e as Error)?.message || "Failed to resend", "error");
    } finally {
      setRetryingId(null);
    }
  };

  const handleRetryAssessment = async (job: EmailJob | AssessmentEmailJob) => {
    try {
      setRetryingId(job.task_id);
      await adminAssessmentEmailJobsService.retryAssessmentEmailJob(
        config.clientId,
        job.task_id
      );
      showToast("Assessment email job queued for retry", "success");
      loadAssessmentJobs();
    } catch (e: unknown) {
      showToast((e as Error)?.message || "Failed to retry", "error");
    } finally {
      setRetryingId(null);
    }
  };

  const formatDate = (s: string) => {
    try {
      const d = new Date(s);
      return isNaN(d.getTime()) ? s : d.toLocaleString();
    } catch {
      return s;
    }
  };

  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "completed" || s === "success" || s === "sent") return "#10b981";
    if (s === "failed" || s === "error") return "#ef4444";
    if (s === "pending" || s === "queued") return "#f59e0b";
    return "#6b7280";
  };

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "#111827",
            fontSize: { xs: "1.5rem", sm: "2rem" },
            mb: 3,
          }}
        >
          Email Jobs
        </Typography>

        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
        >
          <Tab label="All Emails" />
          <Tab label="Assessment Emails" />
        </Tabs>

        {tabValue === 0 && (
          <JobsTable
            jobs={allJobs}
            loading={loadingAll}
            filterName={filterNameAll}
            filterStatus={filterStatusAll}
            setFilterName={setFilterNameAll}
            setFilterStatus={setFilterStatusAll}
            page={pageAll}
            limit={limitAll}
            setPage={setPageAll}
            setLimit={setLimitAll}
            retryingId={retryingId}
            onView={handleViewAll}
            onRetry={handleRetryAll}
            getStatusColor={getStatusColor}
            formatDate={formatDate}
            isAssessment={false}
          />
        )}

        {tabValue === 1 && (
          <JobsTable
            jobs={assessmentJobs}
            loading={loadingAssessment}
            filterName={filterNameAssess}
            filterStatus={filterStatusAssess}
            setFilterName={setFilterNameAssess}
            setFilterStatus={setFilterStatusAssess}
            page={pageAssess}
            limit={limitAssess}
            setPage={setPageAssess}
            setLimit={setLimitAssess}
            retryingId={retryingId}
            onView={handleViewAssessment}
            onRetry={handleRetryAssessment}
            getStatusColor={getStatusColor}
            formatDate={formatDate}
            isAssessment={true}
          />
        )}
      </Box>
    </MainLayout>
  );
}
