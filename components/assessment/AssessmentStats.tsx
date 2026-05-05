"use client";

import { Box, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

interface AssessmentStatsProps {
  totalCount: number;
  availableCount: number;
  completedCount: number;
}

export function AssessmentStats({
  totalCount,
  availableCount,
  completedCount,
}: AssessmentStatsProps) {
  const { t } = useTranslation("common");
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
        gap: 2,
        mb: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          border: "1px solid var(--border-default)",
          borderRadius: 2,
          background: "linear-gradient(135deg, var(--font-light) 0%, var(--surface) 100%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              backgroundColor: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper
              icon="mdi:clipboard-list-outline"
              size={22}
              color="var(--accent-indigo)"
            />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "var(--font-primary-dark)",
                lineHeight: 1,
              }}
            >
              {totalCount}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "var(--font-secondary)",
                fontSize: "0.8125rem",
                fontWeight: 500,
              }}
            >
              Total Assessments
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          border: "1px solid var(--border-default)",
          borderRadius: 2,
          background: "linear-gradient(135deg, var(--font-light) 0%, var(--surface) 100%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              backgroundColor: "color-mix(in srgb, var(--accent-blue-light) 12%, transparent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper
              icon="mdi:play-circle-outline"
              size={22}
              color="var(--accent-blue-light)"
            />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "var(--font-primary-dark)",
                lineHeight: 1,
              }}
            >
              {availableCount}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "var(--font-secondary)",
                fontSize: "0.8125rem",
                fontWeight: 500,
              }}
            >
              Available
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          border: "1px solid var(--border-default)",
          borderRadius: 2,
          background: "linear-gradient(135deg, var(--font-light) 0%, var(--surface) 100%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              backgroundColor: "color-mix(in srgb, var(--course-cta) 12%, transparent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper
              icon="mdi:check-circle-outline"
              size={22}
              color="var(--course-cta)"
            />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "var(--font-primary-dark)",
                lineHeight: 1,
              }}
            >
              {completedCount}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "var(--font-secondary)",
                fontSize: "0.8125rem",
                fontWeight: 500,
              }}
            >
              {t("assessments.completed")}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}


