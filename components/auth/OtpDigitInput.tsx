"use client";

import { useRef, useCallback, type KeyboardEvent, type ClipboardEvent } from "react";
import { Box, InputBase, Typography, FormHelperText } from "@mui/material";
import { useField } from "formik";

const SLOT_COUNT = 6;

type OtpDigitInputProps = {
  name: string;
  /** Shown above the boxes (e.g. translated "OTP code") */
  label?: string;
};

/**
 * Six single-digit boxes. Entry is sequential (auto-advance); paste fills all slots.
 * Formik value is a string of digits, length 0–6.
 */
export function OtpDigitInput({ name, label }: OtpDigitInputProps) {
  const [field, meta, helpers] = useField(name);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const value = String(field.value ?? "").replace(/\D/g, "").slice(0, SLOT_COUNT);
  const digits = Array.from({ length: SLOT_COUNT }, (_, i) => value[i] ?? "");
  const showError = meta.touched && !!meta.error;

  const setValue = useCallback(
    (next: string) => {
      helpers.setValue(next.replace(/\D/g, "").slice(0, SLOT_COUNT));
    },
    [helpers]
  );

  const focusSlot = (index: number) => {
    const i = Math.max(0, Math.min(SLOT_COUNT - 1, index));
    requestAnimationFrame(() => {
      const el = inputRefs.current[i];
      el?.focus();
      el?.select();
    });
  };

  const handleChange = (index: number, raw: string) => {
    const pasted = raw.replace(/\D/g, "");
    if (pasted.length > 1) {
      setValue(pasted);
      focusSlot(Math.min(pasted.length, SLOT_COUNT - 1));
      return;
    }
    const char = pasted.slice(-1) || "";

    if (char) {
      if (index < value.length) {
        setValue(value.slice(0, index) + char + value.slice(index + 1));
        if (index < SLOT_COUNT - 1) focusSlot(index + 1);
      } else if (index === value.length) {
        setValue(value + char);
        if (value.length < SLOT_COUNT - 1) focusSlot(index + 1);
      } else {
        focusSlot(value.length);
      }
      return;
    }

    setValue(value.slice(0, index) + value.slice(index + 1));
  };

  const handleKeyDown = (
    index: number,
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        setValue(value.slice(0, index) + value.slice(index + 1));
      } else if (index > 0) {
        setValue(value.slice(0, index - 1) + value.slice(index));
        focusSlot(index - 1);
      }
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      focusSlot(index - 1);
      e.preventDefault();
    }
    if (e.key === "ArrowRight" && index < SLOT_COUNT - 1) {
      focusSlot(index + 1);
      e.preventDefault();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, SLOT_COUNT);
    if (text) {
      setValue(text);
      focusSlot(Math.min(text.length, SLOT_COUNT - 1));
    }
  };

  return (
    <Box sx={{ mb: 1.5 }}>
      {label ? (
        <Typography
          component="label"
          htmlFor={`${name}-otp-0`}
          variant="body2"
          sx={{
            display: "block",
            mb: 1,
            fontWeight: 500,
            color: showError ? "error.main" : "text.primary",
          }}
        >
          {label}
        </Typography>
      ) : null}
      <Box
        component="fieldset"
        sx={{
          border: "none",
          p: 0,
          m: 0,
          display: "flex",
          gap: { xs: 0.75, sm: 1 },
          justifyContent: "space-between",
        }}
      >
        {digits.map((digit, index) => (
          <InputBase
            key={index}
            id={index === 0 ? `${name}-otp-0` : undefined}
            inputRef={(el) => {
              inputRefs.current[index] = el;
            }}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            readOnly={index > value.length}
            onBlur={() => helpers.setTouched(true)}
            name={index === 0 ? name : `${name}-slot-${index}`}
            inputProps={{
              maxLength: 1,
              inputMode: "numeric" as const,
              pattern: "[0-9]*",
              "aria-label": label ? `${label} digit ${index + 1}` : `Digit ${index + 1}`,
              autoComplete: index === 0 ? "one-time-code" : "off",
            }}
            sx={{
              flex: 1,
              minWidth: 0,
              maxWidth: 52,
              "& .MuiInputBase-input": {
                textAlign: "center",
                fontSize: { xs: "1.25rem", sm: "1.375rem" },
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                py: 1.25,
                px: 0.5,
                borderRadius: 1.5,
                border: "1.5px solid",
                borderColor: showError ? "error.main" : "divider",
                bgcolor: "background.paper",
                transition: "border-color 0.15s, box-shadow 0.15s",
                "&:hover": {
                  borderColor: showError ? "error.main" : "primary.light",
                },
                "&:focus": {
                  borderColor: showError ? "error.main" : "primary.main",
                  boxShadow: (theme) =>
                    showError
                      ? `0 0 0 2px ${theme.palette.error.main}33`
                      : `0 0 0 2px ${theme.palette.primary.main}33`,
                },
              },
            }}
          />
        ))}
      </Box>
      {showError ? (
        <FormHelperText error sx={{ mx: 0, mt: 0.75 }}>
          {meta.error}
        </FormHelperText>
      ) : null}
    </Box>
  );
}
