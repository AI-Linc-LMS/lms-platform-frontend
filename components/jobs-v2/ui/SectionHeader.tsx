"use client";

import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { formatCount } from "@/lib/jobs-v2/format";
import { J, R, TYPE, tint } from "./jobsTokens";

export interface SectionHeaderProps {
  icon?: string;
  title: string;
  /**
   * Folded into the subtitle line ("3 roadmaps" style) rather than spent as a chip — a count
   * chip would burn one of the three accents the surface is allowed.
   */
  count?: number;
  noun?: string;
  description?: string;
  action?: ReactNode;
  /** `"sub"` drops the title to TYPE.h3 for a heading inside a card. */
  level?: "section" | "sub";
  /** The heading element. Keep the document outline honest. */
  component?: "h2" | "h3" | "h4";
  id?: string;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

/**
 * A section heading that sits **on the canvas**, not inside the card it labels (the roadmaps
 * pattern). One of these per section; never a second title inside the card beneath it.
 */
export function SectionHeader({
  icon,
  title,
  count,
  noun,
  description,
  action,
  level = "section",
  component,
  id,
  sx,
  ...rest
}: SectionHeaderProps) {
  // `noun` arrives already translated AND already pluralised by the caller
  // (`t("jobsV2.noun.job", { count })`). Appending an "s" here would be an English rule
  // applied to every language, which is exactly what section 8 forbids.
  const countText =
    count === undefined ? null : noun ? `${formatCount(count)} ${noun}` : formatCount(count);
  const subtitle = [countText, description].filter(Boolean).join(" · ") || undefined;

  return (
    <Box
      {...rest}
      sx={[
        {
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 1.25,
          mb: 1.75,
          mt: 0.5,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
        {icon && (
          <Box
            aria-hidden
            sx={{
              width: 32,
              height: 32,
              flexShrink: 0,
              borderRadius: R.ctl,
              display: "grid",
              placeItems: "center",
              bgcolor: tint(J.azure, 12),
              color: J.azure,
            }}
          >
            <IconWrapper icon={icon} size={18} />
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            id={id}
            component={component ?? (level === "sub" ? "h3" : "h2")}
            sx={level === "sub" ? TYPE.h3 : TYPE.h2}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ ...TYPE.small, mt: 0.25 }}>{subtitle}</Typography>
          )}
        </Box>
      </Box>
      {action && (
        <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 1 }}>{action}</Box>
      )}
    </Box>
  );
}
