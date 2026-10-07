/**
 * What each leg of a module's triad says.
 *
 * A module is three things - lessons, the tutor, the assessment - and this decides the words
 * for each. The rule it exists to enforce: **a leg never states a number it does not have**.
 * "0 of 0 lessons" and "0 min with the tutor" both describe a learner who has failed at
 * something, when the truth is that nothing has happened yet, so those become "Not started"
 * and "Session ready".
 */

import type { JourneyNodeView } from "@/lib/types/adaptive-journey";
import type { TriadState } from "./TriadTile";

/** What a leg IS, independent of what it is called on screen. */
export type TriadKind = "lessons" | "assessment";

export interface TriadLeg {
  /**
   * Routing and identity key, separate from `label`.
   *
   * The assessment leg's label is now the paper's own name ("WEEK 2 CHECK"), and the click
   * handler used to be looked up by display string - which would have stopped matching the
   * moment that string changed, leaving a tile that silently no longer navigates.
   */
  kind: TriadKind;
  /** The position in the module's sequence - 1, 2 - or ABSENT for a leg that is not a step. */
  step?: number;
  label: string;
  value: string;
  state: TriadState;
  icon: string;
  /** A short tag beside the label, e.g. OPTIONAL. */
  tag?: string;
}

/** Lessons: the articles, videos, quizzes and coding sets inside the module. */
export function lessonsLeg(node: JourneyNodeView): TriadLeg {
  const total = node.itemCount ?? 0;
  const done = node.status === "done";
  // The board counts a module as one step, not per item, so the only honest "done" count is
  // all-or-nothing. Claiming "3 of 5" from a progress number the board does not carry would be
  // a fabrication dressed as precision.
  const value = total === 0
    ? done ? "Completed" : "No lessons yet"
    : done ? `${total} of ${total}` : `${total} ${total === 1 ? "lesson" : "lessons"}`;
  return {
    kind: "lessons",
    step: 1,
    label: "LESSONS",
    value,
    state: done ? "done" : node.status === "locked" ? "locked" : node.status === "current" ? "active" : "ready",
    icon: "mdi:book-open-page-variant",
  };
}


/**
 * The module's assessment. Fed the paper that covers this module's WEEK, if there is one.
 *
 * A week usually holds several modules and exactly one paper, so the same paper is the answer
 * for every module in that week. The paper keeps its own station on the rail; this tile states
 * its status from inside the module, so a learner never reads "no assessment" on a module whose
 * week has one.
 */
/**
 * The paper's own name, upper-cased - "WEEK 2 CHECK", not "ASSESSMENT".
 *
 * Reported: "The assessment are built week wise but they are being shown topic wise, for
 * example in week 2, 2 topics are there and both have the same assessment so if a student
 * completes the content of arrays and try to take the assessment, he will face questions from
 * strings also which will create discrepancy."
 *
 * The paper really is one per WEEK, and most weeks hold two or three modules, so the same
 * paper IS the honest answer on each of their cards - that part was a deliberate fix for
 * modules that used to read "None for this module". What was wrong was calling it
 * "ASSESSMENT" there, which reads as *this topic's* assessment and sets a learner up to be
 * surprised by the other topic's questions.
 *
 * Naming it is the fix: a leg that says WEEK 2 CHECK on the Arrays card is telling the truth
 * about what it covers. Falls back to "ASSESSMENT" when a paper has no title of its own.
 */
function paperLabel(checkpoint: JourneyNodeView | null): string {
  const t = (checkpoint?.title || "").trim();
  return t ? t.toUpperCase() : "ASSESSMENT";
}

export function assessmentLeg(
  module: JourneyNodeView,
  checkpoint: JourneyNodeView | null,
): TriadLeg {
  if (!checkpoint) {
    return {
      kind: "assessment",
      step: 2,
      label: paperLabel(checkpoint),
      // Says the course has none here, without asserting a scope. It used to read "None for
      // this module", which was wrong twice over: the paper is a week-level thing, and the
      // rule that fed this only recognised `checkpoint`, so every `week_final` course showed
      // it on every module with the week's paper sitting directly below.
      value: "No assessment",
      state: "locked",
      icon: "mdi:clipboard-text-outline",
    };
  }
  if (checkpoint.status === "done") {
    const { earned, total } = checkpoint.score;
    // Only a real percentage. A paper worth 0 cannot be scored, and 0/0 is not 0%.
    const pct = total > 0 ? Math.round((earned / total) * 100) : null;
    return {
      kind: "assessment",
      step: 2,
      label: paperLabel(checkpoint),
      value: pct == null ? "Submitted" : `Scored ${pct}%`,
      state: "done",
      icon: "mdi:clipboard-text-outline",
    };
  }
  if (checkpoint.status === "locked") {
    return {
      kind: "assessment",
      step: 2,
      label: paperLabel(checkpoint),
      // No promise about WHEN. This used to say "Opens shortly" on a module the learner had
      // finished, but the paper covers the whole week - finishing one of its three modules
      // does not mean it is about to open. The paper's own card carries the server's
      // `lockReason`, which is the authority on why.
      value: "After all lessons",
      state: "locked",
      icon: "mdi:clipboard-text-outline",
    };
  }
  return {
    kind: "assessment",
    step: 2,
    label: paperLabel(checkpoint),
    value: checkpoint.questionCount > 0 ? `${checkpoint.questionCount} questions` : "Ready",
    state: checkpoint.status === "current" ? "active" : "ready",
    icon: "mdi:clipboard-text-outline",
  };
}

/**
 * A module's two legs: its lessons and its assessment.
 *
 * The tutor is NOT one of them. It had a tile here - numbered at first, then unnumbered and
 * tagged OPTIONAL - and the tile was redundant either way: the card already carries a
 * "Learn with AI Tutor" pill, which is the way in. Two controls for one thing, one of them
 * sitting in a row of steps, is what kept making an optional help look like work.
 *
 * `tutorEnabled` is kept in the signature because callers pass it and the tenant check still
 * belongs to them; it simply no longer changes what this returns.
 */
export function moduleTriad(
  node: JourneyNodeView,
  checkpoint: JourneyNodeView | null,
  _tutorEnabled?: boolean,
): TriadLeg[] {
  return [lessonsLeg(node), assessmentLeg(node, checkpoint)]
    .filter((l): l is TriadLeg => l !== null);
}
