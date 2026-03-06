"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { adminAttendanceService } from "@/lib/services/admin/admin-attendance.service";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";

interface CreateCodeAttendanceDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateCodeAttendanceDialog({
  open,
  onClose,
  onSuccess,
}: CreateCodeAttendanceDialogProps) {
  const { showToast } = useToast();
  const { clientInfo } = useClientInfo();
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(60);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const clientName = (clientInfo as any)?.data?.name || clientInfo?.name;
    if (open && clientName) {
      const initials = clientName
        .split(" ")
        .map((word: string) => word.charAt(0).toUpperCase())
        .join("");
      setName(`${initials}-Classroom`);
    }
  }, [open, clientInfo]);

  const { t } = useTranslation("common");
  const handleCreate = async () => {
    if (!name.trim()) {
      showToast(t("adminAttendance.pleaseEnterActivityName"), "error");
      return;
    }
    try {
      setCreating(true);
      await adminAttendanceService.createAttendanceActivity({
        name: name.trim(),
        duration_minutes: duration,
      });
      showToast(t("adminAttendance.activityCreatedSuccessfully"), "success");
      setName("");
      setDuration(60);
      onSuccess();
    } catch (error: any) {
      const detail =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        t("adminAttendance.failedToCreateActivity");
      showToast(
        typeof detail === "string" ? detail : JSON.stringify(detail),
        "error"
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          m: { xs: 1, sm: 2 },
          maxHeight: { xs: "calc(100% - 16px)", sm: "calc(100% - 32px)" },
        },
      }}
    >
      <DialogTitle sx={{ pb: { xs: 1, sm: 2 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t("adminAttendance.createAttendanceActivity")}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <IconWrapper icon="mdi:close" size={20} />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: { xs: 2, sm: 3 },
            mt: { xs: 0.5, sm: 1 },
          }}
        >
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            {t("adminAttendance.createCodeAttendanceDescription")}
          </Typography>
          <TextField
            label={t("adminAttendance.activityName")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("adminAttendance.activityNamePlaceholder")}
            fullWidth
            required
            size="small"
          />
          <TextField
            label={t("adminAttendance.durationMinutesLabel")}
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            fullWidth
            required
            inputProps={{ min: 1 }}
            size="small"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, gap: 1 }}>
        <Button onClick={onClose}>{t("adminAttendance.cancel")}</Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={creating || !name.trim()}
          sx={{ bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}
        >
          {creating ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            t("adminAttendance.create")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
