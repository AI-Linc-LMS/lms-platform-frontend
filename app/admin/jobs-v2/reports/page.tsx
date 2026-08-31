"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import {
  DataTableSkeleton,
  EmptyState,
  ErrorState,
  HairlineStrip,
  HairlineStripSkeleton,
  J,
  JButton,
  JPagination,
  JobsScope,
  SearchInput,
  SectionHeader,
  Toolbar,
  TYPE,
  type StripItem,
} from "@/components/jobs-v2/ui";
import { ReportsIllustration } from "@/components/jobs-v2/illustrations";
import {
  ReportFunnel,
  aggregateApplications,
  emptyAggregate,
  median,
  mergeAggregates,
  type ApplicationsAggregate,
} from "@/components/admin/jobs-v2/reports/ReportFunnel";
import {
  ReportJobsTable,
  type ReportRow,
} from "@/components/admin/jobs-v2/reports/ReportJobsTable";
import { ExportModal } from "@/components/admin/jobs-v2/reports/ExportModal";
import { formatCount } from "@/lib/jobs-v2/format";
import { useSeq } from "@/lib/jobs-v2/useSeq";
import { adminJobsV2Service } from "@/lib/services/admin/admin-jobs-v2.service";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { config } from "@/lib/config";

const PAGE_SIZES = [10, 20, 50];
/** How many per-job application fetches run at once. Enough to be quick, few enough to be kind. */
const FANOUT = 4;

interface JobStatsEntry {
  stats: ApplicationsAggregate | null;
  error?: string;
}

function AdminJobsV2ReportsBody() {
  const { t } = useTranslation("common");
  const searchParams = useSearchParams();

  const [jobs, setJobs] = useState<JobV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statsById, setStatsById] = useState<Record<number, JobStatsEntry>>({});
  const [countingDone, setCountingDone] = useState(0);
  const [countingTotal, setCountingTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortKey, setSortKey] = useState("applicants");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[1]);
  const [scopedJobId, setScopedJobId] = useState<number | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const seq = useSeq();
  const statsSeq = useSeq();
  const defaultJobId = searchParams?.get("job_id") ?? "";

  // The deep link scopes the funnel too, not just the export form it used to prefill.
  useEffect(() => {
    if (defaultJobId) setScopedJobId(Number(defaultJobId));
  }, [defaultJobId]);

  /**
   * Fan out over the jobs and count their applications.
   *
   * A job whose payload already says it has zero applicants needs no request at all, so the
   * usual case is a handful of calls, not one per row. Failures are recorded **per job** and
   * surfaced as "n/a" with the reason — never as a zero, which would read as "nobody applied".
   */
  const loadStats = useCallback(
    async (list: JobV2[]) => {
      const token = statsSeq.next();
      const needsFetch = list.filter((job) => (job.applications_count ?? 0) > 0);
      const seeded: Record<number, JobStatsEntry> = {};
      for (const job of list) {
        if ((job.applications_count ?? 0) === 0) seeded[job.id] = { stats: emptyAggregate() };
      }
      setStatsById(seeded);
      setCountingTotal(needsFetch.length);
      setCountingDone(0);
      if (needsFetch.length === 0) return;

      let cursor = 0;
      const worker = async () => {
        for (;;) {
          const index = cursor;
          cursor += 1;
          if (index >= needsFetch.length) return;
          const job = needsFetch[index];
          try {
            const data = await adminJobsV2Service.getJobApplications(job.id, config.clientId);
            if (!statsSeq.isCurrent(token)) return;
            const stats = aggregateApplications(data.results ?? []);
            setStatsById((prev) => ({ ...prev, [job.id]: { stats } }));
          } catch (err) {
            if (!statsSeq.isCurrent(token)) return;
            setStatsById((prev) => ({
              ...prev,
              [job.id]: {
                stats: null,
                error:
                  (err as Error)?.message ??
                  (t("jobsV2.reports.countFailed", "Could not count this job") as string),
              },
            }));
          } finally {
            if (statsSeq.isCurrent(token)) setCountingDone((n) => n + 1);
          }
        }
      };
      await Promise.all(Array.from({ length: Math.min(FANOUT, needsFetch.length) }, worker));
    },
    [statsSeq, t],
  );

  const loadJobs = useCallback(async () => {
    const token = seq.next();
    setLoading(true);
    try {
      const data = await adminJobsV2Service.getJobs(config.clientId);
      if (!seq.isCurrent(token)) return;
      const list = data.results ?? [];
      setJobs(list);
      setLoadError(null);
      setLoading(false);
      // The shipped page swallowed this fetch's failure entirely (`catch { setJobs([]) }`, no
      // toast at all), so an outage read as "0 jobs" and an empty panel.
      loadStats(list);
    } catch (err) {
      if (!seq.isCurrent(token)) return;
      setLoadError((err as Error)?.message ?? (t("jobsV2.error.reportsTitle") as string));
      setLoading(false);
    }
  }, [loadStats, seq, t]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const counting = countingTotal > 0 && countingDone < countingTotal;

  /* ---- aggregates ---------------------------------------------------------- */

  const scopedJob = useMemo(
    () => (scopedJobId === null ? null : jobs.find((job) => job.id === scopedJobId) ?? null),
    [jobs, scopedJobId],
  );

  const scopedAggregate = useMemo(() => {
    if (scopedJobId !== null) return statsById[scopedJobId]?.stats ?? emptyAggregate();
    return mergeAggregates(
      Object.values(statsById)
        .map((entry) => entry.stats)
        .filter((stats): stats is ApplicationsAggregate => stats !== null),
    );
  }, [scopedJobId, statsById]);

  const boardAggregate = useMemo(
    () =>
      mergeAggregates(
        Object.values(statsById)
          .map((entry) => entry.stats)
          .filter((stats): stats is ApplicationsAggregate => stats !== null),
      ),
    [statsById],
  );

  /** Exact and instant: the list payload carries a lifetime applicant total per job. */
  const totalApplicants = useMemo(
    () => jobs.reduce((sum, job) => sum + (job.applications_count ?? 0), 0),
    [jobs],
  );

  const liveNow = useMemo(
    () => jobs.filter((job) => (job.status ?? "active") === "active" && job.is_published).length,
    [jobs],
  );

  const medianResponse = median(boardAggregate.responseDays);

  const stripItems = useMemo<StripItem[]>(
    () => [
      {
        key: "posted",
        label: t("jobsV2.reports.strip.posted", "Jobs posted") as string,
        value: formatCount(jobs.length),
      },
      {
        key: "live",
        label: t("jobsV2.reports.strip.live", "Live now") as string,
        value: formatCount(liveNow),
        tone: J.successFg,
        hint: t("jobsV2.reports.strip.liveHint", "Active and published") as string,
      },
      {
        key: "applicants",
        label: t("jobsV2.reports.strip.applicants", "Applicants") as string,
        value: formatCount(totalApplicants),
      },
      {
        key: "shortlisted",
        label: t("jobsV2.appStatus.shortlisted") as string,
        value: counting ? "…" : formatCount(boardAggregate.reached.shortlisted),
      },
      {
        key: "selected",
        label: t("jobsV2.appStatus.selected") as string,
        value: counting ? "…" : formatCount(boardAggregate.reached.selected),
        tone: J.successFg,
      },
      {
        key: "response",
        label: t("jobsV2.reports.strip.response", "Median days to reply") as string,
        // `null` means nobody has been moved yet. It renders as an em dash, never as "0 days",
        // which would read as instant replies.
        value: counting ? "…" : medianResponse === null ? "—" : formatCount(medianResponse),
        hint:
          medianResponse === null && !counting
            ? (t("jobsV2.reports.strip.responseNone", "Nothing moved yet") as string)
            : undefined,
      },
    ],
    [
      boardAggregate.reached.selected,
      boardAggregate.reached.shortlisted,
      counting,
      jobs.length,
      liveNow,
      medianResponse,
      t,
      totalApplicants,
    ],
  );

  /* ---- the table view ------------------------------------------------------- */

  const rows = useMemo<ReportRow[]>(() => {
    const needle = search.trim().toLowerCase();
    const filtered = jobs.filter((job) =>
      !needle
        ? true
        : [job.job_title, job.company_name].some((value) =>
            String(value ?? "").toLowerCase().includes(needle),
          ),
    );
    const dir = sortDir === "asc" ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "job":
          return a.job_title.localeCompare(b.job_title) * dir;
        case "status":
          return (a.status ?? "").localeCompare(b.status ?? "") * dir;
        case "closes": {
          const av = a.application_deadline ? new Date(a.application_deadline).getTime() : null;
          const bv = b.application_deadline ? new Date(b.application_deadline).getTime() : null;
          if (av === null && bv === null) return 0;
          if (av === null) return 1;
          if (bv === null) return -1;
          return (av - bv) * dir;
        }
        case "applicants":
        default:
          return ((a.applications_count ?? 0) - (b.applications_count ?? 0)) * dir;
      }
    });
    return sorted.map((job) => ({
      job,
      stats: statsById[job.id]?.stats ?? null,
      statsError: statsById[job.id]?.error,
    }));
  }, [jobs, search, sortDir, sortKey, statsById]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = useMemo(
    () => rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [pageSize, rows, safePage],
  );

  const estimateRef = useRef({ jobs, statsById });
  estimateRef.current = { jobs, statsById };

  /** Rows the CSV will hold for a given scope — from what has actually been counted. */
  const estimateRows = useCallback((jobId: string, status: string): number | null => {
    const { jobs: allJobs, statsById: all } = estimateRef.current;
    const scope = jobId ? allJobs.filter((job) => String(job.id) === jobId) : allJobs;
    if (!status) {
      return scope.reduce((sum, job) => sum + (job.applications_count ?? 0), 0);
    }
    let sum = 0;
    for (const job of scope) {
      const stats = all[job.id]?.stats;
      if (!stats) return null; // still counting, or a fetch failed: say so, do not guess.
      if (status === "applying") sum += stats.applying;
      else if (status === "rejected") sum += stats.rejected;
      else if (status === "selected") sum += stats.reached.selected;
      else if (status === "interview_stage") sum += stats.reached.interview_stage;
      else if (status === "shortlisted") sum += stats.reached.shortlisted;
      else sum += stats.reached.applied;
    }
    return sum;
  }, []);

  const scopeLabel = scopedJob
    ? scopedJob.job_title
    : (t("jobsV2.reports.allJobs", "all jobs") as string);

  return (
    <PageShell>
      <JobsScope surface="admin">
        <ModulePageHeader
          eyebrow={t("jobsV2.reports.eyebrow", "Reports") as string}
          title={t("jobsV2.reports.title", "Job reports") as string}
          description={
            t(
              "jobsV2.reports.description",
              "How many people applied, how far they got, and how long they waited for an answer.",
            ) as string
          }
          accent="azure"
          icon="mdi:chart-box-outline"
          action={
            <HeaderActionButton icon="mdi:file-download-outline" onClick={() => setExportOpen(true)}>
              {t("jobsV2.reports.export.cta", "Export CSV")}
            </HeaderActionButton>
          }
        />

        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <HairlineStripSkeleton columns={6} />
            <DataTableSkeleton columns={8} rows={8} />
          </Box>
        ) : loadError ? (
          <ErrorState
            variant="page"
            title={t("jobsV2.error.reportsTitle") as string}
            error={loadError}
            onRetry={loadJobs}
          />
        ) : jobs.length === 0 ? (
          <EmptyState
            variant="page"
            illustration={<ReportsIllustration width={160} height={125} />}
            title={t("jobsV2.reports.emptyTitle", "Nothing to report yet") as string}
            body={
              t(
                "jobsV2.reports.emptyBody",
                "Post your first job and this page fills in on its own: applicants, stages, conversion and response times.",
              ) as string
            }
            primaryAction={
              <JButton variant="primary" href="/admin/jobs-v2/new" startIcon="mdi:plus">
                {t("jobsV2.reports.createJob", "Create a job")}
              </JButton>
            }
          />
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
            <HairlineStrip
              items={stripItems}
              ariaLabel={t("jobsV2.reports.stripLabel", "Hiring totals") as string}
            />

            <Box component="section">
              <SectionHeader
                icon="mdi:filter-variant"
                title={t("jobsV2.reports.funnelTitle", "Applicant funnel") as string}
                description={
                  scopedJob
                    ? (t("jobsV2.reports.funnelScoped", "Scoped to {{title}}", {
                        title: scopedJob.job_title,
                      }) as string)
                    : (t("jobsV2.reports.funnelAll", "Across every job") as string)
                }
                action={
                  scopedJob ? (
                    <JButton
                      variant="quiet"
                      size="sm"
                      startIcon="mdi:close"
                      onClick={() => setScopedJobId(null)}
                    >
                      {t("jobsV2.reports.clearScope", "Show all jobs")}
                    </JButton>
                  ) : undefined
                }
              />
              <ReportFunnel
                aggregate={scopedAggregate}
                scopeLabel={scopeLabel}
                partial={counting}
              />
              {counting && (
                <Typography sx={{ ...TYPE.small, mt: 1 }} role="status" aria-live="polite">
                  {t("jobsV2.reports.counting.progress", "Counting applicants: {{done}} of {{total}} jobs", {
                    done: formatCount(countingDone),
                    total: formatCount(countingTotal),
                  })}
                </Typography>
              )}
            </Box>

            <Box component="section">
              <SectionHeader
                icon="mdi:table"
                title={t("jobsV2.reports.perJobTitle", "Every job") as string}
                count={rows.length}
                noun={t("jobsV2.noun.job", { count: rows.length }) as string}
              />
              <Toolbar
                sx={{ mb: 2 }}
                start={
                  <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: 240 }, maxWidth: 460 }}>
                    <SearchInput
                      value={searchInput}
                      onChange={setSearchInput}
                      onSubmit={(value) => {
                        setSearch(value);
                        setPage(1);
                      }}
                      ariaLabel={
                        t("jobsV2.reports.searchLabel", "Search jobs in this report") as string
                      }
                      placeholder={
                        t("jobsV2.reports.searchPlaceholder", "Search job or company") as string
                      }
                    />
                  </Box>
                }
              />
              <ReportJobsTable
                rows={pageRows}
                loading={false}
                error={null}
                onRetry={loadJobs}
                isFiltered={Boolean(search)}
                empty={
                  <EmptyState
                    variant="panel"
                    icon="mdi:briefcase-outline"
                    title={t("jobsV2.reports.emptyTitle", "Nothing to report yet") as string}
                    body={
                      t(
                        "jobsV2.reports.emptyBody",
                        "Post your first job and this page fills in on its own: applicants, stages, conversion and response times.",
                      ) as string
                    }
                    primaryAction={
                      <JButton variant="primary" href="/admin/jobs-v2/new" startIcon="mdi:plus">
                        {t("jobsV2.reports.createJob", "Create a job")}
                      </JButton>
                    }
                  />
                }
                emptyFiltered={
                  <EmptyState
                    variant="panel"
                    icon="mdi:filter-remove-outline"
                    title={t("jobsV2.empty.noResultsTitle") as string}
                    body={t("jobsV2.empty.noResultsBody") as string}
                    primaryAction={
                      <JButton
                        variant="secondary"
                        startIcon="mdi:close"
                        onClick={() => {
                          setSearchInput("");
                          setSearch("");
                          setPage(1);
                        }}
                      >
                        {t("jobsV2.empty.clearFilters")}
                      </JButton>
                    }
                  />
                }
                sort={{
                  key: sortKey,
                  dir: sortDir,
                  onSort: (key, dir) => {
                    setSortKey(key);
                    setSortDir(dir);
                    setPage(1);
                  },
                }}
                selectedJobId={scopedJobId}
                onSelectJob={setScopedJobId}
              />
              {rows.length > 0 && (
                <JPagination
                  page={safePage}
                  pageCount={pageCount}
                  total={rows.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                  }}
                  sizes={PAGE_SIZES}
                />
              )}
            </Box>
          </Box>
        )}

        <ExportModal
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          jobs={jobs}
          defaultJobId={defaultJobId}
          estimateRows={estimateRows}
        />
      </JobsScope>
    </PageShell>
  );
}

/**
 * `useSearchParams()` is wrapped in `<Suspense>` the way `new/page.tsx` deliberately does —
 * without it the whole route opts out of static rendering.
 */
export default function AdminJobsV2ReportsPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <JobsScope surface="admin">
            <HairlineStripSkeleton columns={6} />
            <Box sx={{ height: 24 }} />
            <DataTableSkeleton columns={8} rows={8} />
          </JobsScope>
        </PageShell>
      }
    >
      <AdminJobsV2ReportsBody />
    </Suspense>
  );
}
