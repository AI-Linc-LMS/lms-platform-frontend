"use client";

import { useCallback, useRef } from "react";
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CTL_H, J, MOTION, R, focusRing } from "./jobsTokens";
import { CountPill } from "./Chips";

export interface JTab {
  value: string;
  label: string;
  icon?: string;
  count?: number;
  disabled?: boolean;
}

export interface JTabsProps {
  tabs: JTab[];
  value: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
  size?: "sm" | "md";
  /** Names the tablist. Required by section 8. */
  ariaLabel: string;
  /**
   * The id prefix shared with the panel. The panel MUST carry
   * `role="tabpanel" id={`${idPrefix}-panel-${value}`} aria-labelledby={`${idPrefix}-tab-${value}`}`.
   */
  idPrefix: string;
  /** Icon-only segments (the card/list view switch). Labels move to `aria-label`. */
  iconOnly?: boolean;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

/**
 * The segmented track. Real `role="tablist"` semantics with roving `tabIndex` and
 * Home/End/Arrow keys — the shipped tabs have none of this, so a keyboard user cannot reach the
 * Applied pane at all.
 */
export function JTabs({
  tabs,
  value,
  onChange,
  fullWidth = false,
  size = "md",
  ariaLabel,
  idPrefix,
  iconOnly = false,
  sx,
  ...rest
}: JTabsProps) {
  const listRef = useRef<HTMLDivElement | null>(null);

  const move = useCallback(
    (direction: 1 | -1 | "home" | "end") => {
      const enabled = tabs.filter((tab) => !tab.disabled);
      if (!enabled.length) return;
      let next: JTab;
      if (direction === "home") next = enabled[0];
      else if (direction === "end") next = enabled[enabled.length - 1];
      else {
        const current = enabled.findIndex((tab) => tab.value === value);
        const index = (current + direction + enabled.length) % enabled.length;
        next = enabled[index];
      }
      onChange(next.value);
      // Roving focus follows selection, which is the automatic-activation tab pattern.
      requestAnimationFrame(() => {
        listRef.current
          ?.querySelector<HTMLElement>(`[data-tab-value="${CSS.escape(next.value)}"]`)
          ?.focus();
      });
    },
    [onChange, tabs, value],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        move(1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        move(-1);
        break;
      case "Home":
        event.preventDefault();
        move("home");
        break;
      case "End":
        event.preventDefault();
        move("end");
        break;
      default:
        break;
    }
  };

  const height = size === "sm" ? CTL_H.dense : CTL_H.base;

  return (
    <Box
      {...rest}
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      sx={[
        {
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          p: 0.5,
          borderRadius: R.pill,
          border: `1px solid ${J.hairline}`,
          bgcolor: J.surface,
          maxWidth: "100%",
          width: fullWidth ? "100%" : "auto",
          // Never wraps; scrolls with an edge fade below sm.
          overflowX: "auto",
          flexWrap: "nowrap",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          maskImage: {
            xs: "linear-gradient(to right, transparent 0, rgb(0 0 0) 12px, rgb(0 0 0) calc(100% - 12px), transparent 100%)",
            sm: "none",
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <Box
            key={tab.value}
            component="button"
            type="button"
            role="tab"
            data-tab-value={tab.value}
            id={`${idPrefix}-tab-${tab.value}`}
            aria-controls={`${idPrefix}-panel-${tab.value}`}
            aria-selected={selected}
            aria-label={iconOnly ? tab.label : undefined}
            tabIndex={selected ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onChange(tab.value)}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.75,
              flex: fullWidth ? 1 : "0 0 auto",
              minHeight: { xs: CTL_H.touch, sm: height },
              minWidth: iconOnly ? { xs: CTL_H.touch, sm: height } : undefined,
              px: iconOnly ? 1 : size === "sm" ? 1.5 : 2,
              borderRadius: R.pill,
              border: "1px solid transparent",
              bgcolor: selected ? J.azureSoft : "transparent",
              color: selected ? J.azureDeep : J.ink2,
              font: "inherit",
              fontSize: size === "sm" ? "0.8125rem" : "0.875rem",
              fontWeight: selected ? 700 : 500,
              whiteSpace: "nowrap",
              cursor: "pointer",
              transition: `background-color ${MOTION.ctl}ms ${MOTION.ease}, color ${MOTION.ctl}ms ${MOTION.ease}`,
              "&:hover": { bgcolor: selected ? J.azureSoft : J.surface2 },
              "&:disabled": { color: J.ink4, cursor: "not-allowed" },
              ...focusRing,
            }}
          >
            {tab.icon && <IconWrapper icon={tab.icon} size={size === "sm" ? 16 : 18} />}
            {!iconOnly && tab.label}
            {!iconOnly && tab.count !== undefined && (
              <CountPill value={tab.count} tone={selected ? "azure" : "neutral"} />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

/** The panel a JTabs controls. Keeps the aria wiring in one place so it cannot be forgotten. */
export function JTabPanel({
  idPrefix,
  value,
  active,
  children,
  sx,
}: {
  idPrefix: string;
  value: string;
  active: boolean;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      role="tabpanel"
      id={`${idPrefix}-panel-${value}`}
      aria-labelledby={`${idPrefix}-tab-${value}`}
      hidden={!active}
      tabIndex={active ? 0 : -1}
      sx={[{ outline: "none", ...focusRing }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {active ? children : null}
    </Box>
  );
}
