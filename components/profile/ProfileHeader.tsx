"use client";

import {
  Box,
  Avatar,
  Typography,
  Chip,
  IconButton,
  Button,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface ProfileHeaderProps {
  userName: string;
  profilePicUrl?: string;
  role?: string;
}

export function ProfileHeader({
  userName,
  profilePicUrl,
  role = "Student",
}: ProfileHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 3,
        pb: 3,
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar
          src={profilePicUrl}
          alt={userName}
          sx={{
            width: 64,
            height: 64,
            border: "3px solid #e5e7eb",
          }}
        >
          {userName?.[0]?.toUpperCase()}
        </Avatar>
        <Box>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#1f2937",
              }}
            >
              {userName}
            </Typography>
            <Chip
              label={role}
              size="small"
              sx={{
                backgroundColor: "#6366f1",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.75rem",
                height: 24,
              }}
            />
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: "#6b7280",
            }}
          >
            Active
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
