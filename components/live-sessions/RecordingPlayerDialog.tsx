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
  Menu,
  MenuItem,
} from "@mui/material";
import { PHONE } from "@/components/common/mobile/phone";
import { IconWrapper } from "@/components/common/IconWrapper";
import apiClient from "@/lib/services/api";
import { config } from "@/lib/config";

/** The usual ladder. 2x is the top because a lecture past that is not listenable. */
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

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
  const [rateAnchor, setRateAnchor] = useState<HTMLElement | null>(null);

  // The rate is ALSO held in a ref so the callback ref below can stay identity-stable. A
  // callback ref whose identity changes is detached and reattached on every render that
  // changes it, which is churn at best and a loop at worst.
  const rateRef = useRef(1);

  const applyRate = useCallback((next: number) => {
    rateRef.current = next;
    setRate(next);
    setRateAnchor(null);
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
        // The token the server mints is bound to the occurrence, and the stream proxy serves what
        // that token authorised — so the id has to be on BOTH calls or they disagree.
        const occQs = occurrenceId ? `?occurrence_id=${occurrenceId}` : "";
        const res = await apiClient.get<{ token?: string }>(
          `/live-class/api/clients/${config.clientId}/live-activities/${liveClassId}/recording/playback/${occQs}`
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
  }, [open, liveClassId, occurrenceId, t]);

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
              controls
              autoPlay
              src={streamUrl}
              onLoadedMetadata={(e) => {
                (e.currentTarget as HTMLVideoElement).playbackRate = rateRef.current;
              }}
              // Hides Download (and Picture-in-picture, which is just a second route to a
              // detached window) unless this viewer is allowed it. Right-click is blocked for
              // the same reason: "Save video as…" sits in that menu.
              //
              // `noplaybackrate` is deliberately NOT here. It was, and it took the speed
              // control away from every learner who cannot download - which is the default.
              // `nofullscreen` turns off the NATIVE fullscreen button, which promotes the
              // <video> element alone and leaves our controls behind. Ours is beside the speed
              // pill and fullscreens the container instead. `noplaybackrate` is deliberately
              // still absent - see the note above.
              controlsList={allowDownload ? "nofullscreen" : "nodownload nofullscreen"}
              disablePictureInPicture={!allowDownload}
              onContextMenu={allowDownload ? undefined : (e) => e.preventDefault()}
              style={
                isFullscreen
                  ? { width: "100%", maxHeight: "100%", display: "block", background: "#000" }
                  : { width: "100%", maxHeight: "70vh", display: "block", background: "#000" }
              }
            />
            <Box
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                display: "flex",
                gap: 0.75,
                alignItems: "center",
                zIndex: 2,
                [PHONE]: { top: 6, right: 6 },
              }}
            >
            <Button
              size="small"
              onClick={(e) => setRateAnchor(e.currentTarget)}
              aria-label={t("liveSessions.playbackSpeed", "Playback speed")}
              aria-haspopup="menu"
              sx={{
                minWidth: 0,
                px: 1.25,
                py: 0.5,
                borderRadius: "999px",
                fontWeight: 700,
                fontSize: "0.8rem",
                lineHeight: 1.4,
                textTransform: "none",
                color: "#fff",
                backgroundColor: "rgba(0,0,0,0.62)",
                backdropFilter: "blur(4px)",
                "&:hover": { backgroundColor: "rgba(0,0,0,0.78)" },
                // The native control bar owns the bottom edge on every platform, so this sits
                // top-right and out of its way. 44px of tap target on a phone.
                [PHONE]: { minHeight: 44, minWidth: 44 },
              }}
            >
              {rate}x
            </Button>
            <IconButton
              size="small"
              onClick={toggleFullscreen}
              aria-label={
                isFullscreen
                  ? t("liveSessions.exitFullscreen", "Exit full screen")
                  : t("liveSessions.enterFullscreen", "Full screen")
              }
              sx={{
                color: "#fff",
                backgroundColor: "rgba(0,0,0,0.62)",
                backdropFilter: "blur(4px)",
                "&:hover": { backgroundColor: "rgba(0,0,0,0.78)" },
                [PHONE]: { minHeight: 44, minWidth: 44 },
              }}
            >
              <IconWrapper
                icon={isFullscreen ? "mdi:fullscreen-exit" : "mdi:fullscreen"}
                size={20}
              />
            </IconButton>
            </Box>
            <Menu
              anchorEl={rateAnchor}
              open={Boolean(rateAnchor)}
              onClose={() => setRateAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              {SPEEDS.map((v) => (
                <MenuItem
                  key={v}
                  selected={v === rate}
                  onClick={() => applyRate(v)}
                  sx={{ fontWeight: v === rate ? 700 : 500, [PHONE]: { minHeight: 44 } }}
                >
                  {v}x
                </MenuItem>
              ))}
            </Menu>
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
