"use client";

import { Box, Typography, Pagination } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PerPageSelect } from "@/components/common/PerPageSelect";

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
  const { t } = useTranslation("common");
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const startIndex = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = Math.min(totalCount, page * limit);

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderTop: "1px solid var(--border-default)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: { xs: "column", sm: "row" },
        gap: { xs: 1.5, sm: 2 },
        backgroundColor: "var(--surface)",
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
            color: "var(--font-secondary)",
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
        >
          {t("adminContentManagement.showingXToYOfZ", { start: startIndex, end: endIndex, total: totalCount })}
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
