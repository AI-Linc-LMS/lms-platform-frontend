import type { JobV2 } from "@/lib/services/jobs-v2.service";

// ---------------------------------------------------------------------------
// Identity constants
// ---------------------------------------------------------------------------

const EXTERNAL_JSON_LISTING = "external_json" as const;
const LEGACY_LISTING = "april11" as const;

function isExternalSource(s: string | undefined): boolean {
  return s === EXTERNAL_JSON_LISTING || s === LEGACY_LISTING;
}

export function isExternalJsonFeedJob(job: Pick<JobV2, "listing_source">): boolean {
  return isExternalSource(job.listing_source);
}

export function isLikelyExternalJsonSyntheticId(id: number): boolean {
  return id < 0;
}

// ---------------------------------------------------------------------------
// In-memory registry (populated after each fetch)
// ---------------------------------------------------------------------------

const byId = new Map<number, JobV2>();
const byApplyLink = new Map<string, JobV2>();

function clearExternalEntries(): void {
  for (const [id, j] of [...byId.entries()])
    if (isExternalSource(j.listing_source)) byId.delete(id);
  for (const [k, j] of [...byApplyLink.entries()])
    if (isExternalSource(j.listing_source)) byApplyLink.delete(k);
}

export function replaceExternalJsonFeedJobs(jobs: JobV2[]): void {
  clearExternalEntries();
  for (const j of jobs) {
    if (!isExternalSource(j.listing_source)) continue;
    byId.set(j.id, j);
    if (j.apply_link) byApplyLink.set(j.apply_link.toLowerCase(), j);
  }
}

export function getExternalJobById(id: number): JobV2 | undefined {
  return byId.get(id);
}

// ---------------------------------------------------------------------------
// Merge helper  (API wins when apply_link matches)
// ---------------------------------------------------------------------------

export function normalizeApplyLinkKey(url: string | undefined): string {
  if (!url?.trim()) return "";
  try {
    return new URL(url.trim()).href.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

export function mergeApiJobsWithExternalJson(
  apiResults: JobV2[],
  jsonFeedJobs: JobV2[]
): JobV2[] {
  const apiLinkSet = new Set(
    apiResults.map((j) => normalizeApplyLinkKey(j.apply_link)).filter(Boolean)
  );
  const extra = jsonFeedJobs.filter((j) => {
    const k = normalizeApplyLinkKey(j.apply_link);
    return k && !apiLinkSet.has(k);
  });
  extra.sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tb - ta;
  });
  return [...apiResults, ...extra];
}

// ---------------------------------------------------------------------------
// Favorites  (localStorage, with legacy key migration)
// ---------------------------------------------------------------------------

const FAV_KEY = "external_json_job_favorites_v1";
const FAV_LEGACY_KEY = "april11_job_favorites_v1";

function readFavSet(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    let raw = localStorage.getItem(FAV_KEY);
    if (!raw) {
      raw = localStorage.getItem(FAV_LEGACY_KEY);
      if (raw) localStorage.setItem(FAV_KEY, raw);
    }
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((n) => typeof n === "number"));
  } catch {
    return new Set();
  }
}

function writeFavSet(ids: Set<number>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify([...ids]));
  } catch { /* quota */ }
}

export function isExternalJsonJobFavorite(jobId: number): boolean {
  return readFavSet().has(jobId);
}

export function toggleExternalJsonJobFavorite(jobId: number): boolean {
  const s = readFavSet();
  const next = !s.has(jobId);
  if (next) s.add(jobId); else s.delete(jobId);
  writeFavSet(s);
  return next;
}

export function syncExternalJsonJobFavoriteFlags<
  T extends { id: number; listing_source?: string; is_favourited?: boolean },
>(jobs: T[]): T[] {
  if (typeof window === "undefined") return jobs;
  const fav = readFavSet();
  return jobs.map((j) =>
    isExternalSource(j.listing_source) ? { ...j, is_favourited: fav.has(j.id) } : j
  );
}

// ---------------------------------------------------------------------------
// Student feed: external JSON jobs are opt-in (platform API jobs always shown)
// ---------------------------------------------------------------------------

/** Apply-link keys the admin has allowed on /jobs-v2. Empty = no feed listings on the student board. */
export const STUDENT_FEED_EXTERNAL_ALLOWED_STORAGE_KEY =
  "ailinc_student_feed_external_allowed_apply_keys_v1";

/** @deprecated Legacy opt-out set; no longer read after migration to allowlist. */
export const STUDENT_FEED_SUPPRESSION_STORAGE_KEY =
  "ailinc_student_feed_suppressed_apply_keys_v1";

const STUDENT_FEED_EXTERNAL_VISIBILITY_EVENT =
  "ailinc-student-feed-external-visibility-changed";

function studentFeedApplyKey(job: Pick<JobV2, "apply_link">): string {
  return normalizeApplyLinkKey(job.apply_link);
}

function readExternalAllowedOnStudentFeedKeys(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STUDENT_FEED_EXTERNAL_ALLOWED_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(
      arr.filter((x): x is string => typeof x === "string" && x.length > 0)
    );
  } catch {
    return new Set();
  }
}

function writeExternalAllowedOnStudentFeedKeys(keys: Set<string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STUDENT_FEED_EXTERNAL_ALLOWED_STORAGE_KEY,
    JSON.stringify([...keys])
  );
  window.dispatchEvent(new CustomEvent(STUDENT_FEED_EXTERNAL_VISIBILITY_EVENT));
}

/** True when a feed listing is shown on the student job board (admin has opted it in). */
export function isExternalJsonJobAllowedOnStudentBoard(job: JobV2): boolean {
  if (!isExternalJsonFeedJob(job)) return true;
  const k = studentFeedApplyKey(job);
  return k ? readExternalAllowedOnStudentFeedKeys().has(k) : false;
}

/** @deprecated Use !isExternalJsonJobAllowedOnStudentBoard(job) for feed rows. */
export function isExternalJsonJobSuppressedOnStudentBoard(job: JobV2): boolean {
  if (!isExternalJsonFeedJob(job)) return false;
  return !isExternalJsonJobAllowedOnStudentBoard(job);
}

/** Remove listings from the student board (revoke opt-in). */
export function suppressExternalJsonJobsOnStudentBoard(jobs: JobV2[]): void {
  const s = readExternalAllowedOnStudentFeedKeys();
  for (const j of jobs) {
    if (!isExternalJsonFeedJob(j)) continue;
    const k = studentFeedApplyKey(j);
    if (k) s.delete(k);
  }
  writeExternalAllowedOnStudentFeedKeys(s);
}

/** Add listings to the student board (admin opt-in). */
export function unsuppressExternalJsonJobsOnStudentBoard(jobs: JobV2[]): void {
  const s = readExternalAllowedOnStudentFeedKeys();
  for (const j of jobs) {
    if (!isExternalJsonFeedJob(j)) continue;
    const k = studentFeedApplyKey(j);
    if (k) s.add(k);
  }
  writeExternalAllowedOnStudentFeedKeys(s);
}

export function filterStudentVisibleFeedJobs(jobs: JobV2[]): JobV2[] {
  const allowed = readExternalAllowedOnStudentFeedKeys();
  return jobs.filter((j) => {
    if (!isExternalJsonFeedJob(j)) return true;
    const k = studentFeedApplyKey(j);
    return !!k && allowed.has(k);
  });
}

export function subscribeStudentFeedSuppression(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onCustom = () => listener();
  const onStorage = (e: StorageEvent) => {
    if (
      e.key === STUDENT_FEED_EXTERNAL_ALLOWED_STORAGE_KEY ||
      e.key === STUDENT_FEED_SUPPRESSION_STORAGE_KEY
    ) {
      listener();
    }
  };
  window.addEventListener(STUDENT_FEED_EXTERNAL_VISIBILITY_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(STUDENT_FEED_EXTERNAL_VISIBILITY_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
