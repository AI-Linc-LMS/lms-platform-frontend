"use client";

import { Box, Typography, TextField, MenuItem } from "@mui/material";
import { memo, useCallback } from "react";
import { IconWrapper } from "@/components/common/IconWrapper";
import { JobFilters, Job } from "@/lib/services/jobs.service";
import { JobSearchBar } from "./JobSearchBar";

const STATIC_LOCATIONS = [
  "Ahmedabad",
  "Bengaluru",
  "Bhubaneswar",
  "Chennai",
  "Gurugram",
  "Guwahati",
  "Hybrid - Delhi/NCR",
  "Hybrid - Hyderabad",
  "Hybrid - Mumbai (All Areas)",
  "Hybrid - Noida",
  "Hyderabad",
  "Mumbai",
  "Noida",
  "Pune",
  "Remote",
];

interface MobileJobFiltersProps {
  searchQuery: string;
  filters: JobFilters;
  jobs: Job[];
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  onFilterChange: (key: keyof JobFilters, value: string | string[]) => void;
}

const MobileJobFiltersComponent = ({
  searchQuery,
  filters,
  jobs,
  onSearchChange,
  onSearchClear,
  onFilterChange,
}: MobileJobFiltersProps) => {
  const handleJobTypeChange = useCallback(
    (e: any) => {
      onFilterChange("job_type", String(e.target.value || ""));
    },
    [onFilterChange]
  );

  const handleLocationChange = useCallback(
    (e: any) => {
      onFilterChange("location", String(e.target.value || ""));
    },
    [onFilterChange]
  );

  return (
    <Box
      sx={{
        width: "100%",
        backgroundColor: "#ffffff",
        p: { xs: 1.5, sm: 2 },
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
        <IconWrapper
          icon="mdi:briefcase"
          size={24}
          style={{ color: "#6366f1" }}
        />
        <Typography
          variant="h5"
          sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" }, fontWeight: 700 }}
        >
          Job Portal
        </Typography>
      </Box>

      <Box sx={{ mb: 1.5 }}>
        <JobSearchBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onClear={onSearchClear}
          size="small"
        />
      </Box>

      <Box sx={{ display: "flex", gap: 1, mb: 0 }}>
        <TextField
          select
          size="small"
          label="Work Type"
          value={filters.job_type || ""}
          onChange={handleJobTypeChange}
          sx={{
            flex: 1,
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
            },
          }}
        >
          <MenuItem value="">All Types</MenuItem>
          <MenuItem value="Hybrid">Hybrid</MenuItem>
          <MenuItem value="On-site">On-site</MenuItem>
          <MenuItem value="Remote">Remote</MenuItem>
          <MenuItem value="Full-time">Full-time</MenuItem>
          <MenuItem value="Part-time">Part-time</MenuItem>
          <MenuItem value="Contract">Contract</MenuItem>
          <MenuItem value="Internship">Internship</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Location"
          value={filters.location || ""}
          onChange={handleLocationChange}
          sx={{
            flex: 1,
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
            },
          }}
        >
          <MenuItem value="">All Locations</MenuItem>
          {STATIC_LOCATIONS.map((location) => (
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
