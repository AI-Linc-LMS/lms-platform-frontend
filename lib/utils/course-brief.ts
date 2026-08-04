import type { ContentType } from "@/components/adaptive-quiz/generate/types";

/**
 * Turn a one-line brief from the composer into a filled-in generate form.
 *
 * The composer says "Describe it. We'll build the whole thing." It was handing the sentence
 * over as the description and nothing else — so the title was empty (and required, so Generate
 * stayed disabled), the duration stayed at its default of 4 regardless of what you typed, and
 * "no coding" was ignored while the estimate cheerfully promised 54 coding problems. You were
 * dropped into the form you thought you had just skipped, with the wrong numbers in it.
 *
 * Deliberately deterministic rather than an LLM call: the whole point of the approval gate is
 * that model spend is rationed, and spending a request to parse "1 week, no coding" would be
 * absurd. This handles the shapes the composer's own example chips teach people to type, and
 * anything it cannot read is simply left at its default — never guessed at.
 */
export interface ParsedBrief {
  title: string;
  description: string;
  durationWeeks: number | null;
  contentTypes: ContentType[] | null;
  /** What was understood, in the user's terms, so the one review is a real check. */
  understood: string[];
}

const WEEK_RE = /(\d{1,2})\s*[-–—]?\s*week/i;
const LEADING_DURATION_RE = /^\s*\d{1,2}\s*[-–—]?\s*week[s]?\s*/i;

/**
 * Strip the qualifier tail — everything the chips put after a separator.
 *
 * A plain hyphen is deliberately NOT a separator here: "1-week System Design" would split on it
 * and leave the title as "1". En/em dashes only count when spaced, for the same reason.
 */
const TAIL_SEPARATORS = /\s*(?:·|,|:|\||\s[–—-]\s)\s*/;

const SUBJECT_STOPWORDS = [
  "course", "for absolute beginners", "for beginners", "refresher",
  "practice test", "diagnostic", "bootcamp",
];

function toTitle(raw: string): string {
  const cleaned = raw.trim().replace(/^["'“”]+|["'“”]+$/g, "");
  if (!cleaned) return "";
  // Preserve the writer's capitalisation when they used any — "SQL for analysts" must not
  // become "Sql For Analysts".
  if (/[A-Z]/.test(cleaned)) return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function parseCourseBrief(brief: string): ParsedBrief {
  const text = (brief || "").trim();
  const lower = text.toLowerCase();
  const understood: string[] = [];

  // --- duration -------------------------------------------------------------
  const weekMatch = text.match(WEEK_RE);
  let durationWeeks: number | null = null;
  if (weekMatch) {
    const n = Number(weekMatch[1]);
    if (n >= 1 && n <= 52) {
      durationWeeks = n;
      understood.push(`${n} week${n === 1 ? "" : "s"}`);
    }
  }

  // --- content types --------------------------------------------------------
  // Quiz and article are always on: a course with neither has nothing to assess or read, and
  // nobody types a brief asking for that.
  const types = new Set<ContentType>(["quiz", "article"]);
  const saysNo = (thing: string) =>
    new RegExp(`\\b(no|without|skip|exclude)\\s+\\w*\\s*${thing}`, "i").test(lower);

  const wantsCoding =
    /\b(coding|practice problems?|programming|dsa|leetcode|hands[- ]on)\b/i.test(lower);
  const wantsVideo = /\b(video|lecture|screencast)\b/i.test(lower);

  if (saysNo("coding") || saysNo("programming") || saysNo("practice")) {
    understood.push("no coding");
  } else if (wantsCoding) {
    types.add("coding");
    understood.push("coding problems");
  }

  if (saysNo("video")) {
    understood.push("no video");
  } else if (wantsVideo) {
    types.add("video");
    understood.push("videos");
  }

  // A brief that mentions neither leaves the form's own defaults alone rather than silently
  // narrowing what the admin gets.
  const mentionedTypes =
    wantsCoding || wantsVideo || saysNo("coding") || saysNo("video") || saysNo("practice");

  // --- title ----------------------------------------------------------------
  // The subject is what is left once the duration prefix and the qualifier tail are removed:
  //   "8-week Python for absolute beginners · article + quiz per topic" -> "Python"
  // Duration first, THEN the tail split: "1-week System Design" must lose the "1-week" before
  // anything looks for separators, or the hyphen inside it becomes the split point.
  let subject = text.replace(LEADING_DURATION_RE, "");
  subject = subject.split(TAIL_SEPARATORS)[0] ?? subject;
  for (const stop of SUBJECT_STOPWORDS) {
    subject = subject.replace(new RegExp(`\\b${stop}\\b`, "ig"), " ");
  }
  subject = subject.replace(/\s{2,}/g, " ").trim();

  const title = toTitle(subject).slice(0, 120);
  if (title) understood.unshift(title);

  return {
    title,
    description: text,
    durationWeeks,
    contentTypes: mentionedTypes ? Array.from(types) : null,
    understood,
  };
}
