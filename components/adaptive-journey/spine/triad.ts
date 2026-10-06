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
  step: number;
  label: string;
  value: string;
  state: TriadState;
  icon: string;
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
  if (t.state === "done") {
    const mins = t.minutes;
    return {
      step: 2,
      label: "AI TUTOR",
      // A session shorter than a minute rounds to 0; say it happened rather than "0 min".
      value: mins > 0
        ? `${mins} min session${t.sessions > 1 ? "s" : ""}`
        : `${t.sessions} session${t.sessions > 1 ? "s" : ""}`,
      state: "done",
      icon: "mdi:robot-happy-outline",
    };
  }
  return {
    step: 2,
    label: "AI TUTOR",
    value: t.state === "locked" ? "Unlocks with module" : "Session ready",
    state: t.state === "locked" ? "locked" : "ready",
    icon: "mdi:robot-happy-outline",
  };
}

/**
 * The module's assessment. Fed the checkpoint node that closes this module, if one exists -
 * the triad is drawn on the module, but the paper is its own step on the board.
 */
export function assessmentLeg(
  module: JourneyNodeView,
  checkpoint: JourneyNodeView | null,
): TriadLeg {
  if (!checkpoint) {
    return {
      step: 3,
      label: "ASSESSMENT",
      value: "None for this module",
      state: "locked",
      icon: "mdi:clipboard-text-outline",
    };
  }
  if (checkpoint.status === "done") {
    const { earned, total } = checkpoint.score;
    // Only a real percentage. A paper worth 0 cannot be scored, and 0/0 is not 0%.
    const pct = total > 0 ? Math.round((earned / total) * 100) : null;
    return {
      step: 3,
      label: "ASSESSMENT",
      value: pct == null ? "Submitted" : `Scored ${pct}%`,
      state: "done",
      icon: "mdi:clipboard-text-outline",
    };
  }
  if (checkpoint.status === "locked") {
    return {
      step: 3,
      label: "ASSESSMENT",
      // `lockReason` is the server's own words for why, and is what the locked card shows.
      value: module.status === "done" ? "Opens shortly" : "After all lessons",
      state: "locked",
      icon: "mdi:clipboard-text-outline",
    };
  }
  return {
    step: 3,
    label: "ASSESSMENT",
    value: checkpoint.questionCount > 0 ? `${checkpoint.questionCount} questions` : "Ready",
    state: checkpoint.status === "current" ? "active" : "ready",
    icon: "mdi:clipboard-text-outline",
  };
}

/** The checkpoint that closes a given module, or null. One paper per week by construction. */
export function checkpointForModule(
  weekNodes: JourneyNodeView[],
): JourneyNodeView | null {
  return weekNodes.find((n) => n.type === "checkpoint" || n.type === "week_final") ?? null;
}

export function moduleTriad(
  node: JourneyNodeView,
  checkpoint: JourneyNodeView | null,
  tutorEnabled: boolean,
): TriadLeg[] {
  return [lessonsLeg(node), tutorLegView(node, tutorEnabled), assessmentLeg(node, checkpoint)]
    .filter((l): l is TriadLeg => l !== null);
}
