// @vitest-environment jsdom
/**
 * "After answering a quiz question, the quiz does not close and the tutor continues asking
 *  multiple questions one after another."
 *
 * NOTHING enforced one-quiz-at-a-time. "At most one per section" was prose in the tool
 * description and in the prompt - guidance to the model, not a constraint on the client. So a
 * second `show_quiz` while a question was still held or already on screen overwrote it, the
 * overlay's reset effect (keyed on question id) wiped the learner's graded answer and the
 * tutor's reaction, and a fresh question took its place. From the seat that reads as a modal
 * that will not close and a tutor that keeps asking.
 *
 * It also costs money: the room suspends the idle watchdog while the overlay is up, so an
 * occupied overlay disables the cost guard and the session runs to its server deadline with
 * nothing refunded.
 *
 * This drives the hook through its real data channel: a `response.function_call_arguments.done`
 * frame is exactly what OpenAI sends, and the reply the hook writes back is what the model sees.
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock is hoisted above every import, so the spy has to be created inside the factory and
// reached through vi.hoisted rather than closed over from module scope.
const { startSession } = vi.hoisted(() => ({ startSession: vi.fn() }));
vi.mock("@/lib/services/ai-tutor.service", async (orig) => {
  const actual = await orig<Record<string, unknown>>();
  return { ...actual, aiTutorService: { ...(actual.aiTutorService as object), startSession } };
});

import { useRealtimeTutor } from "./useRealtimeTutor";

const POOL = [
  { id: 1, question: "What does a for loop do?", image: "", image_alt: "", options: [], style: "single", difficulty: "easy", topic: "loops" },
  { id: 2, question: "What does range produce?", image: "", image_alt: "", options: [], style: "single", difficulty: "easy", topic: "loops" },
];

/** The frames the hook wrote back to OpenAI. */
let sent: Record<string, unknown>[] = [];
/** The hook's own `dc.onmessage`, so a test can feed it server events. */
let deliver: (event: unknown) => void = () => {};

class FakeDataChannel {
  readyState = "open";
  onmessage: ((e: { data: string }) => void) | null = null;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  send(payload: string) {
    sent.push(JSON.parse(payload));
  }
  close() {
    this.readyState = "closed";
  }
}

class FakePeerConnection {
  ontrack: unknown = null;
  oniceconnectionstatechange: unknown = null;
  iceConnectionState = "connected";
  localDescription = { type: "offer", sdp: "v=0" };
  createDataChannel() {
    const dc = new FakeDataChannel();
    deliver = (event) => dc.onmessage?.({ data: JSON.stringify(event) });
    queueMicrotask(() => dc.onopen?.());
    return dc;
  }
  addTrack() {}
  async createOffer() {
    return { type: "offer", sdp: "v=0" };
  }
  async setLocalDescription() {}
  async setRemoteDescription() {}
  getSenders() {
    return [];
  }
  close() {}
}

function fakeAnalyser() {
  return {
    fftSize: 0,
    frequencyBinCount: 8,
    getByteFrequencyData: () => {},
    getByteTimeDomainData: () => {},
    connect: () => {},
  };
}

describe("show_quiz never replaces a question the learner is still on", () => {
  beforeEach(() => {
    sent = [];
    startSession.mockResolvedValue({
      session: { id: 7, planned_seconds: 1200 },
      client_secret: "ek_test",
      realtime: { calls_url: "https://example.test/calls", model: "m", voice: "onyx" },
      lesson_plan: [],
      question_pool: POOL,
      quota: {},
    });
    vi.stubGlobal("RTCPeerConnection", FakePeerConnection);
    vi.stubGlobal("AudioContext", class {
      createAnalyser = fakeAnalyser;
      createMediaStreamSource = () => ({ connect: () => {} });
      close = async () => {};
      state = "running";
      resume = async () => {};
    });
    // The SDP answer. `headers.get("Location")` is read for the call id, so it has to exist.
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      text: async () => "v=0",
      headers: { get: () => null },
    })));
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: async () => ({ getTracks: () => [], getAudioTracks: () => [] }) },
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  /** Bring the hook up to a live data channel with a loaded question pool.
   *  `start` resolves before the SDP exchange finishes, so wait for the hook's own opening
   *  `session.update` - that is the first thing it writes once the channel is open. */
  async function connected(onQuiz = vi.fn()) {
    const hook = renderHook(() => useRealtimeTutor({ onQuiz }));
    await act(async () => {
      await hook.result.current.start({ topic: "loops", level: "beginner", minutes: 20 });
    });
    // `session.created` is the realtime API's "the channel is live" event, and the hook answers
    // it by moving to `listening`. That is the cleanest proof the transport is wired up.
    await act(async () => {
      deliver({ type: "session.created" });
      await Promise.resolve();
    });
    await waitFor(() => expect(hook.result.current.phase).toBe("listening"));
    return hook;
  }

  /** What OpenAI sends when the model finishes streaming a tool call's arguments. */
  function toolCall(callId: string, name: string, args: Record<string, unknown>) {
    deliver({
      type: "response.function_call_arguments.done",
      name,
      call_id: callId,
      arguments: JSON.stringify(args),
    });
  }

  /** The output the hook wrote back for one tool call. */
  function replyFor(callId: string) {
    const item = sent.find(
      (f) =>
        f.type === "conversation.item.create" &&
        (f.item as { call_id?: string } | undefined)?.call_id === callId,
    );
    const output = (item?.item as { output?: string } | undefined)?.output;
    return output ? JSON.parse(output) : null;
  }

  it("refuses a second question while one is still waiting to be shown", async () => {
    const hook = await connected();
    await act(async () => {
      toolCall("call-1", "show_quiz", { topic: "for loop" });
      await Promise.resolve();
    });
    expect(replyFor("call-1")?.ok).toBe(true);

    await act(async () => {
      toolCall("call-2", "show_quiz", { topic: "range" });
      await Promise.resolve();
    });

    // A NAMED refusal, not a false {ok:true}: the model reacts to tool results out loud, and a
    // false positive is what made it announce a question that never arrived.
    expect(replyFor("call-2")).toEqual({ ok: false, reason: "quiz_already_open" });
    hook.unmount();
  });

  it("refuses while a quiz is on screen, and allows the next one after it closes", async () => {
    const hook = await connected();
    // The page reports the overlay's lifetime.
    act(() => hook.result.current.setQuizOpen(true));

    await act(async () => {
      toolCall("call-a", "show_quiz", { topic: "for loop" });
      await Promise.resolve();
    });
    expect(replyFor("call-a")).toEqual({ ok: false, reason: "quiz_already_open" });

    act(() => hook.result.current.setQuizOpen(false));
    await act(async () => {
      toolCall("call-b", "show_quiz", { topic: "range" });
      await Promise.resolve();
    });
    expect(replyFor("call-b")?.ok).toBe(true);
    hook.unmount();
  });

  it("does not burn the refused question out of the pool", async () => {
    // The pool is small (18 max). A refusal that still consumed a question would let the model
    // chain through it and leave the lesson with nothing left to ask.
    const onQuiz = vi.fn();
    const hook = await connected(onQuiz);

    await act(async () => {
      toolCall("c1", "show_quiz", { topic: "for loop" });
      await Promise.resolve();
    });
    const first = replyFor("c1")?.asked;

    await act(async () => {
      toolCall("c2", "show_quiz", { topic: "range" });
      await Promise.resolve();
    });
    expect(replyFor("c2")?.ok).toBe(false);

    // The held question is released when the tutor stops speaking; it must still be the first
    // one, not silently swapped for the second.
    await act(async () => {
      deliver({ type: "output_audio_buffer.stopped" });
      await Promise.resolve();
    });
    await waitFor(() => expect(onQuiz).toHaveBeenCalled());
    expect(onQuiz.mock.calls[0][0].question).toBe(first);
    hook.unmount();
  });
});
