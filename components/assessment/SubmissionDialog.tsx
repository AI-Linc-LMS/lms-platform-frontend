"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Checkbox,
  FormControlLabel,
  Divider,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface SectionStatus {
  sectionName: string;
  sectionType: string;
  answered: number;
  total: number;
}

interface SubmissionDialogProps {
  open: boolean;
  sections: SectionStatus[];
  totalQuestions: number;
  totalAnswered: number;
  onClose: () => void;
  onConfirm: () => void;
  submitting?: boolean;
}

export function SubmissionDialog({
  open,
  sections,
  totalQuestions,
  totalAnswered,
  onClose,
  onConfirm,
  submitting = false,
}: SubmissionDialogProps) {
  const [confirmed, setConfirmed] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setConfirmed(false);
    }
  }, [open]);

  const unansweredCount = totalQuestions - totalAnswered;
  const allAnswered = unansweredCount === 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconWrapper icon="mdi:file-check" size={24} />
          <Typography variant="h6" fontWeight={600}>
            Submit Assessment
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {/* Completion Status */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight={600} gutterBottom>
            Review Your Submission
          </Typography>
          <Box
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: allAnswered ? "#f3f4f6" : "#fef3c7",
              borderRadius: 1,
              border: `1px solid ${allAnswered ? "#9ca3af" : "#f59e0b"}`,
            }}
          >
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Questions Answered: {totalAnswered} / {totalQuestions}
            </Typography>
            {!allAnswered && (
              <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                You have {unansweredCount} unanswered question
                {unansweredCount !== 1 ? "s" : ""}. Are you sure you want to
                submit?
              </Typography>
            )}
          </Box>
        </Box>

        {/* Section Breakdown */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Section Breakdown:
          </Typography>
          {sections.map((section, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                py: 1,
                borderBottom:
                  index < sections.length - 1 ? "1px solid #e5e7eb" : "none",
              }}
            >
              <Typography variant="body2">{section.sectionName}</Typography>
              <Typography variant="body2" fontWeight={600}>
                {section.answered} / {section.total}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Violation Count */}

        <Divider sx={{ my: 2 }} />

        {/* Confirmation Checkbox */}
        <FormControlLabel
          control={
            <Checkbox
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
          }
          label={
            <Typography variant="body2">
              I confirm that I want to submit my assessment. I understand that I
              cannot change my answers after submission.
            </Typography>
          }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={!confirmed || submitting}
          startIcon={<IconWrapper icon="mdi:check-circle" />}
          sx={{
            backgroundColor: "#374151",
            "&:hover": {
              backgroundColor: "#1f2937",
            },
          }}
        >
          {submitting ? "Submitting..." : "Confirm Submit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
