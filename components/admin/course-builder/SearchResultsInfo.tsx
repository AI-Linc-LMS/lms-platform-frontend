"use client";

import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface SearchResultsInfoProps {
  searchQuery: string;
  filteredCount: number;
  totalCount: number;
}

export function SearchResultsInfo({
  searchQuery,
  filteredCount,
  totalCount,
}: SearchResultsInfoProps) {
  const { t } = useTranslation("common");
  if (!searchQuery) return null;

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        bgcolor:
          "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
        border: "1px solid color-mix(in srgb, var(--accent-indigo) 35%, var(--border-default) 65%)",
        borderRadius: 1,
      }}
    >
      <Typography variant="body2" sx={{ color: "var(--accent-indigo)" }}>
        {filteredCount === 0 ? (
          <>
            {t("adminCourseBuilder.noCoursesFoundFor", { query: searchQuery })}
          </>
        ) : (
          <>
            {t("adminCourseBuilder.foundCourses", { count: filteredCount })}
            {filteredCount !== totalCount && <> {t("adminCourseBuilder.outOfTotal", { total: totalCount })}</>} {t("adminCourseBuilder.forQuery", { query: searchQuery })}
          </>
        )}
      </Typography>
    </Box>
  );
}

