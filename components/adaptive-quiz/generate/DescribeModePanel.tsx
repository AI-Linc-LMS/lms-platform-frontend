"use client";

import { Box, TextField } from "@mui/material";

/**
 * The "Describe" creation path: a title, a free-text description the engine plans
 * the whole course from, and the duration that seeds the module count. The IRT /
 * content knobs live in the shared config below, so this panel stays minimal.
 */
export function DescribeModePanel({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  durationWeeks,
  onDurationWeeksChange,
}: {
  title: string;
  onTitleChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  durationWeeks: number;
  onDurationWeeksChange: (v: number) => void;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <TextField
        label="Course title"
        required
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        fullWidth
      />
      <TextField
        label="Course description"
        required
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        fullWidth
        multiline
        minRows={4}
        helperText="Tip: paste a week-wise plan and the engine will follow your structure."
      />
      <TextField
        label="Duration (weeks)"
        type="number"
        value={durationWeeks}
        onChange={(e) => onDurationWeeksChange(clamp(Number(e.target.value), 1, 52))}
        sx={{ width: 160 }}
      />
    </Box>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}
