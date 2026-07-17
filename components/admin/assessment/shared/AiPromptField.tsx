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
 * The AI brief input — a large plain-English textarea with clickable example chips and a
 * gradient Generate button. The signature "describe it, we'll build it" control, shared by
 * the composer page and the hub AI-create hero.
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
              borderRadius: "var(--radius-card)",
              bgcolor: "var(--card-bg)",
              fontFamily: "var(--font-jakarta)",
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
            borderRadius: "var(--radius-card)",
            textTransform: "none",
            fontWeight: 700,
            color: "#fff",
            background: "var(--gradient-ai)",
            boxShadow: "0 12px 24px -12px color-mix(in srgb, var(--ai-violet) 70%, transparent)",
            "&:hover": { filter: "brightness(1.05)" },
            "&.Mui-disabled": { background: "var(--surface)", color: "var(--font-tertiary)" },
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
                bgcolor: "color-mix(in srgb, var(--ai-violet) 8%, var(--card-bg) 92%)",
                color: "var(--font-secondary)",
                border: "1px solid color-mix(in srgb, var(--ai-violet) 20%, var(--border-default) 80%)",
                "& .MuiChip-label": { fontSize: "0.75rem" },
                "&:hover": { bgcolor: "color-mix(in srgb, var(--ai-violet) 14%, var(--card-bg) 86%)" },
              }}
            />
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
