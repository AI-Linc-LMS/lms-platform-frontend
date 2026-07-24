"use client";

import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { AdaptiveInfoTip } from "../shared/AdaptiveInfoTip";
import { certaintyBand } from "@/lib/utils/adaptive-confidence";

interface QuizMetaStripProps {
  quizTitle: string;
  answered: number;
  minQuestions: number;
  maxQuestions: number;
  avgSe: number | null;
}

/**
 * Top meta-strip during a live adaptive quiz. Shows the quiz title, where the
 * student is in the question budget, and a layman certainty label driven by
 * the engine's average SE.
 *
 * The old strip also exposed an internal "path #A2-…" debug id and an "End
 * early" CTA - both removed: the id was noise for students, and the End-early
 * action wasn't wired to a working backend hatch.
 */
export function QuizMetaStrip({
  quizTitle,
  answered,
  minQuestions,
  maxQuestions,
  avgSe,
}: QuizMetaStripProps) {
  const certainty = certaintyBand(avgSe);

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1.5,
        alignItems: "center",
        justifyContent: "space-between",
        px: 1.5,
        py: 1,
        borderRadius: 999,
        bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 65%, transparent)",
        border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 65%, transparent)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
        <Icon icon="mdi:school-outline" width={18} style={{ color: "#6366f1" }} />
        <Typography
          sx={{
            fontSize: "0.86rem",
            fontWeight: 700,
            color: "text.primary",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {quizTitle}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <Typography sx={{ fontSize: "0.74rem", color: "text.secondary", fontWeight: 600 }}>
          Question{" "}
          <Box component="span" sx={{ color: "text.primary", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
            {answered + 1}
          </Box>{" "}
          · {minQuestions === maxQuestions ? `of ${maxQuestions}` : `~${minQuestions}–${maxQuestions}`}
        </Typography>

        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
          <Typography sx={{ fontSize: "0.74rem", color: "text.secondary", fontWeight: 600 }}>
            AI&apos;s read:{" "}
            <Box component="span" sx={{ color: certainty.accent, fontWeight: 800 }}>
              {certainty.label}
            </Box>
          </Typography>
          <AdaptiveInfoTip title="How sure is the AI right now?" placement="bottom">
            <p>
              This tells you how confident the AI currently is in its estimate
              of your level. It updates after every question - the more you
              answer, the more confident it becomes.
            </p>
            <p>
              <strong>Just getting to know you</strong> - first couple of
              questions, very little to go on.
              <br />
              <strong>Building a picture</strong> - a rough sense.
              <br />
              <strong>Getting clearer</strong> - narrowing in.
              <br />
              <strong>Confident read</strong> - confident enough to wrap up
              soon.
            </p>
          </AdaptiveInfoTip>
        </Box>
      </Box>
    </Box>
  );
}
