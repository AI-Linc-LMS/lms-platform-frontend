import { getPublicAppOrigin } from "@/lib/config";

/**
 * Pure formatting helpers shared by the certificate artwork, the admin preview
 * and the learner gallery.
 *
 * They are pure and dependency-free on purpose: the artwork component is
 * rasterised by html-to-image during export, and anything that resolves late
 * (a hook, a fetch, a font that has not loaded) shows up as a blank patch in
 * the exported PNG rather than as an error anyone would notice.
 */

/**
 * "24 August 2026" - day-first long form, which reads as a document date in
 * every locale we ship and never collides with the US/EU ordering ambiguity a
 * numeric date has.
 *
 * Returns "" for a missing or unparseable date instead of "Invalid Date", so a
 * certificate with a bad timestamp loses the line rather than printing garbage
 * onto something a learner will put on LinkedIn.
 */
export function formatCertificateDate(
  value: string | number | Date | null | undefined,
  locale = "en-GB",
): string {
  if (value === null || value === undefined || value === "") return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    // An invalid locale tag from a stored preference must not take the render down.
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }
}

/** Locale thousands separators: the ladder runs to 100000 and "100000" on a
 *  certificate reads as a typo where "100,000" reads as an achievement. */
export function formatPoints(
  value: number | null | undefined,
  locale = "en-US",
): string {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat(locale).format(n);
  } catch {
    return new Intl.NumberFormat("en-US").format(n);
  }
}

/**
 * The recipient-name size ladder, carried over verbatim from the zskillup
 * certificate so a long name still fits on one line inside the frame. The
 * canvas is fixed at 1000px wide and the name is the largest thing on it, so
 * this is the one piece of type that cannot be left to the browser: a name
 * that wraps pushes the seal off the artwork.
 */
export function recipientFontSize(nameLength: number): number {
  const n = Number.isFinite(nameLength) ? nameLength : 0;
  return n > 30 ? 38 : n > 24 ? 44 : n > 18 ? 52 : 62;
}

/**
 * The public verification URL printed on the certificate and encoded into its
 * QR. Built from this app's canonical origin (never window.location) so a
 * certificate exported from a preview host still verifies against the real
 * site. The server also sends `verify_url` on the render payload; prefer that
 * when you have it and use this for previews of a not-yet-issued design.
 */
export function verifyUrlFor(credentialId: string, origin?: string): string {
  const base = (origin ?? getPublicAppOrigin() ?? "").replace(/\/$/, "");
  return `${base}/credentials/${encodeURIComponent(credentialId)}`;
}
