"use client";

import { useState, type ReactNode, type MouseEvent } from "react";
import { Box, IconButton, Popover, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

interface AdaptiveInfoTipProps {
  /** Heading inside the popover — short, bold. */
  title: string;
  /** Body content — string or rich ReactNode (paragraphs, lists, etc.). */
  children: ReactNode;
  /** Accessible label for the button. Defaults to ``About {title}``. */
  ariaLabel?: string;
  /** Where the popover opens relative to the button. */
  placement?: "bottom" | "top" | "left" | "right";
}

/**
 * Small ``(i)`` icon button that pops up an inline explanation of an IRT /
 * adaptive-engine concept. Used wherever the UI exposes a piece of jargon
 * (SE, θ, EAP, etc.) that warrants a tap-to-learn-more.
 *
 * Picked Popover over Tooltip because the explanations span multiple
 * sentences and benefit from breathing room + structured content.
 */
export function AdaptiveInfoTip({
  title,
  children,
  ariaLabel,
  placement = "bottom",
}: AdaptiveInfoTipProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);

  function handleOpen(event: MouseEvent<HTMLElement>) {
    event.stopPropagation();
    setAnchor(event.currentTarget);
  }
  function handleClose() {
    setAnchor(null);
  }

  const anchorOrigin: Record<typeof placement, { vertical: "top" | "bottom" | "center"; horizontal: "left" | "right" | "center" }> = {
    bottom: { vertical: "bottom", horizontal: "left" },
    top: { vertical: "top", horizontal: "left" },
    left: { vertical: "center", horizontal: "left" },
    right: { vertical: "center", horizontal: "right" },
  };
  const transformOrigin: Record<typeof placement, { vertical: "top" | "bottom" | "center"; horizontal: "left" | "right" | "center" }> = {
    bottom: { vertical: "top", horizontal: "left" },
    top: { vertical: "bottom", horizontal: "left" },
    left: { vertical: "center", horizontal: "right" },
    right: { vertical: "center", horizontal: "left" },
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={handleOpen}
        aria-label={ariaLabel ?? `About ${title}`}
        sx={{
          p: 0.25,
          ml: 0.25,
          color: "text.secondary",
          "&:hover": { color: "#6366f1", bgcolor: "color-mix(in srgb, #6366f1 8%, transparent)" },
        }}
      >
        <Icon icon="mdi:information-outline" width={15} />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchor}
        onClose={handleClose}
        anchorOrigin={anchorOrigin[placement]}
        transformOrigin={transformOrigin[placement]}
        slotProps={{
          paper: {
            sx: {
              mt: placement === "bottom" ? 0.75 : 0,
              maxWidth: 360,
              p: 2,
              borderRadius: 3,
              bgcolor: "var(--card-bg)",
              border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
              boxShadow: "0 24px 50px -16px rgba(15, 23, 42, 0.25)",
            },
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
          <Icon icon="mdi:lightbulb-on-outline" width={16} style={{ color: "#a855f7" }} />
          <Typography
            sx={{
              fontSize: "0.78rem",
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#a855f7",
            }}
          >
            {title}
          </Typography>
        </Box>
        <Box
          sx={{
            fontSize: "0.86rem",
            color: "text.primary",
            lineHeight: 1.55,
            "& p": { m: 0, mt: 0.75 },
            "& p:first-of-type": { mt: 0 },
            "& code": {
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "0.82em",
              px: 0.45,
              py: 0.1,
              borderRadius: 0.5,
              bgcolor: "color-mix(in srgb, #6366f1 10%, transparent)",
              color: "#4338ca",
            },
            "& strong": { fontWeight: 800, color: "text.primary" },
          }}
        >
          {children}
        </Box>
      </Popover>
    </>
  );
}
