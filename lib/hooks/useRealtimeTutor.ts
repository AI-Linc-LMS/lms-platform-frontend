"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  aiTutorService,
  type CanvasArtifactPayload,
  type PooledQuestion,
  type StartSessionInput,
  type TranscriptTurn,
} from "@/lib/services/ai-tutor.service";
import { getAudioConstraints } from "@/lib/utils/audio-constraints";
import { registerMediaStream } from "@/lib/utils/media-stream-registry";

/**
 * The realtime transport for the AI Tutor.
 *
 * The browser connects DIRECTLY to OpenAI over WebRTC. Django mints a short-lived
 * credential and then stays out of the way, which is what makes this feel instant instead
 * of like the platform's previous voice surface, where every turn was a serial chain of
 * blocking HTTP calls and the product had to fake a "perceived-latency trick" to hide it.
 *
 * Three things in here are subtle and load-bearing:
 *
 * 1. **One audio element, blessed by a user gesture.** iOS Safari refuses to play audio
 *    that was not started from a real interaction, and it does so silently. The element is
 *    created and `play()`d inside the same click handler that acquires the microphone.
 * 2. **The call id comes from the `Location` response header.** That string is what lets
 *    the server hang the session up out of band. If the header is not exposed to JS we
 *    fall back to the session id on `session.created`, which is still enough to correlate.
 * 3. **The blob is driven outside React.** Two `AnalyserNode`s write straight to a ref at
 *    rAF. Putting an audio level in React state would re-render sixty times a second while
 *    a WebRTC encode is running.
 */

const OAI_EVENTS_CHANNEL = "oai-events";

export type TutorPhase =
  | "idle"
  | "starting"
  | "connecting"
  | "listening"
  | "student-speaking"
  | "thinking"
  | "speaking"
  | "ending"
  | "ended"
  | "failed";

export interface CanvasCard {
  id: string;
  kind: "slide" | "code" | "diagram" | "image" | "video" | "gif";
  payload: Record<string, unknown>;
  createdAt: number;
}

export interface TutorToolCall {
  name: string;
  callId: string;
  args: Record<string, unknown>;
}

interface UseRealtimeTutorOptions {
  onQuiz?: (question: PooledQuestion) => void;
  onOpenIde?: (args: { language: string; task: string; starter_code?: string }) => void;
  onRunCode?: (stdin: string) => void;
  readStudentCode?: () => { language: string; code: string } | null;
  onError?: (message: string) => void;
}

export function useRealtimeTutor(options: UseRealtimeTutorOptions = {}) {
  const [phase, setPhase] = useState<TutorPhase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [cards, setCards] = useState<CanvasCard[]>([]);
  const [planIndex, setPlanIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Everything below is deliberately a ref: it changes at audio rate or is needed inside
  // callbacks that must not be re-created on every render.
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const levelsRef = useRef({ mic: 0, tutor: 0 });
  const rafRef = useRef<number | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  const questionPoolRef = useRef<PooledQuestion[]>([]);
  const usedQuestionsRef = useRef<Set<number>>(new Set());
  const seqRef = useRef(0);
  const startedAtRef = useRef(0);
  const pendingTurnsRef = useRef<TranscriptTurn[]>([]);
  const pendingArtifactsRef = useRef<CanvasArtifactPayload[]>([]);
  const pendingUsageRef = useRef<unknown[]>([]);
  const tutorTranscriptRef = useRef("");
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closedRef = useRef(false);

  /** Audio levels for the blob. Read via rAF by the visual, never through React state. */
  const getLevels = useCallback(() => levelsRef.current, []);

  // --- outbound helpers ------------------------------------------------------

  const send = useCallback((payload: unknown) => {
    const dc = dcRef.current;
    if (dc && dc.readyState === "open") {
      dc.send(JSON.stringify(payload));
    }
  }, []);

  const respondToTool = useCallback(
    (callId: string, output: unknown) => {
      send({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify(output),
        },
      });
      send({ type: "response.create" });
    },
    [send]
  );

  /** Inject a fact into the conversation and ask the tutor to react to it out loud. */
  const tellTutor = useCallback(
    (text: string) => {
      send({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text }],
        },
      });
      send({ type: "response.create" });
    },
    [send]
  );

  // --- canvas ----------------------------------------------------------------

  const pushCard = useCallback((kind: CanvasCard["kind"], payload: Record<string, unknown>) => {
    const card: CanvasCard = {
      id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      kind,
      payload,
      createdAt: Date.now(),
    };
    setCards((prev) => [...prev.slice(-11), card]);
    pendingArtifactsRef.current.push({
      kind,
      payload,
      sequence: pendingArtifactsRef.current.length,
    });
  }, []);

  // --- tool dispatch ---------------------------------------------------------

  const handleToolCall = useCallback(
    async (call: TutorToolCall) => {
      const { name, callId, args } = call;
      const sid = sessionIdRef.current;

      switch (name) {
        // Client-resolved: instant, so the tutor can keep talking straight through.
        case "show_slide":
          pushCard("slide", args);
          return respondToTool(callId, { ok: true });
        case "show_code":
          pushCard("code", args);
          return respondToTool(callId, { ok: true });
        case "show_diagram":
          pushCard("diagram", args);
          return respondToTool(callId, { ok: true });
        case "highlight":
          return respondToTool(callId, { ok: true });
        case "clear_canvas":
          setCards([]);
          return respondToTool(callId, { ok: true });
        case "update_lesson_plan": {
          const next = Number(args.current_index ?? 0);
          setPlanIndex(next);
          return respondToTool(callId, { ok: true });
        }
        case "open_ide":
          optionsRef.current.onOpenIde?.({
            language: String(args.language ?? "python"),
            task: String(args.task ?? ""),
            starter_code: args.starter_code ? String(args.starter_code) : undefined,
          });
          return respondToTool(callId, { ok: true });
        case "read_student_code": {
          const buffer = optionsRef.current.readStudentCode?.();
          return respondToTool(
            callId,
            buffer ? { ok: true, ...buffer } : { ok: false, reason: "editor_closed" }
          );
        }
        case "request_code_run":
          // Returns immediately; the output is injected as a message when it lands, so a
          // three-second Judge0 round trip never becomes three seconds of dead air.
          optionsRef.current.onRunCode?.(String(args.stdin ?? ""));
          return respondToTool(callId, { ok: true, status: "running" });
        case "show_quiz": {
          const next = questionPoolRef.current.find(
            (q) => !usedQuestionsRef.current.has(q.id)
          );
          if (!next) {
            return respondToTool(callId, { ok: false, reason: "no_question" });
          }
          usedQuestionsRef.current.add(next.id);
          optionsRef.current.onQuiz?.(next);
          return respondToTool(callId, { ok: true, asked: next.question });
        }

        // Backend round trips. Budgeted, and each returns a result the model can act on
        // rather than an error it has to apologise for.
        case "show_image": {
          if (!sid) return respondToTool(callId, { ok: false, reason: "no_session" });
          try {
            const found = await aiTutorService.findImage(
              sid,
              String(args.query ?? ""),
              String(args.caption ?? "")
            );
            if (found?.ok) {
              pushCard("image", found);
              return respondToTool(callId, { ok: true });
            }
          } catch {
            /* fall through to the honest negative */
          }
          return respondToTool(callId, { ok: false, reason: "no_image" });
        }
        case "save_note": {
          if (!sid) return respondToTool(callId, { ok: false, reason: "no_session" });
          try {
            await aiTutorService.saveNote(sid, {
              concept: String(args.concept ?? ""),
              summary: String(args.summary ?? ""),
              flashcard_prompt: args.flashcard_prompt
                ? String(args.flashcard_prompt)
                : undefined,
              flashcard_answer: args.flashcard_answer
                ? String(args.flashcard_answer)
                : undefined,
            });
          } catch {
            /* a lost note is not worth interrupting a lesson */
          }
          return respondToTool(callId, { ok: true });
        }
        default:
          return respondToTool(callId, { ok: false, reason: "unknown_tool" });
      }
    },
    [pushCard, respondToTool]
  );

  /** Answer a quiz. Grading is server-side; the browser never had the key. */
  const submitQuizAnswer = useCallback(
    async (questionId: number, selected: string[]) => {
      const sid = sessionIdRef.current;
      if (!sid) return null;
      try {
        const result = await aiTutorService.gradeQuiz(sid, questionId, selected);
        tellTutor(
          result.is_correct
            ? "I answered that quiz question correctly."
            : `I got that quiz question wrong. I picked ${selected.join(", ")}, the answer was ${(result.correct ?? []).join(", ")}.`
        );
        return result;
      } catch {
        return null;
      }
    },
    [tellTutor]
  );

  /** Report a code run back into the conversation. */
  const reportRunResult = useCallback(
    (summary: string) => tellTutor(`I ran my code. Output:\n${summary}`),
    [tellTutor]
  );

  /** Push the editor buffer so the tutor can comment on the approach. */
  const shareCode = useCallback(
    (language: string, code: string) =>
      tellTutor(
        `Here's what I have in the editor right now (${language}):\n\n${code}\n\nComment on my approach if something stands out. If it looks fine, say nothing much.`
      ),
    [tellTutor]
  );

  // --- inbound events --------------------------------------------------------

  const handleServerEvent = useCallback(
    (event: Record<string, unknown>) => {
      const type = String(event.type ?? "");

      switch (type) {
        case "session.created":
          setPhase("listening");
          break;

        case "input_audio_buffer.speech_started":
          setPhase("student-speaking");
          // Drop audio already buffered in the browser so barge-in is immediate rather
          // than "it keeps talking for another second".
          send({ type: "output_audio_buffer.clear" });
          break;

        case "input_audio_buffer.speech_stopped":
          setPhase("thinking");
          break;

        case "response.output_audio_transcript.delta": {
          const delta = String(event.delta ?? "");
          tutorTranscriptRef.current += delta;
          setCaption(tutorTranscriptRef.current.slice(-320));
          setPhase("speaking");
          break;
        }

        case "conversation.item.input_audio_transcription.completed": {
          const text = String(event.transcript ?? "").trim();
          if (text) {
            pendingTurnsRef.current.push({
              role: "student",
              text,
              sequence: seqRef.current++,
              offset_ms: Date.now() - startedAtRef.current,
            });
          }
          break;
        }

        case "response.done": {
          const response = (event.response ?? {}) as Record<string, unknown>;

          if (response.usage) {
            pendingUsageRef.current.push({ usage: response.usage });
          }

          const output = (response.output ?? []) as Record<string, unknown>[];
          for (const item of output) {
            if (item.type === "function_call") {
              let args: Record<string, unknown> = {};
              try {
                args = JSON.parse(String(item.arguments ?? "{}"));
              } catch {
                args = {};
              }
              void handleToolCall({
                name: String(item.name ?? ""),
                callId: String(item.call_id ?? ""),
                args,
              });
            }
          }

          const spoken = tutorTranscriptRef.current.trim();
          if (spoken) {
            pendingTurnsRef.current.push({
              role: "tutor",
              text: spoken,
              sequence: seqRef.current++,
              offset_ms: Date.now() - startedAtRef.current,
            });
            tutorTranscriptRef.current = "";
          }
          setPhase("listening");
          break;
        }

        case "response.cancelled":
          tutorTranscriptRef.current = "";
          setPhase("listening");
          break;

        case "error": {
          const message =
            ((event.error as Record<string, unknown>)?.message as string) ??
            "The tutor hit a problem.";
          optionsRef.current.onError?.(message);
          break;
        }
        default:
          break;
      }
    },
    [handleToolCall, send]
  );

  // --- flushing --------------------------------------------------------------

  const flush = useCallback(async (immediate = false) => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    const turns = pendingTurnsRef.current.splice(0);
    const artifacts = pendingArtifactsRef.current.splice(0);
    const usage = pendingUsageRef.current.splice(0);
    if (!immediate && !turns.length && !artifacts.length && !usage.length) return;
    try {
      await aiTutorService.pushEvents(sid, { turns, artifacts, usage });
    } catch {
      // Put them back so a transient failure does not lose the transcript.
      pendingTurnsRef.current.unshift(...turns);
      pendingArtifactsRef.current.unshift(...artifacts);
      pendingUsageRef.current.unshift(...usage);
    }
  }, []);

  // --- lifecycle -------------------------------------------------------------

  const teardown = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (flushTimerRef.current) clearInterval(flushTimerRef.current);
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    flushTimerRef.current = null;
    heartbeatTimerRef.current = null;

    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    dcRef.current?.close();
    dcRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    void audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
      audioElRef.current.remove();
      audioElRef.current = null;
    }
  }, []);

  const end = useCallback(
    async (reason = "learner") => {
      if (closedRef.current) return;
      closedRef.current = true;
      setPhase("ending");
      const sid = sessionIdRef.current;
      teardown();
      await flush(true);
      if (sid) {
        try {
          await aiTutorService.endSession(sid, reason);
        } catch {
          /* the server-side sweep settles it regardless */
        }
      }
      setPhase("ended");
    },
    [flush, teardown]
  );

  /**
   * Must be called from a real user gesture. iOS requires one to start audio playback,
   * and browsers require one for `getUserMedia`; doing both in the same handler is what
   * avoids the "permission granted but silent" failure.
   */
  const start = useCallback(
    async (input: StartSessionInput) => {
      setError(null);
      setPhase("starting");
      closedRef.current = false;

      try {
        const started = await aiTutorService.startSession(input);
        sessionIdRef.current = started.session.id;
        setSessionId(started.session.id);
        questionPoolRef.current = started.question_pool ?? [];
        startedAtRef.current = Date.now();
        setRemainingSeconds(started.max_seconds);

        setPhase("connecting");

        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        // One long-lived element, appended and played inside this gesture.
        const audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        audioEl.setAttribute("data-ai-tutor", "remote");
        document.body.appendChild(audioEl);
        audioElRef.current = audioEl;

        const audioCtx = new AudioContext();
        audioCtxRef.current = audioCtx;
        const tutorAnalyser = audioCtx.createAnalyser();
        tutorAnalyser.fftSize = 256;
        const micAnalyser = audioCtx.createAnalyser();
        micAnalyser.fftSize = 256;

        pc.ontrack = (e) => {
          audioEl.srcObject = e.streams[0];
          void audioEl.play().catch(() => undefined);
          try {
            audioCtx.createMediaStreamSource(e.streams[0]).connect(tutorAnalyser);
          } catch {
            /* analyser is decorative; never block audio on it */
          }
        };

        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: getAudioConstraints(),
        });
        micStreamRef.current = micStream;
        registerMediaStream(micStream);
        micStream.getTracks().forEach((track) => pc.addTrack(track, micStream));
        try {
          audioCtx.createMediaStreamSource(micStream).connect(micAnalyser);
        } catch {
          /* as above */
        }

        const dc = pc.createDataChannel(OAI_EVENTS_CHANNEL);
        dcRef.current = dc;
        dc.onmessage = (e) => {
          try {
            handleServerEvent(JSON.parse(e.data));
          } catch {
            /* a malformed frame is not worth ending a lesson over */
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const sdpResponse = await fetch(started.realtime.calls_url, {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${started.client_secret}`,
            "Content-Type": "application/sdp",
          },
        });
        if (!sdpResponse.ok) {
          throw new Error("Could not connect to the tutor.");
        }
        await pc.setRemoteDescription({
          type: "answer",
          sdp: await sdpResponse.text(),
        });

        // The call id lives in the Location header. If CORS does not expose it we still
        // connect fine; we just lose the server-side hangup, so report whatever we have.
        const location = sdpResponse.headers.get("Location") ?? "";
        const callId = location.split("/").filter(Boolean).pop() ?? "";
        void aiTutorService
          .reportConnected(started.session.id, callId)
          .catch(() => undefined);

        // Blob levels, written outside React at frame rate.
        const micBuf = new Uint8Array(new ArrayBuffer(micAnalyser.frequencyBinCount));
        const tutorBuf = new Uint8Array(new ArrayBuffer(tutorAnalyser.frequencyBinCount));
        const rms = (analyser: AnalyserNode, buf: Uint8Array<ArrayBuffer>) => {
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i += 1) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          return Math.min(1, Math.sqrt(sum / buf.length) * 3);
        };
        const tick = () => {
          levelsRef.current.mic = rms(micAnalyser, micBuf);
          levelsRef.current.tutor = rms(tutorAnalyser, tutorBuf);
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);

        flushTimerRef.current = setInterval(
          () => void flush(),
          Math.max(20, started.usage_flush_interval_seconds) * 1000
        );
        heartbeatTimerRef.current = setInterval(async () => {
          const sid = sessionIdRef.current;
          if (!sid) return;
          try {
            const beat = await aiTutorService.heartbeat(sid);
            setRemainingSeconds(beat.remaining_seconds);
            if (beat.should_end) void end("cap_reached");
          } catch {
            /* the sweep settles it regardless */
          }
        }, Math.max(15, started.heartbeat_interval_seconds) * 1000);

        setPhase("listening");
        return started;
      } catch (err) {
        teardown();
        const message =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
          (err as Error)?.message ??
          "Could not start the tutor.";
        setError(message);
        setPhase("failed");
        optionsRef.current.onError?.(message);
        return null;
      }
    },
    [end, flush, handleServerEvent, teardown]
  );

  // Flush on tab close so a session that ends by navigation still reports its transcript.
  useEffect(() => {
    const onHide = () => void flush(true);
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [flush]);

  useEffect(() => () => teardown(), [teardown]);

  return {
    phase,
    sessionId,
    caption,
    cards,
    planIndex,
    remainingSeconds,
    error,
    start,
    end,
    getLevels,
    submitQuizAnswer,
    reportRunResult,
    shareCode,
    clearCards: () => setCards([]),
  };
}
