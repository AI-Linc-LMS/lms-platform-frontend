"use client";

import { Box, Typography, Pagination } from "@mui/material";
import { PerPageSelect } from "@/components/common/PerPageSelect";

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
        <PerPageSelect
          value={limit}
          onChange={(v) => {
            onLimitChange(v);
            onPageChange(1);
          }}
        />
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

