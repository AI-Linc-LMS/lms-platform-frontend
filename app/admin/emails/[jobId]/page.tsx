"use client";

import { useState, useEffect } from "react";
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
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminEmailJobsService,
  EmailJobDetail,
  EmailRecipient,
} from "@/lib/services/admin/admin-email-jobs.service";
import { config } from "@/lib/config";

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
  recipients: EmailRecipient[];
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

export default function EmailJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation("common");
  const jobId = params?.jobId as string | undefined;
  const [data, setData] = useState<EmailJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (!jobId) return;
    const load = async () => {
      try {
        setLoading(true);
        const result = await adminEmailJobsService.getEmailJobDetail(
          config.clientId,
          jobId
        );
        setData(result);
      } catch (e: unknown) {
        showToast((e as Error)?.message || t("adminEmailJobs.failedToLoadJobDetails"), "error");
        router.push("/admin/emails");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [jobId, showToast, router]);

  if (!jobId || loading) {
    return (
      <MainLayout>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 300,
            p: 3,
          }}
        >
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (!data) return null;

  const recipientsCount =
    data.emails?.length ??
    data.recipients_count ??
    0;
  const successfulCount =
    data.successful_emails?.length ??
    data.sent_count ??
    0;
  const failedCount =
    data.failed_emails?.length ??
    data.failed_count ??
    0;
  const emailBody = data.email_body ?? data.body ?? "";
  const title = data.task_name || data.subject || t("adminEmailJobs.emailJobDetails");

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
                {emailBody ? (
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "var(--surface)",
                      borderRadius: 1,
                      maxHeight: 400,
                      overflow: "auto",
                      "& a": { color: "var(--accent-indigo)" },
                    }}
                    dangerouslySetInnerHTML={{ __html: emailBody }}
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
