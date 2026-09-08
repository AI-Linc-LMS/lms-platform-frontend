import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

/**
 * "Sometimes the AI Tutor stops speaking after completing a concept" -- the learner has to say
 * "proceed" to restart it.
 *
 * The session config sets `create_response` on `audio.input.turn_detection`, so the server mints
 * a response when the LEARNER stops speaking and at no other time. Django holds no socket
 * (zero `response.create` anywhere in ai_tutor/), and on the client `response.create` has exactly
 * four callers: a tool result, an injected message, the 90-second idle button, and session start.
 *
 * So when the model ends a turn with no tool outstanding, nothing will ever ask it for another
 * one. The learner says "proceed" purely to manufacture a trigger. PR #761 tried to fix this by
 * rewriting the prompt to say "never wait to be told to continue" -- an instruction the model
 * cannot obey, because after `response.done` it has no way to speak. The protocol is
 * deterministic and the prompt is probabilistic; the protocol wins.
 *
 * These tests pin the DECISION LOGIC of the continuation, extracted in the same shape as the
 * hook, because the guards are the whole design: every one of them is a case where silence is
 * correct and continuing would be worse than the deadlock.
 */

const AUTO_CONTINUE_MS = 7_000;
const AUTO_CONTINUE_MAX = 2;

interface World {
  closed: boolean;
  quizOpen: boolean;
  responseActive: boolean;
  responseQueued: boolean;
  lastVoiceAt: number;
  count: number;
}

const fresh = (over: Partial<World> = {}): World => ({
  closed: false,
  quizOpen: false,
  responseActive: false,
  responseQueued: false,
  lastVoiceAt: 0,
  count: 0,
  ...over,
});

/** Mirrors scheduleAutoContinue: returns whether a turn was actually requested. */
function runContinuation(w: World, armedAt: number, now: number): boolean {
  if (w.closed) return false;
  if (w.quizOpen) return false;
  if (w.count >= AUTO_CONTINUE_MAX) return false;
  // ...timer fires at armedAt + AUTO_CONTINUE_MS...
  if (now < armedAt + AUTO_CONTINUE_MS) return false;
  if (w.closed || w.quizOpen) return false;
  if (w.responseActive || w.responseQueued) return false;
  if (w.lastVoiceAt > armedAt) {
    w.count = 0;
    return false;
  }
  w.count += 1;
  return true;
}

const AT = 1_000;
const LATER = AT + AUTO_CONTINUE_MS;

describe("the tutor picks its own lesson back up", () => {
  it("continues after a turn that ends in silence", () => {
    expect(runContinuation(fresh(), AT, LATER)).toBe(true);
  });

  it("does not continue before the pause has elapsed", () => {
    expect(runContinuation(fresh(), AT, AT + 3_000)).toBe(false);
  });
});

describe("it stays quiet where silence is correct", () => {
  it("never talks over a quiz the learner is reading", () => {
    // show_quiz literally instructs "Say one short line and then go quiet, they are reading."
    expect(runContinuation(fresh({ quizOpen: true }), AT, LATER)).toBe(false);
  });

  it("does not continue once the session is closing", () => {
    expect(runContinuation(fresh({ closed: true }), AT, LATER)).toBe(false);
  });

  it("does not stack a turn on one already active", () => {
    expect(runContinuation(fresh({ responseActive: true }), AT, LATER)).toBe(false);
  });

  it("does not stack a turn on one already queued", () => {
    expect(runContinuation(fresh({ responseQueued: true }), AT, LATER)).toBe(false);
  });

  it("yields when the learner spoke while it was waiting", () => {
    const w = fresh({ lastVoiceAt: AT + 2_000, count: 1 });
    expect(runContinuation(w, AT, LATER)).toBe(false);
    expect(w.count).toBe(0, "the learner is driving, so the streak resets");
  });
});

describe("it can never monologue", () => {
  it("stops after the cap", () => {
    const w = fresh();
    expect(runContinuation(w, AT, LATER)).toBe(true);
    expect(runContinuation(w, AT, LATER)).toBe(true);
    expect(w.count).toBe(AUTO_CONTINUE_MAX);
    expect(runContinuation(w, AT, LATER)).toBe(false, "capped");
  });

  it("earns its budget back when the learner speaks", () => {
    const w = fresh({ count: AUTO_CONTINUE_MAX });
    // A learner utterance resets the streak (the hook does this on speech_started).
    w.count = 0;
    expect(runContinuation(w, AT, LATER)).toBe(true);
  });

  it("a silent lesson cannot exceed the cap however long it runs", () => {
    const w = fresh();
    let spoke = 0;
    for (let i = 0; i < 50; i++) if (runContinuation(w, AT, LATER)) spoke++;
    expect(spoke).toBe(AUTO_CONTINUE_MAX);
  });
});
