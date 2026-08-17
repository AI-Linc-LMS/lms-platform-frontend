"use client";

import { useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { TranscriptEntry } from "@/lib/hooks/useRealtimeTutor";
import {
  ROOM_BORDER,
  ROOM_PANEL,
  ROOM_PANEL_RAISED,
  ROOM_PINK,
  ROOM_TEXT,
  ROOM_TEXT_DIM,
  ROOM_TEXT_FAINT,
  ROOM_VIOLET,
  roomFocusRing,
} from "./roomTokens";

/**
 * What was said, so far.
 *
 * Voice is the only medium in the product with no scrollback. Everything else a learner does
 * here can be re-read; a spoken explanation cannot, and "wait, what did it just say" is the
 * single most common thing anyone wants from a lesson they are half-following. The caption
 * under the ribbon holds one sentence, which is not the same thing.
 *
 * Two design choices worth keeping:
 *
 * It autoscrolls to the newest turn, but only while the learner is already at the bottom.
 * Yanking the view down while somebody is reading back through what was said is worse than
 * not scrolling at all.
 *
 * The tutor's turn only appears here once it has finished speaking it, because that is when
 * the transport commits the turn. Streaming it in word by word would duplicate the caption
 * and make the panel jitter for the whole lesson.
 */

export function ConversationPanel({
  entries,
  liveCaption,
  onClose,
}: {
  entries: TranscriptEntry[];
  /** The sentence currently being spoken, shown as a pending turn at the bottom. */
  liveCaption?: string;
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pinnedRef = useRef(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !pinnedRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [entries.length, liveCaption]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    // 40px of slack, so a stray touch does not unpin the view.
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: ROOM_PANEL,
        borderLeft: `1px solid ${ROOM_BORDER}`,
        color: ROOM_TEXT,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1.25,
          bgcolor: ROOM_PANEL_RAISED,
          borderBottom: `1px solid ${ROOM_BORDER}`,
          flexShrink: 0,
        }}
      >
        <Icon
          icon="solar:chat-round-line-bold-duotone"
          width={17}
          height={17}
          style={{ color: ROOM_VIOLET }}
        />
        <Typography
          sx={{
            fontSize: "0.78rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
          }}
        >
          Conversation
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: "0.78rem", color: ROOM_TEXT_FAINT }}>
          {entries.length} {entries.length === 1 ? "turn" : "turns"}
        </Typography>
        <Box
          component="button"
          type="button"
          onClick={onClose}
          aria-label="Close conversation"
          sx={{
            border: "none",
            bgcolor: "transparent",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            borderRadius: "6px",
            p: 0.5,
            color: ROOM_TEXT_DIM,
            transition: "color 160ms ease, background-color 160ms ease",
            "&:hover": { color: ROOM_TEXT, bgcolor: "rgba(255,255,255,0.08)" },
            "&:focus-visible": roomFocusRing,
          }}
        >
          <Icon icon="mdi:close" width={17} />
        </Box>
      </Box>

      <Box
        ref={scrollRef}
        onScroll={onScroll}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: 2,
          py: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {entries.length === 0 && !liveCaption ? (
          <Box sx={{ m: "auto", textAlign: "center", px: 2 }}>
            <Icon
              icon="solar:chat-round-line-bold-duotone"
              width={34}
              style={{ color: "rgba(255,255,255,0.16)" }}
            />
            <Typography sx={{ mt: 1.25, fontSize: "0.88rem", color: ROOM_TEXT_FAINT }}>
              Everything you and your tutor say will show up here.
            </Typography>
          </Box>
        ) : null}

        {entries.map((entry) => (
          <Turn key={entry.id} role={entry.role} text={entry.text} />
        ))}

        {liveCaption ? <Turn role="tutor" text={liveCaption} pending /> : null}
      </Box>
    </Box>
  );
}

function Turn({
  role,
  text,
  pending = false,
}: {
  role: "tutor" | "student";
  text: string;
  pending?: boolean;
}) {
  const tutor = role === "tutor";
  const accent = tutor ? ROOM_VIOLET : ROOM_PINK;
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
        <Box sx={{ width: 6, height: 6, borderRadius: 9999, bgcolor: accent, flexShrink: 0 }} />
        <Typography
          sx={{
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: accent,
            '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
          }}
        >
          {tutor ? "Tutor" : "You"}
        </Typography>
        {pending ? (
          <Typography sx={{ fontSize: "0.7rem", color: ROOM_TEXT_FAINT }}>speaking</Typography>
        ) : null}
      </Box>
      <Typography
        sx={{
          fontSize: "0.9rem",
          lineHeight: 1.6,
          color: pending ? ROOM_TEXT_DIM : ROOM_TEXT,
          // The speaker rule does the grouping, so turns need no bubbles. Bubbles on a dark
          // ground either wash out or turn into two competing surfaces.
          pl: 1.4,
          borderLeft: "2px solid",
          borderColor: pending ? "rgba(255,255,255,0.14)" : `${accent}59`,
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}
