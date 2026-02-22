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

const SORT_OPTIONS = [
  { value: "total_interviews", label: "Total Interviews" },
  { value: "average_score", label: "Average Score" },
  { value: "completion_rate", label: "Completion Rate" },
  { value: "student_name", label: "Name" },
  { value: "completed_interviews", label: "Completed" },
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
  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        mb: 3,
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        "&:hover": {
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          borderColor: "#d1d5db",
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
            backgroundColor: "#eef2ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:account-search" size={22} color="#6366f1" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#111827" }}>
            Find students
          </Typography>
          <Typography variant="caption" sx={{ color: "#6b7280" }}>
            Search and sort students by mock interview performance
          </Typography>
        </Box>
        {totalCount != null && totalCount > 0 && (
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              backgroundColor: "#eef2ff",
              color: "#6366f1",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          >
            {totalCount} {totalCount === 1 ? "student" : "students"}
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
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearchChange(search);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconWrapper icon="mdi:magnify" size={20} color="#6b7280" />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: { xs: "1 1 100%", sm: "1 1 280px" },
            minWidth: 200,
            "& .MuiOutlinedInput-root": {
              backgroundColor: "#f9fafb",
              transition: "background-color 0.2s, border-color 0.2s",
              "&:hover": {
                backgroundColor: "#ffffff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#9ca3af",
                },
              },
              "&.Mui-focused": {
                backgroundColor: "#ffffff",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#6366f1",
                  borderWidth: 2,
                },
              },
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 } }}>
          <InputLabel>Sort by</InputLabel>
          <Select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            label="Sort by"
          >
            {SORT_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 130 } }}>
          <InputLabel>Order</InputLabel>
          <Select
            value={sortOrder}
            onChange={(e) =>
              onSortOrderChange(e.target.value as "asc" | "desc")
            }
            label="Order"
          >
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
}
