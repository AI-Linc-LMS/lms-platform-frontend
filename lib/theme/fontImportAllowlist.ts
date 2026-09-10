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


/**
 * Families this app already self-hosts, so a tenant's `fontImportUrl` for them is pure cost.
 *
 * Satoshi was moved in-repo (public/assets/fonts/satoshi, @font-face in globals.css, preloaded
 * from the root layout) but every tenant kept the Fontshare URL in its stored theme. All 24
 * tenants that set fontImportUrl point at Satoshi, so each one opened two extra third-party
 * origins -- api.fontshare.com and cdn.fontshare.com -- for 4 requests at ~200 ms apiece, to
 * fetch a font the browser had already downloaded locally.
 */
const SELF_HOSTED_FAMILIES = ["satoshi"];

/** True when `href` asks a webfont host only for families we already ship ourselves. */
export function isRedundantFontImport(href: string): boolean {
  const v = (href || "").toLowerCase();
  if (!v) return false;
  if (!/fontshare|fonts\.googleapis/.test(v)) return false;
  const families = [...v.matchAll(/f\[\]=([a-z0-9-]+)|family=([a-z0-9+ -]+)/g)]
    .map((m) => (m[1] || m[2] || "").replace(/\+/g, " ").trim())
    .filter(Boolean);
  if (!families.length) return false;
  // Redundant only when EVERY requested family is one we already have.
  return families.every((f) => SELF_HOSTED_FAMILIES.includes(f.split(/[@,]/)[0].trim()));
}
