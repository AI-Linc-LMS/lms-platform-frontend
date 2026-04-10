const ALLOWED_FONT_IMPORT_HOSTS = new Set([
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "api.fontshare.com",
]);

export function isAllowedFontImportUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.protocol === "https:" && ALLOWED_FONT_IMPORT_HOSTS.has(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}
