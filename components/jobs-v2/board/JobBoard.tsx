"use client";

import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { formatCount } from "@/lib/jobs-v2/format";
import { ProfileLockBanner, ProfileLockCard } from "@/components/common/ProfileLock";
import { EmptyJobsIllustration } from "@/components/jobs-v2/illustrations";
import {
  ActiveFilters,
  EmptyState,
  ErrorState,
  JButton,
  JPagination,
  JPanel,
  JSelect,
  JTabPanel,
  JTabs,
  JobListSkeleton,
  JobsSplitLayout,
  J,
  TYPE,
  useRailKeys,
} from "@/components/jobs-v2/ui";
import { AppliedPanel } from "./AppliedPanel";
import { BoardFilters } from "./BoardFilters";
import { BoardPane } from "./BoardPane";
import { JobCardV2 } from "./JobCardV2";
import { JobRailCard } from "./JobRailCard";
import { JobRowV2 } from "./JobRowV2";
import { useJobFilters, type BoardTab, type UseJobFiltersResult } from "./useJobFilters";

/**
 * The student job board — Browse, Applied and Saved — as a **search product** rather than a page
 * of cards.
 *
 * At `lg+` it is a split: a 400px result rail beside a pane, divided by one continuous hairline
 * (no gutter, no card gap — that is what makes two columns read as one instrument). The pane is
 * a **real route**, `/jobs-v2/[id]`, because we email students their assigned jobs and those
 * URLs have to stay shareable, bookmarkable and land correctly. LinkedIn's `?currentJobId=` is
 * the wrong half of that; Naukri's separate-page-per-job is the other wrong half.
 *
 * **No auto-selected first job.** `/jobs-v2` shows a purposeful `BoardPane`, never `jobs[0]`.
 * Auto-select fabricates a choice the student did not make and quietly promotes whichever
 * employer sorts first — we shipped six consecutive GitLab cards once. It costs one click and
 * buys a board URL that stays a board URL.
 *
 * **One render tree.** The `display:{xs:'none',lg:'flex'}` fork and its ~300 duplicated lines are
 * gone; every layout difference is CSS inside this one tree. The rail's two densities follow the
 * kit's own established rule (spec 7.1, the same one `JDataTable` follows): both are in the DOM
 * and one is hidden with `display`, because `useMediaQuery` is `false` on the server and would
 * flash the desktop layout on a phone.
 */
/**
 * `--j-split-top` — everything the split has to clear at the top of the page.
 *
 * `app/globals.css` declares a placeholder in `.jobs-scope`, and the notes hand the real number
 * to this file, because this file owns what actually sits above the split: the app bar, the
 * module header, the tabs, the filter card and the result meta row. Rather than hard-coding a
 * measurement that goes stale the first time any of those grows a line, we measure the split's
 * own distance from the top of the viewport and write the variable onto its wrapper.
 *
 * Two guards make this safe rather than clever: the reading is discarded whenever anything above
 * us is scrolled (a `getBoundingClientRect().top` on a scrolled page under-reports the stack),
 * and the variable is written only when the number actually changed, so the `ResizeObserver`
 * cannot feed itself. If the measurement never lands, the token's own value stands and the split
 * is merely a little too tall or too short — it cannot break, because each pane is its own
 * scroller.
 */
function useSplitTop() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let frame = 0;
    let last = "";

    const measure = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      if (window.scrollY > 0) return;
      for (let parent = el.parentElement; parent; parent = parent.parentElement) {
        if (parent.scrollTop > 0) return;
      }
      const top = Math.round(el.getBoundingClientRect().top);
      if (top <= 0 || top >= window.innerHeight) return;
      const next = `${top}px`;
      if (next === last) return;
      last = next;
      el.style.setProperty("--j-split-top", next);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    schedule();
    window.addEventListener("resize", schedule);
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    observer?.observe(document.body);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
    };
  }, []);

  return ref;
}

export function JobBoard() {
  const { t } = useTranslation("common");
  const filters = useJobFilters();
  const {
    tab,
    setTab,
    view,
    jobs,
    matchingCount,
    totalCount,
    loading,
    refetching,
    loadError,
    reload,
    showLock,
    savedCount,
    eligibleCount,
    canFilterByEligibility,
    eligibleOnly,
    setEligibleOnly,
    canSortByRelevance,
    isFiltered,
    excludingHints,
    clearFilters,
    url,
  } = filters;

  const isSaved = tab === "saved";
  const splitRef = useSplitTop();

  /**
   * What the count is counting. `activeChips` are already "Location: Bengaluru" shaped and
   * already translated, so the summary is a join rather than a second vocabulary.
   */
  const chipLabels = filters.activeChips.map((chip) => chip.label);
  const filterSummary =
    chipLabels.length === 0
      ? null
      : chipLabels.length <= 3
        ? (t("jobsV2.board.filteredBy", {
            filters: chipLabels.join(" · "),
            defaultValue: "Filtered by {{filters}}",
          }) as string)
        : (t("jobsV2.board.filteredByMore", {
            filters: chipLabels.slice(0, 3).join(" · "),
            count: chipLabels.length - 3,
            defaultValue: "Filtered by {{filters}} +{{count}} more",
          }) as string);

  const tabs = [
    {
      value: "browse",
      label: t("jobsV2.board.tabBrowse", { defaultValue: "Browse" }) as string,
      icon: "mdi:briefcase-search-outline",
    },
    {
      value: "applied",
      label: t("jobsV2.board.tabApplied", { defaultValue: "Applied" }) as string,
      icon: "mdi:send-check-outline",
    },
    {
      value: "saved",
      label: t("jobsV2.board.tabSaved", { defaultValue: "Saved" }) as string,
      icon: "mdi:heart-outline",
      count: savedCount || undefined,
    },
  ];

  /* ---- the empty and blocked states ------------------------------------ */

  /**
   * Empty, error and profile-locked are rendered **full width, outside the split**.
   *
   * The split hides its pane below `lg`, so an empty state that lived only in the pane would be
   * invisible on a phone — and an error rendered into both panes would announce itself twice to
   * a screen reader. One surface, one message, at every breakpoint.
   */
  function blockingState(): ReactNode {
    if (showLock) {
      return (
        <ProfileLockCard
          title={
            t("lock.jobsTitle", {
              defaultValue: "Job listings need a complete profile",
            }) as string
          }
          body={
            t("lock.jobsBody", {
              defaultValue:
                "Employers see your profile when you apply, so we ask for a few details before opening the board.",
            }) as string
          }
          compact
          // The learner sees blurred job cards behind the lock instead of the empty box the
          // missing `preview` prop produced.
          preview={<JobListSkeleton count={3} view={view} />}
        />
      );
    }

    if (loadError) {
      // NEVER an empty state. "No jobs found" after a 500 lies to the learner about their own
      // board and blames them for a server fault.
      return (
        <ErrorState
          title={t("jobsV2.error.jobsTitle", { defaultValue: "We could not load the job board" }) as string}
          error={loadError}
          onRetry={reload}
          busy={refetching}
          variant="page"
        />
      );
    }

    if (loading || jobs.length > 0) return null;

    if (isSaved && !isFiltered) {
      return (
        <EmptyState
          variant="page"
          illustration={<EmptyJobsIllustration width={180} height={140} />}
          title={t("jobsV2.empty.noSavedTitle", { defaultValue: "Nothing saved yet" }) as string}
          body={
            t("jobsV2.empty.noSavedBody", {
              defaultValue: "Tap the heart on a job to keep it here while you decide.",
            }) as string
          }
          primaryAction={
            <JButton variant="primary" endIcon="mdi:arrow-right" onClick={() => setTab("browse")}>
              {t("jobsV2.empty.browseJobs", { defaultValue: "Browse jobs" })}
            </JButton>
          }
        />
      );
    }

    if (isFiltered || isSaved) {
      return (
        <EmptyState
          variant="page"
          illustration={<EmptyJobsIllustration width={180} height={140} />}
          title={
            t("jobsV2.empty.noMatchesTitle", { defaultValue: "No jobs match these filters" }) as string
          }
          body={
            t("jobsV2.empty.noMatchesBody", {
              defaultValue:
                "Widen the search, or clear the filters to see everything on the board.",
            }) as string
          }
          hints={excludingHints.map((hint) => hint.label)}
          primaryAction={
            <JButton variant="primary" startIcon="mdi:filter-remove-outline" onClick={clearFilters}>
              {t("jobsV2.empty.clearFilters", { defaultValue: "Clear all filters" })}
            </JButton>
          }
        />
      );
    }

    // Nothing exists yet — a different sentence, and no clear-filters action to offer.
    return (
      <EmptyState
        variant="page"
        illustration={<EmptyJobsIllustration width={180} height={140} />}
        title={t("jobsV2.empty.noJobsYetTitle", { defaultValue: "No openings posted yet" }) as string}
        body={
          t("jobsV2.empty.noJobsYetBody", {
            defaultValue: "New roles land here as your institution posts them. Check back soon.",
          }) as string
        }
      />
    );
  }

  const blocked = tab === "applied" ? null : blockingState();

  return (
    <>
      <ModulePageHeader
        // A plain one-word section name, exactly like every sibling module's header
        // ("Achievements" on certificates, "Learn" on roadmaps, "Career" on interview). The
        // numbered marketing kicker this used to carry — "01 · CAREER" — was the single reason
        // the jobs hero read as a different product bolted onto the platform.
        eyebrow={t("jobsV2.board.eyebrow", { defaultValue: "Career" }) as string}
        title={t("jobsV2.title", { defaultValue: "Jobs" }) as string}
        description={
          t("jobsV2.board.description", {
            defaultValue:
              "Discover roles matched to you, filter by what matters, and track every application from one board.",
          }) as string
        }
        accent="azure"
        icon="mdi:briefcase-search"
        action={
          savedCount > 0 ? (
            // The favourites dead end closes: `is_favourited` round-tripped through the API
            // with no surface anywhere that listed it.
            <HeaderActionButton icon="mdi:heart-outline" variant="ghost" onClick={() => setTab("saved")}>
              {t("jobsV2.board.savedCount", {
                count: savedCount,
                defaultValue: "Saved ({{count}})",
              })}
            </HeaderActionButton>
          ) : undefined
        }
      />

      {showLock && <ProfileLockBanner moduleLabel={t("jobsV2.title", { defaultValue: "Jobs" }) as string} />}

      {/* The tabs sit directly under the header and above the search rail, because they switch
          the entire pane — a 280px "Refine results" column controlling nothing was the symptom
          of getting this order wrong. */}
      <JTabs
        data-tour-id="jobs-tabs"
        idPrefix="jobs-board"
        ariaLabel={t("jobsV2.board.tabsLabel", { defaultValue: "Job board sections" }) as string}
        tabs={tabs}
        value={tab}
        onChange={(value) => setTab(value as BoardTab)}
        sx={{ mb: 2 }}
      />

      <JTabPanel idPrefix="jobs-board" value={tab} active>
        {tab === "applied" ? (
          <AppliedPanel
            onBrowseJobs={() => setTab("browse")}
            statusFilter={url.state.status}
            onStatusFilterChange={(status) => url.set({ status })}
          />
        ) : (
          <>
            {/* The rail is Browse's. On Applied and Saved it unmounts entirely — a full search
                bar and eleven filters visible and interactive while controlling nothing is what
                the 280px "Refine results" column was. Saved still shows ActiveFilters, because
                a filter carried in from Browse is still applied and must stay removable. */}
            {isSaved ? (
              filters.activeChips.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <ActiveFilters chips={filters.activeChips} onClearAll={clearFilters} />
                </Box>
              )
            ) : (
              <BoardFilters filters={filters} />
            )}

            <Box data-tour-id="jobs-results">
              {!blocked && !loading && jobs.length > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1.5,
                    mb: 1.75,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{ ...TYPE.small, fontFeatureSettings: '"tnum" 1' }}
                      aria-live="polite"
                    >
                      {/* Unfiltered the count is the whole board — "486 jobs". Narrowed, it says
                          what it narrowed FROM, because "42 jobs" on a board that holds 486 is a
                          true number that reads as a broken one. It is always the student's OWN
                          count; a marketing total and this number are different facts. */}
                      {matchingCount < totalCount
                        ? (t("jobsV2.board.resultCountOf", {
                            count: matchingCount,
                            matching: formatCount(matchingCount),
                            total: formatCount(totalCount),
                            defaultValue: "{{matching}} of {{total}} jobs",
                          }) as string)
                        : (t("jobsV2.board.resultCount", {
                            count: matchingCount,
                            matching: formatCount(matchingCount),
                            defaultValue: "{{matching}} jobs",
                          }) as string)}
                    </Typography>
                    {/* ...and it names WHICH filters did the narrowing, so a learner who pasted
                        a link or came back to a bookmark can see why the board looks small. */}
                    {filterSummary && (
                      <Typography sx={{ ...TYPE.micro, mt: 0.25 }}>{filterSummary}</Typography>
                    )}
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                    {/* Sort is NOT a filter, so it does not live in the pill row. */}
                    <JSelect
                      value={filters.sort}
                      onChange={(value) => filters.setSort(value as typeof filters.sort)}
                      dense
                      fullWidth={false}
                      sx={{ width: 200 }}
                      aria-label={t("jobsV2.board.sortLabel", { defaultValue: "Sort jobs" }) as string}
                      options={[
                        {
                          value: "",
                          label: t("jobsV2.board.sortRecent", { defaultValue: "Most recent" }) as string,
                        },
                        // Offered only when we actually know the learner's skills. A relevance
                        // sort over an empty profile is "most recent" wearing a better label.
                        ...(canSortByRelevance
                          ? [
                              {
                                value: "relevant",
                                label: t("jobsV2.board.sortRelevant", {
                                  defaultValue: "Most relevant",
                                }) as string,
                              },
                            ]
                          : []),
                        {
                          value: "oldest",
                          label: t("jobsV2.board.sortOldest", { defaultValue: "Oldest first" }) as string,
                        },
                        {
                          value: "company",
                          label: t("jobsV2.board.sortCompany", { defaultValue: "Company A-Z" }) as string,
                        },
                        {
                          value: "deadline",
                          label: t("jobsV2.board.sortDeadline", {
                            defaultValue: "Closing soonest",
                          }) as string,
                        },
                      ]}
                    />

                    {/* The card / list switch is preserved below `lg` and hidden at `lg+`, where
                        the rail is the only density. It lives here rather than in the filter
                        rail because the rail unmounts on Saved and the switch must not go with
                        it. */}
                    <Box sx={{ display: { xs: "flex", lg: "none" } }}>
                      <JTabs
                        size="sm"
                        iconOnly
                        idPrefix="jobs-view"
                        ariaLabel={t("jobsV2.board.viewLabel", { defaultValue: "Result layout" }) as string}
                        value={view}
                        onChange={(value) => filters.setView(value === "list" ? "list" : "card")}
                        tabs={[
                          {
                            value: "card",
                            icon: "mdi:view-grid-outline",
                            label: t("jobsV2.board.viewCards", { defaultValue: "Card view" }) as string,
                          },
                          {
                            value: "list",
                            icon: "mdi:view-list-outline",
                            label: t("jobsV2.board.viewList", { defaultValue: "List view" }) as string,
                          },
                        ]}
                      />
                    </Box>
                  </Box>
                </Box>
              )}

              {blocked ?? (
                <Box ref={splitRef} sx={{ minWidth: 0 }}>
                <JobsSplitLayout
                  showBelowLg="rail"
                  railLabel={
                    t("jobsV2.board.railLabel", { defaultValue: "Job results" }) as string
                  }
                  paneLabel={
                    t("jobsV2.board.paneLabel", { defaultValue: "Job posting" }) as string
                  }
                  rail={<JobResultsRail filters={filters} selectedId={null} />}
                  pane={
                    <BoardPane
                      loading={loading}
                      visibleCount={matchingCount}
                      eligibleCount={canFilterByEligibility ? eligibleCount : undefined}
                      savedCount={savedCount}
                      eligibleActive={eligibleOnly}
                      savedActive={isSaved}
                      onToggleEligible={() => setEligibleOnly(!eligibleOnly)}
                      onToggleSaved={() => setTab(isSaved ? "browse" : "saved")}
                    />
                  }
                />
                </Box>
              )}
            </Box>
          </>
        )}
      </JTabPanel>
    </>
  );
}

/* ==========================================================================
 * JobResultsRail — the results column, at both of its densities
 * ======================================================================== */

export interface JobResultsRailProps {
  filters: UseJobFiltersResult;
  /** The posting the pane is showing, or `null` on the board route. */
  selectedId: number | null;
  /** Rendered sticky at the top of the rail's own scroller. The detail route's search box. */
  header?: ReactNode;
}

/**
 * The rail: twenty results, then the pagination as the rail's own last row.
 *
 * **Numbered pagination, in the URL, never infinite scroll.** Every one of the five boards we
 * looked at paginates, and none of them makes you lose your place.
 *
 * Below `lg` this same component is the full-width list and keeps the `view=card|list` switch;
 * at `lg+` it is the 400px rail and the rail is the only density. Both are in the DOM and one is
 * hidden with `display`, which is the kit's rule (spec 7.1) and the reason a phone never flashes
 * the desktop layout on hydration.
 */
export function JobResultsRail({ filters, selectedId, header }: JobResultsRailProps) {
  const router = useRouter();
  const {
    jobs,
    pageIds,
    view,
    loading,
    refetching,
    matchingCount,
    totalHint,
    page,
    pageSize,
    pageCount,
    setPage,
    setPageSize,
    learnerTokens,
    onFavoriteChange,
    url,
  } = filters;

  /**
   * The board's whole filter state rides on the posting's URL. That is what makes the rail come
   * back correct when you land on `/jobs-v2/123`, and what makes "Back to jobs" return you to
   * page 4 of your filtered search rather than an unfiltered page 1. `?ids=` carries the page's
   * own order, which is what the detail pane's prev/next walks.
   */
  const boardQuery = useMemo(() => {
    const params = new URLSearchParams(url.queryString);
    if (pageIds.length) params.set("ids", pageIds.join(","));
    return params.toString();
  }, [url.queryString, pageIds]);

  const hrefFor = useCallback(
    (id: number) => (boardQuery ? `/jobs-v2/${id}?${boardQuery}` : `/jobs-v2/${id}`),
    [boardQuery],
  );

  /**
   * `push`, not `replace`: one history entry per real choice, so browser back walks the roles
   * you actually opened. `scroll: false` keeps the rail exactly where you left it — the pane
   * resets itself to the top instead (`usePaneScrollReset` in the detail view).
   */
  const onSelect = useCallback(
    (id: number) => router.push(hrefFor(id), { scroll: false }),
    [router, hrefFor],
  );

  // j/k and the arrows move the cursor inside the rail, Enter opens, Esc returns to the search
  // box. All of it suppressed while focus is in a text field.
  useRailKeys({ ids: pageIds, selectedId, onSelect, enabled: !loading });

  if (loading) return <JobListSkeleton count={6} view="rail" />;

  /**
   * A refetch dims the list in place; it does **not** unmount. Changing a filter must never
   * blank the posting you are reading, and it must never blank the results either.
   */
  const dimmed = refetching
    ? { opacity: 0.55, pointerEvents: "none" as const, transition: "opacity 220ms" }
    : undefined;

  return (
    <Box aria-busy={refetching || undefined} sx={dimmed}>
      {header}

      {/* lg+ — the rail. One card per job, no summary, no skills, no Apply button. */}
      <Box sx={{ display: { xs: "none", lg: "block" } }} data-jobs-density="rail">
        {jobs.map((job) => (
          <JobRailCard
            key={job.id}
            job={job}
            href={hrefFor(job.id)}
            selected={job.id === selectedId}
            onSelect={onSelect}
            learnerTokens={learnerTokens}
            onFavoriteChange={onFavoriteChange}
          />
        ))}
      </Box>

      {/* Below lg — the full-width list, and the card/list switch it keeps. */}
      <Box sx={{ display: { xs: "block", lg: "none" } }} data-jobs-density="full">
        {view === "list" ? (
          <JPanel>
            {jobs.map((job, index) => (
              <JobRowV2
                key={job.id}
                job={job}
                href={hrefFor(job.id)}
                onFavoriteChange={onFavoriteChange}
                learnerTokens={learnerTokens}
                last={index === jobs.length - 1}
                data-tour-id={index === 0 ? "jobs-card" : undefined}
              />
            ))}
          </JPanel>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
              gap: 1.5,
            }}
          >
            {jobs.map((job, index) => (
              <JobCardV2
                key={job.id}
                job={job}
                href={hrefFor(job.id)}
                onFavoriteChange={onFavoriteChange}
                learnerTokens={learnerTokens}
                data-tour-id={index === 0 ? "jobs-card" : undefined}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* At lg+ this is the rail's last row, inside the rail's own scroller — not a bar below
          the split. The honest "N of M" label is unchanged. */}
      <Box sx={{ px: { xs: 0, lg: 1.75 } }}>
        <JPagination
          page={page}
          pageCount={pageCount}
          total={matchingCount}
          pageSize={pageSize}
          totalHint={totalHint}
          onPageChange={(next) => {
            setPage(next);
            // The rail is its own scroller at lg+, so the page has nowhere to go; below lg the
            // list is the page and the reader expects to land at the top of it.
            const rail = typeof document === "undefined" ? null : document.querySelector("[data-jobs-rail]");
            if (rail && rail.scrollHeight > rail.clientHeight) rail.scrollTo({ top: 0, behavior: "smooth" });
            else window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onPageSizeChange={setPageSize}
        />
      </Box>
    </Box>
  );
}

/* ==========================================================================
 * JobsDetailRail — the same rail, mounted beside a posting
 * ======================================================================== */

/**
 * The rail as the detail route mounts it: self-contained, so `/jobs-v2/[id]` hands it nothing
 * but the id it is showing.
 *
 * `useMediaQuery` appears here and **only** here, and it decides a REQUEST, never a layout: it
 * starts `false`, so a phone opening a posting from an emailed link issues no board fetch it
 * will never show. The rail's own geometry is CSS at every breakpoint, exactly as on the board.
 */
export function JobsDetailRail({ selectedId }: { selectedId: number }) {
  const { t } = useTranslation("common");
  const theme = useTheme();
  // `false` on the server and on first paint, which is the whole point: no request is issued
  // for a rail this breakpoint will never show.
  const isSplit = useMediaQuery(theme.breakpoints.up("lg"), { defaultMatches: false });
  const filters = useJobFilters({ enabled: isSplit });

  return (
    <JobResultsRail
      filters={filters}
      selectedId={selectedId}
      header={
        <Box
          sx={{
            // Reliable here, and only here: the rail's own `overflow-y: auto` box IS the sticky
            // containing block. Sticking to the VIEWPORT is what fails under `MainLayout`'s
            // `overflow: auto` ancestors, which is why the mobile apply bar had to become fixed.
            position: "sticky",
            top: 0,
            zIndex: 2,
            px: 1.75,
            py: 1.5,
            bgcolor: J.surface,
            borderBottom: `1px solid ${J.hairline}`,
          }}
        >
          <Typography sx={TYPE.label}>
            {t("jobsV2.board.railLabel", { defaultValue: "Job results" })}
          </Typography>
        </Box>
      }
    />
  );
}
