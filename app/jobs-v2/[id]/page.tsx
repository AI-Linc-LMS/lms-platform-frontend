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
  HeroSkeleton,
  JobDetailSkeleton,
  EmptyState,
  ErrorState,
  JButton,
} from "@/components/jobs-v2/ui";
import { JobBoard } from "@/components/jobs-v2/board/JobBoard";
import { BoardShellSkeleton } from "@/components/jobs-v2/board/BoardShellSkeleton";
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
          <Suspense fallback={<BoardShellSkeleton />}>
            <JobBoard
              selection={{
                id: rawId,
                pane: (
                  <>
                    <Box sx={{ display: { xs: "block", lg: "none" } }}>
                      <HeroSkeleton />
                    </Box>
                    <JobDetailSkeleton />
                  </>
                ),
              }}
            />
          </Suspense>
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

  /* ---- the posting ----------------------------------------------------
     Rendered INSIDE the board rather than as a split of its own. Opening a job used to swap the
     whole page for a bare split, which took the header, the tabs and the filter bar away -
     "clicking a job lands me on a page where I cannot see the header and filters". The board's
     filter state already rides on this URL, so the list beside the posting is the list the
     learner clicked from, and changing a filter here re-filters it without closing the job. */
  return (
    <PageShell>
      <JobsScope surface="student">
        <Suspense fallback={<BoardShellSkeleton />}>
          <JobBoard
            selection={{
              id: job.id,
              pane: (
                <JobDetailView
                  job={job}
                  apply={apply}
                  appliedHref={applicationLink.href}
                  showFavorite={!isAdminMode}
                  favoriteBusy={favoriteBusy}
                  onToggleFavorite={handleFavorite}
                />
              ),
            }}
          />
        </Suspense>
        <ApplyDialogs apply={apply} />
      </JobsScope>
    </PageShell>
  );
}
