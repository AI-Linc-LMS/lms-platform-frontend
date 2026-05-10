/**
 * Posts of type "Resource" are encoded with a `[RESOURCE]` marker block
 * (mirroring the poll convention). Format produced by CreateThreadDialog:
 *
 *   [RESOURCE]
 *   url: https://example.com/article
 *
 *   <optional note body>
 *
 * Backend stores it verbatim; renderers parse it to show a link preview card.
 */

export interface ParsedResource {
  url: string;
  /** Body text after the marker (may be empty). */
  note: string;
  /** Bare hostname for label, e.g. "example.com". */
  host: string;
}

const MARKER = "[RESOURCE]";
const URL_LINE_RE = /^\s*url\s*:\s*(\S+)/i;

export function parseResourceFromBody(raw: string): ParsedResource | null {
  if (!raw) return null;
  const idx = raw.indexOf(MARKER);
  if (idx < 0) return null;
  const after = raw.slice(idx + MARKER.length);
  const lines = after.split(/\r?\n/);
  let url = "";
  let consumedLines = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(URL_LINE_RE);
    if (m) {
      url = m[1];
      consumedLines = i + 1;
      break;
    }
    if (lines[i].trim().length > 0) {
      // Stop scanning at the first non-blank, non-url line.
      break;
    }
  }
  if (!url) return null;
  const note = lines.slice(consumedLines).join("\n").trim();
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    host = "";
  }
  return { url, note, host };
}

/** Strip the `[RESOURCE]` block from a raw body so the prose preview is clean. */
export function plainBodyWithoutResource(raw: string, parsed: ParsedResource | null): string {
  if (!raw) return "";
  if (!parsed) return raw;
  const idx = raw.indexOf(MARKER);
  if (idx < 0) return raw;
  return raw.slice(0, idx).trim();
}
