"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import interviewService, {
  type InterviewTurnPayload,
  type NextQuestion,
} from "@/lib/services/interview.service";
import { getAudioConstraints } from "@/lib/utils/audio-constraints";
import { registerMediaStream } from "@/lib/utils/media-stream-registry";

/**
 * The interview transport: browser <-> OpenAI over WebRTC, Django only for the record.
 *
 * Adapted from `useRealtimeTutor`, which is proven in production, with one structural
 * difference that is the whole point of the rebuild: **the model has no questions.** It has a
 * single tool, `next_question`, and this hook resolves it by asking Django. So every question
 * asked leaves a server row, and the browser never holds the paper.
 *
 * Two things carried over from the tutor because they were learned the hard way:
 *
 * 1. The audio element is DELIBERATELY DETACHED from the document.
 *    `lib/utils/cameraUtils.ts::stopAllMediaTracks` walks `document.querySelectorAll("audio")`
 *    and stops the tracks on everything it finds, so an element in the document is one stray
 *    navigation away from having the interviewer go silent mid-question.
 *
 * 2. The call id comes from the SDP response's `Location` header. Without it there is no
 *    server-side hangup, so a session cap cannot be enforced against a client that ignores
 *    its own timer.
 */

const OAI_EVENTS_CHANNEL = "oai-events";
const TURN_FLUSH_MS = 10_000;

export type InterviewPhase =
  | "idle"
  | "starting"
  | "connecting"
  | "live"
  | "ending"
  | "ended"
  | "failed";

export interface InterviewTranscriptEntry {
  role: "interviewer" | "candidate";
  text: string;
  seq: number;
}

export interface UseRealtimeInterviewOptions {
  /** Fired when the server releases a question, so the UI can show progress. */
  onQuestion?: (question: NextQuestion) => void;
  onPhase?: (phase: InterviewPhase) => void;
  onError?: (message: string) => void;
}

export function useRealtimeInterview(options: UseRealtimeInterviewOptions = {}) {
  const [phase, setPhase] = useState<InterviewPhase>("idle");
  const [error, setError] = useState<string>("");
  const [transcript, setTranscript] = useState<InterviewTranscriptEntry[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<NextQuestion | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [candidateSpeaking, setCandidateSpeaking] = useState(false);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const sessionIdRef = useRef<string>("");
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const closedRef = useRef(false);

  // Turn buffer, flushed on a timer rather than per turn, so a long interview is a handful of
  // requests rather than hundreds.
  const pendingTurnsRef = useRef<InterviewTurnPayload[]>([]);
  const seqRef = useRef(0);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // The question currently being answered, so a candidate's speech lands against the right
  // row. Held in a ref because the data channel handler must see the latest value without
  // being re-created, which would drop events.
  const activeQuestionRef = useRef<NextQuestion | null>(null);
  const answerBufferRef = useRef<string>("");

  const setPhaseSafe = useCallback((next: InterviewPhase) => {
    setPhase(next);
    optionsRef.current.onPhase?.(next);
  }, []);

  const fail = useCallback(
    (message: string) => {
      setError(message);
      setPhaseSafe("failed");
      optionsRef.current.onError?.(message);
    },
    [setPhaseSafe],
  );

  const recordTurn = useCallback((role: "interviewer" | "candidate", text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    seqRef.current += 1;
    const entry: InterviewTurnPayload = { role, text: trimmed, seq: seqRef.current };
    pendingTurnsRef.current.push(entry);
    setTranscript((prev) => [...prev, entry]);
  }, []);

  const flushTurns = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    const batch = pendingTurnsRef.current;
    if (!sessionId || !batch.length) return;
    pendingTurnsRef.current = [];
    try {
      await interviewService.pushTurns(sessionId, batch);
    } catch {
      // Put them back rather than losing the record of what was said.
      pendingTurnsRef.current = [...batch, ...pendingTurnsRef.current];
    }
  }, []);

  /**
   * Commit whatever the candidate said to the question they were on.
   *
   * Called when the next question is released, and again at the end, so the last answer is
   * not lost. `update_or_create` on the server makes a repeat harmless.
   */
  const commitAnswer = useCallback(async () => {
    const question = activeQuestionRef.current;
    const text = answerBufferRef.current.trim();
    answerBufferRef.current = "";
    if (!question?.question_id || !text || !sessionIdRef.current) return;
    try {
      await interviewService.answer(sessionIdRef.current, {
        question_id: question.question_id,
        transcript: text,
      });
    } catch {
      /* the turn record still carries what was said; never fail an interview on this */
    }
  }, []);

  const sendEvent = useCallback((payload: Record<string, unknown>) => {
    const dc = dcRef.current;
    if (dc && dc.readyState === "open") dc.send(JSON.stringify(payload));
  }, []);

  /** Resolve the model's one tool by asking the server. */
  const resolveNextQuestion = useCallback(
    async (callId: string) => {
      await commitAnswer();
      let result: NextQuestion;
      try {
        result = await interviewService.nextQuestion(sessionIdRef.current);
      } catch {
        result = { done: true };
      }

      if (!result.done) {
        activeQuestionRef.current = result;
        setCurrentQuestion(result);
        optionsRef.current.onQuestion?.(result);
      } else {
        activeQuestionRef.current = null;
        setCurrentQuestion(null);
      }

      sendEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify(result),
        },
      });
      sendEvent({ type: "response.create" });
    },
    [commitAnswer, sendEvent],
  );

  const handleServerEvent = useCallback(
    (event: Record<string, unknown>) => {
      const type = String(event.type ?? "");

      switch (type) {
        case "session.created":
          setPhaseSafe("live");
          break;

        case "input_audio_buffer.speech_started":
          setCandidateSpeaking(true);
          // Drop audio already buffered in the browser so barge-in is immediate. The old
          // stack had no barge-in at all and candidates could not interrupt.
          sendEvent({ type: "output_audio_buffer.clear" });
          break;

        case "input_audio_buffer.speech_stopped":
          setCandidateSpeaking(false);
          break;

        case "response.function_call_arguments.done": {
          const name = String(event.name ?? "");
          const callId = String(event.call_id ?? "");
          if (name === "next_question" && callId) void resolveNextQuestion(callId);
          break;
        }

        case "conversation.item.input_audio_transcription.completed": {
          // What the CANDIDATE said. Buffered against the current question and recorded.
          const text = String(event.transcript ?? "");
          answerBufferRef.current = `${answerBufferRef.current} ${text}`.trim();
          recordTurn("candidate", text);
          break;
        }

        case "response.output_audio_transcript.done": {
          recordTurn("interviewer", String(event.transcript ?? ""));
          break;
        }

        default:
          break;
      }
    },
    [recordTurn, resolveNextQuestion, sendEvent, setPhaseSafe],
  );

  const connect = useCallback(
    async (templateId: number) => {
      if (phase !== "idle" && phase !== "failed" && phase !== "ended") return;
      closedRef.current = false;
      setError("");
      setTranscript([]);
      setPhaseSafe("starting");

      let started;
      try {
        started = await interviewService.start(templateId);
      } catch {
        fail("Could not start the interview. Please try again.");
        return;
      }
      sessionIdRef.current = started.session_id;
      setQuestionCount(started.question_count);
      setPhaseSafe("connecting");

      try {
        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        // Detached on purpose. See this module's docstring.
        const audioEl = new Audio();
        audioEl.autoplay = true;
        (audioEl as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
        audioElRef.current = audioEl;

        pc.ontrack = (e) => {
          audioEl.srcObject = e.streams[0];
          void audioEl.play().catch(() => undefined);
        };

        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: getAudioConstraints(),
        });
        micStreamRef.current = micStream;
        registerMediaStream(micStream);
        micStream.getTracks().forEach((track) => pc.addTrack(track, micStream));

        const dc = pc.createDataChannel(OAI_EVENTS_CHANNEL);
        dcRef.current = dc;
        dc.onmessage = (e) => {
          try {
            handleServerEvent(JSON.parse(e.data));
          } catch {
            /* a malformed frame is not worth ending an interview over */
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
        if (!sdpResponse.ok) throw new Error("SDP exchange failed");
        await pc.setRemoteDescription({ type: "answer", sdp: await sdpResponse.text() });

        const location = sdpResponse.headers.get("Location") ?? "";
        const callId = location.split("/").filter(Boolean).pop() ?? "";
        void interviewService
          .reportConnected(sessionIdRef.current, callId)
          .catch(() => undefined);

        flushTimerRef.current = setInterval(() => void flushTurns(), TURN_FLUSH_MS);
        setPhaseSafe("live");
      } catch {
        fail("Could not connect. Check your microphone and network, then try again.");
      }
    },
    [fail, flushTurns, handleServerEvent, phase, setPhaseSafe],
  );

  const end = useCallback(async () => {
    if (closedRef.current) return;
    closedRef.current = true;
    setPhaseSafe("ending");

    if (flushTimerRef.current) {
      clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    // Order matters: the last answer, then the transcript, then the close. Ending first would
    // grade the interview without its final answer in it.
    await commitAnswer();
    await flushTurns();

    try {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      dcRef.current?.close();
      pcRef.current?.close();
      if (audioElRef.current) audioElRef.current.srcObject = null;
    } catch {
      /* teardown is best effort */
    }

    const sessionId = sessionIdRef.current;
    if (sessionId) {
      try {
        await interviewService.end(sessionId, "closed");
      } catch {
        /* the server sweep reconciles anything that never reported */
      }
    }
    setPhaseSafe("ended");
  }, [commitAnswer, flushTurns, setPhaseSafe]);

  // A candidate who closes the tab must not leave a live call running and billing.
  useEffect(() => {
    return () => {
      if (!closedRef.current) {
        try {
          micStreamRef.current?.getTracks().forEach((t) => t.stop());
          dcRef.current?.close();
          pcRef.current?.close();
        } catch {
          /* nothing useful to do while unmounting */
        }
      }
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
    };
  }, []);

  return {
    phase,
    error,
    transcript,
    currentQuestion,
    questionCount,
    candidateSpeaking,
    sessionId: sessionIdRef.current,
    connect,
    end,
  };
}

export default useRealtimeInterview;
