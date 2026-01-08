"use client";

import { Paper, Typography, Box, Avatar, Chip, Divider } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { memo } from "react";

interface StudentInfoCardProps {
  student: {
    user_name: string;
    profile_pic_url: string;
    role: string;
  };
  started_at: string;
  submitted_at: string;
  total_duration_seconds: number;
  formatDate: (date: string) => string;
  formatDuration: (seconds: number) => string;
}

const StudentInfoCardComponent = ({
  student,
  started_at,
  submitted_at,
  total_duration_seconds,
  formatDate,
  formatDuration,
}: StudentInfoCardProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid #e5e7eb",
        height: "fit-content",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Avatar src={student.profile_pic_url} alt={student.user_name} sx={{ width: 56, height: 56 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem" }}>
            {student.user_name}
          </Typography>
          <Chip
            label={student.role}
            size="small"
            sx={{
              backgroundColor: "#f3f4f6",
              color: "#6b7280",
              fontSize: "0.7rem",
              height: 20,
              mt: 0.5,
            }}
          />
        </Box>
      </Box>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconWrapper icon="mdi:calendar-check" size={18} color="#6b7280" />
          <Box>
            <Typography variant="caption" sx={{ color: "#9ca3af", display: "block" }}>
              Started At
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
              {formatDate(started_at)}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconWrapper icon="mdi:calendar-check-outline" size={18} color="#6b7280" />
          <Box>
            <Typography variant="caption" sx={{ color: "#9ca3af", display: "block" }}>
              Submitted At
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
              {formatDate(submitted_at)}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconWrapper icon="mdi:timer-outline" size={18} color="#6b7280" />
          <Box>
            <Typography variant="caption" sx={{ color: "#9ca3af", display: "block" }}>
              Duration
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
              {formatDuration(total_duration_seconds)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export const StudentInfoCard = memo(StudentInfoCardComponent);
StudentInfoCard.displayName = "StudentInfoCard";

