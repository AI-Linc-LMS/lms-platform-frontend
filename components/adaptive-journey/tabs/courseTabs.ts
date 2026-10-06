/**
 * Which sections a course page has, and what each one is called.
 *
 * The course is meant to be the one place a learner needs, so the page is organised the way
 * the product is: the journey, the tutor, the assessments, the interview, the jobs it leads
 * to, and the certificate at the end.
 *
 * A tab appears only when the course genuinely has that thing. A tenant without the voice
 * tutor gets no AI Tutor tab; a course with no configured interview gets no Mock Interview
 * tab; a course whose admin never switched certificates on gets no Certificate tab. An empty
 * tab is worse than a missing one - it promises a surface and then explains why it is blank.
 */

import type { JourneyBoard } from "@/lib/types/adaptive-journey";

export type CourseTabId =
  | "journey"
  | "tutor"
  | "assessments"
  | "interview"
  | "jobs"
  | "certificate";

export interface CourseTab {
  id: CourseTabId;
  label: string;
  icon: string;
  /** A small count or score beside the label, when there is a true one to show. */
  badge?: string;
}

/** Every paper on the course's spine, in order. The calibration is not one of them - it is the
 *  entry assessment and has its own card above the timeline. */
export function coursePapers(board: JourneyBoard) {
  return board.weeks.flatMap((w) =>
    w.nodes
      .filter((n) => (n.type === "checkpoint" || n.type === "week_final") && !n.isCalibration)
      .map((n) => ({ ...n, weekNo: w.weekNo })),
  );
}

export function courseTabs(board: JourneyBoard, tutorEnabled: boolean): CourseTab[] {
  const tabs: CourseTab[] = [
    { id: "journey", label: "Journey", icon: "mdi:target" },
  ];

  if (tutorEnabled) {
    tabs.push({ id: "tutor", label: "AI Tutor", icon: "mdi:robot-happy-outline" });
  }

  const papers = coursePapers(board);
  if (papers.length > 0) {
    const passed = papers.filter((p) => p.status === "done").length;
    tabs.push({
      id: "assessments",
      label: "Assessments",
      icon: "mdi:clipboard-text-outline",
      badge: `${passed}/${papers.length}`,
    });
  }

  // Labelled for what it IS. `board.interview.card` comes only from the node flagged
  // `is_calibration_interview` - the entry level-gauge that sizes a learner at the start -
  // and a course has no other interview today. Calling it "Mock Interview" implied a closing
  // round the course does not have.
  const card = board.interview?.card;
  if (card && card.configured && card.templateId != null) {
    tabs.push({ id: "interview", label: "Level Check", icon: "mdi:account-voice" });
  }

  // The jobs tab exists when the server actually has jobs to show. `openCount` is what
  // survived the course's role filter, so the badge is the number of roles this tab is
  // talking about - not the number the tenant happens to hold.
  const career = board.career;
  if (career && (career.openCount > 0 || career.related.length > 0)) {
    tabs.push({
      id: "jobs",
      label: "Jobs & Resume",
      icon: "mdi:briefcase-outline",
      badge: String(career.openCount + career.related.length),
    });
  }

  if (board.course.certificateEnabled) {
    tabs.push({ id: "certificate", label: "Certificate", icon: "mdi:trophy-outline" });
  }

  return tabs;
}

/** The tab to open, from the URL, falling back to the journey. A stale or unknown `?tab=`
 *  must not leave the page blank. */
export function resolveTab(requested: string | null, tabs: CourseTab[]): CourseTabId {
  const match = tabs.find((t) => t.id === requested);
  return match?.id ?? "journey";
}

/** The average of the papers this learner has actually finished, or null when none are.
 *  An average over zero papers is not 0% - there is simply nothing to average. */
export function averageScore(board: JourneyBoard): number | null {
  const done = coursePapers(board).filter((p) => p.status === "done" && p.score.total > 0);
  if (done.length === 0) return null;
  const sum = done.reduce((acc, p) => acc + (p.score.earned / p.score.total) * 100, 0);
  return Math.round(sum / done.length);
}
