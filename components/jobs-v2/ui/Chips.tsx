"use client";

import { useState, type ReactNode } from "react";
import { Box, Popover, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { resolveTone, type StatusKind } from "@/lib/jobs-v2/status";
import { deadlineLabel, formatCount, type DeadlineUrgency } from "@/lib/jobs-v2/format";
import { J, MOTION, R, SHADOW, TYPE, focusRing, rtlLabel, type Tone } from "./jobsTokens";

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

/* ==========================================================================
 * SignalChip / DeadlineChip
 *
 * These lived in `board/JobCardV2.tsx` while the card was their only caller. The job-site
 * redesign gives them four more — the rail card, the detail pane, the hero bar and the similar
 * jobs list — so they move UP into the kit rather than being imported sideways out of a board
 * component. `JobCardV2.tsx` re-exports them, so no existing import breaks.
 *
 * Neither is a *status* in the kit's sense (there is no `Tone` for "not eligible"), so
 * `StatusPill` cannot render them — but every colour still comes from a `--j-*` token, so dark
 * works and the accent budget holds.
 *
 * **A badge carries its own justification** (spec 2.3, Wellfound's discipline). `title` states
 * the rule for a pointer; `explain` additionally makes the chip tappable, so a touch user —
 * who has no hover and therefore no tooltip — can read the same sentence. `explain` is opt-in
 * because a chip that is a button is a tab stop, and the rail card's only tab stop is its title.
 * ======================================================================== */

export interface SignalChipProps {
  icon: string;
  children: ReactNode;
  fg: string;
  bg: string;
  bd: string;
  /** Dashed border, so the state survives colour-blindness and a greyscale print. */
  dashed?: boolean;
  /** The rule, in one sentence, for a pointer. */
  title?: string;
  /**
   * The rule, in one sentence, revealed on tap. Makes the chip a real button and a tab stop —
   * use it on the detail pane, not in a dense list.
   */
  explain?: string;
  sx?: SxProps<Theme>;
}

export function SignalChip({
  icon,
  children,
  fg,
  bg,
  bd,
  dashed,
  title,
  explain,
  sx,
}: SignalChipProps) {
  const { t } = useTranslation("common");
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const interactive = Boolean(explain);

  return (
    <>
      <Box
        component={interactive ? "button" : "span"}
        type={interactive ? "button" : undefined}
        title={title ?? explain}
        onClick={
          interactive
            ? (event: React.MouseEvent<HTMLElement>) => setAnchor(event.currentTarget)
            : undefined
        }
        aria-haspopup={interactive ? "dialog" : undefined}
        aria-expanded={interactive ? Boolean(anchor) : undefined}
        aria-label={
          interactive
            ? (t("jobsV2.signal.explainLabel", {
                explanation: explain,
                defaultValue: "Why: {{explanation}}",
              }) as string)
            : undefined
        }
        sx={[
          {
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            minHeight: 24,
            px: 1,
            maxWidth: "100%",
            borderRadius: R.pill,
            border: `1px solid ${bd}`,
            borderStyle: dashed ? "dashed" : "solid",
            bgcolor: bg,
            fontFamily: "inherit",
            ...TYPE.label,
            // TYPE.label carries the muted ink; the signal's own foreground has to win.
            color: fg,
            fontSize: "0.6875rem",
            letterSpacing: "0.08em",
            whiteSpace: "nowrap",
            ...rtlLabel,
          },
          interactive
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
        <IconWrapper icon={icon} size={14} />
        <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {children}
        </Box>
      </Box>

      {interactive && (
        <Popover
          open={Boolean(anchor)}
          anchorEl={anchor}
          onClose={() => setAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          slotProps={{
            paper: {
              role: "dialog",
              sx: {
                mt: 0.5,
                p: 1.5,
                maxWidth: 280,
                borderRadius: R.inner,
                border: `1px solid ${J.hairline}`,
                bgcolor: J.surface,
                backgroundImage: "none",
                boxShadow: SHADOW.overlay,
              },
            },
          }}
        >
          <Typography sx={TYPE.small}>{explain}</Typography>
        </Popover>
      )}
    </>
  );
}

const URGENCY_TONE: Record<DeadlineUrgency, { fg: string; bg: string; bd: string }> = {
  urgent: { fg: J.dangerFg, bg: J.dangerBg, bd: J.dangerBd },
  soon: { fg: J.warnFg, bg: J.warnBg, bd: J.warnBd },
  past: { fg: J.ink3, bg: J.surface2, bd: J.hairline },
  none: { fg: J.ink3, bg: J.surface2, bd: J.hairline },
};

/**
 * The closing date, tinted by urgency. Three days out no longer looks like three months out.
 *
 * **This is our honest urgency** — an employer-stated deadline. We never ship the other kind
 * ("urgently hiring", "be an early applicant"), which is a paid placement wearing a fact's
 * clothes. Renders nothing when no deadline was stated.
 */
export function DeadlineChip({ value, explain }: { value?: string; explain?: string }) {
  const label = deadlineLabel(value);
  if (!label) return null;
  const tone = URGENCY_TONE[label.urgency];
  return (
    <SignalChip
      icon={label.urgency === "past" ? "mdi:calendar-remove-outline" : "mdi:calendar-clock"}
      fg={tone.fg}
      bg={tone.bg}
      bd={tone.bd}
      title={label.text}
      explain={explain}
    >
      {label.text}
    </SignalChip>
  );
}
