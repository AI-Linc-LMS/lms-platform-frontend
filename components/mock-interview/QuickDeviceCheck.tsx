"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { getAudioConstraints } from "@/lib/utils/audio-constraints";
import { persistSttEngine } from "@/lib/utils/stt-engine";
import { detectPlatform } from "@/lib/utils/browser-detect";

/**
 * Lean inline mic + camera + speech check for the adaptive AI-interview Begin screen - the
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

// ONE speaking window shared by BOTH engines: the recorder captures the whole window while
// native recognition (if any) listens in parallel, so the phrase the candidate says is never
// wasted. The old two-PHASE flow (native 4s, THEN a fresh Whisper recording) asked people to
// speak during the native window and recorded silence afterwards - a deterministic fail-loop
// on devices where native STT exists but is deaf (Brave/forks, Windows Online-Speech off).
const SPEECH_TEST_WINDOW_MS = 4500;
// Below this the recording is effectively empty - the OS/mic delivered no audio at all.
const MIN_TEST_BLOB_BYTES = 1600;

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
  // Cause-specific failure text - "you were quiet", "mic is silent at the OS level" and
  // "speech service unavailable" need different user actions, not one generic message.
  const [failMessage, setFailMessage] = useState<string | null>(null);
  // Server-side transcription availability (GET /api/transcribe). When the server has no
  // OPENAI_API_KEY, every Whisper-dependent device (native-deaf browsers, iOS) used to fail
  // the speech check with a generic error, over and over - warn upfront instead.
  const [serviceOk, setServiceOk] = useState<boolean | null>(null);

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

  // Probe server-side transcription once - the speech test's fallback engine depends on it.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/transcribe", { method: "GET" })
      .then((r) => r.json())
      .then((d: { configured?: boolean }) => {
        if (!cancelled) setServiceOk(d?.configured !== false);
      })
      .catch(() => {
        if (!cancelled) setServiceOk(null); // probe failed - don't scare users over a blip
      });
    return () => {
      cancelled = true;
    };
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
        /* level meter is a nicety - the speech test is the real check */
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
        // Camera refused/absent - mic alone still runs the interview (self-view is optional).
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

  /** A live audio stream for the test - re-acquires if the mount-time stream's track died
   *  (device switch, OS reclaim). A dead track records empty blobs, which used to make every
   *  retry fail identically. */
  const ensureLiveStream = useCallback(async (): Promise<MediaStream | null> => {
    const current = streamRef.current;
    if (current && current.getAudioTracks().some((t) => t.readyState === "live" && t.enabled)) {
      return current;
    }
    try {
      current?.getTracks().forEach((t) => t.stop());
      const fresh = await navigator.mediaDevices.getUserMedia({ audio: getAudioConstraints() });
      streamRef.current = fresh;
      return fresh;
    } catch {
      return null;
    }
  }, []);

  const pickTestMimeType = (): string => {
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
    if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
    if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) return "audio/ogg;codecs=opus";
    if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
    return "";
  };

  /** The speech self-test. One speaking window; both engines in parallel:
   *  - a MediaRecorder captures the ENTIRE window from t=0;
   *  - native SpeechRecognition (skipped on iOS - unreliable) listens simultaneously.
   *  Native hears you → instant pass (recording discarded), engine pinned "browser".
   *  Native is deaf/broken/absent → the recording already contains your phrase → it goes to
   *  Whisper, engine pinned "whisper". You are never asked to speak twice. */
  const runSpeechTest = useCallback(async () => {
    if (testing || transcribing) return;
    setTesting(true);
    setTestFailed(false);
    setFailMessage(null);
    setHeard("");
    gotSpeechRef.current = false;

    // This click is a real user gesture - use it to resume the level-meter AudioContext.
    // WebKit creates mount-time contexts suspended (no gesture) and ignores off-gesture
    // resume(), which left the green level bar dead on iPhone/Safari.
    try {
      if (audioCtxRef.current?.state === "suspended") {
        void audioCtxRef.current.resume().catch(() => {});
      }
    } catch {}

    const fail = (message: string) => {
      setTesting(false);
      setTranscribing(false);
      setTestFailed(true);
      setFailMessage(message);
    };

    const stream = await ensureLiveStream();
    if (!stream) {
      update({ mic: false });
      fail("Microphone unavailable - check the browser permission and your input device, then retry.");
      return;
    }
    update({ mic: true });

    // If the server can't transcribe AND this browser has no usable native recognition
    // (Firefox, iOS WebKit), no amount of speaking or retrying can pass - be honest now.
    const WinProbe = window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    const hasNative = !!(WinProbe.SpeechRecognition ?? WinProbe.webkitSpeechRecognition);
    if (serviceOk === false && (!hasNative || detectPlatform() === "ios")) {
      fail(
        "Voice transcription isn't configured on this server and this browser has no built-in " +
        "recognition - start the interview and type your answers, or contact your admin."
      );
      return;
    }

    // Recorder runs for the WHOLE window regardless of the native engine's fate.
    const mimeType = pickTestMimeType();
    const chunks: BlobPart[] = [];
    let recorder: MediaRecorder | null = null;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.start();
    } catch {
      recorder = null;
    }

    let settled = false;
    const cleanupNative = () => {
      const r = recognitionRef.current;
      recognitionRef.current = null;
      try {
        r?.stop();
      } catch {}
    };

    const passNative = (text: string) => {
      if (settled) return;
      settled = true;
      gotSpeechRef.current = true;
      if (testTimerRef.current) clearTimeout(testTimerRef.current);
      cleanupNative();
      try {
        if (recorder && recorder.state !== "inactive") {
          recorder.onstop = null;
          recorder.stop(); // discard - native already proved the pipeline
        }
      } catch {}
      persistSttEngine("browser");
      setHeard(text);
      setTesting(false);
      update({ speechOk: true, engine: "browser" });
    };

    const transcribeRecording = async () => {
      if (settled) return;
      settled = true;
      if (testTimerRef.current) clearTimeout(testTimerRef.current);
      cleanupNative();
      if (!recorder) {
        fail("Recording isn't supported in this browser - start the interview and type your answers.");
        return;
      }
      recorder.onstop = async () => {
        setTesting(false);
        setTranscribing(true);
        try {
          const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
          if (blob.size < MIN_TEST_BLOB_BYTES) {
            // The mic delivered (almost) no audio at all - not a speech problem.
            fail("Your mic looks silent - check the system input device / mute switch, then retry.");
            return;
          }
          const ext = mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp4") ? "m4a" : "webm";
          const form = new FormData();
          form.append("file", blob, `speech.${ext}`);
          form.append("language", "en");
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
          const text = typeof data?.text === "string" ? data.text.trim() : "";
          if (res.ok && text) {
            persistSttEngine("whisper");
            setHeard(text);
            setTestFailed(false);
            setFailMessage(null);
            update({ speechOk: true, engine: "whisper" });
          } else if (!res.ok && (res.status === 503 || data?.error)) {
            fail(
              data?.error ||
                "Speech service is unavailable right now - you can still start and type your answers."
            );
          } else if (!res.ok) {
            fail(`Speech service error (HTTP ${res.status}) - retry, or start and type your answers.`);
          } else {
            fail("Didn't catch any words - speak while the test is listening, then try again.");
          }
        } catch {
          fail("Couldn't reach the speech service - check your connection and retry, or type your answers.");
        } finally {
          setTranscribing(false);
        }
      };
      try {
        if (recorder.state !== "inactive") recorder.stop();
        else recorder.onstop?.(new Event("stop"));
      } catch {
        fail("Didn't catch any words - speak while the test is listening, then try again.");
      }
    };

    const Win = window as Window & {
      SpeechRecognition?: new () => RecognitionLike;
      webkitSpeechRecognition?: new () => RecognitionLike;
    };
    const SpeechRecognition = Win.SpeechRecognition ?? Win.webkitSpeechRecognition;
    // iOS WebKit's SpeechRecognition is too unreliable for continuous dictation - a passed
    // native probe here would pin an engine that then fails inside the interview. Whisper is
    // what the interview will actually use on iOS, so only the recording path runs there.
    if (SpeechRecognition && detectPlatform() !== "ios") {
      const rec = new SpeechRecognition();
      recognitionRef.current = rec;
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      rec.onresult = (event) => {
        const last = event.results[event.results.length - 1];
        const text = (last?.[0]?.transcript || "").trim();
        if (text.replace(/[\W_]/g, "").length >= 2) passNative(text);
      };
      rec.onerror = () => {
        // Native path broken (Edge network quirk, blocked service, fork without API keys) -
        // the parallel recording has been running since t=0, so the phrase isn't lost: give
        // the candidate the REST of the window to finish speaking, then transcribe it all.
        if (!settled) cleanupNative();
      };
      rec.onend = () => {
        /* the window timer decides; recording continues */
      };
      try {
        rec.start();
      } catch {
        cleanupNative();
      }
    }

    testTimerRef.current = setTimeout(() => {
      void transcribeRecording();
    }, SPEECH_TEST_WINDOW_MS);
  }, [testing, transcribing, ensureLiveStream, update, serviceOk]);

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

          {/* Live mic level - visible proof the mic is picking you up */}
          <Box sx={{ height: 6, borderRadius: 999, bgcolor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <Box
              ref={levelRef}
              sx={{ height: "100%", width: 0, borderRadius: 999, bgcolor: "#22c55e", transition: "width 80ms linear" }}
            />
          </Box>

          {serviceOk === false && !status.speechOk && (
            <Typography sx={{ fontSize: "0.7rem", color: "#fcd34d" }}>
              Server speech service is unavailable - the mic test will rely on your browser&apos;s
              own recognition.
            </Typography>
          )}
          {status.speechOk ? (
            <Typography sx={{ fontSize: "0.76rem", color: "#86efac" }}>
              Heard you loud and clear{heard ? `: “${heard}”` : ""} - you&apos;re all set.
            </Typography>
          ) : status.mic === false ? (
            <Typography sx={{ fontSize: "0.76rem", color: "#fca5a5" }}>
              Microphone unavailable. Allow mic access in your browser (padlock icon in the address bar), then reload -
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
                {testing ? "Listening - say anything…" : transcribing ? "Checking…" : testFailed ? "Try the mic test again" : "Test my mic - say anything"}
              </Button>
              {testFailed && (
                <Typography sx={{ fontSize: "0.72rem", color: "#fca5a5" }}>
                  {failMessage || "Didn't catch anything - check your input device and try again."}
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
