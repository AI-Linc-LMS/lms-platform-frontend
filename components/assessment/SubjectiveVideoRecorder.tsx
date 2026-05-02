"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Paper,
  Stack,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import { uploadFile } from "@/lib/services/file-upload.service";
import { IconWrapper } from "@/components/common/IconWrapper";

const MAX_SECONDS = 180;

/** Preview stays compact so portrait webcam does not create huge full-width pillarboxing. */
const PREVIEW_MAX_WIDTH_PX = 400;

type Props = {
  clientId: number;
  existingUrl?: string | null;
  onUploaded: (meta: { url: string; duration_seconds: number }) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
};

function pickMime(): { mime: string; ext: string } {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) {
    return { mime: "video/webm", ext: "webm" };
  }
  if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
    return { mime: "video/webm;codecs=vp9,opus", ext: "webm" };
  }
  if (MediaRecorder.isTypeSupported("video/webm")) {
    return { mime: "video/webm", ext: "webm" };
  }
  return { mime: "video/mp4", ext: "mp4" };
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function SubjectiveVideoRecorder({
  clientId,
  existingUrl,
  onUploaded,
  onError,
  disabled,
}: Props) {
  const { t } = useTranslation("common");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedSecondsRef = useRef(0);

  const [phase, setPhase] = useState<"idle" | "recording" | "uploading">("idle");
  const [seconds, setSeconds] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  const maxLabel = useMemo(
    () => t("assessments.take.subjectiveVideoMaxLabel", { minutes: MAX_SECONDS / 60 }),
    [t],
  );

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopTracks();
    };
  }, [stopTracks]);

  const startRecording = useCallback(async () => {
    if (disabled || phase !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      const { mime, ext } = pickMime();
      chunksRef.current = [];
      const rec = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.start(250);
      setPhase("recording");
      setSeconds(0);
      recordedSecondsRef.current = 0;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = Math.min(s + 1, MAX_SECONDS);
          recordedSecondsRef.current = next;
          if (next >= MAX_SECONDS) {
            rec.stop();
          }
          return next;
        });
      }, 1000);
      rec.onstop = async () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        stopTracks();
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        const blob = new Blob(chunksRef.current, { type: mime.split(";")[0] });
        chunksRef.current = [];
        if (blob.size < 256) {
          setPhase("idle");
          onError?.("Recording was too short.");
          return;
        }
        setPhase("uploading");
        try {
          const file = new File([blob], `answer.${ext}`, { type: blob.type });
          const result = await uploadFile(clientId, file, "other");
          const dur = Math.min(recordedSecondsRef.current || 1, MAX_SECONDS);
          onUploaded({ url: result.url, duration_seconds: dur });
        } catch (e) {
          onError?.(e instanceof Error ? e.message : "Upload failed");
        } finally {
          setPhase("idle");
          setSeconds(0);
          recordedSecondsRef.current = 0;
        }
      };
    } catch (e) {
      onError?.(
        e instanceof Error ? e.message : "Could not access camera/microphone",
      );
    }
  }, [clientId, disabled, onError, onUploaded, phase, stopTracks]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  }, []);

  const progressPct = Math.min(100, (seconds / MAX_SECONDS) * 100);
  const isRecording = phase === "recording";
  const isUploading = phase === "uploading";

  const letterboxBg = "var(--neutral-900, #171717)";

  const closePreview = useCallback(() => {
    previewVideoRef.current?.pause();
    setPreviewOpen(false);
  }, []);

  const previewContainer =
    typeof document !== "undefined"
      ? () => document.fullscreenElement ?? document.body
      : undefined;

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        maxWidth: 560,
        mx: "auto",
        borderRadius: 2,
        border: "1px solid color-mix(in srgb, var(--accent-indigo) 18%, var(--border-default))",
        overflow: "hidden",
        bgcolor: "color-mix(in srgb, var(--surface) 35%, var(--card-bg))",
        boxShadow: "0 8px 28px color-mix(in srgb, var(--primary-900) 8%, transparent)",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          flexWrap: "wrap",
          background: `linear-gradient(
            120deg,
            color-mix(in srgb, var(--accent-indigo) 14%, var(--card-bg)) 0%,
            color-mix(in srgb, var(--accent-indigo-dark) 10%, var(--card-bg)) 100%
          )`,
          borderBottom: "1px solid color-mix(in srgb, var(--accent-indigo) 12%, var(--border-default))",
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              display: "grid",
              placeItems: "center",
              bgcolor: "color-mix(in srgb, var(--accent-indigo) 16%, transparent)",
              border: "1px solid color-mix(in srgb, var(--accent-indigo) 28%, transparent)",
              flexShrink: 0,
            }}
          >
            <IconWrapper icon="mdi:video-outline" size={22} color="var(--accent-indigo-dark)" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)", lineHeight: 1.25 }}>
              {t("assessments.take.subjectiveVideoCardTitle")}
            </Typography>
            <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mt: 0.25, lineHeight: 1.4 }}>
              {t("assessments.take.subjectiveVideoIntro", { minutes: MAX_SECONDS / 60 })}
            </Typography>
          </Box>
        </Stack>
        <Chip
          size="small"
          label={maxLabel}
          sx={{
            fontWeight: 700,
            height: 28,
            borderRadius: 2,
            bgcolor: "color-mix(in srgb, var(--accent-indigo) 10%, var(--card-bg))",
            color: "var(--accent-indigo-dark)",
            border: "1px solid color-mix(in srgb, var(--accent-indigo) 22%, transparent)",
          }}
        />
      </Box>

      <Box sx={{ px: 2, pt: 1.75, pb: 1.25 }}>
        <Stack
          direction="row"
          spacing={2}
          flexWrap="wrap"
          useFlexGap
          sx={{ columnGap: 2, rowGap: 0.75, mb: 1 }}
        >
          <Stack direction="row" spacing={0.75} alignItems="center">
            <IconWrapper icon="mdi:video" size={18} color="var(--font-secondary)" />
            <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontWeight: 600 }}>
              {t("assessments.take.subjectiveVideoCameraLabel")}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <IconWrapper icon="mdi:microphone" size={18} color="var(--font-secondary)" />
            <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontWeight: 600 }}>
              {t("assessments.take.subjectiveVideoMicLabel")}
            </Typography>
          </Stack>
        </Stack>
        <Typography variant="body2" sx={{ color: "var(--font-secondary)", lineHeight: 1.55, fontSize: "0.8125rem" }}>
          {t("assessments.take.subjectiveVideoRequirements")}
        </Typography>
      </Box>

      <Box sx={{ px: 2, pb: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Box
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: PREVIEW_MAX_WIDTH_PX,
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: letterboxBg,
            border: "2px solid",
            borderColor: isRecording
              ? "color-mix(in srgb, var(--accent-indigo) 65%, var(--border-default))"
              : "color-mix(in srgb, var(--accent-indigo) 22%, var(--border-default))",
            boxShadow: isRecording
              ? "0 0 0 3px color-mix(in srgb, var(--accent-indigo) 18%, transparent), 0 12px 32px color-mix(in srgb, var(--primary-900) 18%, transparent)"
              : "0 4px 20px color-mix(in srgb, var(--primary-900) 12%, transparent)",
            transition: "border-color 0.25s ease, box-shadow 0.25s ease",
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: "100%",
              aspectRatio: "3 / 4",
              maxHeight: { xs: 400, sm: 420 },
              mx: "auto",
              bgcolor: letterboxBg,
            }}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
                backgroundColor: "transparent",
              }}
            />
            {isRecording && (
              <Box
                sx={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.65,
                  px: 1.1,
                  py: 0.45,
                  borderRadius: 999,
                  bgcolor: "color-mix(in srgb, var(--error-600) 88%, transparent)",
                  color: "var(--font-light)",
                  boxShadow: "0 2px 12px color-mix(in srgb, var(--error-500) 28%, transparent)",
                }}
              >
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    bgcolor: "var(--font-light)",
                    animation: "subjectiveRecPulse 1.2s ease-in-out infinite",
                    "@keyframes subjectiveRecPulse": {
                      "0%, 100%": { opacity: 1, transform: "scale(1)" },
                      "50%": { opacity: 0.55, transform: "scale(0.92)" },
                    },
                  }}
                />
                <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: "0.08em", fontSize: "0.68rem" }}>
                  REC
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {isRecording && (
          <Box sx={{ mt: 2, width: "100%", maxWidth: PREVIEW_MAX_WIDTH_PX }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
              <Typography variant="caption" sx={{ color: "var(--font-primary)", fontWeight: 700 }}>
                {t("assessments.take.subjectiveVideoRecording", {
                  seconds,
                  max: MAX_SECONDS,
                })}
              </Typography>
              <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                {t("assessments.take.subjectiveVideoTimeElapsed", {
                  elapsed: formatClock(seconds),
                  max: formatClock(MAX_SECONDS),
                })}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progressPct}
              sx={{
                height: 7,
                borderRadius: 999,
                bgcolor: "color-mix(in srgb, var(--accent-indigo) 10%, var(--surface))",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 999,
                  bgcolor: "var(--accent-indigo)",
                },
              }}
            />
          </Box>
        )}

        {isUploading && (
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ mt: 2, width: "100%", maxWidth: PREVIEW_MAX_WIDTH_PX }}
          >
            <CircularProgress size={22} thickness={5} sx={{ color: "var(--accent-indigo)" }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
                {t("assessments.take.subjectiveVideoUploadingProgress")}
              </Typography>
              <LinearProgress sx={{ mt: 1, height: 4, borderRadius: 2 }} />
            </Box>
          </Stack>
        )}

        {existingUrl && phase === "idle" && !isUploading && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5, alignSelf: "stretch", maxWidth: 560 }}>
            <IconWrapper icon="mdi:check-decagram" size={20} color="var(--success-500)" />
            <Typography variant="caption" sx={{ color: "var(--success-500)", fontWeight: 700 }}>
              {t("assessments.take.subjectiveVideoSaved")}
            </Typography>
          </Stack>
        )}

        <Stack
          direction="column"
          spacing={1.25}
          sx={{ mt: 2, width: "100%", maxWidth: PREVIEW_MAX_WIDTH_PX, alignSelf: "center" }}
        >
          {phase === "idle" ? (
            <Button
              variant="contained"
              disabled={disabled}
              onClick={() => void startRecording()}
              fullWidth
              startIcon={<IconWrapper icon="mdi:record-circle" size={22} color="var(--font-light)" />}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                py: 1.1,
                px: 2,
                borderRadius: 2,
                bgcolor: "var(--accent-indigo)",
                boxShadow: "0 4px 16px color-mix(in srgb, var(--accent-indigo) 38%, transparent)",
                "&:hover": {
                  bgcolor: "var(--accent-indigo-dark)",
                  boxShadow: "0 6px 20px color-mix(in srgb, var(--accent-indigo) 45%, transparent)",
                },
              }}
            >
              {t("assessments.take.subjectiveVideoStartRecording")}
            </Button>
          ) : phase === "recording" ? (
            <Button
              variant="contained"
              color="error"
              onClick={stopRecording}
              fullWidth
              startIcon={<IconWrapper icon="mdi:stop-circle" size={22} color="var(--font-light)" />}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                py: 1.1,
                px: 2,
                borderRadius: 2,
                boxShadow: "0 4px 14px color-mix(in srgb, var(--error-500) 28%, transparent)",
              }}
            >
              {t("assessments.take.subjectiveVideoStopUpload")}
            </Button>
          ) : null}
          {existingUrl ? (
            <Button
              type="button"
              variant="outlined"
              fullWidth
              onClick={() => setPreviewOpen(true)}
              startIcon={<IconWrapper icon="mdi:play-circle-outline" size={22} color="var(--accent-indigo-dark)" />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                py: 1.1,
                borderRadius: 2,
                borderColor: "color-mix(in srgb, var(--accent-indigo) 35%, var(--border-default))",
                color: "var(--accent-indigo-dark)",
                "&:hover": {
                  borderColor: "var(--accent-indigo)",
                  bgcolor: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
                },
              }}
            >
              {t("assessments.take.subjectiveVideoOpenCurrent")}
            </Button>
          ) : null}
        </Stack>
      </Box>

      <Dialog
        open={previewOpen && Boolean(existingUrl)}
        onClose={(_, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") {
            closePreview();
          }
        }}
        maxWidth="md"
        fullWidth
        container={previewContainer}
        slotProps={{
          backdrop: { sx: { zIndex: 14000 } },
        }}
        PaperProps={{ sx: { zIndex: 14001, borderRadius: 2 } }}
        sx={{ zIndex: 14000 }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            pr: 1,
          }}
        >
          <Typography component="span" variant="h6" sx={{ fontWeight: 700 }}>
            {t("assessments.take.subjectiveVideoModalTitle")}
          </Typography>
          <IconButton aria-label={t("tools.close")} onClick={closePreview} edge="end" size="small">
            <IconWrapper icon="mdi:close" size={22} color="var(--font-secondary)" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0, pb: 1 }}>
          <Box
            sx={{
              borderRadius: 1.5,
              overflow: "hidden",
              bgcolor: "var(--neutral-900, #171717)",
              maxHeight: "min(70vh, 520px)",
            }}
          >
            <video
              key={existingUrl ?? "preview"}
              ref={previewVideoRef}
              src={existingUrl ?? undefined}
              controls
              playsInline
              preload="metadata"
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                maxHeight: "min(70vh, 520px)",
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" onClick={closePreview} sx={{ textTransform: "none", fontWeight: 600 }}>
            {t("tools.close")}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
