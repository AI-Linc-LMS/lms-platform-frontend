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
  Stack,
} from "@mui/material";
import Link from "next/link";
import { IconWrapper } from "./IconWrapper";
import {
  ticketService,
  TICKET_CATEGORY_OPTIONS,
  TicketCategory,
} from "@/lib/services/ticket.service";
import { uploadFile } from "@/lib/services/file-upload.service";
import { config } from "@/lib/config";
import { useToast } from "./Toast";

interface ReportIssueDialogProps {
  open: boolean;
  onClose: () => void;
  courseId?: number;
  contentId?: number;
}

const MAX_ATTACHMENTS = 5;
const ACCEPTED_TYPES =
  "image/png,image/jpeg,image/jpg,image/gif,image/webp,application/pdf";

export function ReportIssueDialog({
  open,
  onClose,
  courseId,
  contentId,
}: ReportIssueDialogProps) {
  const [issueType, setIssueType] = useState<TicketCategory | "">("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleAddFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const additions = Array.from(incoming);
    setFiles((prev) => {
      const room = MAX_ATTACHMENTS - prev.length;
      if (room <= 0) {
        showToast(
          `You can attach up to ${MAX_ATTACHMENTS} files per ticket.`,
          "warning",
        );
        return prev;
      }
      return [...prev, ...additions.slice(0, room)];
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFileAt = (index: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!issueType || !description.trim()) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    try {
      setSubmitting(true);
      const clientId = Number(config.clientId);

      let attachmentUrls: string[] = [];
      if (files.length > 0) {
        setUploading(true);
        const uploads = await Promise.all(
          files.map((file) => uploadFile(clientId, file, "report_issue")),
        );
        attachmentUrls = uploads.map((u) => u.url).filter(Boolean);
        setUploading(false);
      }

      const ticket = await ticketService.create(clientId, {
        category: issueType,
        description: description.trim(),
        user_attachments: attachmentUrls,
        course_id: courseId,
        content_id: contentId,
        page_url:
          typeof window !== "undefined" ? window.location.href : undefined,
      });

      showToast(
        `Ticket #${ticket.id} created. We'll get back to you soon — track it in My Tickets.`,
        "success",
      );
      handleClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to send. Please try again.";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (submitting || uploading) return;
    setIssueType("");
    setDescription("");
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
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
            backgroundColor: "var(--ticket-brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconWrapper icon="mdi:headset" size={24} color="var(--font-light)" />
        </Box>
        Support and Help
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
          <Typography variant="body2" sx={{ color: "var(--font-muted)", fontWeight: 500 }}>
            Raise a support ticket and our team will get back to you. You can
            track all your tickets in{" "}
            <Link
              href="/tickets"
              style={{
                color: "var(--ticket-brand)",
                textDecoration: "underline",
                fontWeight: 600,
              }}
              onClick={handleClose}
            >
              My Tickets
            </Link>
            .
          </Typography>

          <TextField
            select
            label="What do you need help with?"
            value={issueType}
            onChange={(e) => setIssueType(e.target.value as TicketCategory)}
            fullWidth
            required
            disabled={submitting}
            InputLabelProps={{
              sx: {
                color: "var(--font-muted)",
                fontWeight: 500,
                "&.Mui-focused": { color: "var(--ticket-brand)" },
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
                "& fieldset": { borderColor: "var(--border-light)" },
                "&:hover fieldset": { borderColor: "var(--font-tertiary)" },
              },
              "& .MuiSelect-select, & .MuiInputBase-input": {
                color: "var(--ticket-text-strong)",
                fontWeight: 500,
              },
            }}
          >
            {TICKET_CATEGORY_OPTIONS.map((option) => (
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
            InputLabelProps={{
              sx: {
                color: "var(--font-muted)",
                fontWeight: 500,
                "&.Mui-focused": { color: "var(--ticket-brand)" },
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
                "& fieldset": { borderColor: "var(--border-light)" },
                "&:hover fieldset": { borderColor: "var(--font-tertiary)" },
              },
              "& .MuiInputBase-input, & .MuiInputBase-inputMultiline": {
                color: "var(--ticket-text-strong)",
                fontWeight: 500,
              },
              "& .MuiInputBase-input::placeholder, & .MuiInputBase-inputMultiline::placeholder":
                {
                  color: "var(--font-secondary)",
                  opacity: 1,
                },
            }}
          />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            onChange={(e) => handleAddFiles(e.target.files)}
            style={{ display: "none" }}
          />

          <Box
            onClick={() =>
              !submitting && !uploading && fileInputRef.current?.click()
            }
            sx={{
              border: "2px dashed rgba(0,0,0,0.12)",
              borderRadius: 1.5,
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              backgroundColor: "var(--surface)",
              cursor: submitting || uploading ? "default" : "pointer",
              opacity: submitting || uploading ? 0.7 : 1,
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor:
                  submitting || uploading ? undefined : "var(--ticket-brand)",
                backgroundColor:
                  submitting || uploading
                    ? undefined
                    : "rgba(66, 133, 244, 0.04)",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <IconWrapper
                icon="mdi:image-plus"
                size={24}
                color={
                  files.length > 0
                    ? "var(--ats-success-muted)"
                    : "var(--font-secondary)"
                }
              />
              <Typography
                variant="body2"
                sx={{ color: "var(--font-primary-dark)", fontWeight: 500 }}
              >
                {uploading
                  ? "Uploading attachments..."
                  : files.length > 0
                    ? `${files.length} file${files.length === 1 ? "" : "s"} attached — click to add more`
                    : `Attach screenshots / docs (optional, up to ${MAX_ATTACHMENTS})`}
              </Typography>
            </Box>
          </Box>

          {files.length > 0 && (
            <Stack spacing={1}>
              {files.map((f, i) => (
                <Box
                  key={`${f.name}-${i}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    p: 1,
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 1,
                    backgroundColor: "var(--card-bg)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      overflow: "hidden",
                    }}
                  >
                    <IconWrapper
                      icon="mdi:file-document-outline"
                      size={18}
                      color="var(--font-secondary)"
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color: "var(--font-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {f.name}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFileAt(i);
                    }}
                    disabled={uploading || submitting}
                    aria-label="Remove attachment"
                    sx={{ color: "var(--font-secondary)" }}
                  >
                    <IconWrapper icon="mdi:close" size={16} />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
        <Button
          onClick={handleClose}
          disabled={submitting || uploading}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: "var(--font-primary-dark)",
            "&:hover": {
              backgroundColor: "var(--ticket-row-divider)",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || uploading || !issueType || !description.trim()}
          variant="contained"
          sx={{
            textTransform: "none",
            fontWeight: 600,
            backgroundColor: "var(--ticket-brand)",
            color: "var(--font-light)",
            boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
            "&:hover": {
              backgroundColor: "var(--ticket-brand-hover)",
              boxShadow: "0 6px 16px rgba(37,99,235,0.32)",
            },
            "&.Mui-disabled": {
              backgroundColor: "var(--border-default)",
              color: "var(--font-tertiary)",
            },
          }}
          startIcon={
            submitting || uploading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <IconWrapper icon="mdi:send" size={18} />
            )
          }
        >
          {uploading
            ? "Uploading..."
            : submitting
              ? "Submitting..."
              : "Submit ticket"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
