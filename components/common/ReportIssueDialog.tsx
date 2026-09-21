"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
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
  IconButton,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import { MuiTelInput, matchIsValidTel } from "mui-tel-input";
import { useAuth } from "@/lib/auth/auth-context";
import { dialableNumber, profilePhoneForPrefill } from "@/lib/utils/whatsapp";
import { IconWrapper } from "./IconWrapper";
import { LoadingButton } from "./LoadingButton";
import {
  ticketService,
  TICKET_CATEGORY_OPTIONS,
  type TicketCategory,
  type TicketContactPreference,
} from "@/lib/services/ticket.service";
import { uploadFile } from "@/lib/services/file-upload.service";
import { config } from "@/lib/config";
import { useToast } from "./Toast";
import { ResponsiveDialog } from "./mobile/ResponsiveDialog";
import { PHONE } from "./mobile/phone";

interface ReportIssueDialogProps {
  open: boolean;
  onClose: () => void;
  courseId?: number;
  contentId?: number;
}

const MAX_ATTACHMENTS = 5;
const MAX_FILE_MB = 50; // matches the backend cap for the report_issue module (images + video)
const ACCEPTED_TYPES =
  "image/png,image/jpeg,image/jpg,image/gif,image/webp,application/pdf," +
  "video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,video/3gpp";

export function ReportIssueDialog({
  open,
  onClose,
  courseId,
  contentId,
}: ReportIssueDialogProps) {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const [issueType, setIssueType] = useState<TicketCategory | "">("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  // A WhatsApp number is REQUIRED so support can message the learner directly; the backend refuses a
  // ticket without one. Stored stripped of spaces (E.164), exactly as the profile phone field does.
  const { user } = useAuth();
  const [contactPhone, setContactPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  // Optional, and separate from the account email on purpose: support already knows the address
  // someone signed up with — what it lacks is the one they actually want used.
  const [contactEmail, setContactEmail] = useState("");
  const [contactPreference, setContactPreference] = useState<TicketContactPreference>("whatsapp");
  // Both rules, so the form can never accept a number the server then refuses: libphonenumber's
  // check alone passes real 7-digit numbers (Niue, Tokelau) that E.164-for-WhatsApp does not.
  const phoneValid = matchIsValidTel(contactPhone) && dialableNumber(contactPhone) !== null;
  // Submit stays disabled until the number is valid, so the error must not wait for a blur that may
  // never come: show it once the rest of the form is filled in, or after the field is touched.
  const showPhoneError = !phoneValid && (phoneTouched || (Boolean(issueType) && Boolean(description.trim())));
  // The profile endpoint sends phone_number; the auth type's `phone` is only filled on one path.
  const profilePhone = user?.phone || (user as { phone_number?: string | null } | null)?.phone_number;

  // Most learners already gave a number on their profile; start from it rather than making a
  // required field something they must retype. Only when opening, and only into an empty field,
  // so it never overwrites what someone is typing.
  useEffect(() => {
    if (open && !contactPhone) {
      const prefill = profilePhoneForPrefill(profilePhone);
      if (prefill) setContactPhone(prefill);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profilePhone]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleAddFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const all = Array.from(incoming);
    const additions = all.filter((f) => f.size <= MAX_FILE_MB * 1024 * 1024);
    if (additions.length < all.length) {
      showToast(`Each file must be ${MAX_FILE_MB}MB or smaller.`, "warning");
    }
    if (additions.length === 0) return;
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
    if (!phoneValid) {
      setPhoneTouched(true);
      showToast("Add your WhatsApp number so support can reach you.", "error");
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
        // Prefer the S3 object key (storage_path): the backend re-signs a fresh URL from it on
        // read, so the attachment never expires the way a stored presigned URL does.
        attachmentUrls = uploads.map((u) => u.storage_path || u.url).filter(Boolean);
        setUploading(false);
      }

      // "Email" without an address would point support at nothing; WhatsApp is the honest fallback.
      // "whatsapp" itself is NOT sent: the backend defaults to it whenever a number is given, and a
      // backend older than this form rejects the value outright - so omitting it keeps this form
      // working whichever of the two deploys first.
      const preference =
        contactPreference === "email" && !contactEmail.trim() ? "whatsapp" : contactPreference;
      const ticket = await ticketService.create(clientId, {
        category: issueType,
        description: description.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.replace(/\s+/g, ""),
        ...(preference && preference !== "whatsapp" ? { contact_preference: preference } : {}),
        user_attachments: attachmentUrls,
        course_id: courseId,
        content_id: contentId,
        page_url:
          typeof window !== "undefined" ? window.location.href : undefined,
      });

      showToast(
        `Ticket #${ticket.id} created. We'll get back to you soon - track it in My Tickets.`,
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
    // Contact details reset with everything else. They are per-ticket, not a saved profile:
    // leaving them behind would carry one ticket's phone number into the next one silently.
    setContactEmail("");
    setContactPhone("");
    setPhoneTouched(false);
    setContactPreference("whatsapp");
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  // The form, the dismiss and the submit are one set of elements; only the frame differs.
  const form = (
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

      {/* How support reaches them. The WhatsApp number is REQUIRED - it is how an admin
          contacts the learner directly from the ticket. Email stays optional. */}
      <Stack spacing={1.5}>
        <Typography
          sx={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--font-secondary)" }}
        >
          How can support reach you?
        </Typography>
        <MuiTelInput
          label="WhatsApp number"
          value={contactPhone}
          defaultCountry="IN"
          onChange={(v) => setContactPhone((v || "").replace(/\s+/g, ""))}
          onBlur={() => setPhoneTouched(true)}
          required
          fullWidth
          size="small"
          disabled={submitting}
          error={showPhoneError}
          helperText={
            showPhoneError
              ? contactPhone
                ? "Enter a valid number, including the country code."
                : "A WhatsApp number is required so support can reach you."
              : "Support will message you on WhatsApp about this ticket."
          }
        />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            label="Email (optional)"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            fullWidth
            size="small"
            disabled={submitting}
            placeholder="A better address than your account one"
          />
          <TextField
            select
            label="Prefer"
            value={contactPreference}
            onChange={(e) =>
              setContactPreference(e.target.value as TicketContactPreference)
            }
            size="small"
            disabled={submitting}
            sx={{ minWidth: { sm: 180 } }}
          >
            <MenuItem value="whatsapp">WhatsApp</MenuItem>
            <MenuItem value="phone">Phone call</MenuItem>
            <MenuItem value="email" disabled={!contactEmail.trim()}>
              Email
            </MenuItem>
          </TextField>
        </Stack>
      </Stack>

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
                ? `${files.length} file${files.length === 1 ? "" : "s"} attached - click to add more`
                : `Attach screenshots, docs or a video (optional, up to ${MAX_ATTACHMENTS}, ${MAX_FILE_MB}MB each)`}
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
                sx={{ color: "var(--font-secondary)", [PHONE]: { width: 44, height: 44 } }}
                onClick={(e) => {
                  e.stopPropagation();
                  removeFileAt(i);
                }}
                disabled={uploading || submitting}
                aria-label="Remove attachment"
              >
                <IconWrapper icon="mdi:close" size={16} />
              </IconButton>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
  const cancelButton = (
    <Button
      onClick={handleClose}
      disabled={submitting || uploading}
      sx={{
        textTransform: "none",
        fontWeight: 600,
        color: "var(--font-primary-dark)",
        [PHONE]: { minHeight: 48 },
        "&:hover": {
          backgroundColor: "var(--ticket-row-divider)",
        },
      }}
    >
      Cancel
    </Button>
  );
  const submitButton = (
    <LoadingButton
      onClick={handleSubmit}
      disabled={!issueType || !description.trim() || !phoneValid}
      loading={submitting || uploading}
      loadingText={uploading ? t("common.uploading") : t("common.submitting")}
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
        [PHONE]: { minHeight: 48 },
      }}
      startIcon={<IconWrapper icon="mdi:send" size={18} />}
    >
      Submit ticket
    </LoadingButton>
  );

  // A phone gets a bottom sheet: the title, a scrolling form, and the two actions pinned above
  // the home indicator. While a ticket is uploading or sending, it cannot be dismissed.
  if (isPhone) {
    const busy = submitting || uploading;
    return (
      <ResponsiveDialog
        open={open}
        onClose={handleClose}
        title="Support and Help"
        hideCloseButton={busy}
        maxHeightVh={92}
        data-testid="report-issue-sheet"
        footer={
          <>
            {cancelButton}
            {submitButton}
          </>
        }
      >
        <Box
          sx={{
            // Small MUI inputs are 40px; a thumb needs 44.
            "& .MuiInputBase-sizeSmall": { minHeight: 44 },
            // The country-flag picker inside the WhatsApp field.
            "& .MuiInputAdornment-root .MuiIconButton-root": { minWidth: 44, minHeight: 44 },
          }}
        >
          {form}
        </Box>
      </ResponsiveDialog>
    );
  }

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
        {form}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
        {cancelButton}
        {submitButton}
      </DialogActions>
    </Dialog>
  );
}
