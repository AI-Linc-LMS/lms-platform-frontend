import type { ResumeData } from "./types";

/**
 * Bold, italic and underline inside a resume line - and nothing else.
 *
 * Reported as "there is no option for bold/italic/underline in resume descriptions", which makes it
 * impossible to pick out a skill, a technology or a number in a wall of bullet text.
 *
 * A resume line is stored as a string and rendered as text. Letting it carry markup means deciding
 * exactly how much markup, because the same string is also:
 *
 *   - scored by two ATS checkers, which measure its length and match keywords in it;
 *   - measured by the paginator, which decides where a page breaks;
 *   - drawn into a PDF through the DOM.
 *
 * So the allowed set is three inline tags and a line break. No links, no colours, no font sizes: a
 * resume that renders differently in the PDF than it did in the preview is worse than one that
 * cannot be bolded, and every additional tag is another way for those two to disagree.
 *
 * THE CONTRACT: a resume line (summary, a work bullet, an education or project description) is
 * always an HTML FRAGMENT - allowed tags, and text with `&`, `<` and `>` escaped exactly once.
 *
 * It used to be two formats with nothing to tell them apart. The editor stores what the browser
 * serialises, which is HTML, so a typed "health & wellness" is stored as "health &amp; wellness".
 * The renderer decided by looking for a b/i/u tag, found none, and printed the line as text -
 * so every `&`, `<` and `>` typed into a line with no bold in it appeared on the resume as its
 * entity. The profile import had the mirror bug: it copied plain text into these fields
 * unescaped, so "<Button>" typed on the profile vanished as an unknown tag the first time the
 * editor touched it.
 *
 * So text becomes HTML in exactly one place, `textToResumeHtml`, and everything that draws a line
 * reads it as HTML. Decoding entities before rendering instead would have "fixed" the ampersand
 * by turning a learner's typed "<script>" into markup.
 */

/** The only tags a resume line may carry. `strong`/`em` are what a paste and execCommand emit. */
const ALLOWED = ["b", "strong", "i", "em", "u", "br"] as const;
const ALLOWED_SET: ReadonlySet<string> = new Set<string>(ALLOWED);

/** Whole elements whose CONTENT must go too, not just their tags. */
const DROP_WITH_CONTENT = new Set(["script", "style", "iframe", "object", "embed", "noscript"]);

/** True when the value carries any of the formatting this module allows. */
export function hasResumeMarkup(value: string | null | undefined): boolean {
  if (!value) return false;
  return new RegExp(`<\\s*/?\\s*(${ALLOWED.join("|")})\\b`, "i").test(value);
}

/**
 * The inline styling a browser produces instead of a tag, mapped back to the tag.
 *
 * `document.execCommand("bold")` emits `<b>` in Chrome and Safari but `<span style="font-weight:
 * bold">` when styleWithCSS is on, and a bullet pasted from Word or Google Docs is styled spans all
 * the way down. Without this, the sanitiser would strip those spans and silently throw the
 * formatting away at the moment the user applied it.
 */
function tagsImpliedByStyle(el: Element): string[] {
  const style = (el as HTMLElement).style;
  if (!style) return [];
  const out: string[] = [];
  const weight = style.fontWeight;
  if (weight === "bold" || weight === "bolder" || Number(weight) >= 600) out.push("b");
  if (style.fontStyle === "italic" || style.fontStyle === "oblique") out.push("i");
  if ((style.textDecorationLine || style.textDecoration || "").includes("underline")) out.push("u");
  return out;
}

/**
 * A document that never loads or runs anything. Parsing into a detached element of the LIVE page
 * is not inert: `<img src=x onerror=...>` assigned to its innerHTML still fetches the image and
 * fires the handler. Lines reach this sanitiser from saved resumes and from an AI rewrite of a
 * pasted job posting, so it parses where nothing can fire.
 */
let inertDocument: Document | null = null;
function inertDoc(): Document {
  if (!inertDocument) inertDocument = document.implementation.createHTMLDocument("");
  return inertDocument;
}

function sanitizeViaDom(value: string): string {
  const host = inertDoc().createElement("div");
  host.innerHTML = value;

  const render = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return escapeText(node.nodeValue || "");
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const el = node as Element;
    const name = el.tagName.toLowerCase();
    if (DROP_WITH_CONTENT.has(name)) return "";
    if (name === "br") return "<br>";

    const inner = Array.from(el.childNodes).map(render).join("");
    if (!inner) return "";

    // A tag on the list keeps itself; anything else keeps only whatever its style implied, so a
    // styled span becomes <b> and a plain one becomes its own contents.
    const wrappers = ALLOWED_SET.has(name) ? [name] : tagsImpliedByStyle(el);
    return wrappers.reduce((acc, tag) => `<${tag}>${acc}</${tag}>`, inner);
  };

  return Array.from(host.childNodes).map(render).join("");
}

function escapeText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** No DOM (server render, node script): keep the listed tags, drop every other tag and attribute. */
function sanitizeViaRegex(value: string): string {
  return value
    .replace(/<\s*(script|style|iframe|object|embed|noscript)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>/g, (_m, close: string, tag: string) => {
      const name = tag.toLowerCase();
      if (!ALLOWED_SET.has(name)) return "";
      if (name === "br") return "<br>";
      return close ? `</${name}>` : `<${name}>`;
    });
}

/**
 * Keep the allowed tags, drop everything else - including each kept tag's own attributes, so a
 * pasted `<b style="font-size:40px">` cannot resize a line and push the resume onto another page.
 */
export function sanitizeResumeHtml(value: string | null | undefined): string {
  if (!value) return "";
  if (!/[<&]/.test(value)) return value;
  return typeof document === "undefined" ? sanitizeViaRegex(value) : sanitizeViaDom(value);
}

/**
 * Plain text as a resume line: the ONE place text becomes HTML.
 *
 * `&`, `<` and `>` are escaped exactly once, and a newline becomes the line break the editor's
 * Shift+Enter makes, so the preview shows the break the text had instead of running the lines
 * together. Used wherever a value that was never HTML enters a resume: the profile import.
 */
export function textToResumeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return escapeText(text.replace(/\r\n?/g, "\n")).replace(/\n/g, "<br>");
}

/** `&` that does not start an entity reference: "R&D", "health & wellness". */
const BARE_AMPERSAND = /&(?!(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);)/i;

/**
 * A stored line whose format is not known, as canonical HTML.
 *
 * Resumes saved before the contract above hold both formats: lines the editor wrote (HTML) and
 * lines "Use my profile" copied in (plain text). The two are told apart by what the editor can
 * and cannot produce. It never writes a raw `<` that is not one of its own tags, and never a bare
 * `&` - it writes `&lt;` and `&amp;`. So a line with either of those is text and is escaped; a line
 * whose only `&`s start entities is the editor's HTML and is kept. Canonical HTML passes through
 * unchanged, so this is safe to apply to a line more than once.
 *
 * Also the right reading of an AI rewrite, which may come back as either.
 */
export function normalizeResumeLine(value: string | null | undefined): string {
  if (!value) return "";
  if (!/[<&]/.test(value)) return value;
  if (hasResumeMarkup(value)) return sanitizeResumeHtml(value);
  if (value.includes("<") || BARE_AMPERSAND.test(value)) return textToResumeHtml(value);
  return sanitizeResumeHtml(value);
}

/**
 * The line as plain text, for everything that counts words rather than drawing them.
 */
export function resumeTextOf(value: string | null | undefined): string {
  if (!value) return "";
  return sanitizeResumeHtml(value)
    .replace(/<\s*br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The resume with every free-text field reduced to plain text.
 *
 * The two ATS scorers and the quick-fix checker between them make about twenty judgements on the
 * SHAPE of a string: how long it is, whether it opens with an action verb, whether it contains a
 * number, which keywords it matches. Every one of those is wrong on `<b>Led</b> a team of 6`.
 *
 * Patching them one at a time would leave the next length check somebody adds silently broken, so
 * the markup comes off at the boundary instead: a scorer is handed a resume that cannot contain
 * markup, and goes on being written as though formatting had never been added.
 */
export function plainTextResume<T extends ResumeData>(data: T): T {
  if (!data) return data;
  return {
    ...data,
    basicInfo: data.basicInfo
      ? { ...data.basicInfo, summary: resumeTextOf(data.basicInfo.summary) }
      : data.basicInfo,
    workExperience: (data.workExperience || []).map((w) => ({
      ...w,
      description: (w.description || []).map((d) => resumeTextOf(d)),
    })),
    education: (data.education || []).map((e) => ({
      ...e,
      description: resumeTextOf(e.description),
    })),
    projects: (data.projects || []).map((p) => ({
      ...p,
      description: resumeTextOf(p.description),
    })),
  };
}
