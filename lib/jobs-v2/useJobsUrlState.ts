"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Jobs v2 — the URL state contract.
 *
 * Every filtered list in the module (student board, admin jobs list, applications pipeline,
 * scraped queue) keeps its query in the URL rather than in component state. The consequences
 * are the point: the board is shareable and bookmarkable, "Back to jobs" returns you to page 4
 * of your filtered search instead of an unfiltered page 1, and the browser back button behaves.
 *
 * **Defaults are omitted from the query string**, so a clean board has a clean URL.
 */

export type JobsView = "card" | "list";

export interface JobsUrlState {
  /** Free-text search. */
  q: string;
  /** Location. */
  loc: string;
  /** Experience band. */
  exp: string;
  /** Job type (Full time / Internship / ...). */
  type: string;
  /** Employment type. */
  emp: string;
  /** Selected skills, exact case-folded tokens. */
  skills: string[];
  /** Posted-within window ("7d", "30d", ...). */
  posted: string;
  /** Salary band. */
  salary: string;
  /** Favourites-only view. `?fav=1`. */
  fav: boolean;
  /** Which pane: browse / applied / saved on the student board; the tab name on admin lists. */
  tab: string;
  /** Card grid or row list. */
  view: JobsView;
  page: number;
  size: number;
  /** Sort key, e.g. "recent" or "-applied_at". */
  sort: string;
  /** Status filter — job status on the admin list, application status on the pipeline. */
  status: string;
}

export const JOBS_URL_DEFAULTS: JobsUrlState = {
  q: "",
  loc: "",
  exp: "",
  type: "",
  emp: "",
  skills: [],
  posted: "",
  salary: "",
  fav: false,
  tab: "",
  view: "card",
  page: 1,
  size: 20,
  sort: "",
  status: "",
};

/** The keys that count as "a filter is applied" for `ActiveFilters` and the empty-state fork. */
export const FILTER_KEYS = [
  "q",
  "loc",
  "exp",
  "type",
  "emp",
  "skills",
  "posted",
  "salary",
  "status",
] as const;

export type FilterKey = (typeof FILTER_KEYS)[number];

function parseState(
  params: URLSearchParams,
  defaults: JobsUrlState,
): JobsUrlState {
  const str = (key: keyof JobsUrlState, fallback: string) => params.get(key)?.trim() || fallback;
  const num = (key: keyof JobsUrlState, fallback: number) => {
    const raw = Number(params.get(key));
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
  };
  const rawSkills = params.get("skills");
  const rawView = params.get("view");
  return {
    q: str("q", defaults.q),
    loc: str("loc", defaults.loc),
    exp: str("exp", defaults.exp),
    type: str("type", defaults.type),
    emp: str("emp", defaults.emp),
    skills: rawSkills
      ? rawSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : defaults.skills,
    posted: str("posted", defaults.posted),
    salary: str("salary", defaults.salary),
    fav: params.get("fav") === "1" || params.get("fav") === "true" || defaults.fav,
    tab: str("tab", defaults.tab),
    view: rawView === "card" || rawView === "list" ? rawView : defaults.view,
    page: num("page", defaults.page),
    size: num("size", defaults.size),
    sort: str("sort", defaults.sort),
    status: str("status", defaults.status),
  };
}

/** Only non-default values are written, so a clean board has a clean URL. */
export function serializeState(state: JobsUrlState, defaults: JobsUrlState): string {
  const params = new URLSearchParams();
  const put = (key: string, value: string) => {
    if (value) params.set(key, value);
  };
  put("q", state.q === defaults.q ? "" : state.q);
  put("loc", state.loc === defaults.loc ? "" : state.loc);
  put("exp", state.exp === defaults.exp ? "" : state.exp);
  put("type", state.type === defaults.type ? "" : state.type);
  put("emp", state.emp === defaults.emp ? "" : state.emp);
  put("skills", state.skills.length ? state.skills.join(",") : "");
  put("posted", state.posted === defaults.posted ? "" : state.posted);
  put("salary", state.salary === defaults.salary ? "" : state.salary);
  if (state.fav !== defaults.fav) put("fav", state.fav ? "1" : "");
  put("tab", state.tab === defaults.tab ? "" : state.tab);
  put("view", state.view === defaults.view ? "" : state.view);
  if (state.page !== defaults.page) put("page", String(state.page));
  if (state.size !== defaults.size) put("size", String(state.size));
  put("sort", state.sort === defaults.sort ? "" : state.sort);
  put("status", state.status === defaults.status ? "" : state.status);
  return params.toString();
}

/** Build a shareable board href from a state patch — used by "Back to jobs" links. */
export function buildJobsHref(
  pathname: string,
  patch: Partial<JobsUrlState>,
  defaults: Partial<JobsUrlState> = {},
): string {
  const merged: JobsUrlState = { ...JOBS_URL_DEFAULTS, ...defaults, ...patch };
  const qs = serializeState(merged, { ...JOBS_URL_DEFAULTS, ...defaults });
  return qs ? `${pathname}?${qs}` : pathname;
}

export interface UseJobsUrlStateOptions {
  /** Per-screen defaults (e.g. the admin list defaults to `view: "list"`, `size: 20`). */
  defaults?: Partial<JobsUrlState>;
  /** How long to coalesce writes before touching the URL. */
  debounceMs?: number;
  /** Keys whose change should NOT reset `page` to 1. Defaults to `["page", "view"]`. */
  keepPageFor?: Array<keyof JobsUrlState>;
}

export interface JobsUrlStateApi {
  state: JobsUrlState;
  /** Patch one or more keys. Any filter change resets `page` to 1 (URL contract, 5.1.1). */
  set: (patch: Partial<JobsUrlState>) => void;
  /** Clear every filter key but keep tab / view / size / sort. The empty-state escape hatch. */
  clearFilters: () => void;
  /** Back to the screen's defaults entirely. */
  reset: () => void;
  /** True when any filter key is off its default. */
  isFiltered: boolean;
  /** How many filter keys are set — the FilterBar badge. */
  activeFilterCount: number;
  /** The current query string, for building a "return to this list" href. */
  queryString: string;
}

/**
 * The hook. State is derived from `useSearchParams` (the source of truth, so back/forward and
 * a pasted link both work); writes go through a debounced, **scroll-preserving**
 * `router.replace`, with an optimistic overlay so a control never lags its own click.
 */
export function useJobsUrlState(options: UseJobsUrlStateOptions = {}): JobsUrlStateApi {
  const { debounceMs = 150, keepPageFor = ["page", "view"] } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const defaults = useMemo<JobsUrlState>(
    () => ({ ...JOBS_URL_DEFAULTS, ...options.defaults }),
    // The caller usually passes an object literal; comparing the serialised form keeps this
    // stable without forcing every screen to useMemo its defaults.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(options.defaults ?? {})],
  );

  const search = searchParams?.toString() ?? "";
  const parsed = useMemo(
    () => parseState(new URLSearchParams(search), defaults),
    [search, defaults],
  );

  /** Optimistic overlay: what we have asked for but the URL has not caught up with yet. */
  const [overlay, setOverlay] = useState<Partial<JobsUrlState> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Once the URL reflects (or supersedes) our write, the overlay has done its job.
  useEffect(() => {
    setOverlay(null);
  }, [search]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const state = useMemo<JobsUrlState>(
    () => (overlay ? { ...parsed, ...overlay } : parsed),
    [parsed, overlay],
  );

  const stateRef = useRef(state);
  stateRef.current = state;

  const commit = useCallback(
    (next: JobsUrlState) => {
      const qs = serializeState(next, defaults);
      const href = qs ? `${pathname}?${qs}` : pathname;
      // `scroll: false` — a filter change must not throw the reader back to the top of the page.
      router.replace(href, { scroll: false });
    },
    [defaults, pathname, router],
  );

  const set = useCallback(
    (patch: Partial<JobsUrlState>) => {
      const touched = Object.keys(patch) as Array<keyof JobsUrlState>;
      const resetsPage =
        !("page" in patch) && touched.some((k) => !keepPageFor.includes(k));
      const next: JobsUrlState = {
        ...stateRef.current,
        ...patch,
        ...(resetsPage ? { page: 1 } : null),
      };
      stateRef.current = next;
      setOverlay((prev) => ({ ...prev, ...patch, ...(resetsPage ? { page: 1 } : null) }));
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => commit(next), debounceMs);
    },
    [commit, debounceMs, keepPageFor],
  );

  const clearFilters = useCallback(() => {
    const patch: Partial<JobsUrlState> = { page: 1 };
    for (const key of FILTER_KEYS) {
      (patch as Record<string, unknown>)[key] = defaults[key];
    }
    set(patch);
  }, [defaults, set]);

  const reset = useCallback(() => {
    stateRef.current = defaults;
    setOverlay(defaults);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => commit(defaults), debounceMs);
  }, [commit, debounceMs, defaults]);

  const activeFilterCount = useMemo(
    () =>
      FILTER_KEYS.reduce((n, key) => {
        const value = state[key];
        const fallback = defaults[key];
        if (Array.isArray(value)) return n + (value.length ? 1 : 0);
        return n + (value === fallback ? 0 : 1);
      }, 0),
    [state, defaults],
  );

  return {
    state,
    set,
    clearFilters,
    reset,
    isFiltered: activeFilterCount > 0,
    activeFilterCount,
    queryString: serializeState(state, defaults),
  };
}
