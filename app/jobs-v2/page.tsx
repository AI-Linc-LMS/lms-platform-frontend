"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, LinearProgress, Typography, Tabs, Tab, Chip } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { JobCardV2 } from "@/components/jobs-v2/JobCardV2";
import { NaukriJobSearchBar } from "@/components/jobs/NaukriJobSearchBar";
import { JobFiltersSidebar } from "@/components/jobs/JobFiltersSidebar";
import { MobileJobFilters } from "@/components/jobs/MobileJobFilters";
import { JobListHeader } from "@/components/jobs/JobListHeader";
import { JobPagination } from "@/components/jobs/JobPagination";
import { EmptyJobsIllustration } from "@/components/jobs-v2/illustrations";
import { AppliedJobsSection } from "@/components/jobs-v2/AppliedJobsSection";
import type { Job, JobFilters } from "@/lib/services/jobs.service";
import { jobsV2Service, JobV2, JobV2Filters } from "@/lib/services/jobs-v2.service";
import { useToast } from "@/components/common/Toast";
import { config } from "@/lib/config";
import { fetchAndMapExternalJsonJobs } from "@/lib/jobs/external-job-json-feed";
import {
  filterStudentVisibleFeedJobs,
  isExternalJsonFeedJob,
  mergeApiJobsWithExternalJson,
  normalizeApplyLinkKey,
  subscribeStudentFeedSuppression,
  syncExternalJsonJobFavoriteFlags,
} from "@/lib/jobs/external-json-jobs-store";
import {
  getDefaultStudentLocationAutocompleteOptions,
  INDIA_LOCATION_OPTION,
  jobPostedWithin,
  locationMatchesFilter,
} from "@/lib/jobs/job-filters-shared";
import {
  getCachedJobsV2Merged,
  jobsV2BrowseCacheKey,
  setCachedJobsV2Merged,
} from "@/lib/jobs/jobs-browse-cache";

const ITEMS_PER_PAGE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

/** Max scraper list pages to pull in the background (100 jobs/page). Prevents unbounded requests. */
const SCRAPER_PROGRESSIVE_MAX_PAGE = 50;

/** URL `tab`: default platform browse; `available` | `applied` */
type StudentJobsUrlTab = "platform" | "available" | "applied";

function parseStudentJobsTab(params: URLSearchParams): StudentJobsUrlTab {
  const t = params.get("tab")?.toLowerCase();
  if (t === "applied") return "applied";
  if (t === "available") return "available";
  return "platform";
}

function parseJobsV2PageSize(raw: string | null): number {
  if (!raw) return ITEMS_PER_PAGE;
  const n = parseInt(raw, 10);
  return PAGE_SIZE_OPTIONS.includes(n as (typeof PAGE_SIZE_OPTIONS)[number])
    ? n
    : ITEMS_PER_PAGE;
}

/** Parse job's years_of_experience string into min/max range. Returns null if unparseable. */
function parseExperienceRange(str: string | null | undefined): { min: number; max: number } | null {
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

/** Check if job's experience range overlaps with the selected filter range. */
function experienceMatchesFilter(
  jobExp: string | null | undefined,
  filterExp: string
): boolean {
  const filterRanges: Record<string, { min: number; max: number }> = {
    "0-1": { min: 0, max: 1 },
    "1-3": { min: 1, max: 3 },
    "3-5": { min: 3, max: 5 },
    "5-10": { min: 5, max: 10 },
    "10+": { min: 10, max: 99 },
  };

  const filterRange = filterRanges[filterExp];
  if (!filterRange) return true;

  const jobRange = parseExperienceRange(jobExp);

  if (!jobRange) {
    // Unparseable (e.g. empty, custom text) – include only for 0-1 (fresher/entry)
    return filterExp === "0-1";
  }

  // Ranges overlap if jobMin <= filterMax AND filterMin <= jobMax
  return jobRange.min <= filterRange.max && filterRange.min <= jobRange.max;
}

type JobsV2FiltersState = {
  location?: string;
  job_type?: string;
  employment_type?: string;
  experience?: string;
  search?: string;
  skills?: string[];
  posted_within?: string;
};

export default function JobsV2Page() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingMoreScraper, setLoadingMoreScraper] = useState(false);
  const [allJobs, setAllJobs] = useState<JobV2[]>([]);
  const [listMeta, setListMeta] = useState({ scraperHasNext: false });
  const apiResultsRef = useRef<JobV2[]>([]);
  const scraperNextPageRef = useRef(2);
  /** Mirrors listMeta.scraperHasNext so progressive fetch does not depend on listMeta in effect deps (avoids cancel/restart mid-chain). */
  const scraperHasNextRef = useRef(false);
  const scraperProgressiveRunningRef = useRef(false);
  const [filters, setFilters] = useState<JobsV2FiltersState>({});
  const [searchInput, setSearchInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [experienceInput, setExperienceInput] = useState("");
  const studentTab = useMemo(
    () => parseStudentJobsTab(searchParams),
    [searchParams]
  );

  const page = useMemo(() => {
    const raw = searchParams.get("page");
    const n = raw ? parseInt(raw, 10) : 1;
    return Number.isFinite(n) && n >= 1 ? n : 1;
  }, [searchParams]);

  const pageSize = useMemo(
    () => parseJobsV2PageSize(searchParams.get("page_size")),
    [searchParams]
  );

  const syncJobsListUrl = useCallback(
    (overrides: {
      page?: number;
      page_size?: number;
      tab?: StudentJobsUrlTab;
    }) => {
      const p = new URLSearchParams(searchParams.toString());
      const currentPage = (() => {
        const r = p.get("page");
        const n = r ? parseInt(r, 10) : 1;
        return Number.isFinite(n) && n >= 1 ? n : 1;
      })();
      const currentSize = parseJobsV2PageSize(p.get("page_size"));
      const nextPage = overrides.page !== undefined ? overrides.page : currentPage;
      const nextSize =
        overrides.page_size !== undefined ? overrides.page_size : currentSize;
      if (nextPage <= 1) p.delete("page");
      else p.set("page", String(nextPage));
      if (nextSize === ITEMS_PER_PAGE) p.delete("page_size");
      else p.set("page_size", String(nextSize));
      if (overrides.tab !== undefined) {
        if (overrides.tab === "platform") p.delete("tab");
        else p.set("tab", overrides.tab);
      }
      const qs = p.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      router.replace(url, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleStudentTabChange = useCallback(
    (_: React.SyntheticEvent, value: StudentJobsUrlTab) => {
      syncJobsListUrl({ page: 1, tab: value });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [syncJobsListUrl]
  );

  const goToPlatformBrowse = useCallback(() => {
    syncJobsListUrl({ page: 1, tab: "platform" });
  }, [syncJobsListUrl]);

  /** Commit location from hero Autocomplete (selection or freeSolo Enter) — updates API filters only on commit, not while typing. */
  const handleLocationCommit = useCallback(
    (value: string) => {
      const t = value.trim();
      setLocationInput(value);
      setFilters((prev) => ({ ...prev, location: t || undefined }));
      syncJobsListUrl({ page: 1 });
    },
    [syncJobsListUrl]
  );

  const fetchJobs = useCallback(async () => {
    const rawLoc = filters.location?.trim();
    const apiLocation =
      rawLoc && rawLoc.toLowerCase() !== INDIA_LOCATION_OPTION.toLowerCase()
        ? rawLoc
        : undefined;

    const apiFilters: JobV2Filters = {
      client_id: config.clientId,
      location: apiLocation,
      job_type: filters.job_type || undefined,
      employment_type: filters.employment_type || undefined,
      search: filters.search?.trim() || undefined,
    };

    const cacheKey = jobsV2BrowseCacheKey({
      clientId: config.clientId,
      location: apiLocation,
      job_type: apiFilters.job_type,
      employment_type: apiFilters.employment_type,
      search: apiFilters.search,
    });

    const cached = getCachedJobsV2Merged(cacheKey);
    if (cached !== null) {
      setAllJobs(
        filterStudentVisibleFeedJobs(syncExternalJsonJobFavoriteFlags(cached))
      );
      setLoading(false);
    } else {
      setLoading(true);
    }

    const loadMerged = async (): Promise<JobV2[]> => {
      scraperNextPageRef.current = 2;
      let apiResults: JobV2[] = [];
      try {
        const res = await jobsV2Service.getJobs(apiFilters);
        apiResults = res.results;
      } catch (err) {
        showToast((err as Error)?.message ?? "Failed to load jobs", "error");
      }
      apiResultsRef.current = apiResults;

      const emptyExt = {
        jobs: [] as JobV2[],
        total: 0,
        has_next: false,
        page: 1,
        limit: 100,
      };
      const ext = await fetchAndMapExternalJsonJobs({
        search: filters.search?.trim(),
        location: apiLocation,
        page: 1,
        limit: 100,
        maxPages: 1,
        replaceStore: true,
      }).catch(() => emptyExt);

      setListMeta({ scraperHasNext: ext.has_next });

      return filterStudentVisibleFeedJobs(
        syncExternalJsonJobFavoriteFlags(
          mergeApiJobsWithExternalJson(apiResults, ext.jobs)
        )
      );
    };

    try {
      const merged = await loadMerged();
      setCachedJobsV2Merged(cacheKey, merged);
      setAllJobs(merged);
    } catch {
      if (cached === null) {
        setAllJobs([]);
      }
    } finally {
      setLoading(false);
    }
  }, [filters.location, filters.job_type, filters.employment_type, filters.search, showToast]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    scraperHasNextRef.current = listMeta.scraperHasNext;
  }, [listMeta.scraperHasNext]);

  useEffect(() => {
    return subscribeStudentFeedSuppression(() => {
      setAllJobs((prev) => filterStudentVisibleFeedJobs(prev));
    });
  }, []);

  const handleSearchClick = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      search: searchInput.trim() || undefined,
      location: locationInput.trim() || undefined,
      experience: experienceInput.trim() || undefined,
    }));
    syncJobsListUrl({ page: 1 });
  }, [searchInput, locationInput, experienceInput, syncJobsListUrl]);

  const filteredJobs = useMemo(() => {
    let result = allJobs;
    if (searchInput.trim()) {
      const words = searchInput.toLowerCase().trim().split(/\s+/).filter(Boolean);
      result = result.filter((job) => {
        const searchable = [
          job.job_title ?? "",
          job.company_name ?? "",
          job.location ?? "",
          job.job_description ?? "",
          ...(job.tags ?? []),
          ...(job.mandatory_skills ?? []),
          ...(job.key_skills ?? []),
        ].join(" ").toLowerCase();
        return words.every((w) => searchable.includes(w));
      });
    }
    const effectiveLocation = filters.location?.trim() || "";
    if (effectiveLocation) {
      result = result.filter((job) =>
        locationMatchesFilter(job.location, effectiveLocation)
      );
    }
    if (filters.posted_within) {
      result = result.filter((job) =>
        jobPostedWithin(job.created_at, filters.posted_within)
      );
    }
    if (filters.skills && filters.skills.length > 0) {
      const skillsLower = filters.skills.map((s) => s.toLowerCase());
      result = result.filter((job) => {
        const jobTags = [
          ...(job.tags ?? []),
          ...(job.mandatory_skills ?? []),
          ...(job.key_skills ?? []),
        ].map((t) => String(t).toLowerCase());
        return skillsLower.some((s) =>
          jobTags.some((t) => t.includes(s))
        );
      });
    }
    if (filters.experience || experienceInput.trim()) {
      const expToUse = experienceInput.trim() || filters.experience;
      if (expToUse) {
        result = result.filter((job) =>
          experienceMatchesFilter(job.years_of_experience, expToUse)
        );
      }
    }
    return result;
  }, [
    allJobs,
    searchInput,
    locationInput,
    experienceInput,
    filters.skills,
    filters.experience,
    filters.location,
    filters.posted_within,
  ]);

  const filteredPlatformJobs = useMemo(
    () => filteredJobs.filter((j) => !isExternalJsonFeedJob(j)),
    [filteredJobs]
  );

  const filteredAvailableJobs = useMemo(
    () => filteredJobs.filter((j) => isExternalJsonFeedJob(j)),
    [filteredJobs]
  );

  /** Hero location field differs from last committed filters.location while user is typing. */
  const locationDirty = useMemo(
    () => locationInput.trim() !== (filters.location ?? "").trim(),
    [locationInput, filters.location]
  );

  /** No committed location → show full browse; if location is set, hide until input matches (dirty). */
  const showBrowseJobList =
    studentTab !== "applied" &&
    (!filters.location?.trim() || !locationDirty);

  const browseListJobs = useMemo((): JobV2[] => {
    if (!showBrowseJobList) return [];
    if (studentTab === "available") return filteredAvailableJobs;
    return filteredPlatformJobs;
  }, [
    showBrowseJobList,
    studentTab,
    filteredAvailableJobs,
    filteredPlatformJobs,
  ]);

  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return browseListJobs.slice(start, start + pageSize);
  }, [browseListJobs, page, pageSize]);

  const listHeaderTotalCount = browseListJobs.length;

  const maxPage = useMemo(
    () => Math.max(1, Math.ceil(browseListJobs.length / pageSize) || 1),
    [browseListJobs.length, pageSize]
  );

  useEffect(() => {
    if (page > maxPage) {
      syncJobsListUrl({ page: maxPage });
    }
  }, [page, maxPage, syncJobsListUrl]);

  const rawLocForScraper = filters.location?.trim();
  const apiLocationForScraper =
    rawLocForScraper && rawLocForScraper.toLowerCase() !== INDIA_LOCATION_OPTION.toLowerCase()
      ? rawLocForScraper
      : undefined;

  /** Single dep for progressive scraper effect — keeps useEffect arity stable for Fast Refresh. */
  const scraperProgressiveDepsKey = useMemo(
    () =>
      JSON.stringify({
        loading,
        search: filters.search ?? "",
        job_type: filters.job_type ?? "",
        employment_type: filters.employment_type ?? "",
        location: filters.location ?? "",
        apiLocation: apiLocationForScraper ?? "",
      }),
    [
      loading,
      filters.search,
      filters.job_type,
      filters.employment_type,
      filters.location,
      apiLocationForScraper,
    ]
  );

  useEffect(() => {
    if (loading) return;
    if (!config.jobScraperApiUrl?.trim()) return;
    if (!scraperHasNextRef.current) return;
    if (scraperProgressiveRunningRef.current) return;

    let cancelled = false;
    scraperProgressiveRunningRef.current = true;
    setLoadingMoreScraper(true);

    const mergeFeedPage = (extJobs: JobV2[]) => {
      setAllJobs((prev) => {
        const api = apiResultsRef.current;
        const seen = new Set<string>();
        const prevFeed: JobV2[] = [];
        for (const j of prev) {
          if (!isExternalJsonFeedJob(j)) continue;
          const k = normalizeApplyLinkKey(j.apply_link);
          if (!k || seen.has(k)) continue;
          seen.add(k);
          prevFeed.push(j);
        }
        for (const j of extJobs) {
          const k = normalizeApplyLinkKey(j.apply_link);
          if (!k || seen.has(k)) continue;
          seen.add(k);
          prevFeed.push(j);
        }
        return filterStudentVisibleFeedJobs(
          syncExternalJsonJobFavoriteFlags(
            mergeApiJobsWithExternalJson(api, prevFeed)
          )
        );
      });
    };

    (async () => {
      try {
        let hasNext = true;
        while (!cancelled && hasNext) {
          const p = scraperNextPageRef.current;
          if (p > SCRAPER_PROGRESSIVE_MAX_PAGE) {
            hasNext = false;
            break;
          }
          const ext = await fetchAndMapExternalJsonJobs({
            search: filters.search?.trim(),
            location: apiLocationForScraper,
            page: p,
            limit: 100,
            maxPages: 1,
            replaceStore: false,
          });
          if (cancelled) return;
          if (ext.jobs.length === 0) {
            hasNext = false;
            break;
          }
          scraperNextPageRef.current = p + 1;
          hasNext = ext.has_next;
          mergeFeedPage(ext.jobs);
        }
        scraperHasNextRef.current = hasNext;
        setListMeta({ scraperHasNext: hasNext });
      } catch {
        scraperHasNextRef.current = false;
        setListMeta({ scraperHasNext: false });
      } finally {
        scraperProgressiveRunningRef.current = false;
        if (!cancelled) setLoadingMoreScraper(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scraperProgressiveDepsKey]);

  useEffect(() => {
    if (loading) return;
    const cacheKey = jobsV2BrowseCacheKey({
      clientId: config.clientId,
      location: apiLocationForScraper,
      job_type: filters.job_type,
      employment_type: filters.employment_type,
      search: filters.search?.trim() || undefined,
    });
    setCachedJobsV2Merged(cacheKey, allJobs);
  }, [
    allJobs,
    loading,
    apiLocationForScraper,
    filters.job_type,
    filters.employment_type,
    filters.search,
  ]);

  const jobsListPreserveQuery = useMemo(() => {
    const p = new URLSearchParams();
    if (page > 1) p.set("page", String(page));
    if (pageSize !== ITEMS_PER_PAGE) p.set("page_size", String(pageSize));
    return p.toString();
  }, [page, pageSize]);

  const handleFilterChange = useCallback(
    (key: keyof JobFilters, value: string | string[]) => {
      if (key === "page" || key === "page_size") return;
      if (key === "location" && typeof value === "string") {
        setLocationInput(value);
      }
      setFilters((prev) => ({
        ...prev,
        [key]:
          Array.isArray(value) && value.length === 0 ? undefined : value ?? undefined,
      }));
      syncJobsListUrl({ page: 1 });
    },
    [syncJobsListUrl]
  );

  const handleSearchInputChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      syncJobsListUrl({ page: 1 });
    },
    [syncJobsListUrl]
  );

  const handleSearchClear = useCallback(() => {
    setSearchInput("");
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters({});
    setSearchInput("");
    setLocationInput("");
    setExperienceInput("");
    syncJobsListUrl({ page: 1 });
  }, [syncJobsListUrl]);

  const handlePageChange = useCallback(
    (_: unknown, value: number) => {
      syncJobsListUrl({ page: value });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [syncJobsListUrl]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      syncJobsListUrl({ page: 1, page_size: size });
    },
    [syncJobsListUrl]
  );

  const handleFavoriteChange = useCallback((jobId: number, favorited: boolean) => {
    setAllJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, is_favourited: favorited } : j
      )
    );
  }, []);

  const jobsForFilters = useMemo(
    (): Job[] =>
      allJobs.map((j) => ({
        id: j.id,
        job_title: j.job_title,
        company_name: j.company_name,
        company_logo: j.company_logo,
        location: j.location ?? "",
        job_description: j.job_description ?? "",
        tags: [...(j.tags ?? []), ...(j.mandatory_skills ?? []), ...(j.key_skills ?? [])],
        job_post_date: j.created_at ?? "",
        job_url: j.apply_link ?? "",
        job_type: j.job_type ?? "",
      })),
    [allJobs]
  );

  const compatibleFilters = {
    location: locationInput,
    job_type: filters.job_type,
    employment_type: filters.employment_type,
    experience: filters.experience,
    search: filters.search,
    skills: filters.skills,
    posted_within: filters.posted_within,
  };

  const locationOptions = useMemo(() => {
    const defaults = getDefaultStudentLocationAutocompleteOptions();
    const seen = new Set(defaults.map((d) => d.toLowerCase()));
    const fromJobs: string[] = [];
    for (const job of allJobs) {
      const loc = (job.location ?? "").trim();
      if (!loc) continue;
      const k = loc.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      fromJobs.push(loc);
    }
    fromJobs.sort((a, b) => a.localeCompare(b));
    return [...defaults, ...fromJobs];
  }, [allJobs]);

  return (
    <MainLayout>
      <Box
        sx={{
          display: { xs: "none", lg: "flex" },
          flexDirection: "column",
          minHeight: "calc(100vh - 64px)",
          backgroundColor: "var(--surface)",
        }}
      >
        {/* Hero — text-first layout aligned with admin /jobs-v2 (no illustration blob) */}
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            py: { xs: 1.5, md: 2 },
            background: "linear-gradient(180deg, var(--surface) 0%, color-mix(in srgb, var(--surface) 88%, var(--border-default) 12%) 100%)",
            borderBottom: "1px solid",
            borderColor: "color-mix(in srgb, var(--font-primary) 6%, transparent)",
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, flexWrap: "wrap" }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1.5rem", sm: "1.75rem" },
                  letterSpacing: "-0.025em",
                  color: "var(--font-primary-dark)",
                  lineHeight: 1.2,
                }}
              >
                Jobs
              </Typography>
              {showBrowseJobList && !loading && filteredJobs.length > 0 && (
                <Chip
                  label={`${filteredJobs.length} ${filteredJobs.length === 1 ? "job" : "jobs"}`}
                  size="small"
                  sx={{
                    height: 24,
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                    color: "var(--accent-indigo)",
                    border: "1px solid color-mix(in srgb, var(--accent-indigo) 20%, transparent)",
                  }}
                />
              )}
            </Box>
            <Typography variant="body2" sx={{ color: "var(--font-secondary)", mt: 0.5, fontSize: "0.9375rem" }}>
              Search by role, company, or skills. Filter by location and work type.
            </Typography>
          </Box>
          <Box sx={{ maxWidth: 960, width: "100%" }}>
            <NaukriJobSearchBar
              searchQuery={searchInput}
              onSearchChange={handleSearchInputChange}
              onClear={handleSearchClear}
              location={locationInput}
              onLocationInputChange={setLocationInput}
              onLocationCommit={handleLocationCommit}
              experience={experienceInput}
              onExperienceChange={(v) => {
                setExperienceInput(v);
                syncJobsListUrl({ page: 1 });
              }}
              locationOptions={locationOptions}
              onSearch={handleSearchClick}
            />
          </Box>
        </Box>

        <Box sx={{ display: "flex", flex: 1 }}>
          <Box
            sx={{
              width: 280,
              flexShrink: 0,
              p: 2.5,
              backgroundColor: "var(--card-bg)",
              borderInlineEnd: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: "var(--accent-indigo-dark)" }}>
              Refine results
            </Typography>
            <JobFiltersSidebar
              filters={compatibleFilters}
              jobs={jobsForFilters}
              onFilterChange={handleFilterChange}
              onClearAll={handleClearAllFilters}
            />
          </Box>

          <Box sx={{ flex: 1, p: 3, backgroundColor: "var(--surface)", minWidth: 0 }}>
            <Tabs
              value={studentTab}
              onChange={handleStudentTabChange}
              sx={{
                mb: 2,
                minHeight: 40,
                "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 40 },
                "& .Mui-selected": { color: "var(--accent-indigo)" },
                "& .MuiTabs-indicator": { backgroundColor: "var(--accent-indigo)" },
              }}
            >
              <Tab
                label={`Platform jobs (${filteredPlatformJobs.length})`}
                value="platform"
              />
              <Tab
                label={`Available jobs (${filteredAvailableJobs.length})`}
                value="available"
              />
              <Tab label="Applied jobs" value="applied" />
            </Tabs>
            {studentTab === "applied" ? (
              <AppliedJobsSection onBrowseJobs={goToPlatformBrowse} />
            ) : loading ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 320,
                  gap: 2,
                }}
              >
                <LinearProgress sx={{ width: "60%", height: 4, borderRadius: 2 }} />
                <Typography color="text.secondary">Loading jobs...</Typography>
              </Box>
            ) : !showBrowseJobList && locationDirty ? (
              <Box
                sx={{
                  p: 6,
                  textAlign: "center",
                  borderRadius: 2,
                  border: "1px dashed",
                  borderColor: "divider",
                  backgroundColor: "var(--card-bg)",
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, color: "var(--font-primary-dark)" }}>
                  Apply your location change
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 400, mx: "auto" }}>
                  Select a suggestion from the list or click Search to refresh results with this location.
                </Typography>
              </Box>
            ) : browseListJobs.length === 0 ? (
              <Box
                sx={{
                  p: 6,
                  textAlign: "center",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  backgroundColor: "var(--card-bg)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <EmptyJobsIllustration width={160} height={125} primaryColor="var(--font-tertiary)" />
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 600, color: "var(--font-primary-dark)" }}>
                  No jobs found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 360 }}>
                  Try adjusting your filters or search terms to find more opportunities
                </Typography>
              </Box>
            ) : (
              <>
                {loadingMoreScraper ? (
                  <LinearProgress sx={{ width: "100%", height: 2, borderRadius: 1, mb: 1 }} />
                ) : null}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
                  <JobListHeader
                    totalCount={listHeaderTotalCount}
                    pageSize={pageSize}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {paginatedJobs.map((job) => (
                    <JobCardV2
                      key={job.id}
                      job={job}
                      onFavoriteChange={handleFavoriteChange}
                      jobsListQuery={jobsListPreserveQuery || undefined}
                    />
                  ))}
                </Box>
                <Box sx={{ mt: 3 }}>
                  <JobPagination
                    totalCount={listHeaderTotalCount}
                    pageSize={pageSize}
                    page={page}
                    onPageChange={handlePageChange}
                  />
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: { xs: "flex", lg: "none" },
          flexDirection: "column",
          minHeight: "calc(100vh - 64px)",
          overflow: "hidden",
          backgroundColor: "var(--surface)",
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            p: 2,
            background: "linear-gradient(135deg, var(--surface) 0%, color-mix(in srgb, var(--surface) 88%, var(--border-default) 12%) 50%, var(--border-default) 100%)",
            borderBottom: "1px solid",
            borderColor: "divider",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconWrapper icon="mdi:briefcase-outline" size={28} color="var(--font-secondary)" />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--font-primary-dark)" }}>
                  Jobs
                </Typography>
                {showBrowseJobList && !loading && filteredJobs.length > 0 && (
                  <Chip
                    label={filteredJobs.length}
                    size="small"
                    sx={{
                      height: 22,
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                      color: "var(--accent-indigo)",
                      border: "1px solid color-mix(in srgb, var(--accent-indigo) 20%, transparent)",
                    }}
                  />
                )}
              </Box>
              <Typography variant="body2" sx={{ color: "var(--font-secondary)", fontSize: "0.8125rem" }}>
                Find opportunities
              </Typography>
            </Box>
          </Box>
          <NaukriJobSearchBar
            searchQuery={searchInput}
            onSearchChange={handleSearchInputChange}
            onClear={handleSearchClear}
            location={locationInput}
            onLocationInputChange={setLocationInput}
            onLocationCommit={handleLocationCommit}
            experience={experienceInput}
            onExperienceChange={(v) => {
              setExperienceInput(v);
              syncJobsListUrl({ page: 1 });
            }}
            locationOptions={locationOptions}
            onSearch={handleSearchClick}
            size="small"
          />
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: { xs: 2, sm: 3 },
            pb: { xs: 6, sm: 4 },
            backgroundColor: "var(--surface)",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <Box sx={{ mb: 2 }}>
            <MobileJobFilters
              searchQuery={searchInput}
              filters={compatibleFilters}
              jobs={jobsForFilters}
              onSearchChange={handleSearchInputChange}
              onFilterChange={handleFilterChange}
              onSearchClear={handleSearchClear}
              hideSearch
            />
          </Box>

          <Tabs
            value={studentTab}
            onChange={handleStudentTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 2,
              "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 40 },
              "& .Mui-selected": { color: "var(--accent-indigo)" },
              "& .MuiTabs-indicator": { backgroundColor: "var(--accent-indigo)" },
            }}
          >
            <Tab
              label={`Platform (${filteredPlatformJobs.length})`}
              value="platform"
            />
            <Tab
              label={`Available (${filteredAvailableJobs.length})`}
              value="available"
            />
            <Tab label="Applied" value="applied" />
          </Tabs>

          {studentTab === "applied" ? (
            <AppliedJobsSection onBrowseJobs={goToPlatformBrowse} />
          ) : loading ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 200,
                gap: 2,
              }}
            >
              <LinearProgress sx={{ width: "60%", height: 4, borderRadius: 2 }} />
              <Typography variant="body2" color="text.secondary">Loading jobs...</Typography>
            </Box>
          ) : !showBrowseJobList && locationDirty ? (
            <Box sx={{ p: 4, textAlign: "center", borderRadius: 2, border: "1px dashed", borderColor: "divider", backgroundColor: "var(--card-bg)" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "var(--font-primary-dark)" }}>
                Apply your location change
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Select from the list or click Search.
              </Typography>
            </Box>
          ) : browseListJobs.length === 0 ? (
            <Box
              sx={{
                p: 5,
                textAlign: "center",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "var(--card-bg)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <EmptyJobsIllustration width={140} height={110} primaryColor="var(--font-tertiary)" />
              <Typography variant="h6" sx={{ mt: 2, fontWeight: 600, color: "var(--font-primary-dark)" }}>
                No jobs found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Try adjusting your filters or search terms
              </Typography>
            </Box>
          ) : (
            <>
              {loadingMoreScraper ? (
                <LinearProgress sx={{ width: "100%", height: 2, borderRadius: 1, mb: 1 }} />
              ) : null}
              <JobListHeader
                totalCount={listHeaderTotalCount}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
              />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                {paginatedJobs.map((job) => (
                  <JobCardV2
                    key={job.id}
                    job={job}
                    onFavoriteChange={handleFavoriteChange}
                    jobsListQuery={jobsListPreserveQuery || undefined}
                  />
                ))}
              </Box>
              <Box sx={{ mt: 3, mb: 4 }}>
                <JobPagination
                  totalCount={listHeaderTotalCount}
                  pageSize={pageSize}
                  page={page}
                  onPageChange={handlePageChange}
                />
              </Box>
            </>
          )}
        </Box>
      </Box>
    </MainLayout>
  );
}
