"use client";

import { useState } from "react";
import { Box, TextField, Button } from "@mui/material";
import { memo } from "react";
import { applySchema, type ApplyFormData } from "@/lib/schemas/job-portal-v2.schema";

interface ApplyFormProps {
  onSubmit: (data: ApplyFormData) => Promise<void>;
  isSubmitting?: boolean;
}

const ApplyFormComponent = ({ onSubmit, isSubmitting = false }: ApplyFormProps) => {
  const [resumeUrl, setResumeUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [errors, setErrors] = useState<{ resume_url?: string; cover_letter?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = applySchema.safeParse({
      resume_url: resumeUrl.trim() || undefined,
      cover_letter: coverLetter.trim() || undefined,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const err of result.error.issues) {
        const path = String(err.path?.[0] ?? "");
        const msg = "message" in err ? String(err.message) : "Invalid";
        if (path && !fieldErrors[path]) fieldErrors[path] = msg;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    await onSubmit(result.data);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <TextField
        label="Resume URL"
        placeholder="https://..."
        value={resumeUrl}
        onChange={(e) => {
          setResumeUrl(e.target.value);
          if (errors.resume_url) setErrors((p) => ({ ...p, resume_url: undefined }));
        }}
        error={!!errors.resume_url}
        helperText={errors.resume_url}
        fullWidth
        size="small"
      />
      <TextField
        label="Cover letter"
        placeholder="Optional cover letter..."
        value={coverLetter}
        onChange={(e) => {
          setCoverLetter(e.target.value);
          if (errors.cover_letter) setErrors((p) => ({ ...p, cover_letter: undefined }));
        }}
        error={!!errors.cover_letter}
        helperText={errors.cover_letter}
        fullWidth
        multiline
        rows={4}
        size="small"
      />
      <Button
        type="submit"
        variant="contained"
        disabled={isSubmitting}
        sx={{
          backgroundColor: "#6366f1",
          textTransform: "none",
          fontWeight: 600,
          alignSelf: "flex-start",
          "&:hover": { backgroundColor: "#4f46e5" },
        }}
      >
        {isSubmitting ? "Submitting..." : "Submit application"}
      </Button>
    </Box>
  );
};

export const ApplyForm = memo(ApplyFormComponent);
ApplyForm.displayName = "ApplyForm";
