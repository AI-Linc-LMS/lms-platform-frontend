import { stripHtmlTags } from "@/lib/utils/html-utils";

/** Minimum plain-text length for a bounty answer to count as "detailed". */
export const BOUNTY_DETAIL_MIN_CHARS = 180;

/** Minimum word count (whitespace-separated) after stripping HTML. */
export const BOUNTY_DETAIL_MIN_WORDS = 35;

export function plainTextForBountyCheck(raw: string): string {
  return stripHtmlTags(raw || "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isDetailedBountyAnswer(body: string): boolean {
  const t = plainTextForBountyCheck(body);
  if (t.length < BOUNTY_DETAIL_MIN_CHARS) return false;
  const words = t.split(/\s+/).filter(Boolean).length;
  return words >= BOUNTY_DETAIL_MIN_WORDS;
}

export function isCommunityAdminRole(role: string | undefined | null): boolean {
  const r = (role || "").toLowerCase().replace(/\s+/g, "");
  return r === "admin" || r === "superadmin";
}

export function isSameCommunityUser(
  aId: number,
  aUserName: string | undefined,
  bId: number,
  bUserName: string | undefined
): boolean {
  if (aId > 0 && bId > 0 && aId === bId) return true;
  const u1 = (aUserName || "").trim().toLowerCase();
  const u2 = (bUserName || "").trim().toLowerCase();
  return Boolean(u1 && u2 && u1 === u2);
}
