"use client";

import { Box, Typography, Pagination } from "@mui/material";
import { memo } from "react";
import type { Pagination as PaginationType } from "@/lib/job-portal-v2";

interface PaginationProps {
  pagination: PaginationType;
  itemLabel?: string;
  onPageChange: (page: number) => void;
}

const PaginationComponent = ({
  pagination,
  itemLabel = "items",
  onPageChange,
}: PaginationProps) => {
  const { current_page, total_pages, total, limit, has_next, has_previous } =
    pagination;

  if (total_pages <= 1 && total <= limit) {
    return null;
  }

  const startItem = (current_page - 1) * limit + 1;
  const endItem = Math.min(current_page * limit, total);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        mt: 3,
        mb: 2,
      }}
    >
      <Pagination
        count={total_pages}
        page={current_page}
        onChange={(_, value) => onPageChange(value)}
        color="primary"
        size="small"
        showFirstButton
        showLastButton
        siblingCount={0}
        sx={{
          "& .MuiPaginationItem-root": {
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
            "&.Mui-selected": {
              backgroundColor: "#6366f1",
              color: "#ffffff",
              "&:hover": {
                backgroundColor: "#4f46e5",
              },
            },
          },
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
        Showing {startItem} - {endItem} of {total} {itemLabel}
      </Typography>
    </Box>
  );
};

export const JobPortalPagination = memo(PaginationComponent);
JobPortalPagination.displayName = "JobPortalPagination";
