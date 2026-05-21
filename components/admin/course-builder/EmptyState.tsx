"use client";

import { Box, Typography, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

interface EmptyStateProps {
  type: "no-courses" | "no-results";
  onCreateClick?: () => void;
  onClearSearch?: () => void;
}

export function EmptyState({
  type,
  onCreateClick,
  onClearSearch,
}: EmptyStateProps) {
  const { t } = useTranslation("common");
  if (type === "no-results") {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <IconWrapper
          icon="mdi:magnify"
          size={48}
          color="var(--font-tertiary)"
          style={{ marginBottom: 16 }}
        />
        <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
          {t("adminCourseBuilder.noCoursesFound")}
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 3 }}>
          {t("adminCourseBuilder.tryAdjustingSearch")}
        </Typography>
        {onClearSearch && (
          <Button
            variant="outlined"
            onClick={onClearSearch}
            sx={{ color: "var(--accent-indigo)", borderColor: "var(--accent-indigo)" }}
          >
            {t("adminCourseBuilder.clearSearchAndViewAll")}
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ textAlign: "center", py: 8 }}>
      <IconWrapper
        icon="mdi:book-open-variant"
        size={48}
        color="var(--font-tertiary)"
        style={{ marginBottom: 16 }}
      />
      <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
        {t("adminCourseBuilder.noCoursesYet")}
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 3 }}>
        {t("adminCourseBuilder.getStartedFirstCourse")}
      </Typography>
      {onCreateClick && (
        <Button
          variant="contained"
          startIcon={<IconWrapper icon="mdi:plus" size={20} />}
          onClick={onCreateClick}
          sx={{ bgcolor: "var(--accent-indigo)", color: "var(--font-light)" }}
        >
          {t("adminCourseBuilder.createFirstCourse")}
        </Button>
      )}
    </Box>
  );
}

