"use client";

import { Box, Typography, Chip, Button, Paper } from "@mui/material";
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
    <Paper
      elevation={0}
      sx={{
        mb: { xs: 2.5, sm: 3 },
        p: { xs: 2.5, sm: 3 },
        borderRadius: 3,
        border: "1px solid var(--border-default)",
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--accent-indigo) 7%, var(--card-bg)) 0%, var(--card-bg) 48%, var(--card-bg) 100%)",
        boxShadow:
          "0 4px 24px color-mix(in srgb, var(--font-primary) 6%, transparent)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          borderRadius: "4px 0 0 4px",
          background: "var(--accent-indigo)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: { xs: 2, md: 2 },
          pl: { xs: 0.5, sm: 0.75 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: { xs: 44, sm: 52 },
              height: { xs: 44, sm: 52 },
              borderRadius: 2,
              flexShrink: 0,
              backgroundColor:
                "color-mix(in srgb, var(--accent-indigo) 16%, var(--surface) 84%)",
              color: "var(--accent-indigo)",
            }}
            aria-hidden
          >
            <IconWrapper icon="mdi:account-group-outline" size={28} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 1.5,
                mb: 0.5,
              }}
            >
              <Typography
                component="h1"
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: "var(--font-primary)",
                  fontSize: { xs: "1.375rem", sm: "1.75rem" },
                  lineHeight: 1.2,
                }}
              >
                {t("adminManageStudents.title")}
              </Typography>
              {totalCount > 0 && (
                <Chip
                  label={t("adminManageStudents.studentCount", { count: totalCount })}
                  size="small"
                  sx={{
                    backgroundColor:
                      "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)",
                    color: "var(--accent-indigo)",
                    fontWeight: 600,
                    fontSize: { xs: "0.7rem", sm: "0.8125rem" },
                    height: { xs: 26, sm: 28 },
                  }}
                />
              )}
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: "var(--font-secondary)",
                fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                lineHeight: 1.5,
                maxWidth: 640,
              }}
            >
              {t("adminManageStudents.subtitle")}
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            width: { xs: "100%", md: "auto" },
            justifyContent: { xs: "stretch", md: "flex-end" },
          }}
        >
          {onDownloadCsv && (
            <Button
              variant="outlined"
              size="medium"
              fullWidth={false}
              sx={{ minWidth: { xs: "100%", sm: 160 } }}
              startIcon={<IconWrapper icon="mdi:download" size={20} />}
              onClick={onDownloadCsv}
            >
              {t("adminManageStudents.downloadCsv")}
            </Button>
          )}
          {onBulkEnrollClick && (
            <Button
              variant="contained"
              size="medium"
              sx={{
                minWidth: { xs: "100%", sm: 168 },
                backgroundColor: "var(--accent-indigo)",
                color: "var(--font-light)",
                boxShadow: "0 2px 8px color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
                "&:hover": {
                  backgroundColor: "var(--accent-indigo-dark)",
                },
              }}
              startIcon={<IconWrapper icon="mdi:account-plus" size={20} />}
              onClick={onBulkEnrollClick}
            >
              {t("adminManageStudents.bulkEnroll")}
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
