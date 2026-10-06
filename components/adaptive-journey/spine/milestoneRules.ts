/**
 * What this course ends with.
 *
 * A course's terminal events - the mock interview and the certificate - were both real and
 * both missing from the journey. The interview was a card above the timeline, the certificate
 * a panel in the right-hand rail. Nothing on the page said what finishing leads to.
 *
 * This decides which of them this particular course actually has, so the spine shows a
 * destination the learner can really reach and nothing it cannot. A course with no interview
 * template and no certificate gets no milestones at all rather than two greyed-out promises.
 */

import type { JourneyBoard } from "@/lib/types/adaptive-journey";

export type MilestoneKind = "interview" | "certificate";

export interface Milestone {
  kind: MilestoneKind;
  /** Decoration ONLY - the marker's colour. See the note on the certificate below. */
  reached: boolean;
}

export function courseMilestones(board: JourneyBoard): Milestone[] {
  const out: Milestone[] = [];

  const card = board.interview?.card;
  // An interview already on the timeline is already in the journey; a second entry at the end
  // would be the same interview twice. And an unconfigured template is not a destination -
  // the top card is the surface that explains "your instructor is still setting this up".
  const interviewAlreadyAStep = board.weeks.some((w) =>
    w.nodes.some((n) => n.type === "interview"),
  );
  if (card && card.configured && card.templateId != null && !interviewAlreadyAStep) {
    out.push({ kind: "interview", reached: card.status === "done" });
  }

  if (board.course.certificateEnabled) {
    // `reached` here is NOT an entitlement check. Eligibility is the backend's answer and the
    // certificate card asks it - a percentage compared in the browser is precisely the bug
    // `useCertificateActions` documents having removed (a learner on 80% of a course whose
    // threshold had risen saw an enabled Download that then failed). This drives the colour of
    // a diamond. If it is briefly wrong, a diamond is the wrong colour; nothing unlocks.
    const completion = board.progressCard?.completionPct ?? 0;
    const threshold = board.course.certificateThreshold ?? 80;
    out.push({ kind: "certificate", reached: completion >= threshold });
  }

  return out;
}
