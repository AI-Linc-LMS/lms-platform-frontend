"use client";

import { Box, Typography, Paper, Chip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { AttendanceActivity } from "@/lib/services/admin/admin-attendance.service";

interface ActivityDetailsCardProps {
  activity: AttendanceActivity;
}

export function ActivityDetailsCard({ activity }: ActivityDetailsCardProps) {
  const { t } = useTranslation("common");
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        boxShadow:
          "0 1px 3px color-mix(in srgb, var(--font-primary) 12%, transparent)",
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--card-bg)",
        mb: 0,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        <Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: "var(--font-secondary)",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
            }}
          >
            {t("adminAttendance.code")}
          </Typography>
          <Chip
            label={activity.code}
            sx={{
              bgcolor:
                "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
              color: "var(--accent-indigo)",
              fontWeight: 600,
              fontFamily: "monospace",
              mt: 0.5,
              display: "block",
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              height: { xs: 24, sm: 32 },
            }}
          />
        </Box>
        <Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: "var(--font-secondary)",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
            }}
          >
            {t("adminAttendance.duration")}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 0.5, 
              fontWeight: 500,
              fontSize: { xs: "0.8125rem", sm: "0.875rem" },
            }}
          >
            {t("adminAttendance.durationMinutes", { count: activity.duration_minutes })}
          </Typography>
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: "var(--font-secondary)",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
            }}
          >
            {t("adminAttendance.status")}
          </Typography>
          <Box
            sx={{ display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap" }}
          >
            <Chip
              label={activity.is_active ? t("adminAttendance.active") : t("adminAttendance.inactive")}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                height: { xs: 20, sm: 24 },
                bgcolor: activity.is_active
                  ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
                  : "color-mix(in srgb, var(--error-500) 14%, var(--surface) 86%)",
                color: activity.is_active ? "var(--success-500)" : "var(--error-500)",
              }}
            />
            {activity.is_valid && (
              <Chip
                label={t("adminAttendance.valid")}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "0.7rem", sm: "0.75rem" },
                  height: { xs: 20, sm: 24 },
                  bgcolor:
                    "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)",
                  color: "var(--accent-indigo)",
                }}
              />
            )}
          </Box>
        </Box>
        <Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: "var(--font-secondary)",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
            }}
          >
            {t("adminAttendance.created")}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 0.5,
              fontSize: { xs: "0.8125rem", sm: "0.875rem" },
            }}
          >
            {formatDate(activity.created_at)}
          </Typography>
        </Box>
        <Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: "var(--font-secondary)",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
            }}
          >
            {t("adminAttendance.expiresAt")}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 0.5,
              fontSize: { xs: "0.8125rem", sm: "0.875rem" },
            }}
          >
            {formatDate(activity.expires_at)}
          </Typography>
        </Box>
        <Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: "var(--font-secondary)",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
            }}
          >
            {t("adminAttendance.createdBy")}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 0.5,
              fontSize: { xs: "0.8125rem", sm: "0.875rem" },
            }}
          >
            {activity.created_by_name}
          </Typography>
        </Box>
        <Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: "var(--font-secondary)",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
            }}
          >
            {t("adminAttendance.attendeesCount")}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 0.5, 
              fontWeight: 500,
              fontSize: { xs: "0.8125rem", sm: "0.875rem" },
            }}
          >
            {activity.attendees_count}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

