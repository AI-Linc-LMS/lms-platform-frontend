"use client";

import { Box, Pagination, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PerPageSelect } from "@/components/common/PerPageSelect";

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
  const { t } = useTranslation("common");
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
        borderTop: "1px solid var(--border-default)",
        backgroundColor:
          "color-mix(in srgb, var(--font-primary) 2.5%, var(--card-bg))",
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
            color: "var(--font-secondary)",
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
        >
          {t("adminManageStudents.showingStudents", {
            start: startItem,
            end: endItem,
            total: totalCount,
          })}
        </Typography>
        <PerPageSelect
          value={limit}
          onChange={(v) => {
            onLimitChange(v);
            onPageChange(1);
          }}
          minWidth={{ xs: "100%", sm: 120 }}
          SelectSx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
        />
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

