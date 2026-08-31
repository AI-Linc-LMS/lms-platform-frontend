"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { useToast } from "@/components/common/Toast";
import { JobForm, type JobFormSubmitOptions } from "@/components/admin/jobs-v2/form/JobForm";
import {
  adminJobsV2Service,
  type JobCreateUpdatePayload,
} from "@/lib/services/admin/admin-jobs-v2.service";
import { adminCoursesService } from "@/lib/services/admin/admin-courses.service";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { config } from "@/lib/config";
import {
  EmptyState,
  ErrorState,
  FormSkeleton,
  JButton,
  JobsScope,
} from "@/components/jobs-v2/ui";

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const { t } = useTranslation("common");
  const raw = params?.id;
  const jobId = Number(Array.isArray(raw) ? raw[0] : raw);

  const [job, setJob] = useState<JobV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [courses, setCourses] = useState<Array<{ id: number; title?: string; name?: string }>>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const loadJob = useCallback(async () => {
    if (!jobId || Number.isNaN(jobId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    setNotFound(false);
    try {
      setJob(await adminJobsV2Service.getJob(jobId, config.clientId));
    } catch (err) {
      const message = (err as Error)?.message ?? (t("jobsV2.error.body") as string);
      if (/not found|does not exist|404/i.test(message)) setNotFound(true);
      else setLoadError(message);
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [jobId, t]);

  /** Courses are needed on step 4 only, so this never gates the form. */
  const loadCourses = useCallback(async () => {
    setCoursesLoading(true);
    setCoursesError(null);
    try {
      const data = await adminCoursesService.getCourses({ limit: 1000 });
      const list = Array.isArray(data) ? data : (data.results || data.data || []);
      setCourses(list);
    } catch (err) {
      setCoursesError((err as Error)?.message ?? (t("jobsV2.error.body") as string));
    } finally {
      setCoursesLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadJob();
  }, [loadJob]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const handleSubmit = useCallback(
    async (payload: JobCreateUpdatePayload, options?: JobFormSubmitOptions) => {
      if (!job) return;
      await adminJobsV2Service.updateJob(job.id, payload, config.clientId);
      if (options?.jdFile) {
        try {
          await adminJobsV2Service.uploadJobJd(job.id, options.jdFile, config.clientId);
        } catch (err) {
          // The job saved. Say exactly that, and do not report a total failure.
          showToast(
            t("jobsV2.edit.savedJdFailed", "The job was saved; the JD upload failed: {{reason}}", {
              reason: (err as Error)?.message ?? "",
            }) as string,
            "error",
          );
          router.push(`/admin/jobs-v2/${job.id}`);
          return;
        }
      }
      showToast(t("jobsV2.edit.saved", "Job updated") as string, "success");
      // Back to the RECORD, not the list: a small correction must not eject the admin from
      // the job they were working on.
      router.push(`/admin/jobs-v2/${job.id}`);
    },
    [job, router, showToast, t],
  );

  const handleCancel = useCallback(() => {
    router.push(jobId && !Number.isNaN(jobId) ? `/admin/jobs-v2/${jobId}` : "/admin/jobs-v2");
  }, [jobId, router]);

  const header = useMemo(
    () => (
      <ModulePageHeader
        eyebrow="02 · ENGAGEMENT"
        title={t("jobsV2.edit.title", "Edit job")}
        description={
          job
            ? [job.job_title, job.company_name, job.location].filter(Boolean).join(" · ")
            : undefined
        }
        accent="azure"
        icon="mdi:briefcase-edit-outline"
        action={
          job ? (
            <HeaderActionButton
              variant="ghost"
              icon="mdi:account-group"
              onClick={() => router.push(`/admin/jobs-v2/${job.id}/applications`)}
            >
              {t("jobsV2.edit.viewApplications", "View applications")}
            </HeaderActionButton>
          ) : undefined
        }
      />
    ),
    [job, router, t],
  );

  if (loading) {
    return (
      <PageShell>
        <JobsScope surface="admin">
          {header}
          <FormSkeleton sections={2} fields={5} />
        </JobsScope>
      </PageShell>
    );
  }

  if (notFound) {
    return (
      <PageShell>
        <JobsScope surface="admin">
          {header}
          <EmptyState
            variant="page"
            icon="mdi:briefcase-off-outline"
            title={t("jobsV2.detail.notFoundTitle", "Job not found")}
            body={t(
              "jobsV2.detail.notFoundBody",
              "It may have been deleted, or it belongs to another account.",
            )}
            primaryAction={
              <JButton variant="primary" href="/admin/jobs-v2" startIcon="mdi:arrow-left">
                {t("jobsV2.admin.backToJobs", "Back to jobs")}
              </JButton>
            }
          />
        </JobsScope>
      </PageShell>
    );
  }

  if (loadError || !job) {
    return (
      <PageShell>
        <JobsScope surface="admin">
          {header}
          <ErrorState
            variant="page"
            error={loadError}
            title={t("jobsV2.error.jobTitle")}
            onRetry={() => void loadJob()}
            secondaryAction={
              <JButton variant="secondary" href="/admin/jobs-v2">
                {t("jobsV2.admin.backToJobs", "Back to jobs")}
              </JButton>
            }
          />
        </JobsScope>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <JobsScope surface="admin">
        {header}
        <JobForm
          mode="edit"
          initialKey={`job:${job.id}:${job.created_at ?? ""}`}
          initialData={job}
          draftId={`job-${job.id}`}
          courses={courses}
          coursesLoading={coursesLoading}
          coursesError={coursesError}
          onRetryCourses={() => void loadCourses()}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          saveLabel={t("jobsV2.edit.save", "Save changes")}
        />
      </JobsScope>
    </PageShell>
  );
}
