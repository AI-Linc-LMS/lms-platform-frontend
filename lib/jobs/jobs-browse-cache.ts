/**
 * Short-lived in-memory caches so returning from job detail → list does not block on full refetch.
 * Same SPA session only; keyed by API filter inputs.
 */

import type { JobV2 } from "@/lib/services/jobs-v2.service";

const DEFAULT_TTL_MS = 120_000;

type Entry<T> = { data: T; at: number };

function getEntry<T>(map: Map<string, Entry<T>>, key: string, ttlMs: number): T | null {
  const e = map.get(key);
  if (!e) return null;
  if (Date.now() - e.at > ttlMs) {
    map.delete(key);
    return null;
  }
  return e.data;
}

function setEntry<T>(map: Map<string, Entry<T>>, key: string, data: T) {
  map.set(key, { data, at: Date.now() });
}

const jobsV2MergedCache = new Map<string, Entry<JobV2[]>>();

export function jobsV2BrowseCacheKey(parts: {
  clientId: string | number;
  location?: string;
  job_type?: string;
  employment_type?: string;
  search?: string;
}): string {
  return JSON.stringify({
    c: String(parts.clientId),
    l: parts.location ?? "",
    jt: parts.job_type ?? "",
    et: parts.employment_type ?? "",
    s: parts.search ?? "",
  });
}

export function getCachedJobsV2Merged(key: string, ttlMs = DEFAULT_TTL_MS): JobV2[] | null {
  return getEntry(jobsV2MergedCache, key, ttlMs);
}

export function setCachedJobsV2Merged(key: string, jobs: JobV2[]) {
  setEntry(jobsV2MergedCache, key, jobs);
}

export type AdminJobsListCached = {
  platformJobs: JobV2[];
  availableJobs: JobV2[];
};

const adminJobsListCache = new Map<string, Entry<AdminJobsListCached>>();

export function adminJobsBrowseCacheKey(status: string): string {
  return status || "all";
}

export function getCachedAdminJobsList(key: string, ttlMs = DEFAULT_TTL_MS): AdminJobsListCached | null {
  return getEntry(adminJobsListCache, key, ttlMs);
}

export function setCachedAdminJobsList(key: string, data: AdminJobsListCached) {
  setEntry(adminJobsListCache, key, data);
}
