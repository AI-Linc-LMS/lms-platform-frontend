/**
 * Minimal shape required for preview - the course-builder attachment types and the live-session
 * material types all satisfy it. `file_type` is a plain string rather than one backend's enum
 * because two different backends classify files here (course attachments: 5 buckets, session
 * materials: 11); the dispatcher routes on the value, and an unknown one falls back safely.
 */
export interface PreviewableAttachment {
  file_url: string | null;
  file_type: string;
  original_filename: string;
  mime_type: string;
}

export const PREVIEW_HEIGHT = 600;

export function isOfficeDoc(filename: string): boolean {
  const lower = filename.toLowerCase();
  return /\.(docx?|pptx?|xlsx?|odt|ods|odp)$/.test(lower);
}
