"use client";

import { Box, Typography, TextField, MenuItem } from "@mui/material";
import { memo, useCallback, useMemo } from "react";
import { JobFilters, Job } from "@/lib/services/jobs.service";
import { appendIndiaToLocationOptions } from "@/lib/jobs/job-filters-shared";
import { JobSearchBar } from "./JobSearchBar";
import { JobSearchIllustration } from "@/components/jobs-v2/illustrations";

const JOB_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "job", label: "Job" },
  { value: "internship", label: "Internship" },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "", label: "All" },
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Internship", label: "Internship" },
  { value: "Contract", label: "Contract" },
];

const DATE_POSTED_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "24h", label: "Past 24 hours" },
  { value: "7d", label: "Past week" },
  { value: "30d", label: "Past month" },
];

interface MobileJobFiltersProps {
  searchQuery: string;
  filters: JobFilters;
  jobs: Job[];
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  onFilterChange: (key: keyof JobFilters, value: string | string[]) => void;
  /** Hide search bar when search is in hero (e.g. student jobs page) */
  hideSearch?: boolean;
}

const MobileJobFiltersComponent = ({
  searchQuery,
  filters,
  jobs,
  onSearchChange,
  onSearchClear,
  onFilterChange,
  hideSearch = false,
}: MobileJobFiltersProps) => {
  const handleJobTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange("job_type", String(e.target.value || ""));
    },
    [onFilterChange]
  );

  const handleEmploymentTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange("employment_type", String(e.target.value || ""));
    },
    [onFilterChange]
  );

  const handleLocationChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange("location", String(e.target.value || ""));
    },
    [onFilterChange]
  );

  const handleDatePostedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange("posted_within", String(e.target.value || ""));
    },
    [onFilterChange]
  );

  const locationOptions = useMemo(() => {
    const seen = new Set<string>();
    const locations: string[] = [];
    for (const job of jobs) {
      const loc = (job.location || "").trim();
      if (loc && !seen.has(loc)) {
        seen.add(loc);
        locations.push(loc);
      }
    }
    return appendIndiaToLocationOptions(locations.sort((a, b) => a.localeCompare(b)));
  }, [jobs]);

  return (
    <Box
      sx={{
        width: "100%",
        backgroundColor: hideSearch ? "#fff" : "#ffffff",
        p: hideSearch ? { xs: 1.5, sm: 2 } : { xs: 1.5, sm: 2 },
        borderBottom: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        boxShadow: hideSearch ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
      }}
    >
      {!hideSearch && (
        <>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
            <JobSearchIllustration width={40} height={32} primaryColor="#6366f1" />
            <Box>
              <Typography
                variant="h5"
                sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" }, fontWeight: 700 }}
              >
                Jobs
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Find opportunities
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mb: 1.5 }}>
            <JobSearchBar
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              onClear={onSearchClear}
              size="small"
            />
          </Box>
        </>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 0 }}>
        <TextField
          select
          fullWidth
          size="small"
          label="Date posted"
          value={filters.posted_within || ""}
          onChange={handleDatePostedChange}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
            },
          }}
        >
          {DATE_POSTED_OPTIONS.map((opt) => (
            <MenuItem key={opt.value || "any"} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            select
            size="small"
            label="Job Type"
            value={filters.job_type || ""}
            onChange={handleJobTypeChange}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
              },
            }}
          >
            {JOB_TYPE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Employment"
            value={filters.employment_type || ""}
            onChange={handleEmploymentTypeChange}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
              },
            }}
          >
            {EMPLOYMENT_TYPE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <TextField
          select
          fullWidth
          size="small"
          label="Location"
          value={filters.location || ""}
          onChange={handleLocationChange}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
            },
          }}
        >
          <MenuItem value="">All Locations</MenuItem>
          {locationOptions.map((location) => (
            <MenuItem key={location} value={location}>
              {location}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </Box>
  );
};

export const MobileJobFilters = memo(MobileJobFiltersComponent);
MobileJobFilters.displayName = "MobileJobFilters";
