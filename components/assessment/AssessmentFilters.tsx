"use client";

import {
  Box,
  Paper,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface AssessmentFiltersProps {
  activeTab: number;
  sortBy: "recent" | "duration" | "questions";
  searchQuery: string;
  totalCount: number;
  availableCount: number;
  completedCount: number;
  onTabChange: (tab: number) => void;
  onSortChange: (sort: "recent" | "duration" | "questions") => void;
  onSearchChange: (query: string) => void;
}

export function AssessmentFilters({
  activeTab,
  sortBy,
  searchQuery,
  totalCount,
  availableCount,
  completedCount,
  onTabChange,
  onSortChange,
  onSearchChange,
}: AssessmentFiltersProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => onTabChange(newValue)}
        sx={{
          borderBottom: "1px solid #e5e7eb",
          px: 2,
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.9375rem",
            minHeight: 56,
            color: "#6b7280",
            "&.Mui-selected": {
              color: "#6366f1",
            },
          },
          "& .MuiTabs-indicator": {
            backgroundColor: "#6366f1",
            height: 3,
            borderRadius: "3px 3px 0 0",
          },
        }}
      >
        <Tab label={`All (${totalCount})`} />
        <Tab label={`Available (${availableCount})`} />
        <Tab label={`Completed (${completedCount})`} />
      </Tabs>

      {/* Search and Sort */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          p: 2,
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Search assessments..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconWrapper icon="mdi:magnify" size={20} color="#9ca3af" />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              backgroundColor: "#f9fafb",
              "& fieldset": {
                borderColor: "#e5e7eb",
              },
              "&:hover fieldset": {
                borderColor: "#d1d5db",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#6366f1",
              },
            },
          }}
        />
        <FormControl
          size="small"
          sx={{
            minWidth: { xs: "100%", sm: 200 },
          }}
        >
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={(e) => onSortChange(e.target.value as any)}
            sx={{
              borderRadius: 2,
              backgroundColor: "#f9fafb",
              "& fieldset": {
                borderColor: "#e5e7eb",
              },
              "&:hover fieldset": {
                borderColor: "#d1d5db",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#6366f1",
              },
            }}
          >
            <MenuItem value="recent">Most Recent</MenuItem>
            <MenuItem value="duration">Duration (Low to High)</MenuItem>
            <MenuItem value="questions">Questions (Low to High)</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
}


