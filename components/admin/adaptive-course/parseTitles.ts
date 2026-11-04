/**
 * Turn whatever the admin typed or pasted into the list of rows to create.
 *
 * The builder's add-row used to take one title per round trip, so building a twelve-topic week
 * meant twelve POSTs, twelve toasts and - the slow part - twelve full tree refetches. An admin
 * almost always already HAS the list, in a syllabus or a spreadsheet, so the fastest input is the
 * one they can paste.
 *
 * Deliberately NOT deduplicated. A repeated line is usually a copy-paste slip, but it is
 * sometimes two genuinely different sections that share a name, and silently dropping one is a
 * surprise the admin cannot see. The caller shows the count instead, so a double paste is
 * obvious before they commit to it.
 */

/**
 * A leading list marker from a pasted syllabus: "1. ", "2) ", "- ", "* ", a bullet or a dash.
 *
 * The trailing `\s+` is what keeps this safe: "1.5 Scaling laws" is not a marker, because after
 * "1." comes "5", not a space. Without it a legitimately numbered topic would lose its number.
 */
const LIST_MARKER = /^\s*(?:\d+[.)]|[-*•–—])\s+/;

export function parseTitles(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .split(/\r\n|\r|\n/)
    .map((line) => line.replace(LIST_MARKER, "").trim())
    .filter((line) => line.length > 0);
}
