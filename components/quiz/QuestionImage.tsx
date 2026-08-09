"use client";

import { Box } from "@mui/material";

/**
 * The image of a DIAGRAM-BASED question, rendered above the options.
 *
 * A question's image is part of the question rather than decoration: the stem refers to it and the
 * question cannot be answered without looking at it. So it gets a deliberate block of its own here
 * rather than being smuggled into the stem's HTML, which would leave its size and position at the
 * mercy of wherever the author happened to put the tag.
 *
 * Three things this does that an <img> inside the stem does not:
 *
 *  - Caps the height. A tall diagram pushed the options below the fold on a laptop, which is worse
 *    than a slightly smaller diagram. `object-fit: contain` keeps it undistorted at any shape.
 *  - Carries real alt text, supplied by the API as its own field. A question whose image holds the
 *    information is unanswerable without it for anyone who cannot see the image, so the seeding
 *    gate refuses an image with no alt and this renders what it gets.
 *  - Renders nothing at all when there is no image, so every question surface can call it
 *    unconditionally.
 *
 * Deliberately a plain <img> rather than next/image: these URLs are arbitrary external references
 * from the verified content library, which next/image will not optimise without every host being
 * configured, and which it refuses outright for SVG.
 */
export interface QuestionImageProps {
  src?: string | null;
  alt?: string | null;
  /** Tighter cap for the assessment layout, where the timer bar and nav already take height. */
  compact?: boolean;
}

export function QuestionImage({ src, alt, compact }: QuestionImageProps) {
  if (!src) return null;

  return (
    <Box
      sx={{
        my: compact ? 1.5 : 2,
        display: "flex",
        justifyContent: "center",
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 60%, transparent)",
        p: 1,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt || ""}
        loading="lazy"
        style={{
          maxWidth: "100%",
          maxHeight: compact ? 260 : 340,
          width: "auto",
          height: "auto",
          objectFit: "contain",
        }}
      />
    </Box>
  );
}

export default QuestionImage;
