import { apiErrorBody } from "@/lib/services/admin/admin-assessment.service";

/**
 * The server's refusal of the batches a save names, to be shown under the batch picker; null for
 * any other failure.
 *
 * - 403 `{"error": "You can only give this assessment to batches you teach.", "cohort_ids": [...]}`
 * - 400 `{"error": "Select at least one batch. ..."}`
 * - 400 `{"error": "None of the selected batches is one you teach. ..."}`
 *
 * The 403 names the batches (`cohort_ids`). The 400s carry no field to key on, so they are
 * recognised by their opening words. A batch refusal is something the author can fix in the
 * form; it is not "you may not change this paper", and must not be answered as one.
 */
const BATCH_REFUSALS = [/^select at least one batch/i, /^none of the selected batches/i];

export function batchRefusal(e: unknown): string | null {
  const message = e instanceof Error ? e.message.trim() : "";
  const body = apiErrorBody(e);
  if (body && Array.isArray((body as { cohort_ids?: unknown }).cohort_ids)) {
    return message || "You can only give this assessment to batches you teach.";
  }
  return BATCH_REFUSALS.some((pattern) => pattern.test(message)) ? message : null;
}
