"use client";

import { TutorVoice } from "@/components/ai-tutor/room/TutorVoice";
import type { TutorPhase } from "@/lib/hooks/useRealtimeTutor";
import type { InterviewPhase } from "@/lib/hooks/useRealtimeInterview";

/**
 * The interviewer's presence: the AI Tutor's Strands ribbon, driven by whoever is talking.
 *
 * This replaces the old module's interviewer avatar. The avatar was a static image with a
 * lip-sync loop bolted on, and the drift between the two was one of the things that made the
 * old room feel wrong. The ribbon has no mouth to fall out of sync, and it reacts to the
 * actual audio on both sides, so it reads as presence rather than as a picture of a person.
 *
 * `TutorVoice` is reused wholesale rather than reimplemented: it already owns the rAF loop
 * that writes to the shader outside React, the reduced-motion fallback, and the dynamic import
 * that keeps WebGL off the room's first paint.
 */

/** Interview phases map onto the tutor's, which is what TutorVoice's visuals are tuned for. */
const PHASE_MAP: Record<InterviewPhase, TutorPhase> = {
  idle: "idle",
  starting: "starting",
  connecting: "connecting",
  listening: "listening",
  "candidate-speaking": "student-speaking",
  thinking: "thinking",
  "interviewer-speaking": "speaking",
  ending: "ending",
  ended: "ended",
  failed: "failed",
};

/** What the status line says. Interview wording, not lesson wording. */
export const INTERVIEW_PHASE_LABEL: Record<InterviewPhase, string> = {
  idle: "Ready",
  starting: "Preparing your interview",
  connecting: "Connecting",
  listening: "Listening",
  "candidate-speaking": "You're speaking",
  thinking: "Thinking",
  "interviewer-speaking": "Interviewer speaking",
  ending: "Wrapping up",
  ended: "Interview finished",
  failed: "Could not connect",
};

export function InterviewPresence({
  phase,
  getLevels,
  height = "100%",
}: {
  phase: InterviewPhase;
  getLevels: () => { mic: number; tutor: number };
  height?: number | string;
}) {
  return (
    <TutorVoice
      phase={PHASE_MAP[phase]}
      getLevels={getLevels}
      height={height}
      showLabel={false}
    />
  );
}

export default InterviewPresence;
