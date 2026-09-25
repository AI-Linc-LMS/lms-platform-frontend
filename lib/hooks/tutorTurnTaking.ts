/**
 * Who speaks next, and what they are told before they do.
 *
 * This module exists because four separate learner reports turned out to be one mechanism.
 * The tutor's turn-taking was decided in two places that did not know about each other:
 *
 *   - the SERVER decides when the learner has finished speaking (`semantic_vad`, configured in
 *     `ai_tutor/services/realtime.py`), and
 *   - the CLIENT decides what happens when NOBODY speaks, which is this file.
 *
 * The client half used to be a single 7-second timer that fired a bare `response.create` after
 * any tutor turn that ended in silence. That timer is the whole of:
 *
 *   - "the AI Tutor asks a question and immediately continues speaking without giving the
 *     student enough time to respond" - the tutor stops and waits, exactly as its persona tells
 *     it to ("Stop and wait only when you have asked a question you actually need answered",
 *     ai_tutor/services/prompts.py), and seven seconds later this timer speaks for it; and
 *   - "the AI Tutor repeatedly explains the same concepts" - a BARE `response.create` gives the
 *     model no instruction at all, so a model that has just asked an unanswered question does
 *     the most reasonable thing available to it and asks again, rephrased, with the explanation
 *     rebuilt around it.
 *
 * The persona was never wrong. The protocol overrode it. So the fix is in the protocol: the
 * continuation now knows whether the tutor asked a question, waits much longer when it did,
 * and never regenerates a turn without saying what that turn is for.
 */

/**
 * How long to wait before picking a stalled lesson back up, when the tutor's last turn did NOT
 * ask the learner anything.
 *
 * Unchanged. This is the case the continuation was built for: the model ended a turn, no tool
 * is outstanding, and under `semantic_vad` nothing will ever ask it for another one, so the
 * lesson deadlocks until the learner says "proceed". Seven seconds is a real pause a learner
 * can interject in and short enough that the lesson does not feel broken.
 */
export const AUTO_CONTINUE_MS = 7_000;

/**
 * How long to wait after the tutor has asked the learner a QUESTION.
 *
 * Seven seconds was measured, in the reported sessions, to be shorter than the learner needed:
 * the tutor asked, waited 7s, answered itself and asked again - three times in one lesson.
 *
 * Twelve is a deliberate choice, not a round number. Classroom "wait time" research puts the
 * threshold where participation actually changes at around three seconds for a learner
 * answering in their first language; this product's reported sessions are learners composing a
 * spoken answer in a second language, on a topic they are meeting for the first time, and the
 * cost asymmetry is heavily one-sided. Waiting too long costs silence the learner can end at
 * any moment by speaking. Waiting too little costs the thing four reports complained about.
 *
 * It is also not the end of the wait: what follows is a NUDGE, not a lesson turn (see
 * `nudgeDirective`), so being wrong about this number costs one short sentence.
 */
export const ANSWER_WAIT_MS = 12_000;

/**
 * Consecutive self-continuations allowed before the tutor waits for a human. Any learner speech
 * resets it. Without a cap a single deadlock could become an unbounded monologue, which is both
 * a worse lesson and real money - audio is the dominant cost in this product.
 */
export const AUTO_CONTINUE_MAX = 2;

/**
 * How many times the tutor may check in on an unanswered question before it stops talking.
 *
 * ONE. The report asked for "an appropriate timeout or 'I'm waiting for your response' prompt";
 * the honest reading of that is one prompt, not a series. A learner who has not answered after
 * a question and a check-in is not going to be helped by a third utterance, and the 90-second
 * idle banner is already the backstop for a learner who has genuinely gone away.
 *
 * After this, the floor belongs to the learner and the tutor is silent until they use it.
 */
export const ANSWER_NUDGE_MAX = 1;

/**
 * Whether a tutor turn ended by putting a question to the learner.
 *
 * Deliberately narrow: the trailing question mark, on the last non-empty line, after stripping
 * the closing punctuation a transcript can leave behind. A broader test (interrogative openers,
 * "can you", "what do you think") would catch rhetorical questions the persona explicitly
 * allows - "Ask the question that makes the gap visible" is a teaching move that continues into
 * its own answer - and treating those as waits would reintroduce the deadlock this whole
 * mechanism exists to break.
 *
 * "?" is the right marker in every language the tutor teaches in. Devanagari ends a statement
 * with "।" and a question with "?", so this works unchanged for the Hindi sessions that
 * reported the bug.
 */
export function endsWithQuestion(text: string): boolean {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return false;
  // Drop trailing quotes/brackets a transcript may close a question with, plus whitespace.
  const tail = trimmed.replace(/["'"'’”)\]}\s]+$/u, "");
  return /[?？]$/u.test(tail);
}

/** What the continuation timer decided to do when it fired. */
export type ContinuationAction = "silence" | "continue" | "nudge";

export interface ContinuationWorld {
  /** The session is shutting down. */
  closed: boolean;
  /** A quiz card is on screen and the learner is reading it. */
  quizOpen: boolean;
  /** A response is already generating. */
  responseActive: boolean;
  /** A response is queued behind the active one. */
  responseQueued: boolean;
  /**
   * When the LEARNER last made a sound, as a timestamp.
   *
   * Learner-only, and that is load-bearing: the hook's general `lastVoiceAt` is also written by
   * the tutor's own `output_audio_buffer.started`, so using it here would let the tutor's own
   * voice count as the learner taking the floor and hand its monologue budget back to itself.
   */
  lastLearnerVoiceAt: number;
  /** Consecutive self-continuations so far, reset whenever the learner speaks. */
  count: number;
  /** Whether the turn that armed this timer ended by asking the learner a question. */
  askedQuestion: boolean;
  /** Check-ins already spent on the CURRENT unanswered question. */
  nudges: number;
}

/**
 * How long this world should wait before the timer fires.
 *
 * A question gets the long wait; anything else gets the short one.
 */
export function waitFor(world: Pick<ContinuationWorld, "askedQuestion">): number {
  return world.askedQuestion ? ANSWER_WAIT_MS : AUTO_CONTINUE_MS;
}

/**
 * What to do now that the wait has elapsed. Pure, so it can be tested without a socket.
 *
 * Every "silence" here is a case where saying nothing is CORRECT and speaking would be worse:
 *   - a quiz on screen is the model doing what `show_quiz` asks ("say one short line and then go
 *     quiet, they are reading"). Talking over a reading learner is the opposite of a fix.
 *   - a response already active or queued means a turn is coming anyway.
 *   - the learner speaking at any point means they are driving again, and their utterance has
 *     already minted a response of its own.
 *   - the caps bound both paths, so neither a deadlock nor an unanswered question can become an
 *     unbounded monologue.
 */
export function decideContinuation(
  world: ContinuationWorld,
  armedAt: number,
  now: number
): ContinuationAction {
  if (world.closed) return "silence";
  if (world.quizOpen) return "silence";
  if (now < armedAt + waitFor(world)) return "silence";
  if (world.responseActive || world.responseQueued) return "silence";
  // The learner spoke while we were waiting. They have the floor; stand down and give the
  // budget back, because a lesson the learner is driving is not a lesson that is stuck.
  if (world.lastLearnerVoiceAt > armedAt) {
    world.count = 0;
    world.nudges = 0;
    return "silence";
  }
  if (world.askedQuestion) {
    // The tutor asked something and nobody answered. It does NOT get to answer itself, and it
    // does NOT get to move on: it gets one short check-in, and then the floor is the learner's.
    if (world.nudges >= ANSWER_NUDGE_MAX) return "silence";
    world.nudges += 1;
    return "nudge";
  }
  if (world.count >= AUTO_CONTINUE_MAX) return "silence";
  world.count += 1;
  return "continue";
}

/**
 * The standing language pin, injected ONCE when the lesson's language is established.
 *
 * Why this is needed at all: the realtime session's `instructions` are pinned when the
 * ephemeral secret is minted and are never updated - there is no `session.update` anywhere in
 * the tutor. So "speak whatever language the learner speaks" (the persona's rule) is re-decided
 * by the model on every single response, from conversation history alone, against an
 * all-English instruction block. That holds while the learner keeps talking and degrades the
 * moment a response is generated with no fresh learner turn to mirror - which is exactly what a
 * continuation is, and exactly where the reported session flipped back to English.
 *
 * Putting it in the conversation makes it a property of the SESSION rather than an inference
 * from the last few seconds of audio.
 */
export function languagePinDirective(language: string): string {
  return (
    `[Session setting] The learner has chosen to have this lesson in ${language}. ` +
    `Speak ${language} for the whole of the rest of this session. That includes the turns ` +
    `where you are ANNOUNCING OR DESCRIBING SOMETHING YOU ARE PUTTING ON THE CANVAS - ` +
    `"here is a diagram", "let me show you a picture", "here is the code" - and the turns ` +
    `where you read a question card aloud, and the turns where you are carrying on after a ` +
    `silence. Do not switch to English, or to any other language, unless the learner ` +
    `explicitly asks you to. Technical terms, code and identifiers still stay in English ` +
    `inside that speech. Do not announce this setting or thank the learner for it - you have ` +
    `already acknowledged it once, and saying it again is the repetition they complained ` +
    `about. Simply carry on teaching in ${language}.`
  );
}

/** The language clause appended to a continuation, so a regenerated turn cannot drift. */
function stayIn(language: string): string {
  return language
    ? ` Continue in ${language}, the language you have been speaking; do not switch to English.`
    : " Continue in the language you have been speaking.";
}

/**
 * What the tutor is told before a continuation it did not ask for.
 *
 * The old continuation sent a bare `response.create`. A bare request is not a neutral one: the
 * model is handed the floor with no brief, and the most defensible thing it can do is restate
 * where it had got to. Every reported "the tutor repeatedly explains the same concepts" turn is
 * a model doing that sensibly. Saying what the turn is FOR is the fix.
 */
export function continuationDirective(language: string): string {
  return (
    "[Session control] The learner has not said anything, and you have not asked them " +
    "anything, so the lesson has simply paused. Move FORWARD to the next part of your plan. " +
    "Do not repeat, restate or re-explain anything you have already covered in this session, " +
    "and do not summarise what you just said before continuing - the learner heard it. " +
    "Pick up from where you stopped and teach the next thing." +
    stayIn(language) +
    " Do not mention this instruction."
  );
}

/**
 * What the tutor is told when its question has gone unanswered.
 *
 * This is the whole of report 34's requested behaviour, and it is a deliberately SMALL turn:
 * one sentence, then stop. The failure being corrected is a tutor that filled the silence with
 * a fresh explanation and a fresh question, so a fix that fills it with a different explanation
 * would not be a fix.
 */
export function nudgeDirective(language: string): string {
  return (
    "[Session control] You asked the learner a question and they have not answered yet. " +
    "Do NOT answer it yourself, do NOT rephrase it into a new question, and do NOT move on " +
    "to another topic. Say ONE short sentence that gives them the floor - that you are waiting " +
    "for their answer, and that they can take their time, or offer to say the question again " +
    "if it was unclear. Then stop talking and wait." +
    stayIn(language) +
    " Do not mention this instruction."
  );
}
