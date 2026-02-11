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
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  adminAttendanceService,
  AttendanceActivity,
} from "@/lib/services/admin/admin-attendance.service";
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
  const [isZoom, setIsZoom] = useState(false);
  const [creating, setCreating] = useState(false);
  const [successView, setSuccessView] = useState(false);
  const [createdActivity, setCreatedActivity] =
    useState<AttendanceActivity | null>(null);

  // Generate default name when dialog opens or client info is available
  useEffect(() => {
    const clientName = (clientInfo as any)?.data?.name || clientInfo?.name;
    if (open && clientName && !successView) {
      // Extract initials (e.g., "Kakatiya University" -> "KU")
      const initials = clientName
        .split(" ")
        .map((word: string) => word.charAt(0).toUpperCase())
        .join("");

      const generatedName = `${initials}-Classroom`;
      setName(generatedName);
    }
  }, [open, clientInfo, successView]);

  // Reset success state when dialog is opened fresh
  useEffect(() => {
    if (open && !successView) {
      setCreatedActivity(null);
    }
  }, [open, successView]);

  const handleCreate = async () => {
    if (!name.trim()) {
      showToast("Please enter activity name", "error");
      return;
    }
    try {
      setCreating(true);
      const activity = await adminAttendanceService.createAttendanceActivity({
        name: name.trim(),
        duration_minutes: duration,
        is_zoom: isZoom,
      });
      showToast("Attendance activity created successfully", "success");
      if (isZoom && (activity.zoom_start_url || activity.zoom_join_url)) {
        setCreatedActivity(activity);
        setSuccessView(true);
      } else if (isZoom && activity.id) {
        const full = await adminAttendanceService.getAttendanceActivity(
          activity.id
        );
        setCreatedActivity(full);
        setSuccessView(true);
      } else {
        setName("");
        setDuration(60);
        setIsZoom(false);
        onSuccess();
      }
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

  const handleCopyJoinLink = async () => {
    const url = createdActivity?.zoom_join_url;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Join link copied to clipboard", "success");
    } catch {
      showToast("Failed to copy link", "error");
    }
  };

  const handleDone = () => {
    setSuccessView(false);
    setCreatedActivity(null);
    setName("");
    setDuration(60);
    setIsZoom(false);
    onSuccess();
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
            {successView ? "Zoom session created" : "Create Attendance Activity"}
          </Typography>
          <IconButton onClick={successView ? handleDone : onClose} size="small">
            <IconWrapper icon="mdi:close" size={20} />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
        {successView ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mt: 1,
              alignItems: "center",
              py: 2,
            }}
          >
            <Typography variant="body1" sx={{ color: "#6b7280" }}>
              Your Zoom session is ready. Start the meeting or share the join
              link with students.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center", mt: 2 }}>
              {createdActivity?.zoom_start_url && (
                <Button
                  variant="contained"
                  onClick={() =>
                    window.open(createdActivity!.zoom_start_url!, "_blank")
                  }
                  startIcon={<IconWrapper icon="mdi:video" size={20} />}
                  sx={{
                    bgcolor: "#6366f1",
                    "&:hover": { bgcolor: "#4f46e5" },
                  }}
                >
                  Start Meeting
                </Button>
              )}
              {createdActivity?.zoom_join_url && (
                <Button
                  variant="outlined"
                  onClick={handleCopyJoinLink}
                  startIcon={<IconWrapper icon="mdi:link" size={20} />}
                  sx={{ borderColor: "#6366f1", color: "#6366f1" }}
                >
                  Copy Join Link
                </Button>
              )}
            </Box>
          </Box>
        ) : (
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
            <FormControlLabel
              control={
                <Checkbox
                  checked={isZoom}
                  onChange={(e) => setIsZoom(e.target.checked)}
                  color="primary"
                />
              }
              label="Create Zoom meeting"
              sx={{
                "& .MuiFormControlLabel-label": {
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                },
              }}
            />
          </Box>
        )}
      </DialogContent>
      {!successView && (
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
            {creating ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Create"
            )}
          </Button>
        </DialogActions>
      )}
      {successView && (
        <DialogActions
          sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, gap: 1 }}
        >
          <Button
            variant="contained"
            onClick={handleDone}
            sx={{
              bgcolor: "#6366f1",
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
            }}
          >
            Done
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
