/**
 * Presentation for course handouts, shared by the admin builder and the learner topic page.
 *
 * Shared on purpose: a deck that shows as an orange slide icon to the admin who uploaded it and
 * a generic grey page to the student reading it is the same file described two ways, and the
 * mismatch reads as a broken upload.
 */

export interface AttachmentLike {
  kind?: string;
  extension?: string;
  original_name?: string;
  size_bytes?: number;
}

export interface AttachmentLook {
  icon: string;
  accent: string;
  /** What this file IS, in a word a student recognises — not the MIME type. */
  label: string;
}

const LOOKS: Record<string, AttachmentLook> = {
  pdf: { icon: "mdi:file-pdf-box", accent: "#ef4444", label: "PDF" },
  slides: { icon: "mdi:file-presentation-box", accent: "#f97316", label: "Slides" },
  doc: { icon: "mdi:file-word-outline", accent: "#3b82f6", label: "Document" },
  sheet: { icon: "mdi:file-excel-outline", accent: "#10b981", label: "Spreadsheet" },
  image: { icon: "mdi:file-image-outline", accent: "#a855f7", label: "Image" },
  file: { icon: "mdi:file-outline", accent: "#64748b", label: "File" },
};

/** Extension fallback for rows written before the server derived `kind`, or if it ever sends
 *  one this table does not know. Never returns undefined — an unrenderable row is worse than a
 *  generic icon. */
const BY_EXTENSION: Record<string, string> = {
  pdf: "pdf",
  ppt: "slides",
  pptx: "slides",
  doc: "doc",
  docx: "doc",
  txt: "doc",
  xls: "sheet",
  xlsx: "sheet",
  csv: "sheet",
  png: "image",
  jpg: "image",
  jpeg: "image",
};

export function attachmentLook(a: AttachmentLike): AttachmentLook {
  const byKind = a.kind ? LOOKS[a.kind] : undefined;
  if (byKind) return byKind;
  const ext = (a.extension || a.original_name?.split(".").pop() || "").toLowerCase().replace(".", "");
  return LOOKS[BY_EXTENSION[ext] ?? "file"];
}

/** Bytes as something a human reads before deciding to download on mobile data. */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  // One decimal under 10MB, none above: "1.4 MB" is useful, "14.2 MB" is noise.
  return mb < 10 ? `${mb.toFixed(1)} MB` : `${Math.round(mb)} MB`;
}

/** Extensions the server accepts, in the one place the file picker and the help text both read. */
export const ATTACHMENT_ACCEPT =
  ".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg";

/** Server-side cap for `module=course_attachment`. Checked client-side too so a learner on a
 *  slow connection is not made to upload 80MB before being told no. */
export const ATTACHMENT_MAX_MB = 50;
