"use client";

import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { jobHighlights, type Highlight } from "@/lib/jobs-v2/content";
import { J, MOTION, R, TYPE } from "./jobsTokens";

export type { Highlight };
/**
 * `jobHighlights` is **pure and computed in code, never model output** — a model asked for
 * "highlights" writes marketing copy, and a function cannot. It lives in `lib/jobs-v2/content.ts`
 * with the rest of the content resolution and is re-exported here so a caller importing the
 * strip gets its data source in the same import.
 */
export { jobHighlights };

export interface HighlightStripProps {
  items: Highlight[];
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

/**
 * A wrapping row of computed fact chips, sitting under the lead paragraph of "About this role".
 *
 * Every chip is a field the employer or an admin stated, restated verbatim. A fact we do not
 * hold produces no chip: **renders `null` on an empty list**, so a role with no work mode, no
 * salary and no stated experience shows a clean paragraph rather than a rack of "Not specified".
 */
export function HighlightStrip({ items, sx, ...rest }: HighlightStripProps) {
  if (!items.length) return null;

  return (
    <Box
      {...rest}
      sx={[
        { display: "flex", flexWrap: "wrap", gap: 0.75, minWidth: 0 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {items.map((item) => (
        <Box
          key={item.key}
          component="span"
          title={item.title}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.625,
            minHeight: 28,
            px: 1.25,
            maxWidth: "100%",
            borderRadius: R.ctl,
            border: `1px solid ${J.hairline}`,
            bgcolor: J.surface2,
            color: J.ink2,
            fontSize: "0.8125rem",
            fontWeight: 500,
            lineHeight: 1.4,
            transition: `border-color ${MOTION.micro}ms ${MOTION.ease}`,
          }}
        >
          <Box aria-hidden sx={{ display: "inline-flex", color: J.ink3, flexShrink: 0 }}>
            <IconWrapper icon={item.icon} size={15} />
          </Box>
          <Box
            component="span"
            sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {item.label}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

/**
 * The rule that separates the strip from the paragraph above it. `HairlineStrip`'s device at a
 * smaller scale: one hairline, no card, no gap.
 */
export function HighlightRule({ sx }: { sx?: SxProps<Theme> }) {
  return (
    <Box
      aria-hidden
      sx={[
        { height: "1px", bgcolor: J.hairlineSoft, my: 2 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}

/** The strip's own type scale, exported so a caller can label it consistently. */
export const HIGHLIGHT_LABEL = TYPE.label;
