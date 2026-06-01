"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { communityService, RoomDetail } from "@/lib/services/community.service";

interface CreateRoomDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (room: RoomDetail) => void;
}

export function CreateRoomDialog({ open, onClose, onCreated }: CreateRoomDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [maxParticipants, setMaxParticipants] = useState<number>(20);
  const [audioOnly, setAudioOnly] = useState(false);
  const [startNow, setStartNow] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setMaxParticipants(20);
      setAudioOnly(false);
      setStartNow(true);
      setSubmitting(false);
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Give the room a title.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const room = await communityService.createRoom({
        title: title.trim(),
        description: description.trim() || undefined,
        max_participants: maxParticipants,
        is_audio_only: audioOnly,
        start_now: startNow,
      });
      onCreated?.(room);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create room.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "14px", border: "1px solid var(--border-default)" } }}
    >
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <IconWrapper icon="mdi:video-plus-outline" size={22} color="#ec4899" />
          <Typography variant="subtitle1" fontWeight={700}>
            Start a Room
          </Typography>
          <IconButton size="small" onClick={onClose} sx={{ ml: "auto" }} disabled={submitting}>
            <IconWrapper icon="mdi:close" size={18} color="var(--font-secondary)" />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          A room is a live voice/video space your community can drop into. You can
          invite anyone, mute or remove participants, and end the session any time.
        </Typography>

        <TextField
          label="Room title"
          placeholder="e.g. Friday Office Hours · React Q&A"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 200))}
          fullWidth
          size="small"
          sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          disabled={submitting}
          autoFocus
        />

        <TextField
          label="Description (optional)"
          placeholder="What will people get out of joining?"
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          size="small"
          sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          disabled={submitting}
        />

        <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
          <TextField
            label="Max participants"
            type="number"
            value={maxParticipants}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setMaxParticipants(Number.isFinite(v) ? Math.max(2, Math.min(100, v)) : 20);
            }}
            size="small"
            inputProps={{ min: 2, max: 100 }}
            disabled={submitting}
            sx={{ width: 160, "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            helperText="2–100"
          />
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={audioOnly}
                  onChange={(e) => setAudioOnly(e.target.checked)}
                  disabled={submitting}
                />
              }
              label="Audio only (no camera)"
              sx={{ "& .MuiTypography-root": { fontSize: "0.88rem" } }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={startNow}
                  onChange={(e) => setStartNow(e.target.checked)}
                  disabled={submitting}
                />
              }
              label="Start immediately"
              sx={{ "& .MuiTypography-root": { fontSize: "0.88rem" } }}
            />
          </Box>
        </Box>

        {error && (
          <Typography variant="caption" sx={{ color: "#ef4444", display: "block", mb: 1 }}>
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!title.trim() || submitting}
          startIcon={
            submitting ? (
              <CircularProgress size={14} sx={{ color: "#fff" }} />
            ) : (
              <IconWrapper icon="mdi:video" size={14} />
            )
          }
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "8px",
            backgroundColor: "#ec4899",
            boxShadow: "none",
            "&:hover": { backgroundColor: "#db2777", boxShadow: "none" },
          }}
        >
          {submitting ? "Creating…" : startNow ? "Go live now" : "Create room"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
