"use client";

import { useEffect, useMemo, useState } from "react";
import { Autocomplete, Box, CircularProgress, TextField, Typography } from "@mui/material";
import { countriesService, type CountryOption } from "@/lib/services/countries.service";

/**
 * Country picker for the profile.
 *
 * Three deliberate differences from CollegeAutocomplete, which this otherwise mirrors so it drops
 * into the same grid cell:
 *
 * 1. NOT freeSolo. Country is validated against a fixed list server-side, so free text would just
 *    produce a save that fails.
 * 2. Fetched once and filtered locally — ~250 rows, so a debounced search per keystroke is pure
 *    latency for no benefit.
 * 3. It does NOT fail soft to free typing. CollegeAutocomplete can, because college is optional
 *    prose; this field gates three modules, so a load failure shows a retry instead of silently
 *    offering nothing.
 */
export function CountrySelect({
  value,
  onChange,
  label = "Country",
  required,
  error,
  helperText,
  size = "small",
  fullWidth = true,
}: {
  value: string;
  onChange: (name: string) => void;
  label?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  size?: "small" | "medium";
  fullWidth?: boolean;
}) {
  const [options, setOptions] = useState<CountryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function load() {
    setLoading(true);
    setFailed(false);
    try {
      setOptions(await countriesService.list());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  // The stored value is the canonical NAME, so an existing "India" matches without migration.
  const selected = useMemo(
    () => options.find((o) => o.name.toLowerCase() === (value || "").toLowerCase()) ?? null,
    [options, value],
  );

  if (failed) {
    return (
      <Box>
        <TextField
          fullWidth={fullWidth}
          size={size}
          label={label}
          value={value || ""}
          disabled
          error
          helperText="Couldn't load the country list."
        />
        <Typography
          component="button"
          type="button"
          onClick={() => void load()}
          sx={{
            mt: 0.5,
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "var(--accent-indigo)",
            background: "none",
            border: 0,
            cursor: "pointer",
            p: 0,
          }}
        >
          Retry
        </Typography>
      </Box>
    );
  }

  return (
    <Autocomplete
      options={options}
      loading={loading}
      value={selected}
      fullWidth={fullWidth}
      getOptionLabel={(o) => o.name}
      isOptionEqualToValue={(o, v) => o.code === v.code}
      onChange={(_, next) => onChange(next?.name ?? "")}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          size={size}
          required={required}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
