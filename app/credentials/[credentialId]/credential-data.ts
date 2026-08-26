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
