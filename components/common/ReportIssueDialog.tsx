"use client";

import { useState, useRef } from "react";
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
  IconButton,
} from "@mui/material";
import { IconWrapper } from "./IconWrapper";
import { reportIssue, ReportIssueRequest } from "@/lib/services/client.service";
import { uploadFile } from "@/lib/services/file-upload.service";
import { config } from "@/lib/config";
import { useToast } from "./Toast";

interface ReportIssueDialogProps {
  open: boolean;
  onClose: () => void;
  courseId?: number;
  contentId?: number;
}

const SUPPORT_TYPES = [
  { value: "technical", label: "Technical Support" },
  { value: "content", label: "Content Help" },
  { value: "video", label: "Video Help" },
  { value: "quiz", label: "Quiz/Assessment Help" },
  { value: "navigation", label: "Navigation Help" },
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
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleSubmit = async () => {
    if (!issueType || !description.trim()) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    try {
      setSubmitting(true);
      const clientId = Number(config.clientId);

      let screenshotUrl: string | undefined;
      if (screenshotFile) {
        setUploadingScreenshot(true);
        const result = await uploadFile(clientId, screenshotFile, "report_issue");
        screenshotUrl = result.url;
        setUploadingScreenshot(false);
      }

      const issueData: ReportIssueRequest = {
        issue_type: issueType,
        description: description.trim(),
        subject: issueType,
        course_id: courseId,
        content_id: contentId,
        page_url: window.location.href,
        ...(screenshotUrl && { screenshot_url: screenshotUrl }),
      };

      await reportIssue(clientId, issueData);

      showToast("Your request has been sent. We'll get back to you soon.", "success");
      handleClose();
    } catch (error: any) {
      showToast(
        error.message || "Failed to send. Please try again.",
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
      setScreenshotFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
            backgroundColor: "#4285f4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconWrapper icon="mdi:headset" size={24} color="#ffffff" />
        </Box>
        Support and Help
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            Get technical support, content help, video help, and more. We're
            here to assist you.
          </Typography>

          <TextField
            select
            label="What do you need help with?"
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
            {SUPPORT_TYPES.map((option) => (
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
            placeholder="Describe your question or issue..."
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
              },
            }}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setScreenshotFile(file);
            }}
            style={{ display: "none" }}
          />

          <Box
            onClick={() =>
              !submitting && !uploadingScreenshot && fileInputRef.current?.click()
            }
            sx={{
              border: "2px dashed rgba(0,0,0,0.12)",
              borderRadius: 1.5,
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              backgroundColor: "#f9fafb",
              cursor: submitting || uploadingScreenshot ? "default" : "pointer",
              opacity: submitting || uploadingScreenshot ? 0.7 : 1,
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor:
                  submitting || uploadingScreenshot ? undefined : "#4285f4",
                backgroundColor:
                  submitting || uploadingScreenshot
                    ? undefined
                    : "rgba(66, 133, 244, 0.04)",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <IconWrapper
                icon="mdi:image-plus"
                size={24}
                color={screenshotFile ? "#22c55e" : "#9ca3af"}
              />
              <Typography variant="body2" sx={{ color: "#4b5563" }}>
                {uploadingScreenshot
                  ? "Uploading screenshot..."
                  : screenshotFile
                    ? screenshotFile.name
                    : "Attach screenshot (optional)"}
              </Typography>
            </Box>
            {screenshotFile && !uploadingScreenshot && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setScreenshotFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                sx={{ color: "#6b7280" }}
                aria-label="Remove screenshot"
              >
                <IconWrapper icon="mdi:close" size={18} />
              </IconButton>
            )}
          </Box>
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
            backgroundColor: "#4285f4",
            "&:hover": {
              backgroundColor: "#3367d6",
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
          {submitting ? "Sending..." : "Submit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
