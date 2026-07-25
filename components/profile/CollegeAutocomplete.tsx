"use client";

import { useEffect, useRef, useState } from "react";
import { Autocomplete, Box, CircularProgress, TextField, Typography } from "@mui/material";
import { collegesService, type CollegeOption } from "@/lib/services/colleges.service";

/**
 * Searchable college / university picker backed by the global college
 * master-data endpoint, with **free-text fallback** (`freeSolo`): if a learner's
 * institution isn't in the list they can still type it, and it's stored as a
 * plain string exactly like before. Debounced server search (250ms).
 *
 * The field's value is a plain string (the college name), so this is a
 * drop-in replacement for the free-text TextField it supersedes - it keeps the
 * same `value: string` / `onChange(name: string)` contract.
 */
export function CollegeAutocomplete({
  value,
  onChange,
  label,
  placeholder = "Search or type your college",
  required = false,
  error = false,
  helperText,
  size = "small",
  fullWidth = true,
}: {
  value: string;
  onChange: (name: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  size?: "small" | "medium";
  fullWidth?: boolean;
}) {
  const [input, setInput] = useState(value || "");
  const [options, setOptions] = useState<CollegeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reflect an externally-set value (e.g. editing an existing entry).
  useEffect(() => {
    setInput((prev) => (prev === (value || "") ? prev : value || ""));
  }, [value]);

  // Debounced server-side search on the typed text.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await collegesService.search(input, 20);
        setOptions(res);
      } catch {
        setOptions([]); // fail soft - free typing still works
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input]);

  return (
    <Autocomplete<CollegeOption, false, false, true>
      freeSolo
      fullWidth={fullWidth}
      options={options}
      loading={loading}
      // Server already filtered; never re-filter client-side.
      filterOptions={(x) => x}
      getOptionLabel={(o) => (typeof o === "string" ? o : o.name)}
      inputValue={input}
      onInputChange={(_, v) => {
        setInput(v);
        onChange(v);
      }}
      onChange={(_, v) => {
        const name = typeof v === "string" ? v : v?.name ?? "";
        setInput(name);
        onChange(name);
      }}
      isOptionEqualToValue={(o, v) => o.name === (typeof v === "string" ? v : v?.name)}
      renderOption={(props, option) => {
        const meta = [option.city, option.state].filter(Boolean).join(", ");
        return (
          <Box component="li" {...props} key={option.id}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--font-primary)" }} noWrap>
                {option.name}
              </Typography>
              {meta && (
                <Typography sx={{ fontSize: "0.72rem", color: "var(--font-secondary)" }} noWrap>
                  {meta}
                </Typography>
              )}
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          error={error}
          helperText={helperText}
          size={size}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
