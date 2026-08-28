"use client";

import { useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";

import { useProctoring } from "@/lib/hooks/useProctoring";
import { ROOM_BORDER, ROOM_GREEN, ROOM_TEXT_DIM } from "@/components/ai-tutor/room/roomTokens";
import type { MonitorSnapshot } from "./monitoring";

/**
 * The self view, and the face detector behind it, for the whole sitting.
 *
 * Mounted ONCE by the room and never unmounted between the preflight and the call. That is
 * the entire reason this is a component the room owns rather than something the preflight
 * does: the detector holds a reference to a specific `<video>` element, so a self view that
 * lives inside the preflight card stops being watched the instant the card closes. The first
 * version of this screen had exactly that shape and, worse, only ever set the monitoring row
 * when the camera FAILED, so a working camera left the row reading "pending" for the whole
 * interview while nothing at all was running.
 *
 * It does not acquire the camera. The preflight already asked for audio and video together
 * (one prompt, not two) and hands the stream down. The service reuses a live stream it finds
 * on a mounted `<video>`, so attaching the stream before starting avoids a second
 * `getUserMedia` and a second permission prompt.
 *
 * One permissive threshold set for the whole sitting. The assessment module splits strict for
 * its device check and lenient for the exam because there the check is a hard gate; nothing
 * here blocks a candidate, so a stricter pre-check would only produce false alarms on the one
 * screen where somebody is actually watching. `detectionInterval` stays at 2000ms for the
 * reason it was raised there: BlazeFace at 800ms pinned integrated GPUs, and this room already
 * runs a WebGL presence animation and a WebRTC pipeline.
 */
export default function CameraMonitor({
  stream,
  onSnapshot,
  compact,
}: {
  /** The camera stream from the preflight. Null until the candidate grants it, or forever. */
  stream: MediaStream | null;
  onSnapshot: (snapshot: MonitorSnapshot) => void;
  /** Smaller once the interview is under way, where the room needs the space. */
  compact: boolean;
}) {
  const { faceCount, error, isActive, isInitializing, startProctoring, stopProctoring, videoRef } =
    useProctoring({
      detectionInterval: 2000,
      violationCooldown: 2500,
      minConfidence: 0.4,
      smoothFrameCount: 3,
      minFaceSize: 20,
      maxFaceSize: 75,
    });

  const ranRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!stream || !video) return;
    video.srcObject = stream;
    // Autoplay refusal and unmount races are both expected here, and neither is a failure
    // worth telling the candidate about.
    void video.play().catch(() => undefined);
    // startProctoring REJECTS into the hook's `error` channel rather than throwing, so there
    // is deliberately no catch here: reading `error` is the only way to learn that a device
    // without WebGL got no analysis at all.
    void startProctoring();
    return () => stopProctoring();
  }, [startProctoring, stopProctoring, stream, videoRef]);

  let state: MonitorSnapshot["state"] = "off";
  let detail = "";
  if (error) {
    state = "unavailable";
    detail =
      "Camera monitoring could not start on this device. Your interview goes ahead as normal.";
  } else if (isInitializing) {
    state = "starting";
    detail = "Starting camera monitoring.";
  } else if (isActive) {
    state = "watching";
    detail =
      faceCount === 0
        ? "We cannot see you clearly. Move into better light and centre yourself."
        : faceCount > 1
          ? "More than one person is visible. This does not stop your interview, but it is noted."
          : "You are visible and monitoring is running.";
  }

  // Reported through a ref so a parent that re-creates its callback on every render cannot
  // turn this into a render loop: the snapshot is a fresh object each time, so depending on
  // the callback directly would mean report, re-render, new callback, report again.
  const report = useRef(onSnapshot);
  useEffect(() => {
    report.current = onSnapshot;
  }, [onSnapshot]);
  useEffect(() => {
    if (isActive) ranRef.current = true;
    report.current({ state, detail, ran: ranRef.current });
  }, [detail, state, isActive]);

  const tone = state === "watching" ? ROOM_GREEN : state === "unavailable" ? "#f59e0b" : ROOM_TEXT_DIM;

  return (
    <Box
      sx={{
        position: "fixed",
        right: { xs: 12, md: 20 },
        bottom: { xs: 12, md: 20 },
        zIndex: 5,
        width: compact ? { xs: 108, md: 132 } : { xs: 132, md: 168 },
        borderRadius: 2,
        overflow: "hidden",
        border: `1px solid ${ROOM_BORDER}`,
        bgcolor: "#000",
        boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
        // Hidden rather than unmounted when there is no camera: unmounting would take the
        // detector's video element with it.
        display: stream ? "block" : "none",
        transition: "width 260ms cubic-bezier(.175,.885,.32,1.1)",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      }}
    >
      <Box sx={{ position: "relative", aspectRatio: "4 / 3" }}>
        <video
          ref={videoRef}
          muted
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
        />
        <Box
          sx={{
            position: "absolute",
            left: 6,
            bottom: 6,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: 0.75,
            py: 0.25,
            borderRadius: 999,
            bgcolor: "rgba(0,0,0,0.55)",
          }}
        >
          <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: tone }} />
          <Typography sx={{ fontSize: "0.6rem", color: "#fff", letterSpacing: "0.04em" }}>
            {state === "watching" ? "Monitoring" : state === "unavailable" ? "Not monitored" : "Starting"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
