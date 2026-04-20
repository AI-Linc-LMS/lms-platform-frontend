"use client";

import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Divider,
  Button,
  Autocomplete,
  createFilterOptions,
} from "@mui/material";
import { memo, useCallback, useMemo } from "react";
import { IconWrapper } from "@/components/common/IconWrapper";
import { JobFilters, Job } from "@/lib/services/jobs.service";
import { appendIndiaToLocationOptions } from "@/lib/jobs/job-filters-shared";
import { SkillsFilter } from "./SkillsFilter";

interface JobFiltersSidebarProps {
  filters: JobFilters;
  jobs: Job[];
  onFilterChange: (key: keyof JobFilters, value: string | string[]) => void;
  onClearAll?: () => void;
}

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

const LOCATION_FILTER_LIMIT = 50;

const JobFiltersSidebarComponent = ({
  filters,
  jobs,
  onFilterChange,
  onClearAll,
}: JobFiltersSidebarProps) => {
  const selectedSkills = filters.skills || [];

  const handleSkillsChange = useCallback(
    (skills: string[]) => {
      onFilterChange("skills", skills);
    },
    [onFilterChange]
  );

  const handleClearSkills = useCallback(() => {
    onFilterChange("skills", []);
  }, [onFilterChange]);

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
    (value: string) => {
      onFilterChange("location", value);
    },
    [onFilterChange]
  );

  const filterLocationOptions = useMemo(
    () =>
      createFilterOptions<string>({
        limit: LOCATION_FILTER_LIMIT,
        stringify: (option) => option,
      }),
    []
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
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconWrapper icon="mdi:filter" size={18} />
          <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 600 }}>
            Filters
          </Typography>
        </Box>
        {onClearAll && (
          <Button
            size="small"
            onClick={onClearAll}
            disabled={false} // Always enabled, even during filtering
            sx={{
              textTransform: "none",
              fontSize: "0.75rem",
              minWidth: "auto",
              px: 1,
              color: "#6366f1",
              cursor: "pointer",
              pointerEvents: "auto",
              "&:hover": {
                backgroundColor: "rgba(99, 102, 241, 0.08)",
              },
              "&:disabled": {
                color: "#6366f1",
                opacity: 1,
              },
            }}
          >
            Clear All
          </Button>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Date posted — same idea as LinkedIn "Date posted" */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          sx={{ mb: 1.5, fontWeight: 600, fontSize: "0.875rem" }}
        >
          Date posted
        </Typography>
        <TextField
          fullWidth
          select
          size="small"
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
      </Box>

      {/* Job Type Filter (job / internship) */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          sx={{ mb: 1.5, fontWeight: 600, fontSize: "0.875rem" }}
        >
          Job Type
        </Typography>
        <TextField
          fullWidth
          select
          size="small"
          value={filters.job_type || ""}
          onChange={handleJobTypeChange}
          sx={{
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
      </Box>

      {/* Employment Type Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          sx={{ mb: 1.5, fontWeight: 600, fontSize: "0.875rem" }}
        >
          Employment Type
        </Typography>
        <TextField
          fullWidth
          select
          size="small"
          value={filters.employment_type || ""}
          onChange={handleEmploymentTypeChange}
          sx={{
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

      {/* Location — typeahead (same options as hero bar) */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          sx={{ mb: 1.5, fontWeight: 600, fontSize: "0.875rem" }}
        >
          Location
        </Typography>
        <Autocomplete
          freeSolo
          fullWidth
          size="small"
          options={locationOptions}
          value={filters.location ?? ""}
          inputValue={filters.location ?? ""}
          onInputChange={(_, v) => handleLocationChange(v)}
          onChange={(_, v) => handleLocationChange(typeof v === "string" ? v : "")}
          filterOptions={filterLocationOptions}
          getOptionLabel={(o) => o}
          isOptionEqualToValue={(a, b) => a === b}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="All locations"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                },
              }}
            />
          )}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Skills Filter */}
      <SkillsFilter
        jobs={jobs}
        selectedSkills={selectedSkills}
        onSkillsChange={handleSkillsChange}
        onClearAll={handleClearSkills}
      />
    </Box>
  );
};

export const JobFiltersSidebar = memo(JobFiltersSidebarComponent);
JobFiltersSidebar.displayName = "JobFiltersSidebar";
