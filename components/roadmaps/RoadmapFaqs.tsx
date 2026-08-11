"use client";

import { useState } from "react";
import { Box, Collapse, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

/**
 * Frequently asked questions, at the foot of the map.
 *
 * These answer the thing the map itself cannot: whether the path is worth weeks of the
 * learner's life. "Is this a good career", "how long will this take", "do I need a degree".
 * A roadmap without them is a diagram; with them it is advice.
 *
 * Rendered as real buttons with aria-expanded rather than a click-handler div, so the whole
 * block is keyboard reachable and announced correctly.
 */
export function RoadmapFaqs({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  if (!faqs.length) return null;

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", mt: 6 }}>
      <Typography
        component="h2"
        sx={{ fontSize: 17, fontWeight: 800, color: "#0f172a", mb: 1.75 }}
      >
        Frequently asked questions
      </Typography>

      <Stack spacing={1}>
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <Box
              key={f.question}
              sx={{
                border: "1px solid #e6e8ef",
                borderRadius: 2,
                bgcolor: "#fff",
                overflow: "hidden",
              }}
            >
              <Box
                component="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                sx={{
                  appearance: "none",
                  font: "inherit",
                  cursor: "pointer",
                  border: "none",
                  width: "100%",
                  textAlign: "start",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2,
                  py: 1.5,
                  bgcolor: "transparent",
                  "&:hover": { bgcolor: "#faf8ff" },
                  "&:focus-visible": { outline: "2px solid #7c3aed", outlineOffset: -2 },
                }}
              >
                <Typography sx={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                  {f.question}
                </Typography>
                <Icon
                  icon="mdi:chevron-down"
                  width={19}
                  style={{
                    flexShrink: 0,
                    color: "#94a3b8",
                    transform: isOpen ? "rotate(180deg)" : "none",
                    transition: "transform .18s ease",
                  }}
                />
              </Box>
              <Collapse in={isOpen} unmountOnExit>
                <Typography
                  sx={{
                    px: 2,
                    pb: 2,
                    fontSize: 13.5,
                    color: "#475569",
                    lineHeight: 1.65,
                  }}
                >
                  {f.answer}
                </Typography>
              </Collapse>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
