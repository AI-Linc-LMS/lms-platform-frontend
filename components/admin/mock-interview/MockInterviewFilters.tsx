"use client";

import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Typography,
  InputAdornment,
  Button,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

export interface InterviewFiltersState {
  status: string;
  difficulty: string;
  topic: string;
  search: string;
  date_from: string;
  date_to: string;
  sort_by: string;
  sort_order: "asc" | "desc";
}

interface MockInterviewFiltersProps {
  filters: InterviewFiltersState;
  onFilterChange: (key: keyof InterviewFiltersState, value: string) => void;
  onClearFilters?: () => void;
}

const getStatusOptions = (t: (key: string) => string) => [
  { value: "", label: t("adminMockInterview.allStatuses") },
  { value: "scheduled", label: t("adminMockInterview.scheduled") },
  { value: "in_progress", label: t("adminMockInterview.inProgress") },
  { value: "completed", label: t("adminMockInterview.completed") },
  { value: "cancelled", label: t("adminMockInterview.cancelled") },
];

const getDifficultyOptions = (t: (key: string) => string) => [
  { value: "", label: t("adminMockInterview.allDifficulties") },
  { value: "Easy", label: t("adminMockInterview.easy") },
  { value: "Medium", label: t("adminMockInterview.medium") },
  { value: "Hard", label: t("adminMockInterview.hard") },
];

const getSortOptions = (t: (key: string) => string) => [
  { value: "created_at", label: t("adminMockInterview.sortCreatedDate") },
  { value: "duration", label: t("adminMockInterview.sortDuration") },
  { value: "student_name", label: t("adminMockInterview.sortStudentName") },
  { value: "difficulty", label: t("adminMockInterview.sortDifficulty") },
  { value: "status", label: t("adminMockInterview.sortStatus") },
  { value: "scheduled_date_time", label: t("adminMockInterview.sortScheduledDate") },
];

const hasActiveFilters = (f: InterviewFiltersState) =>
  !!(f.status || f.difficulty || f.topic || f.search || f.date_from || f.date_to);

export function MockInterviewFilters({
  filters,
  onFilterChange,
  onClearFilters,
}: MockInterviewFiltersProps) {
  const { t } = useTranslation("common");
  const hasFilters = hasActiveFilters(filters);
  const STATUS_OPTIONS = getStatusOptions(t);
  const DIFFICULTY_OPTIONS = getDifficultyOptions(t);
  const SORT_OPTIONS = getSortOptions(t);

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        mb: { xs: 2, sm: 3 },
        borderRadius: 2,
        boxShadow:
          "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--border-default)",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        "&:hover": {
          boxShadow:
            "0 2px 8px color-mix(in srgb, var(--font-primary) 14%, transparent)",
          borderColor: "color-mix(in srgb, var(--font-secondary) 26%, var(--border-default) 74%)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconWrapper icon="mdi:filter-variant" size={20} color="var(--accent-indigo)" />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
            {t("adminMockInterview.filterInterviews")}
          </Typography>
          {hasFilters && (
            <Box
              component="span"
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 1,
                backgroundColor:
                  "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
                color: "var(--accent-indigo)",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              {t("adminMockInterview.active")}
            </Box>
          )}
        </Box>
        {onClearFilters && hasFilters && (
          <Button
            size="small"
            startIcon={<IconWrapper icon="mdi:filter-off-outline" size={18} />}
            onClick={onClearFilters}
            sx={{
              color: "var(--font-secondary)",
              textTransform: "none",
              "&:hover": {
                backgroundColor:
                  "color-mix(in srgb, var(--font-secondary) 12%, var(--surface) 88%)",
                color: "var(--font-primary)",
              },
            }}
          >
            {t("adminMockInterview.clearFilters")}
          </Button>
        )}
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "1fr 1fr 1fr",
            lg: "1fr 1fr 1fr 1fr 1fr 1fr",
          },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        <TextField
          fullWidth
          size="small"
          label={t("adminMockInterview.search")}
          placeholder={t("adminMockInterview.searchPlaceholder")}
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconWrapper icon="mdi:magnify" size={20} color="var(--font-secondary)" />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              transition: "background-color 0.2s, border-color 0.2s",
              "&:hover": {
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor:
                    "color-mix(in srgb, var(--font-secondary) 34%, var(--border-default) 66%)",
                },
              },
              "&.Mui-focused": {
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "var(--accent-indigo)",
                  borderWidth: 2,
                },
              },
            },
          }}
        />
        <FormControl fullWidth size="small">
          <InputLabel>{t("adminMockInterview.status")}</InputLabel>
          <Select
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            label={t("adminMockInterview.status")}
          >
            {STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel>{t("adminMockInterview.difficulty")}</InputLabel>
          <Select
            value={filters.difficulty}
            onChange={(e) => onFilterChange("difficulty", e.target.value)}
            label={t("adminMockInterview.difficulty")}
          >
            {DIFFICULTY_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          size="small"
          label={t("adminMockInterview.topic")}
          placeholder={t("adminMockInterview.filterByTopic")}
          value={filters.topic}
          onChange={(e) => onFilterChange("topic", e.target.value)}
        />
        <TextField
          fullWidth
          size="small"
          label={t("adminMockInterview.dateFrom")}
          type="date"
          value={filters.date_from}
          onChange={(e) => onFilterChange("date_from", e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          fullWidth
          size="small"
          label={t("adminMockInterview.dateTo")}
          type="date"
          value={filters.date_to}
          onChange={(e) => onFilterChange("date_to", e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mt: 2,
          flexWrap: "wrap",
        }}
      >
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{t("adminMockInterview.sortBy")}</InputLabel>
          <Select
            value={filters.sort_by}
            onChange={(e) => onFilterChange("sort_by", e.target.value)}
            label={t("adminMockInterview.sortBy")}
          >
            {SORT_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>{t("adminMockInterview.order")}</InputLabel>
          <Select
            value={filters.sort_order}
            onChange={(e) =>
              onFilterChange("sort_order", e.target.value as "asc" | "desc")
            }
            label={t("adminMockInterview.order")}
          >
            <MenuItem value="asc">{t("adminMockInterview.ascending")}</MenuItem>
            <MenuItem value="desc">{t("adminMockInterview.descending")}</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
}
