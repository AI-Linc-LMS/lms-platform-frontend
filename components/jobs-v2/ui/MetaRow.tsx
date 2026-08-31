"use client";

import { useState, type ReactNode } from "react";
import { Box, Popover } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { J, R, SHADOW, focusRing } from "./jobsTokens";
import { MetaChip } from "./Chips";

/**
 * **The order is fixed** — location, job type, experience, salary, posted, deadline — and never
 * varies between the card, the row and the detail page, so the eye learns one path and stops
 * re-reading the same six facts in three different sequences.
 */
export const META_ORDER = [
  "location",
  "jobType",
  "experience",
  "salary",
  "posted",
  "deadline",
] as const;

export type MetaKey = (typeof META_ORDER)[number] | (string & {});

export interface MetaItem {
  /** One of META_ORDER when it is one of the six canonical facts. */
  key?: MetaKey;
  icon: string;
  label: ReactNode;
  /** The full string, when `label` is clamped. */
  title?: string;
}

/** Put the canonical facts in the canonical order; anything else keeps its relative order. */
export function sortMeta(items: MetaItem[]): MetaItem[] {
  const rank = (item: MetaItem) => {
    const index = META_ORDER.indexOf(item.key as (typeof META_ORDER)[number]);
    return index === -1 ? META_ORDER.length : index;
  };
  return [...items].sort((a, b) => rank(a) - rank(b));
}

export interface MetaRowProps {
  items: MetaItem[];
  /** Truncate to N, with a `+N` button that opens the rest in a popover. */
  max?: number;
  dense?: boolean;
  onDark?: boolean;
  /** Skip the canonical reordering (the detail page passes its own sequence). */
  unordered?: boolean;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

export function MetaRow({
  items,
  max,
  dense,
  onDark,
  unordered,
  sx,
  ...rest
}: MetaRowProps) {
  const { t } = useTranslation("common");
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const ordered = unordered ? items : sortMeta(items);
  const visible = max === undefined ? ordered : ordered.slice(0, max);
  const overflow = max === undefined ? [] : ordered.slice(max);

  return (
    <Box
      {...rest}
      sx={[
        {
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1.5,
          minWidth: 0,
          // The hairline separator between chips, on sm and up only — below sm the row wraps
          // and a floating middot reads as a bullet with nothing after it.
          "& > *:not(:last-child)::after": {
            content: { xs: "none", sm: '"·"' },
            marginInlineStart: "12px",
            color: onDark ? J.onDark3 : J.ink4,
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {visible.map((item, index) => (
        <MetaChip
          key={item.key ?? index}
          icon={item.icon}
          title={item.title}
          dense={dense}
          onDark={onDark}
        >
          {item.label}
        </MetaChip>
      ))}

      {overflow.length > 0 && (
        <>
          <Box
            component="button"
            type="button"
            onClick={(event: React.MouseEvent<HTMLElement>) => setAnchor(event.currentTarget)}
            aria-haspopup="dialog"
            aria-expanded={Boolean(anchor)}
            aria-label={t("jobsV2.meta.moreLabel", { count: overflow.length }) as string}
            sx={{
              font: "inherit",
              fontSize: dense ? "0.75rem" : "0.8125rem",
              fontWeight: 700,
              px: 1,
              minHeight: 28,
              borderRadius: R.pill,
              border: `1px solid ${onDark ? J.onDarkLine : J.hairline}`,
              bgcolor: "transparent",
              color: onDark ? J.onDark2 : J.ink3,
              cursor: "pointer",
              "&:hover": { borderColor: J.azureBorder, color: onDark ? J.onDark : J.ink },
              ...focusRing,
            }}
          >
            +{overflow.length}
          </Box>
          <Popover
            open={Boolean(anchor)}
            anchorEl={anchor}
            onClose={() => setAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            slotProps={{
              paper: {
                sx: {
                  mt: 0.5,
                  p: 1.5,
                  borderRadius: R.inner,
                  border: `1px solid ${J.hairline}`,
                  bgcolor: J.surface,
                  backgroundImage: "none",
                  boxShadow: SHADOW.overlay,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                },
              },
            }}
          >
            {overflow.map((item, index) => (
              <MetaChip key={item.key ?? index} icon={item.icon} title={item.title} dense={dense}>
                {item.label}
              </MetaChip>
            ))}
          </Popover>
        </>
      )}
    </Box>
  );
}
