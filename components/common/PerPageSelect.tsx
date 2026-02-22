"use client";

import { Select, MenuItem, FormControl } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

export const DEFAULT_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;

export interface PerPageSelectProps {
  value: number;
  onChange: (value: number) => void;
  options?: number[];
  size?: "small" | "medium";
  displayEmpty?: boolean;
  ariaLabel?: string;
  minWidth?: number | string | { xs?: number | string; sm?: number | string; md?: number | string; lg?: number | string; xl?: number | string };
  FormControlSx?: SxProps<Theme>;
  SelectSx?: SxProps<Theme>;
  MenuItemSx?: SxProps<Theme>;
}

export function PerPageSelect({
  value,
  onChange,
  options = DEFAULT_PER_PAGE_OPTIONS as unknown as number[],
  size = "small",
  displayEmpty = false,
  ariaLabel,
  minWidth = { xs: 100, sm: 120 },
  FormControlSx,
  SelectSx,
  MenuItemSx,
}: PerPageSelectProps) {
  return (
    <FormControl size={size} sx={{ minWidth, ...FormControlSx }}>
      <Select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        displayEmpty={displayEmpty}
        inputProps={ariaLabel ? { "aria-label": ariaLabel } : undefined}
        sx={SelectSx}
      >
        {options.map((opt) => (
          <MenuItem key={opt} value={opt} sx={MenuItemSx}>
            {opt} per page
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
