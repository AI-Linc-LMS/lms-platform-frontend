"use client";

import { useEffect, useState } from "react";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ResponsiveDialog } from "@/components/common/mobile/ResponsiveDialog";
import { REPORT_REASON_LABELS, ReportReason } from "@/lib/services/community.service";

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  // What is being reported - informational only, drives copy.
  target: "thread" | "comment";
  onSubmit: (payload: { reason: ReportReason; details?: string }) => Promise<void>;
}

const REASONS = Object.entries(REPORT_REASON_LABELS) as [ReportReason, string][];

export function ReportDialog({ open, onClose, target, onSubmit }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReason(null);
      setDetails("");
      setSubmitting(false);
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ reason, details: details.trim() || undefined });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      title={`Report this ${target}`}
      description="A moderator will review your report. Reports are anonymous to the author."
      data-testid="report-sheet"
      footer={
        <>
          <Button onClick={onClose} disabled={submitting} sx={{ textTransform: "none", minHeight: { xs: 44, sm: "auto" } }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!reason || submitting}
            startIcon={
              submitting ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <IconWrapper icon="mdi:flag" size={14} />
            }
            sx={{
              textTransform: "none",
              fontWeight: 600,
              minHeight: { xs: 44, sm: "auto" },
              backgroundColor: "#ef4444",
              boxShadow: "none",
              "&:hover": { backgroundColor: "#dc2626", boxShadow: "none" },
            }}
          >
            {submitting ? "Submitting…" : "Submit report"}
          </Button>
        </>
      }
    >
      <Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 2 }}>
          {REASONS.map(([key, label]) => {
            const active = reason === key;
            return (
              <Box
                key={key}
                onClick={() => setReason(key)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  minHeight: { xs: 48, sm: "auto" },
                  px: 1.5,
                  py: 1,
                  borderRadius: "8px",
                  border: `1px solid ${active ? "#ef4444" : "var(--border-default)"}`,
                  backgroundColor: active ? "rgba(239,68,68,0.06)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.12s",
                  "&:hover": {
                    borderColor: "#ef4444",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: `2px solid ${active ? "#ef4444" : "var(--border-default)"}`,
                    backgroundColor: active ? "#ef4444" : "transparent",
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body2" sx={{ color: active ? "#b91c1c" : "var(--font-primary)" }}>
                  {label}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <TextField
          label="Additional context (optional)"
          placeholder="Anything that would help moderators understand the issue."
          value={details}
          onChange={(e) => setDetails(e.target.value.slice(0, 2000))}
          multiline
          minRows={2}
          maxRows={5}
          fullWidth
          size="small"
          sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          disabled={submitting}
        />

        {error && (
          <Typography variant="caption" sx={{ color: "#ef4444", display: "block", mb: 1 }}>
            {error}
          </Typography>
        )}
      </Box>
    </ResponsiveDialog>
  );
}
