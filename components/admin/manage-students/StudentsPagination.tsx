"use client";

import { Box, Pagination, Typography, Select, MenuItem, FormControl } from "@mui/material";

interface StudentsPaginationProps {
  totalPages: number;
  page: number;
  totalCount: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function StudentsPagination({
  totalPages,
  page,
  totalCount,
  limit,
  onPageChange,
  onLimitChange,
}: StudentsPaginationProps) {
  const startItem = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalCount);

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
        gap: 2,
        borderTop: "1px solid #e5e7eb",
        backgroundColor: "#fafafa",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: "#6b7280",
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
        >
          Showing {startItem} to {endItem} of {totalCount} students
        </Typography>
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 120 } }}>
          <Select
            value={limit}
            onChange={(e) => {
              onLimitChange(Number(e.target.value));
              onPageChange(1);
            }}
            sx={{
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
            }}
          >
            <MenuItem value={10}>10 per page</MenuItem>
            <MenuItem value={25}>25 per page</MenuItem>
            <MenuItem value={50}>50 per page</MenuItem>
            <MenuItem value={100}>100 per page</MenuItem>
          </Select>
        </FormControl>
      </Box>
      {totalPages > 1 && (
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => onPageChange(value)}
          color="primary"
          size="medium"
          showFirstButton
          showLastButton
          sx={{
            "& .MuiPaginationItem-root": {
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
            },
          }}
        />
      )}
    </Box>
  );
}

