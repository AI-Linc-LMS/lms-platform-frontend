"use client";

import { Box, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

export function AssessmentsHeader() {
  return (
    <Box
      sx={{
        mb: 4,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 1,
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px 0 rgba(99, 102, 241, 0.39)",
          }}
        >
          <IconWrapper
            icon="mdi:clipboard-text-outline"
            size={28}
            color="#ffffff"
          />
        </Box>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: "1.75rem", sm: "2rem", md: "2.25rem" },
              fontWeight: 700,
              color: "#1f2937",
              lineHeight: 1.2,
            }}
          >
            Assessments
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#6b7280",
              fontSize: "0.9375rem",
              mt: 0.5,
            }}
          >
            Test your knowledge and track your progress
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}


