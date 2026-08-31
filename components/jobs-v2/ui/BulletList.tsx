"use client";

import { useId, useState, type ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { J, MOTION, TYPE } from "./jobsTokens";
import { JButton } from "./JButton";

/**
 * BulletList — every list on a job posting, in one component.
 *
 * The "very plain" complaint is mostly a typography complaint, and this is half the answer:
 * **exactly one paragraph of prose per card; everything else is a list or a label/value pair.**
 * A wall of `pre-wrap` text becomes "What you'll do" as eight verb-first lines, and the eye can
 * work it.
 *
 * Bullets are a **1 x 8px accent rule or a glyph, never a disc** — the marketing site's device,
 * and the one that keeps a dense list from reading as a shopping list.
 *
 * `MicroRuleList` (`ui/Surfaces.tsx`) is now a thin wrapper over `variant="rule"` and keeps its
 * name and signature, so `JobDetailsPanel.tsx` and every admin caller are untouched.
 */

export type BulletVariant = "rule" | "check" | "plus" | "cross" | "numbered";

export interface BulletListProps {
  items: ReactNode[];
  /** Default `"rule"` — the 1 x 8px accent rule. */
  variant?: BulletVariant;
  /** `"muted"` drops to `J.ink3`. The "Good to have" block, which must not outweigh the musts. */
  tone?: "default" | "muted";
  /** Show only the first N, with a "Show all N" disclosure for the rest. */
  max?: number;
  dense?: boolean;
  /** Overrides the marker colour. Defaults per variant. */
  markerColor?: string;
  ariaLabel?: string;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

const GLYPH: Partial<Record<BulletVariant, string>> = {
  check: "mdi:check",
  plus: "mdi:plus",
  cross: "mdi:close",
};

const GLYPH_COLOR: Partial<Record<BulletVariant, string>> = {
  check: J.successFg,
  plus: J.ink3,
  cross: J.dangerFg,
};

export function BulletList({
  items,
  variant = "rule",
  tone = "default",
  max,
  dense = false,
  markerColor,
  ariaLabel,
  sx,
  ...rest
}: BulletListProps) {
  const { t } = useTranslation("common");
  const [expanded, setExpanded] = useState(false);
  const listId = useId();

  const clean = items.filter((item) => item !== null && item !== undefined && item !== "");
  // A section that would render an empty list omits itself entirely — no header with nothing
  // under it, no dash, no "None specified".
  if (clean.length === 0) return null;

  const limited = max !== undefined && !expanded && clean.length > max;
  const shown = limited ? clean.slice(0, max) : clean;
  const hidden = clean.length - shown.length;

  const ordered = variant === "numbered";
  const glyph = GLYPH[variant];
  const marker = markerColor ?? GLYPH_COLOR[variant] ?? J.azure;
  const textColor = tone === "muted" ? J.ink3 : J.ink2;

  return (
    <Box {...rest} sx={[{ minWidth: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <Box
        component={ordered ? "ol" : "ul"}
        id={listId}
        aria-label={ariaLabel}
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          display: "flex",
          flexDirection: "column",
          gap: dense ? 0.5 : 0.875,
          counterReset: ordered ? "j-bullet" : undefined,
        }}
      >
        {shown.map((item, index) => (
          <Box
            component="li"
            key={index}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.25,
              minWidth: 0,
              counterIncrement: ordered ? "j-bullet" : undefined,
            }}
          >
            {ordered ? (
              <Box
                aria-hidden
                sx={{
                  flexShrink: 0,
                  minWidth: 20,
                  height: 20,
                  mt: "0.15em",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--j-r-pill)",
                  border: `1px solid ${J.azureBorder}`,
                  bgcolor: J.azureSoft,
                  color: J.azureDeep,
                  fontSize: "0.6875rem",
                  fontWeight: 800,
                  fontFeatureSettings: '"tnum" 1',
                  lineHeight: 1,
                  "&::before": { content: 'counter(j-bullet)' },
                }}
              />
            ) : glyph ? (
              <Box
                aria-hidden
                sx={{ flexShrink: 0, mt: "0.1em", display: "inline-flex", color: marker }}
              >
                <IconWrapper icon={glyph} size={16} />
              </Box>
            ) : (
              // The 1 x 8px accent rule. Never a disc.
              <Box
                aria-hidden
                sx={{ width: 8, height: 1, flexShrink: 0, mt: "0.7em", bgcolor: marker }}
              />
            )}
            <Typography
              component="span"
              sx={{
                ...(dense ? TYPE.small : TYPE.body),
                color: textColor,
                minWidth: 0,
                // The lead measure. A 900px pane at 15px runs ~110 characters, which is the
                // actual reason a paragraphed JD still reads as a wall.
                maxWidth: "68ch",
              }}
            >
              {item}
            </Typography>
          </Box>
        ))}
      </Box>

      {(limited || (max !== undefined && expanded && clean.length > max)) && (
        <Box sx={{ mt: 1, transition: `opacity ${MOTION.ctl}ms ${MOTION.ease}` }}>
          <JButton
            variant="quiet"
            size="sm"
            aria-expanded={expanded}
            aria-controls={listId}
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded
              ? (t("jobsV2.content.showLess", { defaultValue: "Show less" }) as string)
              : (t("jobsV2.content.showAll", {
                  count: clean.length,
                  hidden,
                  defaultValue: "Show all {{count}}",
                }) as string)}
          </JButton>
        </Box>
      )}
    </Box>
  );
}
