/**
 * Shared constants & helpers for the file-upload picker UIs.
 *
 * The original `<SubmoduleAttachments />` component was removed when attachments
 * were re-scoped from the submodule level to the content level. Only the
 * shared upload-helper exports remain so that callers in ContentList don't
 * need to be updated.
 */

export const ATTACHMENT_ACCEPT_TYPES =
  ".pdf,.png,.jpg,.jpeg,.gif,.webp,.bmp,.svg,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.csv,application/pdf,image/*";

export const ATTACHMENT_MAX_FILE_SIZE = 50 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}
