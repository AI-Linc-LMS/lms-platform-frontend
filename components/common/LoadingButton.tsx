"use client";

import { CircularProgress, Button } from "@mui/material";
import type { ButtonProps } from "@mui/material";

export interface LoadingButtonProps extends ButtonProps {
  /** Show spinner and disable the button */
  loading?: boolean;
  /** Label shown while loading (falls back to children) */
  loadingText?: React.ReactNode;
}

/**
 * MUI Button with:
 * - CircularProgress spinner while `loading` is true
 * - Automatic disabled state during loading
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
  ...rest
}: LoadingButtonProps) {
  return (
    <Button
      {...rest}
      disabled={disabled || loading}
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
        // ── touch responsiveness ──────────────────────────────────────
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        userSelect: "none",
        // Minimum 44 px touch target on mobile
        minHeight: { xs: 44, sm: "unset" },
        // Tactile press feedback (both mouse & touch)
        "&&:active": {
          transform: "scale(0.97)",
          opacity: 0.88,
        },
        transition: "transform 0.12s ease, opacity 0.12s ease, box-shadow 0.18s ease, background-color 0.18s ease",
        // ─────────────────────────────────────────────────────────────
        ...sx,
      }}
    >
      {loading && loadingText !== undefined ? loadingText : children}
    </Button>
  );
}
