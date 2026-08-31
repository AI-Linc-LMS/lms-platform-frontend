"use client";

import { useCallback, useEffect, useRef } from "react";
import { Box, CircularProgress, IconButton, InputBase } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CTL_H, J, MOTION, R, focusRing } from "./jobsTokens";

export interface SearchInputProps {
  value: string;
  /** Fires on every keystroke — it owns the input's text and nothing else. */
  onChange: (value: string) => void;
  /** Fires once, `debounceMs` after typing stops, and immediately on Enter or the magnifier. */
  onSubmit: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  loading?: boolean;
  /** Required: a search box with no accessible name is unusable by screen reader. */
  ariaLabel: string;
  disabled?: boolean;
  autoFocus?: boolean;
  maxWidth?: number | string;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

/**
 * ONE search semantic.
 *
 * The board currently runs a debounced server search AND a second, different, client-side
 * filter on every keystroke, so results change once before you finish typing and again after.
 * Here `onChange` owns the text; a single debounce fires `onSubmit`; Enter and the magnifier
 * fire it immediately. There is no second filter.
 */
export function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  debounceMs = 300,
  loading,
  ariaLabel,
  disabled,
  autoFocus,
  maxWidth,
  sx,
  ...rest
}: SearchInputProps) {
  const { t } = useTranslation("common");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitRef = useRef(onSubmit);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // The debounce fires the LATEST onSubmit without re-creating the timer on every render.
  useEffect(() => {
    submitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const schedule = useCallback(
    (next: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => submitRef.current(next), debounceMs);
    },
    [debounceMs],
  );

  const submitNow = useCallback((next: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    submitRef.current(next);
  }, []);

  return (
    <Box
      {...rest}
      role="search"
      sx={[
        {
          display: "flex",
          alignItems: "center",
          gap: 1,
          width: "100%",
          maxWidth: maxWidth ?? "100%",
          minHeight: CTL_H.touch,
          px: 1.5,
          borderRadius: R.pill,
          border: `1px solid ${J.hairline}`,
          bgcolor: disabled ? J.surface3 : J.surface,
          transition: `border-color ${MOTION.ctl}ms ${MOTION.ease}, box-shadow ${MOTION.ctl}ms ${MOTION.ease}`,
          "&:hover": { borderColor: disabled ? J.hairline : J.hairlineStrong },
          "&:focus-within": { borderColor: J.azure, boxShadow: "var(--j-focus-ring)" },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box sx={{ display: "inline-flex", color: J.ink3, flexShrink: 0 }} aria-hidden>
        <IconWrapper icon="mdi:magnify" size={18} />
      </Box>
      <InputBase
        inputRef={inputRef}
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder={placeholder ?? (t("jobsV2.search.placeholder") as string)}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next);
          schedule(next);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submitNow(value);
          }
          if (event.key === "Escape" && value) {
            event.preventDefault();
            onChange("");
            submitNow("");
          }
        }}
        inputProps={{
          role: "searchbox",
          "aria-label": ariaLabel,
          type: "search",
          enterKeyHint: "search",
        }}
        sx={{
          flex: 1,
          minWidth: 0,
          fontSize: "0.875rem",
          color: J.ink,
          "& input": { p: 0 },
          "& input::placeholder": { color: J.ink4, opacity: 1 },
          "& input::-webkit-search-cancel-button": { display: "none" },
        }}
      />
      {loading && (
        <CircularProgress size={16} thickness={4} sx={{ color: J.azure, flexShrink: 0 }} />
      )}
      {value && !loading && (
        <IconButton
          size="small"
          aria-label={t("jobsV2.search.clear") as string}
          onClick={() => {
            onChange("");
            submitNow("");
            inputRef.current?.focus();
          }}
          sx={{
            flexShrink: 0,
            color: J.ink3,
            minWidth: 32,
            minHeight: 32,
            "&:hover": { bgcolor: J.surface2, color: J.ink },
            ...focusRing,
          }}
        >
          <IconWrapper icon="mdi:close" size={16} />
        </IconButton>
      )}
    </Box>
  );
}
