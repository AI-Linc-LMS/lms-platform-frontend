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

  const handleCreate = async () => {
    if (!name.trim()) {
      showToast("Please enter activity name", "error");
      return;
    }
    try {
      setCreating(true);
      await adminAttendanceService.createAttendanceActivity({
        name: name.trim(),
        duration_minutes: duration,
        is_zoom: false,
      });
      showToast("Attendance activity created successfully", "success");
      setName("");
      setDuration(60);
      onSuccess();
    } catch (error: any) {
      const detail =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Failed to create activity";
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
            Create Attendance Activity
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
            Create a code-based attendance activity. Students will mark
            attendance using the 6-digit code. For Zoom live classes, use Live
            Sessions.
          </Typography>
          <TextField
            label="Activity Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., AB-Classroom"
            fullWidth
            required
            size="small"
          />
          <TextField
            label="Duration (minutes)"
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
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={creating || !name.trim()}
          sx={{ bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}
        >
          {creating ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "Create"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
