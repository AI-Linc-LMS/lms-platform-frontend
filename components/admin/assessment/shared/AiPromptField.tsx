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
      {/* One translucent glass pill wrapping the input AND the white Generate button (mockup) */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pl: 2.25,
          pr: 1,
          py: 1,
          borderRadius: "18px",
          bgcolor: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.18)",
          transition: "border-color 0.15s ease, background-color 0.15s ease",
          "&:focus-within": {
            bgcolor: "rgba(255,255,255,0.11)",
            borderColor: "rgba(255,255,255,0.35)",
          },
        }}
      >
        <Box sx={{ display: "inline-flex", flexShrink: 0, color: "#c4b5fd" }}>
          <IconWrapper icon="mdi:auto-fix" size={20} />
        </Box>
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
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: {
              fontFamily: "var(--font-jakarta)",
              fontSize: "1.02rem",
              color: "#fff",
              "& textarea": { color: "#fff" },
              "& textarea::placeholder": { color: "rgba(255,255,255,0.62)", opacity: 1 },
            },
          }}
        />
        <Button
          onClick={onSubmit}
          disabled={!canSubmit}
          sx={{
            flexShrink: 0,
            alignSelf: "flex-end",
            px: 2.75,
            py: 1.1,
            minWidth: 128,
            borderRadius: "14px",
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.95rem",
            color: "var(--ai-violet)",
            bgcolor: "#fff",
            "&:hover": { bgcolor: "#fff", filter: "brightness(0.96)" },
            "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.85)", color: "rgba(124,58,237,0.45)" },
          }}
          endIcon={
            submitting ? (
              <CircularProgress size={16} sx={{ color: "var(--ai-violet)" }} />
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
