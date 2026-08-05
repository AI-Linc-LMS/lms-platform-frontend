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

  // SharePoint / OneDrive for Business. A share link (`/:v:/g/personal/…`) is a web VIEWER page,
  // and it sends frame-ancestors headers, so a browser refuses to put it in an iframe at all —
  // "refused to connect", with nothing the page can catch. `action=embedview` asks for the
  // embeddable player instead. It does not grant access: see `embedCaveat`.
  if (u.hostname.endsWith(".sharepoint.com") || u.hostname === "onedrive.live.com") {
    if (!u.searchParams.get("action")) u.searchParams.set("action", "embedview");
    return u.toString();
  }

  // Google Drive: /file/d/<id>/view is the viewer page; /preview is the embeddable one.
  if (u.hostname === "drive.google.com") {
    const m = u.pathname.match(/^\/file\/d\/([^/]+)/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  }

  // Dropbox hands out a preview page by default; raw=1 serves the file itself.
  if (u.hostname.endsWith("dropbox.com")) {
    u.searchParams.delete("dl");
    u.searchParams.set("raw", "1");
    return u.toString();
  }

  // Loom share → embed.
  if (u.hostname.endsWith("loom.com")) {
    const m = u.pathname.match(/^\/share\/([^/?#]+)/);
    if (m) return `https://www.loom.com/embed/${m[1]}`;
  }

  return u.toString();
}

/**
 * What is likely to go wrong with this link once a STUDENT opens it, in one sentence, or null.
 *
 * Rewriting a URL into its embeddable form is only half the problem. The other half is access,
 * and no amount of URL surgery fixes it: a SharePoint file shared with "People in your
 * organisation" shows a Microsoft sign-in wall to every learner, and the admin who pasted it sees
 * it play perfectly because they are already signed in. That is the worst kind of bug to ship —
 * it works for the person who set it up.
 *
 * So the builder says it at paste time, while changing the link still costs nothing.
 */
export function embedCaveat(rawUrl: string): string | null {
  const raw = (rawUrl || "").trim();
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return "That does not look like a web address.";
  }
  const h = u.hostname;

  if (h.endsWith(".sharepoint.com") || h === "onedrive.live.com" || h === "1drv.ms") {
    return (
      "OneDrive and SharePoint links only play for people who can already open the file. " +
      "Set sharing to “Anyone with the link” or students will hit a Microsoft sign-in page — " +
      "it will look fine to you, because you are signed in."
    );
  }
  if (h === "drive.google.com" || h === "docs.google.com") {
    return (
      "Google Drive links only play if the file is shared with “Anyone with the link”. " +
      "Otherwise students see a request-access screen."
    );
  }
  if (h.endsWith("zoom.us")) {
    return (
      "Zoom recording links usually need a passcode and refuse to be embedded. " +
      "Download the recording and upload it to the video catalog instead."
    );
  }
  if (h.endsWith("dropbox.com")) {
    return "Dropbox links play only while the file stays shared publicly.";
  }
  return null;
}

function withVimeoOptions(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}api=1&title=0&byline=0&portrait=0`;
}

/** Whether check-ins can exist for this video at all — they are built from a transcript. */
export function supportsCheckIns(source?: string): boolean {
  return source === "catalog";
}
