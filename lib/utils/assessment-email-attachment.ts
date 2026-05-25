/**
 * Pull the previously-saved email attachment URL + display name out of an
 * assessment-detail API response. The backend has gone through a few naming
 * conventions over time, so we try several:
 *
 * Flat URL fields (preferred order):
 *   - `email_attachment_url`
 *   - `attachment_url`
 *   - `email_attachment_file`
 *   - `email_file_url`
 *   - `file_url`
 *
 * Nested objects (each can carry `url`, `file_url`, `attachment_url`):
 *   - `email_attachment`
 *   - `attachment`
 *   - `email_notification`
 *   - `notification_email`
 *
 * If `email_attachment` is itself a string we treat it as the URL.
 *
 * Returns `{ url: null, name: null }` when nothing recognisable is found.
 */
export interface SavedEmailAttachment {
  url: string | null;
  name: string | null;
}

const FLAT_URL_KEYS = [
  "email_attachment_url",
  "attachment_url",
  "email_attachment_file",
  "email_file_url",
  "file_url",
] as const;

const FLAT_NAME_KEYS = [
  "email_attachment_name",
  "attachment_name",
  "email_attachment_filename",
  "attachment_filename",
  "file_name",
] as const;

const NESTED_CONTAINER_KEYS = [
  "email_attachment",
  "attachment",
  "email_notification",
  "notification_email",
] as const;

const NESTED_URL_KEYS = [
  "url",
  "file_url",
  "attachment_url",
  "download_url",
  "src",
];

const NESTED_NAME_KEYS = [
  "name",
  "filename",
  "file_name",
  "attachment_name",
  "original_name",
];

const asString = (v: unknown): string | null =>
  typeof v === "string" && v.trim().length > 0 ? v : null;

const URL_LIKE = /^(https?:\/\/|\/|data:|blob:)/i;
// Match keys that look like they refer to an uploaded attachment file. Kept
// narrow so we don't accidentally surface an unrelated URL (logo_url, etc.).
const ATTACHMENT_KEY = /attach|upload|^file|_file/i;

// True if the string looks like a URL OR an upload path (e.g. "media/foo.pdf",
// "attachments/abc.docx", "https://...", "/storage/x.pdf").
const looksLikeUrl = (v: unknown): v is string => {
  if (typeof v !== "string") return false;
  const trimmed = v.trim();
  if (!trimmed) return false;
  if (URL_LIKE.test(trimmed)) return true;
  // Relative path that ends in a known attachment extension.
  return /\.(pdf|pptx?|docx?|xlsx?|png|jpe?g|gif|webp|csv|zip|svg)(\?.*)?$/i.test(
    trimmed
  );
};

/**
 * Recursive scan: walk all properties (one level deep into nested objects)
 * looking for a key with "attach" or "file" in its name whose value looks
 * like a URL. Used as a last-resort fallback so we can surface attachments
 * regardless of the backend's exact field naming.
 */
function heuristicFindAttachment(
  data: Record<string, unknown>,
  depth = 0
): { url: string | null; name: string | null } {
  if (depth > 2) return { url: null, name: null };
  let url: string | null = null;
  let name: string | null = null;
  for (const [key, value] of Object.entries(data)) {
    if (looksLikeUrl(value) && ATTACHMENT_KEY.test(key)) {
      if (!url) url = (value as string).trim();
    }
    if (
      typeof value === "string" &&
      value.length > 0 &&
      /name|filename/i.test(key) &&
      ATTACHMENT_KEY.test(key)
    ) {
      if (!name) name = value;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = heuristicFindAttachment(
        value as Record<string, unknown>,
        depth + 1
      );
      if (!url && nested.url) url = nested.url;
      if (!name && nested.name) name = nested.name;
    }
    if (url && name) break;
  }
  return { url, name };
}

export function extractSavedEmailAttachment(
  data: Record<string, unknown> | null | undefined
): SavedEmailAttachment {
  if (!data) return { url: null, name: null };

  // 1) Flat URL fields.
  let url: string | null = null;
  for (const key of FLAT_URL_KEYS) {
    const v = asString(data[key]);
    if (v) {
      url = v;
      break;
    }
  }

  // 2) Flat name fields.
  let name: string | null = null;
  for (const key of FLAT_NAME_KEYS) {
    const v = asString(data[key]);
    if (v) {
      name = v;
      break;
    }
  }

  // 3) Nested objects (or string-valued `email_attachment` carrying the URL).
  if (!url || !name) {
    for (const containerKey of NESTED_CONTAINER_KEYS) {
      const container = data[containerKey];
      if (!container) continue;

      // The container can sometimes just be the URL itself.
      if (typeof container === "string") {
        if (!url) url = asString(container);
        continue;
      }
      if (typeof container !== "object") continue;

      const obj = container as Record<string, unknown>;
      if (!url) {
        for (const k of NESTED_URL_KEYS) {
          const v = asString(obj[k]);
          if (v) {
            url = v;
            break;
          }
        }
      }
      if (!name) {
        for (const k of NESTED_NAME_KEYS) {
          const v = asString(obj[k]);
          if (v) {
            name = v;
            break;
          }
        }
      }
      if (url && name) break;
    }
  }

  // 4) Last-resort heuristic: scan all keys (recursively) for an
  // attachment-shaped key with a URL-like value.
  if (!url || !name) {
    const heuristic = heuristicFindAttachment(data);
    if (!url) url = heuristic.url;
    if (!name) name = heuristic.name;
  }

  return { url, name };
}
