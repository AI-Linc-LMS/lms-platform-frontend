"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { IconWrapper } from "./IconWrapper";
import { reportIssue, ReportIssueRequest } from "@/lib/services/client.service";
import { config } from "@/lib/config";
import { useToast } from "./Toast";

interface ReportIssueDialogProps {
  open: boolean;
  onClose: () => void;
  courseId?: number;
  contentId?: number;
}

const ISSUE_TYPES = [
  { value: "technical", label: "Technical Issue" },
  { value: "content", label: "Content Error" },
  { value: "video", label: "Video Problem" },
  { value: "quiz", label: "Quiz/Assessment Issue" },
  { value: "navigation", label: "Navigation Problem" },
  { value: "other", label: "Other" },
];

export function ReportIssueDialog({
  open,
  onClose,
  courseId,
  contentId,
}: ReportIssueDialogProps) {
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async () => {
    if (!issueType || !description.trim()) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    try {
      setSubmitting(true);

      const issueData: ReportIssueRequest = {
        issue_type: issueType,
        description: description.trim(),
        subject: issueType,
        course_id: courseId,
        content_id: contentId,
        page_url: window.location.href,
      };

      const clientId = Number(config.clientId);
      await reportIssue(clientId, issueData);

      showToast("Issue reported successfully! We'll look into it.", "success");
      handleClose();
    } catch (error: any) {
      showToast(
        error.message || "Failed to report issue. Please try again.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setIssueType("");
      setDescription("");
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          pb: 1,
          fontWeight: 600,
          fontSize: "1.25rem",
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: "#ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconWrapper icon="mdi:alert-circle" size={24} color="#ffffff" />
        </Box>
        Report an Issue
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            Help us improve your experience by reporting any issues you
            encounter. We'll investigate and get back to you as soon as
            possible.
          </Typography>

          <TextField
            select
            label="Issue Type"
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            fullWidth
            required
            disabled={submitting}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
              },
            }}
          >
            {ISSUE_TYPES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={4}
            fullWidth
            required
            disabled={submitting}
            placeholder="Please describe the issue in detail..."
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
              },
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
        <Button
          onClick={handleClose}
          disabled={submitting}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: "#6b7280",
            "&:hover": {
              backgroundColor: "#f3f4f6",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !issueType || !description.trim()}
          variant="contained"
          sx={{
            textTransform: "none",
            fontWeight: 600,
            backgroundColor: "#ef4444",
            "&:hover": {
              backgroundColor: "#dc2626",
            },
            "&:disabled": {
              backgroundColor: "#f3f4f6",
              color: "#9ca3af",
            },
          }}
          startIcon={
            submitting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <IconWrapper icon="mdi:send" size={18} />
            )
          }
        >
          {submitting ? "Submitting..." : "Submit Report"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
