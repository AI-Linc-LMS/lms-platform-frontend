"use client";

import { Box, TextField, InputAdornment, IconButton, Button } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface CourseSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateClick: () => void;
}

export function CourseSearchBar({
  searchQuery,
  onSearchChange,
  onCreateClick,
}: CourseSearchBarProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        alignItems: { xs: "stretch", sm: "center" },
        flex: { lg: "0 0 auto" },
        minWidth: { sm: 300 },
      }}
    >
      <TextField
        placeholder="Search courses..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        size="small"
        sx={{ flex: 1, minWidth: { xs: "100%", sm: 250 } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IconWrapper icon="mdi:magnify" size={20} color="#9ca3af" />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => onSearchChange("")}
                sx={{ color: "#9ca3af" }}
              >
                <IconWrapper icon="mdi:close" size={18} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Button
        variant="contained"
        startIcon={<IconWrapper icon="mdi:plus" size={20} />}
        onClick={onCreateClick}
        sx={{
          bgcolor: "#6366f1",
          "&:hover": { bgcolor: "#4f46e5" },
          whiteSpace: "nowrap",
        }}
      >
        Add New Course
      </Button>
    </Box>
  );
}

