"use client";

import { Box, Typography, ButtonBase } from "@mui/material";
import { useTranslation } from "react-i18next";

export type CourseFilter =
  | "all"
  | "drafts"
  | "published"
  | "free"
  | "paid";

interface CourseStatsSectionProps {
  draftCount: number;
  publishedCount: number;
  totalCount: number;
  freeCount: number;
  paidCount: number;
  activeFilter: CourseFilter;
  onFilterChange: (filter: CourseFilter) => void;
}

interface FilterChipProps {
  count: number;
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}

function FilterChip({ count, label, color, active, onClick }: FilterChipProps) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 0.75,
        borderRadius: 999,
        border: `1px solid ${active ? color : "var(--border-default)"}`,
        bgcolor: active
          ? `color-mix(in srgb, ${color} 14%, var(--card-bg) 86%)`
          : "var(--card-bg)",
        transition: "all 0.15s",
        "&:hover": {
          bgcolor: `color-mix(in srgb, ${color} 10%, var(--card-bg) 90%)`,
          borderColor: color,
        },
      }}
    >
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          bgcolor: color,
        }}
      />
      <Typography
        component="span"
        variant="body2"
        sx={{ fontWeight: 700, color, lineHeight: 1 }}
      >
        {count}
      </Typography>
      <Typography
        component="span"
        variant="body2"
        sx={{
          color: active ? color : "var(--font-secondary)",
          fontWeight: active ? 600 : 500,
          lineHeight: 1,
        }}
      >
        {label}
      </Typography>
    </ButtonBase>
  );
}

export function CourseStatsSection({
  draftCount,
  publishedCount,
  totalCount,
  freeCount,
  paidCount,
  activeFilter,
  onFilterChange,
}: CourseStatsSectionProps) {
  const { t } = useTranslation("common");
  return (
    <Box>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: "var(--font-primary)",
          fontSize: { xs: "1.25rem", sm: "1.5rem" },
          mb: 1,
        }}
      >
        {t("adminCourseBuilder.allCourses")}
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 2 }}>
        {t("adminCourseBuilder.glimpseProgress")}
      </Typography>

      {totalCount > 0 && (
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <FilterChip
            count={totalCount}
            label={t("adminCourseBuilder.total")}
            color="var(--font-secondary)"
            active={activeFilter === "all"}
            onClick={() => onFilterChange("all")}
          />
          <FilterChip
            count={draftCount}
            label={t("adminCourseBuilder.drafts")}
            color="var(--accent-indigo)"
            active={activeFilter === "drafts"}
            onClick={() => onFilterChange("drafts")}
          />
          <FilterChip
            count={publishedCount}
            label={t("adminCourseBuilder.published")}
            color="var(--success-500)"
            active={activeFilter === "published"}
            onClick={() => onFilterChange("published")}
          />
          <FilterChip
            count={freeCount}
            label={t("adminCourseBuilder.free")}
            color="var(--success-500)"
            active={activeFilter === "free"}
            onClick={() => onFilterChange("free")}
          />
          <FilterChip
            count={paidCount}
            label={t("adminCourseBuilder.paid")}
            color="var(--warning-500)"
            active={activeFilter === "paid"}
            onClick={() => onFilterChange("paid")}
          />
        </Box>
      )}
    </Box>
  );
}

