import type { AssessmentTakeFlags } from "@/lib/services/assessment.service";

export type LockdownClientKind = "none" | "safe_exam_browser" | "respondus_lockdown";

export type LockdownSatisfactionSource =
  | "not_required"
  | "kiosk_query"
  | "safe_exam_browser"
  | "respondus_lockdown"
  | "blocked";

export interface LockdownGateResult {
  required: boolean;
  satisfied: boolean;
  source: LockdownSatisfactionSource;
  detectedClient: LockdownClientKind;
  allowedClients?: Array<"seb" | "respondus">;
}

function uaDetectsSeb(ua: string): boolean {
  const u = ua.toLowerCase();
  return (
    u.includes("safe exam browser") ||
    u.includes("safeexambrowser") ||
    /\bseb\/\d/i.test(ua) ||
    u.includes(" seb/")
  );
}

function uaDetectsRespondus(ua: string): boolean {
  const u = ua.toLowerCase();
  return u.includes("lockdown browser") || u.includes("respondus");
}

/** Best-effort UA classification for SEB / Respondus (not cryptographically reliable). */
export function detectLockdownClientFromUA(ua: string): LockdownClientKind {
  if (!ua) return "none";
  if (uaDetectsSeb(ua)) return "safe_exam_browser";
  if (uaDetectsRespondus(ua)) return "respondus_lockdown";
  return "none";
}

/** Next `useSearchParams()` and `URLSearchParams` both implement `.get`. */
type QueryParamSource = { get: (key: string) => string | null } | null | undefined;

function kioskQueryMatches(
  searchParams: QueryParamSource,
  rule: { key: string; value: string } | null | undefined,
): boolean {
  if (!rule?.key) return false;
  const v = searchParams?.get(rule.key);
  return v === rule.value;
}

/**
 * Whether the current browser context satisfies assessment lockdown policy.
 * @param userAgent Pass `typeof navigator !== "undefined" ? navigator.userAgent : ""` on client.
 */
export function evaluateLockdownGate(
  flags: AssessmentTakeFlags | null | undefined,
  userAgent: string,
  searchParams: QueryParamSource,
): LockdownGateResult {
  const required = Boolean(flags?.require_lockdown_browser);
  const detected = detectLockdownClientFromUA(userAgent);
  const allowed = flags?.lockdown_clients;

  if (!required) {
    return {
      required: false,
      satisfied: true,
      source: "not_required",
      detectedClient: detected,
      allowedClients: allowed,
    };
  }

  if (kioskQueryMatches(searchParams, flags?.kiosk_query_param)) {
    return {
      required: true,
      satisfied: true,
      source: "kiosk_query",
      detectedClient: detected,
      allowedClients: allowed,
    };
  }

  const allowSeb = !allowed?.length || allowed.includes("seb");
  const allowRespondus = !allowed?.length || allowed.includes("respondus");

  if (detected === "safe_exam_browser" && allowSeb) {
    return {
      required: true,
      satisfied: true,
      source: "safe_exam_browser",
      detectedClient: detected,
      allowedClients: allowed,
    };
  }
  if (detected === "respondus_lockdown" && allowRespondus) {
    return {
      required: true,
      satisfied: true,
      source: "respondus_lockdown",
      detectedClient: detected,
      allowedClients: allowed,
    };
  }

  return {
    required: true,
    satisfied: false,
    source: "blocked",
    detectedClient: detected,
    allowedClients: allowed,
  };
}
