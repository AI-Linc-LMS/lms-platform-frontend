"use client";

/**
 * Starting a course's mock interview.
 *
 * An interview cannot be a link. The route is `/adaptive-courses/{courseId}/interview/{id}`
 * where `{id}` is an interview that does not exist until the server mints it, so reaching it
 * means a POST first. That is why the timeline's interview node was broken: `nodeHref` answered
 * it with a bare `/mock-interview/courses` -- a generic list, no course, no template, no way to
 * reach the interview the course had configured.
 *
 * The top card already did this correctly. This hook is that code, moved here so the card and
 * the timeline node run the same launch instead of a copy each -- including the opening-clip
 * prewarm, which is the difference between the interviewer speaking on arrival and three
 * seconds of dead air.
 *
 * On a tenant with `interview_realtime` it routes to the rebuilt interview instead. That room
 * mints its own session and drives the whole lifecycle - preflight, WebRTC, server-released
 * questions, grading - so there is nothing to POST first and the launch is a route. Both
 * stacks are mounted and a tenant can hold either, so the legacy path stays for the rest.
 */

import { useCallback, useState } from "react";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { useToast } from "@/components/common/Toast";
import mockInterviewService from "@/lib/services/mock-interview.service";
import { prefetchInterviewerClip } from "@/lib/hooks/useInterviewerVoice";
import { useIsInterviewV2Enabled } from "@/lib/contexts/ClientInfoContext";
import { withFrom } from "@/lib/utils/return-to";

export interface InterviewLaunchMeta {
  topic?: string | null;
  difficulty?: string | null;
  durationMinutes?: number | null;
}

export function useInterviewLaunch(courseId: number) {
  const { push } = useInstantNavigation();
  const { showToast } = useToast();
  // HELD. Routing the journey's interviews to v2 is correct and the cutover is written, but
  // the v2 start endpoint cannot resolve a journey template yet: it authorises through
  // `visible_templates`, whose three grants are the `courses` M2M, the `adaptive_courses` M2M
  // and a cohort mapping - and a journey template carries NONE of them. The rounds builder
  // omits `adaptive_courses` deliberately (tagging it puts seven unlocked cards on the hub)
  // and the calibration gauge is excluded a second time by `is_level_gauge=False`.
  //
  // Measured on production: for all four Impacteers AI Mastery courses the gauge is invisible
  // to that queryset even with `include_level_gauge=True`, so this hook sent 48 enrolled
  // learners' level check to a 404. The gauge worked on the legacy stack and nothing asked for
  // it to move; this holds every journey launch there until the backend grant lands.
  //
  // Re-enable by restoring `useIsInterviewV2Enabled()` here once a journey-node grant is
  // deployed - `mock_interview.tests_v2_journey_door` is the test that proves it.
  // Called unconditionally - a hook behind `&&` is a conditional hook call.
  const tenantHasV2 = useIsInterviewV2Enabled();
  // HELD at false. Set this to `tenantHasV2` to re-enable; see the note above.
  const v2 = false;
  void tenantHasV2;
  const [busy, setBusy] = useState(false);

  const launch = useCallback(
    async (templateId: number | null | undefined, meta: InterviewLaunchMeta = {}) => {
      if (templateId == null || busy) return;

      // v2 where the tenant has it. The room mints its own session, so there is nothing to
      // POST first: it takes the template id and drives the whole lifecycle itself, which is
      // why this is a route rather than a request. `from` brings the learner back to the
      // course they left, which the standalone hub has no reason to know about.
      //
      // The two stacks are both mounted and a tenant can hold either, so the legacy path
      // stays for the ones without `interview_realtime`.
      if (v2) {
        setBusy(true);
        push(withFrom(`/interview/room?template=${templateId}`, `/adaptive-courses/${courseId}`));
        return;
      }

      setBusy(true);
      try {
        const created = await mockInterviewService.startTemplateInterview(templateId);
        // Warm the interviewer's opening TTS clip while the candidate reads the Begin screen,
        // and stash the text so the interview page can re-warm after a reload (its detail API
        // only serves completed interviews). Kills the first-question dead air.
        if (created.opening_question_text) {
          prefetchInterviewerClip(created.opening_question_text);
          try {
            sessionStorage.setItem(
              `adaptiveInterviewOpening_${created.id}`,
              created.opening_question_text,
            );
          } catch {
            /* best-effort */
          }
        }
        const q = new URLSearchParams();
        if (meta.topic) q.set("topic", meta.topic);
        if (meta.difficulty) q.set("difficulty", meta.difficulty);
        if (meta.durationMinutes) q.set("mins", String(meta.durationMinutes));
        push(`/adaptive-courses/${courseId}/interview/${created.id}?${q.toString()}`);
        // `busy` deliberately stays true on the happy path: the navigation is in flight and
        // re-enabling the button would mint a second interview on a double click.
      } catch {
        showToast("Couldn't start the interview. Please try again.", "error");
        setBusy(false);
      }
    },
    [busy, courseId, push, showToast, v2],
  );

  return { launch, busy };
}
