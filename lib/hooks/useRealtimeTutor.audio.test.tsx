// @vitest-environment jsdom
/**
 * "There is no noise cancellation, even the slightest noise is captured and the tutor gets
 * interrupted."
 *
 * Three layers of noise handling exist for this room and only two of them were ever wired up:
 * the browser's own DSP through `getAudioConstraints`, and the provider's `far_field`
 * `noise_reduction` block beside `turn_detection` in ai_tutor/services/realtime.py. The third -
 * the RNNoise AudioWorklet in `lib/utils/noise-suppression.ts`, vendored into
 * `public/noise-suppression/` on postinstall - had exactly two consumers, both in
 * mock-interview. The tutor took the raw microphone straight from `getUserMedia` to
 * `pc.addTrack`.
 *
 * The reason is mundane rather than deliberate: `applyNoiseSuppression` gates itself on
 * `getNoiseSuppressionPreference()`, a sessionStorage flag that mock-interview's device-check
 * page sets. The tutor has no device-check page, so there was nowhere to hang the opt-in and
 * nobody hung it anywhere else.
 *
 * WHAT THIS FILE GUARDS, and why it is two things and not one: the fix must remove false
 * interruptions WITHOUT removing real ones. A learner being able to cut the tutor off
 * mid-sentence is the behaviour this room most needs to keep, and the easy version of this fix -
 * raising the VAD threshold - would have taken it away. RNNoise is a speech/non-speech model,
 * so it attenuates the fan and the keyboard and passes human speech through untouched. Both
 * directions are asserted below.
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAudioConstraints } from "@/lib/utils/audio-constraints";

const { startSession, applyNoiseSuppression } = vi.hoisted(() => ({
  startSession: vi.fn(),
  applyNoiseSuppression: vi.fn(),
}));

vi.mock("@/lib/services/ai-tutor.service", async (orig) => {
  const actual = await orig<Record<string, unknown>>();
  return { ...actual, aiTutorService: { ...(actual.aiTutorService as object), startSession } };
});
vi.mock("@/lib/utils/noise-suppression", () => ({ applyNoiseSuppression }));

import { useRealtimeTutor } from "./useRealtimeTutor";

let sent: Record<string, unknown>[] = [];
let deliver: (event: unknown) => void = () => {};
/** Every track handed to the peer connection, in order. */
let addedTracks: { id: string }[] = [];

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
  addTrack(track: { id: string }) {
    addedTracks.push(track);
  }
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

/** A track that records whether anything stopped it. */
function fakeTrack(id: string) {
  return { id, stopped: false, stop() { this.stopped = true; } };
}

describe("the microphone the tutor actually listens through", () => {
  let rawTrack: ReturnType<typeof fakeTrack>;
  let cleanTrack: ReturnType<typeof fakeTrack>;
  let getUserMedia: ReturnType<typeof vi.fn>;
  let teardown: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sent = [];
    addedTracks = [];
    rawTrack = fakeTrack("raw-mic");
    cleanTrack = fakeTrack("rnnoise-out");
    teardown = vi.fn();

    const rawStream = {
      getTracks: () => [rawTrack],
      getAudioTracks: () => [rawTrack],
      getVideoTracks: () => [],
    };
    const cleanStream = {
      getTracks: () => [cleanTrack],
      getAudioTracks: () => [cleanTrack],
      getVideoTracks: () => [],
    };
    applyNoiseSuppression.mockResolvedValue({ outputStream: cleanStream, teardown });

    startSession.mockResolvedValue({
      session: { id: 7, planned_seconds: 1200 },
      client_secret: "ek_test",
      realtime: { calls_url: "https://example.test/calls", model: "m", voice: "onyx" },
      lesson_plan: [],
      question_pool: [],
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
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      text: async () => "v=0",
      headers: { get: () => null },
    })));

    getUserMedia = vi.fn(async () => rawStream);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  async function connected() {
    const hook = renderHook(() => useRealtimeTutor({}));
    await act(async () => {
      await hook.result.current.start({ topic: "animals", level: "beginner", minutes: 10 });
    });
    await act(async () => {
      deliver({ type: "session.created" });
      await Promise.resolve();
    });
    await waitFor(() => expect(hook.result.current.phase).toBe("listening"));
    return hook;
  }

  it("asks the browser for every noise switch it has", async () => {
    await connected();
    const constraints = getUserMedia.mock.calls[0][0].audio;
    expect(constraints.noiseSuppression).toBe(true);
    expect(constraints.echoCancellation).toBe(true);
    expect(constraints.autoGainControl).toBe(true);
    // Chrome 130+ ML voice isolation, best-effort: an `advanced` entry is ignored rather than
    // throwing on browsers that do not have it.
    expect(constraints.advanced).toContainEqual({ voiceIsolation: true });
    // ...and the room uses the shared helper rather than its own copy of the list.
    expect(constraints).toEqual(getAudioConstraints());
  });

  it("puts the RNNoise worklet in the chain", async () => {
    await connected();
    expect(applyNoiseSuppression).toHaveBeenCalledTimes(1);
  });

  it("does not let another surface's opt-out silence the tutor's noise suppression", async () => {
    await connected();
    // `getNoiseSuppressionPreference` reads `mockInterview.noiseSuppressionEnabled`. A
    // candidate turning it off during an interview must not decide how their tutor hears them,
    // and the tutor has no toggle of its own, so it is unconditional.
    expect(applyNoiseSuppression.mock.calls[0][1]).toEqual({ force: true });
  });

  it("sends the CLEANED track to OpenAI, not the raw microphone", async () => {
    await connected();
    // This is the whole fix. Before it, `addedTracks` held the raw mic.
    expect(addedTracks.map((t) => t.id)).toEqual(["rnnoise-out"]);
    expect(addedTracks.map((t) => t.id)).not.toContain("raw-mic");
  });

  it("releases the real microphone when the lesson ends", async () => {
    const hook = await connected();
    await act(async () => {
      await hook.result.current.end("learner");
    });
    // Stopping the worklet's OUTPUT track does not release the capture device, so the handle's
    // teardown - which stops the raw tracks behind it - has to run or the mic indicator stays
    // lit after the lesson.
    expect(teardown).toHaveBeenCalled();
  });

  it("still starts a lesson when RNNoise is unavailable", async () => {
    // No AudioWorklet, dead WASM fetch, browser too old: `applyNoiseSuppression` hands back the
    // input stream unchanged. Suppression is a quality enhancement, never a precondition.
    const rawStream = {
      getTracks: () => [rawTrack],
      getAudioTracks: () => [rawTrack],
      getVideoTracks: () => [],
    };
    applyNoiseSuppression.mockResolvedValue({
      outputStream: rawStream,
      teardown: () => undefined,
    });
    const hook = await connected();
    expect(hook.result.current.phase).toBe("listening");
    expect(addedTracks.map((t) => t.id)).toEqual(["raw-mic"]);
  });

  /**
   * The other direction, and the one that matters most.
   *
   * Removing false interruptions is only a fix if real ones survive. `input_audio_buffer.
   * speech_started` is the server's verdict that a human is talking; the room's job is to get
   * out of the way immediately when it arrives. RNNoise sits UPSTREAM of that verdict and
   * changes nothing about how the room reacts to it, which is what these assert.
   */
  it("a learner who genuinely starts speaking still cuts the tutor off", async () => {
    await connected();
    sent.length = 0;
    await act(async () => {
      deliver({ type: "input_audio_buffer.speech_started" });
      await Promise.resolve();
    });
    // Tell the server to stop generating audio...
    expect(sent.some((f) => f.type === "output_audio_buffer.clear")).toBe(true);
  });

  it("hands the floor over rather than finishing its sentence", async () => {
    const hook = await connected();
    await act(async () => {
      deliver({ type: "output_audio_buffer.started" });
      await Promise.resolve();
    });
    expect(hook.result.current.phase).toBe("speaking");
    await act(async () => {
      deliver({ type: "input_audio_buffer.speech_started" });
      await Promise.resolve();
    });
    // The room visibly yields the turn the moment the learner starts, mid-sentence or not.
    expect(hook.result.current.phase).toBe("student-speaking");
  });
});
