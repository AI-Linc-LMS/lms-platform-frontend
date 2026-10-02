"use client";

import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PHONE } from "@/components/common/mobile/phone";

/**
 * The recap's own surface language.
 *
 * The page it replaces was a column of white bordered boxes - every section the same weight, so
 * nothing led and the lesson read as a form. What a learner wants back from a voice lesson is
 * the SHAPE of it: what was on screen, in what order, what they were asked, what was said.
 *
 * So the recap is lit like a desk rather than a dashboard. One warm ground, one dark stage for
 * whatever is being looked at, and labels that sit in the margin instead of in a header bar.
 * Nothing here is a card.
 */

/** Section labels: small, tracked, in the margin. RTL drops the tracking and the casing. */
export function StreamLabel({
  icon,
  text,
  meta,
  tone = "var(--ai-violet)",
  right,
}: {
  icon: string;
  text: string;
  meta?: ReactNode;
  tone?: string;
  right?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        mb: 1.25,
        minHeight: 28,
      }}
    >
      <Icon icon={icon} width={17} style={{ color: tone, flexShrink: 0 }} />
      <Typography
        component="h2"
        sx={{
          fontSize: "0.74rem",
          [PHONE]: { fontSize: "0.78rem" },
          fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--font-primary, #0f172a)",
          '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
        }}
      >
        {text}
      </Typography>
      {meta ? (
        <Typography
          sx={{
            fontSize: "0.78rem",
            color: "var(--font-secondary)",
            fontWeight: 500,
          }}
        >
          {meta}
        </Typography>
      ) : null}
      {right ? (
        <>
          <Box sx={{ flex: 1 }} />
          {right}
        </>
      ) : null}
    </Box>
  );
}

/**
 * The warm ground the whole recap sits on, with the faint node field behind it.
 *
 * The constellation is drawn as a CSS gradient rather than an SVG asset: it is decoration at 3%
 * opacity, and a request for it would be a request the page does not need. `aria-hidden` because
 * it says nothing.
 */
export function RecapGround({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: "28px",
        px: { xs: 1.75, md: 3.5 },
        py: { xs: 2.5, md: 3.5 },
        [PHONE]: { px: 1.25, borderRadius: "20px" },
        overflow: "hidden",
        background:
          "radial-gradient(130% 100% at 50% -16%, color-mix(in srgb, var(--ai-violet) 20%, transparent) 0%, transparent 62%), " +
          "linear-gradient(168deg, color-mix(in srgb, #efe0c4 88%, var(--card-bg, #fff)) 0%, " +
          "color-mix(in srgb, #f6eede 72%, var(--card-bg, #fff)) 46%, var(--card-bg, #fff) 96%)",
        border: "1px solid color-mix(in srgb, var(--ai-violet) 16%, transparent)",
        boxShadow: "0 30px 70px -48px color-mix(in srgb, var(--ai-violet) 60%, transparent)",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.4,
          backgroundImage:
            "radial-gradient(circle at 12% 18%, color-mix(in srgb, var(--ai-violet) 30%, transparent) 0 2px, transparent 2px), " +
            "radial-gradient(circle at 78% 10%, color-mix(in srgb, var(--ai-violet) 22%, transparent) 0 2px, transparent 2px), " +
            "radial-gradient(circle at 92% 46%, color-mix(in srgb, var(--ai-violet) 18%, transparent) 0 2px, transparent 2px), " +
            "radial-gradient(circle at 30% 76%, color-mix(in srgb, var(--ai-violet) 16%, transparent) 0 2px, transparent 2px)",
        }}
      />
      <Box sx={{ position: "relative" }}>{children}</Box>
    </Box>
  );
}

/**
 * The dark stage. Whatever the learner is looking at goes on it.
 *
 * Dark on purpose and in both themes: this is a picture of what was on the canvas during the
 * lesson, and the canvas was dark. `TutorDiagram` is drawn for that ground too, so a diagram
 * lands here without being rewritten.
 */
export function Stage({ children, sx }: { children: ReactNode; sx?: object }) {
  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: "20px",
        p: { xs: 1.75, md: 2.5 },
        bgcolor: "#140b2b",
        border: "1px solid color-mix(in srgb, var(--ai-violet) 42%, transparent)",
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.04) inset, 0 24px 60px -34px color-mix(in srgb, var(--ai-violet) 90%, transparent)",
        overflowX: "auto",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

/**
 * The log panel: warm, ruled, a little older than everything else.
 *
 * Used for the questions the learner was asked. They are the only part of a lesson with a right
 * answer, so they get a surface of their own rather than another neutral box.
 */
export function LogPanel({ children, sx }: { children: ReactNode; sx?: object }) {
  return (
    <Box
      sx={{
        borderRadius: "16px",
        p: { xs: 1.5, md: 2 },
        background:
          "linear-gradient(160deg, color-mix(in srgb, #f0d9a8 42%, var(--card-bg, #fff)) 0%, var(--card-bg, #fff) 72%)",
        border: "1px solid color-mix(in srgb, #c2853a 34%, transparent)",
        boxShadow: "0 14px 34px -26px rgba(146,100,30,0.7)",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
