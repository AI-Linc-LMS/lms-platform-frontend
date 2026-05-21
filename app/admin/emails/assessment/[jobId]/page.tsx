"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  LinearProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminAssessmentEmailJobsService,
  AssessmentEmailJobDetail,
} from "@/lib/services/admin/admin-assessment-email-jobs.service";
import { config } from "@/lib/config";

const POLL_INTERVAL_MS = 3000;
const TERMINAL_STATUSES = ["COMPLETED", "FAILED", "completed", "failed"];

const getStatusColor = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s === "completed" || s === "success" || s === "sent")
    return "var(--success-500)";
  if (s === "failed" || s === "error") return "var(--error-500)";
  if (s === "pending" || s === "queued") return "var(--warning-500)";
  return "var(--font-secondary)";
};

const formatDate = (s: string) => {
  try {
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleString();
  } catch {
    return s;
  }
};

function RecipientsTable({
  recipients,
  title,
  emptyMessage,
  t,
}: {
  recipients: Array<{ name: string; email: string }>;
  title: string;
  emptyMessage?: string;
  t: (key: string) => string;
}) {
  const empty = emptyMessage ?? t("adminEmailJobs.none");
  if (!recipients || recipients.length === 0) {
    return (
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          {title} (0)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {empty}
        </Typography>
      </Box>
    );
  }
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {title} ({recipients.length})
      </Typography>
      <TableContainer sx={{ maxHeight: 320, overflow: "auto" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: "var(--surface)" }}>
              <TableCell sx={{ fontWeight: 600 }}>{t("adminEmailJobs.name")}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t("adminEmailJobs.email")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recipients.map((r, i) => (
              <TableRow key={`${r.email}-${i}`}>
                <TableCell>{r.name || "—"}</TableCell>
                <TableCell>{r.email || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default function AssessmentEmailJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation("common");
  const jobId = params?.jobId as string | undefined;
  const [data, setData] = useState<AssessmentEmailJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!jobId || !config.clientId) return;
    try {
      const result = await adminAssessmentEmailJobsService.getAssessmentEmailJobDetail(
        config.clientId,
        jobId
      );
      setData(result);
      return result;
    } catch (e: unknown) {
      showToast((e as Error)?.message || t("adminEmailJobs.failedToLoadJobDetails"), "error");
      router.push("/admin/emails");
      return null;
    }
  }, [jobId, showToast, router]);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    const init = async () => {
      setLoading(true);
      const result = await load();
      setLoading(false);
      if (cancelled || !result) return;
      const status = (result.status || "").toUpperCase();
      if (!TERMINAL_STATUSES.includes(status)) {
        pollRef.current = setInterval(async () => {
          const updated = await load();
          if (updated) {
            const s = (updated.status || "").toUpperCase();
            if (TERMINAL_STATUSES.includes(s) && pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
          }
        }, POLL_INTERVAL_MS);
      }
    };
    init();
    return () => {
      cancelled = true;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [jobId, load]);

  if (!jobId || loading) {
    return (
      <MainLayout>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 300,
            p: 3,
          }}
        >
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
            {t("adminEmailJobs.loadingJobDetails")}
          </Typography>
        </Box>
      </MainLayout>
    );
  }

  if (!data) return null;

  const recipientsCount = data.emails?.length ?? data.total_emails ?? 0;
  const successfulCount =
    data.successful_emails?.length ?? data.successful_count ?? 0;
  const failedCount = data.failed_emails?.length ?? data.failed_count ?? 0;
  const isPolling = !TERMINAL_STATUSES.includes((data.status || "").toUpperCase());
  const title = data.task_name || data.subject || t("adminEmailJobs.assessmentEmailJob");

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Button
          startIcon={<IconWrapper icon="mdi:arrow-left" size={18} />}
          onClick={() => router.push("/admin/emails")}
          sx={{ mb: 2, textTransform: "none" }}
        >
          {t("adminEmailJobs.backToEmailJobs")}
        </Button>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "var(--font-primary)",
            fontSize: { xs: "1.5rem", sm: "2rem" },
            mb: 1,
          }}
        >
          {title}
        </Typography>
        {data.task_name && data.subject && data.task_name !== data.subject && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {data.subject}
          </Typography>
        )}

        {isPolling && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t("adminEmailJobs.progressEmailsSent", { success: successfulCount, total: recipientsCount })}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={recipientsCount ? (successfulCount / recipientsCount) * 100 : 0}
              sx={{ height: 6, borderRadius: 1 }}
            />
          </Box>
        )}

        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--card-bg)",
            boxShadow:
              "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t("adminEmailJobs.taskId")}
              </Typography>
              <Typography variant="body2">{data.task_id}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t("adminEmailJobs.status")}
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={data.status}
                  size="small"
                  sx={{
                    bgcolor: `${getStatusColor(data.status)}20`,
                    color: getStatusColor(data.status),
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t("adminEmailJobs.totalRecipients")}
                </Typography>
                <Typography variant="body2">{recipientsCount}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t("adminEmailJobs.successful")}
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--success-500)" }}>
                  {successfulCount}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t("adminEmailJobs.failedLabel")}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: failedCount > 0 ? "var(--error-500)" : "inherit" }}
                >
                  {failedCount}
                </Typography>
              </Box>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t("adminEmailJobs.created")}
              </Typography>
              <Typography variant="body2">
                {formatDate(data.created_at || "")}
              </Typography>
            </Box>
          </Box>
        </Paper>

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
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
          >
            <Tab label={t("adminEmailJobs.allRecipients")} />
            <Tab label={t("adminEmailJobs.successful")} />
            <Tab label={t("adminEmailJobs.failedLabel")} />
            <Tab label={t("adminEmailJobs.emailBody")} />
          </Tabs>
          <Box sx={{ p: 2 }}>
            {tabValue === 0 && (
              <RecipientsTable
                recipients={data.emails ?? []}
                title={t("adminEmailJobs.allRecipients")}
                emptyMessage={t("adminEmailJobs.noRecipients")}
                t={t}
              />
            )}
            {tabValue === 1 && (
              <RecipientsTable
                recipients={data.successful_emails ?? []}
                title={t("adminEmailJobs.successful")}
                emptyMessage={t("adminEmailJobs.noSuccessfulDeliveries")}
                t={t}
              />
            )}
            {tabValue === 2 && (
              <RecipientsTable
                recipients={data.failed_emails ?? []}
                title={t("adminEmailJobs.failedLabel")}
                emptyMessage={t("adminEmailJobs.noFailedDeliveries")}
                t={t}
              />
            )}
            {tabValue === 3 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  {t("adminEmailJobs.emailBody")}
                </Typography>
                {data.email_body ? (
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "var(--surface)",
                      borderRadius: 1,
                      maxHeight: 400,
                      overflow: "auto",
                      "& a": { color: "var(--accent-indigo)" },
                    }}
                    dangerouslySetInnerHTML={{ __html: data.email_body }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {t("adminEmailJobs.noEmailBody")}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </MainLayout>
  );
}
