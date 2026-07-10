"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  ButtonBase,
  CircularProgress,
  TextField,
  InputAdornment,
  Pagination,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { PerPageSelect } from "@/components/common/PerPageSelect";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";
import { KpiRail } from "@/components/scorecard/shared";
import { Reveal } from "@/components/scorecard/shared/Reveal";
import { EmailJobCard } from "@/components/admin/emails/EmailJobCard";
import {
  adminEmailJobsService,
  EmailJob,
} from "@/lib/services/admin/admin-email-jobs.service";
import {
  adminAssessmentEmailJobsService,
  AssessmentEmailJob,
} from "@/lib/services/admin/admin-assessment-email-jobs.service";
import { config } from "@/lib/config";

type AnyJob = EmailJob | AssessmentEmailJob;

const isFailedStatus = (status: string) => {
  const s = (status || "").toLowerCase();
  return s === "failed" || s === "error";
};

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
];

function formatDate(s: string) {
  try {
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleString();
  } catch {
    return s;
  }
}

function displayName(job: AnyJob) {
  return (
    (job as AssessmentEmailJob).assessment_title ||
    job.task_name ||
    job.subject ||
    "—"
  );
}

/** Fold varied backend status strings into the four the filter chips expose. */
function normalizedStatus(status: string): "completed" | "pending" | "failed" | "other" {
  const s = (status || "").toLowerCase();
  if (["completed", "success", "sent"].includes(s)) return "completed";
  if (["failed", "error"].includes(s)) return "failed";
  if (["pending", "queued", "in_progress", "sending"].includes(s)) return "pending";
  return "other";
}

/** One tab body: filter row + KPI rail + card grid + pagination. Purely presentational. */
function JobsPanel({
  jobs,
  loading,
  retryingId,
  onView,
  onRetry,
  showMetrics,
}: {
  jobs: AnyJob[];
  loading: boolean;
  retryingId: string | null;
  onView: (job: AnyJob) => void;
  onRetry: (job: AnyJob) => void;
  showMetrics: boolean;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchName =
        !q ||
        (job.subject || "").toLowerCase().includes(q) ||
        (job.task_name || "").toLowerCase().includes(q) ||
        ((job as AssessmentEmailJob).assessment_title || "").toLowerCase().includes(q);
      const matchStatus = status === "all" || normalizedStatus(job.status) === status;
      return matchName && matchStatus;
    });
  }, [jobs, search, status]);

  const kpis = useMemo(() => {
    let completed = 0, failed = 0, pending = 0, recipients = 0;
    for (const j of jobs) {
      const n = normalizedStatus(j.status);
      if (n === "completed") completed += 1;
      else if (n === "failed") failed += 1;
      else if (n === "pending") pending += 1;
      recipients += (j as AssessmentEmailJob).total_emails ?? 0;
    }
    const items = [
      { value: jobs.length, label: "Total jobs", accent: "#6366f1" },
      { value: completed, label: "Completed", accent: "#10b981" },
      { value: pending, label: "Pending", accent: "#f59e0b" },
      { value: failed, label: "Failed", accent: "#ef4444" },
    ];
    if (showMetrics) items.push({ value: recipients, label: "Recipients", accent: "#a855f7" });
    return items;
  }, [jobs, showMetrics]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  // Clamp during render (no setState-in-effect): if a filter shrinks the list
  // below the current page, fall back to the last valid page for display.
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * limit, (safePage - 1) * limit + limit),
    [filtered, safePage, limit]
  );

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (jobs.length === 0) {
    return (
      <Box
        sx={{
          mt: 3,
          py: 8,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          border: "1px dashed var(--border-default)",
          borderRadius: 4,
        }}
      >
        <Icon icon="mdi:email-off-outline" width={44} style={{ color: "var(--font-tertiary, var(--font-secondary))" }} />
        <Typography sx={{ mt: 1.5, fontWeight: 700, color: "var(--font-primary)" }}>No email jobs yet</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380, mt: 0.5 }}>
          Notification and reminder emails you send from assessments and other tools will appear here with their delivery status.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2.5 }}>
      <KpiRail items={kpis} />

      {/* filters */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 3, mb: 2, alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search by subject or assessment…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 260, flex: "1 1 260px", maxWidth: 420 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon icon="mdi:magnify" width={18} />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((f) => {
            const active = status === f.value;
            return (
              <ButtonBase
                key={f.value}
                onClick={() => setStatus(f.value)}
                sx={{
                  px: 1.5, py: 0.6, borderRadius: 999, fontSize: "0.8rem", fontWeight: 600,
                  color: active ? "white" : "var(--font-secondary)",
                  background: active ? "linear-gradient(135deg, #6366f1, #a855f7)" : "transparent",
                  border: active ? "none" : "1px solid var(--border-default)",
                }}
              >
                {f.label}
              </ButtonBase>
            );
          })}
        </Box>
      </Box>

      {paginated.length === 0 ? (
        <Typography sx={{ py: 6, textAlign: "center", color: "var(--font-secondary)" }}>
          No jobs match your filters.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
          }}
        >
          {paginated.map((job, idx) => (
            <Reveal key={job.task_id} delay={Math.min(idx * 0.04, 0.3)}>
              <EmailJobCard
                job={job}
                displayName={displayName(job)}
                createdLabel={formatDate(job.created_at || "")}
                isFailed={isFailedStatus(job.status)}
                retrying={retryingId === job.task_id}
                onView={() => onView(job)}
                onRetry={() => onRetry(job)}
                showMetrics={showMetrics}
              />
            </Reveal>
          ))}
        </Box>
      )}

      {filtered.length > limit || limit !== 12 ? (
        <Box sx={{ mt: 3, display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
              {`Showing ${(safePage - 1) * limit + 1}–${Math.min(filtered.length, safePage * limit)} of ${filtered.length}`}
            </Typography>
            <PerPageSelect value={limit} onChange={(v) => { setLimit(v); setPage(1); }} minWidth={100} />
          </Box>
          <Pagination
            count={totalPages}
            page={safePage}
            onChange={(_, v) => setPage(v)}
            color="primary"
            size="small"
            siblingCount={0}
            boundaryCount={1}
            disabled={totalPages <= 1}
          />
        </Box>
      ) : null}
    </Box>
  );
}

export default function AdminEmailsPage() {
  const { showToast } = useToast();
  const { t } = useTranslation("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<0 | 1>(0);

  useEffect(() => {
    if (searchParams?.get("tab") === "assessment") setTab(1);
  }, [searchParams]);

  const [allJobs, setAllJobs] = useState<EmailJob[]>([]);
  const [assessmentJobs, setAssessmentJobs] = useState<AssessmentEmailJob[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingAssessment, setLoadingAssessment] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

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
      const data = await adminAssessmentEmailJobsService.getAssessmentEmailJobs(config.clientId);
      setAssessmentJobs(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      showToast((e as Error)?.message || t("adminEmailJobs.failedToLoadAssessmentEmailJobs"), "error");
      setAssessmentJobs([]);
    } finally {
      setLoadingAssessment(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    if (tab === 0) loadAllJobs();
    else loadAssessmentJobs();
  }, [tab, loadAllJobs, loadAssessmentJobs]);

  const handleView = (job: AnyJob) => {
    const path = tab === 1 ? "assessment/" : "";
    router.push(`/admin/emails/${path}${encodeURIComponent(job.task_id)}`);
  };

  const handleRetry = async (job: AnyJob) => {
    try {
      setRetryingId(job.task_id);
      if (tab === 1) {
        await adminAssessmentEmailJobsService.retryAssessmentEmailJob(config.clientId, job.task_id);
        showToast(t("adminEmailJobs.assessmentEmailJobQueuedRetry"), "success");
        loadAssessmentJobs();
      } else {
        await adminEmailJobsService.resendEmailJob(config.clientId, job.task_id);
        showToast(t("adminEmailJobs.emailJobQueuedResending"), "success");
        loadAllJobs();
      }
    } catch (e: unknown) {
      showToast((e as Error)?.message || t("adminEmailJobs.failedToRetry"), "error");
    } finally {
      setRetryingId(null);
    }
  };

  const TABS: { label: string; icon: string }[] = [
    { label: "All emails", icon: "mdi:email-multiple-outline" },
    { label: "Assessment emails", icon: "mdi:clipboard-text-clock-outline" },
  ];

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1500, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 5 } }}>
        <AdaptiveSectionShell>
          <AdaptiveSectionHero
            chapter="Manage · Notifications"
            title="Email delivery"
            subtitle="Every notification and scheduled reminder sent from your workspace, with live delivery status. Assessment reminders you schedule appear here automatically as they go out."
            icon="mdi:email-fast-outline"
            accent="indigo"
            rightSlot={
              <ButtonBase
                onClick={() => router.push("/admin/assessment")}
                sx={{
                  px: 3, py: 1.4, borderRadius: 999, fontWeight: 800, color: "white",
                  background: "linear-gradient(135deg, #6366f1 0%, #a855f7 60%, #ec4899 100%)",
                  boxShadow: "0 18px 36px -16px rgba(168, 85, 247, 0.55)",
                  fontSize: "0.92rem", display: "inline-flex", alignItems: "center", gap: 0.75,
                  "&:hover": { transform: "translateY(-1px)" }, transition: "transform 120ms ease",
                }}
              >
                <Icon icon="mdi:clipboard-plus-outline" width={16} />
                Go to assessments
              </ButtonBase>
            }
          />

          {/* tab switch */}
          <Box sx={{ display: "flex", gap: 0.75, mt: 1 }}>
            {TABS.map((tb, i) => {
              const active = tab === i;
              return (
                <ButtonBase
                  key={tb.label}
                  onClick={() => setTab(i as 0 | 1)}
                  sx={{
                    px: 2, py: 1, borderRadius: 3, fontWeight: 700, fontSize: "0.85rem",
                    display: "inline-flex", alignItems: "center", gap: 0.75,
                    color: active ? "var(--accent-indigo)" : "var(--font-secondary)",
                    bgcolor: active ? "color-mix(in srgb, var(--accent-indigo) 10%, transparent)" : "transparent",
                    border: active ? "1px solid color-mix(in srgb, var(--accent-indigo) 30%, transparent)" : "1px solid var(--border-default)",
                  }}
                >
                  <Icon icon={tb.icon} width={17} />
                  {tb.label}
                </ButtonBase>
              );
            })}
          </Box>

          {tab === 0 ? (
            <JobsPanel
              jobs={allJobs}
              loading={loadingAll}
              retryingId={retryingId}
              onView={handleView}
              onRetry={handleRetry}
              showMetrics={false}
            />
          ) : (
            <JobsPanel
              jobs={assessmentJobs}
              loading={loadingAssessment}
              retryingId={retryingId}
              onView={handleView}
              onRetry={handleRetry}
              showMetrics
            />
          )}
        </AdaptiveSectionShell>
      </Box>
    </MainLayout>
  );
}
