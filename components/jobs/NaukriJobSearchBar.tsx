"use client";

import {
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  MenuItem,
  Button,
  Box,
} from "@mui/material";
import { Search, X, MapPin, ChevronDown } from "lucide-react";
import { memo, useCallback } from "react";

const EXPERIENCE_OPTIONS = [
  { value: "", label: "Select experience" },
  { value: "0-1", label: "0-1 years" },
  { value: "1-3", label: "1-3 years" },
  { value: "3-5", label: "3-5 years" },
  { value: "5-10", label: "5-10 years" },
  { value: "10+", label: "10+ years" },
];

interface NaukriJobSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClear: () => void;
  location?: string;
  onLocationChange?: (value: string) => void;
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
  onLocationChange,
  experience = "",
  onExperienceChange,
  locationOptions = [],
  onSearch,
  placeholder = "Enter skills / designations / companies",
  size = "medium",
}: NaukriJobSearchBarProps) => {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(String(e.target.value || ""));
    },
    [onSearchChange]
  );

  const handleLocationChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onLocationChange?.(String(e.target.value || ""));
    },
    [onLocationChange]
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
        borderColor: "var(--card-bg)",
        boxShadow: "0 4px 14px color-mix(in srgb, var(--font-primary) 8%, transparent)",
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
          borderColor: "var(--card-bg)",
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
              color: "var(--font-primary)",
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
            borderColor: "var(--card-bg)",
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
                color: experience ? "var(--font-primary)" : "var(--font-tertiary)",
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

      {/* Location */}
      <Box
        sx={{
          width: { xs: "100%", sm: onExperienceChange ? 240 : 260 },
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          borderRight: { xs: "none", sm: "1px solid" },
          borderColor: "var(--card-bg)",
        }}
      >
        {locationOptions.length > 0 ? (
          <TextField
            select
            fullWidth
            value={location || ""}
            onChange={handleLocationChange}
            variant="standard"
            SelectProps={{
              displayEmpty: true,
              renderValue: (v) => (v ? String(v) : "Enter location"),
              IconComponent: () => null,
            }}
            InputProps={{
              disableUnderline: true,
              startAdornment: (
                <InputAdornment position="start" sx={{ ml: 1.5 }}>
                  <MapPin size={18} style={{ color: "var(--font-tertiary)" }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end" sx={{ mr: 0.5 }}>
                  <ChevronDown size={18} style={{ color: "var(--font-tertiary)" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiInputBase-root": { alignItems: "center" },
              "& .MuiSelect-select": { pr: 2 },
              "& .MuiInputBase-input": {
                fontSize: size === "small" ? "0.9rem" : "0.95rem",
                py: 1.5,
                pl: 0.5,
                color: location ? "var(--font-primary)" : "var(--font-tertiary)",
              },
            }}
          >
            <MenuItem value="">All locations</MenuItem>
            {locationOptions.map((loc) => (
              <MenuItem key={loc} value={loc}>
                {loc}
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <TextField
            fullWidth
            placeholder="Enter location"
            value={location || ""}
            onChange={handleLocationChange}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              startAdornment: (
                <InputAdornment position="start" sx={{ ml: 1.5 }}>
                  <MapPin size={18} style={{ color: "var(--font-tertiary)" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiInputBase-root": { alignItems: "center" },
              "& .MuiInputBase-input": {
                fontSize: size === "small" ? "0.9rem" : "0.95rem",
                py: 1.5,
                pl: 0.5,
                color: location ? "var(--font-primary)" : "var(--font-tertiary)",
                "&::placeholder": { color: "var(--font-tertiary)", opacity: 1 },
              },
            }}
          />
        )}
      </Box>

      {/* Search button */}
      <Button
        variant="contained"
        onClick={onSearch}
        sx={{
          minWidth: { xs: "100%", sm: 120 },
          height: { xs: 48, sm: "auto" },
          borderRadius: 0,
          backgroundColor: "var(--accent-indigo)",
          color: "var(--font-light)",
          fontWeight: 600,
          fontSize: "1rem",
          textTransform: "none",
          px: 3,
          py: 1.5,
          boxShadow: "none",
          "&:hover": {
            backgroundColor: "var(--accent-indigo-dark)",
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
