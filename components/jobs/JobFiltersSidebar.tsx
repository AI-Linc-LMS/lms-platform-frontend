"use client";

import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Divider,
  Button,
} from "@mui/material";
import { memo, useCallback, useMemo } from "react";
import { IconWrapper } from "@/components/common/IconWrapper";
import { JobFilters, Job } from "@/lib/services/jobs.service";
import { SkillsFilter } from "./SkillsFilter";
import { POSTED_WITHIN_OPTIONS } from "@/lib/jobs/jobs-v2-browse-page";

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
    return locations.sort((a, b) => a.localeCompare(b));
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

      {/* Location Filter - dynamic from jobs */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          sx={{ mb: 1.5, fontWeight: 600, fontSize: "0.875rem" }}
        >
          Location
        </Typography>
        <TextField
          fullWidth
          select
          size="small"
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
          {POSTED_WITHIN_OPTIONS.map((opt) => (
            <MenuItem key={opt.value || "any"} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
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
