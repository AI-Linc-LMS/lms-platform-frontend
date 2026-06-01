"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { REPORT_REASON_LABELS, ReportReason } from "@/lib/services/community.service";

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  // What is being reported — informational only, drives copy.
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "14px", border: "1px solid var(--border-default)" },
      }}
    >
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <IconWrapper icon="mdi:flag-outline" size={20} color="#ef4444" />
          <Typography variant="subtitle1" fontWeight={700}>
            Report this {target}
          </Typography>
          <IconButton size="small" onClick={onClose} sx={{ ml: "auto" }} disabled={submitting}>
            <IconWrapper icon="mdi:close" size={18} color="var(--font-secondary)" />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          A moderator will review your report. Reports are anonymous to the author.
        </Typography>

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

        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <Button onClick={onClose} disabled={submitting} sx={{ textTransform: "none" }}>
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
              backgroundColor: "#ef4444",
              boxShadow: "none",
              "&:hover": { backgroundColor: "#dc2626", boxShadow: "none" },
            }}
          >
            {submitting ? "Submitting…" : "Submit report"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
