"use client";

import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
} from "@mui/material";
import { useToast } from "@/components/common/Toast";
import { adminJobsV2Service } from "@/lib/services/admin/admin-jobs-v2.service";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { config } from "@/lib/config";
import { fetchAndMapExternalJsonJobs } from "@/lib/jobs/external-job-json-feed";
import {
  normalizeApplyLinkKey,
  isExternalJsonFeedJob,
  isExternalJsonJobAllowedOnStudentBoard,
  suppressExternalJsonJobsOnStudentBoard,
  unsuppressExternalJsonJobsOnStudentBoard,
  subscribeStudentFeedSuppression,
} from "@/lib/jobs/external-json-jobs-store";
import {
  ADMIN_PAGE_SIZE_OPTIONS,
  DEFAULT_ADMIN_PAGE_SIZE,
  getAdminJobsGridTemplateColumns,
  getShowAdminJobDateColumns,
  type AdminJobsTab,
} from "@/components/admin/jobs-v2/adminJobsGrid";
import {
  adminJobsBrowseCacheKey,
  getCachedAdminJobsList,
  setCachedAdminJobsList,
} from "@/lib/jobs/jobs-browse-cache";

export function useAdminJobsV2ListState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [platformJobs, setPlatformJobs] = useState<JobV2[]>([]);
  const [availableJobs, setAvailableJobs] = useState<JobV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [suppressionTick, setSuppressionTick] = useState(0);
  const [statusFilter, setStatusFilter] = useState<
    "active" | "inactive" | "closed" | "completed" | "on_hold" | ""
  >("");
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; job: JobV2 } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<JobV2 | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [bulkVisibility, setBulkVisibility] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const [availableSearchDraft, setAvailableSearchDraft] = useState("");
  const skipNextUrlSearchSync = useRef(false);

  const qFromUrl = searchParams.get("q") ?? "";

  const navigateToListPage = useCallback(
    (nextPage: number, opts?: { replace?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextPage <= 1) params.delete("page");
      else params.set("page", String(nextPage));
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (opts?.replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const pageFromQuery = useMemo(() => {
    const raw = searchParams.get("page");
    const p = raw ? parseInt(raw, 10) : 1;
    return Number.isFinite(p) && p >= 1 ? p : 1;
  }, [searchParams]);

  const pageSize = useMemo(() => {
    const raw = searchParams.get("page_size");
    const n = raw ? parseInt(raw, 10) : DEFAULT_ADMIN_PAGE_SIZE;
    if (!Number.isFinite(n)) return DEFAULT_ADMIN_PAGE_SIZE;
    return (ADMIN_PAGE_SIZE_OPTIONS as readonly number[]).includes(n)
      ? n
      : DEFAULT_ADMIN_PAGE_SIZE;
  }, [searchParams]);

  const adminTab = useMemo((): AdminJobsTab => {
    return searchParams.get("tab") === "available" ? "available" : "platform";
  }, [searchParams]);

  /** Available tab only: filter by student-feed allowlist (`?student_feed=allowed|not_allowed`). */
  const studentFeedAllowFilter = useMemo((): "" | "allowed" | "not_allowed" => {
    const v = searchParams.get("student_feed")?.trim();
    if (v === "allowed" || v === "not_allowed") return v;
    return "";
  }, [searchParams]);

  /** `desc` = newest first (default). `asc` = oldest first (`?created_sort=asc`). */
  const createdSortOrder = useMemo((): "desc" | "asc" => {
    return searchParams.get("created_sort")?.trim() === "asc" ? "asc" : "desc";
  }, [searchParams]);

  const availableSearchTokens = useMemo(() => {
    if (adminTab !== "available") return null;
    const t = availableSearchDraft.trim().toLowerCase();
    if (!t) return null;
    const tokens = t.split(/\s+/).filter(Boolean);
    return tokens.length ? tokens : null;
  }, [adminTab, availableSearchDraft]);

  const jobMatchesAvailableSearch = useCallback((job: JobV2, tokens: string[]) => {
    const parts: string[] = [
      job.job_title,
      job.company_name,
      job.location,
      job.job_description,
      job.role_process,
      job.industry_type,
      job.department,
      job.role_category,
      job.employment_type,
      job.job_type,
      job.company_info,
      job.apply_link,
      ...(job.key_skills ?? []),
      ...(job.mandatory_skills ?? []),
      ...(job.tags ?? []),
    ].filter((x): x is string => typeof x === "string" && x.length > 0);
    const hay = parts.join(" ").toLowerCase();
    return tokens.every((tok) => hay.includes(tok));
  }, []);

  const jobs = useMemo(() => {
    if (adminTab === "platform") return platformJobs;
    let list = availableJobs;
    if (studentFeedAllowFilter === "allowed") {
      list = list.filter((j) => isExternalJsonJobAllowedOnStudentBoard(j));
    } else if (studentFeedAllowFilter === "not_allowed") {
      list = list.filter((j) => !isExternalJsonJobAllowedOnStudentBoard(j));
    }
    if (availableSearchTokens?.length) {
      list = list.filter((j) => jobMatchesAvailableSearch(j, availableSearchTokens));
    }
    return list;
  }, [
    adminTab,
    availableJobs,
    platformJobs,
    studentFeedAllowFilter,
    suppressionTick,
    availableSearchTokens,
    jobMatchesAvailableSearch,
  ]);

  const sortedJobs = useMemo(() => {
    const arr = [...jobs];
    const ms = (j: JobV2) => {
      const t = j.created_at;
      if (!t) return 0;
      const n = new Date(t).getTime();
      return Number.isNaN(n) ? 0 : n;
    };
    arr.sort((a, b) =>
      createdSortOrder === "desc" ? ms(b) - ms(a) : ms(a) - ms(b)
    );
    return arr;
  }, [jobs, createdSortOrder]);

  const maxPage = useMemo(
    () => Math.max(1, Math.ceil(sortedJobs.length / pageSize) || 1),
    [sortedJobs.length, pageSize]
  );

  const page = Math.min(pageFromQuery, maxPage);

  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedJobs.slice(start, start + pageSize);
  }, [sortedJobs, page, pageSize]);

  useEffect(() => {
    if (pageFromQuery > maxPage && sortedJobs.length > 0) {
      navigateToListPage(Math.max(1, maxPage), { replace: true });
    }
  }, [pageFromQuery, maxPage, sortedJobs.length, navigateToListPage]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, pageSize]);

  const handlePageChange = useCallback(
    (_: React.ChangeEvent<unknown>, value: number) => {
      navigateToListPage(value);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigateToListPage]
  );

  const handlePageSizeChange = useCallback(
    (nextSize: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextSize <= DEFAULT_ADMIN_PAGE_SIZE) params.delete("page_size");
      else params.set("page_size", String(nextSize));
      params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    return subscribeStudentFeedSuppression(() => setSuppressionTick((n) => n + 1));
  }, []);

  useEffect(() => {
    if (adminTab !== "available") return;
    if (skipNextUrlSearchSync.current) {
      skipNextUrlSearchSync.current = false;
      return;
    }
    setAvailableSearchDraft(qFromUrl);
  }, [adminTab, qFromUrl]);

  useEffect(() => {
    if (adminTab !== "available") return;
    const t = setTimeout(() => {
      const trimmed = availableSearchDraft.trim();
      const urlTrim = (searchParams.get("q") ?? "").trim();
      if (trimmed === urlTrim) return;
      skipNextUrlSearchSync.current = true;
      const params = new URLSearchParams(searchParams.toString());
      if (!trimmed) params.delete("q");
      else params.set("q", trimmed);
      params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(t);
  }, [adminTab, availableSearchDraft, pathname, router, searchParams]);

  const handleAdminTabChange = useCallback(
    (_: React.SyntheticEvent, value: string) => {
      const t = value === "available" ? "available" : "platform";
      const params = new URLSearchParams(searchParams.toString());
      if (t === "platform") {
        params.delete("tab");
        params.delete("student_feed");
        params.delete("q");
        setAvailableSearchDraft("");
      } else {
        params.set("tab", "available");
      }
      params.delete("page");
      setSelectedIds(new Set());
      setBulkStatus("");
      setBulkVisibility("");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const loadJobs = useCallback(
    async (bypassCache = false) => {
      const cacheKey = adminJobsBrowseCacheKey(statusFilter || "");
      const cached = !bypassCache ? getCachedAdminJobsList(cacheKey) : null;
      if (cached) {
        setPlatformJobs(cached.platformJobs);
        setAvailableJobs(cached.availableJobs);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const data = await adminJobsV2Service.getJobs(config.clientId, {
          status: statusFilter || undefined,
        });
        const platform = data.results ?? [];
        setPlatformJobs(platform);
        const platformLinks = new Set(
          platform.map((j) => normalizeApplyLinkKey(j.apply_link)).filter(Boolean)
        );
        const externalJsonFeedJobs = await fetchAndMapExternalJsonJobs({
          page: 1,
          limit: 100,
          maxPages: 10,
          replaceStore: true,
        })
          .then((r) => r.jobs)
          .catch((): JobV2[] => []);
        const available = externalJsonFeedJobs.filter((j) => {
          const k = normalizeApplyLinkKey(j.apply_link);
          return k && !platformLinks.has(k);
        });
        setAvailableJobs(available);
        setCachedAdminJobsList(cacheKey, { platformJobs: platform, availableJobs: available });
      } catch (err) {
        showToast((err as Error)?.message ?? "Failed to load jobs", "error");
        if (!cached) {
          setPlatformJobs([]);
          setAvailableJobs([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [showToast, statusFilter]
  );

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const buildDetailQueryFromList = useCallback(() => {
    const p = new URLSearchParams();
    const pg = searchParams.get("page");
    if (pg) p.set("page", pg);
    const ps = searchParams.get("page_size");
    if (ps) p.set("page_size", ps);
    const tab = searchParams.get("tab");
    if (tab) p.set("tab", tab);
    const sf = searchParams.get("student_feed");
    if (sf) p.set("student_feed", sf);
    const q = searchParams.get("q")?.trim();
    if (q) p.set("q", q);
    if (searchParams.get("created_sort") === "asc") p.set("created_sort", "asc");
    const qs = p.toString();
    return qs ? `?${qs}` : "";
  }, [searchParams]);

  const handleStudentFeedAllowFilterChange = useCallback(
    (value: "" | "allowed" | "not_allowed") => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value) params.delete("student_feed");
      else params.set("student_feed", value);
      params.delete("page");
      setSelectedIds(new Set());
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const toggleCreatedSortOrder = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    const nextAsc = createdSortOrder === "desc";
    if (nextAsc) params.set("created_sort", "asc");
    else params.delete("created_sort");
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [createdSortOrder, pathname, router, searchParams]);

  const handleRowClick = useCallback(
    (job: JobV2) => {
      router.push(`/admin/jobs-v2/${job.id}${buildDetailQueryFromList()}`);
    },
    [router, buildDetailQueryFromList]
  );

  const handleMenuOpen = (e: React.MouseEvent, job: JobV2) => {
    e.stopPropagation();
    setMenuAnchor({ el: e.currentTarget as HTMLElement, job });
  };

  const handleMenuClose = () => setMenuAnchor(null);

  const handleMenuEdit = () => {
    if (menuAnchor) {
      const q = buildDetailQueryFromList();
      if (isExternalJsonFeedJob(menuAnchor.job)) {
        const p = new URLSearchParams(searchParams.toString());
        p.set("seedId", String(menuAnchor.job.id));
        router.push(`/admin/jobs-v2/new?${p.toString()}`);
      } else {
        router.push(`/admin/jobs-v2/${menuAnchor.job.id}/edit${q}`);
      }
    }
    handleMenuClose();
  };

  const handleMenuApplications = () => {
    if (menuAnchor) {
      if (isExternalJsonFeedJob(menuAnchor.job)) {
        showToast("Applications are only tracked for platform jobs.", "info");
      } else {
        router.push(`/admin/jobs-v2/${menuAnchor.job.id}/applications${buildDetailQueryFromList()}`);
      }
    }
    handleMenuClose();
  };

  const handleMenuDelete = () => {
    if (menuAnchor) {
      if (isExternalJsonFeedJob(menuAnchor.job)) {
        showToast("Student feed listings are not stored on the server and cannot be deleted here.", "info");
      } else {
        setDeleteConfirm(menuAnchor.job);
      }
    }
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    if (isExternalJsonFeedJob(deleteConfirm)) {
      showToast(
        "Student feed listings cannot be deleted from admin. Remove or update the JSON feed if needed.",
        "info"
      );
      setDeleteConfirm(null);
      return;
    }
    try {
      await adminJobsV2Service.deleteJob(deleteConfirm.id, config.clientId);
      showToast("Job deleted successfully", "success");
      setDeleteConfirm(null);
      loadJobs(true);
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to delete job", "error");
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = useCallback(() => {
    const pageIds = paginatedJobs.map((j) => j.id);
    if (pageIds.length === 0) return;
    setSelectedIds((prev) => {
      const allOnPageSelected = pageIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allOnPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [paginatedJobs]);

  const pageSelectionState = useMemo(() => {
    const pageIds = paginatedJobs.map((j) => j.id);
    const selectedOnPage = pageIds.filter((id) => selectedIds.has(id)).length;
    return {
      allOnPageSelected: pageIds.length > 0 && selectedOnPage === pageIds.length,
      indeterminateOnPage: selectedOnPage > 0 && selectedOnPage < pageIds.length,
    };
  }, [paginatedJobs, selectedIds]);

  const handleBulkUpdate = async () => {
    if (selectedIds.size === 0) return;
    if (!bulkStatus && !bulkVisibility) return;
    try {
      setUpdating(true);
      const ids = Array.from(selectedIds);
      const platformIds = ids.filter((id) => id > 0);
      if (platformIds.length === 0) {
        showToast("Bulk actions apply to platform jobs only. Student feed rows were skipped.", "warning");
        return;
      }
      if (bulkStatus) {
        await adminJobsV2Service.bulkUpdateJobStatus(
          platformIds,
          bulkStatus as "active" | "inactive" | "closed" | "completed" | "on_hold",
          config.clientId
        );
      }
      if (bulkVisibility) {
        await adminJobsV2Service.bulkUpdateJobVisibility(
          platformIds,
          bulkVisibility === "published",
          config.clientId
        );
      }
      const skipped = ids.length - platformIds.length;
      showToast(
        skipped > 0
          ? `Updated ${platformIds.length} platform job(s). ${skipped} feed listing(s) skipped.`
          : `Updated ${platformIds.length} job(s)`,
        "success"
      );
      setSelectedIds(new Set());
      setBulkStatus("");
      setBulkVisibility("");
      loadJobs(true);
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to bulk update", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkStudentFeedVisibility = useCallback(
    (mode: "hide" | "show") => {
      const selected = jobs.filter((j) => selectedIds.has(j.id) && isExternalJsonFeedJob(j));
      if (selected.length === 0) {
        showToast("Select available (feed) jobs on this tab.", "warning");
        return;
      }
      if (mode === "hide") {
        suppressExternalJsonJobsOnStudentBoard(selected);
        showToast(
          `${selected.length} listing(s) removed from the student job board (/jobs-v2).`,
          "success"
        );
      } else {
        unsuppressExternalJsonJobsOnStudentBoard(selected);
        showToast(
          `${selected.length} listing(s) allowed on the student job board (/jobs-v2).`,
          "success"
        );
      }
      setSelectedIds(new Set());
      setSuppressionTick((n) => n + 1);
    },
    [jobs, selectedIds, showToast]
  );

  const toggleOneStudentFeedVisibility = useCallback(
    (job: JobV2, mode: "hide" | "show") => {
      if (!isExternalJsonFeedJob(job)) return;
      if (mode === "hide") suppressExternalJsonJobsOnStudentBoard([job]);
      else unsuppressExternalJsonJobsOnStudentBoard([job]);
      showToast(
        mode === "hide"
          ? "Removed from the student job board."
          : "Allowed on the student job board.",
        "success"
      );
      setSuppressionTick((n) => n + 1);
    },
    [showToast]
  );

  const handleHideAllAvailableFromStudentBoard = useCallback(() => {
    if (availableJobs.length === 0) {
      showToast("No available listings to hide.", "info");
      return;
    }
    suppressExternalJsonJobsOnStudentBoard(availableJobs);
    showToast(
      `All ${availableJobs.length} available listing(s) removed from the student job board (/jobs-v2).`,
      "success"
    );
    setSelectedIds(new Set());
    setSuppressionTick((n) => n + 1);
  }, [availableJobs, showToast]);

  const handleShowAllAvailableOnStudentBoard = useCallback(() => {
    if (availableJobs.length === 0) {
      showToast("No available listings to update.", "info");
      return;
    }
    unsuppressExternalJsonJobsOnStudentBoard(availableJobs);
    showToast(
      `All ${availableJobs.length} available listing(s) allowed on the student job board (/jobs-v2).`,
      "success"
    );
    setSelectedIds(new Set());
    setSuppressionTick((n) => n + 1);
  }, [availableJobs, showToast]);

  const handleStatusChange = async (job: JobV2, status: string) => {
    if (isExternalJsonFeedJob(job)) {
      showToast("Import this listing as a platform job to change status.", "info");
      return;
    }
    try {
      setUpdating(true);
      await adminJobsV2Service.updateJob(job.id, { status: status as JobV2["status"] }, config.clientId);
      showToast("Status updated", "success");
      loadJobs(true);
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to update status", "error");
    } finally {
      setUpdating(false);
    }
  };

  const showAdminJobDateColumns = getShowAdminJobDateColumns(adminTab, platformJobs.length);
  const adminJobsGridTemplateColumns = getAdminJobsGridTemplateColumns(adminTab, showAdminJobDateColumns);

  const adminJobsFooterEl: ReactNode =
    !loading &&
    sortedJobs.length > 0 &&
    !(adminTab === "platform" && platformJobs.length < 10) ? (
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          flexShrink: 0,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          px: { xs: 2, md: 2.5 },
          py: 2,
          borderTop: "1px solid",
          borderColor: "rgba(0,0,0,0.08)",
          bgcolor: "#f8fafc",
        }}
      >
        <FormControl size="small" sx={{ minWidth: 150, width: { xs: "100%", sm: "auto" } }}>
          <InputLabel id="admin-jobs-rows-per-page">Rows per page</InputLabel>
          <Select
            labelId="admin-jobs-rows-per-page"
            label="Rows per page"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          >
            {ADMIN_PAGE_SIZE_OPTIONS.map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {Math.ceil(sortedJobs.length / pageSize) > 1 ? (
          <Pagination
            color="primary"
            size="small"
            showFirstButton
            showLastButton
            count={Math.max(1, Math.ceil(sortedJobs.length / pageSize))}
            page={page}
            onChange={handlePageChange}
            siblingCount={1}
            boundaryCount={2}
            sx={{
              flexWrap: "wrap",
              justifyContent: "center",
              "& .MuiPaginationItem-root": {
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                "&.Mui-selected": {
                  backgroundColor: "#6366f1",
                  color: "#fff",
                  "&:hover": { backgroundColor: "#4f46e5" },
                },
              },
            }}
          />
        ) : null}

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontSize: "0.75rem",
            whiteSpace: { sm: "nowrap" },
            textAlign: { xs: "center", sm: "right" },
            width: { xs: "100%", sm: "auto" },
          }}
        >
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sortedJobs.length)} of {sortedJobs.length} jobs
        </Typography>
      </Box>
    ) : null;

  return {
    platformJobs,
    availableJobs,
    jobs,
    loading,
    statusFilter,
    setStatusFilter,
    studentFeedAllowFilter,
    handleStudentFeedAllowFilterChange,
    availableSearchDraft,
    setAvailableSearchDraft,
    createdSortOrder,
    toggleCreatedSortOrder,
    menuAnchor,
    deleteConfirm,
    setDeleteConfirm,
    selectedIds,
    setSelectedIds,
    bulkStatus,
    setBulkStatus,
    bulkVisibility,
    setBulkVisibility,
    updating,
    adminTab,
    pageFromQuery,
    pageSize,
    maxPage,
    page,
    paginatedJobs,
    pageSelectionState,
    showAdminJobDateColumns,
    adminJobsGridTemplateColumns,
    navigateToListPage,
    handleAdminTabChange,
    loadJobs,
    buildDetailQueryFromList,
    handleRowClick,
    handleMenuOpen,
    handleMenuClose,
    handleMenuEdit,
    handleMenuApplications,
    handleMenuDelete,
    handleDeleteConfirm,
    toggleSelect,
    toggleSelectAll,
    handleBulkUpdate,
    handleBulkStudentFeedVisibility,
    toggleOneStudentFeedVisibility,
    handleHideAllAvailableFromStudentBoard,
    handleShowAllAvailableOnStudentBoard,
    handleStatusChange,
    adminJobsFooterEl,
    handlePageChange,
    handlePageSizeChange,
  };
}
