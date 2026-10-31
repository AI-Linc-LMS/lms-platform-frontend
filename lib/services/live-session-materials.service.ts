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

/** One screenful. Page cost is roughly linear in rows once the fixed query cost is paid, so
 *  asking for everything up front is what made this slow. Matches the server default. */
export const PAGE_SIZE = 20;

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
  /** Which sitting the file is for. Null means it spans the whole series (a syllabus). */
  occurrence_id: number | null;
  /** Start of that sitting, so the UI can label a file without a second lookup. Null when series-wide. */
  occurrence_datetime: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * The same material, as the across-all-sessions list returns it: carrying which class it came
 * from so the UI can group without a second request per row.
 */
export interface MySessionMaterial extends LiveSessionMaterial {
  live_class_id: number;
  session_title: string;
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
  /**
   * Every file a trainer shared with this learner, across all of their sessions, newest first.
   *
   * Not a fan-out over `list`: that is one request per session for a surface whose whole point is
   * to be a single list. The backend answers it in one query, scoped by the same rule that builds
   * the learner's own session list.
   */
  mine: async (
    opts: { limit?: number; offset?: number } = {}
  ): Promise<{ hasMore: boolean; results: MySessionMaterial[] }> => {
    const res = await apiClient.get<{ has_more?: boolean; results: MySessionMaterial[] }>(
      `${BASE}/my-session-materials/`,
      { params: { limit: opts.limit ?? PAGE_SIZE, offset: opts.offset ?? 0 } }
    );
    return {
      hasMore: Boolean(res.data?.has_more),
      results: Array.isArray(res.data?.results) ? res.data.results : [],
    };
  },

  /**
   * `occurrenceId` scopes the list to one sitting: that date's files plus the series-wide ones.
   * Omitting it returns the whole series, which is the staff manage-everything view. A recurring
   * series was a single shelf, so week 3's slides were served under week 1 and week 40 alike.
   */
  list: async (
    liveClassId: number,
    occurrenceId?: number | null
  ): Promise<LiveSessionMaterial[]> => {
    const res = await apiClient.get<LiveSessionMaterial[]>(
      `${BASE}/live-activities/${liveClassId}/materials/`,
      occurrenceId ? { params: { occurrence_id: occurrenceId } } : undefined
    );
    return Array.isArray(res.data) ? res.data : [];
  },

  upload: async (
    liveClassId: number,
    file: File,
    meta: { title?: string; description?: string; occurrenceId?: number | null }
  ): Promise<LiveSessionMaterial> => {
    const form = new FormData();
    form.append("file", file);
    if (meta.title) form.append("title", meta.title);
    if (meta.description) form.append("description", meta.description);
    if (meta.occurrenceId) form.append("occurrence_id", String(meta.occurrenceId));
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
    // `occurrence_id: null` re-files a material as series-wide. Re-filing is the only remedy for
    // everything uploaded before dates existed: those rows are all series-wide and no backfill can
    // know which week a file was for.
    patch: { title?: string; description?: string; occurrence_id?: number | null }
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
