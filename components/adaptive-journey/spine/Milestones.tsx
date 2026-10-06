"use client";

/**
 * The milestones at the end of the spine, rendered from what the course actually has.
 *
 * The certificate station is loaded lazily, exactly as the side rail's card was: it reaches
 * `useCertificateActions`, which drags in jspdf and html-to-image (~500KB gz) to render the
 * document. It keeps that hook's server-authoritative claim gate - this file decides WHERE the
 * certificate sits, never whether it can be claimed.
 */

import dynamic from "next/dynamic";
import { Box, Typography } from "@mui/material";
import type { JourneyBoard } from "@/lib/types/adaptive-journey";
import { MilestoneRow } from "./MilestoneRow";
import { InterviewAction } from "./InterviewAction";
import { courseMilestones } from "./milestoneRules";

const CertificateMilestone = dynamic(
  () => import("./CertificateMilestone").then((m) => ({ default: m.CertificateMilestone })),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ ml: "46px", mb: 1.5, p: 2, borderRadius: 3.5, border: "1px solid #fde68a", bgcolor: "#fffbeb" }}>
        <Typography sx={{ fontSize: "0.82rem", color: "#b45309" }}>Loading your certificate…</Typography>
      </Box>
    ),
  },
);
import type { JourneyNodeView } from "@/lib/types/adaptive-journey";


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
        // ONE card, not a milestone wrapper with the certificate card nested under it. That
        // arrangement said the same thing twice in two voices: "Your course certificate -
        // finish 80% and it unlocks here", and directly beneath it "Complete 80% of the course
        // to unlock certificate download & LinkedIn sharing".
        return <CertificateMilestone key="certificate" board={board} first={first} last={last} />;
      })}
    </>
  );
}
