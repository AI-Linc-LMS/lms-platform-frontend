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
import { useTranslation } from "react-i18next";
import { PerPageSelect } from "@/components/common/PerPageSelect";
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
  const { t } = useTranslation("common");
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
            placeholder={t("adminEmailJobs.filterByNamePlaceholder")}
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{t("adminEmailJobs.status")}</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label={t("adminEmailJobs.status")}
            >
              <MenuItem value="all">{t("adminEmailJobs.all")}</MenuItem>
              <MenuItem value="failed">{t("adminEmailJobs.failed")}</MenuItem>
              <MenuItem value="pending">{t("adminEmailJobs.pending")}</MenuItem>
              <MenuItem value="completed">{t("adminEmailJobs.completed")}</MenuItem>
              <MenuItem value="COMPLETED">{t("adminEmailJobs.completed")}</MenuItem>
              <MenuItem value="FAILED">{t("adminEmailJobs.failed")}</MenuItem>
              <MenuItem value="success">{t("adminEmailJobs.success")}</MenuItem>
              <MenuItem value="sent">{t("adminEmailJobs.sent")}</MenuItem>
              <MenuItem value="queued">{t("adminEmailJobs.queued")}</MenuItem>
              <MenuItem value="error">{t("adminEmailJobs.error")}</MenuItem>
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
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--card-bg)",
            boxShadow:
              "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
            overflow: "hidden",
          }}
        >
          <TableContainer>
            <Table size="small" sx={{ minWidth: 500 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: "var(--surface)" }}>
                  <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                    {isAssessment ? t("adminEmailJobs.assessmentSubject") : t("adminEmailJobs.taskSubject")}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 1.5 }}>{t("adminEmailJobs.status")}</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 1.5 }}>{t("adminEmailJobs.created")}</TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 1.5 }}>{t("adminEmailJobs.actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        {jobs.length === 0
                          ? t("adminEmailJobs.noEmailJobsFound")
                          : t("adminEmailJobs.noJobsMatchFilters")}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedJobs.map((job) => (
                    <TableRow
                      key={job.task_id}
                      sx={{ "&:hover": { backgroundColor: "var(--surface)" } }}
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
                            {t("adminEmailJobs.view")}
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
                                t("adminEmailJobs.retry")
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
                borderTop: "1px solid var(--border-default)",
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
                  sx={{
                    color: "var(--font-secondary)",
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  }}
                >
                  {t("adminEmailJobs.showing", {
                    start: (page - 1) * limit + 1,
                    end: Math.min(filteredJobs.length, page * limit),
                    total: filteredJobs.length,
                  })}
                </Typography>
                <PerPageSelect
                  value={limit}
                  onChange={(v) => {
                    setLimit(v);
                    setPage(1);
                  }}
                  minWidth={100}
                />
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
  const { t } = useTranslation("common");
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
      showToast((e as Error)?.message || t("adminEmailJobs.failedToLoadEmailJobs"), "error");
      setAllJobs([]);
    } finally {
      setLoadingAll(false);
    }
  }, [showToast, t]);

  const loadAssessmentJobs = useCallback(async () => {
    try {
      setLoadingAssessment(true);
      const data = await adminAssessmentEmailJobsService.getAssessmentEmailJobs(
        config.clientId
      );
      setAssessmentJobs(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      showToast(
        (e as Error)?.message || t("adminEmailJobs.failedToLoadAssessmentEmailJobs"),
        "error"
      );
      setAssessmentJobs([]);
    } finally {
      setLoadingAssessment(false);
    }
  }, [showToast, t]);

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
      showToast(t("adminEmailJobs.emailJobQueuedResending"), "success");
      loadAllJobs();
    } catch (e: unknown) {
      showToast((e as Error)?.message || t("adminEmailJobs.failedToResend"), "error");
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
      showToast(t("adminEmailJobs.assessmentEmailJobQueuedRetry"), "success");
      loadAssessmentJobs();
    } catch (e: unknown) {
      showToast((e as Error)?.message || t("adminEmailJobs.failedToRetry"), "error");
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
    if (s === "completed" || s === "success" || s === "sent")
      return "var(--success-500)";
    if (s === "failed" || s === "error") return "var(--error-500)";
    if (s === "pending" || s === "queued") return "var(--warning-500)";
    return "var(--font-secondary)";
  };

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "var(--font-primary)",
            fontSize: { xs: "1.5rem", sm: "2rem" },
            mb: 3,
          }}
        >
          {t("adminEmailJobs.title")}
        </Typography>

        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
        >
          <Tab label={t("adminEmailJobs.allEmails")} />
          <Tab label={t("adminEmailJobs.assessmentEmails")} />
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
