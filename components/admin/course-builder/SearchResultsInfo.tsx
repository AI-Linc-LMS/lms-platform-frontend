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
        bgcolor: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: 1,
      }}
    >
      <Typography variant="body2" sx={{ color: "#1e40af" }}>
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

