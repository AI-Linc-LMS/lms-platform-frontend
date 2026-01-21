"use client";

import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ContentType } from "@/lib/services/admin/admin-content-management.service";

interface ContentFiltersProps {
  searchQuery: string;
  selectedType: ContentType | "all";
  selectedVerificationStatus: "all" | "verified" | "unverified";
  onSearchChange: (query: string) => void;
  onTypeChange: (type: ContentType | "all") => void;
  onVerificationStatusChange: (status: "all" | "verified" | "unverified") => void;
  onClearFilters: () => void;
}

const contentTypes: ContentType[] = [
  "Quiz",
  "Article",
  "Assignment",
  "CodingProblem",
  "DevCodingProblem",
  "VideoTutorial",
];

export function ContentFilters({
  searchQuery,
  selectedType,
  selectedVerificationStatus,
  onSearchChange,
  onTypeChange,
  onVerificationStatusChange,
  onClearFilters,
}: ContentFiltersProps) {
  const hasActiveFilters =
    searchQuery !== "" ||
    selectedType !== "all" ||
    selectedVerificationStatus !== "all";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        mb: 3,
      }}
    >
      <TextField
        placeholder="Search content..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
              <IconWrapper
                icon="mdi:magnify"
                size={20}
                color="#9ca3af"
              />
            </Box>
          ),
        }}
        sx={{
          flex: 1,
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#ffffff",
          },
        }}
      />

      <FormControl sx={{ minWidth: { xs: "100%", sm: 180 } }}>
        <InputLabel>Type</InputLabel>
        <Select
          value={selectedType}
          label="Type"
          onChange={(e) => onTypeChange(e.target.value as ContentType | "all")}
        >
          <MenuItem value="all">All Types</MenuItem>
          {contentTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: { xs: "100%", sm: 180 } }}>
        <InputLabel>Verification Status</InputLabel>
        <Select
          value={selectedVerificationStatus}
          label="Verification Status"
          onChange={(e) =>
            onVerificationStatusChange(
              e.target.value as "all" | "verified" | "unverified"
            )
          }
        >
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="verified">Verified</MenuItem>
          <MenuItem value="unverified">Unverified</MenuItem>
        </Select>
      </FormControl>

      {hasActiveFilters && (
        <Button
          variant="outlined"
          onClick={onClearFilters}
          startIcon={<IconWrapper icon="mdi:close" size={18} />}
          sx={{
            minWidth: { xs: "100%", sm: "auto" },
            borderColor: "#d1d5db",
            color: "#6b7280",
            "&:hover": {
              borderColor: "#9ca3af",
              backgroundColor: "#f9fafb",
            },
          }}
        >
          Clear Filters
        </Button>
      )}
    </Box>
  );
}
