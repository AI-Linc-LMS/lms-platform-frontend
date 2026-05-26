"use client";

import { CircularProgress, Button } from "@mui/material";
import type { ButtonProps } from "@mui/material";

export interface LoadingButtonProps extends ButtonProps {
  /** Show spinner and block interaction — button keeps its colours */
  loading?: boolean;
  /** Text shown while loading (falls back to children) */
  loadingText?: React.ReactNode;
  /** Forwarded to the root element — needed when component="label" wraps a file input */
  htmlFor?: string;
}

/**
 * MUI Button with:
 * - CircularProgress spinner while `loading` is true
 * - Button keeps its colours while loading (NOT grayed out)
 *   → we block interaction via `pointerEvents: none` instead of `disabled`
 *   → `disabled` prop still works independently for the "truly disabled" state
 * - Cross-platform touch responsiveness:
 *   – removes the blue tap-highlight on iOS/Android
 *   – prevents the 300 ms double-tap delay
 *   – enforces a 44 px minimum touch target on mobile
 *   – subtle scale-down on press for tactile feedback
 */
export function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  sx,
  startIcon,
  onClick,
  ...rest
}: LoadingButtonProps) {
  return (
    <Button
      {...rest}
      // Only use MUI `disabled` for the caller's explicit disabled state.
      // When loading we block interaction ourselves — this preserves the
      // button's background/text colours so the spinner + text stay visible.
      disabled={disabled}
      aria-busy={loading || undefined}
      onClick={
        loading
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
            }
          : onClick
      }
      startIcon={
        loading ? (
          <CircularProgress
            size={18}
            thickness={4}
            sx={{ color: "inherit", flexShrink: 0 }}
          />
        ) : (
          startIcon
        )
      }
      sx={{
        // Block all interaction while loading without changing appearance
        ...(loading && {
          pointerEvents: "none",
          opacity: 0.82,
          cursor: "default",
        }),
        // ── touch responsiveness ──────────────────────────────────────
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        userSelect: "none",
        // Minimum 44 px touch target on mobile
        minHeight: { xs: 44, sm: "unset" },
        // Tactile press feedback (mouse & touch)
        "&&:active": {
          transform: "scale(0.97)",
          opacity: 0.88,
        },
        transition:
          "transform 0.12s ease, opacity 0.15s ease, box-shadow 0.18s ease, background-color 0.18s ease",
        // ─────────────────────────────────────────────────────────────
        ...sx,
      }}
    >
      {loading && loadingText !== undefined ? loadingText : children}
    </Button>
  );
}
