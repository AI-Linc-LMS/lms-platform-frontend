/**
 * What an `<input type="month">` can actually display.
 *
 * Reported: work experience dates show correctly in the resume preview but the editor's own
 * date fields are empty, and the ATS score drops because of it.
 *
 * A month input accepts exactly `YYYY-MM`. Hand it anything else - including a perfectly valid
 * full date like `2025-12-01` - and it silently renders its placeholder, so the field looks
 * blank while the data behind it is intact. The preview parses leniently and shows "Dec 2025",
 * which is why the two disagree.
 *
 * On production both shapes are stored: of the dates in saved resumes, 12 are `YYYY-MM-DD` and
 * 9 are `YYYY-MM`. The full-date ones are the ones that vanish.
 *
 * The harm is not only cosmetic. An empty-looking field invites the learner to leave it, or to
 * save over it with nothing, and then the dates really are gone and the ATS date check really
 * does fail.
 */

/** `YYYY-MM` for anything a month input can be given; "" when there is genuinely no date. */
export function toMonthInputValue(raw: string | null | undefined): string {
  const v = (raw ?? "").trim();
  if (!v) return "";
  // The common cases first: already `YYYY-MM`, or a full ISO date to trim.
  const iso = /^(\d{4})-(\d{2})(?:-\d{2})?/.exec(v);
  if (iso) return `${iso[1]}-${iso[2]}`;
  // A real Date is the fallback for anything else that parses ("May 2025", "2025/05/01").
  const parsed = new Date(v);
  if (!Number.isNaN(parsed.getTime())) {
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    return `${parsed.getFullYear()}-${month}`;
  }
  // Unparseable. Returning "" is right: the input could not show it anyway, and pretending
  // otherwise would put a wrong date in front of somebody.
  return "";
}
