"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Box, LinearProgress, Typography, Tabs, Tab } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { JobCardV2 } from "@/components/jobs-v2/JobCardV2";
import { NaukriJobSearchBar } from "@/components/jobs/NaukriJobSearchBar";
import { JobFiltersSidebar } from "@/components/jobs/JobFiltersSidebar";
import { MobileJobFilters } from "@/components/jobs/MobileJobFilters";
import { JobListHeader } from "@/components/jobs/JobListHeader";
import { JobPagination } from "@/components/jobs/JobPagination";
import { EmptyJobsIllustration, JobSearchIllustration } from "@/components/jobs-v2/illustrations";
import { AppliedJobsSection } from "@/components/jobs-v2/AppliedJobsSection";
import type { Job, JobFilters } from "@/lib/services/jobs.service";
import { jobsV2Service, JobV2, JobV2Filters } from "@/lib/services/jobs-v2.service";
import { useToast } from "@/components/common/Toast";
import { config } from "@/lib/config";

const ITEMS_PER_PAGE = 10;

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
};

export default function JobsV2Page() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [allJobs, setAllJobs] = useState<JobV2[]>([]);
  const [filters, setFilters] = useState<JobsV2FiltersState>({});
  const [searchInput, setSearchInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [experienceInput, setExperienceInput] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [activeTab, setActiveTab] = useState<"browse" | "applied">("browse");

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const apiFilters: JobV2Filters = {
        client_id: config.clientId,
        location: filters.location || undefined,
        job_type: filters.job_type || undefined,
        employment_type: filters.employment_type || undefined,
        search: filters.search?.trim() || undefined,
      };
      const res = await jobsV2Service.getJobs(apiFilters);
      setAllJobs(res.results);
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to load jobs", "error");
      setAllJobs([]);
    } finally {
      setLoading(false);
    }
  }, [filters.location, filters.job_type, filters.employment_type, filters.search, showToast]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSearchClick = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      search: searchInput.trim() || undefined,
      location: locationInput.trim() || undefined,
      experience: experienceInput.trim() || undefined,
    }));
    setPage(1);
  }, [searchInput, locationInput, experienceInput]);

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
    if (locationInput.trim()) {
      const loc = locationInput.trim().toLowerCase();
      result = result.filter((job) =>
        (job.location ?? "").toLowerCase().includes(loc)
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
  }, [allJobs, searchInput, locationInput, experienceInput, filters.skills, filters.experience]);

  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, page, pageSize]);

  const handleFilterChange = useCallback(
    (key: keyof JobFilters, value: string | string[]) => {
      if (key === "page" || key === "page_size") return;
      setFilters((prev) => ({
        ...prev,
        [key]:
          Array.isArray(value) && value.length === 0 ? undefined : value ?? undefined,
      }));
      setPage(1);
    },
    []
  );

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchInput(value);
    setPage(1);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchInput("");
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters({});
    setSearchInput("");
    setLocationInput("");
    setExperienceInput("");
    setPage(1);
  }, []);

  const handlePageChange = useCallback((_: unknown, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

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
    location: filters.location,
    job_type: filters.job_type,
    employment_type: filters.employment_type,
    experience: filters.experience,
    search: filters.search,
    skills: filters.skills,
  };

  const locationOptions = useMemo(() => {
    const seen = new Set<string>();
    const locations: string[] = [];
    for (const job of allJobs) {
      const loc = (job.location ?? "").trim();
      if (loc && !seen.has(loc)) {
        seen.add(loc);
        locations.push(loc);
      }
    }
    return locations.sort((a, b) => a.localeCompare(b));
  }, [allJobs]);

  return (
    <MainLayout>
      <Box
        sx={{
          display: { xs: "none", lg: "flex" },
          flexDirection: "column",
          minHeight: "calc(100vh - 64px)",
          backgroundColor: "var(--background)",
        }}
      >
        {/* Hero header - matches admin reports / courses style */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            gap: { xs: 2, md: 4 },
            p: 3,
            background:
              "linear-gradient(135deg, var(--background) 0%, var(--surface) 50%, color-mix(in srgb, var(--accent-indigo) 10%, var(--surface)) 100%)",
            borderBottom: "1px solid",
            borderColor: "divider",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: -40,
              right: -40,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              width: { xs: "100%", md: 180 },
              height: { xs: 120, md: 140 },
              position: "relative",
              zIndex: 1,
            }}
          >
            <JobSearchIllustration width={160} height={128} primaryColor="var(--accent-indigo)" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: "var(--font-primary)", letterSpacing: "-0.02em" }}>
              Find your next opportunity
            </Typography>
            <Typography
              variant="body1"
              sx={{ mb: 2.5, color: "var(--font-secondary)" }}
            >
              Search jobs by role, company, or skills. Filter by location and work type.
            </Typography>
            <Box sx={{ maxWidth: 960, width: "100%" }}>
              <NaukriJobSearchBar
                searchQuery={searchInput}
                onSearchChange={handleSearchInputChange}
                onClear={handleSearchClear}
                location={locationInput}
                onLocationChange={(v) => {
                  setLocationInput(v);
                  setPage(1);
                }}
                experience={experienceInput}
                onExperienceChange={(v) => {
                  setExperienceInput(v);
                  setPage(1);
                }}
                locationOptions={locationOptions}
                onSearch={handleSearchClick}
              />
            </Box>
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

          <Box sx={{ flex: 1, p: 3, backgroundColor: "var(--background)", minWidth: 0 }}>
            <Tabs
              value={activeTab}
              onChange={(_, v: "browse" | "applied") => setActiveTab(v)}
              sx={{
                mb: 2,
                "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
                "& .Mui-selected": { color: "var(--accent-indigo)" },
                "& .MuiTabs-indicator": { backgroundColor: "var(--accent-indigo)" },
              }}
            >
              <Tab label="Browse Jobs" value="browse" />
              <Tab label="Applied Jobs" value="applied" />
            </Tabs>
            {activeTab === "applied" ? (
              <AppliedJobsSection onBrowseJobs={() => setActiveTab("browse")} />
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
                <JobSearchIllustration width={100} height={80} primaryColor="var(--accent-indigo)" />
                <Typography color="text.secondary">Loading jobs...</Typography>
                <LinearProgress sx={{ width: "60%", height: 4, borderRadius: 2 }} />
              </Box>
            ) : paginatedJobs.length === 0 && activeTab === "browse" ? (
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
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 600, color: "var(--font-primary)" }}>
                  No jobs found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 360 }}>
                  Try adjusting your filters or search terms to find more opportunities
                </Typography>
              </Box>
            ) : activeTab === "browse" ? (
              <>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
                  <JobListHeader
                    totalCount={filteredJobs.length}
                    pageSize={pageSize}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {paginatedJobs.map((job) => (
                    <JobCardV2 key={job.id} job={job} />
                  ))}
                </Box>
                <Box sx={{ mt: 3 }}>
                  <JobPagination
                    totalCount={filteredJobs.length}
                    pageSize={pageSize}
                    page={page}
                    onPageChange={handlePageChange}
                  />
                </Box>
              </>
            ) : null}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: { xs: "flex", lg: "none" },
          flexDirection: "column",
          minHeight: "calc(100vh - 64px)",
          overflow: "hidden",
          backgroundColor: "var(--background)",
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            p: 2,
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)",
            borderBottom: "1px solid",
            borderColor: "divider",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <JobSearchIllustration width={48} height={38} primaryColor="var(--accent-indigo)" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
                Jobs
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Find opportunities
              </Typography>
            </Box>
          </Box>
          <NaukriJobSearchBar
            searchQuery={searchInput}
            onSearchChange={handleSearchInputChange}
            onClear={handleSearchClear}
            location={locationInput}
            onLocationChange={(v) => {
              setLocationInput(v);
              setPage(1);
            }}
            experience={experienceInput}
            onExperienceChange={(v) => {
              setExperienceInput(v);
              setPage(1);
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
            backgroundColor: "var(--background)",
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
            value={activeTab}
            onChange={(_, v: "browse" | "applied") => setActiveTab(v)}
            sx={{
              mb: 2,
              "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 40 },
              "& .Mui-selected": { color: "var(--accent-indigo)" },
              "& .MuiTabs-indicator": { backgroundColor: "var(--accent-indigo)" },
            }}
          >
            <Tab label="Browse Jobs" value="browse" />
            <Tab label="Applied Jobs" value="applied" />
          </Tabs>

          {activeTab === "applied" ? (
            <AppliedJobsSection onBrowseJobs={() => setActiveTab("browse")} />
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
              <JobSearchIllustration width={80} height={64} primaryColor="var(--accent-indigo)" />
              <Typography variant="body2" color="text.secondary">Loading jobs...</Typography>
              <LinearProgress sx={{ width: "60%", height: 4, borderRadius: 2 }} />
            </Box>
          ) : paginatedJobs.length === 0 && activeTab === "browse" ? (
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
              <Typography variant="h6" sx={{ mt: 2, fontWeight: 600, color: "var(--font-primary)" }}>
                No jobs found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Try adjusting your filters or search terms
              </Typography>
            </Box>
          ) : activeTab === "browse" ? (
            <>
              <JobListHeader
                totalCount={filteredJobs.length}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
              />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                {paginatedJobs.map((job) => (
                  <JobCardV2 key={job.id} job={job} onFavoriteChange={handleFavoriteChange} />
                ))}
              </Box>
              <Box sx={{ mt: 3, mb: 4 }}>
                <JobPagination
                  totalCount={filteredJobs.length}
                  pageSize={pageSize}
                  page={page}
                  onPageChange={handlePageChange}
                />
              </Box>
            </>
          ) : null}
        </Box>
      </Box>
    </MainLayout>
  );
}
