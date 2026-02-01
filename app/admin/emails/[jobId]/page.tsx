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
  if (s === "completed" || s === "success" || s === "sent") return "#10b981";
  if (s === "failed" || s === "error") return "#ef4444";
  if (s === "pending" || s === "queued") return "#f59e0b";
  return "#6b7280";
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
  emptyMessage = "None",
}: {
  recipients: EmailRecipient[];
  title: string;
  emptyMessage?: string;
}) {
  if (!recipients || recipients.length === 0) {
    return (
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          {title} (0)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
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
            <TableRow sx={{ backgroundColor: "#f9fafb" }}>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
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
        showToast((e as Error)?.message || "Failed to load job details", "error");
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
  const title = data.task_name || data.subject || "Email Job Details";

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Button
          startIcon={<IconWrapper icon="mdi:arrow-left" size={18} />}
          onClick={() => router.push("/admin/emails")}
          sx={{ mb: 2, textTransform: "none" }}
        >
          Back to Email Jobs
        </Button>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "#111827",
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
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Task ID
              </Typography>
              <Typography variant="body2">{data.task_id}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Status
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
                  Total Recipients
                </Typography>
                <Typography variant="body2">{recipientsCount}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Successful
                </Typography>
                <Typography variant="body2" sx={{ color: "#10b981" }}>
                  {successfulCount}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Failed
                </Typography>
                <Typography variant="body2" sx={{ color: failedCount > 0 ? "#ef4444" : "inherit" }}>
                  {failedCount}
                </Typography>
              </Box>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Created
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
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
          >
            <Tab label="All Recipients" />
            <Tab label="Successful" />
            <Tab label="Failed" />
            <Tab label="Email Body" />
          </Tabs>
          <Box sx={{ p: 2 }}>
            {tabValue === 0 && (
              <RecipientsTable
                recipients={data.emails ?? []}
                title="All Recipients"
                emptyMessage="No recipients"
              />
            )}
            {tabValue === 1 && (
              <RecipientsTable
                recipients={data.successful_emails ?? []}
                title="Successful"
                emptyMessage="No successful deliveries"
              />
            )}
            {tabValue === 2 && (
              <RecipientsTable
                recipients={data.failed_emails ?? []}
                title="Failed"
                emptyMessage="No failed deliveries"
              />
            )}
            {tabValue === 3 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Email Body
                </Typography>
                {emailBody ? (
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "#f9fafb",
                      borderRadius: 1,
                      maxHeight: 400,
                      overflow: "auto",
                      "& a": { color: "#6366f1" },
                    }}
                    dangerouslySetInnerHTML={{ __html: emailBody }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No email body
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
