import type { CertificateRenderPayload } from "@/lib/certificates/types";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

/**
 * Server-side fetch of a public credential, used by `generateMetadata` and the
 * OG image route. Both run on the server and cannot use the browser axios
 * client, so this is a plain fetch against the unauthenticated public endpoint.
 *
 * `/certificates/api/credentials/<id>/` is the GENERALISED lookup: it resolves
 * points-tier and assessment credentials as well as adaptive-course ones, and
 * it still resolves the older `AILINC-<10 hex>` ids that are already sitting in
 * people's LinkedIn profiles. The page used to call the adaptive-journey
 * endpoint, which is why an assessment certificate had no verify page at all
 * and LinkedIn "Add to Profile" fell back to whatever window.location.href
 * happened to be.
 *
 * Returns null on any failure so callers render "not found" rather than
 * throwing inside metadata generation, which would 500 the whole page.
 */
export async function fetchCredentialServer(
  credentialId: string,
): Promise<CertificateRenderPayload | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(
      `${API_BASE}/certificates/api/credentials/${encodeURIComponent(credentialId)}/`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as CertificateRenderPayload;
    // A revoked credential comes back 200 with status="revoked" and MUST render.
    // Treating it as missing would 404 a link already on someone's profile,
    // which reads as "this site is broken", not as "this was withdrawn".
    return data?.credential_id ? data : null;
  } catch {
    return null;
  }
}

/** What the certificate is FOR, in one line: the course, assessment or tier. */
export function credentialSubject(cred: CertificateRenderPayload): string {
  return cred.subtitle?.trim() || cred.source?.label?.trim() || cred.title?.trim() || "";
}

/**
 * The tenant's brand stops for the share card, resolved SERVER-side.
 *
 * The card is rendered by `next/og`, which draws through Satori rather than a browser. Satori
 * runs no CSS custom properties, so the `var(--x, fallback)` form every other surface uses is
 * inert here -- it resolves to nothing at all, not to the fallback. The colours have to be real
 * literals by the time they reach it, which is why this reads the theme over HTTP and returns
 * hexes.
 *
 * A tenant that has not opted into a custom palette gets back the exact string the card rendered
 * before this existed, so nothing moves for anyone else.
 */
const CREDENTIAL_BRAND_FALLBACK =
  "linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #db2777 100%)";

export async function credentialBrandBackground(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
  if (!API_BASE || !clientId) return CREDENTIAL_BRAND_FALLBACK;
  try {
    const res = await fetch(`${API_BASE}/api/clients/${clientId}/client-info/`, {
      // The OG image is cached by the platforms that unfurl it; an hour is plenty fresh for a
      // colour and keeps a burst of unfurls off the API.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return CREDENTIAL_BRAND_FALLBACK;
    const data = (await res.json()) as { theme_settings?: Record<string, string> };
    const ts = data?.theme_settings ?? {};
    // Same gate the browser applies in normalizeThemeSettings: a tenant that has not opted in
    // keeps the platform palette even if stale values are stored against it.
    if (String(ts._useTenantPalette ?? "").toLowerCase() !== "true") {
      return CREDENTIAL_BRAND_FALLBACK;
    }
    const hex = (v: string | undefined, d: string) =>
      typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : d;
    const from = hex(ts.moduleTileFrom, "#4f46e5");
    const mid = hex(ts.aiViolet, "#7c3aed");
    const to = hex(ts.moduleCtaTo, "#db2777");
    return `linear-gradient(135deg, ${from} 0%, ${mid} 55%, ${to} 100%)`;
  } catch {
    return CREDENTIAL_BRAND_FALLBACK;
  }
}
