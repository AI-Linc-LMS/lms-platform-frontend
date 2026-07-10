"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
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
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";
import { KpiRail } from "@/components/scorecard/shared";
import { statusTone, triggerChip } from "@/components/admin/emails/EmailJobCard";
import {
  adminEmailJobsService,
  EmailJobDetail,
  EmailRecipient,
} from "@/lib/services/admin/admin-email-jobs.service";
import { config } from "@/lib/config";

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
  const tone = statusTone(data.status);
  const trig = triggerChip(
    (data as unknown as Record<string, unknown>).trigger_source as string | undefined
  );

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 5 } }}>
        <Button
          startIcon={<IconWrapper icon="mdi:arrow-left" size={18} />}
          onClick={() => router.push("/admin/emails")}
          sx={{ mb: 1.5, textTransform: "none", color: "var(--font-secondary)" }}
        >
          {t("adminEmailJobs.backToEmailJobs")}
        </Button>

        <AdaptiveSectionShell>
          <AdaptiveSectionHero
            chapter="Notifications · Email job"
            title={title}
            subtitle={
              data.task_name && data.subject && data.task_name !== data.subject
                ? data.subject
                : `Sent ${formatDate(data.created_at || "")}`
            }
            icon="mdi:email-check-outline"
            accent="indigo"
            rightSlot={
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, px: 1.4, py: 0.7, borderRadius: 999, bgcolor: tone.bg }}>
                <Icon icon={tone.icon} width={16} style={{ color: tone.color }} />
                <Typography sx={{ fontWeight: 800, color: tone.color, textTransform: "capitalize", fontSize: "0.85rem" }}>
                  {tone.label}
                </Typography>
              </Box>
            }
          />

          <Box sx={{ mt: 2.5 }}>
            <KpiRail
              items={[
                { value: recipientsCount, label: "Recipients", accent: "#6366f1" },
                { value: successfulCount, label: "Delivered", accent: "#10b981" },
                { value: failedCount, label: "Failed", accent: failedCount > 0 ? "#ef4444" : "#94a3b8" },
              ]}
            />
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2, alignItems: "center" }}>
            {trig ? (
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.4, borderRadius: 999, border: `1px solid color-mix(in srgb, ${trig.color} 35%, transparent)` }}>
                <Icon icon={trig.icon} width={14} style={{ color: trig.color }} />
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: trig.color }}>{trig.label}</Typography>
              </Box>
            ) : null}
            <Typography variant="caption" sx={{ color: "var(--font-tertiary, var(--font-secondary))", ml: "auto" }}>
              {t("adminEmailJobs.taskId")}: {data.task_id}
            </Typography>
          </Box>

        <Paper
          sx={{
            mt: 2.5,
            borderRadius: 4,
            border: "1px solid var(--border-default)",
            background: "color-mix(in srgb, var(--card-bg) 75%, transparent)",
            backdropFilter: "blur(6px)",
            boxShadow: "none",
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
        </AdaptiveSectionShell>
      </Box>
    </MainLayout>
  );
}
