/**
 * Course-builder articles store optional file refs in an HTML comment at the end of `Article.content`.
 * Legacy / mistaken saves may also embed markdown links like [Attachment: file.pdf](url) in the body;
 * we strip those for display/editing and treat them as attachments instead.
 */

export const COURSE_BUILDER_ATTACHMENT_MARKER = "COURSE_BUILDER_ATTACHMENTS";

export interface ArticleAttachmentRef {
  filename: string;
  url: string;
}

const MARKER_REGEX = new RegExp(
  `<!--${COURSE_BUILDER_ATTACHMENT_MARKER}:(.+?)-->\\s*$`,
  "s"
);

/** Markdown link form sometimes pasted or auto-inserted; keep body clean. */
const MARKDOWN_ATTACHMENT_LINK_RE =
  /\[Attachment:\s*([^\]]+)]\((https?:[^)\s]+)\)/gi;

function parseMarkerAttachments(raw: string): {
  stripped: string;
  list: ArticleAttachmentRef[];
} {
  const match = raw.match(MARKER_REGEX);
  if (!match) return { stripped: raw, list: [] };
  let list: ArticleAttachmentRef[] = [];
  try {
    const parsed = JSON.parse(match[1]) as unknown;
    if (Array.isArray(parsed)) {
      list = parsed.filter(
        (a): a is ArticleAttachmentRef =>
          !!a &&
          typeof (a as ArticleAttachmentRef).filename === "string" &&
          typeof (a as ArticleAttachmentRef).url === "string"
      );
    }
  } catch {
    list = [];
  }
  return { stripped: raw.replace(MARKER_REGEX, "").trimEnd(), list };
}

/**
 * Body text for editor/learner view + attachment list (marker JSON + legacy markdown).
 */
export function extractArticleBodyAndAttachments(raw: string): {
  body: string;
  attachments: ArticleAttachmentRef[];
} {
  const afterMarker = parseMarkerAttachments(raw ?? "");
  const str = afterMarker.stripped;
  const fromMd: ArticleAttachmentRef[] = [];
  let m: RegExpExecArray | null;
  const scan = new RegExp(MARKDOWN_ATTACHMENT_LINK_RE.source, MARKDOWN_ATTACHMENT_LINK_RE.flags);
  while ((m = scan.exec(str)) !== null) {
    fromMd.push({ filename: m[1].trim(), url: m[2].trim() });
  }
  const text = str.replace(MARKDOWN_ATTACHMENT_LINK_RE, "").trim();

  const seen = new Set<string>();
  const attachments: ArticleAttachmentRef[] = [];
  for (const a of [...afterMarker.list, ...fromMd]) {
    if (!a.url || seen.has(a.url)) continue;
    seen.add(a.url);
    attachments.push(a);
  }
  return { body: text, attachments };
}

/** Persist: only the HTML comment holds attachments — never append markdown into the body. */
export function buildPersistedArticleContent(
  body: string,
  attachments: ArticleAttachmentRef[]
): string {
  const base = body.trim();
  if (attachments.length === 0) return base;
  const marker = `<!--${COURSE_BUILDER_ATTACHMENT_MARKER}:${JSON.stringify(attachments)}-->`;
  return base ? `${base}\n\n${marker}` : marker;
}

export function isPdfAttachmentUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return path.endsWith(".pdf");
  } catch {
    return /\.pdf(\?|$)/i.test(url);
  }
}
