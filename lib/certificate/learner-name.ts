import type { UserProfile } from "@/lib/services/accounts.service";
import type { AssessmentResult } from "@/lib/services/assessment.service";

/** Best-effort display name from assessment result payload or auth user. */
export function getLearnerDisplayNameFromResult(
  result: AssessmentResult | null | undefined,
  user: UserProfile | null | undefined
): string {
  const r = result as Record<string, unknown> | null | undefined;
  const fromResult =
    (typeof r?.student_name === "string" && r.student_name.trim()) ||
    (typeof r?.full_name === "string" && r.full_name.trim()) ||
    (typeof r?.user_name === "string" && r.user_name.trim()) ||
    (typeof r?.email === "string" && r.email.trim()) ||
    "";
  if (fromResult) return fromResult;

  const u = result?.user;
  if (u) {
    const n =
      [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
      u.name?.trim() ||
      u.user_name?.trim() ||
      u.email?.trim() ||
      "";
    if (n) return n;
  }

  if (user) {
    const combined =
      [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
      user.user_name?.trim() ||
      user.email?.trim() ||
      "";
    if (combined) return combined;
  }

  return "Participant";
}
