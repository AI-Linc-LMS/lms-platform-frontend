/**
 * Turn whatever an admin pasted into something an `<iframe>` can actually play.
 *
 * The builder stores the pasted URL verbatim, which is right — it is what they typed and what
 * they will recognise later. But the URL a person copies out of their address bar is almost never
 * embeddable: `youtube.com/watch?v=X` refuses to render in a frame, and so does `vimeo.com/N`.
 * Both have an embed form, and the id is sitting in the URL either way.
 *
 * Anything unrecognised is passed through untouched. A direct .mp4 or an already-embeddable URL
 * works as-is, and guessing at a provider we do not know would break the one case that was fine.
 */

/** `?v=` or the /embed//shorts//live/ path forms, plus the youtu.be short domain. */
const YOUTUBE_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"];

function youtubeId(u: URL): string | null {
  if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
  if (!YOUTUBE_HOSTS.includes(u.hostname)) return null;
  const v = u.searchParams.get("v");
  if (v) return v;
  const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
  return m ? m[1] : null;
}

function vimeoId(u: URL): string | null {
  if (u.hostname === "player.vimeo.com") return null; // already embeddable
  if (!["vimeo.com", "www.vimeo.com"].includes(u.hostname)) return null;
  // vimeo.com/123456789 and vimeo.com/123456789/abcdef (unlisted hash)
  const m = u.pathname.match(/^\/(\d+)(?:\/([0-9a-zA-Z]+))?/);
  if (!m) return null;
  return m[2] ? `${m[1]}?h=${m[2]}` : m[1];
}

/**
 * @param playUrl the server's `play_url` — a Vimeo embed URL for catalog videos, or the pasted
 *                link for external ones.
 * @param source  `"catalog" | "external" | "none"`; catalog URLs are already embeddable.
 */
export function toEmbedUrl(playUrl: string, source?: string): string {
  const raw = (playUrl || "").trim();
  if (!raw) return "";
  // The catalog builds its own embed URL, and the Vimeo player options below belong to it.
  if (source === "catalog") return withVimeoOptions(raw);

  let u: URL;
  try {
    // Someone pasting an address bar often drops the scheme.
    u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return raw;
  }

  const yt = youtubeId(u);
  if (yt) {
    const start = u.searchParams.get("t") || u.searchParams.get("start");
    const seconds = start ? String(parseInt(start, 10) || 0) : "";
    // `rel=0` keeps the end-screen suggestions inside the same channel — a wall of unrelated
    // recommendations on top of a lesson is not what anyone attached this for.
    return `https://www.youtube.com/embed/${yt}?rel=0&modestbranding=1${seconds ? `&start=${seconds}` : ""}`;
  }

  const vm = vimeoId(u);
  if (vm) return withVimeoOptions(`https://player.vimeo.com/video/${vm}`);

  return u.toString();
}

function withVimeoOptions(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}api=1&title=0&byline=0&portrait=0`;
}

/** Whether check-ins can exist for this video at all — they are built from a transcript. */
export function supportsCheckIns(source?: string): boolean {
  return source === "catalog";
}
