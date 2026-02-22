"use client";

import { Box, Typography, Chip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface MockInterviewHeaderProps {
  totalInterviews?: number;
  activeTab?: string;
}

export function MockInterviewHeader({
  totalInterviews,
  activeTab,
}: MockInterviewHeaderProps) {
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
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconWrapper icon="mdi:account-voice" size={26} color="#ffffff" />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#111827",
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
              }}
            >
              Mock Interview Admin
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#6b7280",
                fontSize: "0.875rem",
                mt: 0.25,
              }}
            >
              Monitor performance, view interviews, and track student progress
            </Typography>
          </Box>
        </Box>
        {totalInterviews != null && totalInterviews > 0 && activeTab === "overview" && (
          <Chip
            icon={<IconWrapper icon="mdi:clipboard-check-outline" size={16} color="#6366f1" />}
            label={`${totalInterviews} interviews`}
            size="small"
            sx={{
              backgroundColor: "#eef2ff",
              color: "#4f46e5",
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
