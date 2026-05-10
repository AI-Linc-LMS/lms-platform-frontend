"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  MenuItem,
  Select,
  Tooltip,
  Chip,
  CircularProgress,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { addToCalendarUrl } from "@/lib/community/community-live";

interface LiveRoomLobbyProps {
  title: string;
  hostName?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  /** Hide controls when the user must join externally instead. */
  joinable: boolean;
  /** Optional message shown if join is not yet allowed. */
  windowMessage?: string | null;
  busy?: boolean;
  onJoin: (prefs: { audioEnabled: boolean; videoEnabled: boolean; displayName: string; audioDeviceId?: string; videoDeviceId?: string }) => void;
  onCancel: () => void;
  defaultDisplayName?: string;
}

interface MediaDevice {
  deviceId: string;
  label: string;
}

/**
 * Discord-style pre-join screen: device preview, audio level meter, name confirm,
 * device selectors, and a clear "Join room" CTA. Live preview uses getUserMedia
 * locally — no LiveKit connection happens until the user submits.
 */
export function LiveRoomLobby({
  title,
  hostName,
  startsAt,
  endsAt,
  joinable,
  windowMessage,
  busy = false,
  onJoin,
  onCancel,
  defaultDisplayName,
}: LiveRoomLobbyProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioDeviceId, setAudioDeviceId] = useState<string>("");
  const [videoDeviceId, setVideoDeviceId] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [displayName, setDisplayName] = useState(defaultDisplayName || "");

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyzerRef.current = null;
  };

  const acquire = async () => {
    setPreviewLoading(true);
    setPermissionError(null);
    stopStream();
    try {
      const constraints: MediaStreamConstraints = {
        audio: audioEnabled
          ? audioDeviceId
            ? { deviceId: { exact: audioDeviceId } }
            : true
          : false,
        video: videoEnabled
          ? videoDeviceId
            ? { deviceId: { exact: videoDeviceId } }
            : { width: { ideal: 480 } }
          : false,
      };
      // If both disabled, skip getUserMedia entirely.
      if (!constraints.audio && !constraints.video) {
        setPreviewLoading(false);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current && videoEnabled) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      // Audio level meter
      if (audioEnabled && stream.getAudioTracks().length > 0) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (Ctx) {
          const ctx = new Ctx();
          audioCtxRef.current = ctx;
          const src = ctx.createMediaStreamSource(stream);
          const analyzer = ctx.createAnalyser();
          analyzer.fftSize = 256;
          src.connect(analyzer);
          analyzerRef.current = analyzer;
          const data = new Uint8Array(analyzer.frequencyBinCount);
          const tick = () => {
            const a = analyzerRef.current;
            if (!a) return;
            a.getByteFrequencyData(data);
            const avg = data.reduce((s, v) => s + v, 0) / data.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            rafRef.current = requestAnimationFrame(tick);
          };
          rafRef.current = requestAnimationFrame(tick);
        }
      }
    } catch (e) {
      const err = e as Error;
      setPermissionError(
        err?.name === "NotAllowedError"
          ? "Camera or microphone access was blocked. Update your browser permissions to join."
          : "Could not access your camera or microphone."
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const enumerateDevices = async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setAudioDevices(
        list
          .filter((d) => d.kind === "audioinput")
          .map((d) => ({ deviceId: d.deviceId, label: d.label || "Microphone" }))
      );
      setVideoDevices(
        list
          .filter((d) => d.kind === "videoinput")
          .map((d) => ({ deviceId: d.deviceId, label: d.label || "Camera" }))
      );
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    void acquire();
    return () => {
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioEnabled, videoEnabled, audioDeviceId, videoDeviceId]);

  useEffect(() => {
    void enumerateDevices();
    const onChange = () => void enumerateDevices();
    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", onChange);
      return () => navigator.mediaDevices.removeEventListener("devicechange", onChange);
    }
  }, []);

  const sessionWindowText = (() => {
    if (!startsAt) return null;
    try {
      const start = new Date(startsAt);
      const end = endsAt ? new Date(endsAt) : null;
      const fmt = new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      const startStr = fmt.format(start);
      const endStr = end
        ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(end)
        : "";
      return endStr ? `${startStr} – ${endStr}` : startStr;
    } catch {
      return null;
    }
  })();

  const calendarHref = startsAt && endsAt ? addToCalendarUrl(title, startsAt, endsAt) : null;

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
        background:
          "linear-gradient(180deg, var(--surface) 0%, color-mix(in srgb, var(--surface) 88%, var(--border-default) 12%) 100%)",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 920,
          width: "100%",
          border: "1px solid var(--border-default)",
          borderRadius: 3,
          backgroundColor: "var(--card-bg)",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" },
        }}
      >
        {/* LEFT — preview pane */}
        <Box
          sx={{
            position: "relative",
            backgroundColor: "var(--neutral-800)",
            minHeight: { xs: 280, md: 480 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {videoEnabled ? (
            <video
              ref={videoRef}
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scaleX(-1)",
              }}
            />
          ) : (
            <Box
              sx={{
                color: "var(--font-light)",
                textAlign: "center",
                opacity: 0.7,
              }}
            >
              <IconWrapper icon="mdi:video-off" size={48} color="var(--font-light)" />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Camera is off
              </Typography>
            </Box>
          )}

          {previewLoading && videoEnabled && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.4)",
              }}
            >
              <CircularProgress sx={{ color: "var(--font-light)" }} />
            </Box>
          )}

          {/* Audio meter */}
          <Box
            sx={{
              position: "absolute",
              bottom: 12,
              left: 12,
              right: 12,
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              py: 0.75,
              borderRadius: 2,
              backgroundColor: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(8px)",
            }}
          >
            <IconWrapper
              icon={audioEnabled ? "mdi:microphone" : "mdi:microphone-off"}
              size={16}
              color={audioEnabled ? "var(--font-light)" : "var(--accent-red)"}
            />
            <Box sx={{ flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 3, overflow: "hidden" }}>
              <Box
                sx={{
                  width: `${audioEnabled ? audioLevel : 0}%`,
                  height: "100%",
                  background: audioLevel > 75
                    ? "linear-gradient(90deg, var(--ats-success) 0%, var(--warning-500) 100%)"
                    : "linear-gradient(90deg, var(--ats-success) 0%, var(--ats-success) 100%)",
                  transition: "width 0.08s linear",
                }}
              />
            </Box>
          </Box>

          {/* Toggle buttons */}
          <Box
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              display: "flex",
              gap: 1,
            }}
          >
            <Tooltip title={audioEnabled ? "Mute mic" : "Unmute mic"}>
              <IconButton
                size="small"
                onClick={() => setAudioEnabled((v) => !v)}
                sx={{
                  backgroundColor: audioEnabled ? "rgba(255,255,255,0.16)" : "var(--accent-red)",
                  color: "var(--font-light)",
                  "&:hover": {
                    backgroundColor: audioEnabled ? "rgba(255,255,255,0.28)" : "var(--error-600)",
                  },
                }}
              >
                <IconWrapper icon={audioEnabled ? "mdi:microphone" : "mdi:microphone-off"} size={16} color="var(--font-light)" />
              </IconButton>
            </Tooltip>
            <Tooltip title={videoEnabled ? "Turn camera off" : "Turn camera on"}>
              <IconButton
                size="small"
                onClick={() => setVideoEnabled((v) => !v)}
                sx={{
                  backgroundColor: videoEnabled ? "rgba(255,255,255,0.16)" : "var(--accent-red)",
                  color: "var(--font-light)",
                  "&:hover": {
                    backgroundColor: videoEnabled ? "rgba(255,255,255,0.28)" : "var(--error-600)",
                  },
                }}
              >
                <IconWrapper icon={videoEnabled ? "mdi:video" : "mdi:video-off"} size={16} color="var(--font-light)" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* RIGHT — details + controls */}
        <Box sx={{ p: { xs: 2.5, md: 3 } }}>
          <Typography
            variant="overline"
            sx={{ color: "var(--font-tertiary)", fontWeight: 700, letterSpacing: "0.08em" }}
          >
            Live room lobby
          </Typography>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ color: "var(--font-primary-dark)", mt: 0.5, mb: 1, lineHeight: 1.25 }}
          >
            {title || "Untitled live room"}
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
            {hostName && (
              <Chip
                size="small"
                icon={<IconWrapper icon="mdi:account-tie" size={14} color="var(--font-secondary)" />}
                label={`Hosted by ${hostName}`}
                sx={{
                  backgroundColor: "var(--surface)",
                  color: "var(--font-secondary)",
                  border: "1px solid var(--border-default)",
                  fontWeight: 600,
                }}
              />
            )}
            {sessionWindowText && (
              <Chip
                size="small"
                icon={<IconWrapper icon="mdi:clock-outline" size={14} color="var(--font-secondary)" />}
                label={sessionWindowText}
                sx={{
                  backgroundColor: "var(--surface)",
                  color: "var(--font-secondary)",
                  border: "1px solid var(--border-default)",
                  fontWeight: 600,
                }}
              />
            )}
          </Box>

          {windowMessage && (
            <Box
              sx={{
                p: 1.5,
                mb: 2,
                borderRadius: 2,
                backgroundColor: "var(--warning-100)",
                border: "1px solid color-mix(in srgb, var(--warning-500) 28%, transparent)",
                display: "flex",
                gap: 1,
                alignItems: "flex-start",
              }}
            >
              <IconWrapper icon="mdi:clock-alert-outline" size={18} color="var(--warning-500)" />
              <Typography variant="caption" sx={{ color: "var(--font-muted)" }}>
                {windowMessage}
              </Typography>
            </Box>
          )}

          {permissionError && (
            <Box
              sx={{
                p: 1.5,
                mb: 2,
                borderRadius: 2,
                backgroundColor: "var(--error-100)",
                border: "1px solid color-mix(in srgb, var(--ats-error) 28%, transparent)",
                display: "flex",
                gap: 1,
                alignItems: "flex-start",
              }}
            >
              <IconWrapper icon="mdi:alert-outline" size={18} color="var(--ats-error-muted)" />
              <Typography variant="caption" sx={{ color: "var(--ats-error-muted)" }}>
                {permissionError}
              </Typography>
            </Box>
          )}

          {/* Display name */}
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: "var(--font-primary-dark)", display: "block", mb: 0.5 }}
          >
            Your display name
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              border: "1px solid var(--border-default)",
              borderRadius: 2,
              px: 1.5,
              py: 1,
              mb: 2,
              backgroundColor: "var(--card-bg)",
            }}
          >
            <IconWrapper icon="mdi:account" size={16} color="var(--font-tertiary)" />
            <Box
              component="input"
              value={displayName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDisplayName(e.target.value)
              }
              placeholder="Add a name others will see"
              sx={{
                flex: 1,
                border: "none",
                outline: "none",
                backgroundColor: "transparent",
                fontFamily: "inherit",
                fontSize: "0.9rem",
                color: "var(--font-primary-dark)",
                "&::placeholder": { color: "var(--font-tertiary)" },
              }}
            />
          </Box>

          {/* Device selectors */}
          {audioDevices.length > 1 && (
            <Box sx={{ mb: 1.5 }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: "var(--font-primary-dark)", display: "block", mb: 0.5 }}
              >
                Microphone
              </Typography>
              <Select
                size="small"
                fullWidth
                value={audioDeviceId || ""}
                onChange={(e) => setAudioDeviceId(String(e.target.value))}
                displayEmpty
              >
                <MenuItem value="">System default</MenuItem>
                {audioDevices.map((d) => (
                  <MenuItem key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )}
          {videoDevices.length > 1 && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: "var(--font-primary-dark)", display: "block", mb: 0.5 }}
              >
                Camera
              </Typography>
              <Select
                size="small"
                fullWidth
                value={videoDeviceId || ""}
                onChange={(e) => setVideoDeviceId(String(e.target.value))}
                displayEmpty
              >
                <MenuItem value="">System default</MenuItem>
                {videoDevices.map((d) => (
                  <MenuItem key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <Button
              variant="contained"
              fullWidth
              disabled={!joinable || busy}
              startIcon={
                busy ? (
                  <CircularProgress size={16} sx={{ color: "var(--font-light)" }} />
                ) : (
                  <IconWrapper icon="mdi:video" size={18} color="var(--font-light)" />
                )
              }
              onClick={() => {
                stopStream();
                onJoin({
                  audioEnabled,
                  videoEnabled,
                  displayName: displayName.trim(),
                  audioDeviceId: audioDeviceId || undefined,
                  videoDeviceId: videoDeviceId || undefined,
                });
              }}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                backgroundColor: "var(--accent-indigo)",
                color: "var(--font-light)",
                py: 1.25,
                "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
                "&.Mui-disabled": {
                  backgroundColor:
                    "color-mix(in srgb, var(--accent-indigo) 35%, var(--surface) 65%)",
                  color: "var(--font-secondary)",
                },
              }}
            >
              {busy ? "Joining…" : "Join room"}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                stopStream();
                onCancel();
              }}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: "var(--font-secondary)",
                borderColor: "var(--border-default)",
                "&:hover": {
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border-light)",
                },
              }}
            >
              Cancel
            </Button>
          </Box>
          {calendarHref && (
            <Box sx={{ mt: 1.5 }}>
              <Button
                size="small"
                href={calendarHref}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<IconWrapper icon="mdi:calendar-export" size={16} />}
                sx={{ textTransform: "none", color: "var(--font-secondary)" }}
              >
                Add to calendar
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
