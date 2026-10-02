"use client";

import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PHONE } from "@/components/common/mobile/phone";
import { StreamLabel } from "./atmosphere";

type Concept = { name: string; status: string; note: string };

const TONE: Record<string, { icon: string; colour: string; label: string }> = {
  solid: { icon: "solar:check-circle-bold", colour: "#16a34a", label: "Solid" },
  shaky: { icon: "solar:minus-circle-bold", colour: "#d97706", label: "Needs another pass" },
  new: { icon: "solar:star-bold", colour: "var(--ai-violet)", label: "New today" },
};

/**
 * What the learner came away holding, and how firmly.
 *
 * Five identical bordered boxes gave "solid" and "not introduced yet" the same visual weight,
 * so the one thing a learner wants to find here - what is shaky - was no easier to see than
 * anything else. The status leads now: a coloured rail down the side and the tone's own colour
 * on the label, with nothing drawn around it.
 */
export function ConceptConstellation({ concepts }: { concepts: Concept[] }) {
  if (!concepts.length) return null;

  return (
    <Box>
      <StreamLabel icon="solar:lightbulb-bold-duotone" text="What you worked on" />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fit, minmax(260px, 1fr))" },
          gap: { xs: 1.5, md: 2 },
        }}
      >
        {concepts.map((concept) => {
          const tone = TONE[concept.status] ?? TONE.new;
          return (
            <Box
              key={concept.name}
              sx={{
                pl: 1.75,
                borderLeft: "3px solid",
                borderColor: tone.colour,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                <Icon icon={tone.icon} width={14} style={{ color: tone.colour }} />
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    [PHONE]: { fontSize: "0.74rem" },
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: tone.colour,
                    '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
                  }}
                >
                  {tone.label}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: "1rem", fontWeight: 600, mb: 0.3 }}>
                {concept.name}
              </Typography>
              {concept.note ? (
                <Typography
                  sx={{ fontSize: "0.88rem", color: "var(--font-secondary)", lineHeight: 1.55 }}
                >
                  {concept.note}
                </Typography>
              ) : null}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
