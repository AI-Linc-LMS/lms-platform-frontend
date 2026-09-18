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

function sanitizeViaDom(value: string): string {
  const host = document.createElement("div");
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
