"use client";

import { memo } from "react";
import { Box, Typography, TextField, Paper } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { RichTextEditor } from "@/components/common/RichTextEditor";

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

/** Section kicker label (design contract): tiny, heavy, tracked-out uppercase. */
const groupTitleSx = {
  fontSize: "0.72rem",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "var(--font-tertiary)",
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

function BasicInfoSectionInner({
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
        borderRadius: "16px",
        border: "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
        bgcolor: "var(--card-bg)",
        opacity: readOnly ? 0.96 : 1,
      }}
    >
      {/* Basics card header (mockup): icon tile + heading + caption */}
      <Box
        sx={{
          px: 2.5,
          py: 2.25,
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "color-mix(in srgb, var(--accent-indigo) 12%, var(--card-bg) 88%)",
            flexShrink: 0,
          }}
        >
          <IconWrapper icon="mdi:file-document-edit-outline" size={22} color="var(--accent-indigo)" />
        </Box>
        <Box>
          <Typography
            sx={{
              fontFamily: "var(--font-jakarta)",
              fontWeight: 800,
              fontSize: "1.1rem",
              lineHeight: 1.3,
              color: "var(--font-primary)",
            }}
          >
            Basics
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)", mt: 0.25, lineHeight: 1.5 }}>
            What students see before they start
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2.5, display: "flex", flexDirection: "column", gap: 3 }}>
        <FieldGroup
          title="Assessment title"
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
                <Box
                  component="span"
                  sx={{ color: "var(--font-tertiary)", fontFamily: "var(--font-mono)", flexShrink: 0 }}
                >
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
          title="Instructions for students"
          hint="Required. Tell students how to complete the assessment, time expectations, and any materials allowed."
        >
          <RichTextEditor
            label="Instructions"
            value={instructions}
            onChange={onInstructionsChange}
            mode="text"
            required
            minRows={4}
            readOnly={readOnly}
            helperText="Provide clear instructions for students."
          />
        </FieldGroup>

        <FieldGroup
          title="Description (optional)"
          hint="Optional context for the catalog or course page—goals, topics covered, or prerequisites."
        >
          <RichTextEditor
            label="Description"
            value={description}
            onChange={onDescriptionChange}
            mode="text"
            minRows={2}
            readOnly={readOnly}
            helperText="Optional description of the assessment."
          />
        </FieldGroup>
      </Box>
    </Paper>
  );
}

export const BasicInfoSection = memo(BasicInfoSectionInner);
