"use client";

import { Box, Paper, Typography } from "@mui/material";
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
          border: "1px solid #e5e7eb",
          borderRadius: 2,
          background: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper
              icon="mdi:clipboard-list-outline"
              size={22}
              color="#6366f1"
            />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#1f2937",
                lineHeight: 1,
              }}
            >
              {totalCount}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
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
          border: "1px solid #e5e7eb",
          borderRadius: 2,
          background: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper
              icon="mdi:play-circle-outline"
              size={22}
              color="#3b82f6"
            />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#1f2937",
                lineHeight: 1,
              }}
            >
              {availableCount}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
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
          border: "1px solid #e5e7eb",
          borderRadius: 2,
          background: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper
              icon="mdi:check-circle-outline"
              size={22}
              color="#10b981"
            />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#1f2937",
                lineHeight: 1,
              }}
            >
              {completedCount}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#6b7280",
                fontSize: "0.8125rem",
                fontWeight: 500,
              }}
            >
              Completed
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}


