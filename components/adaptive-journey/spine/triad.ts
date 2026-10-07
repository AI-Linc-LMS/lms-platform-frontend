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

export interface TriadLeg {
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
    step: 1,
    label: "LESSONS",
    value,
    state: done ? "done" : node.status === "locked" ? "locked" : node.status === "current" ? "active" : "ready",
    icon: "mdi:book-open-page-variant",
  };
}

/** The AI Tutor on this module. Real connected minutes, or an offer. */
export function tutorLegView(node: JourneyNodeView, tutorEnabled: boolean): TriadLeg | null {
  const t = node.tutor;
  // Absent (an older board) or null (not a module) means there is nothing truthful to show.
  // A tenant without the tutor gets no tile at all rather than an advert.
  if (!t || !tutorEnabled) return null;
  // The tutor carries NO step number and never a tick.
  //
  // It used to be "2 · AI TUTOR" with a green check once used, which is the vocabulary of a
  // step to complete - a learner reads a numbered leg with a tick as work the course expects
  // of them. It is not. It is a help they may take or ignore, and a module is finished without
  // it. So: no number, an OPTIONAL tag, and minutes reported as a fact rather than as an
  // achievement.
  if (t.state === "done") {
    const mins = t.minutes;
    return {
      label: "AI TUTOR",
      tag: "OPTIONAL",
      // A session shorter than a minute rounds to 0; say it happened rather than "0 min".
      value: mins > 0
        ? `${mins} min session${t.sessions > 1 ? "s" : ""}`
        : `${t.sessions} session${t.sessions > 1 ? "s" : ""}`,
      // "ready", not "done": it stays an open offer however many times it has been used, and
      // `done` is what paints the green tick.
      state: "ready",
      icon: "mdi:robot-happy-outline",
    };
  }
  return {
    label: "AI TUTOR",
    tag: "OPTIONAL",
    // Not "Unlocks with module", which promises a gate the learner must clear. The tutor
    // teaches THIS module's material, so it is simply there once the module is.
    value: t.state === "locked" ? "Available with the module" : "Ask anything",
    state: t.state === "locked" ? "locked" : "ready",
    icon: "mdi:robot-happy-outline",
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
export function assessmentLeg(
  module: JourneyNodeView,
  checkpoint: JourneyNodeView | null,
): TriadLeg {
  if (!checkpoint) {
    return {
      step: 2,
      label: "ASSESSMENT",
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
      step: 2,
      label: "ASSESSMENT",
      value: pct == null ? "Submitted" : `Scored ${pct}%`,
      state: "done",
      icon: "mdi:clipboard-text-outline",
    };
  }
  if (checkpoint.status === "locked") {
    return {
      step: 2,
      label: "ASSESSMENT",
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
    step: 2,
    label: "ASSESSMENT",
    value: checkpoint.questionCount > 0 ? `${checkpoint.questionCount} questions` : "Ready",
    state: checkpoint.status === "current" ? "active" : "ready",
    icon: "mdi:clipboard-text-outline",
  };
}

export function moduleTriad(
  node: JourneyNodeView,
  checkpoint: JourneyNodeView | null,
  tutorEnabled: boolean,
): TriadLeg[] {
  return [lessonsLeg(node), tutorLegView(node, tutorEnabled), assessmentLeg(node, checkpoint)]
    .filter((l): l is TriadLeg => l !== null);
}
