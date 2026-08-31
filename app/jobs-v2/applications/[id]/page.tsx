"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { IconWrapper } from "@/components/common/IconWrapper";
import { jobsV2Service, type JobApplicationV2 } from "@/lib/services/jobs-v2.service";
import { useSeq } from "@/lib/jobs-v2/useSeq";
import { formatDate } from "@/lib/jobs-v2/format";
import {
  J,
  R,
  TYPE,
  JobsScope,
  JCard,
  JButton,
  MetaRow,
  SectionHeader,
  StatusPill,
  EmptyState,
  ErrorState,
  JobDetailSkeleton,
  type MetaItem,
} from "@/components/jobs-v2/ui";
import { ApplicationsIllustration } from "@/components/jobs-v2/illustrations";
import {
  ApplicationTimeline,
  buildApplicationTimeline,
} from "@/components/jobs-v2/application/ApplicationTimeline";

/**
 * Student — application detail. **A new route.**
 *
 * Eleven fields on `JobApplicationV2` — `internal_shortlisting`, `shortlisted_by_hr`, `drive`,
 * `round_1`-`round_4`, `offered`, `reason_not_shortlisted`, `resume_url` — were fetched on every
 * Applied tab render and shown nowhere. A rejected learner was told "Rejected" and nothing else.
 * This screen is where they finally land.
 *
 * There is no per-application GET endpoint and section 10.5 keeps the services read-only, so we
 * use `getMyApplications()` — the one that exists — and find the row. That also means "this
 * application is not yours / no longer exists" is a real, honest branch rather than a 404 page.
 */
export default function ApplicationDetailPage() {
  const params = useParams();
  const { t } = useTranslation("common");
  const router = useRouter();
  const seq = useSeq();

  const rawId = Number(params?.id);
  const id = Number.isFinite(rawId) && rawId > 0 ? rawId : null;

  const [application, setApplication] = useState<JobApplicationV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    const token = seq.next();
    setLoading(true);
    setLoadError(null);
    try {
      const res = await jobsV2Service.getMyApplications();
      if (!seq.isCurrent(token)) return;
      const found = res.results.find((a) => a.id === id) ?? null;
      setApplication(found);
      setNotFound(!found);
    } catch (err) {
      if (!seq.isCurrent(token)) return;
      // Never `setApplication(null)` on a failure: "this application no longer exists" is a
      // very different sentence from "we could not reach the server".
      setLoadError((err as Error)?.message ?? t("jobsV2.error.applicationsTitle"));
    } finally {
      if (seq.isCurrent(token)) setLoading(false);
    }
  }, [id, seq, t]);

  useEffect(() => {
    load();
  }, [load]);

  const timeline = useMemo(
    () => (application ? buildApplicationTimeline(application, t as (k: string, o?: object) => string) : []),
    [application, t],
  );

  const chrome = (children: React.ReactNode) => (
    <PageShell>
      <JobsScope surface="student">{children}</JobsScope>
    </PageShell>
  );

  const eyebrow = t("jobsV2.application.eyebrow", { defaultValue: "Application" });

  /* ---- loading -------------------------------------------------------- */
  if (loading && !application) {
    return chrome(
      <>
        <ModulePageHeader
          eyebrow={eyebrow}
          title={t("jobsV2.loading.applications")}
          accent="azure"
          icon="mdi:timeline-check-outline"
        />
        <JobDetailSkeleton />
      </>,
    );
  }

  /* ---- error ---------------------------------------------------------- */
  if (loadError) {
    return chrome(
      <>
        <ModulePageHeader
          eyebrow={eyebrow}
          title={t("jobsV2.error.applicationsTitle")}
          accent="azure"
          icon="mdi:timeline-check-outline"
        />
        <ErrorState
          variant="page"
          title={t("jobsV2.error.applicationsTitle")}
          error={loadError}
          onRetry={load}
          busy={loading}
          secondaryAction={
            <JButton variant="ghost" href="/jobs-v2?tab=applied" startIcon="mdi:arrow-left">
              {t("jobsV2.application.backToApplications", { defaultValue: "Back to applications" })}
            </JButton>
          }
        />
      </>,
    );
  }

  /* ---- not found (its own branch, never an error) --------------------- */
  if (notFound || !application) {
    return chrome(
      <>
        <ModulePageHeader
          eyebrow={eyebrow}
          title={t("jobsV2.application.goneTitle", { defaultValue: "This application no longer exists" })}
          accent="azure"
          icon="mdi:timeline-check-outline"
        />
        <EmptyState
          variant="page"
          illustration={<ApplicationsIllustration width={168} height={132} />}
          title={t("jobsV2.application.goneTitle", { defaultValue: "This application no longer exists" })}
          body={t("jobsV2.application.goneBody", {
            defaultValue: "It may have been withdrawn, or the link belongs to a different account.",
          })}
          primaryAction={
            <JButton variant="primary" tone="azure" href="/jobs-v2?tab=applied" startIcon="mdi:format-list-checks">
              {t("jobsV2.application.backToApplications", { defaultValue: "Back to applications" })}
            </JButton>
          }
        />
      </>,
    );
  }

  /* ---- the page -------------------------------------------------------- */
  const meta: MetaItem[] = [
    {
      key: "appliedAt",
      icon: "mdi:calendar-check-outline",
      label: t("jobsV2.application.appliedAt", {
        defaultValue: "Applied {{date}}",
        date: formatDate(application.applied_at, { withTime: true }),
      }),
    },
    {
      key: "updatedAt",
      icon: "mdi:update",
      label: t("jobsV2.application.updatedAt", {
        defaultValue: "Updated {{date}}",
        date: formatDate(application.updated_at, { withTime: true }),
      }),
    },
    {
      key: "reference",
      icon: "mdi:pound",
      label: (
        <Box component="span" sx={{ fontFamily: "var(--font-mono)", fontFeatureSettings: '"tnum" 1' }}>
          {application.id}
        </Box>
      ),
    },
  ];

  const rejected = application.status === "rejected";
  const reason = application.reason_not_shortlisted?.trim();

  return chrome(
    <>
      <ModulePageHeader
        eyebrow={eyebrow}
        title={application.job_title}
        description={application.company_name}
        accent="azure"
        icon="mdi:timeline-check-outline"
        action={
          <HeaderActionButton
            variant="ghost"
            icon="mdi:briefcase-outline"
            onClick={() => router.push(`/jobs-v2/${application.job}`)}
          >
            {t("jobsV2.application.viewJob", { defaultValue: "View job" })}
          </HeaderActionButton>
        }
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <StatusPill kind="application" value={application.status} />
          <MetaRow items={meta} onDark dense unordered />
        </Box>
      </ModulePageHeader>

      {/* ---- the timeline: the primary content ------------------------- */}
      <SectionHeader
        icon="mdi:timeline-outline"
        title={t("jobsV2.application.progress", { defaultValue: "Where your application stands" })}
        description={t("jobsV2.application.progressHint", {
          defaultValue: "Only the stages the employer has recorded appear here.",
        })}
      />
      <JCard sx={{ mb: 3 }}>
        <ApplicationTimeline nodes={timeline} />
      </JCard>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" },
          gap: { xs: 2, md: 3 },
          alignItems: "start",
        }}
      >
        {/* ---- what you sent ------------------------------------------- */}
        <Box sx={{ minWidth: 0 }}>
          <SectionHeader
            icon="mdi:file-document-outline"
            title={t("jobsV2.application.submission", { defaultValue: "Your submission" })}
            level="sub"
          />
          <JCard>
            {application.resume_url ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                <Box
                  aria-hidden
                  sx={{
                    width: 40,
                    height: 48,
                    flexShrink: 0,
                    borderRadius: R.ctl,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: J.surface2,
                    border: `1px solid ${J.hairline}`,
                    color: J.ink3,
                  }}
                >
                  <IconWrapper icon="mdi:file-pdf-box" size={22} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ ...TYPE.label, mb: 0.25 }}>
                    {t("jobsV2.application.resumeSent", { defaultValue: "The resume you sent" })}
                  </Typography>
                  <Typography sx={TYPE.bodyStrong}>
                    {t("jobsV2.success.resume", { defaultValue: "Your resume" })}
                  </Typography>
                </Box>
                <JButton
                  variant="secondary"
                  size="sm"
                  href={application.resume_url}
                  external
                  startIcon="mdi:open-in-new"
                >
                  {t("jobsV2.application.openResume", { defaultValue: "Open" })}
                </JButton>
              </Box>
            ) : (
              <Typography sx={TYPE.body}>
                {t("jobsV2.application.noResume", {
                  defaultValue: "This application was recorded without a resume on file.",
                })}
              </Typography>
            )}
          </JCard>
        </Box>

        {/* ---- the outcome --------------------------------------------- */}
        <Box sx={{ minWidth: 0 }}>
          <SectionHeader
            icon="mdi:message-alert-outline"
            title={t("jobsV2.application.outcome", { defaultValue: "Outcome" })}
            level="sub"
          />
          <JCard>
            {reason ? (
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Box
                  aria-hidden
                  sx={{
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    borderRadius: R.ctl,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: rejected ? J.dangerBg : J.surface2,
                    color: rejected ? J.dangerFg : J.ink3,
                    border: `1px solid ${rejected ? J.dangerBd : J.hairline}`,
                  }}
                >
                  <IconWrapper icon="mdi:information-outline" size={20} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ ...TYPE.label, mb: 0.5 }}>
                    {t("jobsV2.application.reason", { defaultValue: "What the employer said" })}
                  </Typography>
                  {/* A rejection with a reason is the single most valuable thing this module
                      can show a learner, and it was already in memory on every render. */}
                  <Typography sx={{ ...TYPE.body, whiteSpace: "pre-wrap", color: J.ink }}>{reason}</Typography>
                </Box>
              </Box>
            ) : (
              <Typography sx={TYPE.body}>
                {rejected
                  ? t("jobsV2.application.noReason", {
                      defaultValue: "The employer did not record a reason for this decision.",
                    })
                  : t("jobsV2.application.stillOpen", {
                      defaultValue: "Nothing final yet. Any update from the employer appears on the timeline above.",
                    })}
              </Typography>
            )}
          </JCard>
        </Box>
      </Box>

      <Box sx={{ mt: 3 }}>
        <JButton variant="ghost" href="/jobs-v2?tab=applied" startIcon="mdi:arrow-left">
          {t("jobsV2.application.backToApplications", { defaultValue: "Back to applications" })}
        </JButton>
      </Box>
    </>,
  );
}
