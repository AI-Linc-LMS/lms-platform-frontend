"use client";

/**
 * The milestones at the end of the spine, rendered from what the course actually has.
 *
 * The certificate card is loaded lazily here exactly as the side rail loaded it (it drags in
 * jspdf + html-to-image, ~500KB gz) and it keeps its own server-authoritative claim gate. This
 * file decides WHERE it sits, not whether it can be claimed.
 */

import dynamic from "next/dynamic";
import { Box, Typography } from "@mui/material";
import type { JourneyBoard } from "@/lib/types/adaptive-journey";
import { MilestoneRow } from "./MilestoneRow";
import { InterviewAction } from "./InterviewAction";
import { courseMilestones } from "./milestoneRules";
import type { JourneyNodeView } from "@/lib/types/adaptive-journey";

const CertificateCard = dynamic(
  () =>
    import("@/components/adaptive-journey/CertificateCard").then((m) => ({
      default: m.CertificateCard,
    })),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ p: 2, borderRadius: 4, border: "1px solid #eef2f7", bgcolor: "#fff" }}>
        <Typography sx={{ fontSize: "0.82rem", color: "#64748b" }}>
          Loading your certificate…
        </Typography>
      </Box>
    ),
  },
);

/** The interview milestone launches through the same action a timeline step uses, so it needs a
 *  node-shaped object. Only `ref.interviewTemplateId` and `durationMinutes` are read. */
function interviewNodeFor(board: JourneyBoard): JourneyNodeView {
  const card = board.interview.card;
  return {
    ref: { interviewTemplateId: card?.templateId ?? null },
    durationMinutes: card?.durationMinutes ?? null,
  } as JourneyNodeView;
}

export function Milestones({
  board,
  courseId,
  /** True when the weeks above rendered nothing, so the first milestone starts the rail. */
  startsTheRail,
}: {
  board: JourneyBoard;
  courseId: number;
  startsTheRail: boolean;
}) {
  const milestones = courseMilestones(board);
  if (milestones.length === 0) return null;

  const card = board.interview.card;

  return (
    <>
      {milestones.map((m, i) => {
        const first = startsTheRail && i === 0;
        const last = i === milestones.length - 1;
        if (m.kind === "interview") {
          return (
            <MilestoneRow
              key="interview"
              icon="mdi:account-voice"
              label="MOCK INTERVIEW"
              title={card?.topic ? `Interview: ${card.topic}` : "Your mock interview"}
              blurb={
                m.reached
                  ? "You have sat this interview. Take it again whenever you want another run at it."
                  : `A spoken interview on what this course taught you, with follow-ups that adapt to your answers. About ${card?.durationMinutes ?? 10} minutes.`
              }
              reached={m.reached}
              tone={m.reached ? "done" : "ahead"}
              first={first}
              last={last}
              action={
                <InterviewAction
                  node={interviewNodeFor(board)}
                  courseId={courseId}
                  done={m.reached}
                />
              }
            />
          );
        }
        return (
          <MilestoneRow
            key="certificate"
            icon="mdi:certificate"
            label="CERTIFICATE"
            title={board.course.certificateTitle || "Your course certificate"}
            blurb={
              m.reached
                ? "You have cleared the bar for this course. Your certificate is below - download it or share it."
                : `Finish ${board.course.certificateThreshold}% of this course and your certificate unlocks here, ready to download and share.`
            }
            reached={m.reached}
            tone={m.reached ? "done" : "ahead"}
            first={first}
            last={last}
            below={<CertificateCard board={board} />}
          />
        );
      })}
    </>
  );
}
