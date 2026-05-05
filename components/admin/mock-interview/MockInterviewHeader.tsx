"use client";

import { Box, Typography, Chip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";

interface MockInterviewHeaderProps {
  totalInterviews?: number;
  activeTab?: string;
}

export function MockInterviewHeader({
  totalInterviews,
  activeTab,
}: MockInterviewHeaderProps) {
  const { t } = useTranslation("common");
  return (
    <Box sx={{ mb: 4 }}>

      {/* Main header row */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2,
              background:
                "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-purple) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconWrapper icon="mdi:account-voice" size={26} color="var(--font-light)" />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "var(--font-primary)",
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
              }}
            >
              {t("adminMockInterview.title")}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "var(--font-secondary)",
                fontSize: "0.875rem",
                mt: 0.25,
              }}
            >
              {t("adminMockInterview.subtitle")}
            </Typography>
          </Box>
        </Box>
        {totalInterviews != null && totalInterviews > 0 && activeTab === "overview" && (
          <Chip
            icon={<IconWrapper icon="mdi:clipboard-check-outline" size={16} color="var(--accent-indigo)" />}
            label={t("adminMockInterview.interviewsCount", { count: totalInterviews })}
            size="small"
            sx={{
              backgroundColor:
                "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
              color: "var(--accent-indigo)",
              fontWeight: 600,
              "& .MuiChip-icon": { ml: 1 },
              "& .MuiChip-label": { pl: 0.5 },
            }}
          />
        )}
      </Box>
    </Box>
  );
}
