"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { jobsV2Service, type JobV2 } from "@/lib/services/jobs-v2.service";
import { useSeq } from "@/lib/jobs-v2/useSeq";
import { resolveAppStatus } from "@/lib/jobs-v2/status";
import { JobsScope, ApplyStepSkeleton, ErrorState, JButton } from "@/components/jobs-v2/ui";
import { ApplyGate, appliedOnLabel } from "@/components/jobs-v2/apply/ApplyGate";
import { ApplyFlow, type ApplySubmitPayload, type ApplySubmitResult } from "@/components/jobs-v2/apply/ApplyFlow";
import { ApplySuccess } from "@/components/jobs-v2/apply/ApplySuccess";
import { ApplyDialogs } from "@/components/jobs-v2/detail/ApplyCta";
import { useApply, useApplicationForJob } from "@/components/jobs-v2/detail/useApply";

/**
 * Student — the apply route.
 *
 * The five bare-text early returns are one `ApplyGate` with five typed variants, each inside the
 * standard chrome; the five inline copies of the `MainLayout` + `Box minHeight` +
 * `maxWidth: 1100` + `py: 8` wrapper collapse into this one file.
 *
 * **Success is a screen, not a toast.** The shipped route fired a toast and immediately pushed
 * back to the job — and the form ALSO called `onCancel()`, so the same navigation happened
 * twice. The route owns navigation now, and a successful submit renders `ApplySuccess` with the
 * reference number, what was sent, and somewhere to go next.
 *
 * The success screen reuses the job this route already fetched, so nothing is re-requested for a
 * job the detail page loaded one click earlier.
 */
export default function ApplyJobRoutePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation("common");
  const seq = useSeq();

  const rawId = Number(params?.id);
  const id = Number.isFinite(rawId) && rawId > 0 ? rawId : null;

  const [job, setJob] = useState<JobV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [submitted, setSubmitted] = useState<{
    applicationId: number | null;
    resumeName: string | null;
    answeredCount: number;
  } | null>(null);

  const fetchJob = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    const token = seq.next();
    setLoading(true);
    setLoadError(null);
    try {
      const data = await jobsV2Service.getJobById(id);
      if (!seq.isCurrent(token)) return;
      setNotFound(!data);
      setJob(data ?? null);
    } catch (err) {
      if (!seq.isCurrent(token)) return;
      // A fetch FAILURE is a separate branch from "this role is no longer listed".
      setLoadError((err as Error)?.message ?? t("jobsV2.error.jobTitle"));
    } finally {
      if (seq.isCurrent(token)) setLoading(false);
    }
  }, [id, seq, t]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const apply = useApply(job, { onChanged: fetchJob });
  const applicationLink = useApplicationForJob(id, Boolean(job?.has_applied));

  const handleSubmit = useCallback(
    async (payload: ApplySubmitPayload, result: ApplySubmitResult) => {
      if (!job) return;
      const res = await jobsV2Service.applyForJob(job.id, payload);
      setSubmitted({
        applicationId: typeof res?.id === "number" ? res.id : null,
        resumeName: result.resumeName,
        answeredCount: result.answeredCount,
      });
    },
    [job],
  );

  // The route owns navigation. `ApplyFlow` never pushes, so Cancel cannot fire twice.
  const handleCancel = useCallback(() => {
    router.push(job ? `/jobs-v2/${job.id}` : "/jobs-v2");
  }, [job, router]);

  const chrome = (children: React.ReactNode) => (
    <PageShell>
      <JobsScope surface="student">{children}</JobsScope>
    </PageShell>
  );

  /* ---- loading -------------------------------------------------------- */
  if (loading && !job) {
    return chrome(
      <>
        <ModulePageHeader
          eyebrow={t("jobsV2.apply.eyebrow", { defaultValue: "Apply" })}
          title={t("jobsV2.loading.apply")}
          accent="azure"
          icon="mdi:send-outline"
        />
        <ApplyStepSkeleton />
      </>,
    );
  }

  /* ---- error ---------------------------------------------------------- */
  if (loadError) {
    return chrome(
      <>
        <ModulePageHeader
          eyebrow={t("jobsV2.apply.eyebrow", { defaultValue: "Apply" })}
          title={t("jobsV2.error.jobTitle")}
          accent="azure"
          icon="mdi:send-outline"
        />
        <ErrorState
          variant="page"
          title={t("jobsV2.error.jobTitle")}
          error={loadError}
          onRetry={fetchJob}
          busy={loading}
          secondaryAction={
            <JButton variant="ghost" href="/jobs-v2" startIcon="mdi:arrow-left">
              {t("jobsV2.backToJobs")}
            </JButton>
          }
        />
      </>,
    );
  }

  /* ---- not found ------------------------------------------------------ */
  if (notFound || !job) {
    return chrome(<ApplyGate variant="notFound" job={null} />);
  }

  /* ---- success -------------------------------------------------------- */
  if (submitted) {
    return chrome(
      <ApplySuccess
        job={job}
        applicationId={submitted.applicationId}
        resumeName={submitted.resumeName}
        answeredCount={submitted.answeredCount}
      />,
    );
  }

  /* ---- the five gates, in the order the API resolves them -------------- */
  if (job.has_applied) {
    const application = applicationLink.application;
    return chrome(
      <ApplyGate
        variant="applied"
        job={job}
        appliedHref={applicationLink.href}
        appliedOn={appliedOnLabel(application?.applied_at)}
        appliedStatusLabel={application ? (t(resolveAppStatus(application.status).labelKey) as string) : null}
      />,
    );
  }

  if (job.apply_link?.trim()) {
    return chrome(
      <>
        <ApplyGate variant="external" job={job} apply={apply} />
        <ApplyDialogs apply={apply} />
      </>,
    );
  }

  if (job.status !== "active") {
    return chrome(<ApplyGate variant="closed" job={job} apply={apply} />);
  }

  if (job.eligible_to_apply === false) {
    return chrome(<ApplyGate variant="ineligible" job={job} apply={apply} />);
  }

  /* ---- the flow -------------------------------------------------------- */
  return chrome(
    <>
      <ModulePageHeader
        eyebrow={t("jobsV2.apply.eyebrow", { defaultValue: "Apply" })}
        title={job.job_title}
        description={[job.company_name, job.location].filter(Boolean).join(" · ")}
        accent="azure"
        icon="mdi:send-outline"
        action={
          <JButton variant="onDark" href={`/jobs-v2/${job.id}`} startIcon="mdi:arrow-left">
            {t("jobsV2.gate.backToJob", { defaultValue: "Back to the job" })}
          </JButton>
        }
      />
      <ApplyFlow
        jobId={job.id}
        jobTitle={job.job_title}
        companyName={job.company_name}
        questions={job.questions}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </>,
  );
}
