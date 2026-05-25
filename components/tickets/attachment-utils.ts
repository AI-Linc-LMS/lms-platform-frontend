const IMAGE_EXTS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
  "svg",
]);

const HEX_HASH_RE = /^[a-f0-9]{16,}$/i;

function safeBasename(url: string): { basename: string; ext: string; stem: string } {
  const pathOnly = (url || "").split("?", 1)[0];
  const raw = pathOnly.split("/").filter(Boolean).pop() || "";
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    /* leave raw */
  }
  const dot = decoded.lastIndexOf(".");
  const ext = dot >= 0 ? decoded.slice(dot + 1).toLowerCase() : "";
  const stem = dot >= 0 ? decoded.slice(0, dot) : decoded;
  return { basename: decoded, ext, stem };
}

export function attachmentLabel(url: string, index: number): string {
  const { basename, ext, stem } = safeBasename(url);
  if (!basename || HEX_HASH_RE.test(stem)) {
    return isImageAttachment(url)
      ? `Screenshot ${index + 1}`
      : `Attachment ${index + 1}`;
  }
  if (basename.length > 42) {
    const tail = ext ? `.${ext}` : "";
    return `${basename.slice(0, 38 - tail.length)}…${tail}`;
  }
  return basename;
}

export function isImageAttachment(url: string): boolean {
  const { ext } = safeBasename(url);
  return IMAGE_EXTS.has(ext);
}
