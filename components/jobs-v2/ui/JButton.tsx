"use client";

import { forwardRef, type ReactNode } from "react";
import NextLink from "next/link";
import { Box, Button, CircularProgress, Tooltip, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CTL_H, J, MOTION, R, SHADOW, TYPE, focusRing, focusRingOnDark } from "./jobsTokens";

export type JButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "quiet"
  | "danger"
  | "onDark";
export type JButtonSize = "sm" | "md" | "lg";
export type JButtonTone = "violet" | "azure";

export interface JButtonProps {
  variant?: JButtonVariant;
  size?: JButtonSize;
  /** Applies to `primary` and `secondary` only. Azure is signal; violet is action. */
  tone?: JButtonTone;
  /** An Iconify name, or any node. */
  startIcon?: string | ReactNode;
  endIcon?: string | ReactNode;
  /**
   * LoadingButton semantics: the spinner replaces the leading icon and the button is NOT
   * `disabled`, so the verb stays legible. Interaction is blocked with `pointerEvents: none`.
   */
  loading?: boolean;
  disabled?: boolean;
  /**
   * **A disabled button in this module must always say why.** Setting this disables the button,
   * wraps it in a Tooltip carrying the reason, and renders the reason as helper text below on
   * touch viewports, where tooltips do not exist.
   */
  disabledReason?: string;
  fullWidth?: boolean;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  href?: string;
  /** Open an external destination in a new tab. Adds the correct rel. */
  external?: boolean;
  type?: "button" | "submit" | "reset";
  children?: ReactNode;
  sx?: SxProps<Theme>;
  "aria-label"?: string;
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  "aria-haspopup"?: boolean | "dialog" | "menu" | "listbox" | "true" | "false";
  "data-tour-id"?: string;
  id?: string;
}

const SIZES: Record<JButtonSize, { h: number; px: number; fontSize: string; icon: number }> = {
  sm: { h: CTL_H.dense, px: 1.5, fontSize: "0.8125rem", icon: 16 },
  md: { h: CTL_H.base, px: 2, fontSize: "0.875rem", icon: 18 },
  lg: { h: 48, px: 2.5, fontSize: "0.9375rem", icon: 20 },
};

function renderIcon(icon: string | ReactNode | undefined, size: number): ReactNode {
  if (icon === undefined || icon === null || icon === false) return undefined;
  if (typeof icon === "string") return <IconWrapper icon={icon} size={size} />;
  return icon;
}

function variantSx(variant: JButtonVariant, tone: JButtonTone): SxProps<Theme> {
  switch (variant) {
    case "primary":
      // The `sx` background outlives MUI's disabled styling, so the disabled state has to
      // restate it explicitly — the certificates lesson.
      return {
        background: tone === "azure" ? J.gradBadge : J.gradAction,
        color: J.onDark,
        fontWeight: 700,
        border: "1px solid transparent",
        boxShadow: tone === "azure" ? SHADOW.glowAzure : SHADOW.glowViolet,
        "&:hover": { filter: "brightness(1.06)" },
        "&.Mui-disabled": {
          background: tone === "azure" ? J.gradBadge : J.gradAction,
          color: J.onDark,
          opacity: 0.5,
          boxShadow: "none",
        },
      };
    case "secondary":
      return {
        border: `1px solid ${J.hairline}`,
        bgcolor: J.surface,
        color: J.ink,
        fontWeight: 700,
        "&:hover": {
          borderColor: tone === "azure" ? J.azureBorder : J.hairlineStrong,
          bgcolor: J.surface2,
        },
        "&.Mui-disabled": { bgcolor: J.surface3, color: J.ink4, borderColor: J.hairline },
      };
    case "ghost":
      return {
        border: "1px solid transparent",
        bgcolor: "transparent",
        color: J.ink2,
        fontWeight: 700,
        "&:hover": { bgcolor: J.surface2, color: J.ink },
        "&.Mui-disabled": { color: J.ink4 },
      };
    case "quiet":
      // The link recipe.
      return {
        border: "1px solid transparent",
        bgcolor: "transparent",
        color: J.azure,
        fontWeight: 700,
        px: 0.75,
        "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
        "&.Mui-disabled": { color: J.ink4 },
      };
    case "danger":
      // Never a filled red.
      return {
        border: `1px solid ${J.dangerBd}`,
        bgcolor: "transparent",
        color: J.dangerFg,
        fontWeight: 700,
        "&:hover": { bgcolor: J.dangerBg, borderColor: J.dangerFg },
        "&.Mui-disabled": { color: J.ink4, borderColor: J.hairline },
      };
    case "onDark":
      return {
        borderRadius: R.pill,
        bgcolor: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.22)",
        color: J.onDark,
        fontWeight: 700,
        "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
        "&.Mui-disabled": { color: J.onDark3, opacity: 0.6 },
        ...focusRingOnDark,
      };
    default:
      return {};
  }
}

/**
 * The module's only button.
 *
 * Violet is the ACTION colour across the whole product, so a jobs button and a certificates
 * button still behave like the same thing; azure is the jobs SIGNAL and is available as a tone
 * for the rare case where the primary action is itself the module's identity.
 */
export const JButton = forwardRef<HTMLButtonElement, JButtonProps>(function JButton(
  {
    variant = "secondary",
    size = "md",
    tone = "violet",
    startIcon,
    endIcon,
    loading = false,
    disabled = false,
    disabledReason,
    fullWidth = false,
    onClick,
    href,
    external = false,
    type = "button",
    children,
    sx,
    ...rest
  },
  ref,
) {
  const dims = SIZES[size];
  const isDisabled = disabled || Boolean(disabledReason);
  const onDark = variant === "onDark";

  const linkProps = href
    ? external
      ? { component: "a" as const, href, target: "_blank", rel: "noopener noreferrer" }
      : { component: NextLink, href }
    : {};

  const button = (
    <Button
      {...rest}
      {...linkProps}
      ref={ref}
      type={href ? undefined : type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      disableRipple={false}
      onClick={
        loading
          ? (e: React.MouseEvent<HTMLElement>) => {
              e.preventDefault();
              e.stopPropagation();
            }
          : onClick
      }
      fullWidth={fullWidth}
      startIcon={
        loading ? (
          <CircularProgress size={dims.icon} thickness={4} sx={{ color: "inherit", flexShrink: 0 }} />
        ) : (
          renderIcon(startIcon, dims.icon)
        )
      }
      endIcon={renderIcon(endIcon, dims.icon)}
      sx={[
        {
          textTransform: "none",
          borderRadius: R.ctl,
          minHeight: { xs: CTL_H.touch, sm: dims.h },
          px: dims.px,
          py: 0,
          fontSize: dims.fontSize,
          lineHeight: 1.2,
          letterSpacing: 0,
          whiteSpace: "nowrap",
          gap: 0.5,
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
          userSelect: "none",
          transition: `background-color ${MOTION.ctl}ms ${MOTION.ease}, border-color ${MOTION.micro}ms ${MOTION.ease}, filter ${MOTION.ctl}ms ${MOTION.ease}, transform ${MOTION.micro}ms ${MOTION.ease}`,
          "&&:active": { transform: "scale(0.97)" },
          ...(loading ? { pointerEvents: "none", opacity: 0.82, cursor: "default" } : null),
        },
        variantSx(variant, tone),
        onDark ? {} : focusRing,
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Button>
  );

  if (!disabledReason) return button;

  // A disabled control has to say why. Tooltip for pointers; visible helper text on touch,
  // where a tooltip can never be read.
  return (
    <Box
      sx={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "stretch",
        width: fullWidth ? "100%" : "auto",
        gap: 0.5,
      }}
    >
      <Tooltip title={disabledReason} arrow describeChild>
        {/* A disabled MUI Button fires no events, so the Tooltip needs a live wrapper. */}
        <Box component="span" sx={{ display: "inline-flex", width: fullWidth ? "100%" : "auto" }}>
          {button}
        </Box>
      </Tooltip>
      <Typography
        sx={{ ...TYPE.small, display: { xs: "block", md: "none" }, color: J.ink3 }}
      >
        {disabledReason}
      </Typography>
    </Box>
  );
});
