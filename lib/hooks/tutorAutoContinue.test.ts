import { describe, expect, it } from "vitest";

import {
  ANSWER_NUDGE_MAX,
  ANSWER_WAIT_MS,
  AUTO_CONTINUE_MAX,
  AUTO_CONTINUE_MS,
  continuationDirective,
  decideContinuation,
  endsWithQuestion,
  languagePinDirective,
  nudgeDirective,
  waitFor,
  type ContinuationWorld,
} from "./tutorTurnTaking";

/**
 * "Sometimes the AI Tutor stops speaking after completing a concept" -- the learner has to say
 * "proceed" to restart it.
 *
 * The session config sets `create_response` on `audio.input.turn_detection`, so the server mints
 * a response when the LEARNER stops speaking and at no other time. Django holds no socket
 * (zero `response.create` anywhere in ai_tutor/), and on the client `response.create` has a
 * small, known set of callers: a tool result, an injected message, the 90-second idle button,
 * session start, and this continuation.
 *
 * So when the model ends a turn with no tool outstanding, nothing will ever ask it for another
 * one. The learner says "proceed" purely to manufacture a trigger. PR #761 tried to fix this by
 * rewriting the prompt to say "never wait to be told to continue" -- an instruction the model
 * cannot obey, because after `response.done` it has no way to speak. The protocol is
 * deterministic and the prompt is probabilistic; the protocol wins.
 *
 * THAT LESSON CUTS BOTH WAYS, which is what this file now also pins. The same protocol overrode
 * the persona in the other direction: the instructions say "Stop and wait only when you have
 * asked a question you actually need answered" (ai_tutor/services/prompts.py), the model DID
 * stop and wait, and seven seconds later this timer spoke for it.
 *
 * Measured on prod before this was written: 314 runs of two-or-more consecutive tutor turns
 * with no learner turn between them, across 95 of the 118 sessions that have a transcript, and
 * accounting for 816 of the 1,237 turns the tutor has ever taken. Among the runs whose first
 * turn is substantive, 35.7% begin with a question the tutor then answered itself. The gap
 * between those turns has a sharp mode at 8-11s -- the 7s timer plus generation latency.
 *
 * These tests run the REAL decision function. The previous version of this file re-implemented
 * it inline, which meant it could not fail when the hook changed -- and it did not.
 */

const fresh = (over: Partial<ContinuationWorld> = {}): ContinuationWorld => ({
  closed: false,
  quizOpen: false,
  responseActive: false,
  responseQueued: false,
  lastLearnerVoiceAt: 0,
  count: 0,
  askedQuestion: false,
  nudges: 0,
  ...over,
});

const AT = 1_000;
/** The moment the SHORT (deadlock) wait has elapsed. */
const LATER = AT + AUTO_CONTINUE_MS;
/** The moment the LONG (unanswered question) wait has elapsed. */
const MUCH_LATER = AT + ANSWER_WAIT_MS;

describe("the tutor picks its own lesson back up", () => {
  it("continues after a turn that ends in silence", () => {
    expect(decideContinuation(fresh(), AT, LATER)).toBe("continue");
  });

  it("does not continue before the pause has elapsed", () => {
    expect(decideContinuation(fresh(), AT, AT + 3_000)).toBe("silence");
  });
});

describe("it stays quiet where silence is correct", () => {
  it("never talks over a quiz the learner is reading", () => {
    // show_quiz literally instructs "Say one short line and then go quiet, they are reading."
    expect(decideContinuation(fresh({ quizOpen: true }), AT, LATER)).toBe("silence");
  });

  it("does not continue once the session is closing", () => {
    expect(decideContinuation(fresh({ closed: true }), AT, LATER)).toBe("silence");
  });

  it("does not stack a turn on one already active", () => {
    expect(decideContinuation(fresh({ responseActive: true }), AT, LATER)).toBe("silence");
  });

  it("does not stack a turn on one already queued", () => {
    expect(decideContinuation(fresh({ responseQueued: true }), AT, LATER)).toBe("silence");
  });

  it("yields when the learner spoke while it was waiting", () => {
    const w = fresh({ lastLearnerVoiceAt: AT + 2_000, count: 1 });
    expect(decideContinuation(w, AT, LATER)).toBe("silence");
    // the learner is driving, so the streak resets
    expect(w.count).toBe(0);
  });
});

describe("it can never monologue", () => {
  it("stops after the cap", () => {
    const w = fresh();
    expect(decideContinuation(w, AT, LATER)).toBe("continue");
    expect(decideContinuation(w, AT, LATER)).toBe("continue");
    expect(w.count).toBe(AUTO_CONTINUE_MAX);
    expect(decideContinuation(w, AT, LATER)).toBe("silence"); // capped
  });

  it("earns its budget back when the learner speaks", () => {
    const w = fresh({ count: AUTO_CONTINUE_MAX });
    // A learner utterance resets the streak (the hook does this on speech_started).
    w.count = 0;
    expect(decideContinuation(w, AT, LATER)).toBe("continue");
  });

  it("a silent lesson cannot exceed the cap however long it runs", () => {
    const w = fresh();
    let spoke = 0;
    for (let i = 0; i < 50; i++) if (decideContinuation(w, AT, LATER) !== "silence") spoke++;
    expect(spoke).toBe(AUTO_CONTINUE_MAX);
  });
});

/**
 * Report 34: "The AI Tutor asks a question and immediately continues speaking without giving
 * the student enough time to respond."
 *
 * The reported transcript is prod session e103f56e-23d5-4599-a46c-1e0e03149604, and the real
 * turn offsets are these, with NO learner turn anywhere between them:
 *
 *   [03:30] "...Now, can you say one common pet you might have or see often?"
 *   [03:39] +8.9s  "Great, pets are first. ... Which one do you see more?"
 *   [03:49] +10.5s "Nice. If you see a cat a lot ... is that mostly true...?"
 *
 * Note "Great" and "Nice": the tutor is acknowledging answers the learner never gave. The same
 * session records two TutorQuizAttempt rows as correct for a learner who, in the transcript,
 * said nothing at those moments.
 *
 * Every test below fails against the old single-timer, single-outcome continuation.
 */
describe("a question the learner has not answered", () => {
  it("waits far longer than a turn that asked nothing", () => {
    expect(waitFor({ askedQuestion: true })).toBe(ANSWER_WAIT_MS);
    expect(waitFor({ askedQuestion: false })).toBe(AUTO_CONTINUE_MS);
    expect(ANSWER_WAIT_MS).toBeGreaterThan(AUTO_CONTINUE_MS);
  });

  it("is still silent at the point the old timer would have spoken", () => {
    // 3:30 -> 3:39 in the reported session. This is the exact regression.
    expect(decideContinuation(fresh({ askedQuestion: true }), AT, LATER)).toBe("silence");
  });

  it("never answers itself or moves on -- it checks in", () => {
    expect(decideContinuation(fresh({ askedQuestion: true }), AT, MUCH_LATER)).toBe("nudge");
  });

  it("checks in once and then hands the learner the floor", () => {
    const w = fresh({ askedQuestion: true });
    expect(decideContinuation(w, AT, MUCH_LATER)).toBe("nudge");
    expect(w.nudges).toBe(ANSWER_NUDGE_MAX);
    expect(decideContinuation(w, AT, MUCH_LATER)).toBe("silence");
  });

  it("cannot produce the reported transcript however long nobody speaks", () => {
    const w = fresh({ askedQuestion: true });
    const actions: string[] = [];
    for (let i = 0; i < 50; i++) actions.push(decideContinuation(w, AT, MUCH_LATER));
    // One check-in, then silence. Never two self-answered questions in a row.
    expect(actions.filter((a) => a === "nudge")).toHaveLength(1);
    expect(actions.filter((a) => a === "continue")).toHaveLength(0);
  });

  it("gives a fresh check-in budget once the learner answers", () => {
    const w = fresh({ askedQuestion: true, nudges: ANSWER_NUDGE_MAX });
    expect(decideContinuation(w, AT, MUCH_LATER)).toBe("silence");
    // speech_started resets it in the hook.
    w.nudges = 0;
    expect(decideContinuation(w, AT, MUCH_LATER)).toBe("nudge");
  });

  it("stands down entirely if the learner answers during the long wait", () => {
    // The real learner in that session took 32s and then 45s to answer. Waiting and then
    // going quiet is what lets those answers land at all.
    const w = fresh({ askedQuestion: true, lastLearnerVoiceAt: AT + 5_000 });
    expect(decideContinuation(w, AT, MUCH_LATER)).toBe("silence");
    expect(w.nudges).toBe(0);
  });
});

describe("what counts as a question", () => {
  it("sees the questions from the reported transcript", () => {
    expect(endsWithQuestion("Now, can you say one common pet you might have or see often?")).toBe(
      true
    );
    expect(endsWithQuestion("A common pet is a cat or a dog. Which one do you see more?")).toBe(
      true
    );
  });

  it("sees a question asked in Hindi", () => {
    // Devanagari ends a statement with the danda and a question with "?", so the same marker
    // works for the sessions that actually reported this.
    expect(endsWithQuestion("तो बताइए, आपके घर में कौन सा पालतू जानवर है?")).toBe(true);
    expect(endsWithQuestion("यह एक बिल्ली है।")).toBe(false);
  });

  it("is not fooled by trailing punctuation a transcript leaves behind", () => {
    expect(endsWithQuestion('He asked, "which one do you see more?"')).toBe(true);
    expect(endsWithQuestion("Which one do you see more?  ")).toBe(true);
  });

  it("treats a statement as a statement, so the deadlock fix still works", () => {
    expect(endsWithQuestion("Great, pets are first. A common pet is a cat or a dog.")).toBe(false);
    expect(endsWithQuestion("")).toBe(false);
    // A question in the MIDDLE is the persona's own teaching move -- it answers those itself,
    // and treating them as waits would reintroduce the deadlock.
    expect(endsWithQuestion("So what happens next? The water rises, and the plant drinks it.")).toBe(
      false
    );
  });
});

/**
 * Report 32: "The AI Tutor repeatedly explains the same concepts and information instead of
 * progressing through the lesson."
 *
 * The continuation used to send a BARE `response.create`. A model handed the floor with no
 * brief, having just asked a question nobody answered, restates the explanation and asks again.
 *
 * Worth knowing how this shows up in the data: only 3% of adjacent tutor-turn pairs are
 * near-duplicates by string similarity, because the model usually PARAPHRASES rather than
 * repeats. "Awesome, a lion! Lions are wild animals, and they live in places like grasslands
 * and savannas" followed 9.4s later by "A lion is a wild animal that lives in grasslands and
 * savannas" is the real shape. So the directive is the fix, and its content is what to pin.
 */
describe("a regenerated turn is told what it is for", () => {
  it("tells a continuation to move on and not repeat", () => {
    const d = continuationDirective("");
    expect(d).toMatch(/forward/i);
    expect(d).toMatch(/do not repeat/i);
    expect(d).toMatch(/already covered/i);
  });

  it("tells a check-in not to answer its own question", () => {
    const d = nudgeDirective("");
    expect(d).toMatch(/not answer it yourself/i);
    expect(d).toMatch(/waiting for their answer|give them the floor/i);
    expect(d).toMatch(/one short sentence/i);
  });
});

/**
 * Report 33: "Even after the student explicitly asks the AI Tutor to communicate in Hindi, the
 * tutor unexpectedly switches back to English during the session."
 *
 * The session's `instructions` are pinned at mint and never updated -- there is no
 * `session.update` anywhere in the hook -- so "speak whatever language the learner speaks" is
 * re-decided per response from conversation history alone, against an all-English instruction
 * block.
 *
 * The prod measurement moved where the blame sits, and this file records the corrected version.
 * Of the 32 sessions that lose Hindi mid-lesson, the FIRST loss follows a learner turn in 26 of
 * them (81%) and a self-continuation in only 6. In the reported session the learner says
 * "ठीक है।" in Hindi and the tutor answers in English 1.5 seconds later. The continuation is an
 * amplifier -- it accounts for half of all subsequent drift transitions -- not the trigger.
 *
 * That is why the language is pinned into the conversation as a standing property AND carried
 * on every regenerated turn. Either one alone leaves half the drift in place.
 */
describe("the language survives a regenerated response", () => {
  it("carries the lesson language on a continuation", () => {
    expect(continuationDirective("Hindi")).toMatch(/Continue in Hindi/);
    expect(continuationDirective("Hindi")).toMatch(/do not switch to English/i);
  });

  it("carries the lesson language on a check-in", () => {
    expect(nudgeDirective("Hindi")).toMatch(/Continue in Hindi/);
  });

  it("still says something sensible before any language is established", () => {
    // "" means nobody has said, which is NOT English -- the same distinction the backend's
    // ai_tutor/services/language.py draws.
    expect(continuationDirective("")).toMatch(/language you have been speaking/i);
  });

  it("pins the language as a standing session property, not a per-turn guess", () => {
    const pin = languagePinDirective("Hindi");
    expect(pin).toMatch(/rest of this session/i);
    expect(pin).toMatch(/unless the learner explicitly asks/i);
    // The reported transcript has "yes, we will speak Hindi" three times. The pin must not
    // become a fourth.
    expect(pin).toMatch(/Do not announce this setting/i);
  });

  it("covers the turn that actually drifts: the one announcing a tool", () => {
    // 20 of the 32 drift sessions lose the language on a tool-announcing turn -- "I'll show a
    // quick diagram on animal sounds", "here's a visual reference for paper making". Tool
    // arguments are generated against all-English tool descriptions and the speech around them
    // follows, so the pin has to name that case explicitly.
    const pin = languagePinDirective("Hindi");
    expect(pin).toMatch(/tool|diagram|slide|show|picture/i);
  });
});
