"use client";

import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("common");
  const { personal_info } = student;

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        background:
          "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-purple) 100%)",
        color: "var(--font-light)",
        boxShadow:
          "0 4px 6px color-mix(in srgb, var(--font-primary) 12%, transparent)",
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
            bgcolor: "color-mix(in srgb, var(--font-light) 20%, transparent)",
            fontSize: "2rem",
            border: "4px solid var(--font-light)",
          }}
        >
          {getInitials(personal_info.first_name, personal_info.last_name)}
        </Avatar>
        <Chip
          label={personal_info.is_active ? t("manageStudents.active") : t("manageStudents.inactive")}
          sx={{
            bgcolor: personal_info.is_active
              ? "color-mix(in srgb, var(--success-500) 30%, transparent)"
              : "color-mix(in srgb, var(--error-500) 30%, transparent)",
            color: "var(--font-light)",
            fontWeight: 600,
            border: `2px solid ${
              personal_info.is_active ? "var(--success-500)" : "var(--error-500)"
            }`,
          }}
        />
        <Typography variant="h5" sx={{ fontWeight: 600, textAlign: "center" }}>
          {personal_info.first_name} {personal_info.last_name}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          {t("manageStudents.enrolledOn")} {formatDate(personal_info.date_joined)}
        </Typography>
        <Box
          sx={{
            width: "100%",
            pt: 1,
            borderTop: "1px solid color-mix(in srgb, var(--font-light) 22%, transparent)",
            textAlign: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "color-mix(in srgb, var(--font-light) 70%, transparent)",
              fontSize: "0.7rem",
              display: "block",
              mb: 0.5,
            }}
          >
            {t("manageStudents.username")}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
            {personal_info.username}
          </Typography>
        </Box>
        {personal_info.last_login ? (
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            {t("manageStudents.lastLogin")}: {formatDate(personal_info.last_login)}
          </Typography>
        ) : (
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            {t("manageStudents.neverLoggedIn")}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
