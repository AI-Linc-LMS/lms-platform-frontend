"use client";

/**
 * One leg of a module's triad: learn it, be taught it, be tested on it.
 *
 * Every module on the board now states all three, side by side, because that IS the product's
 * offer for a module and it used to be spread across three pages. The important constraint:
 * each tile reports something read, never estimated. "22 min session" is this learner's actual
 * connected tutor time on this module; "Scored 86%" is their real result. A tile with nothing
 * behind it says what would unlock it instead of showing a zero.
 */

import type React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PHONE } from "@/components/common/mobile/phone";

export type TriadState = "done" | "active" | "ready" | "locked";

const TONE: Record<TriadState, { bg: string; border: string; fg: string; label: string }> = {
  // Finished: the green the rail uses behind the learner, so the two agree.
  done: { bg: "#f0fdf4", border: "#bbf7d0", fg: "#15803d", label: "#15803d" },
  // The leg they are on.
  active: { bg: "#fdf2f8", border: "#fbcfe8", fg: "#be185d", label: "#be185d" },
  // Open, not started.
  ready: { bg: "#f5f3ff", border: "#e9d5ff", fg: "#6d28d9", label: "#6d28d9" },
  // Not reachable yet. Deliberately quiet - a locked leg is information, not a scold.
  locked: { bg: "#f8fafc", border: "#eef2f7", fg: "#94a3b8", label: "#94a3b8" },
};

export function TriadTile({
  step,
  label,
  value,
  state,
  icon,
  onClick,
}: {
  /** 1, 2 or 3 - the order a module is meant to be worked through. */
  step: number;
  /** LESSONS / AI TUTOR / ASSESSMENT. */
  label: string;
  /** What this leg says right now: "3 of 3", "22 min session", "Scored 86%". */
  value: string;
  state: TriadState;
  icon: string;
  onClick?: () => void;
}) {
  const tone = TONE[state];
  const interactive = !!onClick && state !== "locked";
  return (
    <Box
      component={interactive ? "button" : "div"}
      type={interactive ? "button" : undefined}
      // The whole module card is clickable, and this tile sits inside it. Without stopping the
      // click here it fires this handler and then bubbles to the card's, which runs second and
      // wins - so every tile navigated into the module instead of to the thing it names.
      onClick={
        interactive
          ? (e: React.MouseEvent) => {
              e.stopPropagation();
              onClick?.();
            }
          : undefined
      }
      aria-label={interactive ? `${label}: ${value}` : undefined}
      sx={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: 1,
        p: 1.25,
        borderRadius: 2.5,
        textAlign: "left",
        font: "inherit",
        border: "1px solid",
        borderColor: tone.border,
        bgcolor: tone.bg,
        cursor: interactive ? "pointer" : "default",
        transition: "border-color .15s, transform .15s",
        ...(interactive && {
          "&:hover": { borderColor: tone.fg, transform: "translateY(-1px)" },
          "&:focus-visible": { outline: `2px solid ${tone.fg}`, outlineOffset: 2 },
        }),
        [PHONE]: { p: 1.25, minHeight: 52 },
      }}
    >
      <Box
        sx={{
          width: 26, height: 26, borderRadius: 1.5, flexShrink: 0,
          display: "grid", placeItems: "center",
          bgcolor: state === "done" ? "#22c55e" : "transparent",
          border: state === "done" ? "none" : `1px solid ${tone.border}`,
          color: state === "done" ? "#fff" : tone.fg,
        }}
      >
        <Icon icon={state === "done" ? "mdi:check" : icon} width={15} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography
            sx={{
              fontSize: "0.6rem", fontWeight: 800, letterSpacing: 0.7, color: tone.label,
              '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
              [PHONE]: { fontSize: "0.68rem", letterSpacing: 0.4 },
            }}
          >
            {step} · {label}
          </Typography>
        </Stack>
        <Typography
          sx={{
            fontSize: "0.82rem", fontWeight: 700,
            color: state === "locked" ? "#94a3b8" : "#0f172a",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            [PHONE]: { fontSize: "0.85rem" },
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
