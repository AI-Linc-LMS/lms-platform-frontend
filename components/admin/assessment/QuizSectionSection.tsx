"use client";

import { Box, Typography, TextField } from "@mui/material";

interface QuizSectionSectionProps {
  sectionTitle: string;
  sectionDescription: string;
  sectionOrder: number;
  onSectionTitleChange: (value: string) => void;
  onSectionDescriptionChange: (value: string) => void;
  onSectionOrderChange: (value: number) => void;
}

export function QuizSectionSection({
  sectionTitle,
  sectionDescription,
  sectionOrder,
  onSectionTitleChange,
  onSectionDescriptionChange,
  onSectionOrderChange,
}: QuizSectionSectionProps) {
  return (
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: "#111827",
          mb: 1,
        }}
      >
        Quiz Section
      </Typography>
      <Typography variant="body2" sx={{ color: "#6b7280", mb: 3 }}>
        Configure the quiz section details and display order.
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" },
            gap: 2,
          }}
        >
          <TextField
            label="Section Title"
            value={sectionTitle}
            onChange={(e) => onSectionTitleChange(e.target.value)}
            fullWidth
            required
            inputProps={{ maxLength: 255 }}
          />
          <TextField
            label="Section Order"
            type="number"
            value={sectionOrder}
            onChange={(e) => onSectionOrderChange(Number(e.target.value))}
            fullWidth
            required
            inputProps={{ min: 1 }}
            helperText="Display order"
          />
        </Box>
        <TextField
          label="Section Description"
          value={sectionDescription}
          onChange={(e) => onSectionDescriptionChange(e.target.value)}
          fullWidth
          multiline
          rows={2}
          helperText="Optional description for this section"
        />
      </Box>
    </Box>
  );
}

