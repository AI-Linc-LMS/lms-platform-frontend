"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  ActiveFilters,
  BulkActionBar,
  EmptyState,
  FilterPopover,
  J,
  JButton,
  JPagination,
  JRadioGroup,
  JSelect,
  JTabPanel,
  JTabs,
  JobsScope,
  SearchInput,
  ScrapedTableSkeleton,
  Toolbar,
  TYPE,
  type BulkAction,
  type BulkOutcome,
} from "@/components/jobs-v2/ui";
import { EmptyJobsIllustration } from "@/components/jobs-v2/illustrations";
import {
  ScrapedTable,
  SOURCE_KINDS,
  SOURCE_KIND_LABELS,
} from "@/components/admin/jobs-v2/scraped/ScrapedTable";
import { ScrapedPreviewSheet } from "@/components/admin/jobs-v2/scraped/ScrapedPreviewSheet";
import { formatCount } from "@/lib/jobs-v2/format";
import { useSeq } from "@/lib/jobs-v2/useSeq";
import { useSelection } from "@/lib/jobs-v2/useSelection";
import {
  adminScrapedJobsService,
  type ScrapedJob,
  type ScrapedJobsCounts,
  type ScrapedJobsTab,
} from "@/lib/services/admin/admin-scraped-jobs.service";
import { config } from "@/lib/config";

const TABS: ScrapedJobsTab[] = ["review", "imported", "dismissed", "irrelevant"];

type SortKey = "default" | "relevance" | "seen" | "company";

const PAGE_SIZES = [10, 20, 50];

export default function AdminScrapedJobsPage() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { showToast } = useToast();

  const [tab, setTab] = useState<ScrapedJobsTab>("review");
  const [rows, setRows] = useState<ScrapedJob[]>([]);
  const [counts, setCounts] = useState<ScrapedJobsCounts | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sourceKind, setSourceKind] = useState("");
  // "default" is the order the API returned. It stays the default so the shipped
  // presentation is unchanged until the operator asks for something else.
  const [sort, setSort] = useState<SortKey>("default");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(PAGE_SIZES[1]);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; row: ScrapedJob } | null>(null);
  const [preview, setPreview] = useState<ScrapedJob | null>(null);
  const [acting, setActing] = useState(false);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  /**
   * True while the out-of-range page clamp is refetching. The spinner deliberately stays up
   * across BOTH requests rather than flashing the tab's "all clear" empty state — this now
   * says so, so the longer wait is explained instead of merely endured.
   */
  const [clamping, setClamping] = useState(false);

  /** The monotonic stale-response guard, unchanged in semantics — now `useSeq`. */
  const seq = useSeq();

  // Selection (and its bulk import/dismiss) only makes sense in the review queue.
  const selectable = tab === "review";

  /**
   * Client-side sort over the current page. The list endpoint has no `ordering` param (spec 10.5
   * — the API is read-only for this work), so the control says exactly what it does rather than
   * implying the whole queue is ordered.
   */
  const sortedRows = useMemo(() => {
    const list = [...rows];
    switch (sort) {
      case "seen":
        return list.sort((a, b) => {
          const av = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
          const bv = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
          return bv - av;
        });
      case "company":
        return list.sort((a, b) => a.company_name.localeCompare(b.company_name));
      case "relevance":
        // An unscored row sorts last rather than pretending to be a zero match.
        return list.sort((a, b) => (b.relevance ?? -1) - (a.relevance ?? -1));
      case "default":
      default:
        return list;
    }
  }, [rows, sort]);

  /** Visual order — shift-click range selection reads it, so it must match what is rendered. */
  const pageIds = useMemo(() => sortedRows.map((row) => row.id), [sortedRows]);

  /**
   * Any query change changes which rows are on screen, so a selection made before it must not
   * survive — bulk actions only ever hit rows the admin can still see. Identical `deps` to the
   * effect this replaces: `[tab, page, perPage, search, sourceKind]`.
   */
  const selection = useSelection<number>({
    ids: pageIds,
    deps: [tab, page, perPage, search, sourceKind],
  });

  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  /** A row that just left the queue must not stay selected. The shipped dismiss handler did
   *  exactly this; it now applies to the single-row import too. */
  const dropFromSelection = useCallback((id: number) => {
    if (selectionRef.current.isSelected(id)) selectionRef.current.toggle(id);
  }, []);

  const loadRows = useCallback(async () => {
    const token = seq.next();
    setLoading(true);
    try {
      const data = await adminScrapedJobsService.getScrapedJobs(config.clientId, {
        tab,
        search: search || undefined,
        source_kind: sourceKind || undefined,
        page,
        page_size: perPage,
      });
      if (!seq.isCurrent(token)) return; // a newer request owns the screen
      const results = data.results ?? [];
      const count = data.count ?? 0;
      setCounts(data.counts ?? null);
      setTotalCount(count);
      setLoadError(null);
      // Out-of-range page (e.g. the final page's last rows were just dismissed): clamp to the
      // real last page and let that refetch land — keep the loading state up instead of
      // flashing the tab's "all clear" empty state.
      if (results.length === 0 && count > 0 && page > 1) {
        const lastPage = Math.max(1, Math.ceil(count / perPage));
        if (lastPage < page) {
          setClamping(true);
          setPage(lastPage);
          return;
        }
      }
      setRows(results);
      setClamping(false);
      setLoading(false);
    } catch (err) {
      if (!seq.isCurrent(token)) return;
      const message =
        (err as Error)?.message ??
        (t("jobsV2.error.scrapedTitle") as string);
      // The error is reported by ErrorState, in place, with Retry — not only by a toast that
      // has already faded by the time the admin looks up.
      setLoadError(message);
      setRows([]);
      setTotalCount(0);
      setClamping(false);
      setLoading(false);
    }
  }, [tab, search, sourceKind, page, perPage, seq, t]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const handleTabChange = (next: string) => {
    setTab(next as ScrapedJobsTab);
    setPage(1);
  };

  const closeMenu = () => setMenuAnchor(null);

  /* ---- single-row actions --------------------------------------------------- */

  const importOne = useCallback(
    async (row: ScrapedJob) => {
      setImportingId(row.id);
      setActing(true);
      try {
        const result = await adminScrapedJobsService.bulkImportScrapedJobs(
          [row.id],
          config.clientId,
        );
        if ((result.skipped ?? []).length > 0) {
          showToast(
            t(
              "jobsV2.scraped.importSkippedOne",
              "The server skipped this posting — it may already be imported.",
            ) as string,
            "error",
          );
        } else {
          showToast(
            t(
              "jobsV2.scraped.importedOne",
              "Imported as a draft — target and publish it from the jobs list.",
            ) as string,
            "success",
          );
        }
        setPreview(null);
        dropFromSelection(row.id);
        loadRows();
      } catch (err) {
        showToast(
          (err as Error)?.message ??
            (t("jobsV2.scraped.importFailed", "Failed to import this posting") as string),
          "error",
        );
      } finally {
        setImportingId(null);
        setActing(false);
      }
    },
    [dropFromSelection, loadRows, showToast, t],
  );

  const dismissOne = useCallback(
    async (row: ScrapedJob) => {
      setActing(true);
      try {
        await adminScrapedJobsService.dismissScrapedJob(row.id, config.clientId);
        showToast(t("jobsV2.scraped.dismissedOne", "Job dismissed") as string, "success");
        setPreview(null);
        dropFromSelection(row.id);
        loadRows();
      } catch (err) {
        showToast(
          (err as Error)?.message ??
            (t("jobsV2.scraped.dismissFailed", "Failed to dismiss job") as string),
          "error",
        );
      } finally {
        setActing(false);
      }
    },
    [dropFromSelection, loadRows, showToast, t],
  );

  const restoreOne = useCallback(
    async (row: ScrapedJob) => {
      setActing(true);
      try {
        await adminScrapedJobsService.restoreScrapedJob(row.id, config.clientId);
        showToast(
          t("jobsV2.scraped.restoredOne", "Job restored to review") as string,
          "success",
        );
        loadRows();
      } catch (err) {
        showToast(
          (err as Error)?.message ??
            (t("jobsV2.scraped.restoreFailed", "Failed to restore job") as string),
          "error",
        );
      } finally {
        setActing(false);
      }
    },
    [loadRows, showToast, t],
  );

  const reviewAndImport = useCallback(
    (row: ScrapedJob) => {
      router.push(`/admin/jobs-v2/new?scraped_job_id=${row.id}`);
    },
    [router],
  );

  /* ---- bulk actions --------------------------------------------------------- */

  const titleFor = useCallback(
    (id: number) => rows.find((row) => row.id === id)?.job_title ?? `#${id}`,
    [rows],
  );

  const selectedIds = useMemo(() => Array.from(selection.selected), [selection.selected]);

  const bulkActions = useMemo<BulkAction[]>(() => {
    const count = selectedIds.length;
    return [
      {
        key: "import",
        label: t("jobsV2.scraped.importDrafts", "Import as drafts") as string,
        icon: "mdi:briefcase-plus-outline",
        // Bulk import creates N real job records and had NO confirm at all, while bulk dismiss
        // — the reversible one — did.
        confirm: {
          title: t("jobsV2.scraped.confirmImportTitle", "Import {{n}} postings?", {
            n: formatCount(count),
          }) as string,
          consequences: [
            t("jobsV2.bulk.consequenceImport", { count: formatCount(count) }) as string,
            t(
              "jobsV2.scraped.consequenceImportTargeting",
              "They start unpublished with no targeting, so no student sees them yet.",
            ) as string,
          ],
        },
        onRun: async (failedIds): Promise<BulkOutcome> => {
          const ids = (failedIds as number[] | undefined) ?? selectedIds;
          setActing(true);
          try {
            const result = await adminScrapedJobsService.bulkImportScrapedJobs(
              ids,
              config.clientId,
            );
            const skipped = result.skipped ?? [];
            // The selection is deliberately NOT cleared here: the bar hides at zero, and the
            // outcome summary (and its "Retry failed") lives inside the bar. The admin clears
            // it with the bar's own Clear once they have read the result.
            loadRows();
            // "M skipped" with no list and no reason is replaced by the named outcome.
            return {
              ok: result.imported ?? Math.max(0, ids.length - skipped.length),
              failed: skipped.map((id) => ({
                id,
                title: titleFor(id),
                reason: t(
                  "jobsV2.scraped.skippedReason",
                  "Skipped by the server — already imported, or no longer available.",
                ) as string,
              })),
            };
          } catch (err) {
            const reason =
              (err as Error)?.message ?? (t("jobsV2.bulk.unknownError") as string);
            return { ok: 0, failed: ids.map((id) => ({ id, title: titleFor(id), reason })) };
          } finally {
            setActing(false);
          }
        },
      },
      {
        key: "dismiss",
        label: t("jobsV2.scraped.dismiss", "Dismiss") as string,
        icon: "mdi:close-circle-outline",
        tone: "danger",
        confirm: {
          title: t("jobsV2.scraped.confirmDismissTitle", "Dismiss {{n}} postings?", {
            n: formatCount(count),
          }) as string,
          consequences: [
            t("jobsV2.bulk.consequenceDismiss", { count: formatCount(count) }) as string,
          ],
        },
        onRun: async (failedIds): Promise<BulkOutcome> => {
          const ids = (failedIds as number[] | undefined) ?? selectedIds;
          setActing(true);
          try {
            const result = await adminScrapedJobsService.bulkDismissScrapedJobs(
              ids,
              config.clientId,
            );
            loadRows();
            const ok = result.dismissed ?? ids.length;
            return {
              ok,
              failed:
                ok >= ids.length
                  ? []
                  : ids.slice(ok).map((id) => ({
                      id,
                      title: titleFor(id),
                      reason: t(
                        "jobsV2.scraped.skippedReason",
                        "Skipped by the server — already imported, or no longer available.",
                      ) as string,
                    })),
            };
          } catch (err) {
            const reason =
              (err as Error)?.message ?? (t("jobsV2.bulk.unknownError") as string);
            return { ok: 0, failed: ids.map((id) => ({ id, title: titleFor(id), reason })) };
          } finally {
            setActing(false);
          }
        },
      },
    ];
  }, [loadRows, selectedIds, t, titleFor]);

  /* ---- presentation --------------------------------------------------------- */

  const tabDescriptions: Record<ScrapedJobsTab, string> = {
    review: t(
      "jobsV2.scraped.desc.review",
      "Fresh postings the scraper found and scored. Import the good ones, dismiss the rest.",
    ) as string,
    imported: t(
      "jobsV2.scraped.desc.imported",
      "Postings you turned into draft jobs. They stay unpublished until you target them.",
    ) as string,
    dismissed: t(
      "jobsV2.scraped.desc.dismissed",
      "Postings you rejected by hand. Nothing is deleted — restore any of them back into review.",
    ) as string,
    irrelevant: t(
      "jobsV2.scraped.desc.irrelevant",
      "Postings the relevance filter rejected before you ever saw them. Check its calls here.",
    ) as string,
  };

  const emptyCopy: Record<ScrapedJobsTab, { title: string; body: string }> = {
    review: {
      title: t("jobsV2.scraped.empty.reviewTitle", "No scraped jobs to review") as string,
      body: t(
        "jobsV2.scraped.empty.reviewBody",
        "New jobs land here as the scraper finds and enriches them.",
      ) as string,
    },
    imported: {
      title: t("jobsV2.scraped.empty.importedTitle", "Nothing imported yet") as string,
      body: t(
        "jobsV2.scraped.empty.importedBody",
        "Jobs you import become unpublished drafts and are listed here for reference.",
      ) as string,
    },
    dismissed: {
      title: t("jobsV2.scraped.empty.dismissedTitle", "No dismissed jobs") as string,
      body: t(
        "jobsV2.scraped.empty.dismissedBody",
        "Jobs you dismiss land here, and any of them can be restored into review.",
      ) as string,
    },
    irrelevant: {
      title: t("jobsV2.scraped.empty.irrelevantTitle", "Nothing marked irrelevant") as string,
      body: t(
        "jobsV2.scraped.empty.irrelevantBody",
        "Jobs the relevance filter rejects appear here so you can double-check its calls.",
      ) as string,
    },
  };

  const isFiltered = Boolean(search || sourceKind);

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setSourceKind("");
    setPage(1);
  };

  const activeChips = [
    ...(search
      ? [
          {
            key: "search",
            label: t("jobsV2.admin.filters.searchChip", 'Search: "{{q}}"', { q: search }) as string,
            onRemove: () => {
              setSearchInput("");
              setSearch("");
              setPage(1);
            },
          },
        ]
      : []),
    ...(sourceKind
      ? [
          {
            key: "source",
            label: `${t("jobsV2.scraped.col.source", "Source") as string}: ${
              SOURCE_KIND_LABELS[sourceKind] ?? sourceKind
            }`,
            onRemove: () => {
              setSourceKind("");
              setPage(1);
            },
          },
        ]
      : []),
  ];

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));

  return (
    <PageShell>
      <JobsScope surface="admin">
        <ModulePageHeader
          eyebrow={t("jobsV2.scraped.eyebrow", "Scraped jobs") as string}
          title={t("jobsV2.scraped.title", "Scraped jobs") as string}
          description={
            t(
              "jobsV2.scraped.description",
              "Review jobs scraped from the web, dismiss the noise, and import the good ones as drafts.",
            ) as string
          }
          accent="azure"
          icon="mdi:radar"
          action={
            <HeaderActionButton
              icon="mdi:arrow-left"
              variant="ghost"
              onClick={() => router.push("/admin/jobs-v2")}
            >
              {t("jobsV2.admin.backToJobs", "Back to jobs")}
            </HeaderActionButton>
          }
        />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <JTabs
            tabs={TABS.map((value) => ({
              value,
              label: t(`jobsV2.scrapedState.${value}`) as string,
              count: counts?.[value],
            }))}
            value={tab}
            onChange={handleTabChange}
            ariaLabel={t("jobsV2.scraped.tabsLabel", "Scraped job queues") as string}
            idPrefix="scraped"
          />

          {/* Each tab says what its state MEANS. "Irrelevant" versus "Dismissed" used to be
              explained only by landing on the tab and reading its empty copy. */}
          <Typography sx={{ ...TYPE.small, maxWidth: "72ch" }}>
            {tabDescriptions[tab]}
          </Typography>

          <Toolbar
            start={
              <>
                <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: 240 }, maxWidth: 460 }}>
                  <SearchInput
                    value={searchInput}
                    onChange={setSearchInput}
                    onSubmit={(value) => {
                      setSearch(value.trim());
                      setPage(1);
                    }}
                    ariaLabel={
                      t(
                        "jobsV2.scraped.searchLabel",
                        "Search scraped jobs by title, company or location",
                      ) as string
                    }
                    placeholder={
                      t("jobsV2.admin.searchPlaceholder", "Search title, company, location") as string
                    }
                  />
                </Box>
                <FilterPopover
                  label={t("jobsV2.scraped.col.source", "Source") as string}
                  icon="mdi:source-branch"
                  active={Boolean(sourceKind)}
                  onClear={
                    sourceKind
                      ? () => {
                          setSourceKind("");
                          setPage(1);
                        }
                      : undefined
                  }
                >
                  {(close) => (
                    <JRadioGroup
                      label={t("jobsV2.scraped.col.source", "Source") as string}
                      value={sourceKind}
                      onChange={(value) => {
                        setSourceKind(value);
                        setPage(1);
                        close();
                      }}
                      options={[
                        {
                          value: "",
                          label: t("jobsV2.scraped.anySource", "Any source") as string,
                        },
                        ...SOURCE_KINDS,
                      ]}
                    />
                  )}
                </FilterPopover>
              </>
            }
            end={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box component="span" sx={{ ...TYPE.small, whiteSpace: "nowrap" }}>
                  {t("jobsV2.admin.sortLabel", "Sort")}
                </Box>
                <JSelect
                  value={sort}
                  onChange={(value) => setSort(value as SortKey)}
                  options={[
                    {
                      value: "default",
                      label: t("jobsV2.scraped.sort.default", "Queue order") as string,
                    },
                    {
                      value: "relevance",
                      label: t("jobsV2.scraped.sort.relevance", "Relevance") as string,
                    },
                    { value: "seen", label: t("jobsV2.scraped.sort.seen", "Most recent") as string },
                    {
                      value: "company",
                      label: t("jobsV2.scraped.sort.company", "Company A-Z") as string,
                    },
                  ]}
                  aria-label={t("jobsV2.admin.sortLabel", "Sort") as string}
                  fullWidth={false}
                  sx={{ minWidth: 170 }}
                  helper={
                    sort !== "default" && totalPages > 1
                      ? (t(
                          "jobsV2.scraped.sortScope",
                          "Sorts this page — the queue API cannot sort across pages yet.",
                        ) as string)
                      : undefined
                  }
                />
              </Box>
            }
          />

          <ActiveFilters chips={activeChips} onClearAll={clearFilters} />

          <JTabPanel idPrefix="scraped" value={tab} active>
            {selectable && (
              <BulkActionBar
                count={selection.count}
                noun={t("jobsV2.noun.job", { count: selection.count }) as string}
                onClear={selection.clear}
                actions={bulkActions}
                busy={acting}
              />
            )}

            {loading ? (
              <Box>
                {clamping && (
                  <Typography sx={{ ...TYPE.small, mb: 1 }} role="status">
                    {t("jobsV2.scraped.reChecking", "Re-checking the last page…")}
                  </Typography>
                )}
                <ScrapedTableSkeleton rows={8} />
              </Box>
            ) : (
              <ScrapedTable
                rows={sortedRows}
                tab={tab}
                loading={false}
                error={loadError}
                onRetry={loadRows}
                isFiltered={isFiltered}
                empty={
                  <EmptyState
                    variant="page"
                    illustration={<EmptyJobsIllustration width={140} height={116} />}
                    title={emptyCopy[tab].title}
                    body={emptyCopy[tab].body}
                    primaryAction={
                      tab === "review" ? (
                        <JButton variant="secondary" startIcon="mdi:refresh" onClick={loadRows}>
                          {t("jobsV2.scraped.checkAgain", "Check again")}
                        </JButton>
                      ) : (
                        <JButton
                          variant="secondary"
                          startIcon="mdi:inbox-arrow-down-outline"
                          onClick={() => handleTabChange("review")}
                        >
                          {t("jobsV2.scraped.goToReview", "Go to the review queue")}
                        </JButton>
                      )
                    }
                  />
                }
                emptyFiltered={
                  <EmptyState
                    variant="page"
                    icon="mdi:filter-remove-outline"
                    title={
                      t("jobsV2.scraped.emptyFilteredTitle", "Nothing matches this search") as string
                    }
                    body={
                      t(
                        "jobsV2.scraped.emptyFilteredBody",
                        "Widen the search or clear the source filter to see the rest of this queue.",
                      ) as string
                    }
                    primaryAction={
                      <JButton variant="secondary" startIcon="mdi:close" onClick={clearFilters}>
                        {t("jobsV2.empty.clearFilters")}
                      </JButton>
                    }
                  />
                }
                selection={
                  selectable
                    ? {
                        selectedIds: selection.selected,
                        onChange: (next) => selection.set(Array.from(next) as number[]),
                        selectableIds: pageIds,
                      }
                    : undefined
                }
                onOpenMenu={(el, row) => setMenuAnchor({ el, row })}
                onPreview={setPreview}
              />
            )}

            {!loading && !loadError && totalCount > 0 && (
              <JPagination
                page={page}
                pageCount={totalPages}
                total={totalCount}
                pageSize={perPage}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPerPage(size);
                  setPage(1);
                }}
                sizes={PAGE_SIZES}
              />
            )}
          </JTabPanel>
        </Box>

        <Menu
          anchorEl={menuAnchor?.el ?? null}
          open={Boolean(menuAnchor)}
          onClose={closeMenu}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{ paper: { sx: { minWidth: 216, mt: 1, bgcolor: J.surface } } }}
        >
          <MenuItem
            onClick={() => {
              const row = menuAnchor?.row;
              closeMenu();
              if (row) setPreview(row);
            }}
          >
            <ListItemIcon>
              <IconWrapper icon="mdi:file-eye-outline" size={18} />
            </ListItemIcon>
            <ListItemText>{t("jobsV2.scraped.preview", "Preview")}</ListItemText>
          </MenuItem>
          {tab === "review" && (
            <MenuItem
              onClick={() => {
                const row = menuAnchor?.row;
                closeMenu();
                if (row) reviewAndImport(row);
              }}
            >
              <ListItemIcon>
                <IconWrapper icon="mdi:arrow-right" size={18} />
              </ListItemIcon>
              <ListItemText>{t("jobsV2.scraped.reviewImport", "Review & import")}</ListItemText>
            </MenuItem>
          )}
          {tab === "review" && (
            // Importing ONE job cleanly used to require discovering that you can tick one
            // checkbox and use the bulk bar.
            <MenuItem
              disabled={acting}
              onClick={() => {
                const row = menuAnchor?.row;
                closeMenu();
                if (row) importOne(row);
              }}
            >
              <ListItemIcon>
                <IconWrapper icon="mdi:briefcase-plus-outline" size={18} />
              </ListItemIcon>
              <ListItemText>{t("jobsV2.scraped.importDraft", "Import as draft")}</ListItemText>
            </MenuItem>
          )}
          {tab === "review" && (
            <MenuItem
              disabled={acting}
              onClick={() => {
                const row = menuAnchor?.row;
                closeMenu();
                if (row) dismissOne(row);
              }}
            >
              <ListItemIcon>
                <IconWrapper icon="mdi:close-circle-outline" size={18} />
              </ListItemIcon>
              <ListItemText>{t("jobsV2.scraped.dismiss", "Dismiss")}</ListItemText>
            </MenuItem>
          )}
          {tab === "dismissed" && (
            <MenuItem
              disabled={acting}
              onClick={() => {
                const row = menuAnchor?.row;
                closeMenu();
                if (row) restoreOne(row);
              }}
            >
              <ListItemIcon>
                <IconWrapper icon="mdi:restore" size={18} />
              </ListItemIcon>
              <ListItemText>{t("jobsV2.scraped.restore", "Restore")}</ListItemText>
            </MenuItem>
          )}
          {tab === "imported" && (
            <MenuItem
              disabled={!menuAnchor?.row.decision?.job_id}
              onClick={() => {
                const jobId = menuAnchor?.row.decision?.job_id;
                closeMenu();
                if (jobId) router.push(`/admin/jobs-v2/${jobId}`);
              }}
            >
              <ListItemIcon>
                <IconWrapper icon="mdi:briefcase-outline" size={18} />
              </ListItemIcon>
              <ListItemText>{t("jobsV2.scraped.openJob", "Open job")}</ListItemText>
            </MenuItem>
          )}
          <MenuItem
            disabled={!menuAnchor?.row.apply_url}
            onClick={() => {
              const url = menuAnchor?.row.apply_url;
              closeMenu();
              if (url) window.open(url, "_blank", "noopener,noreferrer");
            }}
          >
            <ListItemIcon>
              <IconWrapper icon="mdi:open-in-new" size={18} />
            </ListItemIcon>
            <ListItemText>{t("jobsV2.scraped.openOriginal", "Open original")}</ListItemText>
          </MenuItem>
        </Menu>

        <ScrapedPreviewSheet
          row={preview}
          onClose={() => setPreview(null)}
          onImportDraft={importOne}
          onReviewAndImport={reviewAndImport}
          importing={importingId !== null && importingId === preview?.id}
        />
      </JobsScope>
    </PageShell>
  );
}
