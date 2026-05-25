"use client";

import { Box, Typography, Paper, Avatar } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { Instructor } from "@/lib/services/courses.service";

interface InstructorCardProps {
  instructor: Instructor;
}

export function InstructorCard({ instructor }: InstructorCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid var(--border-default)",
        borderRadius: 2,
        p: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 2,
        }}
      >
        <IconWrapper
          icon="mdi:account-outline"
          size={28}
          color="var(--accent-indigo)"
        />
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: "var(--font-primary)" }}
        >
          Instructor
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 2 }}>
        <Avatar
          src={instructor.profile_pic_url}
          alt={instructor.name}
          sx={{ width: 56, height: 56 }}
        >
          {instructor.name?.charAt(0)}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 0.5,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: "var(--font-primary)" }}
            >
              {instructor.name}
            </Typography>
            <IconWrapper
              icon="mdi:check-circle-outline"
              size={24}
              color="var(--warning-500)"
            />
          </Box>
          <Typography
            variant="body2"
            sx={{ color: "var(--font-secondary)", fontSize: "0.875rem" }}
          >
            {instructor.bio || "Instructor"}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

