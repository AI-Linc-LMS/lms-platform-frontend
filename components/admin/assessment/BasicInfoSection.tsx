"use client";

import { memo, useState } from "react";
import { Box, Typography, TextField, Paper, Button, CircularProgress } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { RichTextEditor } from "@/components/common/RichTextEditor";
import { useToast } from "@/components/common/Toast";
import { config } from "@/lib/config";
import { generateAssessmentCopy } from "@/lib/services/admin/admin-assessment-composer.service";

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
  color: "var(--font-secondary)",
};

function FieldGroup({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  /** Right-aligned affordance on the kicker row (e.g. the ✦ AI button). */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        p: { xs: 1.75, sm: 2 },
        borderRadius: "12px",
        bgcolor: "color-mix(in srgb, var(--accent-indigo) 4%, var(--card-bg) 96%)",
        border: "1px solid color-mix(in srgb, var(--accent-indigo) 10%, var(--border-default) 90%)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 0.25 }}>
        <Typography component="h4" variant="subtitle2" sx={groupTitleSx}>
          {title}
        </Typography>
        {action ?? null}
      </Box>
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

/** Small gradient "✦ Generate with AI" pill for a copy field. */
function AiAssistButton({
  label,
  loading,
  onClick,
}: {
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      size="small"
      onClick={onClick}
      disabled={loading}
      startIcon={
        loading ? (
          <CircularProgress size={13} sx={{ color: "#fff" }} />
        ) : (
          <IconWrapper icon="mdi:auto-fix" size={14} />
        )
      }
      sx={{
        flexShrink: 0,
        px: 1.5,
        py: 0.4,
        borderRadius: 999,
        textTransform: "none",
        fontWeight: 700,
        fontSize: "0.75rem",
        color: "#fff",
        background: "var(--gradient-ai)",
        boxShadow: "0 6px 14px -8px color-mix(in srgb, var(--ai-violet) 70%, transparent)",
        "&:hover": { filter: "brightness(1.05)" },
        "&.Mui-disabled": {
          color: "#fff",
          opacity: 0.7,
          background: "var(--gradient-ai)",
        },
      }}
    >
      {loading ? "Writing…" : label}
    </Button>
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
  const { showToast } = useToast();
  const [assisting, setAssisting] = useState<"instructions" | "description" | null>(null);

  const handleAssist = async (field: "instructions" | "description") => {
    if (assisting) return;
    try {
      setAssisting(field);
      const text = await generateAssessmentCopy(config.clientId, {
        field,
        title,
        current_text: field === "instructions" ? instructions : description,
      });
      if (field === "instructions") onInstructionsChange(text);
      else onDescriptionChange(text);
      showToast("Draft written — edit it to taste", "success");
    } catch (e: unknown) {
      showToast(
        (e as { message?: string })?.message || "The AI assistant couldn't draft that just now",
        "error"
      );
    } finally {
      setAssisting(null);
    }
  };

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

      <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2.5, display: "flex", flexDirection: "column", gap: 2.5 }}>
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
            sx={{ "& .MuiInputBase-root": { bgcolor: "var(--card-bg)" } }}
          />
        </FieldGroup>

        <FieldGroup
          title="Instructions for students"
          hint="Required. Tell students how to complete the assessment, time expectations, and any materials allowed."
          action={
            !readOnly ? (
              <AiAssistButton
                label={instructions.trim() ? "Improve with AI" : "Generate with AI"}
                loading={assisting === "instructions"}
                onClick={() => void handleAssist("instructions")}
              />
            ) : undefined
          }
        >
          <Box sx={{ "& .MuiInputBase-root, & textarea": { bgcolor: "var(--card-bg)" } }}>
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
          </Box>
        </FieldGroup>

        <FieldGroup
          title="Description (optional)"
          hint="Optional context for the catalog or course page—goals, topics covered, or prerequisites."
          action={
            !readOnly ? (
              <AiAssistButton
                label={description.trim() ? "Improve with AI" : "Generate with AI"}
                loading={assisting === "description"}
                onClick={() => void handleAssist("description")}
              />
            ) : undefined
          }
        >
          <Box sx={{ "& .MuiInputBase-root, & textarea": { bgcolor: "var(--card-bg)" } }}>
            <RichTextEditor
              label="Description"
              value={description}
              onChange={onDescriptionChange}
              mode="text"
              minRows={2}
              readOnly={readOnly}
              helperText="Optional description of the assessment."
            />
          </Box>
        </FieldGroup>
      </Box>
    </Paper>
  );
}

export const BasicInfoSection = memo(BasicInfoSectionInner);
