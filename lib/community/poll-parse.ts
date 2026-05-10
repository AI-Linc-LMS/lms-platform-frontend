import { stripHtmlTags, unescapeHtml } from "@/lib/utils/html-utils";

export type ParsedPoll = {
  options: string[];
  /** Text after the list of poll options (optional context). */
  preamble: string;
};

/**
 * Coerce HTML-ish thread bodies into plain lines so `[POLL]` and `- option`
 * survive common API wrappers (`<p>`, `<br>`, `<li>`).
 */
function htmlToPlainWithNewlines(html: string): string {
  let s = unescapeHtml(html || "");
  s = s.replace(/<\s*br\s*\/?>/gi, "\n");
  s = s.replace(/<\/\s*p\s*>/gi, "\n");
  s = s.replace(/<\s*p[^>]*>/gi, "");
  s = s.replace(/<\s*li[^>]*>/gi, "\n- ");
  s = s.replace(/<\/\s*li\s*>/gi, "");
  s = s.replace(/<\s*ul[^>]*>/gi, "\n");
  s = s.replace(/<\/\s*ul\s*>/gi, "\n");
  s = s.replace(/<\s*ol[^>]*>/gi, "\n");
  s = s.replace(/<\/\s*ol\s*>/gi, "\n");
  s = s.replace(/<\s*div[^>]*>/gi, "\n");
  s = s.replace(/<\/\s*div\s*>/gi, "\n");
  return stripHtmlTags(s);
}

/**
 * Detect `[POLL]` threads created via CreateThreadDialog (`[POLL]\n- A\n- B`).
 * Supports HTML-wrapped bodies from the API.
 */
export function parsePollFromBody(raw: string): ParsedPoll | null {
  if (!raw?.trim()) return null;
  const plain = htmlToPlainWithNewlines(raw).replace(/\r\n/g, "\n");
  const idx = plain.search(/\[POLL\]/i);
  if (idx === -1) return null;
  const afterMarker = plain.slice(idx).replace(/^\[POLL\]\s*/i, "");
  const lines = afterMarker.split("\n");
  const options: string[] = [];
  let i = 0;
  // Skip blank lines between bullets (HTML <p> blocks often insert empty lines).
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const bullet = line.match(/^[-*•]\s+(.+)$/) || line.match(/^[-*•](.+)$/);
    if (bullet) {
      options.push(bullet[1].trim());
      continue;
    }
    break;
  }
  if (options.length < 2) return null;
  const preamble = lines.slice(i).join("\n").trim();
  return { options, preamble };
}

/** Plain-text preview of body with the poll block removed (for cards / snippets). */
export function plainBodyWithoutPoll(raw: string, parsed: ParsedPoll | null): string {
  if (!parsed) return stripHtmlTags(unescapeHtml(raw || ""));
  const plain = htmlToPlainWithNewlines(raw).replace(/\r\n/g, "\n");
  const idx = plain.search(/\[POLL\]/i);
  if (idx === -1) return plain.trim();
  const before = plain.slice(0, idx).trim();
  if (parsed.preamble) {
    return [before, parsed.preamble].filter(Boolean).join("\n\n").trim();
  }
  return before;
}

/** Byte index of `[POLL]` in the raw body (for splitting HTML), or -1. */
export function pollMarkerIndexInRaw(raw: string): number {
  if (!raw) return -1;
  return raw.search(/\[POLL\]/i);
}
