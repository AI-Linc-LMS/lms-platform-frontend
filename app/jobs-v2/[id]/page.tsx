"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { useToast } from "@/components/common/Toast";
import { useAdminMode } from "@/lib/contexts/AdminModeContext";
import { jobsV2Service, type JobV2 } from "@/lib/services/jobs-v2.service";
import { useSeq } from "@/lib/jobs-v2/useSeq";
import {
  JobsScope,
  JobsSplitLayout,
  HeroSkeleton,
  JobDetailSkeleton,
  JobListSkeleton,
  EmptyState,
  ErrorState,
  JButton,
} from "@/components/jobs-v2/ui";
import { JobsDetailRail } from "@/components/jobs-v2/board/JobBoard";
import { EmptyJobsIllustration } from "@/components/jobs-v2/illustrations";
import { JobDetailView } from "@/components/jobs-v2/detail/JobDetailView";
import { ApplyDialogs } from "@/components/jobs-v2/detail/ApplyCta";
import { useApply, useApplicationForJob } from "@/components/jobs-v2/detail/useApply";

/**
 * Student — job detail.
 *
 * The three things this route got wrong, all fixed here:
 *
 * 1. **`if (loading || !job)` conflated four states.** A 500, a 404, a still-loading page and a
 *    deleted job all rendered "Job not found — this job may have been removed", which blames
 *    the learner for a server fault. Loading, not-found and error are three separate branches
 *    now, and the catch sets `loadError` — it never sets `setJob(null)` and calls that an empty
 *    result (section 10.8).
 * 2. **The chrome vanished.** The hand-rolled `linear-gradient(135deg, #f8fafc, ...)` hero was
 *    three hardcoded slate hexes that stayed light under every tenant palette while
 *    `--font-primary` moved. It is `ModulePageHeader accent="azure"` now, the same hero the
 *    board and the apply flow wear, so the dark hero no longer disappears mid-flow.
 * 3. **Three apply CTAs, two behaviours, and two of them recorded nothing.** One `useApply`,
 *    one `ApplyCta`, three placements.
 *
 * **The split.** At `lg+` this route is `JobsSplitLayout`: the result rail on the left, the
 * posting in the pane. It is a REAL route rather than LinkedIn's `?currentJobId=`, because we
 * email students their assigned jobs and those links have to stay shareable, bookmarkable and
 * land correctly. Below `lg` the split collapses to a plain block, the rail is `display: none`
 * and this is the full-width posting page it has always been — one render tree, no
 * `useMediaQuery` in the layout, and the tour ids present at every breakpoint.
 */
export default function JobDetailPage() {
  const params = useParams();
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const { isAdminMode } = useAdminMode();
  const seq = useSeq();

  const rawId = Number(params?.id);
  const id = Number.isFinite(rawId) && rawId > 0 ? rawId : null;

  const [job, setJob] = useState<JobV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);

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
      // The service resolves `null` for a job that is not there. That is NOT a failure.
      setNotFound(!data);
      setJob(data ?? null);
    } catch (err) {
      if (!seq.isCurrent(token)) return;
      // Never `setJob(null)` here: an empty state would tell the learner the role was removed.
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

  /** Optimistic toggle with rollback — behaviour preserved exactly. */
  const handleFavorite = useCallback(async () => {
    if (!job || favoriteBusy) return;
    setFavoriteBusy(true);
    const prev = job.is_favourited ?? false;
    setJob((j) => (j ? { ...j, is_favourited: !prev } : j));
    try {
      const res = await jobsV2Service.toggleFavorite(job.id);
      setJob((j) => (j ? { ...j, is_favourited: res.favorited } : j));
      if (res.message) showToast(res.message, "info");
    } catch (err) {
      setJob((j) => (j ? { ...j, is_favourited: prev } : j));
      showToast(
        (err as Error)?.message ?? t("jobsV2.detail.favoriteFailed", { defaultValue: "Failed to update saved jobs" }),
        "error",
      );
    } finally {
      setFavoriteBusy(false);
    }
  }, [job, favoriteBusy, showToast, t]);

  /* ---- loading -------------------------------------------------------
     The SAME shell the posting mounts into, so the shimmer-to-content swap is a crossfade
     rather than two unrelated loading designs in sequence. The hero skeleton is `lg`-scoped for
     the same reason the real hero is: at `lg+` the pane's own bar carries the identity. */
  if (loading && !job) {
    return (
      <PageShell>
        <JobsScope surface="student">
          <JobsSplitLayout
            showBelowLg="pane"
            railLabel={t("jobsV2.board.railLabel", { defaultValue: "Job results" }) as string}
            paneLabel={t("jobsV2.board.paneLabel", { defaultValue: "Job posting" }) as string}
            rail={<JobListSkeleton count={6} view="rail" />}
            pane={
              <>
                <Box sx={{ display: { xs: "block", lg: "none" } }}>
                  <HeroSkeleton />
                </Box>
                <JobDetailSkeleton />
              </>
            }
            sx={{ "--j-split-top": "88px" }}
          />
        </JobsScope>
      </PageShell>
    );
  }

  /* ---- error (a separate branch from not-found) ----------------------- */
  if (loadError) {
    return (
      <PageShell>
        <JobsScope surface="student">
          <ModulePageHeader
            eyebrow={t("jobsV2.detail.eyebrow", { defaultValue: "Role" })}
            title={t("jobsV2.error.jobTitle")}
            accent="azure"
            icon="mdi:briefcase-outline"
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
        </JobsScope>
      </PageShell>
    );
  }

  /* ---- not found ------------------------------------------------------ */
  if (notFound || !job) {
    return (
      <PageShell>
        <JobsScope surface="student">
          <ModulePageHeader
            eyebrow={t("jobsV2.detail.eyebrow", { defaultValue: "Role" })}
            title={t("jobsV2.detail.goneTitle", { defaultValue: "This role is no longer listed" })}
            accent="azure"
            icon="mdi:briefcase-outline"
          />
          <EmptyState
            variant="page"
            illustration={<EmptyJobsIllustration width={168} height={132} />}
            title={t("jobsV2.detail.goneTitle", { defaultValue: "This role is no longer listed" })}
            body={t("jobsV2.detail.goneBody", {
              defaultValue: "The employer closed it, or the link is out of date. There are other openings on the board.",
            })}
            primaryAction={
              <JButton variant="primary" tone="azure" href="/jobs-v2" startIcon="mdi:briefcase-search">
                {t("jobsV2.empty.browseJobs")}
              </JButton>
            }
          />
        </JobsScope>
      </PageShell>
    );
  }

  /* ---- the posting ---------------------------------------------------- */
  return (
    <PageShell>
      <JobsScope surface="student">
        <JobsSplitLayout
          showBelowLg="pane"
          railLabel={t("jobsV2.board.railLabel", { defaultValue: "Job results" }) as string}
          paneLabel={t("jobsV2.board.paneLabel", { defaultValue: "Job posting" }) as string}
          /* The Suspense boundary wraps the RAIL alone, not the split: `JobsDetailRail` reads
             `useSearchParams` (the board's filter state rides on this route's query, which is
             what makes "Back to jobs" land on page 4 of the filtered search), and suspending the
             whole split would blank the posting the student came here to read. */
          rail={
            <Suspense fallback={<JobListSkeleton count={6} view="rail" />}>
              <JobsDetailRail selectedId={job.id} />
            </Suspense>
          }
          pane={
            <JobDetailView
              job={job}
              apply={apply}
              appliedHref={applicationLink.href}
              showFavorite={!isAdminMode}
              favoriteBusy={favoriteBusy}
              onToggleFavorite={handleFavorite}
            />
          }
          /* `--j-split-top` is everything the split must clear. On the board that is the app bar,
             the header and the sticky filter rail; this route carries none of those above the
             split, so it overrides the variable on its own wrapper rather than letting a
             component hardcode a height — which is exactly what the token's note in
             `globals.css` asks a route to do. */
          sx={{ "--j-split-top": "88px" }}
        />
        <ApplyDialogs apply={apply} />
      </JobsScope>
    </PageShell>
  );
}
