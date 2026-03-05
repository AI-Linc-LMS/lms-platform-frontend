"use client";

import { useEffect, useState, useRef } from "react";
import { Box, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { memo } from "react";
import type { JobType } from "@/lib/job-portal-v2";

interface BrowseJobsFiltersProps {
  jobType: JobType | "";
  search: string;
  onJobTypeChange: (value: JobType | "") => void;
  onSearchChange: (value: string) => void;
}

const DEBOUNCE_MS = 400;

const BrowseJobsFiltersComponent = ({
  jobType,
  search,
  onJobTypeChange,
  onSearchChange,
}: BrowseJobsFiltersProps) => {
  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearchChange(localSearch);
      debounceRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localSearch]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        label="Search jobs"
        placeholder="Role, company, skills..."
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        size="small"
        fullWidth
      />
      <FormControl size="small" fullWidth>
        <InputLabel>Job type</InputLabel>
        <Select
          value={jobType}
          label="Job type"
          onChange={(e) => onJobTypeChange(e.target.value as JobType | "")}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="job">Job</MenuItem>
          <MenuItem value="internship">Internship</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export const BrowseJobsFilters = memo(BrowseJobsFiltersComponent);
BrowseJobsFilters.displayName = "BrowseJobsFilters";
