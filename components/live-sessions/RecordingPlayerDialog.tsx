"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Button,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import apiClient from "@/lib/services/api";
import { config } from "@/lib/config";

interface RecordingPlayerDialogProps {
  liveClassId: number | null;
  title?: string;
  open: boolean;
  onClose: () => void;
}

/**
 * In-app recording player. Fetches a short-lived signed playback token (an HTML5 <video> can't send
 * the auth header), then streams the Zoom MP4 through the backend proxy — the recording plays inside
 * the platform rather than opening Zoom's page. The Zoom OAuth token never reaches the browser.
 */
export function RecordingPlayerDialog({ liveClassId, title, open, onClose }: RecordingPlayerDialogProps) {
  const { t } = useTranslation("common");
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || liveClassId == null) {
      setStreamUrl(null);
      setError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<{ token?: string }>(
          `/live-class/api/clients/${config.clientId}/live-activities/${liveClassId}/recording/playback/`
        );
        if (cancelled) return;
        const token = res.data?.token;
        if (!token) {
          setError(t("liveSessions.recordingNotAvailable", "Recording is not available yet."));
          return;
        }
        setStreamUrl(
          `${config.apiBaseUrl}/live-class/api/clients/${config.clientId}/live-activities/${liveClassId}/recording/stream/?t=${encodeURIComponent(token)}`
        );
      } catch {
        if (!cancelled) setError(t("liveSessions.recordingLoadError", "Could not load the recording."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, liveClassId, t]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "18px",
          border: "1px solid var(--border-default)",
          backgroundColor: "var(--card-bg)",
          backgroundImage: "none",
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--font-primary)" }}
          noWrap
        >
          {title || t("liveSessions.recording", "Recording")}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label={t("liveSessions.close", "Close")}
          sx={{ color: "var(--font-secondary)" }}
        >
          <IconWrapper icon="mdi:close" size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, bgcolor: "#000" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 240, bgcolor: "var(--card-bg)" }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: "center", bgcolor: "var(--card-bg)" }}>
            <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 2 }}>
              {error}
            </Typography>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{ borderRadius: "12px", textTransform: "none", color: "var(--font-secondary)" }}
            >
              {t("liveSessions.close", "Close")}
            </Button>
          </Box>
        ) : streamUrl ? (
          <video
            controls
            autoPlay
            src={streamUrl}
            style={{ width: "100%", maxHeight: "70vh", display: "block", background: "#000" }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
