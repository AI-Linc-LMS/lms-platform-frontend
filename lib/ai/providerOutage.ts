/**
 * Telling "the AI provider cannot serve this right now" apart from "something broke".
 *
 * Reported: when the AI account runs out of credit, the learner saw "Could not connect" beside
 * a "Try again" button that could never succeed. That reads as a platform defect, and a learner
 * who believes the product is broken escalates. One who reads "busy, come back shortly" waits.
 *
 * The server says which it is. `code: "ai_unavailable"` with `retry_later: true` means the
 * provider refused in a way that a retry now cannot fix; everything else is an ordinary failure
 * worth retrying. The message itself always comes from the server, because it is the side that
 * knows which surface the learner is on and what has or has not been charged.
 */

/** The server's shape for a refusal. Both stacks answer with `error`; the tutor uses `detail`. */
interface OutageBody {
  code?: string;
  detail?: string;
  error?: string;
  retry_later?: boolean;
}

interface MaybeAxiosError {
  response?: { status?: number; data?: OutageBody };
}

export interface ProviderOutage {
  /** True when retrying immediately cannot help, so no retry should be offered. */
  retryLater: boolean;
  /** The server's own sentence, when it gave one. */
  message: string;
}

/**
 * Read a failed request as an outage.
 *
 * `retryLater` is driven by what the server SAID, not by the status code: a 503 can equally be
 * a blip worth retrying in two seconds. Only an explicit `ai_unavailable` / `retry_later` means
 * "do not offer a retry".
 */
export function readProviderOutage(err: unknown): ProviderOutage {
  const data = (err as MaybeAxiosError)?.response?.data;
  const message = (data?.error || data?.detail || "").trim();
  const retryLater = data?.code === "ai_unavailable" || data?.retry_later === true;
  return { retryLater, message };
}

/** What to show when the server gave no sentence of its own. */
export const GENERIC_OUTAGE =
  "We could not reach the service just now. Please try again in a moment.";
