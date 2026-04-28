"use client";

import { useTranslation } from "react-i18next";
import { Box, Typography, Paper, TextField, Button } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { StudentDetail } from "@/lib/services/admin/admin-student.service";

interface PersonalInformationCardProps {
  student: StudentDetail;
  editing: boolean;
  formData: {
    first_name: string;
    last_name: string;
    email: string;
  };
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onFormChange: (field: string, value: string) => void;
}

export function PersonalInformationCard({
  student,
  editing,
  formData,
  saving,
  onEdit,
  onCancel,
  onSave,
  onFormChange,
}: PersonalInformationCardProps) {
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
          {t("manageStudents.personalInformation")}
        </Typography>
        {!editing && (
          <Button
            startIcon={<IconWrapper icon="mdi:pencil" size={18} />}
            onClick={onEdit}
            size="small"
            sx={{ color: "var(--accent-indigo)" }}
          >
            {t("manageStudents.edit")}
          </Button>
        )}
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: editing ? "1fr" : "repeat(2, 1fr)",
            md: editing ? "1fr" : "repeat(4, 1fr)",
          },
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "var(--font-secondary)", fontSize: "0.75rem" }}
          >
            {t("manageStudents.firstName")}
          </Typography>
          {editing ? (
            <TextField
              value={formData.first_name}
              onChange={(e) => onFormChange("first_name", e.target.value)}
              fullWidth
              size="small"
              sx={{ mt: 0.5 }}
            />
          ) : (
            <Typography variant="body2" sx={{ color: "var(--font-primary)", mt: 0.5 }}>
              {personal_info.first_name || "-"}
            </Typography>
          )}
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "var(--font-secondary)", fontSize: "0.75rem" }}
          >
            {t("manageStudents.lastName")}
          </Typography>
          {editing ? (
            <TextField
              value={formData.last_name}
              onChange={(e) => onFormChange("last_name", e.target.value)}
              fullWidth
              size="small"
              sx={{ mt: 0.5 }}
            />
          ) : (
            <Typography variant="body2" sx={{ color: "var(--font-primary)", mt: 0.5 }}>
              {personal_info.last_name || "-"}
            </Typography>
          )}
        </Box>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "var(--font-secondary)", fontSize: "0.75rem" }}
          >
            {t("manageStudents.email")}
          </Typography>
          {editing ? (
            <TextField
              value={formData.email}
              onChange={(e) => onFormChange("email", e.target.value)}
              fullWidth
              size="small"
              type="email"
              sx={{ mt: 0.5 }}
            />
          ) : (
            <Typography variant="body2" sx={{ color: "var(--font-primary)", mt: 0.5 }}>
              {personal_info.email}
            </Typography>
          )}
        </Box>
        {editing && (
          <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1", md: "1 / -1" } }}>
            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              <Button
                variant="contained"
                onClick={onSave}
                disabled={saving}
                size="small"
                sx={{ bgcolor: "var(--accent-indigo)", color: "var(--font-light)" }}
              >
                {saving ? t("manageStudents.saving") : t("manageStudents.save")}
              </Button>
              <Button variant="outlined" onClick={onCancel} size="small">
                {t("manageStudents.cancel")}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
