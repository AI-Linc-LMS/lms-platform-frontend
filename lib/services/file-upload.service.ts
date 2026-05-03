import axios from "axios";
import apiClient from "./api";

export type FileUploadModule =
  | "assessment_screenshots"
  | "report_issue"
  | "profile_avatar"
  | "job_application"
  | "other";

export interface FileUploadResponse {
  id: number;
  url: string;
  filename: string;
  module: string;
  created_at: string;
}

export interface GetUploadedFilesResponse {
  files: FileUploadResponse[];
}

const URL_KEYS = [
  "url",
  "file_url",
  "screenshot_url",
  "s3_url",
  "public_url",
  "file_path",
] as const;

const NEST_KEYS = [
  "data",
  "file",
  "upload",
  "result",
  "payload",
  "response",
  "attributes",
  "detail",
] as const;

function isNonEmptyUrlString(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const s = v.trim();
  return s.length > 0 && (s.startsWith("http") || s.startsWith("//"));
}

/** Pulls a usable file URL from common Django / DRF / wrapper response shapes. */
function extractUploadUrlFromPayload(payload: unknown, depth = 0): string {
  if (depth > 6 || payload == null) return "";

  if (typeof payload === "string" && isNonEmptyUrlString(payload)) {
    return payload.trim();
  }

  if (typeof payload !== "object" || Array.isArray(payload)) return "";

  const obj = payload as Record<string, unknown>;

  for (const key of URL_KEYS) {
    const v = obj[key];
    if (isNonEmptyUrlString(v)) return v.trim();
  }

  for (const nest of NEST_KEYS) {
    if (!(nest in obj)) continue;
    const inner = extractUploadUrlFromPayload(obj[nest], depth + 1);
    if (inner) return inner;
  }

  return "";
}

function shallowDirectUrl(obj: Record<string, unknown>): string {
  for (const key of URL_KEYS) {
    const v = obj[key];
    if (isNonEmptyUrlString(v)) return v.trim();
  }
  return "";
}

function readIdFilenameModuleCreated(obj: Record<string, unknown>): Pick<
  FileUploadResponse,
  "id" | "filename" | "module" | "created_at"
> {
  const idNum = Number(obj.id ?? obj.file_id);
  return {
    id: Number.isFinite(idNum) ? idNum : 0,
    filename: typeof obj.filename === "string" && obj.filename ? obj.filename : "",
    module: typeof obj.module === "string" && obj.module ? obj.module : "",
    created_at:
      typeof obj.created_at === "string" && obj.created_at ? obj.created_at : "",
  };
}

/** Prefer nested `data` (and similar) when it carries id/filename alongside url. */
function pickMetadataRecord(
  top: Record<string, unknown>,
  resolvedUrl: string,
): Record<string, unknown> {
  const candidates: Record<string, unknown>[] = [top];
  for (const nest of NEST_KEYS) {
    const v = top[nest];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      candidates.push(v as Record<string, unknown>);
    }
  }
  for (const c of candidates) {
    const u = shallowDirectUrl(c) || extractUploadUrlFromPayload(c);
    if (u === resolvedUrl && (c.id != null || c.file_id != null || c.filename))
      return c;
  }
  for (const c of candidates) {
    const u = shallowDirectUrl(c) || extractUploadUrlFromPayload(c);
    if (u === resolvedUrl) return c;
  }
  return top;
}

/** Flatten DRF / Django-style `{ field: ["msg", ...] }` into readable text. */
function formatDrfErrorPayload(data: Record<string, unknown>): string | null {
  const messages: string[] = [];

  const pushVal = (v: unknown) => {
    if (typeof v === "string" && v.trim()) messages.push(v.trim());
    else if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === "string" && item.trim()) messages.push(item.trim());
        else if (item && typeof item === "object" && !Array.isArray(item)) {
          const nested = formatDrfErrorPayload(item as Record<string, unknown>);
          if (nested) messages.push(nested);
        }
      }
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      const nested = formatDrfErrorPayload(v as Record<string, unknown>);
      if (nested) messages.push(nested);
    }
  };

  for (const [key, val] of Object.entries(data)) {
    if (key === "detail" || key === "message" || key === "error") {
      pushVal(val);
      continue;
    }
    pushVal(val);
  }

  if (!messages.length) return null;
  const joined = messages.join(" ");
  return joined.length > 500 ? `${joined.slice(0, 497)}…` : joined;
}

function formatUploadAxiosError(err: unknown): string {
  if (!axios.isAxiosError(err)) {
    return err instanceof Error ? err.message : String(err);
  }
  const status = err.response?.status;
  const data = err.response?.data;
  if (data == null) return err.message || `HTTP ${status ?? "?"}`;
  if (typeof data === "string") return data.slice(0, 400);
  if (typeof data === "object" && !Array.isArray(data)) {
    const o = data as Record<string, unknown>;
    const detail = o.detail ?? o.message ?? o.error;
    if (typeof detail === "string") return detail.slice(0, 400);
    const flattened = formatDrfErrorPayload(o);
    if (flattened) return flattened;
    try {
      return JSON.stringify(data).slice(0, 400);
    } catch {
      return err.message || "Upload error";
    }
  }
  return err.message || "Upload error";
}

/**
 * List uploaded files for a client.
 *
 * @param clientId - Client ID
 * @param module - Optional module filter (e.g. report_issue, assessment_screenshots)
 * @returns List of uploaded files
 */
export const getUploadedFiles = async (
  clientId: number,
  module?: FileUploadModule,
): Promise<GetUploadedFilesResponse> => {
  const params = module ? { module } : {};
  const response = await apiClient.get<GetUploadedFilesResponse>(
    `/api/clients/${clientId}/upload/`,
    { params },
  );
  return response.data;
};

/**
 * Upload a file (PDF, PNG, JPEG, GIF, WEBP) to S3.
 * Files are organized by module in the bucket.
 *
 * @param clientId - Client ID
 * @param file - File to upload
 * @param module - Module/category (e.g. assessment_screenshots, report_issue)
 * @returns Upload response with URL to use elsewhere
 */
export const uploadFile = async (
  clientId: number,
  file: File,
  module: FileUploadModule,
): Promise<FileUploadResponse> => {
  const cid = Number(clientId);
  if (!Number.isFinite(cid) || cid <= 0) {
    throw new Error(`Invalid client id for file upload: ${String(clientId)}`);
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("module", module);

  try {
    const response = await apiClient.post<Record<string, unknown>>(
      `/api/clients/${cid}/upload/`,
      formData,
      {
        transformRequest: (data) => data,
      },
    );

    const top = (response.data ?? {}) as Record<string, unknown>;
    const url = extractUploadUrlFromPayload(top);

    if (!url) {
      throw new Error(
        "File upload response did not include a usable URL. Check API response shape (expected url, file_url, nested data.file, etc.).",
      );
    }

    const meta = pickMetadataRecord(top, url);
    const m = readIdFilenameModuleCreated(meta);

    return {
      id: m.id,
      url,
      filename: m.filename || file.name || "upload.jpg",
      module: m.module || module,
      created_at: m.created_at || new Date().toISOString(),
    };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(`File upload failed: ${formatUploadAxiosError(err)}`);
    }
    throw err;
  }
};
