import apiClient from "./api";
import { config } from "../config";

/**
 * Study materials attached to a live session.
 *
 * One service for every audience. The backend already decides what each caller may see and do — a
 * learner reading the same endpoint gets the instructor CODE and no real name — so the frontend
 * does not need (and must not invent) a second copy of that rule.
 */
const BASE = `/live-class/api/clients/${config.clientId}`;

export type MaterialFileType =
  | "pdf" | "image" | "document" | "spreadsheet" | "presentation"
  | "text" | "video" | "audio" | "archive" | "code" | "other";

export interface LiveSessionMaterial {
  id: number;
  title: string;
  description: string;
  file_url: string | null;
  file_type: MaterialFileType;
  file_size: number;
  original_filename: string;
  mime_type: string;
  /** Learner-facing uploader identity — the instructor code. Always present. */
  uploaded_by_label: string;
  /** Real name. Null for learners by design, so it cannot leak through the payload. */
  uploaded_by_name: string | null;
  created_at: string;
  updated_at: string;
}

/** Human file size — "2.4 MB". Bytes are meaningless to a learner deciding whether to download. */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

/** Icon per file type — keep in step with the backend's classifier. */
export const MATERIAL_ICONS: Record<MaterialFileType, string> = {
  pdf: "mdi:file-pdf-box",
  image: "mdi:file-image-outline",
  document: "mdi:file-document-outline",
  spreadsheet: "mdi:file-table-outline",
  presentation: "mdi:file-presentation-box",
  text: "mdi:text-box-outline",
  video: "mdi:file-video-outline",
  audio: "mdi:file-music-outline",
  archive: "mdi:folder-zip-outline",
  code: "mdi:file-code-outline",
  other: "mdi:file-outline",
};

export const liveSessionMaterialsService = {
  list: async (liveClassId: number): Promise<LiveSessionMaterial[]> => {
    const res = await apiClient.get<LiveSessionMaterial[]>(
      `${BASE}/live-activities/${liveClassId}/materials/`
    );
    return Array.isArray(res.data) ? res.data : [];
  },

  upload: async (
    liveClassId: number,
    file: File,
    meta: { title?: string; description?: string }
  ): Promise<LiveSessionMaterial> => {
    const form = new FormData();
    form.append("file", file);
    if (meta.title) form.append("title", meta.title);
    if (meta.description) form.append("description", meta.description);
    // Content-Type is left to the browser so it can set the multipart boundary.
    const res = await apiClient.post<LiveSessionMaterial>(
      `${BASE}/live-activities/${liveClassId}/materials/`,
      form
    );
    return res.data;
  },

  update: async (
    liveClassId: number,
    materialId: number,
    patch: { title?: string; description?: string }
  ): Promise<LiveSessionMaterial> => {
    const res = await apiClient.patch<LiveSessionMaterial>(
      `${BASE}/live-activities/${liveClassId}/materials/${materialId}/`,
      patch
    );
    return res.data;
  },

  remove: async (liveClassId: number, materialId: number): Promise<void> => {
    await apiClient.delete(
      `${BASE}/live-activities/${liveClassId}/materials/${materialId}/`
    );
  },
};
