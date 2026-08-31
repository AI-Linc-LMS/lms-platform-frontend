"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader, HeaderActionButton } from "@/components/common/ModulePageHeader";
import { useToast } from "@/components/common/Toast";
import { ResumeUrlPreviewModal } from "@/components/admin/ResumeUrlPreviewModal";
import { adminJobsV2Service } from "@/lib/services/admin/admin-jobs-v2.service";
import type { JobApplicationV2, JobV2 } from "@/lib/services/jobs-v2.service";
import { config } from "@/lib/config";
import { formatCount, formatDate } from "@/lib/jobs-v2/format";
import { useSelection } from "@/lib/jobs-v2/useSelection";
import { useSeq } from "@/lib/jobs-v2/useSeq";
import { ApplicationsIllustration } from "@/components/jobs-v2/illustrations";
import {
  ActiveFilters,
  APP_STATUS,
  APP_STATUS_ORDER,
  BulkActionBar,
  EmptyState,
  ErrorState,
  FilterBar,
  FilterPopover,
  HairlineStrip,
  J,
  JButton,
  JCheckGroup,
  JConfirm,
  JPagination,
  JSelect,
  JTextField,
  JobsScope,
  SearchInput,
  Toolbar,
  TYPE,
  type AppStatus,
  type BulkAction,
  type BulkId,
  type BulkOutcome,
  type StripItem,
} from "@/components/jobs-v2/ui";
import { ApplicationsTable } from "@/components/admin/jobs-v2/applications/ApplicationsTable";
import {
  CandidateModal,
  type CandidateUpdates,
} from "@/components/admin/jobs-v2/applications/CandidateModal";
import {
  furthestStageIndex,
  nextStage,
  PIPELINE_STAGES,
} from "@/components/admin/jobs-v2/applications/PipelineRail";

type SortKey = "candidate" | "status" | "applied_at";

const PAGE_SIZES = [20, 50, 100];

/** Run `task` over `items` with a small concurrency cap, collecting per-item outcomes. */
async function runPool<T>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<void>,
): Promise<{ ok: number; failed: Array<{ item: T; reason: string }> }> {
  let cursor = 0;
  let ok = 0;
  const failed: Array<{ item: T; reason: string }> = [];
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;
      try {
        await task(item);
        ok += 1;
      } catch (err) {
        failed.push({ item, reason: (err as Error)?.message ?? "" });
      }
    }
  });
  await Promise.all(workers);
  return { ok, failed };
}

export default function JobApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation("common");
  const seq = useSeq();

  const raw = params?.id;
  const jobId = Number(Array.isArray(raw) ? raw[0] : raw);

  const [job, setJob] = useState<JobV2 | null>(null);
  const [applications, setApplications] = useState<JobApplicationV2[]>([]);
  const [listCount, setListCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  /**
   * The counts NEVER depend on the active filter. `statusCounts` used to be derived from the
   * server-FILTERED response, so clicking "Shortlisted: 12" made every other pill read 0 and
   * dropped the headline to the filtered subset.
   */
  const [unfiltered, setUnfiltered] = useState<JobApplicationV2[] | null>(null);
  const [unfilteredTotal, setUnfilteredTotal] = useState(0);
  const [countsError, setCountsError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("applied_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);

  const [detailApp, setDetailApp] = useState<JobApplicationV2 | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});

  const [bulkStatus, setBulkStatus] = useState<AppStatus>("shortlisted");
  const [rejectReason, setRejectReason] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const firstLoadDone = useRef(false);

  /* ---- loading ---------------------------------------------------------- */
  const loadJob = useCallback(async () => {
    if (!jobId || Number.isNaN(jobId)) return;
    try {
      setJob(await adminJobsV2Service.getJob(jobId, config.clientId));
    } catch {
      // The job header is a nicety; the applicant list is the screen. A failure here degrades
      // the title to the one carried on the applications themselves.
      setJob(null);
    }
  }, [jobId]);

  const loadUnfiltered = useCallback(async () => {
    if (!jobId || Number.isNaN(jobId)) return;
    setCountsError(null);
    try {
      const data = await adminJobsV2Service.getJobApplications(jobId, config.clientId);
      setUnfiltered(data.results ?? []);
      setUnfilteredTotal(data.count ?? (data.results ?? []).length);
    } catch (err) {
      setCountsError((err as Error)?.message ?? (t("jobsV2.error.body") as string));
    }
  }, [jobId, t]);

  const loadApplications = useCallback(
    async (status: string, isFirst: boolean) => {
      if (!jobId || Number.isNaN(jobId)) return;
      const token = seq.next();
      if (isFirst) setLoading(true);
      else setRefetching(true);
      setLoadError(null);
      try {
        const data = await adminJobsV2Service.getJobApplications(jobId, config.clientId, {
          status: status || undefined,
        });
        if (!seq.isCurrent(token)) return;
        setApplications(data.results ?? []);
        setListCount(data.count ?? (data.results ?? []).length);
        if (!status) {
          // No filter means this response IS the unfiltered one — no second request needed.
          setUnfiltered(data.results ?? []);
          setUnfilteredTotal(data.count ?? (data.results ?? []).length);
          setCountsError(null);
        }
      } catch (err) {
        if (!seq.isCurrent(token)) return;
        // A catch may NEVER `setApplications([])`: a failed load must not render
        // "No applications yet", the most alarming false negative on this screen.
        setLoadError((err as Error)?.message ?? (t("jobsV2.error.body") as string));
      } finally {
        if (seq.isCurrent(token)) {
          setLoading(false);
          setRefetching(false);
        }
      }
    },
    [jobId, seq, t],
  );

  useEffect(() => {
    void loadJob();
  }, [loadJob]);

  useEffect(() => {
    const isFirst = !firstLoadDone.current;
    firstLoadDone.current = true;
    void loadApplications(statusFilter, isFirst);
    if (statusFilter) void loadUnfiltered();
  }, [loadApplications, loadUnfiltered, statusFilter]);

  /* ---- derived ---------------------------------------------------------- */
  const counts = useMemo(() => {
    const base: Record<string, number> = {};
    APP_STATUS_ORDER.forEach((status) => {
      base[status] = 0;
    });
    (unfiltered ?? []).forEach((app) => {
      base[app.status] = (base[app.status] ?? 0) + 1;
    });
    return base;
  }, [unfiltered]);

  const filtered = useMemo(() => {
    let list = applications;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          (a.student_name ?? "").toLowerCase().includes(q) ||
          (a.student_email ?? "").toLowerCase().includes(q) ||
          (a.student_college ?? "").toLowerCase().includes(q) ||
          (a.student_phone ?? "").includes(q),
      );
    }
    if (stageFilter.length > 0) {
      list = list.filter((a) => {
        const index = furthestStageIndex(a);
        const key = index === -1 ? "none" : PIPELINE_STAGES[index].field;
        return stageFilter.includes(key);
      });
    }
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "applied_at") {
        cmp = new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
      } else if (sortKey === "candidate") {
        cmp = (a.student_name ?? "").localeCompare(b.student_name ?? "");
      } else {
        cmp = (a.status ?? "").localeCompare(b.status ?? "");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [applications, query, sortDir, sortKey, stageFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, pageSize, safePage],
  );

  const pageIds = useMemo(() => pageRows.map((a) => a.id), [pageRows]);

  const selection = useSelection<number>({
    ids: pageIds,
    // Selection clears on any query change, so a bulk action can never hit a row the operator
    // can no longer see.
    deps: [statusFilter, query, stageFilter.join(","), safePage, pageSize],
  });

  const isFiltered = Boolean(statusFilter || query.trim() || stageFilter.length);

  const clearAll = useCallback(() => {
    setStatusFilter("");
    setSearchInput("");
    setQuery("");
    setStageFilter([]);
    setPage(1);
  }, []);

  const strip = useMemo<StripItem[]>(
    () =>
      APP_STATUS_ORDER.map((status) => ({
        key: status,
        label: t(APP_STATUS[status].labelKey) as string,
        value: unfiltered ? formatCount(counts[status] ?? 0) : "—",
        hint: countsError
          ? (t("jobsV2.detail.countsUnavailable", "Could not be counted") as string)
          : undefined,
        tone: APP_STATUS[status].fg,
        active: statusFilter === status,
        onClick: () => {
          setStatusFilter((prev) => (prev === status ? "" : status));
          setPage(1);
        },
      })),
    [counts, countsError, statusFilter, t, unfiltered],
  );

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];
    if (statusFilter) {
      chips.push({
        key: "status",
        label: t(
          APP_STATUS[statusFilter as AppStatus]?.labelKey ?? "jobsV2.status.unknown",
        ) as string,
        onRemove: () => setStatusFilter(""),
      });
    }
    if (query.trim()) {
      chips.push({
        key: "q",
        label: query,
        onRemove: () => {
          setSearchInput("");
          setQuery("");
        },
      });
    }
    stageFilter.forEach((stage) => {
      const meta = PIPELINE_STAGES.find((s) => s.field === stage);
      chips.push({
        key: `stage-${stage}`,
        label: meta
          ? (t(meta.labelKey, meta.fallback) as string)
          : (t("jobsV2.pipeline.notStarted", "Not started") as string),
        onRemove: () => setStageFilter((prev) => prev.filter((s) => s !== stage)),
      });
    });
    return chips;
  }, [query, stageFilter, statusFilter, t]);

  /* ---- single-row mutation ---------------------------------------------- */
  const markUpdating = useCallback((id: number, busy: boolean) => {
    setUpdatingIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const applyLocally = useCallback((id: number, patch: Partial<JobApplicationV2>) => {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    setUnfiltered((prev) => prev?.map((a) => (a.id === id ? { ...a, ...patch } : a)) ?? prev);
    setDetailApp((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  }, []);

  const handleStatusChange = useCallback(
    async (app: JobApplicationV2, status: string) => {
      const previous = app.status;
      // Optimistic on THIS row only; every other row stays enabled. No `loadApplications()`
      // with `setLoading(true)`, which replaced the table with a spinner and lost scroll.
      applyLocally(app.id, { status: status as JobApplicationV2["status"] });
      markUpdating(app.id, true);
      setRowErrors((prev) => {
        const next = { ...prev };
        delete next[app.id];
        return next;
      });
      try {
        await adminJobsV2Service.updateApplicationStatus(
          app.id,
          { status: status as JobApplicationV2["status"] },
          config.clientId,
        );
      } catch (err) {
        applyLocally(app.id, { status: previous });
        setRowErrors((prev) => ({
          ...prev,
          [app.id]: (err as Error)?.message ?? (t("jobsV2.error.body") as string),
        }));
      } finally {
        markUpdating(app.id, false);
      }
    },
    [applyLocally, markUpdating, t],
  );

  const handleSaveCandidate = useCallback(
    async (id: number, updates: CandidateUpdates) => {
      await adminJobsV2Service.updateApplicationStatus(id, updates, config.clientId);
      applyLocally(id, updates as Partial<JobApplicationV2>);
      showToast(t("jobsV2.candidate.saved", "Candidate updated") as string, "success");
    },
    [applyLocally, showToast, t],
  );

  /* ---- bulk ------------------------------------------------------------- */
  const selectedApps = useMemo(
    () => filtered.filter((a) => selection.selected.has(a.id)),
    [filtered, selection.selected],
  );

  const bulkChangeStatus = useCallback(async (): Promise<BulkOutcome> => {
    const ids = selectedApps.map((a) => a.id);
    try {
      // ONE request. Two sequential requests behind one button is what the spec split apart.
      await adminJobsV2Service.bulkUpdateApplicationStatus(ids, bulkStatus, config.clientId);
      ids.forEach((id) => applyLocally(id, { status: bulkStatus }));
      selection.clear();
      return { ok: ids.length, failed: [] };
    } catch (err) {
      return {
        ok: 0,
        failed: selectedApps.map((a) => ({
          id: a.id as BulkId,
          title: a.student_name || a.student_email,
          reason: (err as Error)?.message ?? (t("jobsV2.error.body") as string),
        })),
      };
    }
  }, [applyLocally, bulkStatus, selectedApps, selection, t]);

  const bulkAdvanceStage = useCallback(
    async (failedIds?: BulkId[]): Promise<BulkOutcome> => {
      const targets = failedIds
        ? selectedApps.filter((a) => failedIds.includes(a.id))
        : selectedApps;
      const failed: BulkOutcome["failed"] = [];
      const advanceable = targets.filter((app) => {
        if (nextStage(app)) return true;
        failed.push({
          id: app.id,
          title: app.student_name || app.student_email,
          reason: t("jobsV2.bulkPipeline.alreadyFinal", "Already at the final stage") as string,
        });
        return false;
      });

      const result = await runPool(advanceable, 4, async (app) => {
        const stage = nextStage(app);
        if (!stage) return;
        await adminJobsV2Service.updateApplicationStatus(
          app.id,
          { [stage.field]: stage.advanceValue },
          config.clientId,
        );
        applyLocally(app.id, { [stage.field]: stage.advanceValue } as Partial<JobApplicationV2>);
      });

      result.failed.forEach(({ item, reason }) =>
        failed.push({
          id: item.id,
          title: item.student_name || item.student_email,
          reason: reason || (t("jobsV2.error.body") as string),
        }),
      );

      if (result.ok > 0) selection.clear();
      return { ok: result.ok, failed };
    },
    [applyLocally, selectedApps, selection, t],
  );

  const bulkReject = useCallback(async (): Promise<BulkOutcome> => {
    const reason = rejectReason.trim();
    const ids = selectedApps.map((a) => a.id);
    if (!reason) {
      // With no reason the single bulk endpoint does it in ONE request.
      try {
        await adminJobsV2Service.bulkUpdateApplicationStatus(ids, "rejected", config.clientId);
        ids.forEach((id) => applyLocally(id, { status: "rejected" }));
        selection.clear();
        return { ok: ids.length, failed: [] };
      } catch (err) {
        return {
          ok: 0,
          failed: selectedApps.map((a) => ({
            id: a.id as BulkId,
            title: a.student_name || a.student_email,
            reason: (err as Error)?.message ?? (t("jobsV2.error.body") as string),
          })),
        };
      }
    }
    const result = await runPool(selectedApps, 4, async (app) => {
      await adminJobsV2Service.updateApplicationStatus(
        app.id,
        { status: "rejected", reason_not_shortlisted: reason },
        config.clientId,
      );
      applyLocally(app.id, { status: "rejected", reason_not_shortlisted: reason });
    });
    if (result.ok > 0) selection.clear();
    return {
      ok: result.ok,
      failed: result.failed.map(({ item, reason: why }) => ({
        id: item.id as BulkId,
        title: item.student_name || item.student_email,
        reason: why || (t("jobsV2.error.body") as string),
      })),
    };
  }, [applyLocally, rejectReason, selectedApps, selection, t]);

  /** Exactly what "Advance stage" will write, per stage, before it writes it. */
  const advanceSummary = useMemo(() => {
    const grouped = new Map<string, number>();
    let terminal = 0;
    selectedApps.forEach((app) => {
      const stage = nextStage(app);
      if (!stage) {
        terminal += 1;
        return;
      }
      const label = `${t(stage.labelKey, stage.fallback)} · ${stage.advanceValue}`;
      grouped.set(label, (grouped.get(label) ?? 0) + 1);
    });
    const lines = Array.from(grouped.entries()).map(
      ([label, count]) =>
        t("jobsV2.bulkPipeline.moveTo", "{{count}} candidate(s) are marked {{stage}}", {
          count,
          stage: label,
        }) as string,
    );
    if (terminal > 0) {
      lines.push(
        t(
          "jobsV2.bulkPipeline.terminalSkipped",
          "{{count}} candidate(s) are already at the final stage and are skipped",
          { count: terminal },
        ) as string,
      );
    }
    return lines;
  }, [selectedApps, t]);

  const noop = useCallback(async (): Promise<BulkOutcome> => ({ ok: 0, failed: [] }), []);

  const bulkActions: BulkAction[] = [
    {
      // A control, not a button: `render` replaces the button entirely, so the bar carries the
      // target status the "Change status" action then applies in one request.
      key: "status-picker",
      label: "",
      icon: "",
      render: (
        <Box sx={{ minWidth: 200 }}>
          <JSelect
            id="bulk-status"
            label={t("jobsV2.bulkPipeline.moveToLabel", "Move to") as string}
            value={bulkStatus}
            onChange={(value) => setBulkStatus(value as AppStatus)}
            dense
            options={APP_STATUS_ORDER.map((status) => ({
              value: status,
              label: t(APP_STATUS[status].labelKey) as string,
              icon: APP_STATUS[status].icon,
              tone: APP_STATUS[status].fg,
            }))}
          />
        </Box>
      ),
      onRun: noop,
      confirm: { title: "", consequences: [] },
    },
    {
      key: "change-status",
      label: t("jobsV2.bulkPipeline.changeStatus", "Change status") as string,
      icon: "mdi:swap-horizontal",
      onRun: bulkChangeStatus,
      confirm: {
        title: t("jobsV2.bulkPipeline.confirmStatusTitle", "Move {{count}} applicant(s)?", {
          count: selectedApps.length,
        }) as string,
        consequences: [
          t("jobsV2.bulk.consequenceApplicants", {
            count: selectedApps.length,
            status: t(APP_STATUS[bulkStatus].labelKey),
          }) as string,
        ],
      },
    },
    {
      key: "advance-stage",
      label: t("jobsV2.bulkPipeline.advance", "Advance stage") as string,
      icon: "mdi:skip-next-outline",
      onRun: bulkAdvanceStage,
      confirm: {
        title: t("jobsV2.bulkPipeline.confirmAdvanceTitle", "Advance {{count}} applicant(s)?", {
          count: selectedApps.length,
        }) as string,
        body: t(
          "jobsV2.bulkPipeline.confirmAdvanceBody",
          "Each candidate's next empty pipeline stage is marked as cleared. Nothing already recorded is overwritten.",
        ) as string,
        consequences: advanceSummary,
      },
    },
    {
      key: "reject-reason",
      label: "",
      icon: "",
      render: (
        <Box sx={{ minWidth: 220 }}>
          <JTextField
            id="bulk-reject-reason"
            label={t("jobsV2.bulkPipeline.reasonLabel", "Rejection reason") as string}
            value={rejectReason}
            onChange={setRejectReason}
            dense
            placeholder={
              t("jobsV2.bulkPipeline.reasonPlaceholder", "Optional, shown to the learner") as string
            }
          />
        </Box>
      ),
      onRun: noop,
      confirm: { title: "", consequences: [] },
    },
    {
      key: "reject",
      label: t("jobsV2.bulkPipeline.reject", "Reject with reason") as string,
      icon: "mdi:close-circle-outline",
      tone: "danger",
      onRun: bulkReject,
      confirm: {
        title: t("jobsV2.bulkPipeline.confirmRejectTitle", "Reject {{count}} applicant(s)?", {
          count: selectedApps.length,
        }) as string,
        consequences: [
          t("jobsV2.bulk.consequenceApplicants", {
            count: selectedApps.length,
            status: t("jobsV2.appStatus.rejected"),
          }) as string,
          rejectReason.trim()
            ? (t("jobsV2.bulkPipeline.reasonShown", 'Each of them sees the reason "{{reason}}"', {
                reason: rejectReason.trim(),
              }) as string)
            : (t(
                "jobsV2.bulkPipeline.noReasonShown",
                "No reason is recorded, so the learner is told only that they were not selected",
              ) as string),
          t("jobsV2.bulk.consequenceIrreversible") as string,
        ],
      },
    },
  ];

  /* ---- export ----------------------------------------------------------- */
  const handleExport = useCallback(async () => {
    setExportOpen(false);
    setExporting(true);
    try {
      // The service takes job_id and status. The status the operator can SEE is passed through,
      // so the file matches the screen as far as the endpoint allows — and the confirm above
      // says plainly what it cannot do.
      await adminJobsV2Service.downloadExportReport({
        job_id: jobId,
        status: statusFilter || undefined,
      });
      showToast(t("jobsV2.export.started", "The CSV download has started") as string, "success");
    } catch (err) {
      showToast((err as Error)?.message ?? (t("jobsV2.error.body") as string), "error");
    } finally {
      setExporting(false);
    }
  }, [jobId, showToast, statusFilter, t]);

  const jobTitle = (job?.job_title ??
    applications[0]?.job_title ??
    t("jobsV2.title")) as string;
  const companyName = job?.company_name ?? applications[0]?.company_name ?? "";

  const detailIndex = detailApp ? pageRows.findIndex((a) => a.id === detailApp.id) : -1;

  return (
    <PageShell>
      <JobsScope surface="admin">
        <ModulePageHeader
          eyebrow={t("jobsV2.pipeline.eyebrow", "Applicants") as string}
          title={jobTitle}
          description={[
            companyName,
            job?.location,
            job?.number_of_openings != null
              ? (t("jobsV2.detail.openings", "{{count}} opening(s)", {
                  count: job.number_of_openings,
                }) as string)
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
          accent="azure"
          icon="mdi:account-group-outline"
          action={
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <HeaderActionButton
                variant="ghost"
                icon="mdi:briefcase-outline"
                onClick={() => router.push(`/admin/jobs-v2/${jobId}`)}
              >
                {t("jobsV2.detail.viewJob", "View job")}
              </HeaderActionButton>
              <HeaderActionButton
                variant="ghost"
                icon="mdi:file-download-outline"
                onClick={() => setExportOpen(true)}
                disabled={exporting}
              >
                {t("jobsV2.export.cta", "Export CSV")}
              </HeaderActionButton>
            </Box>
          }
        />

        {/* The standard breadcrumb strip. The hand-built row of <Button>s separated by literal
            "/" <Typography>s — with the job title as a Button styled like a link but sized like
            a button — is gone. */}
        <Box
          component="nav"
          aria-label={t("jobsV2.detail.breadcrumb", "Breadcrumb") as string}
          sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 2, flexWrap: "wrap" }}
        >
          <JButton variant="quiet" size="sm" href="/admin/jobs-v2" startIcon="mdi:arrow-left">
            {t("jobsV2.admin.jobs", "Jobs")}
          </JButton>
          <Typography aria-hidden sx={{ ...TYPE.micro, color: J.ink4 }}>
            /
          </Typography>
          <JButton variant="quiet" size="sm" href={`/admin/jobs-v2/${jobId}`}>
            {jobTitle}
          </JButton>
          <Typography aria-hidden sx={{ ...TYPE.micro, color: J.ink4 }}>
            /
          </Typography>
          <Typography sx={{ ...TYPE.micro, color: J.ink2 }}>
            {t("jobsV2.candidate.applications", "Applications")}
          </Typography>
        </Box>

        {/* Six counts, each a filter toggle. The separate 140px "Status" Select is DELETED:
            two controls bound to one `statusFilter` that could appear to disagree was the
            toolbar's core problem. */}
        <HairlineStrip
          items={strip}
          ariaLabel={t("jobsV2.candidate.stripLabel", "Filter by application status") as string}
          sx={{ mb: 3 }}
        />

        {countsError && (
          <ErrorState
            variant="inline"
            error={countsError}
            title={t("jobsV2.candidate.countsErrorTitle", "The pipeline counts are out of date")}
            body={t(
              "jobsV2.candidate.countsErrorBody",
              "The list below is correct; only the totals above could not be refreshed.",
            )}
            onRetry={() => void loadUnfiltered()}
            sx={{ mb: 2 }}
          />
        )}

        <Toolbar
          start={
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={(value) => {
                setQuery(value);
                setPage(1);
              }}
              ariaLabel={
                t("jobsV2.candidate.search", "Search by name, email, college or phone") as string
              }
              placeholder={
                t("jobsV2.candidate.search", "Search by name, email, college or phone") as string
              }
              maxWidth={360}
            />
          }
          end={
            <JSelect
              id="applications-sort"
              value={`${sortKey}:${sortDir}`}
              onChange={(value) => {
                const [key, dir] = value.split(":");
                setSortKey(key as SortKey);
                setSortDir(dir as "asc" | "desc");
              }}
              fullWidth={false}
              options={[
                {
                  value: "applied_at:desc",
                  label: t("jobsV2.candidate.sortNewest", "Newest first") as string,
                },
                {
                  value: "applied_at:asc",
                  label: t("jobsV2.candidate.sortOldest", "Oldest first") as string,
                },
                {
                  value: "candidate:asc",
                  label: t("jobsV2.candidate.sortNameAsc", "Name A-Z") as string,
                },
                {
                  value: "candidate:desc",
                  label: t("jobsV2.candidate.sortNameDesc", "Name Z-A") as string,
                },
                { value: "status:asc", label: t("jobsV2.candidate.sortStatus", "Status") as string },
              ]}
              sx={{ minWidth: 200 }}
            />
          }
        >
          <FilterBar>
            <FilterPopover
              label={t("jobsV2.candidate.pipeline", "Pipeline") as string}
              icon="mdi:stairs-up"
              badge={stageFilter.length || undefined}
              active={stageFilter.length > 0}
              onClear={() => setStageFilter([])}
            >
              <JCheckGroup
                id="stage-filter"
                label={t("jobsV2.candidate.stageFilterLabel", "Furthest stage reached") as string}
                values={stageFilter}
                onChange={(values) => {
                  setStageFilter(values);
                  setPage(1);
                }}
                options={[
                  {
                    value: "none",
                    label: t("jobsV2.pipeline.notStarted", "Not started") as string,
                  },
                  ...PIPELINE_STAGES.map((stage) => ({
                    value: stage.field,
                    label: t(stage.labelKey, stage.fallback) as string,
                  })),
                ]}
              />
            </FilterPopover>
          </FilterBar>
        </Toolbar>

        {activeChips.length > 0 && (
          <ActiveFilters chips={activeChips} onClearAll={clearAll} sx={{ mb: 2 }} />
        )}

        <BulkActionBar
          count={selection.count}
          noun={t("jobsV2.noun.candidate", { count: selection.count }) as string}
          onClear={selection.clear}
          actions={bulkActions}
        />

        <ApplicationsTable
          rows={pageRows}
          loading={loading}
          refetching={refetching}
          error={loadError}
          onRetry={() => void loadApplications(statusFilter, true)}
          isFiltered={isFiltered}
          selection={{
            selectedIds: selection.selected as Set<string | number>,
            onChange: (next) => selection.set(Array.from(next).map(Number)),
            selectableIds: pageIds,
          }}
          sort={{
            key: sortKey,
            dir: sortDir,
            onSort: (key, dir) => {
              setSortKey(key as SortKey);
              setSortDir(dir);
            },
          }}
          updatingIds={updatingIds}
          rowErrors={rowErrors}
          onOpen={setDetailApp}
          onOpenResume={setResumeUrl}
          onStatusChange={(app, status) => void handleStatusChange(app, status)}
          empty={
            <EmptyState
              variant="page"
              illustration={<ApplicationsIllustration width={140} height={110} />}
              title={t("jobsV2.empty.noCandidatesTitle")}
              body={t("jobsV2.empty.noCandidatesBody")}
              secondaryAction={
                <JButton variant="secondary" href={`/admin/jobs-v2/${jobId}`}>
                  {t("jobsV2.detail.viewJob", "View job")}
                </JButton>
              }
            />
          }
          emptyFiltered={
            <EmptyState
              variant="page"
              icon="mdi:filter-remove-outline"
              title={t("jobsV2.candidate.noMatchTitle", "No applicants match these filters")}
              body={
                t("jobsV2.candidate.noMatchBody", "There are {{total}} applicants on this job.", {
                  total: formatCount(unfilteredTotal),
                }) as string
              }
              primaryAction={
                <JButton variant="primary" onClick={clearAll}>
                  {t("jobsV2.empty.clearFilters")}
                </JButton>
              }
            />
          }
        />

        {filtered.length > 0 && (
          <JPagination
            page={safePage}
            pageCount={pageCount}
            total={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            sizes={PAGE_SIZES}
            totalHint={
              isFiltered
                ? (t("jobsV2.candidate.filteredHint", "filtered from {{total}} on this job", {
                    total: formatCount(listCount || unfilteredTotal),
                  }) as string)
                : undefined
            }
            sx={{ mt: 2 }}
          />
        )}

        <CandidateModal
          open={Boolean(detailApp)}
          app={detailApp}
          onClose={() => setDetailApp(null)}
          onSave={handleSaveCandidate}
          onOpenResume={setResumeUrl}
          hasPrev={detailIndex > 0}
          hasNext={detailIndex >= 0 && detailIndex < pageRows.length - 1}
          onPrev={() => {
            if (detailIndex > 0) setDetailApp(pageRows[detailIndex - 1]);
          }}
          onNext={() => {
            if (detailIndex >= 0 && detailIndex < pageRows.length - 1) {
              setDetailApp(pageRows[detailIndex + 1]);
            }
          }}
          position={
            detailIndex >= 0 ? { index: detailIndex + 1, total: pageRows.length } : undefined
          }
        />

        {/* Stacked OVER the candidate modal, which stays open behind it. Opening a resume no
            longer discards seven Selects and two text fields. */}
        <ResumeUrlPreviewModal
          open={Boolean(resumeUrl)}
          onClose={() => setResumeUrl(null)}
          resumeUrl={resumeUrl}
          resumeName={t("jobsV2.candidate.resume", "Resume") as string}
        />

        <JConfirm
          open={exportOpen}
          icon="mdi:file-download-outline"
          title={t("jobsV2.export.confirmTitle", "Export this job's applicants?") as string}
          body={
            t(
              "jobsV2.export.confirmBody",
              "A CSV downloads to this device. The export runs on the server, so it honours the status filter but not the text search.",
            ) as string
          }
          consequences={[
            statusFilter
              ? (t(
                  "jobsV2.export.consequenceFiltered",
                  "Exporting {{count}} {{status}} applicant(s)",
                  {
                    count: counts[statusFilter] ?? 0,
                    status: t(
                      APP_STATUS[statusFilter as AppStatus]?.labelKey ?? "jobsV2.status.unknown",
                    ),
                  },
                ) as string)
              : (t("jobsV2.export.consequenceAll", "Exporting all {{count}} applicant(s)", {
                  count: unfilteredTotal,
                }) as string),
            query.trim()
              ? (t(
                  "jobsV2.export.consequenceSearchIgnored",
                  'The search "{{query}}" is NOT applied to the file',
                  { query: query.trim() },
                ) as string)
              : (t("jobsV2.export.consequenceDate", "Generated {{date}}", {
                  date: formatDate(new Date(), { withTime: true }),
                }) as string),
          ]}
          confirmLabel={t("jobsV2.export.cta", "Export CSV") as string}
          onConfirm={() => void handleExport()}
          onCancel={() => setExportOpen(false)}
          busy={exporting}
        />
      </JobsScope>
    </PageShell>
  );
}
