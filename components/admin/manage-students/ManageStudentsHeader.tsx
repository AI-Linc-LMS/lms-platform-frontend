"use client";

import { Box, Typography, Chip, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

interface ManageStudentsHeaderProps {
  totalCount: number;
  onBulkEnrollClick?: () => void;
  onDownloadCsv?: () => void;
}

export function ManageStudentsHeader({
  totalCount,
  onBulkEnrollClick,
  onDownloadCsv,
}: ManageStudentsHeaderProps) {
  const { t } = useTranslation("common");
  return (
    <Box sx={{ mb: { xs: 3, sm: 4 } }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: { xs: 1, sm: 2 },
          mb: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flex: 1,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "var(--font-primary)",
              fontSize: { xs: "1.5rem", sm: "2rem" },
            }}
          >
            {t("adminManageStudents.title")}
          </Typography>
          {totalCount > 0 && (
            <Chip
              label={t("adminManageStudents.studentCount", { count: totalCount })}
              sx={{
                backgroundColor:
                  "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)",
                color: "var(--accent-indigo)",
                fontWeight: 600,
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                height: { xs: 28, sm: 32 },
              }}
            />
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {onDownloadCsv && (
            <Button
              variant="outlined"
              startIcon={<IconWrapper icon="mdi:download" size={20} />}
              onClick={onDownloadCsv}
              sx={{
                borderColor: "var(--accent-indigo)",
                color: "var(--accent-indigo)",
                "&:hover": {
                  borderColor: "var(--accent-indigo-dark)",
                  backgroundColor:
                    "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)",
                },
              }}
            >
              {t("adminManageStudents.downloadCsv")}
            </Button>
          )}
          {onBulkEnrollClick && (
            <Button
              variant="contained"
              startIcon={<IconWrapper icon="mdi:account-plus" size={20} />}
              onClick={onBulkEnrollClick}
              sx={{
                backgroundColor: "var(--accent-indigo)",
                color: "var(--font-light)",
                "&:hover": {
                  backgroundColor: "var(--accent-indigo-dark)",
                },
              }}
            >
              {t("adminManageStudents.bulkEnroll")}
            </Button>
          )}
        </Box>
      </Box>
      <Typography
        variant="body2"
        sx={{
          color: "var(--font-secondary)",
          fontSize: { xs: "0.75rem", sm: "0.875rem" },
        }}
      >
        {t("adminManageStudents.subtitle")}
      </Typography>
    </Box>
  );
}
