/**
 * Normalizes long plain-text job copy for display with `whiteSpace: "pre-wrap"`.
 */

function escapeRegExpLit(lit: string): string {
  return lit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Strip minimal HTML from scrapers into readable newlines (no DOM parser). */
function convertBasicHtmlToNewlines(s: string): string {
  if (!/<[a-z!/]/i.test(s)) return s;
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|section|article|header)\s*>/gi, "\n\n")
    .replace(/<\/(ul|ol|table)\s*>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Section phrases often jammed without punctuation in scraped blobs. */
const SECTION_HEADERS_SORTED: string[] = [
  "Your Qualifications",
  "Your Responsibilities",
  "What you'll be doing",
  "What You'll Be Doing",
  "What you will be doing",
  "Key Responsibilities",
  "Key Qualifications",
  "Minimum Qualifications",
  "Preferred Qualifications",
  "About the Company",
  "About Salesforce",
  "About the Role",
  "Company Description",
  "Role Overview",
  "Your Impact",
  "Your Role",
  "The Role",
  "Who You Are",
  "Job Summary",
  "Responsibilities",
  "Requirements",
  "Qualifications",
  "Experience Required",
  "Education & Experience",
  "Education",
  "Benefits",
  "Skills Required",
  "Job Description",
  "Overview",
  "Summary",
].sort((a, b) => b.length - a.length);

/** Break after sentence end before a known heading (safe for Sr., Dr., etc.). */
function insertSectionBreaksAfterPunctuation(s: string): string {
  const alt = SECTION_HEADERS_SORTED.map((h) => escapeRegExpLit(h) + "\\b").join("|");
  const re = new RegExp(`((?:[.!?]["']?)|[;:])\\s+(?=(?:${alt}))`, "gi");
  return s.replace(re, "$1\n\n");
}

/** Titles jammed without space/punct: "Role OverviewYour Impact". */
function splitJammedSectionTitles(s: string): string {
  let t = s;
  const jams: [RegExp, string][] = [
    [/Role Overview(?=Your Impact\b)/gi, "Role Overview\n\n"],
    [/Your Impact(?=Your Qualifications\b)/gi, "Your Impact\n\n"],
    [/Your Qualifications(?=What you)/gi, "Your Qualifications\n\n"],
    [/Your Qualifications(?=Minimum|Preferred|Key\s)/gi, "Your Qualifications\n\n"],
    [/About Salesforce(?=Role Overview|Your Impact|The Role|Job Summary)/gi, "About Salesforce\n\n"],
    [/About the Company(?=Role Overview|The Role|Job Summary)/gi, "About the Company\n\n"],
    [/Job Summary(?=Role Overview|Your Impact|Responsibilities)/gi, "Job Summary\n\n"],
  ];
  for (const [re, rep] of jams) {
    t = t.replace(re, rep);
  }
  return t;
}

/** "…Development Location: Toronto" (or jammed "DevelopmentLocation:") → break before Location:. */
function splitLocationField(s: string): string {
  return s
    .replace(/([a-z0-9)])(\s+)(Location:)/gi, "$1\n\n$3")
    .replace(/([a-z)])(Location:)/gi, "$1\n\n$2");
}

function breakNumberedListItems(s: string): string {
  return s.replace(/([.!?])\s+(\d{1,2}\.\s+)(?=[A-Z(0-9"'])/g, "$1\n\n$2");
}

/** Sentence-style dash bullets: "…outcomes. - Lead the full" */
function breakDashLeadBullets(s: string): string {
  return s.replace(/([.!?])\s+-\s+(?=[A-Z(0-9])/g, "$1\n\n- ");
}

/** Put URLs on their own line when jammed into prose. */
function breakBeforeUrls(s: string): string {
  return s.replace(/(\S)(\s+)(https?:\/\/)/gi, "$1\n\n$3");
}

/** Puts each `•` / `·` list item on its own line (common in scraped JSON). */
function formatInlineBullets(s: string): string {
  if (!/[•·]/.test(s)) return s;
  let t = s;
  t = t.replace(/([.!?])\s*([•·])\s*/g, "$1\n\n$2 ");
  t = t.replace(/(\S)\s+([•·])\s+/g, "$1\n$2 ");
  t = t.replace(/(\S)([•·])(?=\S)/g, "$1\n$2 ");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

function normalizeParagraphWhitespace(s: string): string {
  return s.replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n");
}

function dedupeAdjacentParagraphs(s: string): string {
  const chunks = s.split(/\n\n+/);
  const out: string[] = [];
  const norm = (x: string) => x.replace(/\s+/g, " ").trim();
  for (const c of chunks) {
    const t = c.trim();
    if (!t) continue;
    if (out.length && norm(out[out.length - 1]) === norm(t)) continue;
    out.push(t);
  }
  return out.join("\n\n");
}

/**
 * Unescapes literal `\n` / `\t`, normalizes line endings, converts light HTML,
 * inserts breaks before common section headings / lists, formats `•` bullets,
 * and removes accidental duplicate paragraphs. Does not split on every `. `
 * (avoids breaking "Sr. Account Executive").
 */
export function formatJobDescriptionBody(input: string | null | undefined): string {
  if (input == null || typeof input !== "string") return "";
  let s = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  s = s.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
  s = convertBasicHtmlToNewlines(s);
  s = normalizeParagraphWhitespace(s);
  s = splitLocationField(s);
  s = splitJammedSectionTitles(s);
  s = insertSectionBreaksAfterPunctuation(s);
  s = breakNumberedListItems(s);
  s = breakDashLeadBullets(s);
  s = breakBeforeUrls(s);
  s = formatInlineBullets(s);
  s = dedupeAdjacentParagraphs(s);
  s = normalizeParagraphWhitespace(s);
  return s.trim();
}

/**
 * Human-readable label for enum-like strings (e.g. FULL_TIME → Full time).
 */
export function humanizeJobFieldLabel(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  if (lower === "full_time" || lower === "full-time") return "Full time";
  if (lower === "part_time" || lower === "part-time") return "Part time";
  const normalized = t.replace(/-/g, "_");
  const parts = normalized.split("_").filter(Boolean);
  if (parts.length >= 2) {
    return parts
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }
  if (/^[A-Z0-9_]{2,}$/.test(t) && t.includes("_")) {
    return t
      .split("_")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }
  return t;
}

/** Maps internal pipeline source slugs to a friendly label for students. */
export function formatJobSourceLabel(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const k = raw.trim().toLowerCase();
  if (!k) return null;
  if (k === "company_registry" || k === "company-registry") return "AiLinc";
  const human = humanizeJobFieldLabel(raw);
  return human ?? raw.trim();
}

/** First parseable date wins (ISO or human-readable). */
export function parseFirstValidDateIso(...candidates: unknown[]): string | undefined {
  for (const c of candidates) {
    if (c == null) continue;
    const raw = String(c).trim();
    if (!raw) continue;
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return undefined;
}

/** Safe label for application deadline (raw string if Date fails). */
export function formatApplicationDeadlineLabel(deadline: string | null | undefined): string | null {
  if (deadline == null || typeof deadline !== "string") return null;
  const t = deadline.trim();
  if (!t) return null;
  const d = new Date(t);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  return t;
}
