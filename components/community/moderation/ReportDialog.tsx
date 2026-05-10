"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { REPORT_REASONS, ReportReason } from "@/lib/community/permissions";

interface ReportDialogProps {
  open: boolean;
  /** Short summary of what is being reported, shown above the form. */
  targetLabel: string;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason, detail: string) => Promise<void> | void;
}

export function ReportDialog({
  open,
  targetLabel,
  busy = false,
  onClose,
  onSubmit,
}: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason>("spam");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    if (open) {
      setReason("spam");
      setDetail("");
    }
  }, [open]);

  const handleSubmit = async () => {
    await onSubmit(reason, detail.trim());
  };

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      slotProps={{
        paper: {
          elevation: 0,
          sx: {
            borderRadius: 2,
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--card-bg)",
            minWidth: 480,
          },
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, fontWeight: 700 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: "var(--warning-100)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:flag-outline" size={20} color="var(--warning-500)" />
        </Box>
        Report content
      </DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 1.5 }}>
          You are reporting:{" "}
          <Typography
            component="span"
            variant="body2"
            sx={{ color: "var(--font-primary-dark)", fontWeight: 600 }}
          >
            {targetLabel}
          </Typography>
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 2 }}>
          Reports are reviewed by moderators. Abuse of this feature may itself be moderated.
        </Typography>

        <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--font-primary-dark)" }}>
          Reason
        </Typography>
        <RadioGroup
          value={reason}
          onChange={(e) => setReason(e.target.value as ReportReason)}
          sx={{ mt: 0.5, mb: 2 }}
        >
          {REPORT_REASONS.map((r) => (
            <FormControlLabel
              key={r.value}
              value={r.value}
              control={
                <Radio
                  size="small"
                  sx={{
                    color: "var(--border-light)",
                    "&.Mui-checked": { color: "var(--accent-indigo)" },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: "var(--font-muted)" }}>
                  {r.label}
                </Typography>
              }
            />
          ))}
        </RadioGroup>

        <TextField
          placeholder="Add context (optional, max 1000 chars)"
          value={detail}
          onChange={(e) => setDetail(e.target.value.slice(0, 1000))}
          multiline
          rows={3}
          fullWidth
          size="small"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          disabled={busy}
          sx={{ textTransform: "none", color: "var(--font-secondary)" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={busy}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            backgroundColor: "var(--accent-indigo)",
            color: "var(--font-light)",
            "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
          }}
        >
          {busy ? "Submitting…" : "Submit report"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
