"use client";

import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("common");
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        border: "1px solid var(--border-default)",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => onTabChange(newValue)}
        sx={{
          borderBottom: "1px solid var(--border-default)",
          px: 2,
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.9375rem",
            minHeight: 56,
            color: "var(--font-secondary)",
            "&.Mui-selected": {
              color: "var(--accent-indigo)",
            },
          },
          "& .MuiTabs-indicator": {
            backgroundColor: "var(--accent-indigo)",
            height: 3,
            borderRadius: "3px 3px 0 0",
          },
        }}
      >
        <Tab label={`${t("assessments.all")} (${totalCount})`} />
        <Tab label={`${t("assessments.available")} (${availableCount})`} />
        <Tab label={`${t("assessments.completed")} (${completedCount})`} />
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
          placeholder={t("assessments.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconWrapper icon="mdi:magnify" size={20} color="var(--font-tertiary)" />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              backgroundColor: "var(--surface)",
              "& fieldset": {
                borderColor: "var(--border-default)",
              },
              "&:hover fieldset": {
                borderColor: "var(--border-light)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "var(--accent-indigo)",
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
              backgroundColor: "var(--surface)",
              "& fieldset": {
                borderColor: "var(--border-default)",
              },
              "&:hover fieldset": {
                borderColor: "var(--border-light)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "var(--accent-indigo)",
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


