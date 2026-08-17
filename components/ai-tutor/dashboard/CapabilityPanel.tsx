"use client";

import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { TutorTintSurface } from "../shared/surfaces";

/**
 * What the tutor can actually do, in the rail.
 *
 * Two jobs. The first is honest onboarding: a voice tutor is not a thing most learners have
 * used, and "you can interrupt it" and "ask it to quiz you" are not discoverable by staring at
 * a microphone button. These are the exact phrases the model is instructed to honour, so the
 * panel doubles as a list of things that will definitely work.
 *
 * The second is structural. This panel never hides, which is what keeps the right rail full for
 * a learner with no sessions, no notes and no suggestions. Without it the rail collapsed to a
 * single quota card on precisely the account that most needs the page to look finished, and the
 * page fell back to the white-on-white column this replaced.
 */

const CAPABILITIES = [
  {
    icon: "solar:hand-stars-bold-duotone",
    title: "Cut in whenever",
    detail: "Interrupt mid-sentence. It stops and deals with what you said.",
  },
  {
    icon: "solar:question-square-bold-duotone",
    title: "Ask to be quizzed",
    detail: 'Say "quiz me on this" and a question appears for you to answer.',
  },
  {
    icon: "solar:code-square-bold-duotone",
    title: "Code with it watching",
    detail: 'Say "open the editor". It reads what you write and asks why.',
  },
  {
    icon: "solar:gallery-bold-duotone",
    title: "Ask to be shown",
    detail: 'Say "draw that" and it puts a diagram or picture on screen.',
  },
];

export function CapabilityPanel() {
  return (
    <TutorTintSurface tint="indigo" padded={false}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: { xs: 2, md: 2.5 },
          py: 1.5,
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <Icon
          icon="solar:magic-stick-3-bold-duotone"
          width={17}
          style={{ color: "#6366f1" }}
        />
        <Typography
          sx={{
            fontSize: "0.74rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--font-secondary)",
            '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
          }}
        >
          Things you can say
        </Typography>
      </Box>

      <Box sx={{ px: { xs: 2, md: 2.5 }, py: 1.75, display: "grid", gap: 1.75 }}>
        {CAPABILITIES.map((item) => (
          <Box key={item.title} sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: "8px",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                bgcolor: "color-mix(in srgb, #6366f1 12%, transparent)",
              }}
            >
              <Icon icon={item.icon} width={16} style={{ color: "#6366f1" }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: "0.9rem", fontWeight: 500, lineHeight: 1.35 }}>
                {item.title}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.84rem",
                  color: "var(--font-secondary)",
                  lineHeight: 1.45,
                  mt: 0.15,
                }}
              >
                {item.detail}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </TutorTintSurface>
  );
}
