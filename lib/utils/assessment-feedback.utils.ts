import type { AssessmentResult } from "@/lib/services/assessment.service";

const GENERIC_MESSAGE = /^(stats?\s+fetched|success)/i;

/**
 * Feedback bullets for the result page and PDF — uses API `feedback_points` when
 * present, otherwise derives concise guidance from scores and pacing.
 */
export function buildAssessmentFeedbackPoints(
  data: AssessmentResult,
): string[] {
  const fromApi = data?.feedback_points?.map((s) => s.trim()).filter(Boolean);
  if (fromApi && fromApi.length > 0) {
    return fromApi.slice(0, 6);
  }

  const stats = data?.stats || {};
  const points: string[] = [];
  const acc = stats?.accuracy_percent || 0;
  const pr = stats?.placement_readiness || 0;
  const un = (stats?.total_questions || 0) - (stats?.attempted_questions || 0);
  const pctTime = stats?.percentage_time_taken || 0;

  if (Number.isFinite(acc)) {
    if (acc >= 75) {
      points.push(
        "Strong accuracy on attempted questions — keep reinforcing these strengths.",
      );
    } else if (acc >= 50) {
      points.push(
        "Solid performance with room to improve consistency across topics.",
      );
    } else {
      points.push(
        "Focus on core concepts and review incorrect answers to lift accuracy.",
      );
    }
  }

  if (un > 0) {
    points.push(
      `You left ${un} question(s) unattempted — try pacing so you can attempt every item when possible.`,
    );
  }

  if (Number.isFinite(pctTime) && pctTime >= 95) {
    points.push(
      "Time usage was high relative to the limit — practice skimming and flagging hard items for review.",
    );
  } else if (
    Number.isFinite(pctTime) &&
    pctTime < 40 &&
    (stats?.attempted_questions || 0) >= (stats?.total_questions || 0)
  ) {
    points.push(
      "You finished with time to spare — use extra minutes to double-check tricky questions next time.",
    );
  }

  const msg = data?.message?.trim();
  if (msg && msg.length > 12 && !GENERIC_MESSAGE.test(msg)) {
    points.unshift(msg);
  }

  return points.slice(0, 6);
}
