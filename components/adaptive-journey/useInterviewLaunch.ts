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
  // Un-held. This was `false` for one release: the v2 start endpoint authorises through
  // `visible_templates`, whose three grants are the `courses` M2M, the `adaptive_courses` M2M
  // and a cohort mapping, and a journey template carries none of them - the rounds builder
  // omits `adaptive_courses` deliberately, and the calibration gauge is excluded again by
  // `is_level_gauge=False`. Every round AND the gauge answered 404, which on Impacteers meant
  // 48 learners' level check.
  //
  // BE #969 gives that endpoint the journey-node grant the legacy one has always had, scoped
  // by `has_course_access` and still behind the week gate. `mock_interview
  // .tests_v2_journey_door` is the test that proves it, including that the grant widens
  // neither tenancy, enrolment, lifecycle nor the lock.
  const v2 = useIsInterviewV2Enabled();
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
