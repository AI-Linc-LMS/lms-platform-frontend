"use client";

import {
  Box,
  Typography,
  Pagination,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";

interface ContentPaginationProps {
  totalCount: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function ContentPagination({
  totalCount,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: ContentPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const startIndex = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = Math.min(totalCount, page * limit);

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
        backgroundColor: "#fafafa",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: "#6b7280",
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
        >
          Showing {startIndex} to {endIndex} of {totalCount} contents
        </Typography>
        <FormControl
          size="small"
          sx={{
            minWidth: { xs: 100, sm: 120 },
            "& .MuiInputBase-root": {
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
            },
          }}
        >
          <Select
            value={limit}
            onChange={(e) => {
              onLimitChange(Number(e.target.value));
              onPageChange(1);
            }}
            displayEmpty
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
          size="small"
          showFirstButton={false}
          showLastButton={false}
          boundaryCount={1}
          siblingCount={0}
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
