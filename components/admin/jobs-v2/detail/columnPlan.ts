/**
 * Which column each section of the admin job page sits in — decided from the job, not hardcoded.
 *
 * This page has been rebalanced twice by moving cards from one side to the other (#1618 moved
 * skills, classification and links left; #1631 moved eligibility after them) and it came back
 * both times, because a FIXED assignment cannot balance content whose range is 10x. Measured on
 * the demo tenant at 1440px, the same layout produced:
 *
 *     job 22   left 1838  right  525   (3.5x — "the left column is too long")
 *     job 19   left  467  right  826   (0.6x — "the right column is disproportionately long")
 *
 * One rule, one page, two opposite complaints. So the column is chosen per job instead.
 *
 * Two anchors keep the page predictable: what the job IS leads the left column, and the only
 * interactive card — the status control, visibility and closing date — leads the right. Every
 * other section is packed longest-first into whichever column is currently shorter (the classic
 * longest-processing-time greedy, which is within 7/6 of a perfect split), and each column then
 * renders its own sections in one canonical order, so a section never appears above a section it
 * normally follows.
 *
 * The weights are ESTIMATES in approximate pixels. They do not have to be accurate — only
 * ordered roughly right — because the alternative is a fixed split that is guaranteed wrong for
 * half the postings. Nothing measures the DOM: the plan is identical on the server and the
 * client, so there is no second layout pass and no flash.
 */

export type JobSectionKey =
  | "story"
  | "skills"
  | "classification"
  | "eligibility"
  | "links"
  | "publishing"
  | "audience";

/**
 * Reading order within a column. Whichever column a section lands in, the sections above it are
 * always the ones that come earlier here.
 */
export const SECTION_ORDER: readonly JobSectionKey[] = [
  // The two anchors lead. They come first so that sorting a column back into this order cannot
  // undo the anchoring — `story` only ever lands in the left column and `publishing` in the
  // right, so exactly one of them heads each.
  "story",
  "publishing",
  "skills",
  "classification",
  "eligibility",
  "links",
  "audience",
];

/** The posting itself always leads the left column: it is what the page is about. */
export const LEFT_ANCHOR: JobSectionKey = "story";
/** The status select and visibility always lead the right: they are the page's only controls. */
export const RIGHT_ANCHOR: JobSectionKey = "publishing";

export type SectionWeights = Partial<Record<JobSectionKey, number>>;

export interface ColumnPlan {
  /** `data-column="job"` — the left column at `md+`. */
  job: JobSectionKey[];
  /** `data-column="access"` — the right column at `md+`. */
  access: JobSectionKey[];
}

/**
 * Pack the sections into two columns of roughly equal height.
 *
 * A weight of 0 (or a missing key) means the section is not on this page at all — an absent
 * section must not reserve space, which is half of why the empty cards mattered.
 */
export function planColumns(weights: SectionWeights): ColumnPlan {
  const weightOf = (key: JobSectionKey) => Math.max(0, weights[key] ?? 0);
  const present = SECTION_ORDER.filter((key) => weightOf(key) > 0);

  const job: JobSectionKey[] = [];
  const access: JobSectionKey[] = [];
  let jobHeight = 0;
  let accessHeight = 0;

  if (present.includes(LEFT_ANCHOR)) {
    job.push(LEFT_ANCHOR);
    jobHeight += weightOf(LEFT_ANCHOR);
  }
  if (present.includes(RIGHT_ANCHOR)) {
    access.push(RIGHT_ANCHOR);
    accessHeight += weightOf(RIGHT_ANCHOR);
  }

  const packable = present
    .filter((key) => key !== LEFT_ANCHOR && key !== RIGHT_ANCHOR)
    // Longest first. Ties break on canonical order so the plan is a pure function of the
    // weights — two jobs with the same shape never lay out differently.
    .sort(
      (a, b) =>
        weightOf(b) - weightOf(a) || SECTION_ORDER.indexOf(a) - SECTION_ORDER.indexOf(b),
    );

  for (const key of packable) {
    // Ties go right, which is the shape a bare posting has always had.
    if (jobHeight < accessHeight) {
      job.push(key);
      jobHeight += weightOf(key);
    } else {
      access.push(key);
      accessHeight += weightOf(key);
    }
  }

  return {
    job: SECTION_ORDER.filter((key) => job.includes(key)),
    access: SECTION_ORDER.filter((key) => access.includes(key)),
  };
}

/* ==========================================================================
 * The estimator — approximate pixels, from the payload alone
 * ======================================================================== */

/**
 * Every number below was read off the live admin page on the demo tenant at 1440px (jobs 14 and
 * 17-22), so the estimate lands within about 10% of the real height on a real posting.
 */

/** A section header, the card's padding and the gap under it. */
export const SECTION_CHROME = 84;
/** A section with nothing recorded: its header, one muted line, and the gap. No card. */
export const QUIET_SECTION = 70;
/** One line of wrapped prose. */
const PROSE_LINE = 22;
/** Roughly what fits on a line in one of the two equal columns at 1440px. */
const CHARS_PER_LINE = 64;
/** One label/value row of a `DefinitionList`. */
const DEFINITION_ROW = 42;
/** One row of skill chips. */
const CHIP_ROW = 34;
/** One link row inside "Attachments and links". */
const LINK_ROW = 56;

/** How tall a block of prose renders, near enough. Zero when there is none. */
export function proseWeight(text?: string | null): number {
  const value = String(text ?? "").trim();
  if (!value) return 0;
  const lines = value
    .split("\n")
    .reduce((total, line) => total + Math.max(1, Math.ceil(line.length / CHARS_PER_LINE)), 0);
  return SECTION_CHROME + lines * PROSE_LINE;
}

/** A card holding `count` chips. With none, the section is one quiet line instead of a card. */
export function chipsWeight(count: number, perRow = 4): number {
  if (count <= 0) return QUIET_SECTION;
  return SECTION_CHROME + Math.ceil(count / perRow) * CHIP_ROW;
}

/**
 * A card holding `count` definition rows, plus `extra` for any hint line above them. With no
 * rows the section is one quiet line instead of a card, and the hint goes with the card.
 */
export function rowsWeight(count: number, extra = 0): number {
  if (count <= 0) return QUIET_SECTION;
  return SECTION_CHROME + extra + count * DEFINITION_ROW;
}

/** "Attachments and links". Absent entirely when the posting carries neither. */
export function linksWeight(input: { jd: boolean; apply: boolean; jdFailed: boolean }): number {
  const rows = (input.jd ? 1 : 0) + (input.apply ? 1 : 0);
  if (rows === 0 && !input.jdFailed) return 0;
  // A raw apply URL wraps on `break-all`, so it is reliably taller than one row.
  return SECTION_CHROME + rows * LINK_ROW + (input.apply ? 20 : 0) + (input.jdFailed ? 120 : 0);
}

/** The publishing card: a status select, a visibility pill with its hint, and a closing date. */
export const PUBLISHING_WEIGHT = 280;

/**
 * "Who can see this job". The widest-swinging section after the prose — 246px when nothing
 * narrows the audience and 547px with seventeen named students, measured on demo — which is
 * exactly why it has to be packed rather than pinned to one side.
 *
 * The fields are the ones `AudiencePanel` renders; keep the two in step.
 */
export function audienceWeight(input: {
  courses: number;
  retiredCourses: number;
  batches: number;
  students: number;
  colleges: number;
}): number {
  const { courses, retiredCourses, batches, students, colleges } = input;
  // Card chrome plus the always-present summary strip.
  let total = SECTION_CHROME + 86;
  // One bullet under the summary per mechanism in use.
  const used = [courses, retiredCourses, batches, students, colleges].filter((n) => n > 0).length;
  total += used * 22;
  // Batch targeting always renders: a label row and either its chips or "Not posted to any batch".
  total += 32 + (batches > 0 ? Math.ceil(batches / 2) * 32 : 22);
  if (courses > 0) total += 28 + Math.ceil(courses / 3) * CHIP_ROW;
  if (retiredCourses > 0) total += 28 + 40 + Math.ceil(retiredCourses / 3) * CHIP_ROW;
  if (students > 0) {
    const shown = Math.min(students, 8);
    total += 28 + Math.ceil(shown / 2) * 46 + (students > 8 ? 32 : 0);
  }
  if (colleges > 0) total += 28 + Math.ceil(colleges / 2) * CHIP_ROW;
  // The "Not narrowed by: …" line, whenever at least one mechanism is unused.
  if (courses === 0 || students === 0 || colleges === 0) total += 22;
  return total;
}
