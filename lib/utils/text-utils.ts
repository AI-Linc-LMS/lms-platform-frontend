/**
 * Fix encoding glitches in user/imported text.
 * - "" (U+FFFD replacement char) often appears when "×" (U+00D7) is mis-decoded, e.g. in "Accuracy = (Correct / Total) × 100".
 * - "Ã—" is common mojibake when UTF-8 × is read as Latin-1.
 */
export function normalizeEncoding(s: string): string {
  if (!s || typeof s !== "string") return s;
  return s.replace(/\uFFFD/g, "×").replace(/Ã—/g, "×");
}
