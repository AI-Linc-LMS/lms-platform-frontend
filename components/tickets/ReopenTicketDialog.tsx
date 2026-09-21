"use client";

import { useRef, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  IconButton,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { LoadingButton } from "@/components/common/LoadingButton";
import { ResponsiveDialog } from "@/components/common/mobile/ResponsiveDialog";
import { useToast } from "@/components/common/Toast";
import { uploadFile } from "@/lib/services/file-upload.service";
import { ticketService, Ticket } from "@/lib/services/ticket.service";

interface Props {
  open: boolean;
  ticketId: number;
  clientId: number;
  onClose: () => void;
  onReopened: (ticket: Ticket) => void;
}

const MAX_ATTACHMENTS = 5;
const ACCEPTED_TYPES =
  "image/png,image/jpeg,image/jpg,image/gif,image/webp,application/pdf";

export function ReopenTicketDialog({
  open,
  ticketId,
  clientId,
  onClose,
  onReopened,
}: Props) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [details, setDetails] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const additions = Array.from(incoming);
    setFiles((prev) => {
      const room = MAX_ATTACHMENTS - prev.length;
      if (room <= 0) {
        showToast(
          `You can attach up to ${MAX_ATTACHMENTS} files.`,
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

  const reset = () => {
    setDetails("");
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (submitting || uploading) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!details.trim()) {
      showToast(
        "Please describe why you need to reopen this ticket.",
        "error",
      );
      return;
    }
    setSubmitting(true);
    try {
      let attachmentUrls: string[] = [];
      if (files.length > 0) {
        setUploading(true);
        const uploads = await Promise.all(
          files.map((file) => uploadFile(clientId, file, "report_issue")),
        );
        attachmentUrls = uploads.map((u) => u.url).filter(Boolean);
        setUploading(false);
      }

      const updated = await ticketService.reopen(clientId, ticketId, {
        additional_details: details.trim(),
        additional_attachments: attachmentUrls,
      });

      showToast(
        "Ticket reopened. Our team will get back to you shortly.",
        "success",
      );
      reset();
      onReopened(updated);
      onClose();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to reopen ticket",
        "error",
      );
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    // A centred dialog on a phone lands mid-screen with its own scrollbar and puts "Reopen" under
    // the keyboard the moment you start typing. This one comes up from the bottom instead; above
    // `sm` it is exactly the dialog it was.
    <ResponsiveDialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      title={
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1.5 }}>
          <Box
            component="span"
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, var(--ticket-reopen) 0%, var(--warning-amber) 100%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(249,115,22,0.28)",
            }}
          >
            <IconWrapper icon="mdi:lock-reset" size={22} color="var(--font-light)" />
          </Box>
          Reopen this ticket
        </Box>
      }
      footer={
        <>
          <Button
            onClick={handleClose}
            disabled={submitting || uploading}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              minHeight: { xs: 48, sm: 0 },
              color: "var(--font-primary-dark)",
              "&:hover": { backgroundColor: "var(--ticket-row-divider)" },
            }}
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={handleSubmit}
            disabled={!details.trim()}
            loading={submitting || uploading}
            loadingText={uploading ? t("common.loading") : t("common.submitting")}
            variant="contained"
            startIcon={<IconWrapper icon="mdi:lock-reset" size={18} />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              px: 2.5,
              borderRadius: 999,
              background:
                "linear-gradient(135deg, var(--ticket-reopen) 0%, var(--warning-amber) 100%)",
              color: "var(--font-light)",
              boxShadow: "0 4px 12px rgba(249,115,22,0.28)",
              "&:hover": {
                background:
                  "linear-gradient(135deg, var(--ticket-reopen-hover) 0%, var(--proctoring-strong-dark) 100%)",
                boxShadow: "0 6px 16px rgba(249,115,22,0.36)",
              },
              "&.Mui-disabled": {
                background: "var(--border-default)",
                color: "var(--font-tertiary)",
                boxShadow: "none",
              },
            }}
          >
            Reopen ticket
          </LoadingButton>
        </>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
          <Typography
            variant="body2"
            sx={{ color: "var(--font-muted)", fontWeight: 500 }}
          >
            Let our team know what's still not working. They'll re‑attend to
            your ticket and respond by email and in‑app notification.
          </Typography>

          <TextField
            label="What's still not resolved?"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            multiline
            rows={5}
            fullWidth
            required
            disabled={submitting}
            placeholder="Describe what you tried, what didn't work, and any new information that might help."
            InputLabelProps={{
              sx: {
                color: "var(--font-muted)",
                fontWeight: 500,
                "&.Mui-focused": { color: "var(--ticket-reopen)" },
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
                "& fieldset": { borderColor: "var(--border-light)" },
                "&:hover fieldset": { borderColor: "var(--font-tertiary)" },
                "&.Mui-focused fieldset": { borderColor: "var(--ticket-reopen)" },
              },
              "& .MuiInputBase-input, & .MuiInputBase-inputMultiline": {
                color: "var(--ticket-text-strong)",
                fontWeight: 500,
              },
              "& .MuiInputBase-input::placeholder, & .MuiInputBase-inputMultiline::placeholder":
                { color: "var(--font-secondary)", opacity: 1 },
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
              border: "1.5px dashed var(--border-light)",
              borderRadius: 1.5,
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              backgroundColor: "var(--surface)",
              cursor: submitting || uploading ? "default" : "pointer",
              opacity: submitting || uploading ? 0.7 : 1,
              transition: "all 0.15s ease",
              "&:hover": {
                borderColor:
                  submitting || uploading ? undefined : "var(--ticket-reopen)",
                backgroundColor:
                  submitting || uploading ? undefined : "var(--ticket-reopen-bg)",
              },
            }}
          >
            <IconWrapper
              icon="mdi:paperclip"
              size={22}
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
                  ? `${files.length} file${files.length === 1 ? "" : "s"} attached - click to add more`
                  : `Attach screenshots / docs (optional, up to ${MAX_ATTACHMENTS})`}
            </Typography>
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
                    border: "1px solid var(--border-default)",
                    borderRadius: 1.5,
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
                        color: "var(--ticket-text-strong)",
                        fontWeight: 500,
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
                    sx={{
                      color: "var(--font-secondary)",
                      // A 34px icon button is a miss on a thumb.
                      width: { xs: 44, sm: "auto" },
                      height: { xs: 44, sm: "auto" },
                      flexShrink: 0,
                    }}
                  >
                    <IconWrapper icon="mdi:close" size={16} />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          )}
      </Box>
    </ResponsiveDialog>
  );
}
