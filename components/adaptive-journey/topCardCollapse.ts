/* ==========================================================================
 * Whether a header card on the adaptive course page opens with its full body showing.
 *
 * The two cards above Course Overview - Calibration Assessment and AI Mock Interviewer - are
 * each a ~310px block of explanation, chips and a button. On a learner who has already taken
 * both they explain something that is over, and together they pushed Course Overview, Week 1
 * and Your Progress off a 900px screen: the page opened on two finished tasks instead of the
 * course.
 *
 * So a card opens EXPANDED only when it still asks the learner for something, and that is read
 * from the board payload, never from a list of course ids:
 *
 *   - calibration: `status === "not_started"`, not still being generated, and an assessment
 *     slug exists - which is exactly the condition under which its button can be pressed.
 *   - interview:   `status === "not_started"`, `configured`, and a template id exists - again
 *     exactly the condition under which its button can be pressed.
 *
 * Everything else - done, `not_configured`, or generating - has nothing for the learner to do
 * right now, so it opens as a one-line row that still carries its status and its action.
 *
 * The learner's own choice wins over that default, per course and per card, for the session.
 * ======================================================================== */

import { currentUserId } from "@/lib/utils/current-user";
import type { JourneyBoard } from "@/lib/types/adaptive-journey";

export type TopCardKind = "calibration" | "interview";

/**
 * True when the calibration card's primary action is live and the test has never been taken.
 *
 * Mirrors `canStart` in the card itself on purpose: "there is something to do" and "the button
 * works" must not be able to drift apart, or a card would open expanded around a dead button.
 */
export function calibrationNeedsAction(calibration: JourneyBoard["calibration"]): boolean {
  const card = calibration?.card;
  if (!card) return false;
  return card.status === "not_started" && !card.generating && !!card.assessmentSlug;
}

/** True when the interview is configured for this course and the learner has never sat one. */
export function interviewNeedsAction(interview: JourneyBoard["interview"]): boolean {
  const card = interview?.card;
  if (!card) return false;
  return card.status === "not_started" && card.configured && card.templateId != null;
}

/**
 * Per learner, per course, per card. The learner id comes from the access token's `user_id`
 * claim, so two accounts sharing a browser never inherit each other's open cards; with no
 * identifiable user nothing is stored and the data-derived default stands.
 */
export function topCardStorageKey(kind: TopCardKind, courseId: number): string | null {
  const userId = currentUserId();
  if (!userId) return null;
  if (!Number.isFinite(courseId)) return null;
  return `adaptiveTopCard:${userId}:${courseId}:${kind}`;
}

/**
 * The learner's remembered choice, or null when there is none.
 *
 * Every access is guarded: `sessionStorage` throws outright in a Safari private window and in
 * any context with site data blocked, and a header card is not worth taking the page down for.
 */
export function readTopCardExpanded(kind: TopCardKind, courseId: number): boolean | null {
  try {
    const key = topCardStorageKey(kind, courseId);
    if (!key) return null;
    const raw = window.sessionStorage.getItem(key);
    if (raw === "1") return true;
    if (raw === "0") return false;
    return null;
  } catch {
    return null;
  }
}

/** Remember the learner's choice. Silently a no-op when storage is unavailable. */
export function writeTopCardExpanded(kind: TopCardKind, courseId: number, expanded: boolean): void {
  try {
    const key = topCardStorageKey(kind, courseId);
    if (!key) return;
    window.sessionStorage.setItem(key, expanded ? "1" : "0");
  } catch {
    /* storage unavailable - the default simply applies again next render */
  } finally {
    listeners.forEach((notify) => notify());
  }
}

/* ---------------------------------------------------------------------------------------------
 * Storage as an external store, so a card can read it with `useSyncExternalStore`.
 *
 * The remembered value cannot be read during the first render: the server has no sessionStorage,
 * so a card that read it there would render one way on the server and another in the browser and
 * hydration would tear. `useSyncExternalStore` is the API built for exactly that - it is handed a
 * server snapshot of `null` (meaning "nothing remembered, use the data-derived default") and the
 * real value once the browser takes over.
 * ------------------------------------------------------------------------------------------- */
const listeners = new Set<() => void>();

/** Subscribe to remembered-state changes. Returns the unsubscribe. */
export function subscribeTopCardExpanded(notify: () => void): () => void {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

/** The snapshot React uses while rendering on the server and while hydrating: nothing remembered. */
export function serverTopCardExpanded(): boolean | null {
  return null;
}

/** The dom id of a card's collapsible panel, referenced by its expander's `aria-controls`. */
export function topCardPanelId(kind: TopCardKind, courseId: number): string {
  return `journey-top-card-${kind}-${courseId}`;
}
