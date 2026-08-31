"use client";

import { Box, Typography } from "@mui/material";
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
  TYPE,
} from "@/components/jobs-v2/ui";
import { AppliedPanel } from "./AppliedPanel";
import { BoardFilters } from "./BoardFilters";
import { JobCardV2 } from "./JobCardV2";
import { JobRowV2 } from "./JobRowV2";
import { useJobFilters, type BoardTab } from "./useJobFilters";

/**
 * The student job board — Browse, Applied and Saved.
 *
 * **One render tree.** The `display:{xs:'none',lg:'flex'}` / `display:{xs:'flex',lg:'none'}`
 * fork and its ~300 duplicated lines are gone; every layout difference below is CSS inside this
 * one tree. That single change fixes the desktop branch silently dropping `onFavoriteChange`,
 * the two empty-state copies that had already drifted apart, the four tour ids that only
 * existed on the `lg` branch (so two thirds of the guided tour highlighted nothing on a phone),
 * and the doubled DOM that gave every control on this page two nodes with the same name.
 */
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
    totalHint,
    page,
    pageSize,
    pageCount,
    setPage,
    setPageSize,
    loading,
    refetching,
    loadError,
    reload,
    showLock,
    savedCount,
    isFiltered,
    excludingHints,
    clearFilters,
    onFavoriteChange,
    url,
  } = filters;

  const isSaved = tab === "saved";

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

  /* ---- the browse / saved list ------------------------------------------ */

  function renderList() {
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

    // A skeleton on FIRST load only. A filter change dims the list in place (below), so the
    // board no longer flashes empty on every refetch.
    if (loading) return <JobListSkeleton count={6} view={view} />;

    if (jobs.length === 0) {
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

    const dimmed = refetching
      ? { opacity: 0.55, pointerEvents: "none" as const, transition: "opacity 220ms" }
      : undefined;

    return (
      <Box aria-busy={refetching || undefined} sx={dimmed}>
        {view === "list" ? (
          <JPanel>
            {jobs.map((job, index) => (
              <JobRowV2
                key={job.id}
                job={job}
                onFavoriteChange={onFavoriteChange}
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
              maxWidth: { lg: 1280 },
            }}
          >
            {jobs.map((job, index) => (
              <JobCardV2
                key={job.id}
                job={job}
                onFavoriteChange={onFavoriteChange}
                data-tour-id={index === 0 ? "jobs-card" : undefined}
              />
            ))}
          </Box>
        )}

        <JPagination
          page={page}
          pageCount={pageCount}
          total={matchingCount}
          pageSize={pageSize}
          totalHint={totalHint}
          onPageChange={(next) => {
            setPage(next);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onPageSizeChange={setPageSize}
        />
      </Box>
    );
  }

  return (
    <>
      <ModulePageHeader
        eyebrow={t("jobsV2.board.eyebrow", { defaultValue: "01 · CAREER" }) as string}
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
                bar and seven filters visible and interactive while controlling nothing is what
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
              {!showLock && !loadError && !loading && jobs.length > 0 && (
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
                  <Typography
                    sx={{ ...TYPE.small, fontFeatureSettings: '"tnum" 1' }}
                    aria-live="polite"
                  >
                    {t("jobsV2.board.resultCount", {
                      count: matchingCount,
                      matching: formatCount(matchingCount),
                      defaultValue: "{{matching}} jobs",
                    })}
                    {totalCount > matchingCount && totalHint ? ` · ${totalHint}` : ""}
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
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

                  {/* One view switch, and it lives here rather than in the rail, because the
                      rail unmounts on Saved and the switch must not go with it. */}
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
              )}

              {renderList()}
            </Box>
          </>
        )}
      </JTabPanel>
    </>
  );
}
