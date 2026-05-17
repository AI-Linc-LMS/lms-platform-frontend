"use client";

import {
  forwardRef,
  memo,
  useDeferredValue,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Box, TextField, Button, Chip, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  RichTextEditor,
  type RichTextEditorFeature,
} from "@/components/common/RichTextEditor";
import { EmailTemplatePreview } from "@/components/common/EmailTemplatePreview";

// Module-level constant so React.memo on RichTextEditor doesn't see a fresh
// array reference on every render of the editor wrapper.
const EMAIL_TOOLBAR: RichTextEditorFeature[] = [
  "bold",
  "italic",
  "underline",
  "headings",
  "lists",
  "link",
  "history",
];

export interface EmailNotificationEditorHandle {
  /**
   * Snapshot the current editor state. Designed to be called at submit time
   * so we can keep all email state local and avoid parent re-renders while
   * typing.
   *
   * - `attachment`: the locally-picked File when the admin uploaded a new
   *   one. Sent as `multipart/form-data` to the create/update/publish APIs.
   * - `attachmentUrl`: the previously-saved attachment URL when the admin
   *   chose to keep an existing file (i.e. didn't pick a new one). Sent as
   *   `attachment_url` in the JSON payload so the backend knows to retain
   *   that file. Mutually exclusive with `attachment`.
   */
  getValues(): {
    enabled: boolean;
    subject: string;
    body: string;
    attachment: File | null;
    attachmentUrl: string | null;
  };
  /**
   * Overwrite subject + body with the current initial defaults. Used by the
   * "Send notification email" toggle to refill the editor on a fresh enable.
   */
  seedDefaults(): void;
}

interface EmailNotificationEditorProps {
  /**
   * Seed value for the subject. Auto-synced into the field as long as the
   * admin hasn't edited the subject (so changing the assessment title keeps
   * the subject up to date until the admin makes it their own).
   */
  initialSubject: string;
  /**
   * Seed value for the body. Used once when the editor mounts; deliberately
   * not re-synced afterwards because writing to a Tiptap document is expensive
   * (`editor.commands.setContent` rebuilds the whole ProseMirror tree).
   */
  initialBody: string;
  /**
   * URL of a previously-saved attachment to display on edit. When present the
   * editor renders a "currently attached" chip with a link. Uploading a new
   * file replaces it; if the admin doesn't touch it the backend keeps the
   * existing file (we don't re-send it in the payload).
   */
  initialAttachmentUrl?: string | null;
  /** Display name for the previously-saved attachment. Derived from URL if omitted. */
  initialAttachmentName?: string | null;
  readOnly?: boolean;
  /**
   * Called when the editor's "has real data" status transitions true ↔ false.
   * Used by the parent to derive `email_notification_enabled` and drive the
   * visibility of this section. Only fires on transitions, not per keystroke.
   */
  onEnabledChange?: (enabled: boolean) => void;
}

const deriveFilenameFromUrl = (url: string): string => {
  try {
    const path = url.split("?")[0].split("#")[0];
    const last = path.split("/").pop() || "";
    return last ? decodeURIComponent(last) : "attachment";
  } catch {
    return "attachment";
  }
};

const ALLOWED_EXT = [".pdf", ".ppt", ".pptx"];
const MAX_BYTES = 10 * 1024 * 1024;

const stripHtml = (html: string) =>
  html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

function EmailNotificationEditorInner(
  {
    initialSubject,
    initialBody,
    initialAttachmentUrl,
    initialAttachmentName,
    readOnly,
    onEnabledChange,
  }: EmailNotificationEditorProps,
  ref: React.Ref<EmailNotificationEditorHandle>
) {
  // Subject always tracks the live default built from the title — any change
  // to the title snaps the subject back to "Important Notification - <title>".
  // Admins can still type into the field for one-off tweaks, but the next
  // title keystroke will overwrite. This is the snap-back state-on-prop-change
  // pattern recommended for React 19 (no setState-in-effect).
  const [subject, setSubject] = useState(initialSubject);
  const [lastInitialSubject, setLastInitialSubject] = useState(initialSubject);
  if (initialSubject !== lastInitialSubject) {
    setLastInitialSubject(initialSubject);
    setSubject(initialSubject);
  }
  // The preview's H1 doesn't need to update on every keystroke — defer it so
  // the TextField stays responsive while React catches up on the preview.
  const previewSubject = useDeferredValue(subject);
  const [body, setBody] = useState(initialBody);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  // True when both subject AND body carry real (non-whitespace) content.
  // Drives the parent's `email_notification_enabled` flag + section visibility.
  const hasData = subject.trim().length > 0 && stripHtml(body).length > 0;

  // Notify the parent only when the boolean flips — useEffect deps compare by
  // Object.is, so passing the primitive `hasData` means we never call the
  // callback on every keystroke, only on true ↔ false transitions.
  useEffect(() => {
    onEnabledChange?.(hasData);
  }, [hasData, onEnabledChange]);

  useImperativeHandle(
    ref,
    () => ({
      getValues() {
        const trimmedSubject = subject.trim();
        const bodyText = stripHtml(body);
        const enabled = trimmedSubject.length > 0 && bodyText.length > 0;
        // A new File takes precedence; otherwise the saved URL (if any) is
        // returned so the backend can be told "keep the existing file".
        const carriedUrl =
          enabled && !attachment ? initialAttachmentUrl ?? null : null;
        return {
          enabled,
          subject: trimmedSubject,
          body: enabled ? body.trim() : "",
          attachment: enabled ? attachment : null,
          attachmentUrl: carriedUrl,
        };
      },
      seedDefaults() {
        setSubject(initialSubject);
        setLastInitialSubject(initialSubject);
        setBody(initialBody);
        setAttachment(null);
        setError(undefined);
      },
    }),
    [subject, body, attachment, initialSubject, initialBody, initialAttachmentUrl]
  );

  // Memoise the rich-text editor JSX so subject-only re-renders don't recreate
  // the editor element (which would bail React.memo on EmailTemplatePreview
  // and force the toolbar/preview tree to reconcile).
  const editorNode = useMemo(
    () => (
      <RichTextEditor
        value={body}
        onChange={setBody}
        readOnly={readOnly}
        minHeight={180}
        maxHeight={360}
        helperText="Tip: use {name} as a placeholder for the recipient's name."
        toolbar={EMAIL_TOOLBAR}
      />
    ),
    [body, readOnly]
  );

  const handleAttachmentChange = (file: File | null) => {
    if (!file) {
      setAttachment(null);
      setError(undefined);
      return;
    }
    const lower = file.name.toLowerCase();
    if (!ALLOWED_EXT.some((ext) => lower.endsWith(ext))) {
      setAttachment(null);
      setError("Only PDF, PPT, or PPTX files are allowed.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setAttachment(null);
      setError("File is larger than 10 MB.");
      return;
    }
    setAttachment(file);
    setError(undefined);
  };

  return (
    <Box
      sx={{
        px: 2,
        py: 2,
        borderBottom: "1px solid",
        borderColor: "var(--border-default)",
        bgcolor:
          "color-mix(in srgb, var(--accent-indigo) 4%, var(--surface) 96%)",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      <TextField
        label="Email subject"
        size="small"
        fullWidth
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        helperText="Subject auto-syncs with the assessment title. Title changes will overwrite local edits."
        disabled={readOnly}
        inputProps={{ maxLength: 200 }}
      />
      <EmailTemplatePreview
        subject={previewSubject}
        attachmentUrl={attachment ? null : initialAttachmentUrl ?? null}
        attachmentName={
          attachment?.name ||
          initialAttachmentName ||
          (initialAttachmentUrl
            ? deriveFilenameFromUrl(initialAttachmentUrl)
            : null)
        }
      >
        {editorNode}
      </EmailTemplatePreview>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, color: "var(--font-secondary)" }}
        >
          Attachment (optional)
        </Typography>
        <Box
          sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}
        >
          <Button
            component="label"
            size="small"
            variant="outlined"
            disabled={readOnly}
            startIcon={<IconWrapper icon="mdi:paperclip" size={18} />}
          >
            {attachment || initialAttachmentUrl
              ? "Replace file"
              : "Attach PDF or PPT"}
            <input
              type="file"
              hidden
              accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                handleAttachmentChange(file);
                e.target.value = "";
              }}
            />
          </Button>
          {attachment ? (
            <Chip
              icon={<IconWrapper icon="mdi:file-document-outline" size={16} />}
              label={`${attachment.name} (${(attachment.size / (1024 * 1024)).toFixed(2)} MB)`}
              onDelete={
                readOnly ? undefined : () => handleAttachmentChange(null)
              }
              size="small"
              sx={{ maxWidth: 360 }}
            />
          ) : initialAttachmentUrl ? (
            <Chip
              icon={<IconWrapper icon="mdi:paperclip-check" size={16} />}
              label={`${
                initialAttachmentName?.trim() ||
                deriveFilenameFromUrl(initialAttachmentUrl)
              } (saved)`}
              clickable
              size="small"
              onClick={() =>
                window.open(
                  initialAttachmentUrl,
                  "_blank",
                  "noopener,noreferrer"
                )
              }
              sx={{
                maxWidth: 360,
                bgcolor:
                  "color-mix(in srgb, var(--success-500) 12%, var(--surface) 88%)",
                color: "var(--success-500)",
                "& .MuiChip-icon": { color: "var(--success-500)" },
              }}
            />
          ) : null}
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: error
              ? "var(--danger-500, #d32f2f)"
              : "var(--font-secondary)",
          }}
        >
          {error ||
            (initialAttachmentUrl && !attachment
              ? "A file is already attached. Uploading a new one will replace it. Accepted formats: .pdf, .ppt, .pptx. Max size 10 MB."
              : "Accepted formats: .pdf, .ppt, .pptx. Max size 10 MB.")}
        </Typography>
      </Box>
    </Box>
  );
}

export const EmailNotificationEditor = memo(
  forwardRef(EmailNotificationEditorInner)
);

export default EmailNotificationEditor;
