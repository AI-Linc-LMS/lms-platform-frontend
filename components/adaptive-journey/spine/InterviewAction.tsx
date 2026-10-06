"use client";

/**
 * The button on a timeline interview step.
 *
 * This step used to be the one dead end on the board. `nodeHref` answered `type="interview"`
 * with `/mock-interview/courses` -- a generic list with no course and no template -- so a
 * learner who reached the interview on their timeline was dropped somewhere else entirely. An
 * interview also cannot be a link at all: its URL contains an id the server mints on POST.
 *
 * So the step renders a launch, not a link, using the same hook as the top card.
 */

import { ButtonBase, CircularProgress } from "@mui/material";
import { Icon } from "@iconify/react";
import { PHONE } from "@/components/common/mobile/phone";
import type { JourneyNodeView } from "@/lib/types/adaptive-journey";
import { useInterviewLaunch } from "../useInterviewLaunch";

export function InterviewAction({
  node,
  courseId,
  done,
}: {
  node: JourneyNodeView;
  courseId: number;
  done: boolean;
}) {
  const { launch, busy } = useInterviewLaunch(courseId);
  const templateId = node.ref.interviewTemplateId;

  // No template behind the step means there is no interview to start. Silence, not a button
  // that would fail: an admin can deactivate a template after the node exists.
  if (templateId == null) return null;

  return (
    <ButtonBase
      disabled={busy}
      onClick={() => void launch(templateId, { durationMinutes: node.durationMinutes })}
      aria-label={done ? "Take the mock interview again" : "Start the mock interview"}
      sx={{
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: 0.6,
        px: 2,
        py: 0.85,
        borderRadius: 2,
        fontWeight: 800,
        fontSize: "0.8rem",
        color: "white",
        background: "linear-gradient(135deg, #db2777 0%, #a855f7 100%)",
        "&.Mui-disabled": { opacity: 0.6, color: "white" },
        [PHONE]: { minHeight: 44, fontSize: "0.9rem", borderRadius: 2.5 },
      }}
    >
      {busy ? (
        <CircularProgress size={14} thickness={5} sx={{ color: "white" }} />
      ) : (
        <Icon icon="mdi:account-voice" width={16} />
      )}
      {done ? "Take it again" : "Start interview"}
    </ButtonBase>
  );
}
