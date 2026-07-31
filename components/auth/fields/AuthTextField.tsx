"use client";

import { ReactNode } from "react";
import { Box, TextField, Typography } from "@mui/material";
import {
  AUTH,
  CONTROL_HEIGHT,
  EASE,
  FONT,
  RADIUS,
  TYPE,
  focusRing,
  hairlineRing,
} from "../layout/authTokens";

interface AuthTextFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  error?: boolean;
  /** Rendered under the field and wired via aria-describedby. Never a toast. */
  helperText?: ReactNode;
  endAdornment?: ReactNode;
  /** One-time codes, emails and phone numbers stay LTR inside an RTL page. */
  dir?: "ltr" | "rtl";
  disabled?: boolean;
  autoFocus?: boolean;
  name?: string;
  value?: unknown;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  inputProps?: Record<string, unknown>;
}

/**
 * The one input in the auth surface.
 *
 * Replaces the per-page TextField blocks that duplicated the same sx object and the same
 * MuiFormHelperText override on four pages. Three things it does that the old fields did not:
 *
 * 1. A persistent visible label above the field. Placeholder-as-label loses the question the
 *    moment a user starts typing, and fails WCAG 2.2 Accessible Authentication.
 * 2. The border is a box-shadow, not a CSS border, so the focus ring costs zero layout and
 *    the field never nudges its neighbours on focus.
 * 3. 16px text on mobile. Below 16px, iOS Safari zooms the viewport on focus.
 */
export function AuthTextField({
  id,
  label,
  type = "text",
  placeholder,
  autoComplete,
  required,
  error,
  helperText,
  endAdornment,
  dir,
  disabled,
  autoFocus,
  name,
  value,
  onChange,
  onBlur,
  inputProps,
}: AuthTextFieldProps) {
  const describedBy = helperText ? `${id}-helper` : undefined;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mb: 1.5 }}>
      <Typography
        component="label"
        htmlFor={id}
        sx={{ ...TYPE.label, fontFamily: FONT, color: AUTH.inkMuted }}
      >
        {label}
      </Typography>

      <TextField
        id={id}
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        fullWidth
        error={error}
        dir={dir}
        aria-describedby={describedBy}
        aria-invalid={error || undefined}
        InputProps={{ endAdornment }}
        inputProps={inputProps}
        sx={{
          "& .MuiOutlinedInput-root": {
            minHeight: CONTROL_HEIGHT,
            borderRadius: `${RADIUS}px`,
            backgroundColor: AUTH.surface,
            fontFamily: FONT,
            fontSize: { xs: 16, sm: 15 },
            color: AUTH.ink,
            boxShadow: hairlineRing(error ? AUTH.error : AUTH.hairline),
            transition: `box-shadow 160ms ${EASE}`,
            "& fieldset": { border: "none" },
            "&:hover": {
              boxShadow: hairlineRing(error ? AUTH.error : "#d5d8e3"),
            },
            "&.Mui-focused": {
              boxShadow: focusRing(),
            },
            "&.Mui-disabled": {
              backgroundColor: AUTH.canvas,
              boxShadow: hairlineRing(),
            },
          },
          // MUI ships `padding: 16.5px 14px` on the input, which alone is taller than the
          // 44px control height DESIGN.md specifies, so `minHeight` above never bound and
          // fields rendered at 54.6px. Setting the padding explicitly is what actually
          // controls the height.
          "& .MuiOutlinedInput-input": {
            padding: "11px 14px",
          },
          "& .MuiOutlinedInput-input::placeholder": {
            color: AUTH.inkFaint,
            opacity: 1,
          },
        }}
      />

      {/* The helper row is always present, even when empty.
          Rendering it conditionally meant the submit button dropped 22.8px the moment
          validation failed, so it moved out from under the cursor that had just clicked it.
          Reserving the row costs 17px per field and the shorter control height pays for it. */}
      <Box
        id={describedBy}
        role={error ? "alert" : undefined}
        // The line box has to be pinned, not just the min-height. Left to inherit, the
        // empty row measured 17px while the filled row inherited the parent's larger
        // strut and measured 24px, which put 7px of the shift back.
        sx={{ minHeight: 17, mt: 0.25, fontSize: 12, lineHeight: "17px" }}
      >
        {helperText ? (
          <Typography
            component="span"
            sx={{
              ...TYPE.eyebrow,
              fontFamily: FONT,
              letterSpacing: 0,
              color: error ? AUTH.error : AUTH.inkFaint,
            }}
          >
            {helperText}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}
