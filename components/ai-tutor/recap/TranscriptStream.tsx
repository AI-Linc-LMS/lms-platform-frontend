"use client";

import { useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PHONE } from "@/components/common/mobile/phone";
import { StreamLabel } from "./atmosphere";

type Turn = { role: "tutor" | "student"; text: string; offset_ms: number };

function stamp(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * The lesson as it was said.
 *
 * A voice lesson has two speakers, and the version this replaces rendered both as identical
 * indented rows under a role label - which is a log, not a conversation. Sides and avatars cost
 * nothing and make it legible at a glance: who said the long thing, who said "ok".
 *
 * Collapsed by default. It is the longest thing on the page and the least often wanted; the
 * search is here because when somebody does want it, they want one sentence out of it.
 */
export function TranscriptStream({ turns }: { turns: Turn[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return turns;
    return turns.filter((t) => t.text.toLowerCase().includes(q));
  }, [turns, query]);

  if (!turns.length) return null;

  return (
    <Box>
      <StreamLabel
        icon="solar:chat-round-dots-bold-duotone"
        text="Full transcript"
        meta={`${turns.length} ${turns.length === 1 ? "turn" : "turns"}`}
        right={
          <Box
            component="button"
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              cursor: "pointer",
              border: "none",
              background: "none",
              color: "var(--ai-violet)",
              fontWeight: 700,
              fontSize: "0.82rem",
              px: 0.5,
              [PHONE]: { minHeight: 44 },
              "&:focus-visible": {
                outline: "2px solid var(--ai-violet)",
                outlineOffset: 2,
                borderRadius: 6,
              },
            }}
          >
            {open ? "Hide" : "Read it"}
            <Icon icon={open ? "mdi:chevron-up" : "mdi:chevron-down"} width={17} />
          </Box>
        }
      />

      {open ? (
        <Box
          sx={{
            borderRadius: "18px",
            border: "1px solid color-mix(in srgb, var(--ai-violet) 18%, transparent)",
            bgcolor: "var(--card-bg, #fff)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              p: { xs: 1.25, md: 1.75 },
              borderBottom: "1px solid color-mix(in srgb, var(--ai-violet) 14%, transparent)",
              display: "flex",
              alignItems: "center",
              gap: 1,
              bgcolor: "color-mix(in srgb, var(--ai-violet) 4%, transparent)",
            }}
          >
            <Icon icon="mdi:magnify" width={18} style={{ color: "var(--font-secondary)" }} />
            <Box
              component="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find something that was said"
              aria-label="Search the transcript"
              sx={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "0.9rem",
                color: "inherit",
                fontFamily: "inherit",
                [PHONE]: { minHeight: 36, fontSize: "16px" },
              }}
            />
            {query ? (
              <Typography sx={{ fontSize: "0.78rem", color: "var(--font-secondary)" }}>
                {filtered.length} of {turns.length}
              </Typography>
            ) : null}
          </Box>

          <Box sx={{ p: { xs: 1.25, md: 2 }, display: "grid", gap: 1.5, maxHeight: 560, overflowY: "auto" }}>
            {filtered.length ? (
              filtered.map((turn, i) => <Said key={i} turn={turn} />)
            ) : (
              <Typography
                sx={{ fontSize: "0.9rem", color: "var(--font-secondary)", textAlign: "center", py: 3 }}
              >
                Nothing in this lesson matches that.
              </Typography>
            )}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

function Said({ turn }: { turn: Turn }) {
  const mine = turn.role === "student";
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        alignItems: "flex-start",
        flexDirection: mine ? "row-reverse" : "row",
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 30,
          height: 30,
          flexShrink: 0,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          fontSize: "0.62rem",
          fontWeight: 800,
          letterSpacing: "0.04em",
          color: mine ? "var(--font-secondary)" : "#fff",
          background: mine
            ? "color-mix(in srgb, var(--font-secondary) 14%, transparent)"
            : "linear-gradient(140deg, var(--ai-violet), var(--ai-pink, #ec4899))",
        }}
      >
        {mine ? "YOU" : "AI"}
      </Box>
      <Box sx={{ maxWidth: "min(78%, 760px)" }}>
        <Typography
          sx={{
            fontSize: "0.64rem",
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--font-secondary)",
            mb: 0.35,
            textAlign: mine ? "end" : "start",
            '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
          }}
        >
          {mine ? "You" : "Tutor"} · {stamp(turn.offset_ms)}
        </Typography>
        <Box
          sx={{
            px: 1.5,
            py: 1.1,
            borderRadius: mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
            bgcolor: mine
              ? "color-mix(in srgb, var(--font-secondary) 8%, transparent)"
              : "color-mix(in srgb, var(--ai-violet) 9%, transparent)",
            border: "1px solid",
            borderColor: mine
              ? "color-mix(in srgb, var(--font-secondary) 12%, transparent)"
              : "color-mix(in srgb, var(--ai-violet) 20%, transparent)",
          }}
        >
          <Typography sx={{ fontSize: "0.9rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {turn.text}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
