"use client";

import { Box, Typography, Pagination } from "@mui/material";
import { PerPageSelect } from "@/components/common/PerPageSelect";

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
        <PerPageSelect
          value={limit}
          onChange={(v) => {
            onLimitChange(v);
            onPageChange(1);
          }}
          displayEmpty
          SelectSx={{ "& .MuiInputBase-root": { fontSize: { xs: "0.75rem", sm: "0.875rem" } } }}
        />
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

