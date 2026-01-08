"use client";

import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Divider,
  Button,
} from "@mui/material";
import { memo, useCallback } from "react";
import { IconWrapper } from "@/components/common/IconWrapper";
import { JobFilters, Job } from "@/lib/services/jobs.service";
import { SkillsFilter } from "./SkillsFilter";

interface JobFiltersSidebarProps {
  filters: JobFilters;
  jobs: Job[];
  onFilterChange: (key: keyof JobFilters, value: string | string[]) => void;
  onClearAll?: () => void;
}

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
              pointerEvents: "auto", // Ensure it's always clickable
              "&:hover": {
                backgroundColor: "rgba(99, 102, 241, 0.08)",
              },
              "&:disabled": {
                color: "#6366f1",
                opacity: 1, // Keep visible even if disabled prop is set
              },
            }}
          >
            Clear All
          </Button>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Work Type Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          sx={{ mb: 1.5, fontWeight: 600, fontSize: "0.875rem" }}
        >
          Work Type
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
          <MenuItem value="">All Types</MenuItem>
          <MenuItem value="Hybrid">Hybrid</MenuItem>
          <MenuItem value="On-site">On-site</MenuItem>
          <MenuItem value="Remote">Remote</MenuItem>
          <MenuItem value="Full-time">Full-time</MenuItem>
          <MenuItem value="Part-time">Part-time</MenuItem>
          <MenuItem value="Contract">Contract</MenuItem>
          <MenuItem value="Internship">Internship</MenuItem>
        </TextField>
      </Box>

      {/* Location Filter */}
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
          {STATIC_LOCATIONS.map((location) => (
            <MenuItem key={location} value={location}>
              {location}
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
