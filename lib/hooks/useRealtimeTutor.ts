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
import { authUtils } from "@/lib/auth/auth-utils";
import { config } from "@/lib/config";

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

/**
 * R2 — idle watchdog. A tab left open with nobody talking burns the learner's allowance at
 * roughly four cents a minute until the server cap ends it. Prompt first, then end: silently
 * hanging up on somebody who was thinking would be worse than the waste.
 */
const IDLE_PROMPT_MS = 90_000;
const IDLE_END_MS = 150_000;

/**
 * R1 — reconnect. WebRTC calls cannot resume, so each attempt is a fresh mint; the server caps
 * this too. Backoff so a genuinely broken network is not hammered.
 */
const RECONNECT_BACKOFF_MS = [1_000, 2_000, 4_000];

/** How many turns the in-room conversation view keeps. Older ones live in the recap. */
const TRANSCRIPT_LIMIT = 200;

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

export interface TranscriptEntry {
  id: number;
  role: "tutor" | "student";
  text: string;
  at: number;
}

export interface TutorToolCall {
  name: string;
  callId: string;
  args: Record<string, unknown>;
}

interface UseRealtimeTutorOptions {
  onQuiz?: (question: PooledQuestion) => void;
  onOpenIde?: (args: { language: string; task: string; starter_code?: string }) => void;
  onCloseIde?: () => void;
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
  /** True while a dropped connection is being re-established (R1). */
  const [reconnecting, setReconnecting] = useState(false);
  /** Set when the idle watchdog is about to end the session (R2). */
  const [idleWarning, setIdleWarning] = useState(false);
  /**
   * The conversation so far, for the learner to read back mid-lesson.
   *
   * Kept separately from `pendingTurnsRef`, which is a write-behind queue that is spliced
   * empty on every flush and therefore cannot be shown to anybody. Voice is the one medium
   * with no scrollback, so "what did it just say" was unanswerable without this: the caption
   * only holds the current sentence.
   *
   * Capped, because a thirty-minute lesson is a lot of DOM for something usually closed.
   */
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

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
  // call_id → tool name, populated from `conversation.item.added`. The arguments-done
  // event carries the id and the arguments but not reliably the name, so the two have to
  // be joined. `dispatchedRef` dedupes against the `response.done` backstop.
  const pendingCallsRef = useRef<Map<string, string>>(new Map());
  const dispatchedRef = useRef<Set<string>>(new Set());
  const pendingTurnsRef = useRef<TranscriptTurn[]>([]);
  const pendingArtifactsRef = useRef<CanvasArtifactPayload[]>([]);
  const pendingUsageRef = useRef<unknown[]>([]);
  /**
   * Session-monotonic artifact sequence.
   *
   * This used to be `pendingArtifactsRef.current.length`, which resets every time a flush
   * splices the queue — so sequences repeated across flushes. Harmless until the server gained
   * a `(session, sequence)` unique constraint to stop retried batches duplicating artifacts
   * (audit C1), at which point repeated sequences would make every artifact after the first
   * flush silently vanish via ignore_conflicts. The counter has to outlive the queue.
   */
  const artifactSeqRef = useRef(0);
  const tutorTranscriptRef = useRef("");
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closedRef = useRef(false);
  const lastVoiceAtRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /**
   * Whether OpenAI is currently generating a response.
   *
   * `response.create` on a conversation that already has one in flight is rejected outright
   * with "Conversation already has an active response in progress", and because that arrives
   * as a plain `error` event it surfaced to the learner as a red banner mid-lesson. It
   * happened constantly for the honest reason: a tool result and a quiz grade both want to
   * make the tutor say something, and the tutor is very often still talking.
   *
   * So responses are requested through `requestResponse` rather than sent directly. If one is
   * already live the request is remembered and issued the moment it completes, which is the
   * behaviour that was wanted anyway: react to the answer once you have finished the
   * sentence, not by talking over yourself.
   */
  const responseActiveRef = useRef(false);
  const responseQueuedRef = useRef(false);
  const reconnectAttemptRef = useRef(0);
  const reconnectingRef = useRef(false);
  const connectRef = useRef<((secret: string, callsUrl: string) => Promise<void>) | null>(null);

  /** Audio levels for the blob. Read via rAF by the visual, never through React state. */
  const getLevels = useCallback(() => levelsRef.current, []);

  // --- outbound helpers ------------------------------------------------------

  const send = useCallback((payload: unknown) => {
    const dc = dcRef.current;
    if (dc && dc.readyState === "open") {
      dc.send(JSON.stringify(payload));
    }
  }, []);

  /** Ask for a spoken turn, waiting out any turn already in progress. */
  const requestResponse = useCallback(() => {
    if (responseActiveRef.current) {
      responseQueuedRef.current = true;
      return;
    }
    // Optimistic: set before sending, because two tool results landing in the same tick
    // would otherwise both see `false` and both send.
    responseActiveRef.current = true;
    send({ type: "response.create" });
  }, [send]);

  /**
   * A turn finished. Let anything that queued behind it go now.
   *
   * The queue is one deep on purpose. Three tool results arriving during one long answer
   * should produce one reaction, not three consecutive monologues.
   */
  const releaseResponseGate = useCallback(() => {
    responseActiveRef.current = false;
    if (!responseQueuedRef.current) return;
    responseQueuedRef.current = false;
    responseActiveRef.current = true;
    send({ type: "response.create" });
  }, [send]);

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
      requestResponse();
    },
    [send, requestResponse]
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
      requestResponse();
    },
    [send, requestResponse]
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
      sequence: artifactSeqRef.current++,
    });
  }, []);

  // --- tool dispatch ---------------------------------------------------------

  const handleToolCall = useCallback(
    async (call: TutorToolCall) => {
      const { name, callId, args } = call;
      if (callId && dispatchedRef.current.has(callId)) return;
      if (callId) dispatchedRef.current.add(callId);
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
        case "close_ide":
          // The learner can ask for this out loud ("close the editor"), so the tutor needs a
          // way to actually do it rather than agreeing and leaving it open.
          optionsRef.current.onCloseIde?.();
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

  /**
   * "Still there?" dismissed. Resets the idle clock without needing the learner to speak, so
   * clicking the prompt is enough to keep a lesson they are still reading through.
   */
  const confirmPresence = useCallback(() => {
    lastVoiceAtRef.current = Date.now();
    setIdleWarning(false);
  }, []);

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
          lastVoiceAtRef.current = Date.now();
          setIdleWarning(false);
          setPhase("student-speaking");
          // Drop audio already buffered in the browser so barge-in is immediate rather
          // than "it keeps talking for another second".
          send({ type: "output_audio_buffer.clear" });
          break;

        case "input_audio_buffer.speech_stopped":
          setPhase("thinking");
          break;

        // On WebRTC the tutor's audio travels as RTP on the media track, so there is no
        // `response.output_audio.delta` to watch. These two are the authoritative signals
        // for "the tutor is actually making sound"; the transcript delta below is a
        // secondary trigger for the case where audio starts before any text arrives.
        case "output_audio_buffer.started":
          lastVoiceAtRef.current = Date.now();
          setIdleWarning(false);
          setPhase("speaking");
          break;
        case "output_audio_buffer.stopped":
        case "output_audio_buffer.cleared":
          setPhase("listening");
          break;

        case "response.created":
          responseActiveRef.current = true;
          break;

        case "response.output_audio_transcript.delta": {
          const delta = String(event.delta ?? "");
          tutorTranscriptRef.current += delta;
          setCaption(tutorTranscriptRef.current.slice(-320));
          setPhase("speaking");
          break;
        }

        // Tool calls are dispatched HERE, not from `response.done`. `response.done`
        // arrives only after the whole turn finishes, so a diagram requested mid-sentence
        // would land on the canvas seconds after the tutor had finished describing it.
        // That is precisely the dead-air problem this architecture exists to avoid.
        case "conversation.item.added": {
          const item = (event.item ?? {}) as Record<string, unknown>;
          if (item.type === "function_call" && item.call_id) {
            pendingCallsRef.current.set(String(item.call_id), String(item.name ?? ""));
          }
          break;
        }

        case "response.function_call_arguments.done": {
          const callId = String(event.call_id ?? "");
          const name = pendingCallsRef.current.get(callId) ?? String(event.name ?? "");
          if (!name) break;
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(String(event.arguments ?? "{}"));
          } catch {
            args = {};
          }
          void handleToolCall({ name, callId, args });
          break;
        }

        case "conversation.item.input_audio_transcription.completed": {
          const text = String(event.transcript ?? "").trim();
          if (text) {
            const sequence = seqRef.current++;
            pendingTurnsRef.current.push({
              role: "student",
              text,
              sequence,
              offset_ms: Date.now() - startedAtRef.current,
            });
            setTranscript((prev) =>
              [...prev, { id: sequence, role: "student" as const, text, at: Date.now() }].slice(
                -TRANSCRIPT_LIMIT
              )
            );
          }
          break;
        }

        case "response.done": {
          const response = (event.response ?? {}) as Record<string, unknown>;

          if (response.usage) {
            pendingUsageRef.current.push({ usage: response.usage });
          }

          // Backstop only. Anything already dispatched from
          // `response.function_call_arguments.done` is deduped inside handleToolCall, so
          // this catches a tool whose arguments-done event was dropped rather than
          // firing everything a second time.
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
            const sequence = seqRef.current++;
            pendingTurnsRef.current.push({
              role: "tutor",
              text: spoken,
              sequence,
              offset_ms: Date.now() - startedAtRef.current,
            });
            setTranscript((prev) =>
              [
                ...prev,
                { id: sequence, role: "tutor" as const, text: spoken, at: Date.now() },
              ].slice(-TRANSCRIPT_LIMIT)
            );
            tutorTranscriptRef.current = "";
          }
          setPhase("listening");
          releaseResponseGate();
          break;
        }

        case "response.cancelled":
          tutorTranscriptRef.current = "";
          setPhase("listening");
          releaseResponseGate();
          break;

        case "error": {
          const message =
            ((event.error as Record<string, unknown>)?.message as string) ??
            "The tutor hit a problem.";
          // "Conversation already has an active response in progress" is a race we lost, not
          // a fault the learner can do anything about. `requestResponse` normally prevents
          // it, but OpenAI can start a response we were never told about, so the gate can
          // still be stale. Re-queue and stay quiet.
          if (/active response/i.test(message)) {
            responseActiveRef.current = true;
            responseQueuedRef.current = true;
            break;
          }
          optionsRef.current.onError?.(message);
          break;
        }
        default:
          break;
      }
    },
    [handleToolCall, send, releaseResponseGate]
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

  /**
   * Drop the transport only: peer connection, data channel, microphone, audio element,
   * analysers.
   *
   * Split out from `teardown` for reconnect (R1). A reconnect has to discard the dead transport
   * but KEEP the session — its id, its timers, its pending transcript and its artifact sequence
   * — because it is the same lesson continuing. Tearing everything down and starting over would
   * lose the queued transcript and restart the artifact numbering, which the server's uniqueness
   * constraint would then reject.
   */
  const teardownTransport = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    // A new transport is a new conversation with nothing in flight. Carrying a stuck `true`
    // across a reconnect would mean the tutor never spoke again after one.
    responseActiveRef.current = false;
    responseQueuedRef.current = false;

    // Detach the handlers first, or closing the connection fires the very drop detection that
    // would start another reconnect.
    const dc = dcRef.current;
    if (dc) {
      dc.onclose = null;
      dc.onmessage = null;
    }
    const pc = pcRef.current;
    if (pc) {
      pc.oniceconnectionstatechange = null;
      pc.ontrack = null;
    }

    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    dc?.close();
    dcRef.current = null;
    pc?.close();
    pcRef.current = null;
    void audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.srcObject = null;
      audioElRef.current = null;
    }
    pendingCallsRef.current.clear();
    dispatchedRef.current.clear();
    levelsRef.current = { mic: 0, tutor: 0 };
  }, []);

  /** Everything: the transport plus the session's own timers. Ends the lesson. */
  const teardown = useCallback(() => {
    teardownTransport();
    if (flushTimerRef.current) clearInterval(flushTimerRef.current);
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    flushTimerRef.current = null;
    heartbeatTimerRef.current = null;
    idleTimerRef.current = null;
  }, [teardownTransport]);

  /**
   * R3 — settle on tab close.
   *
   * `end()` is async and `beforeunload` does not wait for promises, so closing the tab never
   * completed the call. Minutes were still charged correctly (the sweep settles from the server
   * clock) but settlement waited up to two minutes and the recap arrived late.
   *
   * `fetch` with `keepalive` rather than `navigator.sendBeacon`, deliberately: a beacon cannot
   * set an `Authorization` header, so using one would mean accepting the JWT in the request
   * body, and inventing a second way to authenticate for the sake of one call is not a trade
   * worth making. `keepalive` survives the unload and keeps the normal header.
   *
   * Fire-and-forget by construction: there is no response to read and nothing to retry.
   */
  const keepaliveEnd = useCallback((reason = "learner") => {
    const sid = sessionIdRef.current;
    if (!sid || closedRef.current) return;
    closedRef.current = true;
    try {
      const token = authUtils.getAccessToken();
      if (!token) return;
      void fetch(`${config.apiBaseUrl}/ai-tutor/api/sessions/${sid}/end/`, {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      }).catch(() => undefined);
    } catch {
      /* the sweep settles it regardless */
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
   * Build the transport: microphone, peer connection, data channel, SDP exchange, analysers.
   *
   * Extracted from `start` so a reconnect can rebuild exactly this with a fresh credential (R1)
   * without duplicating the media setup — and, more importantly, without duplicating its
   * subtleties, which is where a second copy would drift.
   *
   * Must run inside the user gesture on the first call. On a reconnect there is no gesture, but
   * the audio element has already been blessed once in this document, so playback is allowed.
   */
  const connectTransport = useCallback(
    async (secret: string, callsUrl: string) => {
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

        // DELIBERATELY DETACHED — never appended to the document.
        //
        // `lib/utils/cameraUtils.ts::stopAllMediaTracks` walks
        // `document.querySelectorAll("audio")` and stops the tracks on every srcObject it
        // finds. An element in the document is therefore one stray navigation away from
        // having the tutor's voice killed under it. A detached element is invisible to
        // that query, and `play()` works fine on one. The route is allowlisted in
        // `useCameraRouteGuard` as well; this is the belt to that braces.
        const audioEl = new Audio();
        audioEl.autoplay = true;
        (audioEl as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
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
        // R1 — the two signals that a live call has died. Both fire on a lost network, an ICE
        // failure, or a provider-side hangup, and either one means the lesson is over unless we
        // re-establish it.
        dc.onclose = () => {
          if (!closedRef.current) void attemptReconnect();
        };
        pc.oniceconnectionstatechange = () => {
          const st = pc.iceConnectionState;
          if ((st === "failed" || st === "disconnected") && !closedRef.current) {
            void attemptReconnect();
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const sdpResponse = await fetch(callsUrl, {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${secret}`,
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
          .reportConnected(sessionIdRef.current ?? "", callId)
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    connectRef.current = connectTransport;
  }, [connectTransport]);

  /**
   * R1 — re-establish a dropped call.
   *
   * A WebRTC session cannot be resumed, so this asks the server for a fresh credential and
   * builds a new peer connection for the SAME lesson. The server injects a primer so the tutor
   * carries on mid-thought rather than greeting the learner again, does not extend the deadline,
   * and does not charge for the reconnect. It also caps the attempts, which is the real bound —
   * this backoff is only there to avoid hammering a network that is genuinely down.
   *
   * Guarded against re-entry: `dc.onclose` and `oniceconnectionstatechange` both fire on the
   * same failure, so without the flag one drop would start two reconnects.
   */
  const attemptReconnect = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid || closedRef.current || reconnectingRef.current) return;
    reconnectingRef.current = true;
    setReconnecting(true);

    const attempt = reconnectAttemptRef.current;
    if (attempt >= RECONNECT_BACKOFF_MS.length) {
      reconnectingRef.current = false;
      setReconnecting(false);
      setError("The connection dropped and could not be restored.");
      setPhase("failed");
      optionsRef.current.onError?.("The connection dropped. Please start a new session.");
      return;
    }
    reconnectAttemptRef.current = attempt + 1;

    // Tear the dead transport down first, or the old peer connection keeps its tracks and the
    // microphone indicator stays lit while nothing is listening.
    teardownTransport();

    await new Promise((resolve) => setTimeout(resolve, RECONNECT_BACKOFF_MS[attempt]));
    if (closedRef.current) {
      reconnectingRef.current = false;
      return;
    }

    try {
      setPhase("connecting");
      const again = await aiTutorService.reconnect(sid);
      await connectRef.current?.(again.client_secret, again.realtime.calls_url);
      setRemainingSeconds(again.max_seconds);
      reconnectingRef.current = false;
      setReconnecting(false);
      // Reset the ladder: a successful reconnect means the network recovered, so a LATER drop
      // deserves its own full set of attempts rather than inheriting this one's.
      reconnectAttemptRef.current = 0;
    } catch (err) {
      reconnectingRef.current = false;
      setReconnecting(false);
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
      if (code === "reconnect_limit" || code === "session_closed" || code === "deadline_passed") {
        // The server has decided this lesson is over. Retrying would only mint more.
        setPhase("failed");
        setError(
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
            "That lesson has ended."
        );
        return;
      }
      void attemptReconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

        await connectTransport(started.client_secret, started.realtime.calls_url);

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

        // R2 — idle watchdog. At roughly four cents a minute, a tab left open with nobody
        // talking quietly spends the learner's whole allowance. Prompt first, then end: cutting
        // off someone who was thinking would be worse than the waste.
        lastVoiceAtRef.current = Date.now();
        idleTimerRef.current = setInterval(() => {
          if (closedRef.current || reconnectingRef.current) return;
          const silent = Date.now() - lastVoiceAtRef.current;
          if (silent >= IDLE_END_MS) {
            void end("idle");
          } else if (silent >= IDLE_PROMPT_MS) {
            setIdleWarning(true);
          }
        }, 5_000);

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
    transcript,
    planIndex,
    remainingSeconds,
    error,
    /** True while a dropped connection is being re-established (R1). */
    reconnecting,
    /** True when the idle watchdog is about to end the session (R2). */
    idleWarning,
    confirmPresence,
    keepaliveEnd,
    start,
    end,
    getLevels,
    submitQuizAnswer,
    reportRunResult,
    shareCode,
    clearCards: () => setCards([]),
  };
}
