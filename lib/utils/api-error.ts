export type ApiErrorBody = {
  detail?: string | string[];
  email?: string[];
  [key: string]: unknown;
};

/**
 * The server's own words from an Axios error (string or string[]), else `fallback`.
 *
 * Three envelopes, because this codebase has three: DRF's `detail`, an `error` string, and the
 * `{status, message, data}` shape the Zoom/live-session endpoints return. Missing that last one
 * is why "Zoom has no completed instance of this session yet" reached an admin as
 * "Failed to sync attendance" — the reason was in the response the whole time.
 *
 * Deliberately `response.data.message` and NOT `err.message`: the latter is Axios's own
 * "Request failed with status code 400", which is exactly the string this exists to avoid.
 */
export function getAxiosErrorDetail(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: ApiErrorBody } })?.response?.data;
  const raw = data?.detail ?? data?.error ?? data?.message;
  if (Array.isArray(raw)) return raw.join(". ");
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return fallback;
}

/**
 * Like {@link getAxiosErrorDetail}, but also reaches DRF's FIELD-keyed validation errors.
 *
 * A serializer that rejects one field answers `{"asset": ["An upload template needs a background
 * image..."]}` — there is no `detail`, no `error`, no `message`, so the plain reader falls through
 * to its fallback and the reason is thrown away. That is how creating a certificate template
 * reached an admin as "Request failed with status code 400" while the server had already said
 * exactly what was wrong and how to fix it.
 *
 * The field name is included because these payloads are keyed by it and the message alone often
 * does not say which input to look at.
 */
/** Join messages without doubling the full stops DRF already writes. */
function joinSentences(parts: string[]): string {
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .reduce((acc, p) => (acc ? `${acc}${/[.!?]$/.test(acc) ? "" : "."} ${p}` : p), "");
}

export function getAxiosFormError(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: ApiErrorBody } })?.response?.data;
  const direct = data?.detail ?? data?.error ?? data?.message;
  if (Array.isArray(direct) && direct.length) return direct.join(". ");
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  if (data && typeof data === "object") {
    for (const [field, value] of Object.entries(data)) {
      const text = Array.isArray(value)
        ? joinSentences(value.filter((v): v is string => typeof v === "string"))
        : typeof value === "string"
          ? value
          : "";
      if (text.trim()) {
        // `non_field_errors` names nothing the admin can point at, so it reads better bare.
        return field === "non_field_errors" ? text.trim() : `${field}: ${text.trim()}`;
      }
    }
  }
  return fallback;
}

/** First field error string, e.g. `data.email[0]` (signup validation). */
export function getAxiosFieldError(
  err: unknown,
  field: string
): string | undefined {
  const data = (err as { response?: { data?: ApiErrorBody } })?.response
    ?.data;
  const v = data?.[field];
  if (Array.isArray(v) && v[0]) return String(v[0]);
  if (typeof v === "string" && v.trim()) return v.trim();
  return undefined;
}