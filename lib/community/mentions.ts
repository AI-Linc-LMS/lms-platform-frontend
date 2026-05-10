/**
 * Lightweight @-mention parsing for community posts and comments.
 *
 * Conservative regex: captures `@` followed by 2-30 chars of letters,
 * digits, dot, dash, underscore. Does not parse mentions inside code blocks
 * or HTML attributes — the parser walks text nodes only. Backend mirror lives
 * in `community_forum/mentions.py` and uses the same character class.
 */

export const MENTION_REGEX = /(^|[\s>(\[])@([a-zA-Z0-9._-]{2,30})/g;
const MENTION_REGEX_GLOBAL = new RegExp(MENTION_REGEX.source, "g");

export interface MentionMatch {
  username: string;
  /** Position in the original string. */
  index: number;
  length: number;
}

/** Pure parser — return all mention matches in a plain text string. */
export function extractMentions(text: string): MentionMatch[] {
  if (!text) return [];
  const out: MentionMatch[] = [];
  const re = new RegExp(MENTION_REGEX.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const lead = m[1] ?? "";
    const username = m[2];
    out.push({
      username,
      index: m.index + lead.length,
      length: 1 + username.length, // include leading '@'
    });
  }
  return out;
}

/** Distinct lowercased usernames mentioned in `text`. */
export function uniqueMentionUsernames(text: string): string[] {
  const seen = new Set<string>();
  for (const m of extractMentions(text)) {
    seen.add(m.username.toLowerCase());
  }
  return Array.from(seen);
}

/**
 * Render mentions inside an HTML string by wrapping `@username` in an
 * anchor tag that points to a profile route (configurable). The function
 * walks text only (skipping content inside `<a>`, `<code>`, `<pre>`).
 */
export function highlightMentionsInHtml(
  html: string,
  options: { profileBase?: string } = {}
): string {
  if (!html) return "";
  const profileBase = options.profileBase || "/community/u/";
  // Quick split that respects existing tags. We only touch text segments
  // outside of <a>, <code>, <pre>, <script>, <style>.
  const skipTagsRe = /<(a|code|pre|script|style)[^>]*>[\s\S]*?<\/\1>/gi;
  const segments: { text: string; protected: boolean }[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = skipTagsRe.exec(html)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ text: html.slice(lastIndex, m.index), protected: false });
    }
    segments.push({ text: m[0], protected: true });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < html.length) {
    segments.push({ text: html.slice(lastIndex), protected: false });
  }

  return segments
    .map((seg) => {
      if (seg.protected) return seg.text;
      return seg.text.replace(MENTION_REGEX_GLOBAL, (full, lead, username) => {
        const safe = String(username).replace(/[<>"']/g, "");
        const href = `${profileBase}${encodeURIComponent(safe)}`;
        return `${lead}<a class="community-mention" href="${href}" data-mention="${safe}">@${safe}</a>`;
      });
    })
    .join("");
}
