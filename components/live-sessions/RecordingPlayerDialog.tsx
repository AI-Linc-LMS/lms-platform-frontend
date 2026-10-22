"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { RecordingControls } from "./RecordingControls";
import { IconWrapper } from "@/components/common/IconWrapper";
import apiClient from "@/lib/services/api";
import { config } from "@/lib/config";


interface RecordingPlayerDialogProps {
  liveClassId: number | null;
  /**
   * Which DATE of a recurring series to play.
   *
   * A series is ONE session row carrying N dated occurrences, each with its own recording, so
   * `liveClassId` alone cannot identify the video. Without this the player asked for the series and
   * Zoom answered with the series-latest file, so every date played the same recording — the exact
   * bug this dialog looked innocent of, because the availability check one layer up had already
   * been made occurrence-aware.
   */
  occurrenceId?: number | null;
  title?: string;
  open: boolean;
  onClose: () => void;
  /**
   * Show the browser's native Download control. Defaults to FALSE, so a surface that forgets to
   * think about it gets the restricted player rather than the permissive one.
   *
   * Worth being precise about what this does: `controlsList="nodownload"` removes the BUTTON. It
   * is not access control — the stream URL is still in the network tab for anyone who opens it.
   * What actually limits the damage is that the URL carries a short-lived signed token and is
   * proxied through the backend, so a copied link stops working shortly after; the Zoom OAuth
   * token never reaches the browser at all. This closes the easy path, not every path.
   */
  allowDownload?: boolean;
}

/**
 * In-app recording player. Fetches a short-lived signed playback token (an HTML5 <video> can't send
 * the auth header), then streams the Zoom MP4 through the backend proxy - the recording plays inside
 * the platform rather than opening Zoom's page. The Zoom OAuth token never reaches the browser.
 */
/** One re-mint per this window; a second failure inside it surfaces the error instead of looping. */
const REMINT_COOLDOWN_MS = 30_000;

export function RecordingPlayerDialog({
  liveClassId,
  occurrenceId,
  title,
  open,
  onClose,
  allowDownload = false,
}: RecordingPlayerDialogProps) {
  const { t } = useTranslation("common");
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Playback speed, ours rather than the browser's.
  //
  // `controlsList="noplaybackrate"` used to be set here, bundled in with `nodownload` - but
  // speed has nothing to do with downloading, and it removed the control for every learner who
  // is not allowed a download, which is all of them by default.
  //
  // Dropping that flag is necessary and not sufficient: the NATIVE control set differs per
  // platform. Chrome on desktop puts speed behind an overflow menu, Safari on iOS puts it
  // behind "...", and Android Chrome does not offer it at all. A two-hour recording with no way
  // to speed it up is the complaint, and it has to be answered everywhere, so the control is
  // drawn here instead of hoped for.
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [rate, setRate] = useState(1);

  // The rate is ALSO held in a ref so the callback ref below can stay identity-stable. A
  // callback ref whose identity changes is detached and reattached on every render that
  // changes it, which is churn at best and a loop at worst.
  const rateRef = useRef(1);

  const applyRate = useCallback((next: number) => {
    rateRef.current = next;
    setRate(next);
    const el = videoRef.current;
    if (el) el.playbackRate = next;
  }, []);

  // A <video> that remounts (a new signed URL, a reopened dialog) comes back at 1x, so the
  // chosen rate is re-applied when the element arrives rather than set once and forgotten.
  const bindVideo = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && el.playbackRate !== rateRef.current) el.playbackRate = rateRef.current;
  }, []);

  // Fullscreen, ours rather than the browser's - and for one blunt reason: the native button
  // promotes the <video> ELEMENT, and an element in the fullscreen layer is rendered alone.
  // Our speed pill is a sibling in the DOM, so it was simply left behind, which is the
  // reported "in full screen - speed save mode disappears".
  //
  // A <video> is a replaced element and cannot take children, so there is nowhere to portal
  // the control to either. The only fix is to fullscreen the CONTAINER, which carries the
  // controls with it - so the native button is turned off with `nofullscreen` and replaced.
  //
  // iOS Safari ignores `controlsList` and hands fullscreen to its own player. That is fine and
  // deliberately not fought: the iOS player's "..." menu already has playback speed, which is
  // what the second screenshot in the report was pointing at.
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const shell = shellRef.current;
    if (!shell) return;
    try {
      if (document.fullscreenElement) {
        void document.exitFullscreen?.();
        return;
      }
      const req = shell.requestFullscreen?.bind(shell)
        // Safari desktop. Not a polyfill, just the other spelling.
        || (shell as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen;
      req?.();
    } catch {
      // A browser that refuses fullscreen still has a working player underneath, and the
      // speed control is the thing this dialog must not lose.
    }
  }, []);

  /**
   * Mint a fresh signed stream URL for this occurrence, or null when there is nothing to play.
   *
   * The token the server mints is bound to the occurrence, and the stream proxy serves what that
   * token authorised - so the id has to be on BOTH calls or they disagree. Shared by the mount
   * effect and by the re-mint below, so the two can never drift in which URL they build.
   */
  const mintStreamUrl = useCallback(async (): Promise<string | null> => {
    if (liveClassId == null) return null;
    const occQs = occurrenceId ? `?occurrence_id=${occurrenceId}` : "";
    const res = await apiClient.get<{ token?: string }>(
      `/live-class/api/clients/${config.clientId}/live-activities/${liveClassId}/recording/playback/${occQs}`
    );
    const token = res.data?.token;
    if (!token) return null;
    return `${config.apiBaseUrl}/live-class/api/clients/${config.clientId}/live-activities/${liveClassId}/recording/stream/?t=${encodeURIComponent(token)}`;
  }, [liveClassId, occurrenceId]);

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
        const url = await mintStreamUrl();
        if (cancelled) return;
        if (!url) {
          setError(t("liveSessions.recordingNotAvailable", "Recording is not available yet."));
          return;
        }
        setStreamUrl(url);
      } catch {
        if (!cancelled) setError(t("liveSessions.recordingLoadError", "Could not load the recording."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, liveClassId, mintStreamUrl, t]);

  // ── re-mint when playback breaks mid-recording ─────────────────────────────
  //
  // The stream URL now answers with a 302 to Zoom's pre-signed CDN URL (backend #1026) instead of
  // proxying the bytes. Chromium re-targets EVERY later Range request at that destination and
  // never comes back to our origin - so if the CDN URL expires before a long recording ends (the
  // mean is 118 minutes and the lifetime is unmeasured), the next seek or resume fails and the
  // <video> fires `error` with no way back. One re-mint gets a fresh URL and resumes at the same
  // second. Capped to one attempt per REMINT_COOLDOWN_MS: a genuinely broken recording must show
  // the error, not loop.
  const lastRemintAtRef = useRef(0);
  const resumeAtRef = useRef<{ time: number; playing: boolean } | null>(null);
  const handleVideoError = useCallback(async () => {
    const el = videoRef.current;
    const now = Date.now();
    if (now - lastRemintAtRef.current < REMINT_COOLDOWN_MS) {
      setError(t("liveSessions.recordingLoadError", "Could not load the recording."));
      return;
    }
    lastRemintAtRef.current = now;
    resumeAtRef.current = { time: el?.currentTime ?? 0, playing: el ? !el.paused : true };
    try {
      const url = await mintStreamUrl();
      if (!url) throw new Error("no token");
      setStreamUrl(url);
    } catch {
      resumeAtRef.current = null;
      setError(t("liveSessions.recordingLoadError", "Could not load the recording."));
    }
  }, [mintStreamUrl, t]);

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
          <Box
            ref={shellRef}
            sx={{
              position: "relative",
              // In the fullscreen layer this Box IS the viewport, so it has to letterbox the
              // video itself - without this the element keeps its 70vh cap and sits in the
              // top-left of a black screen.
              ...(isFullscreen
                ? {
                    width: "100vw",
                    height: "100vh",
                    bgcolor: "#000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }
                : null),
            }}
          >
            <video
              ref={bindVideo}
              autoPlay
              playsInline
              src={streamUrl}
              onClick={() => {
                const el = videoRef.current;
                if (!el) return;
                if (el.paused) void el.play().catch(() => undefined);
                else el.pause();
              }}
              onError={() => void handleVideoError()}
              onLoadedMetadata={(e) => {
                const el = e.currentTarget as HTMLVideoElement;
                el.playbackRate = rateRef.current;
                // After a re-mint the new <video src> starts at 0; put the learner back where the
                // old URL failed them.
                const resume = resumeAtRef.current;
                if (resume) {
                  resumeAtRef.current = null;
                  el.currentTime = resume.time;
                  if (resume.playing) void el.play().catch(() => undefined);
                }
              }}
              // NO `controls`, and therefore no `controlsList`.
              //
              // The native bar is browser shadow DOM: a custom control cannot be put inside it.
              // Floating speed and fullscreen above it - which is what the first two attempts
              // did - left the learner with two fullscreen buttons and a speed pill nowhere
              // near the other controls. Reported, fairly.
              //
              // With the native bar gone there is no menu left to carry a Download item, so
              // what `controlsList="nodownload"` asked for is now structural. Still not access
              // control: the signed, short-lived stream URL is what limits a copied link.
              disablePictureInPicture={!allowDownload}
              onContextMenu={allowDownload ? undefined : (e) => e.preventDefault()}
              style={
                isFullscreen
                  ? { width: "100%", maxHeight: "100%", display: "block", background: "#000" }
                  : { width: "100%", maxHeight: "70vh", display: "block", background: "#000" }
              }
            />
            <RecordingControls
              videoRef={videoRef}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              rate={rate}
              onRate={applyRate}
              label={(k, d) => t(k, d)}
            />
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
