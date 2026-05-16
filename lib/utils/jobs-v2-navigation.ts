/** Query params preserved when navigating between jobs list, detail, and apply (student `/jobs-v2`). */
export const JOBS_V2_LIST_PAGE_PARAM = "page";
export const JOBS_V2_LIST_PAGE_SIZE_PARAM = "page_size";

/** Substring without `?` — only `page` and `page_size` from the current URL. */
export function getJobsV2ListQueryString(
  searchParams: Pick<URLSearchParams, "get">
): string {
  const p = new URLSearchParams();
  const pg = searchParams.get(JOBS_V2_LIST_PAGE_PARAM);
  if (pg) p.set(JOBS_V2_LIST_PAGE_PARAM, pg);
  const ps = searchParams.get(JOBS_V2_LIST_PAGE_SIZE_PARAM);
  if (ps) p.set(JOBS_V2_LIST_PAGE_SIZE_PARAM, ps);
  return p.toString();
}

export function getJobsV2BrowseHref(queryString: string): string {
  return queryString ? `/jobs-v2?${queryString}` : "/jobs-v2";
}

export function getJobsV2JobDetailHref(jobId: number, queryString: string): string {
  return queryString ? `/jobs-v2/${jobId}?${queryString}` : `/jobs-v2/${jobId}`;
}

export function getJobsV2ApplyHref(jobId: number, queryString: string): string {
  return queryString ? `/jobs-v2/${jobId}/apply?${queryString}` : `/jobs-v2/${jobId}/apply`;
}

/** Full list URL for admin jobs — preserves entire query string from list context. */
export function getAdminJobsV2ListBackHref(
  searchParams: Pick<URLSearchParams, "toString">
): string {
  const qs = searchParams.toString();
  return qs ? `/admin/jobs-v2?${qs}` : "/admin/jobs-v2";
}

/** Admin jobs list href after removing query keys (e.g. `seedId` on new job). */
export function getAdminJobsV2ListBackHrefOmittingParams(
  searchParams: Pick<URLSearchParams, "toString">,
  omitKeys: readonly string[]
): string {
  const p = new URLSearchParams(searchParams.toString());
  for (const key of omitKeys) {
    p.delete(key);
  }
  const qs = p.toString();
  return qs ? `/admin/jobs-v2?${qs}` : "/admin/jobs-v2";
}

/** `?a=b` or empty — append to admin job sub-routes to keep list filters. */
export function getAdminJobsV2ListQuerySuffix(
  searchParams: Pick<URLSearchParams, "toString">
): string {
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}
