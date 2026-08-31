"use client";

import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { resolveTone, type StatusKind } from "@/lib/jobs-v2/status";
import { formatCount } from "@/lib/jobs-v2/format";
import { J, MOTION, R, TYPE, focusRing, rtlLabel, type Tone } from "./jobsTokens";

/* ==========================================================================
 * StatusPill — the one status chip. Replaces three status maps and two chip
 * dialects across the student and admin surfaces.
 * ======================================================================== */

export interface StatusPillProps {
  kind: StatusKind;
  value: unknown;
  size?: "sm" | "md";
  /** Makes it a filter toggle. A StatusPill is NEVER an editable control — that is StatusSelect. */
  interactive?: boolean;
  onClick?: () => void;
  /** `aria-pressed` when the pill is a filter toggle. */
  pressed?: boolean;
  /** Appends a `·`-separated tabular count. */
  count?: number;
  /** Override the resolved label — only for statuses the API labels itself. */
  label?: string;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

export function StatusPill({
  kind,
  value,
  size = "md",
  interactive = false,
  onClick,
  pressed,
  count,
  label,
  sx,
  ...rest
}: StatusPillProps) {
  const { t } = useTranslation("common");
  const tone: Tone = resolveTone(kind, value);
  const text = label ?? (t(tone.labelKey) as string);
  const clickable = interactive && Boolean(onClick);

  return (
    <Box
      {...rest}
      component={clickable ? "button" : "span"}
      type={clickable ? "button" : undefined}
      onClick={clickable ? onClick : undefined}
      aria-pressed={clickable ? pressed : undefined}
      sx={[
        {
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          minHeight: size === "sm" ? 20 : 24,
          px: size === "sm" ? 0.75 : 1,
          borderRadius: R.pill,
          border: `1px solid ${tone.bd}`,
          // Draft and `applying` are distinguished by FORM as well as colour, so they survive
          // colour-blindness and a greyscale print.
          borderStyle: tone.dashed ? "dashed" : "solid",
          bgcolor: tone.bg,
          fontFamily: "inherit",
          maxWidth: "100%",
          ...TYPE.label,
          // TYPE.label carries the muted ink colour; the tone's fg has to win.
          color: tone.fg,
          fontSize: size === "sm" ? "0.625rem" : "0.6875rem",
          letterSpacing: "0.08em",
          whiteSpace: "nowrap",
          ...rtlLabel,
        },
        clickable
          ? {
              cursor: "pointer",
              transition: `filter ${MOTION.micro}ms ${MOTION.ease}`,
              "&:hover": { filter: "brightness(0.97)" },
              ...focusRing,
            }
          : null,
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <IconWrapper icon={tone.icon} size={size === "sm" ? 12 : 14} />
      <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
        {text}
      </Box>
      {count !== undefined && (
        <Box
          component="span"
          sx={{ fontFeatureSettings: '"tnum" 1', opacity: 0.85 }}
          aria-hidden={false}
        >
          {"·"} {formatCount(count)}
        </Box>
      )}
    </Box>
  );
}

/* ==========================================================================
 * MetaChip — the meta row atom. No border, no background: it is text with a glyph.
 * ======================================================================== */

export interface MetaChipProps {
  icon?: string;
  children: ReactNode;
  /** The full string, when `children` is clamped. */
  title?: string;
  onDark?: boolean;
  dense?: boolean;
  sx?: SxProps<Theme>;
}

export function MetaChip({ icon, children, title, onDark, dense, sx }: MetaChipProps) {
  return (
    <Box
      component="span"
      title={title}
      sx={[
        {
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          minWidth: 0,
          fontSize: dense ? "0.75rem" : "0.8125rem",
          lineHeight: 1.5,
          fontWeight: 400,
          color: onDark ? J.onDark2 : J.ink3,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {icon && (
        <Box component="span" sx={{ display: "inline-flex", flexShrink: 0, opacity: 0.9 }}>
          <IconWrapper icon={icon} size={dense ? 13 : 14} />
        </Box>
      )}
      <Box
        component="span"
        sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        {children}
      </Box>
    </Box>
  );
}

/* ==========================================================================
 * SkillChip — the skills filter atom. Selected state is `aria-pressed`, so a
 * screen reader hears the filter state rather than inferring it from a tint.
 * ======================================================================== */

export interface SkillChipProps {
  children: ReactNode;
  selected?: boolean;
  onToggle?: () => void;
  /** How many jobs carry this skill. Tabular. */
  count?: number;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}

export function SkillChip({ children, selected, onToggle, count, disabled, sx }: SkillChipProps) {
  const interactive = Boolean(onToggle) && !disabled;
  return (
    <Box
      component={interactive ? "button" : "span"}
      type={interactive ? "button" : undefined}
      onClick={interactive ? onToggle : undefined}
      aria-pressed={interactive ? Boolean(selected) : undefined}
      disabled={interactive ? disabled : undefined}
      sx={[
        {
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          minHeight: { xs: 36, sm: 30 },
          px: 1.25,
          borderRadius: R.ctl,
          border: `1px solid ${selected ? J.azureBorder : J.hairline}`,
          bgcolor: selected ? J.azureSoft : J.surface,
          color: selected ? J.azureDeep : J.ink2,
          fontFamily: "inherit",
          fontSize: "0.75rem",
          fontWeight: 500,
          lineHeight: 1.3,
          cursor: interactive ? "pointer" : "default",
          transition: `border-color ${MOTION.micro}ms ${MOTION.ease}, background-color ${MOTION.micro}ms ${MOTION.ease}`,
          "&:hover": interactive ? { borderColor: J.azureBorder, bgcolor: J.surface2 } : undefined,
          "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
          ...focusRing,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
      {count !== undefined && (
        <Box
          component="span"
          sx={{
            fontFeatureSettings: '"tnum" 1',
            fontSize: "0.6875rem",
            color: selected ? J.azureDeep : J.ink4,
          }}
        >
          {formatCount(count)}
        </Box>
      )}
    </Box>
  );
}

/* ==========================================================================
 * CountPill — "42 applicants", tab counts, "N selected". Always tabular.
 * ======================================================================== */

export interface CountPillProps {
  value: number | string;
  tone?: "neutral" | "azure" | "success" | "warning" | "danger";
  sx?: SxProps<Theme>;
  "aria-hidden"?: boolean;
}

const COUNT_TONES: Record<
  NonNullable<CountPillProps["tone"]>,
  { fg: string; bg: string; bd: string }
> = {
  neutral: { fg: J.ink2, bg: J.surface2, bd: J.hairline },
  azure: { fg: J.azureDeep, bg: J.azureSoft, bd: J.azureBorder },
  success: { fg: J.successFg, bg: J.successBg, bd: J.successBd },
  warning: { fg: J.warnFg, bg: J.warnBg, bd: J.warnBd },
  danger: { fg: J.dangerFg, bg: J.dangerBg, bd: J.dangerBd },
};

export function CountPill({ value, tone = "neutral", sx, ...rest }: CountPillProps) {
  const c = COUNT_TONES[tone];
  return (
    <Typography
      {...rest}
      component="span"
      sx={[
        {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 22,
          height: 22,
          px: 0.75,
          borderRadius: R.pill,
          border: `1px solid ${c.bd}`,
          bgcolor: c.bg,
          color: c.fg,
          fontSize: "0.8125rem",
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          fontFeatureSettings: '"tnum" 1',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {typeof value === "number" ? formatCount(value) : value}
    </Typography>
  );
}
