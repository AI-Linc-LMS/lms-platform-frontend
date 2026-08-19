"use client";

import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import {
  ROOM_BORDER,
  ROOM_PANEL,
  ROOM_TEXT,
  ROOM_TEXT_DIM,
  ROOM_TEXT_FAINT,
  ROOM_VIOLET,
} from "@/components/ai-tutor/room/roomTokens";
import type { NextQuestion } from "@/lib/services/interview.service";

/**
 * The question currently being asked, shown as text as well as spoken.
 *
 * Showing it is not redundant with hearing it. Candidates are nervous, questions get missed,
 * and "sorry, could you repeat that" costs a minute of a timed interview. It also makes the
 * interview usable by someone in a noisy room or with a hearing impairment, which the old
 * voice-only flow simply was not.
 *
 * The rubric is deliberately not here, and is never sent to the browser at all: a candidate
 * who can read what they are marked against can write to it.
 */

const KIND_LABEL: Record<string, { label: string; icon: string }> = {
  behavioural: { label: "About you", icon: "solar:user-speak-rounded-bold-duotone" },
  conceptual: { label: "Concept", icon: "solar:lightbulb-bolt-bold-duotone" },
  coding: { label: "Coding", icon: "solar:code-square-bold-duotone" },
  mcq: { label: "Multiple choice", icon: "solar:list-check-bold-duotone" },
};

export function QuestionCard({
  question,
  total,
}: {
  question: NextQuestion | null;
  total: number;
}) {
  if (!question?.question) {
    return (
      <Box
        sx={{
          borderRadius: "var(--radius-card, 12px)",
          border: `1px solid ${ROOM_BORDER}`,
          bgcolor: ROOM_PANEL,
          p: { xs: 3, md: 4 },
          display: "grid",
          placeItems: "center",
          minHeight: 200,
          textAlign: "center",
        }}
      >
        <Box>
          <Icon
            icon="solar:microphone-3-bold-duotone"
            width={36}
            height={36}
            style={{ color: ROOM_TEXT_FAINT }}
          />
          <Typography sx={{ mt: 1.5, fontSize: "0.95rem", color: ROOM_TEXT_DIM }}>
            Listen for the first question. It will appear here as it is asked.
          </Typography>
        </Box>
      </Box>
    );
  }

  const meta = KIND_LABEL[question.kind ?? "conceptual"] ?? KIND_LABEL.conceptual;

  return (
    <Box
      sx={{
        borderRadius: "var(--radius-card, 12px)",
        border: `1px solid ${ROOM_BORDER}`,
        bgcolor: ROOM_PANEL,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2.5,
          py: 1.25,
          borderBottom: `1px solid ${ROOM_BORDER}`,
        }}
      >
        <Icon icon={meta.icon} width={16} height={16} style={{ color: ROOM_VIOLET }} />
        <Typography
          sx={{
            fontSize: "0.74rem",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: ROOM_TEXT_DIM,
          }}
        >
          {meta.label}
        </Typography>
        <Box sx={{ flex: 1 }} />
        {total > 0 && question.position ? (
          <Typography
            sx={{ fontSize: "0.78rem", color: ROOM_TEXT_FAINT, fontVariantNumeric: "tabular-nums" }}
          >
            {question.position} of {total}
          </Typography>
        ) : null}
      </Box>
      <Box sx={{ px: { xs: 2.5, md: 4 }, py: { xs: 3, md: 4 } }}>
        <Typography
          sx={{
            fontSize: { xs: "1.15rem", md: "1.4rem" },
            lineHeight: 1.45,
            fontWeight: 500,
            color: ROOM_TEXT,
            textWrap: "balance",
          }}
        >
          {question.question}
        </Typography>
      </Box>
    </Box>
  );
}

export default QuestionCard;
