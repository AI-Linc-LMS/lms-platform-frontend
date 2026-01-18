"use client";

import { Box, Typography, Chip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface AssessmentResultHeaderProps {
  assessmentTitle: string;
  status?: string;
}

export function AssessmentResultHeader({
  assessmentTitle,
  status = "submitted",
}: AssessmentResultHeaderProps) {
  return (
    <Box
      sx={{
        mb: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconWrapper icon="mdi:file-document-check" size={28} color="#ffffff" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.5rem" },
              color: "#1f2937",
              mb: 1,
              lineHeight: 1.2,
            }}
          >
            {assessmentTitle}
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >
            <Chip
              icon={<IconWrapper icon="mdi:check-circle" size={16} />}
              label={status === "submitted" ? "Assessment Completed" : status}
              size="small"
              sx={{
                backgroundColor: "#d1fae5",
                color: "#065f46",
                fontWeight: 600,
                fontSize: "0.8125rem",
                height: 28,
                "& .MuiChip-icon": {
                  color: "#10b981",
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                fontSize: "0.8125rem",
                fontWeight: 500,
              }}
            >
              Results Summary
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}


