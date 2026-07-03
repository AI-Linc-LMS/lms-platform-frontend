"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { getAudioConstraints } from "@/lib/utils/audio-constraints";
import { persistSttEngine } from "@/lib/utils/stt-engine";
import { detectPlatform } from "@/lib/utils/browser-detect";

/**
 * Lean inline mic + camera + speech check for the adaptive AI-interview Begin screen — the
 * compact cousin of the platform's full device-check page. It:
 *   - requests camera+mic UP FRONT (so the permission prompt happens here, not mid-interview,
 *     which is how the recognizer used to fire `not-allowed` while the prompt was still open),
 *   - shows a live self-preview + mic level so the candidate SEES they're being picked up,
 *   - runs the same speech self-test as the platform device-check (native SpeechRecognition,
 *     Whisper /api/transcribe fallback) and PINS the working engine via persistSttEngine so
 *     the interview uses the exact path that just passed.
 * Camera is optional (the adaptive interview has no proctoring); the mic/speech check gates
 * the Begin button in the parent (with a type-instead escape hatch).
 */

export interface QuickDeviceCheckStatus {
  camera: boolean | null; // null = still checking
  mic: boolean | null;
  speechOk: boolean;
  engine: "browser" | "whisper" | null;
}

interface Props {
  onStatus: (status: QuickDeviceCheckStatus) => void;
}

interface RecognitionLike {
  start: () => void;
  stop: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

const SPEECH_TEST_WINDOW_MS = 4000;
const WHISPER_TEST_RECORD_MS = 3500;

export function QuickDeviceCheck({ onStatus }: Props) {
  const [status, setStatus] = useState<QuickDeviceCheckStatus>({
    camera: null,
    mic: null,
    speechOk: false,
    engine: null,
  });
  const [testing, setTesting] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [heard, setHeard] = useState("");
  const [testFailed, setTestFailed] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef(0);
  const levelRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const testTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gotSpeechRef = useRef(false);
  const onStatusRef = useRef(onStatus);

  useEffect(() => {
    onStatusRef.current = onStatus;
  });

  const update = useCallback((patch: Partial<QuickDeviceCheckStatus>) => {
    setStatus((prev) => {
      const next = { ...prev, ...patch };
      onStatusRef.current(next);
      return next;
    });
  }, []);

  // Acquire devices on mount: camera+mic together first, mic-only as fallback.
  useEffect(() => {
    let cancelled = false;

    const attachLevelMeter = (stream: MediaStream) => {
      try {
        const ctx = new AudioContext();
        if (ctx.state === "suspended") void ctx.resume().catch(() => {});
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        ctx.createMediaStreamSource(stream).connect(analyser);
        audioCtxRef.current = ctx;
        const data = new Uint8Array(analyser.frequencyBinCount);
        const loop = () => {
          if (!audioCtxRef.current) return;
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
          if (levelRef.current) {
            levelRef.current.style.width = `${Math.min(100, Math.round(avg * 260))}%`;
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        loop();
      } catch {
        /* level meter is a nicety — the speech test is the real check */
      }
    };

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: getAudioConstraints(),
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {});
        }
        attachLevelMeter(stream);
        update({ camera: true, mic: true });
      } catch {
        // Camera refused/absent — mic alone still runs the interview (self-view is optional).
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({
            audio: getAudioConstraints(),
          });
          if (cancelled) {
            audioOnly.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = audioOnly;
          attachLevelMeter(audioOnly);
          update({ camera: false, mic: true });
        } catch {
          if (!cancelled) update({ camera: false, mic: false });
        }
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try {
        void audioCtxRef.current?.close();
      } catch {}
      audioCtxRef.current = null;
      try {
        recognitionRef.current?.stop();
      } catch {}
      if (testTimerRef.current) clearTimeout(testTimerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [update]);

  /** Whisper path of the self-test: record a short clip and transcribe server-side. Mirrors
   *  the platform device-check fallback; passing pins engine="whisper" for the interview. */
  const runWhisperTest = useCallback(async () => {
    const stream = streamRef.current;
    if (!stream) {
      setTesting(false);
      setTestFailed(true);
      return;
    }
    setTranscribing(false);
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
    try {
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        setTesting(false);
        setTranscribing(true);
        try {
          const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
          if (blob.size < 1000) {
            setTestFailed(true);
            return;
          }
          const form = new FormData();
          form.append("file", blob, "speech.webm");
          form.append("language", "en");
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          const data = (await res.json().catch(() => ({}))) as { text?: string };
          const text = typeof data?.text === "string" ? data.text.trim() : "";
          if (res.ok && text) {
            persistSttEngine("whisper");
            setHeard(text);
            setTestFailed(false);
            update({ speechOk: true, engine: "whisper" });
          } else {
            setTestFailed(true);
          }
        } catch {
          setTestFailed(true);
        } finally {
          setTranscribing(false);
        }
      };
      recorder.start();
      setTimeout(() => {
        try {
          if (recorder.state !== "inactive") recorder.stop();
        } catch {}
      }, WHISPER_TEST_RECORD_MS);
    } catch {
      setTesting(false);
      setTestFailed(true);
    }
  }, [update]);

  /** The speech self-test: native SpeechRecognition first; anything heard passes and pins
   *  engine="browser". No result / error within the window → Whisper fallback. */
  const runSpeechTest = useCallback(() => {
    if (testing || transcribing) return;
    setTesting(true);
    setTestFailed(false);
    setHeard("");
    gotSpeechRef.current = false;

    // This click is a real user gesture — use it to resume the level-meter AudioContext.
    // WebKit creates mount-time contexts suspended (no gesture) and ignores off-gesture
    // resume(), which left the green level bar dead on iPhone/Safari.
    try {
      if (audioCtxRef.current?.state === "suspended") {
        void audioCtxRef.current.resume().catch(() => {});
      }
    } catch {}

    const Win = window as Window & {
      SpeechRecognition?: new () => RecognitionLike;
      webkitSpeechRecognition?: new () => RecognitionLike;
    };
    const SpeechRecognition = Win.SpeechRecognition ?? Win.webkitSpeechRecognition;
    // iOS WebKit's SpeechRecognition is too unreliable for continuous dictation — a passed
    // native probe here would pin an engine that then fails inside the interview. Go straight
    // to the Whisper test (the engine the interview will actually use on iOS).
    if (!SpeechRecognition || detectPlatform() === "ios") {
      void runWhisperTest();
      return;
    }

    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      const text = (last?.[0]?.transcript || "").trim();
      if (text.replace(/[\W_]/g, "").length >= 2) {
        gotSpeechRef.current = true;
        setHeard(text);
        persistSttEngine("browser");
        update({ speechOk: true, engine: "browser" });
        if (testTimerRef.current) clearTimeout(testTimerRef.current);
        setTesting(false);
        try {
          rec.stop();
        } catch {}
      }
    };
    rec.onerror = () => {
      if (gotSpeechRef.current) return;
      if (testTimerRef.current) clearTimeout(testTimerRef.current);
      // Native path broken (Edge network quirk, blocked service…) — try Whisper instead.
      void runWhisperTest();
    };
    rec.onend = () => {
      if (gotSpeechRef.current) return;
      // Ended without hearing anything and without erroring — let the window timer decide.
    };
    try {
      rec.start();
    } catch {
      void runWhisperTest();
      return;
    }
    testTimerRef.current = setTimeout(() => {
      if (gotSpeechRef.current) return;
      try {
        rec.stop();
      } catch {}
      void runWhisperTest();
    }, SPEECH_TEST_WINDOW_MS);
  }, [testing, transcribing, runWhisperTest, update]);

  const chip = (ok: boolean | null, label: string) => (
    <Stack direction="row" spacing={0.6} alignItems="center">
      {ok === null ? (
        <CircularProgress size={12} sx={{ color: "rgba(255,255,255,0.5)" }} />
      ) : (
        <Icon
          icon={ok ? "mdi:check-circle" : "mdi:close-circle"}
          width={15}
          color={ok ? "#4ade80" : "#f87171"}
        />
      )}
      <Typography sx={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.75)" }}>{label}</Typography>
    </Stack>
  );

  return (
    <Box
      sx={{
        width: "100%",
        p: 2,
        borderRadius: 3,
        bgcolor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        textAlign: "left",
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        {/* Camera preview (optional) */}
        <Box
          sx={{
            width: 120,
            aspectRatio: "4 / 3",
            borderRadius: 2,
            overflow: "hidden",
            flexShrink: 0,
            bgcolor: "#020617",
            border: "1px solid rgba(255,255,255,0.12)",
            display: "grid",
            placeItems: "center",
          }}
        >
          {status.camera === false ? (
            <Icon icon="mdi:camera-off-outline" width={24} color="rgba(255,255,255,0.35)" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
            />
          )}
        </Box>

        <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            {chip(status.mic, "Microphone")}
            {chip(status.camera, "Camera (optional)")}
            {chip(status.speechOk ? true : testing || transcribing ? null : testFailed ? false : null, "Speech check")}
          </Stack>

          {/* Live mic level — visible proof the mic is picking you up */}
          <Box sx={{ height: 6, borderRadius: 999, bgcolor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <Box
              ref={levelRef}
              sx={{ height: "100%", width: 0, borderRadius: 999, bgcolor: "#22c55e", transition: "width 80ms linear" }}
            />
          </Box>

          {status.speechOk ? (
            <Typography sx={{ fontSize: "0.76rem", color: "#86efac" }}>
              Heard you loud and clear{heard ? `: “${heard}”` : ""} — you&apos;re all set.
            </Typography>
          ) : status.mic === false ? (
            <Typography sx={{ fontSize: "0.76rem", color: "#fca5a5" }}>
              Microphone unavailable. Allow mic access in your browser (padlock icon in the address bar), then reload —
              or start the interview and type your answers.
            </Typography>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Button
                size="small"
                variant="outlined"
                disabled={testing || transcribing || status.mic !== true}
                onClick={runSpeechTest}
                startIcon={
                  testing || transcribing ? (
                    <CircularProgress size={12} sx={{ color: "inherit" }} />
                  ) : (
                    <Icon icon="mdi:microphone-message" width={15} />
                  )
                }
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.74rem",
                  color: "#c4b5fd",
                  borderColor: "rgba(196,181,253,0.5)",
                  "&:hover": { borderColor: "#c4b5fd" },
                }}
              >
                {testing ? "Listening — say anything…" : transcribing ? "Checking…" : testFailed ? "Try the mic test again" : "Test my mic — say anything"}
              </Button>
              {testFailed && (
                <Typography sx={{ fontSize: "0.72rem", color: "#fca5a5" }}>
                  Didn&apos;t catch anything — check your input device and try again.
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
