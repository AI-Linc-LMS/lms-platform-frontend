"use client";

/**
 * AssessmentFilterBar — a tokenized search + facet toolbar for the
 * assessment-management admin redesign.
 *
 * Renders a rounded hairline card containing a growing search field, an
 * arbitrary set of "All"-defaulted facet selects, an optional right-pinned
 * slot, and a wrap row of removable active-filter chips with a "Clear"
 * shortcut. All surfaces/borders/text use CSS custom-property tokens so the
 * bar is theme-aware (light + dark) with no hard-coded colors.
 */

import * as React from "react";
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

/** A single facet select rendered in the toolbar's top row. */
export interface FilterSelectDef {
  key: string;
  label: string;
  /** Current selected value; `''` represents the "All" option. */
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

/** A removable chip describing one active filter. */
export interface ActiveFilterChip {
  key: string;
  label: string;
  onClear: () => void;
}

export interface AssessmentFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  selects?: FilterSelectDef[];
  activeChips?: ActiveFilterChip[];
  onClearAll?: () => void;
  rightSlot?: React.ReactNode;
}

const CARD_SX = {
  bgcolor: "var(--card-bg)",
  border: "1px solid var(--border-default)",
  borderRadius: 2,
  p: { xs: 1.5, sm: 2 },
} as const;

/** Shared field styling so search + selects read as one tokenized set. */
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "var(--surface)",
    color: "var(--font-primary)",
    borderRadius: 2,
    "& fieldset": { borderColor: "var(--border-default)" },
    "&:hover fieldset": { borderColor: "var(--border-default)" },
    "&.Mui-focused fieldset": { borderColor: "var(--accent-indigo)" },
  },
  "& .MuiInputLabel-root": { color: "var(--font-tertiary)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "var(--accent-indigo)" },
  "& .MuiSvgIcon-root": { color: "var(--font-tertiary)" },
} as const;

export function AssessmentFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  selects = [],
  activeChips = [],
  onClearAll,
  rightSlot,
}: AssessmentFilterBarProps) {
  const hasActive = activeChips.length > 0;

  return (
    <Box sx={CARD_SX}>
      {/* Top row: search grows, facet selects, optional Clear, right slot. */}
      <Stack
        direction="row"
        flexWrap="wrap"
        alignItems="center"
        gap={1.5}
      >
        <TextField
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          size="small"
          sx={{ flex: "1 1 220px", minWidth: 200, ...fieldSx }}
          InputProps={{
            startAdornment: (
              <Box
                sx={{
                  display: "inline-flex",
                  mr: 1,
                  color: "var(--font-tertiary)",
                }}
              >
                <IconWrapper icon="mdi:magnify" size={20} />
              </Box>
            ),
          }}
        />

        {selects.map((sel) => (
          <TextField
            key={sel.key}
            select
            label={sel.label}
            value={sel.value}
            onChange={(e) => sel.onChange(e.target.value)}
            size="small"
            sx={{ width: { xs: "100%", sm: 170 }, ...fieldSx }}
          >
            <MenuItem value="">All</MenuItem>
            {sel.options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        ))}

        {hasActive && onClearAll ? (
          <Button
            onClick={onClearAll}
            size="small"
            startIcon={<IconWrapper icon="mdi:close-circle-outline" size={18} />}
            sx={{
              textTransform: "none",
              color: "var(--font-secondary)",
              "&:hover": {
                bgcolor:
                  "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)",
                color: "var(--accent-indigo-dark)",
              },
            }}
          >
            Clear
          </Button>
        ) : null}

        {rightSlot ? (
          <Box sx={{ ml: "auto", display: "flex", alignItems: "center" }}>
            {rightSlot}
          </Box>
        ) : null}
      </Stack>

      {/* Active-filter chips: removable, wrapping. */}
      {hasActive ? (
        <Stack
          direction="row"
          flexWrap="wrap"
          alignItems="center"
          gap={1}
          sx={{ mt: 1.5 }}
        >
          <Typography
            variant="caption"
            sx={{ color: "var(--font-tertiary)", mr: 0.5 }}
          >
            Filters
          </Typography>
          {activeChips.map((chip) => (
            <Chip
              key={chip.key}
              label={chip.label}
              onDelete={chip.onClear}
              size="small"
              deleteIcon={
                <Box sx={{ display: "inline-flex" }}>
                  <IconWrapper icon="mdi:close" size={16} />
                </Box>
              }
              sx={{
                borderRadius: 999,
                bgcolor:
                  "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)",
                border: "1px solid var(--border-default)",
                color: "var(--font-primary)",
                "& .MuiChip-deleteIcon": {
                  color: "var(--font-tertiary)",
                  "&:hover": { color: "var(--error-500)" },
                },
              }}
            />
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}
