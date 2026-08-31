"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box } from "@mui/material";
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
import { adminAdaptiveCourseService } from "@/lib/services/admin/admin-adaptive-course.service";
import {
  adminScrapedJobsService,
  type ScrapedJobDetail,
} from "@/lib/services/admin/admin-scraped-jobs.service";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { config } from "@/lib/config";
import {
  ErrorState,
  FormSkeleton,
  JCard,
  JConfirm,
  JobsScope,
  StatusPill,
  TYPE,
} from "@/components/jobs-v2/ui";

/** Employment types the form's Select knows - anything else would render as a blank Select. */
const EMPLOYMENT_TYPE_OPTIONS = ["Full-time", "Part-time", "Internship", "Contract"];

const normalizeEmploymentType = (value: string | null): string => {
  if (!value) return "";
  const match = EMPLOYMENT_TYPE_OPTIONS.find(
    (o) => o.toLowerCase() === value.trim().toLowerCase()
  );
  return match ?? "";
};

/** Matches option titles (title or name) against suggested course titles, case-insensitively. */
const matchCoursesByTitle = <T extends { id: number; title?: string; name?: string }>(
  options: T[],
  suggestedTitles: string[]
): { matched: T[]; unmatched: string[] } => {
  const wanted = suggestedTitles.map((s) => s.trim()).filter(Boolean);
  if (wanted.length === 0) return { matched: [], unmatched: [] };
  const byTitle = new Map(
    options.map((o) => [(o.title ?? o.name ?? "").trim().toLowerCase(), o] as const)
  );
  const matched: T[] = [];
  const unmatched: string[] = [];
  for (const title of wanted) {
    const hit = byTitle.get(title.toLowerCase());
    if (hit && !matched.includes(hit)) matched.push(hit);
    else if (!hit) unmatched.push(title);
  }
  return { matched, unmatched };
};

function NewJobPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { t } = useTranslation("common");

  const scrapedJobIdParam = searchParams?.get("scraped_job_id") ?? null;
  const scrapedJobId =
    scrapedJobIdParam && /^\d+$/.test(scrapedJobIdParam) ? Number(scrapedJobIdParam) : null;

  const [courses, setCourses] = useState<Array<{ id: number; title?: string; name?: string }>>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const [scrapedJob, setScrapedJob] = useState<ScrapedJobDetail | null>(null);
  const [scrapedError, setScrapedError] = useState<string | null>(null);
  const [loadingScraped, setLoadingScraped] = useState(Boolean(scrapedJobId));
  // Adaptive options are fetched here only to pre-match suggested titles; the form loads its
  // own picker options.
  const [adaptiveCourses, setAdaptiveCourses] = useState<Array<{ id: number; title: string }>>([]);
  // A failed adaptive fetch must not be reported to the admin as "nothing matched".
  const [adaptivePrefillFailed, setAdaptivePrefillFailed] = useState(false);

  /** A JD upload that failed AFTER the job was created. One navigation, and a real retry. */
  const [jdFailure, setJdFailure] = useState<{ jobId: number; file: File } | null>(null);
  const [retryingJd, setRetryingJd] = useState(false);

  const loadCourses = useCallback(async () => {
    setCoursesLoading(true);
    setCoursesError(null);
    try {
      const data = await adminCoursesService.getCourses({ limit: 1000 });
      const list = Array.isArray(data) ? data : (data.results || data.data || []);
      setCourses(list);
    } catch (err) {
      // Never `catch { setCourses([]) }`: a swallowed failure became a silently empty picker.
      setCoursesError((err as Error)?.message ?? (t("jobsV2.error.body") as string));
    } finally {
      setCoursesLoading(false);
    }
  }, [t]);

  const loadScraped = useCallback(async () => {
    if (!scrapedJobId) {
      setLoadingScraped(false);
      return;
    }
    setLoadingScraped(true);
    setScrapedError(null);
    setAdaptivePrefillFailed(false);
    let adaptiveFailed = false;
    try {
      const [detail, adaptiveList] = await Promise.all([
        adminScrapedJobsService.getScrapedJob(scrapedJobId, config.clientId),
        // A swallowed [] here is the shape section 10.8 forbids: the prefill would then report
        // "no suggested course matched" when in truth the list never arrived. Record it and say so.
        adminAdaptiveCourseService.listCourses().catch(() => {
          adaptiveFailed = true;
          return [];
        }),
      ]);
      setAdaptivePrefillFailed(adaptiveFailed);
      setScrapedJob(detail);
      // Same is_published filter as the form's own adaptive picker, so every pre-selected id
      // resolves to a visible chip.
      setAdaptiveCourses(
        adaptiveList.filter((c) => c.is_published).map((c) => ({ id: c.id, title: c.title }))
      );
    } catch (err) {
      setScrapedError((err as Error)?.message ?? (t("jobsV2.error.body") as string));
      setScrapedJob(null);
    } finally {
      setLoadingScraped(false);
    }
  }, [scrapedJobId, t]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    void loadScraped();
  }, [loadScraped]);

  const courseMatch = useMemo(
    () => matchCoursesByTitle(courses, scrapedJob?.suggested_course_titles ?? []),
    [courses, scrapedJob]
  );
  const adaptiveMatch = useMemo(
    () => matchCoursesByTitle(adaptiveCourses, scrapedJob?.suggested_course_titles ?? []),
    [adaptiveCourses, scrapedJob]
  );

  // Prefill shaped like the edit page's initialData, so the form's one hydration path serves both.
  const initialData = useMemo<Partial<JobV2> | null>(() => {
    if (!scrapedJob) return null;
    return {
      job_title: scrapedJob.job_title ?? "",
      company_name: scrapedJob.company_name ?? "",
      company_logo: scrapedJob.company_logo ?? "",
      company_info: scrapedJob.company_info ?? "",
      job_description: scrapedJob.job_description ?? "",
      location: scrapedJob.location ?? "",
      salary: scrapedJob.salary ?? "",
      employment_type: normalizeEmploymentType(scrapedJob.employment_type),
      years_of_experience: scrapedJob.years_of_experience ?? "",
      // Tolerant of source phrasing ("Internship", "intern", "Summer Intern", ...).
      job_type: (scrapedJob.job_type ?? "").toLowerCase().includes("intern")
        ? "internship"
        : "job",
      mandatory_skills: scrapedJob.mandatory_skills ?? [],
      key_skills: scrapedJob.key_skills ?? [],
      department: scrapedJob.department ?? "",
      industry_type: scrapedJob.industry_type ?? "",
      role_category: scrapedJob.role_category ?? "",
      education: scrapedJob.education ?? "",
      apply_link: scrapedJob.apply_url ?? "",
      courses: courseMatch.matched.map((c) => ({ id: c.id, title: c.title ?? c.name ?? "" })),
      adaptive_courses: adaptiveMatch.matched.map((c) => ({ id: c.id, title: c.title })),
    };
  }, [adaptiveMatch, courseMatch, scrapedJob]);

  /**
   * A STABLE identity string. Keying the form's reset effect on `initialData` (a fresh object
   * on every render of this memo) is what let the late course fetch wipe typed input.
   */
  const initialKey = useMemo(() => {
    if (!scrapedJobId) return "new";
    if (!scrapedJob) return `new:scraped:${scrapedJobId}:pending`;
    // The matched-course ids are part of the identity: the prefill is only complete once the
    // course list has arrived, and that is the LAST legitimate hydration.
    return [
      "new:scraped",
      scrapedJob.id,
      courseMatch.matched.map((c) => c.id).join("."),
      adaptiveMatch.matched.map((c) => c.id).join("."),
    ].join(":");
  }, [adaptiveMatch, courseMatch, scrapedJob, scrapedJobId]);

  /** Per-field provenance markers, plus what the prefill could not map. */
  const provenance = useMemo<Record<string, string> | undefined>(() => {
    if (!scrapedJob) return undefined;
    const source = scrapedJob.source_name || scrapedJob.source_kind || "the scraper";
    const fields = [
      "job_title",
      "company_name",
      "company_logo",
      "company_info",
      "job_description",
      "location",
      "salary",
      "employment_type",
      "years_of_experience",
      "mandatory_skills",
      "key_skills",
      "department",
      "industry_type",
      "role_category",
      "education",
      "apply_link",
    ];
    return Object.fromEntries(fields.map((field) => [field, source]));
  }, [scrapedJob]);

  const prefillNotices = useMemo(() => {
    if (!scrapedJob) return undefined;
    const notices: string[] = [];
    const unmatched = courseMatch.unmatched.filter((title) =>
      adaptiveMatch.unmatched.includes(title)
    );
    if (unmatched.length > 0) {
      notices.push(
        t(
          "jobsV2.new.unmatchedCourses",
          "{{count}} suggested course(s) could not be matched: {{list}}",
          { count: unmatched.length, list: unmatched.join(", ") }
        )
      );
    }
    if (adaptivePrefillFailed) {
      notices.push(
        t(
          "jobsV2.new.adaptiveListUnavailable",
          "The adaptive course list did not load, so no adaptive course was pre-selected. Pick them on the audience step."
        )
      );
    }
    if (scrapedJob.employment_type && !normalizeEmploymentType(scrapedJob.employment_type)) {
      notices.push(
        t(
          "jobsV2.new.unmatchedEmployment",
          'Employment type "{{value}}" was not recognised — pick one on step 1.',
          { value: scrapedJob.employment_type }
        )
      );
    }
    return notices.length ? notices : undefined;
  }, [adaptiveMatch, adaptivePrefillFailed, courseMatch, scrapedJob, t]);

  const handleSubmit = useCallback(
    async (payload: JobCreateUpdatePayload, options?: JobFormSubmitOptions) => {
      const createPayload: JobCreateUpdatePayload = {
        ...payload,
        ...(scrapedJob ? { scraped_job_id: scrapedJob.id } : {}),
      };
      const job = await adminJobsV2Service.createJob(createPayload, config.clientId);
      if (options?.jdFile) {
        try {
          await adminJobsV2Service.uploadJobJd(job.id, options.jdFile, config.clientId);
        } catch {
          // A partial success is NOT a total failure. The job exists; the JD did not upload.
          // We stay put and offer a real retry with the file still in memory.
          setJdFailure({ jobId: job.id, file: options.jdFile });
          return;
        }
      }
      showToast(t("jobsV2.new.created", "Job created") as string, "success");
      // ONE navigation, to the record the admin just made.
      router.push(`/admin/jobs-v2/${job.id}`);
    },
    [router, scrapedJob, showToast, t]
  );

  const retryJdUpload = useCallback(async () => {
    if (!jdFailure) return;
    setRetryingJd(true);
    try {
      await adminJobsV2Service.uploadJobJd(jdFailure.jobId, jdFailure.file, config.clientId);
      showToast(t("jobsV2.new.jdUploaded", "The JD was uploaded") as string, "success");
      router.push(`/admin/jobs-v2/${jdFailure.jobId}`);
    } catch (err) {
      showToast((err as Error)?.message ?? (t("jobsV2.error.body") as string), "error");
      setRetryingJd(false);
    }
  }, [jdFailure, router, showToast, t]);

  const handleCancel = useCallback(() => {
    router.push(scrapedJob ? "/admin/jobs-v2/scraped" : "/admin/jobs-v2");
  }, [router, scrapedJob]);

  return (
    <PageShell>
      <JobsScope surface="admin">
        <ModulePageHeader
          eyebrow={t("jobsV2.form.eyebrow", "Jobs") as string}
          title={t("jobsV2.new.title", "Create job")}
          description={t(
            "jobsV2.new.description",
            "Four steps: the role, the description, who can apply, and who sees it.",
          )}
          accent="azure"
          icon="mdi:briefcase-plus-outline"
          action={
            <HeaderActionButton variant="ghost" icon="mdi:arrow-left" onClick={handleCancel}>
              {scrapedJob
                ? t("jobsV2.new.backToScraped", "Back to the scraped queue")
                : t("jobsV2.admin.backToJobs", "Back to jobs")}
            </HeaderActionButton>
          }
        />

        {scrapedError && (
          <ErrorState
            variant="panel"
            error={scrapedError}
            title={t("jobsV2.new.scrapedErrorTitle", "We could not load that scraped posting")}
            body={t(
              "jobsV2.new.scrapedErrorBody",
              "You can still create the job by hand, or try loading the prefill again.",
            )}
            onRetry={() => void loadScraped()}
            sx={{ mb: 3 }}
          />
        )}

        {scrapedJob && (
          <JCard accent="azure" sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
              <StatusPill kind="scraped" value="review" size="sm" />
              <Box sx={{ minWidth: 0 }}>
                <Box component="p" sx={{ ...TYPE.h4, m: 0 }}>
                  {t("jobsV2.new.prefilled", "Prefilled from a scraped posting — review before publishing")}
                </Box>
                <Box component="p" sx={{ ...TYPE.micro, m: 0, mt: 0.25 }}>
                  {[scrapedJob.company_name, scrapedJob.source_name || scrapedJob.source_kind]
                    .filter(Boolean)
                    .join(" · ")}
                </Box>
              </Box>
            </Box>
          </JCard>
        )}

        {loadingScraped ? (
          <FormSkeleton sections={2} fields={5} />
        ) : (
          <JobForm
            mode="create"
            initialKey={initialKey}
            initialData={initialData}
            draftId={scrapedJobId ? `new-scraped-${scrapedJobId}` : "new"}
            courses={courses}
            coursesLoading={coursesLoading}
            coursesError={coursesError}
            onRetryCourses={() => void loadCourses()}
            provenance={provenance}
            prefillNotices={prefillNotices}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            saveLabel={t("jobsV2.new.save", "Create job")}
          />
        )}

        <JConfirm
          open={Boolean(jdFailure)}
          icon="mdi:file-alert-outline"
          title={t("jobsV2.new.jdFailedTitle", "The job was created; the JD upload failed")}
          body={t(
            "jobsV2.new.jdFailedBody",
            "Everything else saved. You can retry the upload now, or attach the PDF later from the edit form.",
          )}
          confirmLabel={t("jobsV2.new.retryUpload", "Retry the upload")}
          cancelLabel={t("jobsV2.new.continueWithout", "Continue without it")}
          onConfirm={() => void retryJdUpload()}
          onCancel={() => {
            const id = jdFailure?.jobId;
            setJdFailure(null);
            if (id) router.push(`/admin/jobs-v2/${id}?jd_upload=failed`);
          }}
          busy={retryingJd}
        />
      </JobsScope>
    </PageShell>
  );
}

/**
 * `useSearchParams` opts a route into client-side rendering, and Next fails the BUILD, not the
 * typecheck, if it is not inside a Suspense boundary. The fallback is form-shaped now: it used
 * to be `null`, so a hard load of `/admin/jobs-v2/new?scraped_job_id=...` painted a blank page.
 */
export default function NewJobPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <JobsScope surface="admin">
            <FormSkeleton sections={2} fields={5} />
          </JobsScope>
        </PageShell>
      }
    >
      <NewJobPageInner />
    </Suspense>
  );
}
