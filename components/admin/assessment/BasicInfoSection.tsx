"use client";

import { Box, Typography, TextField } from "@mui/material";

interface BasicInfoSectionProps {
  title: string;
  instructions: string;
  description: string;
  onTitleChange: (value: string) => void;
  onInstructionsChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function BasicInfoSection({
  title,
  instructions,
  description,
  onTitleChange,
  onInstructionsChange,
  onDescriptionChange,
}: BasicInfoSectionProps) {
  return (
    <Box>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: "#111827",
          mb: 1,
          fontSize: { xs: "1.25rem", sm: "1.5rem" },
        }}
      >
        Basic Information
      </Typography>
      <Typography variant="body2" sx={{ color: "#6b7280", mb: 3 }}>
        Name and describe your assessment so that students can understand it.
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <TextField
          label="Assessment Title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          fullWidth
          required
          helperText="Maximum 255 characters"
          inputProps={{ maxLength: 255 }}
        />
        <TextField
          label="Instructions"
          value={instructions}
          onChange={(e) => onInstructionsChange(e.target.value)}
          fullWidth
          required
          multiline
          rows={4}
          helperText="Provide clear instructions for students"
        />
        <TextField
          label="Description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          fullWidth
          multiline
          rows={2}
          helperText="Optional description of the assessment"
        />
      </Box>
    </Box>
  );
}

