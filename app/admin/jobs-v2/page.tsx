"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  EmptyState,
  HairlineStrip,
  J,
  JButton,
  JConfirm,
  JPagination,
  JobsScope,
  HairlineStripSkeleton,
  type StripItem,
} from "@/components/jobs-v2/ui";
import { EmptyJobsIllustration } from "@/components/jobs-v2/illustrations";
import { JobsTable } from "@/components/admin/jobs-v2/list/JobsTable";
import {
  JobsToolbar,
  JOBS_FILTER_DEFAULTS,
  isJobsFiltered,
  type JobsFilterState,
} from "@/components/admin/jobs-v2/list/JobsToolbar";
import { JobsBulkActions } from "@/components/admin/jobs-v2/list/JobsBulkActions";
import { deadlineLabel, formatCount } from "@/lib/jobs-v2/format";
import { useSeq } from "@/lib/jobs-v2/useSeq";
import { useSelection } from "@/lib/jobs-v2/useSelection";
import { adminJobsV2Service } from "@/lib/services/admin/admin-jobs-v2.service";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { config } from "@/lib/config";

type ServerStatus = NonNullable<JobV2["status"]>;

const PAGE_SIZES = [10, 20, 50];

function matchesSearch(job: JobV2, needle: string): boolean {
  if (!needle) return true;
  const q = needle.toLowerCase();
  return [job.job_title, job.company_name, job.location]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

export default function AdminJobsV2Page() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { showToast } = useToast();

  const [jobs, setJobs] = useState<JobV2[]>([]);
  const [loading, setLoading] = useState(true);
  /** True only for a refetch with content already on screen — the list dims, it never blanks. */
  const [refetching, setRefetching] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filters, setFilters] = useState<JobsFilterState>(JOBS_FILTER_DEFAULTS);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[1]);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [sortKey, setSortKey] = useState<string>("created");

  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; job: JobV2 } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<JobV2 | null>(null);
  const [deleting, setDeleting] = useState(false);
  /** Only the rows whose own write is in flight. Every other row stays enabled. */
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});

  const seq = useSeq();
  const hasLoadedOnce = useRef(false);

  /**
   * The list loader. `status` is still the ONLY server-side filter, sent exactly as before;
   * search, visibility, sorting and paging are client-side because the endpoint has no params
   * for them (spec 10.5 — the API is read-only for this work).
   */
  const loadJobs = useCallback(async () => {
    const token = seq.next();
    if (hasLoadedOnce.current) setRefetching(true);
    else setLoading(true);
    try {
      const data = await adminJobsV2Service.getJobs(config.clientId, {
        status: (filters.status as ServerStatus) || undefined,
      });
      if (!seq.isCurrent(token)) return;
      setJobs(data.results ?? []);
      setLoadError(null);
    } catch (err) {
      if (!seq.isCurrent(token)) return;
      // A catch may NEVER setJobs([]) — that renders "no jobs yet" over a server fault and
      // invites the admin to create a duplicate of a job they already have.
      setLoadError((err as Error)?.message ?? (t("jobsV2.error.title") as string));
    } finally {
      if (seq.isCurrent(token)) {
        hasLoadedOnce.current = true;
        setLoading(false);
        setRefetching(false);
      }
    }
  }, [filters.status, seq, t]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  /* ---- client-side view over the loaded set -------------------------------- */

  const visible = useMemo(() => {
    const list = jobs.filter((job) => {
      if (!matchesSearch(job, filters.search)) return false;
      if (filters.visibility === "published" && !job.is_published) return false;
      if (filters.visibility === "draft" && job.is_published) return false;
      if (filters.closingSoon) {
        const deadline = deadlineLabel(job.application_deadline);
        if (!deadline || deadline.urgency === "past" || deadline.daysLeft > 7) return false;
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    const time = (value?: string) => {
      const parsed = value ? new Date(value).getTime() : NaN;
      // Undated rows sort last in both directions rather than pretending to be 1970.
      return Number.isNaN(parsed) ? null : parsed;
    };
    const compare = (a: JobV2, b: JobV2): number => {
      switch (sortKey) {
        case "job":
          return a.job_title.localeCompare(b.job_title) * dir;
        case "status":
          return (a.status ?? "").localeCompare(b.status ?? "") * dir;
        case "applicants":
          return ((a.applications_count ?? 0) - (b.applications_count ?? 0)) * dir;
        case "closes": {
          const av = time(a.application_deadline);
          const bv = time(b.application_deadline);
          if (av === null && bv === null) return 0;
          if (av === null) return 1;
          if (bv === null) return -1;
          return (av - bv) * dir;
        }
        case "created":
        default: {
          const av = time(a.created_at);
          const bv = time(b.created_at);
          if (av === null && bv === null) return 0;
          if (av === null) return 1;
          if (bv === null) return -1;
          return (av - bv) * dir;
        }
      }
    };
    return [...list].sort(compare);
  }, [filters.closingSoon, filters.search, filters.visibility, jobs, sortDir, sortKey]);

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = useMemo(
    () => visible.slice((safePage - 1) * pageSize, safePage * pageSize),
    [pageSize, safePage, visible],
  );
  const pageIds = useMemo(() => pageRows.map((job) => job.id), [pageRows]);

  // The page must never point past the end of a shrunken result set.
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  /**
   * Selection clears on filter, search and page change, so a bulk action can never mass-update
   * rows the admin can no longer see. Same `deps` contract as the scraped queue.
   */
  const selection = useSelection<number>({
    ids: pageIds,
    deps: [
      filters.status,
      filters.visibility,
      filters.closingSoon,
      filters.search,
      safePage,
      pageSize,
      sortKey,
      sortDir,
    ],
  });

  const isFiltered = isJobsFiltered(filters);

  /* ---- the hairline strip: counts AND the status filter --------------------- */

  const stats = useMemo(() => {
    let active = 0;
    let draft = 0;
    let closingSoon = 0;
    let applicants = 0;
    for (const job of jobs) {
      if ((job.status ?? "active") === "active") active += 1;
      if (!job.is_published) draft += 1;
      const deadline = deadlineLabel(job.application_deadline);
      if (deadline && deadline.urgency !== "past" && deadline.daysLeft <= 7) closingSoon += 1;
      applicants += job.applications_count ?? 0;
    }
    return { total: jobs.length, active, draft, closingSoon, applicants };
  }, [jobs]);

  const patchFilters = useCallback((patch: Partial<JobsFilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }, []);

  const stripItems = useMemo<StripItem[]>(
    () => [
      {
        key: "total",
        label: t("jobsV2.admin.strip.total", "Total") as string,
        value: formatCount(stats.total),
        hint: t("jobsV2.admin.strip.totalHint", "In this view") as string,
        active: !filters.status && !filters.visibility && !filters.closingSoon,
        onClick: () => patchFilters({ status: "", visibility: "", closingSoon: false }),
      },
      {
        key: "active",
        label: t("jobsV2.jobStatus.active") as string,
        value: formatCount(stats.active),
        tone: J.successFg,
        active: filters.status === "active",
        onClick: () => patchFilters({ status: filters.status === "active" ? "" : "active" }),
      },
      {
        key: "draft",
        label: t("jobsV2.visibility.draft") as string,
        value: formatCount(stats.draft),
        tone: J.ink3,
        active: filters.visibility === "draft",
        onClick: () =>
          patchFilters({ visibility: filters.visibility === "draft" ? "" : "draft" }),
      },
      {
        key: "closing",
        label: t("jobsV2.admin.strip.closing", "Closing this week") as string,
        value: formatCount(stats.closingSoon),
        tone: stats.closingSoon > 0 ? J.warnFg : undefined,
        active: filters.closingSoon,
        onClick: () => patchFilters({ closingSoon: !filters.closingSoon }),
      },
      {
        key: "applicants",
        label: t("jobsV2.admin.strip.applicants", "Applicants") as string,
        value: formatCount(stats.applicants),
        // Honest label: the list endpoint sends a lifetime total per job, not a 30-day window.
        hint: t("jobsV2.admin.strip.applicantsHint", "All time, all jobs") as string,
      },
    ],
    [filters.closingSoon, filters.status, filters.visibility, patchFilters, stats, t],
  );

  /* ---- row-level actions --------------------------------------------------- */

  const handleStatusChange = useCallback(
    async (job: JobV2, status: string) => {
      const previous = job.status;
      // Optimistic on THIS row only; the table is never torn down and scroll is kept.
      setJobs((prev) =>
        prev.map((row) => (row.id === job.id ? { ...row, status: status as ServerStatus } : row)),
      );
      setUpdatingIds((prev) => new Set(prev).add(job.id));
      setRowErrors((prev) => {
        if (!(job.id in prev)) return prev;
        const next = { ...prev };
        delete next[job.id];
        return next;
      });
      try {
        const updated = await adminJobsV2Service.updateJob(
          job.id,
          { status: status as ServerStatus },
          config.clientId,
        );
        setJobs((prev) =>
          prev.map((row) =>
            row.id === job.id ? { ...row, ...updated, status: updated.status ?? (status as ServerStatus) } : row,
          ),
        );
        showToast(t("jobsV2.admin.statusUpdated", "Status updated") as string, "success");
      } catch (err) {
        // Roll back and say so inline, on the row that failed.
        setJobs((prev) =>
          prev.map((row) => (row.id === job.id ? { ...row, status: previous } : row)),
        );
        setRowErrors((prev) => ({
          ...prev,
          [job.id]:
            (err as Error)?.message ??
            (t("jobsV2.admin.statusFailed", "That status did not save") as string),
        }));
      } finally {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(job.id);
          return next;
        });
      }
    },
    [showToast, t],
  );

  const handleBulkDone = useCallback((changed: number[], patch: Partial<JobV2>) => {
    const ids = new Set(changed);
    setJobs((prev) => prev.map((row) => (ids.has(row.id) ? { ...row, ...patch } : row)));
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await adminJobsV2Service.deleteJob(deleteConfirm.id, config.clientId);
      showToast(t("jobsV2.admin.jobDeleted", "Job deleted") as string, "success");
      setJobs((prev) => prev.filter((row) => row.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      showToast(
        (err as Error)?.message ?? (t("jobsV2.admin.deleteFailed", "Failed to delete job") as string),
        "error",
      );
    } finally {
      setDeleting(false);
    }
  }, [deleteConfirm, showToast, t]);

  const closeMenu = () => setMenuAnchor(null);

  return (
    <PageShell>
      <JobsScope surface="admin">
        <ModulePageHeader
          eyebrow={t("jobsV2.admin.eyebrow", "Engagement") as string}
          title={t("jobsV2.title") as string}
          description={
            t(
              "jobsV2.admin.description",
              "Post jobs, curate opportunities and track who is applying.",
            ) as string
          }
          accent="azure"
          icon="mdi:briefcase-search"
          action={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
              <HeaderActionButton
                icon="mdi:radar"
                variant="ghost"
                onClick={() => router.push("/admin/jobs-v2/scraped")}
              >
                {t("jobsV2.admin.scrapedQueue", "Scraped queue")}
              </HeaderActionButton>
              {/* The page guide anchors its "Jobs reports" step here. `HeaderActionButton` takes
                  no `data-tour-id`, and a step whose target is missing collapses to a centred
                  card pointing at nothing, so the id lives on the wrapper. */}
              <Box data-tour-id="jobs-v2-reports" sx={{ display: "inline-flex" }}>
                <HeaderActionButton
                  icon="mdi:chart-box-outline"
                  variant="ghost"
                  onClick={() => router.push("/admin/jobs-v2/reports")}
                >
                  {t("jobsV2.admin.reports", "Reports")}
                </HeaderActionButton>
              </Box>
              <HeaderActionButton
                icon="mdi:plus"
                onClick={() => router.push("/admin/jobs-v2/new")}
              >
                {t("jobsV2.admin.createJob", "Create job")}
              </HeaderActionButton>
            </Box>
          }
        />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {loading ? (
            <HairlineStripSkeleton columns={5} />
          ) : loadError ? (
            // A strip of zeroes over a failed fetch would be the same lie the empty state used
            // to tell. It stays away until there are real numbers behind it.
            null
          ) : (
            <HairlineStrip
              items={stripItems}
              ariaLabel={t("jobsV2.admin.stripLabel", "Job counts and quick filters") as string}
              data-tour-id="jobs-v2-stats"
            />
          )}

          <JobsToolbar
            searchInput={searchInput}
            onSearchInput={setSearchInput}
            onSearchSubmit={(value) => patchFilters({ search: value.trim() })}
            state={filters}
            onChange={patchFilters}
            onClearFilters={() => {
              setSearchInput("");
              setFilters((prev) => ({ ...JOBS_FILTER_DEFAULTS, sort: prev.sort }));
              setPage(1);
            }}
            busy={refetching}
          />

          <Box>
            <JobsBulkActions
              selectedIds={Array.from(selection.selected)}
              rows={pageRows}
              onClear={selection.clear}
              onDone={handleBulkDone}
            />

            <JobsTable
              rows={pageRows}
              loading={loading}
              refetching={refetching}
              error={loadError}
              onRetry={loadJobs}
              isFiltered={isFiltered}
              empty={
                <EmptyState
                  variant="page"
                  illustration={<EmptyJobsIllustration width={140} height={116} />}
                  title={t("jobsV2.admin.emptyTitle", "No jobs yet") as string}
                  body={
                    t(
                      "jobsV2.admin.emptyBody",
                      "Create your first job to start receiving applications from students.",
                    ) as string
                  }
                  primaryAction={
                    <JButton variant="primary" href="/admin/jobs-v2/new" startIcon="mdi:plus">
                      {t("jobsV2.admin.createJob", "Create job")}
                    </JButton>
                  }
                />
              }
              emptyFiltered={
                <EmptyState
                  variant="page"
                  icon="mdi:filter-remove-outline"
                  title={
                    t("jobsV2.admin.emptyFilteredTitle", "No jobs match these filters") as string
                  }
                  body={
                    t(
                      "jobsV2.admin.emptyFilteredBody",
                      "You have {{total}} jobs in total. Widen the search or clear the filters to see them.",
                      { total: formatCount(jobs.length) },
                    ) as string
                  }
                  primaryAction={
                    <JButton
                      variant="secondary"
                      startIcon="mdi:close"
                      onClick={() => {
                        setSearchInput("");
                        setFilters((prev) => ({ ...JOBS_FILTER_DEFAULTS, sort: prev.sort }));
                        setPage(1);
                      }}
                    >
                      {t("jobsV2.empty.clearFilters")}
                    </JButton>
                  }
                />
              }
              selection={{
                selectedIds: selection.selected,
                onChange: (next) => selection.set(Array.from(next) as number[]),
                selectableIds: pageIds,
              }}
              sort={{
                key: sortKey,
                dir: sortDir,
                onSort: (key, dir) => {
                  setSortKey(key);
                  setSortDir(dir);
                  setPage(1);
                },
              }}
              updatingIds={updatingIds}
              rowErrors={rowErrors}
              onStatusChange={handleStatusChange}
              onOpenMenu={(el, job) => setMenuAnchor({ el, job })}
            />

            {!loading && !loadError && visible.length > 0 && (
              <JPagination
                page={safePage}
                pageCount={pageCount}
                total={visible.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
                sizes={PAGE_SIZES}
                totalHint={
                  isFiltered && visible.length !== jobs.length
                    ? (t("jobsV2.admin.ofTotal", "{{total}} in total", {
                        total: formatCount(jobs.length),
                      }) as string)
                    : undefined
                }
              />
            )}
          </Box>
        </Box>

        <Menu
          anchorEl={menuAnchor?.el ?? null}
          open={Boolean(menuAnchor)}
          onClose={closeMenu}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{ paper: { sx: { minWidth: 200, mt: 1, bgcolor: J.surface } } }}
        >
          <MenuItem
            onClick={() => {
              if (menuAnchor) router.push(`/admin/jobs-v2/${menuAnchor.job.id}/edit`);
              closeMenu();
            }}
          >
            <ListItemIcon>
              <IconWrapper icon="mdi:pencil" size={18} />
            </ListItemIcon>
            <ListItemText>{t("jobsV2.admin.menu.edit", "Edit")}</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (menuAnchor) router.push(`/admin/jobs-v2/${menuAnchor.job.id}/applications`);
              closeMenu();
            }}
          >
            <ListItemIcon>
              <IconWrapper icon="mdi:account-group" size={18} />
            </ListItemIcon>
            <ListItemText>{t("jobsV2.admin.menu.applications", "Applications")}</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (menuAnchor) setDeleteConfirm(menuAnchor.job);
              closeMenu();
            }}
            sx={{ color: J.dangerFg }}
          >
            <ListItemIcon sx={{ color: J.dangerFg }}>
              <IconWrapper icon="mdi:delete-outline" size={18} />
            </ListItemIcon>
            <ListItemText>{t("jobsV2.admin.menu.delete", "Delete")}</ListItemText>
          </MenuItem>
        </Menu>

        <JConfirm
          open={Boolean(deleteConfirm)}
          tone="danger"
          title={t("jobsV2.admin.deleteTitle", "Delete this job?") as string}
          body={
            deleteConfirm
              ? (t("jobsV2.admin.deleteBody", 'You are about to delete "{{title}}".', {
                  title: deleteConfirm.job_title,
                }) as string)
              : undefined
          }
          consequences={
            deleteConfirm
              ? [
                  t("jobsV2.admin.deleteConsequenceApplicants", {
                    defaultValue: "{{count}} applicants lose access to this posting.",
                    count: formatCount(deleteConfirm.applications_count ?? 0),
                  }) as string,
                  t("jobsV2.bulk.consequenceIrreversible") as string,
                ]
              : undefined
          }
          confirmLabel={t("jobsV2.admin.menu.delete", "Delete") as string}
          cancelLabel={t("jobsV2.modal.cancel") as string}
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      </JobsScope>
    </PageShell>
  );
}
