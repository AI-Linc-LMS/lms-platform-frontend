"use client";

import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography,
  InputAdornment,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

interface MockInterviewStudentsFiltersProps {
  search: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSearchChange: (value: string) => void;
  onSortByChange: (value: string) => void;
  onSortOrderChange: (value: "asc" | "desc") => void;
  totalCount?: number;
}

const getSortOptions = (t: (key: string) => string) => [
  { value: "total_interviews", label: t("adminMockInterview.totalInterviewsSort") },
  { value: "average_score", label: t("adminMockInterview.averageScoreSort") },
  { value: "completion_rate", label: t("adminMockInterview.completionRateSort") },
  { value: "student_name", label: t("adminMockInterview.nameSort") },
  { value: "completed_interviews", label: t("adminMockInterview.completedSort") },
];

export function MockInterviewStudentsFilters({
  search,
  sortBy,
  sortOrder,
  onSearchChange,
  onSortByChange,
  onSortOrderChange,
  totalCount,
}: MockInterviewStudentsFiltersProps) {
  const { t } = useTranslation("common");
  const SORT_OPTIONS = getSortOptions(t);
  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        mb: 3,
        borderRadius: 2,
        boxShadow:
          "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--border-default)",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        "&:hover": {
          boxShadow:
            "0 2px 8px color-mix(in srgb, var(--font-primary) 14%, transparent)",
          borderColor:
            "color-mix(in srgb, var(--font-secondary) 26%, var(--border-default) 74%)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 2,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            backgroundColor:
              "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:account-search" size={22} color="var(--accent-indigo)" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
            {t("adminMockInterview.findStudents")}
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
            {t("adminMockInterview.searchSortByPerformance")}
          </Typography>
        </Box>
        {totalCount != null && totalCount > 0 && (
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              backgroundColor:
                "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
              color: "var(--accent-indigo)",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          >
            {totalCount} {totalCount === 1 ? t("adminMockInterview.studentSingular") : t("adminMockInterview.studentsPlural")}
          </Box>
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
        }}
      >
        <TextField
          size="small"
          placeholder={t("adminMockInterview.searchByNameOrEmail")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearchChange(search);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconWrapper icon="mdi:magnify" size={20} color="var(--font-secondary)" />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: { xs: "1 1 100%", sm: "1 1 280px" },
            minWidth: 200,
            "& .MuiOutlinedInput-root": {
              backgroundColor: "var(--surface)",
              transition: "background-color 0.2s, border-color 0.2s",
              "&:hover": {
                backgroundColor: "var(--card-bg)",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor:
                    "color-mix(in srgb, var(--font-secondary) 34%, var(--border-default) 66%)",
                },
              },
              "&.Mui-focused": {
                backgroundColor: "var(--card-bg)",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "var(--accent-indigo)",
                  borderWidth: 2,
                },
              },
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 } }}>
          <InputLabel>{t("adminMockInterview.sortByLabel")}</InputLabel>
          <Select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            label={t("adminMockInterview.sortByLabel")}
          >
            {SORT_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 130 } }}>
          <InputLabel>{t("adminMockInterview.order")}</InputLabel>
          <Select
            value={sortOrder}
            onChange={(e) =>
              onSortOrderChange(e.target.value as "asc" | "desc")
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
