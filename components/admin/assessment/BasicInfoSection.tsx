"use client";

import { Box, Typography, TextField, Paper } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface BasicInfoSectionProps {
  title: string;
  instructions: string;
  description: string;
  onTitleChange: (value: string) => void;
  onInstructionsChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  readOnly?: boolean;
}

const helperFormProps = {
  sx: {
    fontSize: "0.8125rem",
    lineHeight: 1.45,
    color: "var(--font-secondary)",
    mt: 0.5,
  },
};

const groupTitleSx = {
  fontSize: "0.7rem",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: "var(--font-secondary)",
  mb: 0.25,
};

function FieldGroup({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Typography component="h4" variant="subtitle2" sx={groupTitleSx}>
        {title}
      </Typography>
      {hint ? (
        <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 1.25 }}>
          {hint}
        </Typography>
      ) : (
        <Box sx={{ mb: 1 }} />
      )}
      {children}
    </Box>
  );
}

export function BasicInfoSection({
  title,
  instructions,
  description,
  onTitleChange,
  onInstructionsChange,
  onDescriptionChange,
  readOnly = false,
}: BasicInfoSectionProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 0,
        borderRadius: 2,
        border: "1px solid",
        borderColor:
          "color-mix(in srgb, var(--accent-indigo) 30%, var(--border-default) 70%)",
        overflow: "hidden",
        boxShadow:
          "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--accent-indigo) 8%, var(--surface) 92%) 0%, var(--card-bg) 56px)",
        opacity: readOnly ? 0.96 : 1,
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
          borderBottom: "1px solid",
          borderColor:
            "color-mix(in srgb, var(--accent-indigo) 20%, var(--border-default) 80%)",
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor:
              "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
            border:
              "1px solid color-mix(in srgb, var(--accent-indigo) 30%, var(--border-default) 70%)",
            flexShrink: 0,
          }}
        >
          <IconWrapper icon="mdi:file-document-edit-outline" size={24} color="var(--accent-indigo)" />
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
            Basic information
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)", mt: 0.5, lineHeight: 1.5 }}>
            Name and describe your assessment so students know what to expect before they start.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2.5, display: "flex", flexDirection: "column", gap: 3 }}>
        <FieldGroup
          title="Assessment name"
          hint="Shown in lists and at the top of the attempt. Keep it specific and concise."
        >
          <TextField
            label="Assessment title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            fullWidth
            required
            helperText={
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 1,
                  width: "100%",
                }}
              >
                <span>Maximum 255 characters.</span>
                <Box component="span" sx={{ color: "var(--font-tertiary)", flexShrink: 0 }}>
                  {title.length}/255
                </Box>
              </Box>
            }
            FormHelperTextProps={{ ...helperFormProps, component: "div" }}
            inputProps={{ maxLength: 255 }}
            disabled={readOnly}
          />
        </FieldGroup>

        <FieldGroup
          title="Instructions"
          hint="Required. Tell students how to complete the assessment, time expectations, and any materials allowed."
        >
          <TextField
            label="Instructions"
            value={instructions}
            onChange={(e) => onInstructionsChange(e.target.value)}
            fullWidth
            required
            multiline
            minRows={4}
            helperText="Provide clear instructions for students."
            FormHelperTextProps={helperFormProps}
            disabled={readOnly}
          />
        </FieldGroup>

        <FieldGroup
          title="Description (optional)"
          hint="Optional context for the catalog or course page—goals, topics covered, or prerequisites."
        >
          <TextField
            label="Description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            helperText="Optional description of the assessment."
            FormHelperTextProps={helperFormProps}
            disabled={readOnly}
          />
        </FieldGroup>
      </Box>
    </Paper>
  );
}
