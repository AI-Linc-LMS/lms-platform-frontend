"use client";

import { Box, Typography, Select, MenuItem, FormControl, Pagination } from "@mui/material";

interface PaginationControlsProps {
  totalItems: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  itemLabel: string;
}

export function PaginationControls({
  totalItems,
  page,
  limit,
  onPageChange,
  onLimitChange,
  itemLabel,
}: PaginationControlsProps) {
  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderTop: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: { xs: "column", sm: "row" },
        gap: { xs: 1.5, sm: 2 },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography
          variant="body2"
          sx={{
            color: "#6b7280",
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
        >
          Showing {Math.min(totalItems, (page - 1) * limit + 1)} to{" "}
          {Math.min(totalItems, page * limit)} of {totalItems} {itemLabel}
        </Typography>
        <FormControl size="small" sx={{ minWidth: { xs: 100, sm: 120 } }}>
          <Select
            value={limit}
            onChange={(e) => {
              onLimitChange(Number(e.target.value));
              onPageChange(1);
            }}
          >
            <MenuItem value={10}>10 per page</MenuItem>
            <MenuItem value={25}>25 per page</MenuItem>
            <MenuItem value={50}>50 per page</MenuItem>
            <MenuItem value={100}>100 per page</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Pagination
        count={Math.max(1, Math.ceil(totalItems / limit))}
        page={page}
        onChange={(_, value) => onPageChange(value)}
        color="primary"
        size="small"
        showFirstButton={false}
        showLastButton={false}
      />
    </Box>
  );
}

