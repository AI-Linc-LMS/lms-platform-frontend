"use client";

import { Box, Typography, Paper, Chip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface AssessmentResultHeaderProps {
  assessmentTitle: string;
}

export function AssessmentResultHeader({
  assessmentTitle,
}: AssessmentResultHeaderProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        mb: 3,
        border: "1px solid #e5e7eb",
        borderRadius: 3,
        background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
        color: "#ffffff",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 2,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:trophy" size={32} color="#ffffff" />
        </Box>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.5rem", sm: "2rem" },
              mb: 0.5,
            }}
          >
            {assessmentTitle}
          </Typography>
          <Chip
            icon={<IconWrapper icon="mdi:check-circle" size={16} />}
            label="Completed"
            size="small"
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
              fontWeight: 600,
              "& .MuiChip-icon": {
                color: "#ffffff",
              },
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
}


