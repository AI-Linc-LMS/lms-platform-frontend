"use client";

import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Button,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

interface AICourseBuilderActionsProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  /** When true, only render the two action buttons (for top row). When false, only render search (for filter row). */
  buttonsOnly?: boolean;
}

export function AICourseBuilderActions({
  searchQuery = "",
  onSearchChange,
  buttonsOnly = false,
}: AICourseBuilderActionsProps) {
  const router = useRouter();
  const { t } = useTranslation("common");

  if (buttonsOnly) {
    return (
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          startIcon={<IconWrapper icon="mdi:text-box" size={20} />}
          onClick={() =>
            router.push("/admin/ai-course-builder/generate/description")
          }
          sx={{
            bgcolor: "var(--accent-indigo)",
            color: "var(--font-light)",
            "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
            whiteSpace: "nowrap",
          }}
        >
          {t("adminAICourseBuilder.generateFromDescription")}
        </Button>
        <Button
          variant="contained"
          startIcon={<IconWrapper icon="mdi:format-list-bulleted" size={20} />}
          onClick={() =>
            router.push("/admin/ai-course-builder/generate/structured-plan")
          }
          sx={{
            bgcolor: "var(--success-500)",
            color: "var(--font-light)",
            "&:hover": { bgcolor: "color-mix(in srgb, var(--success-500) 85%, black 15%)" },
            whiteSpace: "nowrap",
          }}
        >
          {t("adminAICourseBuilder.generateFromStructuredPlan")}
        </Button>
      </Box>
    );
  }

  return (
    <TextField
      placeholder={t("adminAICourseBuilder.searchJobsPlaceholder")}
      value={searchQuery}
      onChange={(e) => onSearchChange?.(e.target.value)}
      size="small"
      sx={{ flex: 1, minWidth: { xs: "100%", sm: 260 } }}
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
              onClick={() => onSearchChange?.("")}
              sx={{ color: "var(--font-tertiary)" }}
            >
              <IconWrapper icon="mdi:close" size={18} />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}
