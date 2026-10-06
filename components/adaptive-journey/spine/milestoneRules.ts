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

  // NO interview milestone. `board.interview.card` is NOT the course's closing interview - it
  // is the ENTRY calibration gauge. The server builds it from the node flagged
  // `is_calibration_interview` and nothing else (adaptive_journey/journey/board.py:211-212),
  // and withholds that node from the weeks precisely because it is an entry gauge with its own
  // top card above the timeline.
  //
  // Putting it at the END of the spine said the opposite of the truth twice over: it presented
  // the thing you do FIRST as the thing you finish with, and because the card reports that
  // gauge's own completion, a learner who had sat the entry interview saw the course's "final"
  // interview already ticked. Reported on Impacteers, where the superadmin had sat it.
  //
  // Mid-course interview ROUNDS are a separate piece of work. When they exist they will be
  // real `JourneyNode(type="interview")` steps on the spine, each with its own template, and
  // they will appear in the weeks like any other step - not here.

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
