"use client";

import { useCallback, useRef } from "react";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { J, MOTION, R, TYPE, focusRing, srOnly } from "./jobsTokens";

export interface Step {
  key: string;
  label: string;
  hint?: string;
  status: "todo" | "active" | "done" | "error";
  /** Reachable by click and by arrow key. Every passed step, plus any step whose gate is met. */
  enabled: boolean;
}

export interface JStepperProps {
  steps: Step[];
  /** The active step's index. */
  active: number;
  onStepChange: (index: number) => void;
  /** Highest index the user has completed. Used for the compact progress bar. */
  completedThrough?: number;
  /** Names the nav. Required. */
  ariaLabel: string;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

/**
 * The stepper.
 *
 * Three things it fixes:
 *   1. **Orientation is chosen by CSS `display`, never `useMediaQuery`** — which is what makes
 *      the shipped steppers snap from horizontal to vertical on every mobile load.
 *   2. **Below `md` it is a progress bar plus one line of text**, not a vertical MUI stepper
 *      that eats ~200px above the form on every step, under an already tall hero.
 *   3. **Steps are clickable whenever `enabled`.** Editing a closing date must not cost three
 *      Next clicks, and Review must not be reachable only by repeated Back presses.
 *
 * Progress is stated **once**: the horizontal track OR the compact line, never both at once.
 */
export function JStepper({
  steps,
  active,
  onStepChange,
  completedThrough,
  ariaLabel,
  sx,
  ...rest
}: JStepperProps) {
  const { t } = useTranslation("common");
  const navRef = useRef<HTMLElement | null>(null);

  const move = useCallback(
    (direction: 1 | -1 | "home" | "end") => {
      const reachable = steps
        .map((step, index) => ({ step, index }))
        .filter(({ step }) => step.enabled);
      if (!reachable.length) return;
      let target: { step: Step; index: number };
      if (direction === "home") target = reachable[0];
      else if (direction === "end") target = reachable[reachable.length - 1];
      else {
        const current = reachable.findIndex(({ index }) => index === active);
        const next = (current + direction + reachable.length) % reachable.length;
        target = reachable[next];
      }
      onStepChange(target.index);
      requestAnimationFrame(() => {
        navRef.current
          ?.querySelector<HTMLElement>(`[data-step-index="${target.index}"]`)
          ?.focus();
      });
    },
    [active, onStepChange, steps],
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

  const current = steps[active];
  const total = steps.length;
  const done = completedThrough ?? active;
  const progress = total > 0 ? Math.min(100, Math.round(((done + 1) / total) * 100)) : 0;

  const markerColour = (step: Step, index: number) => {
    if (step.status === "error") return { bg: J.dangerBg, fg: J.dangerFg, bd: J.dangerBd };
    if (step.status === "done") return { bg: J.successBg, fg: J.successFg, bd: J.successBd };
    if (index === active) return { bg: J.azureSoft, fg: J.azureDeep, bd: J.azureBorder };
    return { bg: J.surface2, fg: J.ink3, bd: J.hairline };
  };

  return (
    <Box {...rest} sx={[{ minWidth: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      {/* The progress announcement, made once and politely. */}
      <Box aria-live="polite" sx={srOnly}>
        {current
          ? (t("jobsV2.stepper.progress", {
              current: active + 1,
              total,
              label: current.label,
            }) as string)
          : ""}
      </Box>

      {/* ---- md+: the horizontal track --------------------------------- */}
      <Box
        component="nav"
        ref={navRef}
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
        sx={{
          display: { xs: "none", md: "flex" },
          alignItems: "stretch",
          gap: 0,
          borderTop: `1px solid ${J.hairline}`,
          borderBottom: `1px solid ${J.hairline}`,
        }}
      >
        {steps.map((step, index) => {
          const tone = markerColour(step, index);
          const isActive = index === active;
          return (
            <Box
              key={step.key}
              component="button"
              type="button"
              data-step-index={index}
              disabled={!step.enabled}
              aria-current={isActive ? "step" : undefined}
              tabIndex={isActive ? 0 : -1}
              onClick={() => step.enabled && onStepChange(index)}
              sx={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                textAlign: "start",
                px: 2,
                py: 1.75,
                font: "inherit",
                border: "none",
                borderInlineStart: index === 0 ? "none" : `1px solid ${J.hairline}`,
                bgcolor: isActive ? J.azureSoft : "transparent",
                color: J.ink,
                cursor: step.enabled ? "pointer" : "not-allowed",
                transition: `background-color ${MOTION.ctl}ms ${MOTION.ease}`,
                "&:hover": step.enabled && !isActive ? { bgcolor: J.surface2 } : undefined,
                "&:disabled": { color: J.ink4 },
                ...focusRing,
              }}
            >
              <Box
                aria-hidden
                sx={{
                  width: 28,
                  height: 28,
                  flexShrink: 0,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: tone.bg,
                  color: tone.fg,
                  border: `1px solid ${tone.bd}`,
                  fontWeight: 800,
                  fontSize: "0.8125rem",
                  fontFeatureSettings: '"tnum" 1',
                }}
              >
                {step.status === "done" ? (
                  <IconWrapper icon="mdi:check" size={16} />
                ) : step.status === "error" ? (
                  <IconWrapper icon="mdi:exclamation" size={16} />
                ) : (
                  index + 1
                )}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    ...TYPE.h4,
                    color: step.enabled ? (isActive ? J.azureDeep : J.ink) : J.ink4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {step.label}
                </Typography>
                {step.hint && (
                  <Typography sx={{ ...TYPE.micro, mt: 0.25 }}>{step.hint}</Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* ---- below md: a progress bar plus one line -------------------- */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <Box
          role="progressbar"
          aria-valuenow={active + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={ariaLabel}
          sx={{
            height: 4,
            borderRadius: R.pill,
            bgcolor: J.surface3,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: `${progress}%`,
              height: "100%",
              background: J.gradBrand,
              transition: `width ${MOTION.surface}ms ${MOTION.ease}`,
            }}
          />
        </Box>
        <Typography sx={{ ...TYPE.micro, mt: 1, color: J.ink2 }}>
          {t("jobsV2.stepper.compact", {
            current: active + 1,
            total,
            label: current?.label ?? "",
          })}
        </Typography>
        {current?.status === "error" && (
          <Typography sx={{ ...TYPE.small, color: J.dangerFg, mt: 0.5 }} role="alert">
            {t("jobsV2.stepper.hasError")}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
