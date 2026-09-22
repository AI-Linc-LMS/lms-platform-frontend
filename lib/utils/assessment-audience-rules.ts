import { normalizeRole } from "@/lib/auth/role-utils";

/**
 * Who a new assessment must be given to, per caller.
 *
 * The server refuses a non-admin's new paper with no batch (`_instructor_must_target_a_batch`)
 * and reports the same rule on `GET .../assessment-builder-config/` as `batch_required`. The
 * builder reads that flag, so the "required" marker and the server's 400 come from one place.
 *
 * The role fallback is only for when the flag cannot be fetched (an older backend, a failed
 * request). It mirrors the server's rule, which is every non-admin role, not just "instructor":
 * the form used to check "instructor" alone.
 */

export const BATCH_REQUIRED_MESSAGE =
  "Select at least one batch. An assessment you create is for the batches you teach, not for the whole institute.";

const ADMIN_ROLES = new Set(["admin", "superadmin"]);

export function batchRequiredForRole(role: string | null | undefined): boolean {
  const r = normalizeRole(role);
  // No role yet (auth still loading) is not a reason to demand a field.
  if (!r) return false;
  return !ADMIN_ROLES.has(r);
}

/** The server's answer when it gave one; otherwise the same rule applied to the role. */
export function resolveBatchRequired(
  serverFlag: boolean | null | undefined,
  role: string | null | undefined,
): boolean {
  return typeof serverFlag === "boolean" ? serverFlag : batchRequiredForRole(role);
}

/** Why the audience step cannot be left yet, or null when it can. */
export function audienceStepError(
  batchRequired: boolean,
  cohortIds: readonly number[],
): string | null {
  return batchRequired && cohortIds.length === 0 ? BATCH_REQUIRED_MESSAGE : null;
}
