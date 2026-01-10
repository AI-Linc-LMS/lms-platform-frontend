"use client";

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
  const { personal_info } = student;

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <Typography
        variant="h6"
        sx={{ fontWeight: 600, color: "#111827", mb: 2 }}
      >
        Account Status
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
            backgroundColor: personal_info.is_active ? "#f0fdf4" : "#fef2f2",
            border: `2px solid ${
              personal_info.is_active ? "#10b981" : "#ef4444"
            }`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Switch
              checked={personal_info.is_active}
              onChange={onToggle}
              disabled={saving}
              color="primary"
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#10b981",
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#10b981",
                },
              }}
            />
            <Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, color: "#111827" }}
              >
                {personal_info.is_active ? "Active" : "Inactive"}
              </Typography>
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                {personal_info.is_active
                  ? "Student can access the platform"
                  : "Student access is disabled"}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={personal_info.is_active ? "Active" : "Inactive"}
            sx={{
              backgroundColor: personal_info.is_active ? "#d1fae5" : "#fee2e2",
              color: personal_info.is_active ? "#065f46" : "#991b1b",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
}
