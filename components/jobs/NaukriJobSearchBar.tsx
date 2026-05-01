"use client";

import {
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  MenuItem,
  Button,
  Box,
  Autocomplete,
  createFilterOptions,
} from "@mui/material";
import { Search, X, MapPin, ChevronDown } from "lucide-react";
import { memo, useCallback, useMemo } from "react";

const EXPERIENCE_OPTIONS = [
  { value: "", label: "Select experience" },
  { value: "0-1", label: "0-1 years" },
  { value: "1-3", label: "1-3 years" },
  { value: "3-5", label: "3-5 years" },
  { value: "5-10", label: "5-10 years" },
  { value: "10+", label: "10+ years" },
];

const LOCATION_FILTER_LIMIT = 50;

interface NaukriJobSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClear: () => void;
  location?: string;
  /** Typing in the location field — does not commit filters until onLocationCommit. */
  onLocationInputChange?: (value: string) => void;
  /** User picked a suggestion or confirmed free text (Enter) — commits location for API. */
  onLocationCommit?: (value: string) => void;
  experience?: string;
  onExperienceChange?: (value: string) => void;
  locationOptions?: string[];
  onSearch?: () => void;
  placeholder?: string;
  size?: "small" | "medium";
}

const NaukriJobSearchBarComponent = ({
  searchQuery,
  onSearchChange,
  onClear,
  location = "",
  onLocationInputChange,
  onLocationCommit,
  experience = "",
  onExperienceChange,
  locationOptions = [],
  onSearch,
  placeholder = "Enter skills / designations / companies",
  size = "medium",
}: NaukriJobSearchBarProps) => {
  const filterLocationOptions = useMemo(
    () =>
      createFilterOptions<string>({
        limit: LOCATION_FILTER_LIMIT,
        stringify: (option) => option,
      }),
    []
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(String(e.target.value || ""));
    },
    [onSearchChange]
  );

  const handleExperienceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onExperienceChange?.(String(e.target.value || ""));
    },
    [onExperienceChange]
  );

  return (
    <Paper
      elevation={2}
      sx={{
        display: "flex",
        alignItems: "stretch",
        borderRadius: 3,
        overflow: "hidden",
        backgroundColor: "var(--card-bg)",
        border: "1px solid",
        borderColor: "var(--border-default)",
        boxShadow: "0 4px 14px color-mix(in srgb, var(--font-primary) 6%, transparent)",
        flexDirection: { xs: "column", sm: "row" },
      }}
    >
      {/* Keywords / Skills */}
      <Box
        sx={{
          flex: 1,
          minWidth: { xs: 0, sm: 280 },
          display: "flex",
          alignItems: "center",
          borderRight: { xs: "none", sm: "1px solid" },
          borderBottom: { xs: "1px solid", sm: "none" },
          borderColor: "var(--border-default)",
          pl: 2,
          pr: 1,
          py: { xs: 1, sm: 0 },
        }}
      >
        <Search size={20} style={{ color: "var(--font-tertiary)", flexShrink: 0, marginRight: 12 }} />
        <TextField
          fullWidth
          placeholder={placeholder}
          value={searchQuery || ""}
          onChange={handleSearchChange}
          variant="standard"
          inputProps={{ "aria-label": "Search jobs", placeholder: placeholder }}
          InputProps={{
            disableUnderline: true,
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={onClear} sx={{ p: 0.5 }}>
                  <X size={16} />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiInputBase-root": { alignItems: "center" },
            "& .MuiInputBase-input": {
              fontSize: size === "small" ? "0.9rem" : "0.95rem",
              py: 1.5,
              color: "var(--font-primary-dark)",
              "&::placeholder": { color: "var(--font-tertiary)", opacity: 1 },
            },
          }}
        />
      </Box>

      {/* Experience dropdown */}
      {onExperienceChange && (
        <Box
          sx={{
            width: { xs: "100%", sm: 240 },
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            borderRight: { xs: "none", sm: "1px solid" },
            borderBottom: { xs: "1px solid", sm: "none" },
            borderColor: "var(--border-default)",
          }}
        >
          <TextField
            select
            fullWidth
            value={experience || ""}
            onChange={handleExperienceChange}
            variant="standard"
            SelectProps={{
              displayEmpty: true,
              renderValue: (v) => (v ? String(v) : "Select experience"),
              IconComponent: () => null,
            }}
            InputProps={{
              disableUnderline: true,
              sx: {
                px: 2,
                py: 1.5,
                fontSize: size === "small" ? "0.9rem" : "0.95rem",
                color: experience ? "var(--font-primary-dark)" : "var(--font-tertiary)",
              },
              endAdornment: (
                <InputAdornment position="end" sx={{ mr: 0.5 }}>
                  <ChevronDown size={18} style={{ color: "var(--font-tertiary)" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiInputBase-root": { alignItems: "center" },
              "& .MuiSelect-select": {
                pr: 3,
              },
            }}
          >
            {EXPERIENCE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      )}

      {/* Location — Autocomplete typeahead */}
      <Box
        sx={{
          width: { xs: "100%", sm: onExperienceChange ? 240 : 260 },
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          borderRight: { xs: "none", sm: "1px solid" },
          borderColor: "var(--border-default)",
          px: 1,
        }}
      >
        <MapPin size={18} style={{ color: "var(--font-tertiary)", flexShrink: 0, marginLeft: 8 }} />
        <Autocomplete
          freeSolo
          fullWidth
          options={locationOptions}
          value={location}
          inputValue={location}
          onInputChange={(_, v) => onLocationInputChange?.(v)}
          onChange={(_, v) =>
            onLocationCommit?.(typeof v === "string" ? v : "")
          }
          filterOptions={filterLocationOptions}
          getOptionLabel={(o) => o}
          isOptionEqualToValue={(a, b) => a === b}
          size="small"
          sx={{
            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            "& .MuiAutocomplete-inputRoot": {
              py: 1,
              fontSize: size === "small" ? "0.9rem" : "0.95rem",
              color: location ? "var(--font-primary-dark)" : "var(--font-tertiary)",
            },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Location"
              variant="standard"
              inputProps={{
                ...params.inputProps,
                onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                  params.inputProps?.onKeyDown?.(e);
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onLocationCommit?.(location);
                  }
                },
              }}
              InputProps={{
                ...params.InputProps,
                disableUnderline: true,
              }}
            />
          )}
        />
      </Box>

      {/* Search — outlined primary to align with admin toolbars */}
      <Button
        variant="outlined"
        onClick={onSearch}
        sx={{
          minWidth: { xs: "100%", sm: 120 },
          height: { xs: 48, sm: "auto" },
          borderRadius: 0,
          borderColor: "color-mix(in srgb, var(--accent-indigo) 45%, transparent)",
          color: "var(--accent-indigo)",
          fontWeight: 600,
          fontSize: "1rem",
          textTransform: "none",
          px: 3,
          py: 1.5,
          boxShadow: "none",
          "&:hover": {
            borderColor: "var(--accent-indigo)",
            backgroundColor: "color-mix(in srgb, var(--accent-indigo) 6%, transparent)",
            boxShadow: "none",
          },
        }}
      >
        Search
      </Button>
    </Paper>
  );
};

export const NaukriJobSearchBar = memo(NaukriJobSearchBarComponent);
NaukriJobSearchBar.displayName = "NaukriJobSearchBar";
