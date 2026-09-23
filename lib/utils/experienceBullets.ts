/**
 * Work-experience bullet points: the structure, and the rule that recovers it from old free text.
 *
 * A profile experience entry used to hold one `description` string, typed into a textarea. The
 * resume builder then guessed bullets from it by splitting on newlines, so a learner who typed
 * "• Managed timelines… • Engaged with clients…" on one line got ONE bullet with the dots inline,
 * and a learner who typed one "• " per line got every bullet twice (the template's own marker,
 * then theirs).
 *
 * Bullets are now stored as a list (`highlights`, one string per point) and edited one point at a
 * time. `description` is kept, written as the points joined by newlines, for any reader that has
 * not learned about `highlights` yet (an older build of this app on a tenant site that has not
 * been redeployed).
 *
 * Entries saved before this change still have only `description`. They are converted when READ,
 * with `splitIntoBullets` below, and nothing is written back until the learner saves the entry
 * themselves - so a wrong guess costs one edit, never the original text.
 */

/**
 * Glyphs that only ever mean "bullet". They start a new point at the beginning of a line, and
 * also split a line where they appear in the middle of it ("… • Engaged …").
 *
 * The private-use characters are what Word's Symbol-font bullets turn into when copied as text.
 */
const INLINE_GLYPHS = "\u2022\u25CF\u25AA\u25E6\u2023\u27A2\u27A4\u25BA\uF0B7\uF0A7\uF0D8\uF076\uF0FC";

/**
 * Markers that mean "bullet" only at the START of a line, and only when followed by a space: a
 * hyphen inside a line is a dash ("end-to-end", "Tech Stack - COBOL"), and "·" inside a line is a
 * separator ("React · Node · SQL").
 */
const LEAD_ONLY = "\u25CB\u25A0\u25A1\u25AB\u2043\u2219\u25B6\u2713\u2714\u2756\u25C6\u25C7\u00B7*\\-\u2013\u2014>";

const GLYPH_AT_START = new RegExp(`^[${INLINE_GLYPHS}]\\s*`);
const LEAD_AT_START = new RegExp(`^(?:[${LEAD_ONLY}]|\\(?\\d{1,2}[.)])(?:\\s+|$)`);
const INLINE_SPLIT = new RegExp(`\\s*[${INLINE_GLYPHS}]\\s*`);

/** A line that ends like this finished its point: the next line starts a new one. */
const TERMINAL = /[.!?;:]["'\u201D\u2019)\]]*$/;
/** A line cannot end on these; the next line must be the rest of it. */
const DANGLING_PUNCT = /[,&(/+\-\u2013\u2014]$/;
/** Nor, in English, on one of these words. */
const DANGLING_WORD =
  /\b(a|an|the|and|or|nor|but|of|to|in|on|for|with|by|from|at|as|into|onto|via|using|including|like|such|than|that|which|while|across|through|over|under|between|within|without|about|per|plus|both|its|their|our|my|his|her|is|are|was|were|be|been|has|have|had|will|can)$/i;

/** The text after a bullet marker, or null when the line does not start with one. */
function afterMarker(line: string): string | null {
  const glyph = GLYPH_AT_START.exec(line);
  if (glyph) return line.slice(glyph[0].length);
  const lead = LEAD_AT_START.exec(line);
  if (lead) return line.slice(lead[0].length);
  return null;
}

/**
 * Is `line` the rest of the point `prev` started, wrapped onto a new line?
 *
 * Text pasted from a PDF resume arrives hard-wrapped: "…to prepare accurate data for reporting\n
 * and business analysis." Splitting on every newline would chop that bullet in two, and chop a
 * wrapped prose paragraph into fragments that end mid-sentence.
 */
function isContinuation(prev: string, line: string, inMarkedPoint: boolean, lowercaseStyle: boolean): boolean {
  if (TERMINAL.test(prev)) return false;
  // Under a bullet marker, an unmarked line that follows an unfinished point is its wrap.
  if (inMarkedPoint) return true;
  if (DANGLING_PUNCT.test(prev) || DANGLING_WORD.test(prev)) return true;
  // A lowercase start continues a sentence - unless this writer starts every line in lowercase.
  return !lowercaseStyle && /^\p{Ll}/u.test(line);
}

/**
 * " - " separating points that were flattened onto one line.
 *
 * Only an ASCII hyphen, never an en or em dash (those are prose). It counts when it follows the
 * end of a sentence ("…in Java. - Engineered REST APIs"), or when the line was itself a hyphen
 * list and the dash appears at least twice before a capital ("- Designed … - Optimized … -
 * Created …"). "Project: CIS - Customer Information System" and "2 hours - a 90% cut" stay whole.
 */
function splitFlattenedHyphenList(point: string, hyphenMarked: boolean): string[] {
  // No lookbehind: Safari before 16.4 throws on one when the module loads, which would take the
  // whole profile page down on an older iPhone. The sentence mark is captured and put back.
  const afterSentence = /([.!?;])\s+-\s+(?=\p{Lu})/gu;
  if (afterSentence.test(point)) return point.replace(afterSentence, "$1\u0000").split("\u0000");
  if (hyphenMarked) {
    const beforeCapital = /\s+-\s+(?=\p{Lu})/gu;
    if ((point.match(beforeCapital) || []).length >= 2) return point.split(beforeCapital);
  }
  return [point];
}

const tidy = (s: string) => s.replace(/\s+/g, " ").trim();

/**
 * Free text as a list of points.
 *
 * The rule, in order:
 *   1. A blank line ends a point.
 *   2. A line that starts with a bullet marker (•, ●, ▪, -, *, –, 1., 2) …) starts a new point;
 *      the marker is dropped.
 *   3. Any other line continues the previous point when it is a wrap of it (see isContinuation),
 *      and starts a new point otherwise.
 *   4. Inside a point, a bullet glyph (•, ●, ▪ …) splits it: "A • B • C" is three points.
 *   5. So does a hyphen that separates flattened points (see splitFlattenedHyphenList).
 *   6. Nothing else splits. A paragraph of several sentences stays ONE point: cutting prose at
 *      full stops would turn a learner's paragraph into bullets they never wrote.
 *
 * Only markers and whitespace are ever removed; every other character comes out in order.
 */
export function splitIntoBullets(input: string | null | undefined): string[] {
  const text = (input ?? "").replace(/\r\n?/g, "\n");
  if (!text.trim()) return [];

  const lines = text.split("\n").map(tidy);
  const firstLine = lines.find(Boolean) ?? "";
  const lowercaseStyle = /^\p{Ll}/u.test(afterMarker(firstLine) ?? firstLine);

  type Point = { text: string; lastLine: string; marked: boolean; hyphen: boolean };
  const points: Point[] = [];
  let open: Point | null = null;

  for (const line of lines) {
    if (!line) {
      open = null;
      continue;
    }
    const rest = afterMarker(line);
    if (rest !== null) {
      open = { text: rest, lastLine: rest, marked: true, hyphen: /^-\s/.test(line) };
      points.push(open);
    } else if (open && isContinuation(open.lastLine, line, open.marked, lowercaseStyle)) {
      open.text = open.text ? `${open.text} ${line}` : line;
      open.lastLine = line;
    } else {
      open = { text: line, lastLine: line, marked: false, hyphen: false };
      points.push(open);
    }
  }

  return points
    .flatMap((p) => p.text.split(INLINE_SPLIT).flatMap((part) => splitFlattenedHyphenList(part, p.hyphen)))
    .map(tidy)
    .filter(Boolean);
}

/** The shape both the profile and the builder hand over: stored points, or legacy text. */
export interface HasBullets {
  highlights?: unknown;
  description?: string | null;
}

/**
 * An entry's points: the stored list when there is one, otherwise recovered from `description`.
 *
 * An empty stored list falls back to the text too. The server writes `description` from the list,
 * so the two only disagree when something that does not know about `highlights` rewrote the text
 * - and then the text is the newer of the two.
 */
export function experienceBullets(entry: HasBullets | null | undefined): string[] {
  if (!entry) return [];
  const stored = Array.isArray(entry.highlights)
    ? entry.highlights.filter((h): h is string => typeof h === "string").map(tidy).filter(Boolean)
    : [];
  return stored.length > 0 ? stored : splitIntoBullets(entry.description);
}

/** `description` for readers that predate `highlights`: one point per line. */
export function bulletsToDescription(bullets: string[]): string {
  return bullets.map(tidy).filter(Boolean).join("\n");
}

/** Does pasted text hold more structure than one point: several lines, or a bullet marker? */
export function looksLikeAList(text: string): boolean {
  return /[\r\n]/.test(text.trim()) || new RegExp(`[${INLINE_GLYPHS}]`).test(text) || afterMarker(tidy(text)) !== null;
}
