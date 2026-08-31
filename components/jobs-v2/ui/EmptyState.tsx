"use client";

import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { J, R, TYPE, tint } from "./jobsTokens";
import { JCard, MicroRuleList } from "./Surfaces";

export interface EmptyStateProps {
  /** One of the normalised jobs illustrations. Pass the element, not the component. */
  illustration?: ReactNode;
  /** Used when there is no illustration — an Iconify name in a tinted tile. */
  icon?: string;
  title: string;
  body: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  /** Rendered as micro-rule bullets. Use them to name what is excluding the results. */
  hints?: ReactNode[];
  variant?: "page" | "panel" | "inline";
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

const PADDING = {
  page: { xs: 5, md: 6 },
  panel: { xs: 4, md: 5 },
  inline: { xs: 2.5, md: 3 },
} as const;

/**
 * The empty state.
 *
 * **Rule (section 4.7): an empty state caused by a filter MUST offer a reset action.** Two
 * distinct empties per list are mandatory — *nothing exists yet* versus *nothing matches* — and
 * the screen decides which one it is. A failed fetch is neither: that is `ErrorState`.
 */
export function EmptyState({
  illustration,
  icon,
  title,
  body,
  primaryAction,
  secondaryAction,
  hints,
  variant = "panel",
  sx,
  ...rest
}: EmptyStateProps) {
  return (
    <JCard
      {...rest}
      dashed
      elevated={false}
      padded={false}
      sx={[
        {
          py: PADDING[variant],
          px: { xs: 2, md: 3 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 1.5,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {illustration ? (
        <Box aria-hidden sx={{ display: "flex", justifyContent: "center", mb: 0.5 }}>
          {illustration}
        </Box>
      ) : icon ? (
        <Box
          aria-hidden
          sx={{
            width: variant === "inline" ? 48 : 64,
            height: variant === "inline" ? 48 : 64,
            borderRadius: R.inner,
            display: "grid",
            placeItems: "center",
            bgcolor: tint(J.azure, 10),
            color: J.azure,
          }}
        >
          <IconWrapper icon={icon} size={variant === "inline" ? 24 : 30} />
        </Box>
      ) : null}

      <Typography component="p" sx={{ ...TYPE.h3 }}>
        {title}
      </Typography>
      <Typography sx={{ ...TYPE.body, maxWidth: "46ch" }}>{body}</Typography>

      {hints && hints.length > 0 && (
        <MicroRuleList items={hints} sx={{ mt: 0.5, textAlign: "start", maxWidth: "46ch" }} />
      )}

      {(primaryAction || secondaryAction) && (
        <Box
          sx={{
            mt: 1,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            justifyContent: "center",
            gap: 1.25,
            width: { xs: "100%", sm: "auto" },
          }}
        >
          {primaryAction}
          {secondaryAction}
        </Box>
      )}
    </JCard>
  );
}
