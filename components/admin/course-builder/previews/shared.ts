import type { SubmoduleAttachmentType } from "@/lib/services/admin/admin-course-builder.service";

/** Minimal shape required for preview - both admin and student types satisfy this. */
export interface PreviewableAttachment {
  file_url: string | null;
  file_type: SubmoduleAttachmentType;
  original_filename: string;
  mime_type: string;
}

export const PREVIEW_HEIGHT = 600;

export function isOfficeDoc(filename: string): boolean {
  const lower = filename.toLowerCase();
  return /\.(docx?|pptx?|xlsx?|odt|ods|odp)$/.test(lower);
}
