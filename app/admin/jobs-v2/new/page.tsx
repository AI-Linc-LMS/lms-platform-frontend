"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Button, Typography, CircularProgress, Paper, Chip } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { JobCreateEditPage } from "@/components/admin/jobs-v2/JobCreateEditPage";
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
): T[] => {
  const wanted = new Set(suggestedTitles.map((t) => t.trim().toLowerCase()).filter(Boolean));
  if (wanted.size === 0) return [];
  return options.filter((o) => {
    const title = (o.title ?? o.name ?? "").trim().toLowerCase();
    return title.length > 0 && wanted.has(title);
  });
};

function NewJobPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const scrapedJobIdParam = searchParams?.get("scraped_job_id") ?? null;
  const scrapedJobId =
    scrapedJobIdParam && /^\d+$/.test(scrapedJobIdParam) ? Number(scrapedJobIdParam) : null;

  const [courses, setCourses] = useState<Array<{ id: number; title?: string; name?: string }>>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [scrapedJob, setScrapedJob] = useState<ScrapedJobDetail | null>(null);
  // Adaptive options fetched here only to pre-match suggested titles; the form loads its own picker options.
  const [adaptiveCourses, setAdaptiveCourses] = useState<Array<{ id: number; title: string }>>([]);
  const [loadingScraped, setLoadingScraped] = useState(Boolean(scrapedJobId));

  const loadCourses = useCallback(async () => {
    try {
      const data = await adminCoursesService.getCourses({ limit: 1000 });
      const list = Array.isArray(data) ? data : (data.results || data.data || []);
      setCourses(list);
    } catch {
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  const loadScraped = useCallback(async () => {
    if (!scrapedJobId) {
      setLoadingScraped(false);
      return;
    }
    try {
      setLoadingScraped(true);
      const [detail, adaptiveList] = await Promise.all([
        adminScrapedJobsService.getScrapedJob(scrapedJobId, config.clientId),
        adminAdaptiveCourseService.listCourses().catch(() => []),
      ]);
      setScrapedJob(detail);
      // Same is_published filter as the form's own adaptive picker, so every
      // pre-selected id resolves to a visible chip.
      setAdaptiveCourses(
        adaptiveList.filter((c) => c.is_published).map((c) => ({ id: c.id, title: c.title }))
      );
    } catch (err) {
      showToast(
        (err as Error)?.message ?? "Failed to load the scraped job - starting with a blank form",
        "error"
      );
      setScrapedJob(null);
    } finally {
      setLoadingScraped(false);
    }
  }, [scrapedJobId, showToast]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    loadScraped();
  }, [loadScraped]);

  // Prefill shaped like the edit page's initialData so the form's one hydration path serves both.
  const initialData = useMemo<Partial<JobV2> | null>(() => {
    if (!scrapedJob) return null;
    const matchedCourses = matchCoursesByTitle(courses, scrapedJob.suggested_course_titles ?? []);
    const matchedAdaptive = matchCoursesByTitle(
      adaptiveCourses,
      scrapedJob.suggested_course_titles ?? []
    );
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
      apply_link: scrapedJob.apply_url ?? "",
      courses: matchedCourses.map((c) => ({ id: c.id, title: c.title ?? c.name ?? "" })),
      adaptive_courses: matchedAdaptive.map((c) => ({ id: c.id, title: c.title })),
    };
  }, [scrapedJob, courses, adaptiveCourses]);

  const handleSubmit = useCallback(
    async (
      payload: JobCreateUpdatePayload | Partial<JobCreateUpdatePayload>,
      options?: { jdFile?: File }
    ) => {
      if (!payload.job_title || !payload.company_name) return;
      try {
        const createPayload: JobCreateUpdatePayload = {
          ...(payload as JobCreateUpdatePayload),
          ...(scrapedJob ? { scraped_job_id: scrapedJob.id } : {}),
        };
        const job = await adminJobsV2Service.createJob(createPayload, config.clientId);
        if (options?.jdFile) {
          await adminJobsV2Service.uploadJobJd(job.id, options.jdFile, config.clientId);
        }
        showToast("Job created successfully", "success");
        // Must match handleCancel's destination - the form calls onCancel after onSubmit.
        router.push(scrapedJob ? "/admin/jobs-v2/scraped" : "/admin/jobs-v2");
      } catch (err) {
        throw err;
      }
    },
    [router, showToast, scrapedJob]
  );

  const handleCancel = useCallback(() => {
    router.push(scrapedJob ? "/admin/jobs-v2/scraped" : "/admin/jobs-v2");
  }, [router, scrapedJob]);

  if (loadingCourses || loadingScraped) {
    return (
      <MainLayout>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 400,
            gap: 2,
          }}
        >
          <CircularProgress sx={{ color: "var(--accent-indigo)" }} />
          <Typography color="text.secondary">Loading...</Typography>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Button
          startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
          onClick={handleCancel}
          sx={{
            mb: 2,
            textTransform: "none",
            fontWeight: 500,
            color: "var(--font-secondary)",
            "&:hover": { backgroundColor: "color-mix(in srgb, var(--font-primary) 6%, transparent)" },
          }}
        >
          {scrapedJob ? "Back to Scraped Jobs" : "Back to Jobs"}
        </Button>
        {scrapedJob && (
          <Paper
            elevation={0}
            sx={{
              mb: 2,
              p: 2,
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "color-mix(in srgb, var(--accent-indigo) 30%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)",
            }}
          >
            <IconWrapper icon="mdi:radar" size={20} style={{ color: "var(--accent-indigo)" }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
              Prefilled from scraped job — review before publishing
            </Typography>
            <Chip
              label={`${scrapedJob.company_name} · ${scrapedJob.source_name || scrapedJob.source_kind}`}
              size="small"
              sx={{
                height: 24,
                fontSize: "0.7rem",
                fontWeight: 600,
                backgroundColor: "color-mix(in srgb, var(--accent-indigo) 14%, transparent)",
                color: "var(--accent-indigo)",
              }}
            />
          </Paper>
        )}
        <JobCreateEditPage
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          title="Create Job"
          initialData={initialData}
          courses={courses}
        />
      </Box>
    </MainLayout>
  );
}

/**
 * `useSearchParams` opts a route into client-side rendering, and Next fails the
 * BUILD, not the typecheck, if it is not inside a Suspense boundary.
 */
export default function NewJobPage() {
  return (
    <Suspense fallback={null}>
      <NewJobPageInner />
    </Suspense>
  );
}
