"use client";

import {
  Box,
  Typography,
  Pagination,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";

interface AssessmentPaginationProps {
  totalCount: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function AssessmentPagination({
  totalCount,
  page,
  limit,
  onPageChange,
  onLimitChange,
}: AssessmentPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const startIndex = (page - 1) * limit + 1;
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
          Showing {startIndex} to {endIndex} of {totalCount} assessments
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
        disabled={totalPages <= 1}
        sx={{
          "& .MuiPaginationItem-root": {
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          },
        }}
      />
    </Box>
  );
}

