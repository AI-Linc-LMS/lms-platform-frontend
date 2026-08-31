"use client";

import { useState, type ReactNode } from "react";
import { Box, Popover, Typography, useMediaQuery, useTheme } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { formatCount } from "@/lib/jobs-v2/format";
import { CTL_H, J, MOTION, R, SHADOW, TYPE, focusRing, srOnly } from "./jobsTokens";
import { CountPill } from "./Chips";
import { JButton } from "./JButton";
import { JModal } from "./JModal";

/**
 * **Filters are one row of popover buttons, identical at every breakpoint.**
 *
 * This deletes the desktop sidebar, the separate mobile filter block, the desktop/mobile
 * parity gap, the location de-duplication written three times, the two independent location
 * controls writing to two independent states, and 280px of horizontal space on the board.
 */
export function FilterBar({
  children,
  /** Rendered first and never scrolled away — usually the search box. */
  primary,
  dense,
  sx,
  ...rest
}: {
  children: ReactNode;
  primary?: ReactNode;
  dense?: boolean;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}) {
  return (
    <Box
      {...rest}
      sx={[
        { display: "flex", flexDirection: "column", gap: 1.5, minWidth: 0 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {primary}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          minWidth: 0,
          // Below sm the row scrolls horizontally instead of stacking into four full-width
          // rows that push the first result below the fold.
          overflowX: { xs: "auto", md: "visible" },
          flexWrap: { xs: "nowrap", md: "wrap" },
          pb: { xs: 0.5, md: 0 },
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          ...(dense ? { gap: 0.75 } : null),
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export interface FilterPopoverProps {
  label: string;
  icon?: string;
  /** How many values are selected in this filter. Renders as a tabular badge. */
  badge?: number;
  /** Truthy when the filter is set, even without a count (a single-value select). */
  active?: boolean;
  children: ReactNode | ((close: () => void) => ReactNode);
  /** Clears just this filter, shown in the popover footer. */
  onClear?: () => void;
  disabled?: boolean;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

/** One filter, in a popover on `md+` and a `JModal size="sm"` below it. */
export function FilterPopover({
  label,
  icon,
  badge,
  active,
  children,
  onClear,
  disabled,
  sx,
  ...rest
}: FilterPopoverProps) {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("md"));
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const isActive = Boolean(active) || (badge ?? 0) > 0;
  const open = isCompact ? sheetOpen : Boolean(anchor);
  const close = () => {
    setAnchor(null);
    setSheetOpen(false);
  };

  const body = typeof children === "function" ? children(close) : children;

  return (
    <>
      <Box
        {...rest}
        component="button"
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(event: React.MouseEvent<HTMLElement>) => {
          if (isCompact) setSheetOpen(true);
          else setAnchor(event.currentTarget);
        }}
        sx={[
          {
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            flexShrink: 0,
            minHeight: { xs: CTL_H.touch, md: CTL_H.base },
            px: 1.75,
            borderRadius: R.pill,
            border: `1px solid ${isActive ? J.azureBorder : J.hairline}`,
            bgcolor: isActive ? J.azureSoft : J.surface,
            color: isActive ? J.azureDeep : J.ink2,
            font: "inherit",
            fontSize: "0.875rem",
            fontWeight: isActive ? 700 : 500,
            whiteSpace: "nowrap",
            cursor: "pointer",
            transition: `border-color ${MOTION.micro}ms ${MOTION.ease}, background-color ${MOTION.micro}ms ${MOTION.ease}`,
            "&:hover": { borderColor: J.azureBorder, bgcolor: isActive ? J.azureSoft : J.surface2 },
            "&:disabled": { color: J.ink4, cursor: "not-allowed" },
            ...focusRing,
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {icon && <IconWrapper icon={icon} size={16} />}
        {label}
        {badge !== undefined && badge > 0 && (
          <Box component="span" sx={{ fontFeatureSettings: '"tnum" 1', fontWeight: 800 }}>
            {formatCount(badge)}
          </Box>
        )}
        <IconWrapper icon="mdi:chevron-down" size={16} />
      </Box>

      {isCompact ? (
        <JModal
          open={sheetOpen}
          onClose={close}
          title={label}
          size="sm"
          footer={
            <>
              {onClear ? (
                <JButton variant="quiet" onClick={onClear}>
                  {t("jobsV2.filters.clearThis")}
                </JButton>
              ) : (
                <span />
              )}
              <JButton variant="primary" onClick={close}>
                {t("jobsV2.filters.done")}
              </JButton>
            </>
          }
        >
          {body}
        </JModal>
      ) : (
        <Popover
          open={Boolean(anchor)}
          anchorEl={anchor}
          onClose={close}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          slotProps={{
            paper: {
              role: "dialog",
              "aria-label": label,
              sx: {
                mt: 0.75,
                p: 2,
                minWidth: 260,
                maxWidth: 360,
                maxHeight: 420,
                overflowY: "auto",
                overscrollBehavior: "contain",
                borderRadius: R.inner,
                border: `1px solid ${J.hairline}`,
                bgcolor: J.surface,
                backgroundImage: "none",
                boxShadow: SHADOW.overlay,
              },
            },
          }}
        >
          {body}
          {onClear && (
            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${J.hairlineSoft}` }}>
              <JButton variant="quiet" size="sm" onClick={onClear}>
                {t("jobsV2.filters.clearThis")}
              </JButton>
            </Box>
          )}
        </Popover>
      )}
    </>
  );
}

export interface ActiveFilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

/**
 * **Mandatory on every filtered list in the module.** It is the only way to see what is applied,
 * and the escape hatch from a zero-result dead end.
 */
export function ActiveFilters({
  chips,
  onClearAll,
  sx,
  ...rest
}: {
  chips: ActiveFilterChip[];
  onClearAll: () => void;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}) {
  const { t } = useTranslation("common");
  if (!chips.length) return null;

  return (
    <Box
      {...rest}
      role="region"
      aria-label={t("jobsV2.filters.activeLabel") as string}
      sx={[
        { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, minWidth: 0 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {chips.map((chip) => (
        <Box
          key={chip.key}
          component="button"
          type="button"
          onClick={chip.onRemove}
          aria-label={t("jobsV2.filters.remove", { filter: chip.label }) as string}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            minHeight: { xs: 36, md: 30 },
            px: 1.25,
            borderRadius: R.pill,
            border: `1px solid ${J.azureBorder}`,
            bgcolor: J.azureSoft,
            color: J.azureDeep,
            font: "inherit",
            fontSize: "0.75rem",
            fontWeight: 500,
            cursor: "pointer",
            "&:hover": { filter: "brightness(0.98)" },
            ...focusRing,
          }}
        >
          <Box component="span" sx={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>
            {chip.label}
          </Box>
          <IconWrapper icon="mdi:close" size={14} />
        </Box>
      ))}
      <JButton variant="quiet" size="sm" onClick={onClearAll}>
        {t("jobsV2.filters.clearAll")}
      </JButton>
    </Box>
  );
}

/* ==========================================================================
 * FacetList — counts are the load-bearing feature
 *
 * Every option in every popover carries a live count computed over **the student's own visible
 * set**, leave-one-out: the count for option `o` of facet `f` is the size of the result set with
 * every filter applied EXCEPT `f`, filtered to `o`. That is Naukri's one genuinely load-bearing
 * feature, and it is cheap for us because our set is small.
 *
 * **A zero-count option renders disabled, not hidden.** Hiding it makes the facet list shift
 * under the cursor between openings; disabling it tells the student the truth ("Remote: 0").
 *
 * The one thing a count must never be is a total that is not the student's own. Visibility is
 * per-student, so a marketing "500 jobs" and the number above this list are different facts.
 * ======================================================================== */

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

export interface FacetListProps {
  options: FacetOption[];
  selected: string[];
  onToggle: (value: string) => void;
  /** Multi-select (the default). Single-select still reports `aria-pressed`, per option. */
  multiple?: boolean;
  /** Then a "View more" disclosure — Naukri's gesture, which Indian students already know. */
  initialVisible?: number;
  emptyLabel?: string;
  ariaLabel?: string;
  sx?: SxProps<Theme>;
}

export function FacetList({
  options,
  selected,
  onToggle,
  multiple = true,
  initialVisible = 4,
  emptyLabel,
  ariaLabel,
  sx,
}: FacetListProps) {
  const { t } = useTranslation("common");
  const [expanded, setExpanded] = useState(false);

  if (!options.length) {
    return (
      <Typography sx={{ ...TYPE.small, color: J.ink4 }}>
        {emptyLabel ?? (t("jobsV2.filters.noOptions", { defaultValue: "Nothing to filter on" }) as string)}
      </Typography>
    );
  }

  const shown = expanded ? options : options.slice(0, initialVisible);
  const hidden = options.length - shown.length;
  const chosen = new Set(selected);

  return (
    <Box sx={[{ minWidth: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <Box
        role="group"
        aria-label={ariaLabel}
        sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}
      >
        {shown.map((option) => {
          const isSelected = chosen.has(option.value);
          // Zero means "this option excludes everything you are already looking at" — which is
          // information. It is disabled, and it stays in place.
          const empty = option.count === 0 && !isSelected;
          return (
            <Box
              key={option.value}
              component="button"
              type="button"
              role={multiple ? undefined : "radio"}
              aria-checked={multiple ? undefined : isSelected}
              aria-pressed={multiple ? isSelected : undefined}
              disabled={empty}
              onClick={() => onToggle(option.value)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                width: "100%",
                minHeight: { xs: CTL_H.touch, md: 34 },
                px: 1,
                borderRadius: R.ctl,
                border: "1px solid transparent",
                borderColor: isSelected ? J.azureBorder : "transparent",
                bgcolor: isSelected ? J.azureSoft : "transparent",
                color: isSelected ? J.azureDeep : J.ink2,
                font: "inherit",
                fontSize: "0.875rem",
                fontWeight: isSelected ? 700 : 400,
                textAlign: "start",
                cursor: "pointer",
                transition: `background-color ${MOTION.micro}ms ${MOTION.ease}`,
                "&:hover:not(:disabled)": { bgcolor: isSelected ? J.azureSoft : J.surface2 },
                "&:disabled": { color: J.ink4, cursor: "not-allowed" },
                ...focusRing,
              }}
            >
              <Box
                component="span"
                sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {option.label}
              </Box>
              <CountPill
                value={option.count}
                sx={{
                  flexShrink: 0,
                  bgcolor: "transparent",
                  borderColor: "transparent",
                  color: empty ? J.ink4 : J.ink3,
                  fontWeight: 500,
                  fontSize: "0.75rem",
                }}
              />
            </Box>
          );
        })}
      </Box>

      {(hidden > 0 || expanded) && options.length > initialVisible && (
        <Box sx={{ mt: 0.5 }}>
          <JButton
            variant="quiet"
            size="sm"
            aria-expanded={expanded}
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded
              ? (t("jobsV2.filters.viewLess", { defaultValue: "View less" }) as string)
              : (t("jobsV2.filters.viewMore", {
                  count: hidden,
                  defaultValue: "View more ({{count}})",
                }) as string)}
          </JButton>
        </Box>
      )}
    </Box>
  );
}

/* ==========================================================================
 * SegmentedToggle — "Only jobs I'm eligible for"
 *
 * Eligibility is promoted out of the popovers into a first-class toggle that is always visible
 * and always first, because it is the question this audience asks before any other. It is a
 * pill, not a popover: a two-state filter that costs a click to open is a filter nobody uses.
 * ======================================================================== */

export interface SegmentedToggleProps {
  label: string;
  icon?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  /** How many jobs the toggle would leave. Tabular, and always the student's own number. */
  count?: number;
  disabled?: boolean;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

export function SegmentedToggle({
  label,
  icon,
  checked,
  onChange,
  count,
  disabled,
  sx,
  ...rest
}: SegmentedToggleProps) {
  return (
    <Box
      {...rest}
      component="button"
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      sx={[
        {
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          flexShrink: 0,
          minHeight: { xs: CTL_H.touch, md: CTL_H.base },
          px: 1.75,
          borderRadius: R.pill,
          border: `1px solid ${checked ? J.azureBorder : J.hairline}`,
          bgcolor: checked ? J.azureSoft : J.surface,
          color: checked ? J.azureDeep : J.ink2,
          font: "inherit",
          fontSize: "0.875rem",
          fontWeight: checked ? 700 : 500,
          whiteSpace: "nowrap",
          cursor: "pointer",
          transition: `border-color ${MOTION.micro}ms ${MOTION.ease}, background-color ${MOTION.micro}ms ${MOTION.ease}`,
          "&:hover:not(:disabled)": { borderColor: J.azureBorder, bgcolor: checked ? J.azureSoft : J.surface2 },
          "&:disabled": { color: J.ink4, cursor: "not-allowed" },
          ...focusRing,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {icon && (
        <IconWrapper icon={checked ? "mdi:check-circle" : icon} size={16} />
      )}
      {label}
      {count !== undefined && (
        <Box component="span" sx={{ fontFeatureSettings: '"tnum" 1', fontWeight: 800, opacity: 0.9 }}>
          {formatCount(count)}
        </Box>
      )}
    </Box>
  );
}

/* ==========================================================================
 * FilterSheet — deferred apply, mobile only
 *
 * Desktop filtering is instant: the result count is already on screen, so a toggle should just
 * work. Mobile is the opposite — the list is behind the sheet — so the sheet defers, and its
 * **footer button states the outcome**: "Show 84 jobs", live-counted as you toggle, and disabled
 * at zero with the way out named rather than a dead grey button.
 * ======================================================================== */

export interface FilterSheetGroup {
  key: string;
  label: string;
  node: ReactNode;
}

export interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  groups: FilterSheetGroup[];
  /** The footer button's live number. */
  resultCount: number;
  onApply: () => void;
  onClearAll: () => void;
  /** Shown in the header, so "Filters (3)" and the sheet agree. */
  activeCount?: number;
}

export function FilterSheet({
  open,
  onClose,
  groups,
  resultCount,
  onApply,
  onClearAll,
  activeCount,
}: FilterSheetProps) {
  const { t } = useTranslation("common");
  const none = resultCount === 0;

  return (
    <JModal
      open={open}
      onClose={onClose}
      title={t("jobsV2.filters.title", { defaultValue: "Filters" }) as string}
      description={
        activeCount
          ? (t("jobsV2.filters.activeCount", {
              count: activeCount,
              defaultValue: "{{count}} applied",
            }) as string)
          : undefined
      }
      icon="mdi:filter-variant"
      size="md"
      // A keyboard must not crush a full page of facets into a 40% sheet.
      mobile="fullscreen"
      footer={
        <>
          <JButton variant="quiet" onClick={onClearAll}>
            {t("jobsV2.filters.clearAll")}
          </JButton>
          <JButton
            variant="primary"
            fullWidth
            onClick={() => {
              onApply();
              onClose();
            }}
            disabledReason={
              none
                ? (t("jobsV2.filters.noMatchHint", {
                    defaultValue: "No jobs match — try removing a filter",
                  }) as string)
                : undefined
            }
          >
            {none
              ? (t("jobsV2.filters.noMatch", { defaultValue: "No jobs match" }) as string)
              : (t("jobsV2.filters.showN", {
                  count: resultCount,
                  defaultValue: "Show {{count}} jobs",
                }) as string)}
          </JButton>
        </>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {groups.map((group) => (
          <Box key={group.key} component="section" aria-labelledby={`filter-group-${group.key}`}>
            <Typography id={`filter-group-${group.key}`} sx={{ ...TYPE.label, mb: 1 }}>
              {group.label}
            </Typography>
            {group.node}
          </Box>
        ))}
      </Box>
      {/* The count is announced, not only painted, because the footer button is the only place
          a screen-reader user learns that a toggle changed the result set. */}
      <Box aria-live="polite" sx={srOnly}>
        {t("jobsV2.filters.showN", { count: resultCount, defaultValue: "Show {{count}} jobs" })}
      </Box>
    </JModal>
  );
}
