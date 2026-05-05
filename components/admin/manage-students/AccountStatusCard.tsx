"use client";

import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Chip,
} from "@mui/material";
import { StudentDetail } from "@/lib/services/admin/admin-student.service";

interface AccountStatusCardProps {
  student: StudentDetail;
  saving: boolean;
  onToggle: () => void;
}

export function AccountStatusCard({
  student,
  saving,
  onToggle,
}: AccountStatusCardProps) {
  const { t } = useTranslation("common");
  const { personal_info } = student;

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--card-bg)",
        boxShadow:
          "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
      }}
    >
      <Typography
        variant="h6"
        sx={{ fontWeight: 600, color: "var(--font-primary)", mb: 2 }}
      >
        {t("manageStudents.accountStatus")}
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            borderRadius: 2,
            backgroundColor: personal_info.is_active
              ? "color-mix(in srgb, var(--success-500) 12%, var(--surface) 88%)"
              : "color-mix(in srgb, var(--error-500) 12%, var(--surface) 88%)",
            border: `2px solid ${
              personal_info.is_active ? "var(--success-500)" : "var(--error-500)"
            }`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Switch
              checked={personal_info.is_active ?? false}
              onChange={onToggle}
              disabled={saving}
              color="primary"
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "var(--success-500)",
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "var(--success-500)",
                },
              }}
            />
            <Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, color: "var(--font-primary)" }}
              >
                {personal_info.is_active ? t("manageStudents.active") : t("manageStudents.inactive")}
              </Typography>
              <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                {personal_info.is_active
                  ? t("manageStudents.studentCanAccess")
                  : t("manageStudents.studentAccessDisabled")}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={personal_info.is_active ? t("manageStudents.active") : t("manageStudents.inactive")}
            sx={{
              backgroundColor: personal_info.is_active
                ? "color-mix(in srgb, var(--success-500) 18%, var(--surface) 82%)"
                : "color-mix(in srgb, var(--error-500) 18%, var(--surface) 82%)",
              color: personal_info.is_active ? "var(--success-500)" : "var(--error-500)",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
}
