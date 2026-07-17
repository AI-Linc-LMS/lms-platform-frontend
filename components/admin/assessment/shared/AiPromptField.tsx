"use client";

import { Box, Chip, Button, TextField, CircularProgress } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface AiPromptFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  /** Starter briefs the admin can click to prefill the field. */
  examples?: string[];
  submitting?: boolean;
  submitLabel?: string;
  disabled?: boolean;
}

/**
 * The AI brief input — a large plain-English textarea with clickable example chips and the
 * Generate button. Styled for the DARK composer hero band on the assessments hub (white
 * input, white Generate with violet text, translucent example chips), per the redesign
 * mockup. The signature "describe it, we'll build it" control.
 */
export function AiPromptField({
  value,
  onChange,
  onSubmit,
  placeholder = "e.g. 45-min proctored cybersecurity screening, 10 MCQs + 2 coding problems…",
  examples = [],
  submitting = false,
  submitLabel = "Generate",
  disabled = false,
}: AiPromptFieldProps) {
  const canSubmit = value.trim().length > 0 && !submitting && !disabled;
  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "flex-start" },
        }}
      >
        <TextField
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder={placeholder}
          multiline
          minRows={1}
          maxRows={5}
          fullWidth
          InputProps={{
            startAdornment: (
              <Box sx={{ display: "inline-flex", mr: 1, mt: 0.25, color: "var(--ai-violet)" }}>
                <IconWrapper icon="mdi:auto-fix" size={20} />
              </Box>
            ),
            sx: {
              alignItems: "flex-start",
              borderRadius: "14px",
              bgcolor: "rgba(255,255,255,0.97)",
              fontFamily: "var(--font-jakarta)",
              "& fieldset": { border: "none" },
              "& textarea": { color: "#1f1a2e" },
              "& textarea::placeholder": { color: "#6f6a80", opacity: 1 },
            },
          }}
        />
        <Button
          onClick={onSubmit}
          disabled={!canSubmit}
          sx={{
            flexShrink: 0,
            px: 3,
            py: 1.25,
            minWidth: 132,
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.95rem",
            color: "var(--ai-violet)",
            bgcolor: "#fff",
            boxShadow: "0 10px 24px -12px rgba(0,0,0,0.45)",
            "&:hover": { bgcolor: "#fff", filter: "brightness(0.97)" },
            "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.55)", color: "rgba(90,80,120,0.55)" },
          }}
          endIcon={
            submitting ? (
              <CircularProgress size={16} sx={{ color: "#fff" }} />
            ) : (
              <IconWrapper icon="mdi:arrow-right" size={18} />
            )
          }
        >
          {submitting ? "Generating…" : submitLabel}
        </Button>
      </Box>

      {examples.length > 0 ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
          {examples.map((ex) => (
            <Chip
              key={ex}
              label={`"${ex}"`}
              onClick={() => onChange(ex)}
              size="small"
              sx={{
                cursor: "pointer",
                maxWidth: "100%",
                bgcolor: "rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(255,255,255,0.28)",
                "& .MuiChip-label": { fontSize: "0.75rem" },
                "&:hover": { bgcolor: "rgba(255,255,255,0.16)" },
              }}
            />
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
