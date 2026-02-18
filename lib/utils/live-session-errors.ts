/**
 * Centralized user-facing messages and error handling for Zoom/live-session flows.
 * Use these so 400/409/404 and status === "error" are shown consistently (no raw debug in production).
 */

export const ZOOM_CREDENTIALS_MESSAGE =
  "Zoom is not configured for this institution. Please contact your administrator.";

export const MEETING_NOT_FINALIZED_MESSAGE =
  "Meeting has not ended in Zoom yet. Please try again after ending the meeting.";

export const RECORDING_NOT_AVAILABLE_MESSAGE =
  "Recording is not available for this session yet.";

/** User-facing message when recording returns 404 (not synced / still processing). */
export const RECORDING_NOT_AVAILABLE_FRIENDLY_MESSAGE =
  "Recording isn't available yet. It may still be processing, or the host can sync the recording from the session details.";

export const RECORDING_PROCESSING_MESSAGE =
  "Recording still processing. Try again in a few minutes.";

export const FORBIDDEN_MESSAGE =
  "Live sessions are not available for your account.";

export const GENERIC_ERROR_MESSAGE =
  "Something went wrong. Please try again.";

export const SESSION_NOT_FOUND_MESSAGE = "Session not found.";

export const ZOOM_MEETING_ALREADY_EXISTS_MESSAGE =
  "Zoom meeting already exists for this session.";

export const COPY_NOT_SUPPORTED_MESSAGE =
  "Copy not supported in this context.";

export type LiveSessionErrorContext =
  | "zoom_create"
  | "sync_attendance"
  | "sync_recording"
  | "recording"
  | "session_detail"
  | "generic";

/**
 * Returns a user-friendly message for Zoom/live-session API errors.
 * Handles 400 (Zoom credentials), 409 (meeting not finalized), 404 (recording), and status === "error".
 */
export function getLiveSessionErrorMessage(
  error: unknown,
  context: LiveSessionErrorContext = "generic"
): string {
  const err = error as {
    response?: { status?: number; data?: { message?: string; detail?: string } };
    message?: string;
  };
  const status = err?.response?.status;
  const msg =
    typeof err?.response?.data?.message === "string"
      ? err.response.data.message
      : typeof err?.response?.data?.detail === "string"
        ? err.response.data.detail
        : typeof err?.message === "string"
          ? err.message
          : "";

  const lower = (msg || "").toLowerCase();

  if (status === 403) return FORBIDDEN_MESSAGE;

  if (status === 404 && context === "session_detail")
    return SESSION_NOT_FOUND_MESSAGE;

  if (status === 404 && (context === "recording" || context === "generic"))
    return RECORDING_NOT_AVAILABLE_FRIENDLY_MESSAGE;

  if (status === 500 || status === 502 || status === 503 || status == null)
    return GENERIC_ERROR_MESSAGE;

  if (
    status === 400 ||
    lower.includes("credential") ||
    (context === "zoom_create" && lower.includes("zoom"))
  )
    return ZOOM_CREDENTIALS_MESSAGE;

  if (
    status === 409 ||
    lower.includes("not finalized") ||
    (context === "sync_attendance" && lower.includes("finalized"))
  )
    return MEETING_NOT_FINALIZED_MESSAGE;

  if (
    context === "sync_recording" &&
    (lower.includes("processing") || lower.includes("still"))
  )
    return RECORDING_PROCESSING_MESSAGE;

  return msg || GENERIC_ERROR_MESSAGE;
}

/**
 * User message when API returns { status: "error", message }.
 */
export function getZoomApiErrorMessage(
  message: string | undefined,
  context: LiveSessionErrorContext = "generic"
): string {
  if (!message) return "Something went wrong. Please try again.";
  const lower = message.toLowerCase();
  if (lower.includes("credential") || (context === "zoom_create" && lower.includes("zoom")))
    return ZOOM_CREDENTIALS_MESSAGE;
  if (lower.includes("not finalized") || lower.includes("409"))
    return MEETING_NOT_FINALIZED_MESSAGE;
  if (context === "sync_recording" && (lower.includes("processing") || lower.includes("still")))
    return RECORDING_PROCESSING_MESSAGE;
  return message;
}

/**
 * Copy text to clipboard; shows toast on success or failure.
 * Use when clipboard API may be unavailable (e.g. non-secure context).
 */
export function copyToClipboard(
  text: string,
  showToast: (message: string, type: "success" | "error" | "info") => void,
  successMessage = "Copied"
): void {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    showToast(COPY_NOT_SUPPORTED_MESSAGE, "error");
    return;
  }
  navigator.clipboard.writeText(text).then(
    () => showToast(successMessage, "success"),
    () => showToast("Failed to copy", "error")
  );
}
