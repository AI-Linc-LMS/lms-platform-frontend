"use client";

import { Box, TextField, InputAdornment, IconButton, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

interface CourseSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateClick: () => void;
  /** When false, hides "Add new course" (e.g. course manager view-only) */
  showCreateButton?: boolean;
}

export function CourseSearchBar({
  searchQuery,
  onSearchChange,
  onCreateClick,
  showCreateButton = true,
}: CourseSearchBarProps) {
  const { t } = useTranslation("common");
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        alignItems: { xs: "stretch", sm: "center" },
        flex: { lg: "0 0 auto" },
        minWidth: { sm: 300 },
      }}
    >
      <TextField
        placeholder={t("adminCourseBuilder.searchPlaceholder")}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        size="small"
        sx={{ flex: 1, minWidth: { xs: "100%", sm: 250 } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IconWrapper icon="mdi:magnify" size={20} color="var(--font-tertiary)" />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => onSearchChange("")}
                sx={{ color: "var(--font-tertiary)" }}
              >
                <IconWrapper icon="mdi:close" size={18} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      {showCreateButton ? (
        <Button
          variant="contained"
          startIcon={<IconWrapper icon="mdi:plus" size={20} />}
          onClick={onCreateClick}
          sx={{
            bgcolor: "var(--accent-indigo)",
            color: "var(--font-light)",
            "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
            whiteSpace: "nowrap",
          }}
        >
          {t("adminCourseBuilder.addNewCourse")}
        </Button>
      ) : null}
    </Box>
  );
}

