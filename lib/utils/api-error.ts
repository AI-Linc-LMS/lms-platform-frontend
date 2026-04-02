export type ApiErrorBody = {
  detail?: string | string[];
  email?: string[];
  [key: string]: unknown;
};

/** DRF `detail` from an Axios error (string or string[]). */
export function getAxiosErrorDetail(err: unknown, fallback: string): string {
  const raw = (err as { response?: { data?: ApiErrorBody } })?.response?.data
    ?.detail;
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