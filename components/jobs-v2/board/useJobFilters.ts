"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useModuleLocked, useProfileGate } from "@/lib/contexts/ProfileGateContext";
import { config } from "@/lib/config";
import { jobsV2Service, type JobV2, type JobV2Filters } from "@/lib/services/jobs-v2.service";
import { foldToken, formatCount, formatSalary, toDate } from "@/lib/jobs-v2/format";
import {
  jobSkillEntries,
  jobSkillTokens,
  learnerSkillTokens,
  matchCount,
} from "@/lib/jobs-v2/relevance";
import { interleaveByCompany } from "@/lib/jobs-v2/variety";
import { useJobsUrlState, type JobsUrlStateApi, type JobsView } from "@/lib/jobs-v2/useJobsUrlState";
import { useSeq } from "@/lib/jobs-v2/useSeq";
import type { ActiveFilterChip } from "@/components/jobs-v2/ui";

/**
 * The student board's data + filter engine.
 *
 * One hook, one state, one render tree. The board used to hold six independent pieces of filter
 * state (`filters`, `searchInput`, `locationInput`, `experienceInput`, `page`, `pageSize`), two
 * of which wrote to the same concept from two different controls; the URL held none of it, so
 * "Back to jobs" always landed on an unfiltered page 1. Everything now lives in the query
 * string (spec 5.1.1) via `useJobsUrlState`, which makes the board shareable, bookmarkable and
 * back-button correct.
 *
 * **The API call is unchanged.** `getJobs` still receives exactly
 * `{ client_id, location, job_type, employment_type, search }` — no new params, no new
 * endpoint. Location, job type and employment type stay SERVER-side filters (as today) and
 * experience, skills, posted, salary and favourites stay CLIENT-side (as today), so no filter
 * is silently applied twice with two different meanings.
 */

/* -------------------------------------------------------------------------
 * Experience matching — lifted verbatim from `app/jobs-v2/page.tsx`, where it
 * lived inline. The parsing rules are unchanged; only their home moved.
 * ---------------------------------------------------------------------- */

/** Parse a job's `years_of_experience` string into a min/max range. `null` if unparseable. */
export function parseExperienceRange(
  str: string | null | undefined,
): { min: number; max: number } | null {
  if (!str || typeof str !== "string") return null;
  const s = str.toLowerCase().trim();
  if (!s) return null;

  // Fresher, entry level = 0-1
  if (/fresher|entry\s*level|0\s*[-–—to]+\s*1|upto\s*1|less\s*than\s*1/.test(s)) {
    return { min: 0, max: 1 };
  }

  // Range: "1-3", "3 - 5", "5 to 10"
  const rangeMatch = s.match(/(\d+)\s*[-–—to]+\s*(\d+)/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    return { min, max: Math.max(min, max) };
  }

  // "10+", "15+", "20+"
  const plusMatch = s.match(/(\d+)\s*\+/);
  if (plusMatch) {
    const min = parseInt(plusMatch[1], 10);
    return { min, max: 99 };
  }

  // Single number: "2 years", "5 yrs"
  const singleMatch = s.match(/(\d+)\s*(?:year|yr|y\.?)?s?/i) || s.match(/\b(\d+)\b/);
  if (singleMatch) {
    const n = parseInt(singleMatch[1], 10);
    return { min: n, max: n };
  }

  return null;
}

export const EXPERIENCE_BANDS: Record<string, { min: number; max: number }> = {
  "0-1": { min: 0, max: 1 },
  "1-3": { min: 1, max: 3 },
  "3-5": { min: 3, max: 5 },
  "5-10": { min: 5, max: 10 },
  "10+": { min: 10, max: 99 },
};

/** Does the job's experience range overlap the selected band? */
export function experienceMatchesFilter(
  jobExp: string | null | undefined,
  filterExp: string,
): boolean {
  const filterRange = EXPERIENCE_BANDS[filterExp];
  if (!filterRange) return true;

  const jobRange = parseExperienceRange(jobExp);
  if (!jobRange) {
    // Unparseable (empty, custom text): include only for 0-1 (fresher / entry).
    return filterExp === "0-1";
  }
  return jobRange.min <= filterRange.max && filterRange.min <= jobRange.max;
}

/* -------------------------------------------------------------------------
 * Vocabularies
 * ---------------------------------------------------------------------- */

const DAY_MS = 24 * 60 * 60 * 1000;

/** "Posted within" windows, in milliseconds. */
export const POSTED_WINDOWS: Record<string, number> = {
  "1d": DAY_MS,
  "7d": 7 * DAY_MS,
  "30d": 30 * DAY_MS,
};

/**
 * "Internship" lives in ONE vocabulary. It is a job type, so the employment-type list drops it
 * (spec 5.1) and the two controls stop offering the same concept under two names.
 */
export const JOB_TYPE_VALUES = ["job", "internship"] as const;
export const EMPLOYMENT_TYPE_VALUES = ["Full-time", "Part-time", "Contract"] as const;
export const EXPERIENCE_VALUES = ["0-1", "1-3", "3-5", "5-10", "10+"] as const;
export const POSTED_VALUES = ["1d", "7d", "30d"] as const;
/**
 * Salary on this API is free text ("8-12 LPA", "Not disclosed", sometimes a bare number), so a
 * numeric band filter over it would be a fabrication. The honest filter is whether the employer
 * disclosed a figure at all — which is the question a learner actually asks of that column.
 */
export const SALARY_VALUES = ["disclosed", "undisclosed"] as const;

/**
 * The board's client-only sorts. `""` is "most recent", which is the order the API returns and
 * therefore the one that costs nothing. `"relevant"` ranks by how many of the job's skills the
 * learner already has, and is only OFFERED when we know the learner's skills — a relevance sort
 * over an empty profile would be "most recent" wearing a more flattering label.
 */
export const SORT_VALUES = ["", "relevant", "oldest", "company", "deadline"] as const;
export type BoardSort = (typeof SORT_VALUES)[number];

export type BoardTab = "browse" | "applied" | "saved";

export interface SkillFacet {
  /** Case-folded comparison token. */
  token: string;
  /** The most common raw spelling, for display. */
  label: string;
  count: number;
}

export interface FacetOption {
  value: string;
  label: string;
}

/** How many skill chips the filter renders before it windows. */
export const SKILL_WINDOW = 60;

/**
 * Server pagination does not exist on `/jobs-v2/api/jobs/` today: `getJobs` sends no
 * `page`/`page_size` and the endpoint returns the whole set. The board therefore slices
 * client-side and **labels what it shows honestly** rather than pretending the slice is the
 * total. Flip this the day the endpoint lands; the service signature is unchanged (spec 10.5).
 */
export const SUPPORTS_SERVER_PAGINATION = false;

/**
 * The skills vocabulary lives in `lib/jobs-v2/relevance.ts` and is re-exported here because
 * this module is where the board's filter logic is imported from. There is ONE reader of a
 * job's three skill keys; the filter and the card chips folded them separately before, which is
 * how a job could match a skill chip it did not display.
 */
export { jobSkillTokens } from "@/lib/jobs-v2/relevance";

/** The client-side half of the filter set. `omit` drops one key, for the "what excludes most" hints. */
interface ClientFilterInput {
  exp: string;
  skills: string[];
  posted: string;
  salary: string;
  fav: boolean;
}

type ClientFilterKey = keyof ClientFilterInput;

function applyClientFilters(
  jobs: JobV2[],
  filters: ClientFilterInput,
  omit?: ClientFilterKey,
): JobV2[] {
  let result = jobs;

  if (filters.fav && omit !== "fav") {
    result = result.filter((job) => job.is_favourited === true);
  }
  if (filters.exp && omit !== "exp") {
    result = result.filter((job) => experienceMatchesFilter(job.years_of_experience, filters.exp));
  }
  if (filters.skills.length && omit !== "skills") {
    // EXACT, case-folded token equality. The old `t.includes(s)` returned every JavaScript job
    // for "Java" and literally everything for "R".
    const wanted = new Set(filters.skills.map(foldToken).filter(Boolean));
    result = result.filter((job) => jobSkillTokens(job).some((token) => wanted.has(token)));
  }
  if (filters.posted && omit !== "posted") {
    const window = POSTED_WINDOWS[filters.posted];
    if (window) {
      const cutoff = Date.now() - window;
      result = result.filter((job) => {
        const posted = toDate(job.created_at);
        return posted ? posted.getTime() >= cutoff : false;
      });
    }
  }
  if (filters.salary && omit !== "salary") {
    const wantDisclosed = filters.salary === "disclosed";
    result = result.filter((job) => (formatSalary(job.salary) !== null) === wantDisclosed);
  }

  return result;
}

export interface ExcludingHint {
  key: string;
  label: string;
  excluded: number;
}

export interface UseJobFiltersResult {
  url: JobsUrlStateApi;

  tab: BoardTab;
  setTab: (tab: BoardTab) => void;
  view: JobsView;
  setView: (view: JobsView) => void;
  sort: BoardSort;
  setSort: (sort: BoardSort) => void;
  /** True when the learner has skills on file, so "Most relevant" is a real option. */
  canSortByRelevance: boolean;

  /** The current page slice, already filtered and sorted. */
  jobs: JobV2[];
  /** How many jobs match everything currently applied. */
  matchingCount: number;
  /** The widest honest total we know — `response.count` when it is larger than what we hold. */
  totalCount: number;
  /** "(137 total)" when client filtering has reduced the set below the server's count. */
  totalHint?: string;

  page: number;
  pageSize: number;
  pageCount: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  loading: boolean;
  /** A refetch behind content that is already on screen. The list dims; it does not unmount. */
  refetching: boolean;
  loadError: string | null;
  reload: () => void;

  showLock: boolean;
  savedCount: number;

  /**
   * The learner's own skills, folded for comparison. Empty when we do not know them, and every
   * consumer renders nothing in that case rather than a zero or a guess.
   */
  learnerTokens: Set<string>;
  /** True when this page was re-ordered for company variety (see `interleaveByCompany`). */
  variedByCompany: boolean;

  locationOptions: FacetOption[];
  jobTypeOptions: FacetOption[];
  employmentOptions: FacetOption[];
  skillFacets: SkillFacet[];
  /** How many skills exist beyond the windowed slice. */
  skillOverflow: number;

  isFiltered: boolean;
  activeFilterCount: number;
  activeChips: ActiveFilterChip[];
  clearFilters: () => void;
  /** Which filters are excluding the most, for the "nothing matches" hints. */
  excludingHints: ExcludingHint[];

  onFavoriteChange: (jobId: number, favorited: boolean) => void;
}

export function useJobFilters(): UseJobFiltersResult {
  const { t } = useTranslation("common");
  const url = useJobsUrlState({ defaults: { view: "card", size: 20, tab: "browse" } });
  const { state, set } = url;
  const { showLock, reportError: reportProfileLock } = useModuleLocked("jobs");
  // The learner's skills come from the profile the gate provider ALREADY fetched on this page
  // load: no second request, no new endpoint, and nothing rendered when we do not know them.
  const { skills: profileSkills } = useProfileGate();
  // `profileSkills` is a fresh array on every provider render, so it is folded once here and
  // the resulting Set identity is what the memoised cards compare on.
  const learnerTokens = useMemo(() => learnerSkillTokens(profileSkills), [profileSkills]);
  const seq = useSeq();

  const [allJobs, setAllJobs] = useState<JobV2[]>([]);
  /**
   * The last response fetched with NO server filter applied. Facet option lists are built from
   * it, so narrowing to one location never leaves that location as the only option you can
   * choose — which is how a facet control locks itself shut.
   */
  const [facetJobs, setFacetJobs] = useState<JobV2[]>([]);
  const [serverCount, setServerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadedOnceRef = useRef(false);

  const { q, loc, type: jobType, emp, exp, skills, posted, salary, fav, page, size, sort } = state;

  const fetchJobs = useCallback(async () => {
    const token = seq.next();
    if (loadedOnceRef.current) setRefetching(true);
    else setLoading(true);
    setLoadError(null);

    const apiFilters: JobV2Filters = {
      client_id: config.clientId,
      location: loc || undefined,
      job_type: jobType || undefined,
      employment_type: emp || undefined,
      search: q.trim() || undefined,
    };
    const unfiltered =
      !apiFilters.location && !apiFilters.job_type && !apiFilters.employment_type && !apiFilters.search;

    try {
      const res = await jobsV2Service.getJobs(apiFilters);
      // A newer request owns the screen. Type "eng", pause, type "ineer": without this the
      // slower first response lands last and overwrites the correct rows.
      if (!seq.isCurrent(token)) return;
      setAllJobs(res.results);
      // The endpoint's own total. It used to be fetched and thrown away, so "N jobs found"
      // reported the size of whatever the server happened to return.
      setServerCount(res.count);
      if (unfiltered) setFacetJobs(res.results);
    } catch (err) {
      if (!seq.isCurrent(token)) return;
      // A profile_incomplete 403 is not an error to report — it flips the lock on, and the
      // lock card explains it. Clearing here is deliberate: the server is the authority on
      // what this learner may see, and ProfileLockCard replaces the list entirely.
      if (reportProfileLock(err)) {
        setAllJobs([]);
        setServerCount(0);
        return;
      }
      // NEVER `setAllJobs([])`. An empty array here renders "No jobs found", which lies to the
      // learner about their own board and blames them for a server fault (spec 10.8).
      setLoadError(
        (err as Error)?.message ??
          (t("jobsV2.failedToLoad", { defaultValue: "Failed to load jobs" }) as string),
      );
    } finally {
      if (seq.isCurrent(token)) {
        loadedOnceRef.current = true;
        setLoading(false);
        setRefetching(false);
      }
    }
  }, [loc, jobType, emp, q, seq, reportProfileLock, t]);

  // The effect refetches on the FILTER VALUES, never on `fetchJobs`' identity.
  //
  // This page shipped an infinite fetch loop twice: `fetchJobs` is a useCallback, one of its
  // deps was an unmemoized function, so every render produced a new `fetchJobs`, which re-fired
  // the effect, which set state, which rendered again. Depending on primitives instead of a
  // function identity removes the whole CLASS, so the next unstable dep cannot resurrect it.
  const serverFilterKey = [loc, jobType, emp, q.trim()].join("|");
  const fetchJobsRef = useRef(fetchJobs);
  fetchJobsRef.current = fetchJobs;

  useEffect(() => {
    void fetchJobsRef.current();
  }, [serverFilterKey]);

  const reload = useCallback(() => {
    void fetchJobsRef.current();
  }, []);

  /* ---- derived: tab / view / sort ------------------------------------- */

  const tab: BoardTab =
    state.tab === "applied" ? "applied" : state.tab === "saved" || fav ? "saved" : "browse";

  const setTab = useCallback(
    (next: BoardTab) => {
      // `fav` and `tab` are written together so a pasted `?fav=1` and a clicked Saved tab can
      // never disagree about which pane is open.
      set(next === "saved" ? { tab: "saved", fav: true, page: 1 } : { tab: next, fav: false, page: 1 });
    },
    [set],
  );

  const setView = useCallback((next: JobsView) => set({ view: next }), [set]);
  const setSort = useCallback((next: BoardSort) => set({ sort: next }), [set]);
  const setPage = useCallback((next: number) => set({ page: next }), [set]);
  const setPageSize = useCallback((next: number) => set({ size: next, page: 1 }), [set]);

  /* ---- derived: filtering --------------------------------------------- */

  const clientFilters = useMemo<ClientFilterInput>(
    () => ({ exp, skills, posted, salary, fav: tab === "saved" }),
    [exp, skills, posted, salary, tab],
  );

  const filteredJobs = useMemo(
    () => applyClientFilters(allJobs, clientFilters),
    [allJobs, clientFilters],
  );

  const canSortByRelevance = learnerTokens.size > 0;

  /**
   * A pasted `?sort=relevant` from a learner who has since emptied their skills, or a link
   * shared with someone else, must not silently mean something different from what it says.
   * It falls back to the default order rather than pretending to rank.
   */
  const effectiveSort: BoardSort = useMemo(() => {
    const known = (SORT_VALUES as readonly string[]).includes(sort) ? (sort as BoardSort) : "";
    return known === "relevant" && !canSortByRelevance ? "" : known;
  }, [sort, canSortByRelevance]);

  const sortedJobs = useMemo(() => {
    const byTime = (value: string | undefined) => toDate(value)?.getTime() ?? 0;
    const next = [...filteredJobs];
    switch (effectiveSort) {
      case "relevant":
        // Ties break on recency, so the sort is total and the list does not shuffle between
        // renders. The COUNT is the key; no weighting, no score, nothing shown as a percentage.
        return next.sort(
          (a, b) =>
            matchCount(b, learnerTokens) - matchCount(a, learnerTokens) ||
            byTime(b.created_at) - byTime(a.created_at),
        );
      case "oldest":
        return next.sort((a, b) => byTime(a.created_at) - byTime(b.created_at));
      case "company":
        return next.sort((a, b) => (a.company_name || "").localeCompare(b.company_name || ""));
      case "deadline":
        // Rows with no deadline sort last rather than to the front as epoch zero.
        return next.sort((a, b) => {
          const da = byTime(a.application_deadline) || Number.POSITIVE_INFINITY;
          const db = byTime(b.application_deadline) || Number.POSITIVE_INFINITY;
          return da - db;
        });
      default:
        return next.sort((a, b) => byTime(b.created_at) - byTime(a.created_at));
    }
  }, [filteredJobs, effectiveSort, learnerTokens]);

  const matchingCount = sortedJobs.length;
  const pageCount = Math.max(1, Math.ceil(matchingCount / Math.max(size, 1)));
  const safePage = Math.min(Math.max(page, 1), pageCount);

  /**
   * Company variety applies to the DEFAULT browse view only: no explicit sort, no search, no
   * filter. Anything the learner asked for is answered exactly as asked (see
   * `lib/jobs-v2/variety.ts` for why this exists at all).
   */
  const variedByCompany = tab === "browse" && effectiveSort === "" && !url.isFiltered;

  const jobs = useMemo(() => {
    const page = SUPPORTS_SERVER_PAGINATION
      ? sortedJobs
      : sortedJobs.slice((safePage - 1) * size, (safePage - 1) * size + size);
    // Applied to the PAGE, after slicing: a job never moves between pages, so pagination,
    // the counts and a bookmarked `?page=4` all keep meaning exactly what they meant.
    return variedByCompany ? interleaveByCompany(page) : page;
  }, [sortedJobs, safePage, size, variedByCompany]);

  /** The widest total we can honestly claim: the server's count, or what we hold if it is more. */
  const totalCount = Math.max(serverCount, allJobs.length);
  const totalHint =
    matchingCount < totalCount
      ? (t("jobsV2.board.totalHint", {
          count: totalCount,
          // `count` drives plural selection; `total` is the locale-grouped string that renders.
          total: formatCount(totalCount),
          defaultValue: "{{total}} total",
        }) as string)
      : undefined;

  /* ---- derived: facets ------------------------------------------------- */

  /** Facet options come from the unfiltered snapshot, with the current value always present. */
  const facetSource = facetJobs.length ? facetJobs : allJobs;

  const locationOptions = useMemo<FacetOption[]>(() => {
    const seen = new Map<string, string>();
    for (const job of facetSource) {
      const value = (job.location ?? "").trim();
      if (value && !seen.has(value)) seen.set(value, value);
    }
    if (loc && !seen.has(loc)) seen.set(loc, loc);
    return [...seen.values()]
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: value }));
  }, [facetSource, loc]);

  const jobTypeOptions = useMemo<FacetOption[]>(
    () =>
      JOB_TYPE_VALUES.map((value) => ({
        value,
        label: t(`jobsV2.board.jobType.${value}`, {
          defaultValue: value === "job" ? "Job" : "Internship",
        }) as string,
      })),
    [t],
  );

  const employmentOptions = useMemo<FacetOption[]>(
    () => EMPLOYMENT_TYPE_VALUES.map((value) => ({ value, label: value })),
    [],
  );

  const allSkillFacets = useMemo<SkillFacet[]>(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const job of allJobs) {
      // The same reader the filter matches with, so a facet can never offer a skill the
      // matcher does not recognise.
      for (const { label, token } of jobSkillEntries(job)) {
        const entry = counts.get(token);
        if (entry) entry.count += 1;
        else counts.set(token, { label, count: 1 });
      }
    }
    // A selected skill must survive even when the current result set no longer carries it,
    // or it becomes impossible to un-select from the list.
    for (const selected of skills) {
      const token = foldToken(selected);
      if (token && !counts.has(token)) counts.set(token, { label: selected, count: 0 });
    }
    return [...counts.entries()]
      .map(([token, entry]) => ({ token, label: entry.label, count: entry.count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [allJobs, skills]);

  /** Selected skills pin to the top; the rest window, so 600 tags do not render 600 chips. */
  const skillFacets = useMemo<SkillFacet[]>(() => {
    const selected = new Set(skills.map(foldToken));
    const pinned = allSkillFacets.filter((facet) => selected.has(facet.token));
    const rest = allSkillFacets.filter((facet) => !selected.has(facet.token));
    return [...pinned, ...rest.slice(0, SKILL_WINDOW)];
  }, [allSkillFacets, skills]);

  const skillOverflow = Math.max(0, allSkillFacets.length - skillFacets.length);

  const savedCount = useMemo(
    () => allJobs.reduce((n, job) => n + (job.is_favourited ? 1 : 0), 0),
    [allJobs],
  );

  /* ---- derived: active filter chips ------------------------------------ */

  const activeChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];
    const chip = (key: string, prefix: string, value: string, onRemove: () => void) =>
      chips.push({ key, label: `${prefix}: ${value}`, onRemove });

    if (q.trim()) {
      chip(
        "q",
        t("jobsV2.board.filter.search", { defaultValue: "Search" }) as string,
        q.trim(),
        () => set({ q: "" }),
      );
    }
    if (loc) {
      chip(
        "loc",
        t("jobsV2.board.filter.location", { defaultValue: "Location" }) as string,
        loc,
        () => set({ loc: "" }),
      );
    }
    if (jobType) {
      chip(
        "type",
        t("jobsV2.board.filter.jobType", { defaultValue: "Job type" }) as string,
        jobTypeOptions.find((o) => o.value === jobType)?.label ?? jobType,
        () => set({ type: "" }),
      );
    }
    if (emp) {
      chip(
        "emp",
        t("jobsV2.board.filter.employmentType", { defaultValue: "Employment type" }) as string,
        emp,
        () => set({ emp: "" }),
      );
    }
    if (exp) {
      chip(
        "exp",
        t("jobsV2.board.filter.experience", { defaultValue: "Experience" }) as string,
        t("jobsV2.meta.yearsRange", { range: exp, defaultValue: `${exp} years` }) as string,
        () => set({ exp: "" }),
      );
    }
    if (posted) {
      chip(
        "posted",
        t("jobsV2.board.filter.posted", { defaultValue: "Posted" }) as string,
        t(`jobsV2.board.posted.${posted}`, { defaultValue: posted }) as string,
        () => set({ posted: "" }),
      );
    }
    if (salary) {
      chip(
        "salary",
        t("jobsV2.board.filter.salary", { defaultValue: "Salary" }) as string,
        t(`jobsV2.board.salary.${salary}`, { defaultValue: salary }) as string,
        () => set({ salary: "" }),
      );
    }
    for (const skill of skills) {
      chips.push({
        key: `skill:${skill}`,
        label: `${t("jobsV2.board.filter.skill", { defaultValue: "Skill" })}: ${skill}`,
        onRemove: () => set({ skills: skills.filter((s) => s !== skill) }),
      });
    }
    return chips;
  }, [q, loc, jobType, emp, exp, posted, salary, skills, jobTypeOptions, set, t]);

  const clearFilters = useCallback(() => {
    // `fav` is the Saved TAB, not a filter chip, so clearing filters must not eject the
    // learner from the pane they are standing in.
    url.clearFilters();
  }, [url]);

  const excludingHints = useMemo<ExcludingHint[]>(() => {
    if (matchingCount > 0) return [];
    const candidates: Array<{ key: ClientFilterKey; label: string; active: boolean }> = [
      { key: "exp", label: t("jobsV2.board.filter.experience", { defaultValue: "Experience" }) as string, active: Boolean(exp) },
      { key: "skills", label: t("jobsV2.board.filter.skills", { defaultValue: "Skills" }) as string, active: skills.length > 0 },
      { key: "posted", label: t("jobsV2.board.filter.posted", { defaultValue: "Posted" }) as string, active: Boolean(posted) },
      { key: "salary", label: t("jobsV2.board.filter.salary", { defaultValue: "Salary" }) as string, active: Boolean(salary) },
    ];
    const hints: ExcludingHint[] = [];
    for (const candidate of candidates) {
      if (!candidate.active) continue;
      const without = applyClientFilters(allJobs, clientFilters, candidate.key).length;
      if (without > matchingCount) {
        hints.push({
          key: candidate.key,
          label: t("jobsV2.board.excluding", {
            filter: candidate.label,
            count: without - matchingCount,
            defaultValue: "{{filter}} is hiding {{count}} of these roles",
          }) as string,
          excluded: without - matchingCount,
        });
      }
    }
    return hints.sort((a, b) => b.excluded - a.excluded).slice(0, 3);
  }, [matchingCount, allJobs, clientFilters, exp, skills, posted, salary, t]);

  /* ---- favourites ------------------------------------------------------ */

  const onFavoriteChange = useCallback((jobId: number, favorited: boolean) => {
    const patch = (list: JobV2[]) =>
      list.map((job) => (job.id === jobId ? { ...job, is_favourited: favorited } : job));
    setAllJobs(patch);
    setFacetJobs(patch);
  }, []);

  return {
    url,
    tab,
    setTab,
    view: state.view,
    setView,
    sort: effectiveSort,
    setSort,
    canSortByRelevance,
    jobs,
    matchingCount,
    totalCount,
    totalHint,
    page: safePage,
    pageSize: size,
    pageCount,
    setPage,
    setPageSize,
    loading,
    refetching,
    loadError,
    reload,
    showLock,
    savedCount,
    learnerTokens,
    variedByCompany,
    locationOptions,
    jobTypeOptions,
    employmentOptions,
    skillFacets,
    skillOverflow,
    isFiltered: url.isFiltered,
    activeFilterCount: url.activeFilterCount,
    activeChips,
    clearFilters,
    excludingHints,
    onFavoriteChange,
  };
}
