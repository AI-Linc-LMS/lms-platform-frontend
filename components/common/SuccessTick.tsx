"use client";

import { Box, Typography } from "@mui/material";

/**
 * The Razorpay-style success tick: a ring draws itself, then the check strokes in.
 *
 * Used for sign-in and sign-out instead of a toast. A toast is the wrong instrument here — it
 * appears in the corner, competes with the page already navigating underneath it, and is gone
 * before anyone reads it. The moment deserves the whole screen for a beat.
 *
 * Both shapes animate with stroke-dashoffset rather than scale/opacity, which is what gives the
 * "drawn" feel; the ring leads and the check follows, so it reads as one gesture rather than two
 * things appearing at once.
 *
 * Under prefers-reduced-motion the mark is simply present — no drawing, no pop. Someone who has
 * asked the OS for less movement should not get a flourish on every login.
 */
export function SuccessTick({
  label,
  sublabel,
}: {
  label: string;
  sublabel?: string;
}) {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "grid",
        placeItems: "center",
        bgcolor: "var(--page-bg, #ffffff)",
        // Keep the underlying page from showing through mid-navigation.
        backdropFilter: "blur(2px)",
        "@keyframes tickRing": { to: { strokeDashoffset: 0 } },
        "@keyframes tickCheck": { to: { strokeDashoffset: 0 } },
        "@keyframes tickFade": { from: { opacity: 0, transform: "translateY(6px)" }, to: { opacity: 1, transform: "none" } },
      }}
    >
      <Box sx={{ textAlign: "center", px: 3 }}>
        <Box
          component="svg"
          viewBox="0 0 72 72"
          sx={{
            width: 88,
            height: 88,
            display: "block",
            mx: "auto",
            "& .ring": {
              fill: "none",
              stroke: "#10b981",
              strokeWidth: 4,
              strokeLinecap: "round",
              // 2πr for r=32
              strokeDasharray: 201,
              strokeDashoffset: 201,
              transformOrigin: "center",
              transform: "rotate(-90deg)",
              animation: "tickRing 520ms cubic-bezier(0.65, 0, 0.35, 1) forwards",
            },
            "& .check": {
              fill: "none",
              stroke: "#10b981",
              strokeWidth: 5,
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeDasharray: 40,
              strokeDashoffset: 40,
              animation: "tickCheck 320ms cubic-bezier(0.65, 0, 0.35, 1) 380ms forwards",
            },
            "@media (prefers-reduced-motion: reduce)": {
              "& .ring, & .check": { animation: "none", strokeDashoffset: 0 },
            },
          }}
        >
          <circle className="ring" cx="36" cy="36" r="32" />
          <path className="check" d="M22 37.5 L32 47 L50 27" />
        </Box>

        <Typography
          sx={{
            mt: 2.5,
            fontWeight: 800,
            fontSize: "1.05rem",
            color: "var(--font-primary, #0f172a)",
            animation: "tickFade 300ms ease 520ms both",
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        >
          {label}
        </Typography>
        {sublabel && (
          <Typography
            sx={{
              mt: 0.5,
              fontSize: "0.85rem",
              color: "var(--font-secondary, #64748b)",
              animation: "tickFade 300ms ease 620ms both",
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
            }}
          >
            {sublabel}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
