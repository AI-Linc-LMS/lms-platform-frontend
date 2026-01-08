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

interface CreateActivityDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateActivityDialog({
  open,
  onClose,
  onSuccess,
}: CreateActivityDialogProps) {
  const { showToast } = useToast();
  const { clientInfo } = useClientInfo();
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(60);
  const [creating, setCreating] = useState(false);

  // Generate default name when dialog opens or client info is available
  useEffect(() => {
    const clientName = (clientInfo as any)?.data?.name || clientInfo?.name;
    if (open && clientName) {
      // Extract initials (e.g., "Kakatiya University" -> "KU")
      const initials = clientName
        .split(" ")
        .map((word: string) => word.charAt(0).toUpperCase())
        .join("");

      const generatedName = `${initials}-Classroom`;
      setName(generatedName);
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
      });
      showToast("Attendance activity created successfully", "success");
      setName("");
      setDuration(30);
      onSuccess();
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail || "Failed to create activity",
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
      fullScreen={false}
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
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1rem", sm: "1.25rem" },
            }}
          >
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
          <TextField
            label="Activity Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., AB-Classroom"
            fullWidth
            required
            helperText="Enter the activity name (e.g., AB-Classroom )"
            size="small"
            sx={{
              "& .MuiInputBase-root": {
                fontSize: { xs: "0.875rem", sm: "1rem" },
              },
            }}
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
            sx={{
              "& .MuiInputBase-root": {
                fontSize: { xs: "0.875rem", sm: "1rem" },
              },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions
        sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, gap: 1 }}
      >
        <Button
          onClick={onClose}
          sx={{
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={creating || !name.trim()}
          sx={{
            bgcolor: "#6366f1",
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
        >
          {creating ? <CircularProgress size={20} color="inherit" /> : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
