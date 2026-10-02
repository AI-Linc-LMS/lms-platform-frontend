// @vitest-environment jsdom
/**
 * "quiz this is coming with first 10-15 seconds itself"
 *
 * A full multiple-choice question on screen before the tutor had taught anything for it to
 * check. The persona asks for a check "right after a concept lands, not saved up for the end",
 * and a model that has just read an agenda listing five concepts can reasonably decide one has
 * landed when it has only been named.
 *
 * Prose cannot fix that, for the same reason the seven-second continuation timer could not be
 * fixed by prose: it is a decision the client can simply make. Below ninety seconds there is
 * nothing for a question to test, so the first one waits. The refusal reuses `no_question`,
 * which the persona already knows how to handle gracefully - the tutor asks something out loud
 * instead of announcing a card that never came.
 *
 * The gate applies to the FIRST question only - once the lesson is genuinely under way the
 * tutor's judgement about when to test is the one that should apply, and the one-at-a-time
 * guard is what keeps that sane. That half is not covered here: closing a served quiz goes
 * through the overlay, which this harness does not mount.
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { startSession, setQuizLanguage } = vi.hoisted(() => ({
  startSession: vi.fn(),
  setQuizLanguage: vi.fn(),
}));
vi.mock("@/lib/services/ai-tutor.service", async (orig) => {
  const actual = await orig<Record<string, unknown>>();
  return {
    ...actual,
    aiTutorService: {
      ...(actual.aiTutorService as object),
      startSession,
      setQuizLanguage,
    },
  };
});

import { useRealtimeTutor } from "./useRealtimeTutor";

const POOL = [
  {
    id: 1,
    question: "What is the base case in a recursive function?",
    image: "",
    image_alt: "",
    options: [],
    style: "single",
    difficulty: "easy",
    topic: "recursion",
  },
  {
    id: 2,
    question: "What does range produce?",
    image: "",
    image_alt: "",
    options: [],
    style: "single",
    difficulty: "easy",
    topic: "recursion",
  },
];

let sent: Record<string, unknown>[] = [];
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

describe("the first question waits until there is something to check", () => {
  // A FLOOR, not a schedule. These assert that nothing is served before it and that the tutor's
  // own request is honoured after it - never that a question appears AT the boundary.
  const T0 = 1_760_000_000_000;

  beforeEach(() => {
    sent = [];
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(T0);
    startSession.mockResolvedValue({
      session: { id: "sess-1", planned_seconds: 1200 },
      client_secret: "ek_test",
      realtime: { calls_url: "https://example.test/calls", model: "m", voice: "onyx" },
      lesson_plan: [],
      question_pool: POOL,
      question_pool_language: "English",
      quota: {},
    });
    setQuizLanguage.mockReset();
    vi.stubGlobal("RTCPeerConnection", FakePeerConnection);
    vi.stubGlobal(
      "AudioContext",
      class {
        createAnalyser = fakeAnalyser;
        createMediaStreamSource = () => ({ connect: () => {} });
        close = async () => {};
        state = "running";
        resume = async () => {};
      },
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, text: async () => "v=0", headers: { get: () => null } })),
    );
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => ({ getTracks: () => [], getAudioTracks: () => [] }),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  async function connected(onQuiz = vi.fn()) {
    const hook = renderHook(() => useRealtimeTutor({ onQuiz }));
    await act(async () => {
      await hook.result.current.start({ topic: "recursion", level: "beginner", minutes: 20 });
    });
    await act(async () => {
      deliver({ type: "session.created" });
      await Promise.resolve();
    });
    await waitFor(() => expect(hook.result.current.phase).toBe("listening"));
    return hook;
  }

  async function askForAQuiz(callId: string) {
    await act(async () => {
      deliver({
        type: "response.function_call_arguments.done",
        name: "show_quiz",
        call_id: callId,
        arguments: JSON.stringify({ topic: "base case", language: "English" }),
      });
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  function replyFor(callId: string) {
    const item = sent.find(
      (f) =>
        f.type === "conversation.item.create" &&
        (f.item as { call_id?: string } | undefined)?.call_id === callId,
    );
    const output = (item?.item as { output?: string } | undefined)?.output;
    return output ? JSON.parse(output) : null;
  }

  it("declines a question fifteen seconds into the lesson", async () => {
    const onQuiz = vi.fn();
    const hook = await connected(onQuiz);

    vi.setSystemTime(T0 + 15_000);
    await askForAQuiz("q1");

    await waitFor(() => expect(replyFor("q1")).not.toBeNull());
    expect(replyFor("q1")).toEqual({ ok: false, reason: "no_question" });
    expect(onQuiz).not.toHaveBeenCalled();
    hook.unmount();
  });

  it("serves one once the lesson has actually been running", async () => {
    const onQuiz = vi.fn();
    const hook = await connected(onQuiz);

    vi.setSystemTime(T0 + 120_000);
    await askForAQuiz("q1");

    await waitFor(() => expect(replyFor("q1")).not.toBeNull());
    expect(replyFor("q1")?.ok).toBe(true);
    expect(replyFor("q1")?.asked).toBe(POOL[0].question);
    hook.unmount();
  });

});
