"use client";

import { Box, Pagination, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PerPageSelect } from "@/components/common/PerPageSelect";
import { PHONE } from "@/components/common/mobile/phone";
import { useIsPhone } from "./mobile";

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
  const isPhone = useIsPhone();
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
        // On a phone the students are loose cards, so the footer is not a strip of a table card.
        [PHONE]: {
          px: 0,
          alignItems: "stretch",
          borderTop: "none",
          backgroundColor: "transparent",
        },
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
          SelectSx={{
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
            [PHONE]: { fontSize: "0.875rem", "& .MuiSelect-select": { py: "12px" } },
          }}
        />
      </Box>
      {totalPages > 1 && (
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => onPageChange(value)}
          color="primary"
          size="medium"
          // A phone fits prev/next plus five 44px pages across 358px; with first/last and two
          // siblings it wrapped onto a second line.
          showFirstButton={!isPhone}
          showLastButton={!isPhone}
          siblingCount={isPhone ? 0 : 1}
          sx={{
            "& .MuiPaginationItem-root": {
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
            },
            [PHONE]: {
              alignSelf: "center",
              "& .MuiPaginationItem-root": { minWidth: 44, height: 44, fontSize: "0.875rem", mx: 0 },
              "& .MuiPagination-ul": { flexWrap: "nowrap" },
            },
          }}
        />
      )}
    </Box>
  );
}

