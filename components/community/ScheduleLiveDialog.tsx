"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { communityService } from "@/lib/services/community.service";
import { config } from "@/lib/config";
import { upsertLocalLiveSession, type LocalLiveSession } from "@/lib/community/community-live";

interface ScheduleLiveDialogProps {
  open: boolean;
  onClose: () => void;
  onScheduled: () => void;
}

function toLocalInputValue(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type LiveMode = "builtin" | "external";

export function ScheduleLiveDialog({ open, onClose, onScheduled }: ScheduleLiveDialogProps) {
  const [liveMode, setLiveMode] = useState<LiveMode>("builtin");
  const [title, setTitle] = useState("");
  const [meetUrl, setMeetUrl] = useState("");
  const [startsLocal, setStartsLocal] = useState("");
  const [endsLocal, setEndsLocal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // Default to "builtin" only when both the widget API is on AND the
    // tenant explicitly opted into built-in LiveKit rooms (cost-bearing).
    // Otherwise force external — saves users from the "Could not create
    // in-app room" error path when LiveKit env vars aren't set.
    setLiveMode(
      config.communityWidgetApi && config.communityBuiltinLive
        ? "builtin"
        : "external"
    );
    setTitle("");
    setMeetUrl("");
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    setStartsLocal(toLocalInputValue(now.toISOString()));
    setEndsLocal(toLocalInputValue(end.toISOString()));
    setError(null);
    setSubmitting(false);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !startsLocal || !endsLocal) {
      setError("Fill in all required fields.");
      return;
    }
    if (liveMode === "external" && !meetUrl.trim()) {
      setError("Add a meet link, or switch to In-app live room.");
      return;
    }
    const starts_at = new Date(startsLocal).toISOString();
    const ends_at = new Date(endsLocal).toISOString();
    if (new Date(ends_at) <= new Date(starts_at)) {
      setError("End time must be after start time.");
      return;
    }

    setSubmitting(true);
    try {
      if (config.communityWidgetApi) {
        if (liveMode === "builtin") {
          const created = await communityService.createLiveSession({
            title: title.trim(),
            starts_at,
            ends_at,
            builtin_livekit_room: true,
          });
          if (!created.ok) {
            setError(
              "Could not create in-app room. Ensure LiveKit env vars are set on the server (LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET) and try again—or use an external link."
            );
            setSubmitting(false);
            return;
          }
        } else {
          const created = await communityService.createLiveSession({
            title: title.trim(),
            meet_url: meetUrl.trim(),
            starts_at,
            ends_at,
          });
          if (!created.ok) {
            setError("Could not create live session (check permissions or API).");
            setSubmitting(false);
            return;
          }
        }
      } else {
        const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `live_${Date.now()}`;
        const row: LocalLiveSession = {
          id,
          title: title.trim(),
          meet_url: meetUrl.trim(),
          starts_at,
          ends_at,
        };
        upsertLocalLiveSession(row);
      }
      onScheduled();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight={700}>
            Schedule live room
          </Typography>
          <IconButton onClick={onClose} size="small" aria-label="Close">
            <IconWrapper icon="mdi:close" size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {!config.communityWidgetApi && (
            <Typography variant="caption" color="text.secondary">
              Widget API is off — this session is saved on this browser only until you enable the backend.
            </Typography>
          )}
          {config.communityWidgetApi && config.communityBuiltinLive && (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button
                type="button"
                size="small"
                variant={liveMode === "builtin" ? "contained" : "outlined"}
                onClick={() => setLiveMode("builtin")}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                In-app room (voice & video)
              </Button>
              <Button
                type="button"
                size="small"
                variant={liveMode === "external" ? "contained" : "outlined"}
                onClick={() => setLiveMode("external")}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                External link (Meet, Zoom, Discord…)
              </Button>
            </Box>
          )}
          {config.communityWidgetApi && config.communityBuiltinLive && liveMode === "builtin" && (
            <Typography variant="body2" color="text.secondary">
              Opens a Discord-style room in this app: camera, mic, screen share, and chat (LiveKit). Participants join here — no separate meet link.
            </Typography>
          )}
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            placeholder="Late night DSA"
          />
          {(!config.communityWidgetApi || liveMode === "external") && (
            <TextField
              label="Meet or Zoom link"
              value={meetUrl}
              onChange={(e) => setMeetUrl(e.target.value)}
              required
              fullWidth
              placeholder="https://meet.google.com/..."
            />
          )}
          <TextField
            label="Starts at"
            type="datetime-local"
            value={startsLocal}
            onChange={(e) => setStartsLocal(e.target.value)}
            required
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Ends at"
            type="datetime-local"
            value={endsLocal}
            onChange={(e) => setEndsLocal(e.target.value)}
            required
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting} sx={{ textTransform: "none" }}>
            {submitting ? "Saving…" : "Publish to Live row"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
