"use client";

import { Box, Typography, Paper, Avatar, Chip } from "@mui/material";
import { StudentDetail } from "@/lib/services/admin/admin-student.service";

interface StudentProfileCardProps {
  student: StudentDetail;
}

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function StudentProfileCard({ student }: StudentProfileCardProps) {
  const { personal_info } = student;

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        color: "white",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Avatar
          sx={{
            width: 100,
            height: 100,
            bgcolor: "rgba(255,255,255,0.2)",
            fontSize: "2rem",
            border: "4px solid white",
          }}
        >
          {getInitials(personal_info.first_name, personal_info.last_name)}
        </Avatar>
        <Chip
          label={personal_info.is_active ? "Active" : "Inactive"}
          sx={{
            bgcolor: personal_info.is_active
              ? "rgba(16, 185, 129, 0.3)"
              : "rgba(239, 68, 68, 0.3)",
            color: "white",
            fontWeight: 600,
            border: `2px solid ${
              personal_info.is_active ? "#10b981" : "#ef4444"
            }`,
          }}
        />
        <Typography variant="h5" sx={{ fontWeight: 600, textAlign: "center" }}>
          {personal_info.first_name} {personal_info.last_name}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Enrolled on {formatDate(personal_info.date_joined)}
        </Typography>
        <Box
          sx={{
            width: "100%",
            pt: 1,
            borderTop: "1px solid rgba(255,255,255,0.2)",
            textAlign: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "#9ca3af",
              fontSize: "0.7rem",
              display: "block",
              mb: 0.5,
            }}
          >
            Username
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
            {personal_info.username}
          </Typography>
        </Box>
        {personal_info.last_login ? (
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Last login: {formatDate(personal_info.last_login)}
          </Typography>
        ) : (
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Never logged in
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
