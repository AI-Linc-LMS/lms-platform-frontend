import type { JobV2 } from "@/lib/services/jobs-v2.service";

// ═══════════════════════════════════════════════════════════════════════════
// Pagination / page-restore helpers
// ═══════════════════════════════════════════════════════════════════════════

export const JOBS_V2_BROWSE_PAGE_STORAGE_KEY = "jobs-v2-browse-page";

const PENDING_LIST_RESTORE_KEY = "jobs-v2-pending-list-restore-page";
const SKIP_LIST_RESTORE_ONCE_KEY = "jobs-v2-skip-list-restore-once";

export function markJobsV2OpenedDetailFromList(listPage: number): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PENDING_LIST_RESTORE_KEY, String(Math.max(1, listPage)));
    sessionStorage.removeItem(SKIP_LIST_RESTORE_ONCE_KEY);
  } catch { /* ignore */ }
}

export function setJobsV2SkipListRestoreOnce(): void {
  if (typeof window === "undefined") return;
  try { sessionStorage.setItem(SKIP_LIST_RESTORE_ONCE_KEY, "1"); } catch { /* ignore */ }
}

function consumeJobsV2SkipListRestoreOnce(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(SKIP_LIST_RESTORE_ONCE_KEY) === "1") {
      sessionStorage.removeItem(SKIP_LIST_RESTORE_ONCE_KEY);
      return true;
    }
  } catch { /* ignore */ }
  return false;
}

export function clearJobsV2PendingListRestore(): void {
  if (typeof window === "undefined") return;
  try { sessionStorage.removeItem(PENDING_LIST_RESTORE_KEY); } catch { /* ignore */ }
}

export function consumeJobsV2PendingListRestore(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_LIST_RESTORE_KEY);
    sessionStorage.removeItem(PENDING_LIST_RESTORE_KEY);
    if (!raw?.trim()) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 1 ? n : null;
  } catch { return null; }
}

export function tryRestoreJobsV2ListPageFromDetailReturn(opts: {
  maxPage: number;
  navigateToListPage: (page: number, navOpts?: { replace?: boolean }) => void;
}): boolean {
  if (typeof window === "undefined") return false;
  if (consumeJobsV2SkipListRestoreOnce()) { clearJobsV2PendingListRestore(); return false; }
  const pending = consumeJobsV2PendingListRestore();
  if (pending == null || pending <= 1) return false;
  opts.navigateToListPage(Math.min(pending, Math.max(1, opts.maxPage)), { replace: true });
  return true;
}

export function persistJobsV2BrowsePage(pageFromQuery: number): void {
  if (typeof window === "undefined") return;
  try { sessionStorage.setItem(JOBS_V2_BROWSE_PAGE_STORAGE_KEY, String(Math.max(1, pageFromQuery))); }
  catch { /* ignore quota / private mode */ }
}

export function readPersistedJobsV2BrowsePage(): string | null {
  if (typeof window === "undefined") return null;
  try { return sessionStorage.getItem(JOBS_V2_BROWSE_PAGE_STORAGE_KEY); } catch { return null; }
}

export function jobsV2ListHref(pageParam: string | null | undefined): string {
  if (!pageParam?.trim()) return "/jobs-v2";
  const n = parseInt(pageParam, 10);
  return Number.isFinite(n) && n >= 1 ? `/jobs-v2?page=${n}` : "/jobs-v2";
}

export function jobsV2JobDetailHref(jobId: number, pageParam: string | null | undefined): string {
  const base = `/jobs-v2/${jobId}`;
  if (!pageParam?.trim()) return base;
  const n = parseInt(pageParam, 10);
  return Number.isFinite(n) && n >= 1 ? `${base}?page=${n}` : base;
}

export function jobsV2ApplyHref(jobId: number, pageParam: string | null | undefined): string {
  const base = `/jobs-v2/${jobId}/apply`;
  if (!pageParam?.trim()) return base;
  const n = parseInt(pageParam, 10);
  return Number.isFinite(n) && n >= 1 ? `${base}?page=${n}` : base;
}

export function resolveJobsV2ListPageParam(searchParams: Pick<URLSearchParams, "get">): string | null {
  if (typeof window !== "undefined") {
    try { const fromBar = new URLSearchParams(window.location.search).get("page")?.trim(); if (fromBar) return fromBar; }
    catch { /* ignore */ }
  }
  return searchParams.get("page")?.trim() || readPersistedJobsV2BrowsePage()?.trim() || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Job-list filters  (posted-within, skill-tag noise)
// ═══════════════════════════════════════════════════════════════════════════

export type PostedWithinKey = "" | "24h" | "7d" | "30d";

export const POSTED_WITHIN_OPTIONS: { value: PostedWithinKey; label: string }[] = [
  { value: "", label: "Any time" },
  { value: "24h", label: "Past 24 hours" },
  { value: "7d", label: "Past week" },
  { value: "30d", label: "Past month" },
];

function cutoffMs(key: Exclude<PostedWithinKey, "">): number {
  const now = Date.now();
  switch (key) {
    case "24h": return now - 24 * 60 * 60 * 1000;
    case "7d":  return now - 7 * 24 * 60 * 60 * 1000;
    case "30d": return now - 30 * 24 * 60 * 60 * 1000;
    default:    return 0;
  }
}

export function jobMatchesPostedWithin(job: JobV2, key: string | undefined): boolean {
  if (key == null || key === "") return true;
  if (key !== "24h" && key !== "7d" && key !== "30d") return true;
  const min = cutoffMs(key);
  const at = job.created_at ? new Date(job.created_at).getTime() : NaN;
  return Number.isNaN(at) ? false : at >= min;
}

export function isSkillFilterLabelRelevant(raw: string): boolean {
  const s = raw.trim();
  if (s.length < 2) return false;
  if (/^\.{2,}$/.test(s)) return false;
  if (/^#\d+$/i.test(s)) return false;
  if (/^'\d+$/.test(s)) return false;
  if (/^\d+%$/i.test(s)) return false;
  if (/^\d{6,}$/.test(s)) return false;
  if (/^\d+x\d+$/i.test(s)) return false;
  if (/^\d+-\d+$/.test(s) && !/[a-z]/i.test(s)) return false;
  if (/^20\d{2}\s*[-–]\s*(20)?\d{2,4}$/i.test(s)) return false;
  if (/^20\d{2}$/.test(s)) return false;
  if (/^\d{1,2}-Month$/i.test(s)) return false;
  if (/^\$[\d,.]+\s*[km]?$/i.test(s)) return false;
  if (/^1099$/i.test(s)) return false;
  if (/^\d{1,2}(st|nd|rd|th)$/i.test(s)) return false;
  if (/^[\d\s\-–—$%,.]+$/.test(s)) return false;
  if (!/[a-zA-Z]/.test(s)) return false;
  return true;
}
