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