"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import {
  ROOM_BORDER,
  ROOM_GREEN,
  ROOM_PANEL,
  ROOM_RED,
  ROOM_TEXT,
  ROOM_TEXT_DIM,
  ROOM_TEXT_FAINT,
} from "@/components/ai-tutor/room/roomTokens";
import { getAudioConstraints, VIDEO_CAMERA_CONSTRAINTS } from "@/lib/utils/audio-constraints";
import type { MonitorSnapshot } from "./monitoring";

/**
 * Everything checked before the call is dialled, on one calm screen inside the room route.
 *
 * **It must stay on this route.** The camera route guard tears media streams down on pathname
 * change, so a separate device-check page would kill the streams it had just acquired. That is
 * also why `/interview/room` had to be added to the guard's allow list before any of this
 * could hold a camera.
 *
 * The gate is deliberately narrow: **hardware is required, judgement about hardware is
 * advisory.** A working microphone and a browser that can make a call are the only things
 * that stop a candidate starting. A missing camera, a face the model cannot see, or a device
 * with no WebGL are all reported honestly and none of them block, because a voice interview
 * has even less claim than a proctored exam to refuse someone on a face detector's opinion.
 */

export interface PreflightResult {
  /** The camera stream, handed to the room so proctoring continues into the call. */
  cameraStream: MediaStream | null;
  /** What was NOT working, recorded on the attempt so a reviewer knows what ran. */
  degraded: string[];
}

type Check = "pending" | "ok" | "warn" | "fail";

/** Human copy per getUserMedia failure. A DOMException name is not an explanation. */
function micErrorCopy(error: unknown): string {
  const name = (error as DOMException)?.name ?? "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Your browser blocked the microphone. Click the lock icon in the address bar, allow the microphone, then try again.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No microphone was found. Plug one in or check your input settings, then try again.";
  }
  if (name === "NotReadableError") {
    return "Another app is using your microphone. Close it and try again.";
  }
  return "We could not access your microphone. Check your settings and try again.";
}

/** Camera copy never sounds fatal: the interview is audio, the camera is supervision. */
function cameraErrorCopy(error: unknown): string {
  const name = (error as DOMException)?.name ?? "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Your browser blocked the camera. The interview is audio only, so you can carry on, or allow it from the lock icon.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "We could not find a camera. The interview is audio only, so you can carry on without one.";
  }
  if (name === "NotReadableError") {
    return "Another app is using your camera. The interview is audio only, so you can carry on without it.";
  }
  return "The camera could not be started. The interview is audio only, so you can carry on without it.";
}

function CheckRow({
  state,
  label,
  detail,
}: {
  state: Check;
  label: string;
  detail?: string;
}) {
  const tone =
    state === "ok" ? ROOM_GREEN : state === "fail" ? ROOM_RED : state === "warn" ? "#f59e0b" : ROOM_TEXT_FAINT;
  const icon =
    state === "ok"
      ? "solar:check-circle-bold"
      : state === "fail"
        ? "solar:close-circle-bold"
        : state === "warn"
          ? "solar:danger-triangle-bold"
          : "solar:clock-circle-linear";
  return (
    <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start", py: 0.85 }}>
      <Icon icon={icon} width={17} style={{ color: tone, flexShrink: 0, marginTop: 2 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: "0.9rem", color: ROOM_TEXT, fontWeight: 500 }}>
          {label}
        </Typography>
        {detail ? (
          <Typography sx={{ fontSize: "0.82rem", color: ROOM_TEXT_DIM, mt: 0.15 }}>
            {detail}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

export function Preflight({
  onReady,
  onCancel,
  onCameraStream,
  monitor,
}: {
  onReady: (result: PreflightResult) => void;
  onCancel: () => void;
  /**
   * Handed up the moment the camera is granted, not at the end.
   *
   * Monitoring has to start while this screen is still open, otherwise the row below reports
   * on something that has not run yet, and the candidate is told a check passed before it
   * happened.
   */
  onCameraStream: (stream: MediaStream) => void;
  /** What the room's monitor is doing. This screen reports it; it does not own it. */
  monitor: MonitorSnapshot;
}) {
  const [supported, setSupported] = useState<Check>("pending");
  const [mic, setMic] = useState<Check>("pending");
  const [micDetail, setMicDetail] = useState("");
  const [camera, setCamera] = useState<Check>("pending");
  const [cameraDetail, setCameraDetail] = useState("");
  const [heardTone, setHeardTone] = useState<Check>("pending");
  // No local face state. It used to be set ONLY when the camera failed, so with a working
  // camera the "Camera monitoring" row sat at pending forever, monitoring nothing while
  // implying it was. Derived from the real detector now.
  const faceState: Check =
    monitor.state === "watching"
      ? "ok"
      : monitor.state === "unavailable"
        ? "warn"
        : monitor.state === "starting"
          ? "pending"
          : camera === "ok"
            ? "pending"
            : "warn";
  const faceDetail =
    monitor.detail || (camera === "ok" ? "Starting." : "No camera, so nothing to monitor.");

  // The stream, held as state rather than only in a ref, because the self view below is
  // rendered FROM it. The shipped version assigned srcObject immediately after setCamera("ok"),
  // in the same tick, when the element did not exist yet: React had not re-rendered, the ref
  // was still null, the assignment went nowhere, and the candidate got a permanently black
  // box under the words "You should see yourself below".
  const [preview, setPreview] = useState<MediaStream | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const meterRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cleanupRef = useRef<() => void>(() => undefined);
  const soundRef = useRef(false);
  // The check runs once on mount, so the callback is read through a ref rather than being a
  // dependency that would re-run the whole device check and re-prompt for permissions.
  const streamUp = useRef(onCameraStream);
  useEffect(() => {
    streamUp.current = onCameraStream;
  }, [onCameraStream]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      // 1. Capability. Checking only getUserMedia lets a browser with no RTCPeerConnection
      //    pass every check and then die inside the call.
      if (
        typeof RTCPeerConnection === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        if (!cancelled) setSupported("fail");
        return;
      }
      setSupported("ok");

      // 2. Media, in two stages. Never one all-or-nothing call: a working microphone with a
      //    covered camera would otherwise report "no microphone" and lock the candidate out.
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: getAudioConstraints(),
          video: VIDEO_CAMERA_CONSTRAINTS,
        });
      } catch (cameraError) {
        if (!cancelled) {
          setCamera("warn");
          setCameraDetail(cameraErrorCopy(cameraError));
        }
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: getAudioConstraints(),
          });
        } catch (micError) {
          if (!cancelled) {
            setMic("fail");
            setMicDetail(micErrorCopy(micError));
          }
          return;
        }
      }
      if (cancelled || !stream) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      // Liveness per track, not merely that the promise resolved.
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack || audioTrack.readyState !== "live") {
        setMic("fail");
        setMicDetail("The microphone was found but is not producing audio.");
        return;
      }
      setMic("ok");
      setMicDetail("Say something. The bar should move.");

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && videoTrack.readyState === "live") {
        cameraStreamRef.current = stream;
        setCamera("ok");
        setCameraDetail("You should see yourself below.");
        setPreview(stream);
        // Up to the room, which owns the self view and the detector, so both survive into
        // the call rather than closing with this card.
        streamUp.current(stream);
      }

      // 3. Level meter. Written to the DOM at frame rate; state would re-render 60x a second.
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      let raf = 0;
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i += 1) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const level = Math.min(1, Math.sqrt(sum / buf.length) * 4);
        if (level > 0.06) soundRef.current = true;
        if (meterRef.current) meterRef.current.style.transform = `scaleX(${level})`;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      cleanupRef.current = () => {
        cancelAnimationFrame(raf);
        void ctx.close().catch(() => undefined);
      };
    })();

    return () => {
      cancelled = true;
      cleanupRef.current();
    };
  }, []);

  useEffect(() => {
    const video = previewRef.current;
    if (!preview || !video) return;
    video.srcObject = preview;
    // Autoplay refusal and unmount races are both expected and neither is a failure.
    void video.play().catch(() => undefined);
    return () => {
      // The tracks belong to the room, so only the attachment is undone here.
      video.srcObject = null;
    };
  }, [preview]);

  /**
   * Play a test tone.
   *
   * Neither existing device check plays a sound, so a candidate with a working microphone and
   * dead output passed everything and then could not hear the interviewer.
   *
   * The click also does two jobs beyond the tone. WebKit creates an AudioContext suspended and
   * ignores resume() off a gesture, so the level meter sits at zero on a perfectly good
   * microphone until a real click resumes it. And it is the document activation that stops the
   * room's autoplay of the interviewer's voice being blocked.
   */
  const playTone = useCallback(async () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      if (ctx.state === "suspended") await ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.75);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      /* a failed tone is not a reason to block anybody */
    }
  }, []);

  const start = useCallback(() => {
    const degraded: string[] = [];
    if (camera !== "ok") degraded.push("camera_unavailable");
    // The distinction worth recording is not what the camera saw but whether anything was
    // watching at all.
    if (!monitor.ran) degraded.push("face_monitoring_unavailable");
    if (heardTone !== "ok") degraded.push("speakers_unconfirmed");
    if (!soundRef.current) degraded.push("no_mic_input_detected");
    // The AudioContext belongs to the room now if a camera stream is going with it.
    cleanupRef.current();
    onReady({ cameraStream: cameraStreamRef.current, degraded });
  }, [camera, heardTone, monitor.ran, onReady]);

  const canProceed = supported === "ok" && mic === "ok";
  const blocked = supported === "fail" || mic === "fail";

  return (
    <Box
      sx={{
        maxWidth: 560,
        mx: "auto",
        mt: { xs: 4, md: 7 },
        borderRadius: "var(--radius-card, 12px)",
        border: `1px solid ${ROOM_BORDER}`,
        bgcolor: ROOM_PANEL,
        p: { xs: 2.5, md: 3.5 },
      }}
    >
      <Typography sx={{ fontWeight: 600, fontSize: "1.15rem", color: ROOM_TEXT, mb: 0.5 }}>
        Before we start
      </Typography>
      <Typography sx={{ fontSize: "0.9rem", color: ROOM_TEXT_DIM, mb: 2.5 }}>
        A quick check so nothing goes wrong once the interviewer is talking.
      </Typography>

      <CheckRow
        state={supported}
        label="This browser can make a live call"
        detail={
          supported === "fail"
            ? "Open the interview in the latest Chrome, Edge, Safari or Firefox and try again."
            : undefined
        }
      />
      <CheckRow state={mic} label="Microphone" detail={micDetail} />

      {mic === "ok" ? (
        <Box
          sx={{
            my: 1,
            ml: 3.5,
            height: 6,
            borderRadius: 999,
            bgcolor: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <Box
            ref={meterRef}
            sx={{
              height: "100%",
              width: "100%",
              transformOrigin: "left",
              transform: "scaleX(0)",
              bgcolor: ROOM_GREEN,
              transition: "transform 90ms linear",
            }}
          />
        </Box>
      ) : null}

      <CheckRow
        state={heardTone}
        label="Speakers"
        detail={
          heardTone === "warn"
            ? "You can still start, but you will not hear the interviewer if the output is wrong."
            : "Play a tone to check you can hear it."
        }
      />
      <Box sx={{ display: "flex", gap: 1, ml: 3.5, mb: 1, flexWrap: "wrap" }}>
        <Button
          onClick={() => void playTone()}
          size="small"
          startIcon={<Icon icon="solar:volume-loud-bold" width={15} />}
          sx={{
            textTransform: "none",
            color: ROOM_TEXT,
            border: `1px solid ${ROOM_BORDER}`,
            borderRadius: 999,
            px: 1.75,
          }}
        >
          Play test tone
        </Button>
        <Button
          onClick={() => setHeardTone("ok")}
          size="small"
          sx={{ textTransform: "none", color: ROOM_GREEN, borderRadius: 999, px: 1.5 }}
        >
          I heard it
        </Button>
        <Button
          onClick={() => setHeardTone("warn")}
          size="small"
          sx={{ textTransform: "none", color: ROOM_TEXT_DIM, borderRadius: 999, px: 1.5 }}
        >
          I heard nothing
        </Button>
      </Box>

      <CheckRow state={camera} label="Camera" detail={cameraDetail} />
      <CheckRow
        state={faceState}
        label="Camera monitoring"
        detail={faceDetail}
      />

      {preview ? (
        <Box
          sx={{
            mt: 1.5,
            borderRadius: 2,
            overflow: "hidden",
            border: `1px solid ${ROOM_BORDER}`,
            bgcolor: "#000",
            aspectRatio: "16 / 9",
          }}
        >
          <video
            ref={previewRef}
            muted
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
          />
        </Box>
      ) : null}

      <Typography sx={{ mt: 2, fontSize: "0.78rem", color: ROOM_TEXT_FAINT }}>
        Your camera is used to check you are present and alone. Nothing is recorded, and a
        missing camera never stops the interview.
      </Typography>

      <Box sx={{ mt: 2.5, display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
        <Button
          onClick={onCancel}
          sx={{
            textTransform: "none",
            color: ROOM_TEXT_DIM,
            border: `1px solid ${ROOM_BORDER}`,
            borderRadius: 999,
            px: 2.5,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={start}
          disabled={!canProceed}
          variant="contained"
          disableElevation
          startIcon={
            supported === "pending" || mic === "pending" ? (
              <CircularProgress size={14} sx={{ color: "inherit" }} />
            ) : (
              <Icon icon="solar:microphone-3-bold" width={16} />
            )
          }
          sx={{ textTransform: "none", borderRadius: 999, px: 3, fontWeight: 600 }}
        >
          {blocked ? "Cannot start" : canProceed ? "Start interview" : "Checking"}
        </Button>
      </Box>

      {canProceed && (camera !== "ok" || heardTone !== "ok") ? (
        <Typography sx={{ mt: 1.5, fontSize: "0.78rem", color: "#f59e0b", textAlign: "right" }}>
          You can start. What is not working above is recorded on the attempt.
        </Typography>
      ) : null}
    </Box>
  );
}

export default Preflight;
