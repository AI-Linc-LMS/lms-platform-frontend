"use client";

import { Box, Typography } from "@mui/material";
import RichHtml from "@/components/common/RichHtml";
import { QuestionImage } from "./QuestionImage";

/** Check if string contains HTML tags so we can render with dangerouslySetInnerHTML */
function hasHtml(str: unknown): str is string {
  return typeof str === "string" && /<[a-z][\s\S]*>/i.test(str);
}

interface QuestionTitleProps {
  question: string;
  /** When true, reduce spacing so quiz fits without scroll */
  compact?: boolean;
  /** A diagram question's image, rendered under the stem and above the options. */
  imageSrc?: string | null;
  imageAlt?: string | null;
}

const titleSx = {
  fontWeight: 700,
  /**
   * Inherit, never a fixed hex.
   *
   * This was `#111827` — near-black. Three of the four surfaces that render a question sit on a
   * light card, so it looked right and stayed unnoticed. The fourth, the calibration assessment
   * (`app/assessments/[slug]/calibration/page.tsx`), is a deliberately dark surface: its root sets
   * `bgcolor: "#0b1220"` with `color: "white"`. Near-black on dark navy is about 1.1:1 contrast, so
   * the question stem was invisible and learners were answering options with nothing to answer.
   *
   * Inheriting means the stem always takes the colour its container already established — white on
   * the dark calibration page, the theme's default text on the light layouts — instead of every
   * new surface having to remember to re-style a component it is only composing.
   */
  color: "inherit",
  fontSize: { xs: "1.125rem", sm: "1.25rem", md: "1.375rem" },
  lineHeight: 1.7,
  letterSpacing: "-0.01em",
};

export function QuestionTitle({ question, compact, imageSrc, imageAlt }: QuestionTitleProps) {
  return (
    <Box
      sx={{
        mb: compact ? { xs: 1.5, sm: 2 } : { xs: 2, sm: 3 },
        flexShrink: 0,
      }}
    >
      {hasHtml(question) ? (
        <RichHtml html={question} sx={titleSx} />
      ) : (
        <Typography variant="h6" sx={{ ...titleSx, whiteSpace: "pre-wrap" }}>
          {question}
        </Typography>
      )}
      <QuestionImage src={imageSrc} alt={imageAlt} compact={compact} />
    </Box>
  );
}

