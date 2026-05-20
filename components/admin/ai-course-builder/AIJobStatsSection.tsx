"use client";

import { Box, Typography, ButtonBase } from "@mui/material";
import { useTranslation } from "react-i18next";

export type AIJobFilter =
  | "all"
  | "outline_ready"
  | "in_progress"
  | "completed"
  | "failed";

interface AIJobStatsSectionProps {
  outlineReadyCount: number;
  inProgressCount: number;
  completedCount: number;
  failedCount: number;
  totalCount: number;
  activeFilter: AIJobFilter;
  onFilterChange: (filter: AIJobFilter) => void;
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

export function AIJobStatsSection({
  outlineReadyCount,
  inProgressCount,
  completedCount,
  failedCount,
  totalCount,
  activeFilter,
  onFilterChange,
}: AIJobStatsSectionProps) {
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
        {t("adminAICourseBuilder.generationJobs")}
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 2 }}>
        {t("adminAICourseBuilder.glimpseProgress")}
      </Typography>

      {totalCount > 0 && (
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <FilterChip
            count={totalCount}
            label={t("adminAICourseBuilder.total")}
            color="var(--font-secondary)"
            active={activeFilter === "all"}
            onClick={() => onFilterChange("all")}
          />
          <FilterChip
            count={outlineReadyCount}
            label={t("adminAICourseBuilder.outlineReady")}
            color="var(--accent-indigo)"
            active={activeFilter === "outline_ready"}
            onClick={() => onFilterChange("outline_ready")}
          />
          <FilterChip
            count={inProgressCount}
            label={t("adminAICourseBuilder.inProgress")}
            color="var(--warning-500)"
            active={activeFilter === "in_progress"}
            onClick={() => onFilterChange("in_progress")}
          />
          <FilterChip
            count={completedCount}
            label={t("adminAICourseBuilder.completed")}
            color="var(--success-500)"
            active={activeFilter === "completed"}
            onClick={() => onFilterChange("completed")}
          />
          <FilterChip
            count={failedCount}
            label={t("adminAICourseBuilder.failed")}
            color="var(--error-500)"
            active={activeFilter === "failed"}
            onClick={() => onFilterChange("failed")}
          />
        </Box>
      )}
    </Box>
  );
}
