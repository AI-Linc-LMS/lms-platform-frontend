"use client";

import { useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";

import {
  ROOM_BORDER,
  ROOM_PANEL,
  ROOM_TEXT,
  ROOM_TEXT_DIM,
  ROOM_TEXT_FAINT,
  ROOM_VIOLET,
} from "@/components/ai-tutor/room/roomTokens";
import type { InterviewTranscriptEntry } from "@/lib/hooks/useRealtimeInterview";

/**
 * What has been said so far.
 *
 * Oldest first and auto-scrolled, unlike the tutor's conversation panel which is newest-first.
 * An interview is read back as a narrative, and a candidate glancing at it wants to see where
 * they are in the arc rather than the most recent line in isolation.
 */
export function InterviewTranscript({ entries }: { entries: InterviewTranscriptEntry[] }) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries.length]);

  return (
    <Box
      sx={{
        borderRadius: "var(--radius-card, 12px)",
        border: `1px solid ${ROOM_BORDER}`,
        bgcolor: ROOM_PANEL,
        display: "flex",
        flexDirection: "column",
        maxHeight: { xs: 240, md: 420 },
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: 2.5, py: 1.25, borderBottom: `1px solid ${ROOM_BORDER}` }}>
        <Typography
          sx={{
            fontSize: "0.74rem",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: ROOM_TEXT_DIM,
          }}
        >
          Transcript
        </Typography>
      </Box>
      <Box sx={{ overflowY: "auto", px: 2.5, py: 2, display: "flex", flexDirection: "column", gap: 1.75 }}>
        {entries.length === 0 ? (
          <Typography sx={{ fontSize: "0.88rem", color: ROOM_TEXT_FAINT }}>
            Nothing yet.
          </Typography>
        ) : (
          entries.map((entry) => (
            <Box key={`${entry.role}-${entry.seq}`}>
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: entry.role === "candidate" ? ROOM_VIOLET : ROOM_TEXT_FAINT,
                  mb: 0.25,
                }}
              >
                {entry.role === "candidate" ? "You" : "Interviewer"}
              </Typography>
              <Typography sx={{ fontSize: "0.92rem", lineHeight: 1.5, color: ROOM_TEXT }}>
                {entry.text}
              </Typography>
            </Box>
          ))
        )}
        <div ref={endRef} />
      </Box>
    </Box>
  );
}

export default InterviewTranscript;
