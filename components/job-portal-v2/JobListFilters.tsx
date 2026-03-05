"use client";

import { Box, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { memo } from "react";

/** Single value for sort: "sortBy_sortOrder" so one dropdown is enough */
export const JOB_LIST_SORT_OPTIONS = [
  { value: "created_at_desc", sortBy: "created_at", sortOrder: "desc" as const, label: "Newest first" },
  { value: "created_at_asc", sortBy: "created_at", sortOrder: "asc" as const, label: "Oldest first" },
  { value: "updated_at_desc", sortBy: "updated_at", sortOrder: "desc" as const, label: "Recently updated" },
  { value: "role_asc", sortBy: "role", sortOrder: "asc" as const, label: "Role (A→Z)" },
  { value: "role_desc", sortBy: "role", sortOrder: "desc" as const, label: "Role (Z→A)" },
  { value: "company_name_asc", sortBy: "company_name", sortOrder: "asc" as const, label: "Company (A→Z)" },
  { value: "company_name_desc", sortBy: "company_name", sortOrder: "desc" as const, label: "Company (Z→A)" },
  { value: "application_deadline_asc", sortBy: "application_deadline", sortOrder: "asc" as const, label: "Deadline (soonest)" },
  { value: "application_deadline_desc", sortBy: "application_deadline", sortOrder: "desc" as const, label: "Deadline (latest)" },
] as const;

export function getSortFromValue(value: string): { sortBy: string; sortOrder: "asc" | "desc" } {
  const found = JOB_LIST_SORT_OPTIONS.find((o) => o.value === value);
  if (found) return { sortBy: found.sortBy, sortOrder: found.sortOrder };
  return { sortBy: "created_at", sortOrder: "desc" };
}

export function getValueFromSort(sortBy: string, sortOrder: "asc" | "desc"): string {
  const found = JOB_LIST_SORT_OPTIONS.find((o) => o.sortBy === sortBy && o.sortOrder === sortOrder);
  return found ? found.value : "created_at_desc";
}

interface JobListFiltersProps {
  isPublished: boolean | "";
  search: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onIsPublishedChange: (value: boolean | "") => void;
  onSearchChange: (value: string) => void;
  onSortByChange: (value: string) => void;
  onSortOrderChange: (value: "asc" | "desc") => void;
  /** If set, called once when sort dropdown changes (avoids two URL updates). */
  onSortChange?: (sortBy: string, sortOrder: "asc" | "desc") => void;
}

const JobListFiltersComponent = ({
  isPublished,
  search,
  sortBy,
  sortOrder,
  onIsPublishedChange,
  onSearchChange,
  onSortByChange,
  onSortOrderChange,
  onSortChange,
}: JobListFiltersProps) => {
  const sortValue = getValueFromSort(sortBy, sortOrder);

  const handleSortChange = (value: string) => {
    const { sortBy: nextSortBy, sortOrder: nextSortOrder } = getSortFromValue(value);
    if (onSortChange) {
      onSortChange(nextSortBy, nextSortOrder);
    } else {
      onSortByChange(nextSortBy);
      onSortOrderChange(nextSortOrder);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        label="Search"
        placeholder="Role, company..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        size="small"
        fullWidth
      />
      <FormControl size="small" fullWidth>
        <InputLabel>Published</InputLabel>
        <Select
          value={isPublished === "" ? "" : isPublished ? "true" : "false"}
          label="Published"
          onChange={(e) => {
            const v = e.target.value as string;
            onIsPublishedChange(v === "" ? "" : v === "true");
          }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="true">Published</MenuItem>
          <MenuItem value="false">Draft</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" fullWidth>
        <InputLabel>Sort</InputLabel>
        <Select
          value={sortValue}
          label="Sort"
          onChange={(e) => handleSortChange(e.target.value)}
        >
          {JOB_LIST_SORT_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export const JobListFilters = memo(JobListFiltersComponent);
JobListFilters.displayName = "JobListFilters";
